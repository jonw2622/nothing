export type MarketStatus = "open" | "closed" | "resolved";
export type MarketOutcome = "resolved_yes" | "resolved_no" | null;

export type Market = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  closes_at: string | null;
  status: MarketStatus;
  outcome: MarketOutcome;
  yes_price: number;
  no_price: number;
  created_at: string;
};

export type Trade = {
  id: string;
  user_id: string;
  market_id: string;
  side: "yes" | "no";
  shares: number;
  price_per_share: number;
  created_at: string;
};

export type Balance = {
  user_id: string;
  play_cash_balance: number;
};

export type Profile = {
  id: string;
  email: string;
  username: string | null;
  created_at: string;
};
