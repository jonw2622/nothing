"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Market } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const statusOptions: Array<Market["status"] | "all"> = [
  "all",
  "open",
  "closed",
  "resolved"
];

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Market["status"] | "all">(
    "open"
  );
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setMarkets([]);
      } else {
        setMarkets(data ?? []);
      }
      setLoading(false);
    };

    fetchMarkets();
  }, []);

  const categories = useMemo(() => {
    const values = new Set(
      markets.map((market) => market.category).filter(Boolean) as string[]
    );
    return ["all", ...Array.from(values)];
  }, [markets]);

  const filteredMarkets = markets.filter((market) => {
    const statusMatch =
      statusFilter === "all" || market.status === statusFilter;
    const categoryMatch =
      categoryFilter === "all" || market.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">Markets</h1>
        <p className="text-slate-300">
          Trade play-money predictions. Buy YES or NO shares before markets close.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <label className="text-sm text-slate-300">
          Status
          <select
            className="ml-2 rounded bg-white/90 px-2 py-1"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as Market["status"] | "all")
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Category
          <select
            className="ml-2 rounded bg-white/90 px-2 py-1"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading && (
        <div className="rounded border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          Loading markets...
        </div>
      )}

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && filteredMarkets.length === 0 && (
        <div className="rounded border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          No markets found for those filters.
        </div>
      )}

      <section className="grid gap-4">
        {filteredMarkets.map((market) => (
          <Link
            key={market.id}
            href={`/market/${market.id}`}
            className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 transition hover:border-emerald-500/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {market.title}
                </h2>
                <p className="text-sm text-slate-400">
                  {market.category ?? "General"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
                  {market.status}
                </span>
                {market.closes_at && (
                  <span className="text-slate-400">
                    Closes {new Date(market.closes_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-3 text-slate-300">
              {market.description ?? "No description yet."}
            </p>
            <div className="mt-4 flex gap-4 text-sm text-slate-200">
              <span>YES {formatPrice(market.yes_price)}</span>
              <span>NO {formatPrice(market.no_price)}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
