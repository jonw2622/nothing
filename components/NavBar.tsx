"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/auth";

export default function NavBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-white">
            Ganashi
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/">Markets</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          {loading ? (
            <span>Loading...</span>
          ) : email ? (
            <>
              <span className="text-slate-400">{email}</span>
              {isAdminEmail(email) && (
                <span className="rounded-full bg-emerald-600/20 px-2 py-1 text-xs text-emerald-200">
                  Admin
                </span>
              )}
              <button
                className="rounded bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700"
                onClick={handleSignOut}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              className="rounded bg-emerald-500 px-3 py-1 font-medium text-slate-950"
              href="/login"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
