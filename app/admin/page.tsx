"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Market } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { isAdminEmail } from "@/lib/auth";

const initialForm = {
  title: "",
  description: "",
  category: "",
  closes_at: "",
  yes_price: 55,
  no_price: 45
};

export default function AdminPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const isAdmin = useMemo(() => isAdminEmail(adminEmail), [adminEmail]);

  const fetchMarkets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setMarkets(data ?? []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      setAdminEmail(session?.user.email ?? null);
    };
    load();
    fetchMarkets();
  }, []);

  const updateMarketStatus = async (marketId: string, status: Market["status"]) => {
    const { error } = await supabase
      .from("markets")
      .update({ status })
      .eq("id", marketId);
    if (error) {
      setError(error.message);
    } else {
      fetchMarkets();
    }
  };

  const resolveMarket = async (marketId: string, outcome: "resolved_yes" | "resolved_no") => {
    const { error } = await supabase.rpc("resolve_market", {
      p_market_id: marketId,
      p_outcome: outcome
    });
    if (error) {
      setError(error.message);
    } else {
      fetchMarkets();
    }
  };

  const createMarket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
      yes_price: Number(form.yes_price),
      no_price: Number(form.no_price),
      status: "open"
    };
    const { error } = await supabase.from("markets").insert(payload);
    if (error) {
      setError(error.message);
    } else {
      setForm(initialForm);
      fetchMarkets();
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded border border-slate-800 bg-slate-900/40 p-6 text-slate-200">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-slate-400">
          Add your email to NEXT_PUBLIC_ADMIN_EMAILS to access admin tools.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="text-slate-300">
          Create and manage markets, close trading, and resolve outcomes.
        </p>
      </section>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Create market</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={createMarket}>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Title
            <input
              className="rounded bg-white/90 px-3 py-2"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Category
            <input
              className="rounded bg-white/90 px-3 py-2"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300 md:col-span-2">
            Description
            <textarea
              className="rounded bg-white/90 px-3 py-2"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Closes at
            <input
              className="rounded bg-white/90 px-3 py-2"
              type="datetime-local"
              value={form.closes_at}
              onChange={(event) =>
                setForm({ ...form, closes_at: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            YES price (cents)
            <input
              className="rounded bg-white/90 px-3 py-2"
              type="number"
              min={1}
              max={99}
              value={form.yes_price}
              onChange={(event) =>
                setForm({ ...form, yes_price: Number(event.target.value) })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            NO price (cents)
            <input
              className="rounded bg-white/90 px-3 py-2"
              type="number"
              min={1}
              max={99}
              value={form.no_price}
              onChange={(event) =>
                setForm({ ...form, no_price: Number(event.target.value) })
              }
              required
            />
          </label>
          <div className="flex items-end">
            <button
              className="rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-950"
              type="submit"
            >
              Create market
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Markets</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-300">Loading markets...</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {markets.map((market) => (
              <div
                key={market.id}
                className="rounded border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {market.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {market.category ?? "General"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                    <span className="rounded-full bg-slate-800 px-2 py-1">
                      {market.status}
                    </span>
                    <span>YES {formatPrice(market.yes_price)}</span>
                    <span>NO {formatPrice(market.no_price)}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <button
                    className="rounded bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700"
                    onClick={() => updateMarketStatus(market.id, "open")}
                    type="button"
                  >
                    Open
                  </button>
                  <button
                    className="rounded bg-amber-500/20 px-3 py-1 text-amber-200 hover:bg-amber-500/30"
                    onClick={() => updateMarketStatus(market.id, "closed")}
                    type="button"
                  >
                    Close
                  </button>
                  <button
                    className="rounded bg-emerald-500/20 px-3 py-1 text-emerald-200 hover:bg-emerald-500/30"
                    onClick={() => resolveMarket(market.id, "resolved_yes")}
                    type="button"
                  >
                    Resolve YES
                  </button>
                  <button
                    className="rounded bg-rose-500/20 px-3 py-1 text-rose-200 hover:bg-rose-500/30"
                    onClick={() => resolveMarket(market.id, "resolved_no")}
                    type="button"
                  >
                    Resolve NO
                  </button>
                </div>
                {market.outcome && (
                  <p className="mt-2 text-xs text-emerald-200">
                    Outcome: {market.outcome.replace("resolved_", "Resolved ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
