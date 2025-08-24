"use client";

import React, { useState } from "react";
import { redirect } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => {},
        onSuccess: () => {
          redirect("/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error.message);
        },
      }
    );

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 p-6 rounded-md shadow">
        <h1 className="text-2xl font-semibold mb-4">Sign up</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="Your name"
            />
          </div>

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
              minLength={8}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="At least 8 characters"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        <p className="text-sm text-slate-600 mt-4">
          Already have an account?{" "}
          <a href="/auth/sign-in" className="text-blue-600">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
