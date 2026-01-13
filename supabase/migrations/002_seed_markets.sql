insert into public.markets (title, description, category, closes_at, status, yes_price, no_price)
values
  (
    'Curaçao national football team wins its next home match',
    'Resolution: YES if the Curaçao men''s national football team wins its next officially scheduled home match before market close.',
    'Sports',
    now() + interval '30 days',
    'open',
    58,
    42
  ),
  (
    'SV Jong Holland finishes above CRKSV Jong Colombia this season',
    'Resolution: YES if SV Jong Holland finishes higher than CRKSV Jong Colombia in the final league standings this season.',
    'Sports',
    now() + interval '120 days',
    'open',
    52,
    48
  ),
  (
    'Curaçao baseball team wins its next official series',
    'Resolution: YES if the Curaçao national baseball team wins its next officially scheduled series before market close.',
    'Sports',
    now() + interval '45 days',
    'open',
    55,
    45
  ),
  (
    'Power outage occurs on Curaçao this month',
    'Resolution: YES if there is at least one reported island-wide or neighborhood-level power outage on Curaçao before the end of the current month.',
    'Infrastructure',
    date_trunc('month', now()) + interval '1 month - 1 day',
    'open',
    60,
    40
  ),
  (
    'Refinery license to reopen is granted by June',
    'Resolution: YES if an official license to reopen the Isla refinery is granted on or before June 30 of the current year.',
    'Energy',
    (date_trunc('year', now()) + interval '6 months' - interval '1 day'),
    'open',
    47,
    53
  );
