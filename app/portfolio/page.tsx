"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Trade, Market, Profile } from "@/lib/types";
import { formatCash } from "@/lib/format";

type TradeWithMarket = Trade & { markets: Market | null };

export default function PortfolioPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [trades, setTrades] = useState<TradeWithMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      setError(null);
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Please sign in to view your portfolio.");
        setLoading(false);
        return;
      }

      const [{ data: balanceData, error: balanceError }, tradesResult, profileResult] =
        await Promise.all([
          supabase.from("balances").select("play_cash_balance").single(),
          supabase
            .from("trades")
            .select("*, markets(*)")
            .order("created_at", { ascending: false }),
          supabase.from("users").select("*").single()
        ]);

      if (balanceError) {
        setError(balanceError.message);
      } else {
        setBalance(balanceData?.play_cash_balance ?? null);
      }

      if (tradesResult.error) {
        setError(tradesResult.error.message);
      } else {
        setTrades((tradesResult.data ?? []) as TradeWithMarket[]);
      }

      if (profileResult.error) {
        setError(profileResult.error.message);
      } else {
        setProfile(profileResult.data ?? null);
        setUsername(profileResult.data?.username ?? "");
      }

      setLoading(false);
    };

    fetchPortfolio();
  }, []);

  const holdings = useMemo(() => {
    const map = new Map<
      string,
      { title: string; yesShares: number; noShares: number }
    >();

    trades.forEach((trade) => {
      const market = trade.markets;
      if (!market) {
        return;
      }
      const current = map.get(trade.market_id) ?? {
        title: market.title,
        yesShares: 0,
        noShares: 0
      };
      if (trade.side === "yes") {
        current.yesShares += trade.shares;
      } else {
        current.noShares += trade.shares;
      }
      map.set(trade.market_id, current);
    });

    return Array.from(map.values());
  }, [trades]);

  const updateUsername = async () => {
    if (!profile) {
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ username })
      .eq("id", profile.id);
    if (error) {
      setError(error.message);
    } else {
      setProfile({ ...profile, username });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="rounded border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
        Loading portfolio...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 p-6 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold">Portfolio</h1>
        <p className="text-slate-300">
          Track your play cash balance and market holdings.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold">Cash balance</h2>
          <p className="mt-3 text-3xl font-semibold text-emerald-200">
            {balance === null ? "—" : formatCash(balance)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="mt-2 text-sm text-slate-400">Email</p>
          <p className="text-sm text-slate-200">{profile?.email}</p>
          <label className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
            Username
            <input
              className="rounded bg-white/90 px-3 py-2"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Pick a username"
            />
          </label>
          <button
            className="mt-3 rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            onClick={updateUsername}
            disabled={saving}
            type="button"
          >
            {saving ? "Saving..." : "Save username"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Holdings</h2>
          <Link className="text-sm text-emerald-200" href="/">
            Browse markets
          </Link>
        </div>
        {holdings.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No positions yet. Buy shares to see them here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-2">Market</th>
                  <th className="py-2">Yes shares</th>
                  <th className="py-2">No shares</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.title} className="border-t border-slate-800">
                    <td className="py-3 text-slate-200">{holding.title}</td>
                    <td className="py-3 text-emerald-200">
                      {holding.yesShares}
                    </td>
                    <td className="py-3 text-rose-200">
                      {holding.noShares}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
