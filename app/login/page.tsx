"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
      }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the magic link to sign in.");
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-slate-300">
          Use your email to sign in and start trading with play money.
        </p>
      </div>

      <form
        onSubmit={handleLogin}
        className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-6"
      >
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Email
          <input
            className="rounded bg-white/90 px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <button
          className="w-full rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {message && (
        <div className="rounded border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-200">
          {message}
        </div>
      )}
    </div>
  );
}
