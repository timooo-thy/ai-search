"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { createAuthClient } from "better-auth/react";
const { useSession } = createAuthClient();

export default function SignInPage() {
  const { data: session, isPending, error: sessionError } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div>Loading...</div>
      </main>
    );
  }

  if (!isPending && session) {
    redirect("/dashboard");
  }

  if (sessionError) {
    redirect("/404");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => {},
        onSuccess: () => {
          redirect("/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Sign in failed");
        },
      }
    );
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 p-6 rounded-md shadow">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="Your password"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <p className="text-sm text-slate-600 mt-4">
          New here?{" "}
          <a href="/auth/sign-up" className="text-blue-600">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
