"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Market } from "@/lib/types";
import { formatCash, formatPrice } from "@/lib/format";

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const marketId = params.id;
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState(10);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [balance, setBalance] = useState<number | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("id", marketId)
        .single();

      if (error) {
        setError(error.message);
        setMarket(null);
      } else {
        setMarket(data);
      }
      setLoading(false);
    };

    const fetchBalance = async () => {
      const { data } = await supabase
        .from("balances")
        .select("play_cash_balance")
        .single();
      setBalance(data?.play_cash_balance ?? null);
    };

    if (marketId) {
      fetchMarket();
      fetchBalance();
    }
  }, [marketId]);

  const selectedPrice = useMemo(() => {
    if (!market) {
      return 0;
    }
    return side === "yes" ? market.yes_price : market.no_price;
  }, [market, side]);

  const totalCost = selectedPrice * shares;

  const placeTrade = async () => {
    setTradeMessage(null);
    setTradeLoading(true);
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      setTradeMessage("Please sign in to trade.");
      setTradeLoading(false);
      return;
    }

    const { error } = await supabase.rpc("place_trade", {
      p_market_id: marketId,
      p_side: side,
      p_shares: shares
    });

    if (error) {
      setTradeMessage(error.message);
    } else {
      setTradeMessage("Trade placed.");
      const { data } = await supabase
        .from("balances")
        .select("play_cash_balance")
        .single();
      setBalance(data?.play_cash_balance ?? null);
    }

    setTradeLoading(false);
  };

  if (loading) {
    return (
      <div className="rounded border border-slate-800 bg-slate-900/40 p-6">
        Loading market...
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 p-6 text-red-200">
        {error ?? "Market not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-400">
        ← Back to markets
      </Link>
      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">{market.title}</h1>
            <p className="text-sm text-slate-400">
              {market.category ?? "General"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
              {market.status}
            </span>
            {market.outcome && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-200">
                {market.outcome.replace("resolved_", "Resolved ")}
              </span>
            )}
          </div>
        </div>
        <p className="text-slate-200">
          {market.description ?? "No description available."}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-200">
          <span>YES {formatPrice(market.yes_price)}</span>
          <span>NO {formatPrice(market.no_price)}</span>
          {market.closes_at && (
            <span>Closes {new Date(market.closes_at).toLocaleString()}</span>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold">Place a trade</h2>
        <p className="mt-2 text-sm text-slate-400">
          Fixed price per share. Trades are deducted from your play cash balance.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Side
            <select
              className="rounded bg-white/90 px-3 py-2"
              value={side}
              onChange={(event) => setSide(event.target.value as "yes" | "no")}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Shares
            <input
              className="rounded bg-white/90 px-3 py-2"
              type="number"
              min={1}
              value={shares}
              onChange={(event) => setShares(Number(event.target.value))}
            />
          </label>
          <div className="flex flex-col justify-end gap-2 rounded bg-slate-950 p-4 text-sm">
            <span className="text-slate-400">Total cost</span>
            <span className="text-lg font-semibold text-white">
              {formatCash(totalCost)}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span>
            Balance: {balance === null ? "—" : formatCash(balance)}
          </span>
          <button
            className="rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
            onClick={placeTrade}
            disabled={tradeLoading || market.status !== "open"}
            type="button"
          >
            {tradeLoading ? "Placing trade..." : "Buy shares"}
          </button>
          {market.status !== "open" && (
            <span className="text-xs text-amber-300">
              Market is closed for trading.
            </span>
          )}
        </div>
        {tradeMessage && (
          <div className="mt-3 rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-200">
            {tradeMessage}
          </div>
        )}
      </section>
    </div>
  );
}
