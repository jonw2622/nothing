create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  username text,
  created_at timestamptz not null default now()
);

create table if not exists public.balances (
  user_id uuid primary key references public.users (id) on delete cascade,
  play_cash_balance integer not null default 100000
);

create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  closes_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed', 'resolved')),
  outcome text check (outcome in ('resolved_yes', 'resolved_no')),
  yes_price integer not null check (yes_price between 1 and 99),
  no_price integer not null check (no_price between 1 and 99),
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  side text not null check (side in ('yes', 'no')),
  shares integer not null check (shares > 0),
  price_per_share integer not null check (price_per_share between 1 and 99),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, created_at)
  values (new.id, new.email, now());

  insert into public.balances (user_id, play_cash_balance)
  values (new.id, 100000);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.place_trade(
  p_market_id uuid,
  p_side text,
  p_shares integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  market_record public.markets;
  balance_record public.balances;
  trade_price integer;
  total_cost integer;
begin
  if p_shares <= 0 then
    raise exception 'Shares must be greater than zero.';
  end if;

  select * into market_record from public.markets where id = p_market_id;
  if not found then
    raise exception 'Market not found.';
  end if;

  if market_record.status <> 'open' then
    raise exception 'Market is not open.';
  end if;

  trade_price := case when p_side = 'yes' then market_record.yes_price else market_record.no_price end;
  if trade_price is null then
    raise exception 'Invalid trade side.';
  end if;

  total_cost := trade_price * p_shares;

  select * into balance_record from public.balances where user_id = auth.uid();
  if not found then
    raise exception 'Balance not found.';
  end if;

  if balance_record.play_cash_balance < total_cost then
    raise exception 'Insufficient balance.';
  end if;

  insert into public.trades (user_id, market_id, side, shares, price_per_share)
  values (auth.uid(), p_market_id, p_side, p_shares, trade_price);

  update public.balances
  set play_cash_balance = play_cash_balance - total_cost
  where user_id = auth.uid();
end;
$$;

create or replace function public.resolve_market(
  p_market_id uuid,
  p_outcome text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  winning_side text;
  market_status text;
begin
  select status into market_status from public.markets where id = p_market_id;
  if not found then
    raise exception 'Market not found.';
  end if;

  if market_status = 'resolved' then
    raise exception 'Market already resolved.';
  end if;

  if p_outcome not in ('resolved_yes', 'resolved_no') then
    raise exception 'Invalid outcome.';
  end if;

  winning_side := case when p_outcome = 'resolved_yes' then 'yes' else 'no' end;

  update public.markets
  set status = 'resolved',
      outcome = p_outcome
  where id = p_market_id;

  with winners as (
    select user_id, sum(shares) as total_shares
    from public.trades
    where market_id = p_market_id
      and side = winning_side
    group by user_id
  )
  update public.balances b
  set play_cash_balance = play_cash_balance + (winners.total_shares * 100)
  from winners
  where b.user_id = winners.user_id;
end;
$$;

alter table public.users enable row level security;
alter table public.balances enable row level security;
alter table public.markets enable row level security;
alter table public.trades enable row level security;

create policy "Users can view own profile"
  on public.users
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users
  for update
  using (auth.uid() = id);

create policy "Users can view own balance"
  on public.balances
  for select
  using (auth.uid() = user_id);

create policy "Users can update own balance"
  on public.balances
  for update
  using (auth.uid() = user_id);

create policy "Anyone can view markets"
  on public.markets
  for select
  using (true);

create policy "Authenticated can insert markets"
  on public.markets
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update markets"
  on public.markets
  for update
  to authenticated
  using (true);

create policy "Authenticated can delete markets"
  on public.markets
  for delete
  to authenticated
  using (true);

create policy "Users can view own trades"
  on public.trades
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own trades"
  on public.trades
  for insert
  with check (auth.uid() = user_id);

revoke all on public.users from anon;
revoke all on public.balances from anon;
revoke all on public.trades from anon;

grant select on public.markets to anon;
