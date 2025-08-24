"use client";

import { authClient } from "@/lib/auth-client";
import { createAuthClient } from "better-auth/react";
import { redirect } from "next/navigation";
const { useSession } = createAuthClient();

export default function DashboardPage() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div>Loading...</div>
      </main>
    );
  }

  if (!isPending && !session) {
    redirect("/auth/sign-in");
  }

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (error) {
    redirect("/404");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-md shadow">
        <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>
        <p>Hello {session?.user.name}. Welcome to your dashboard!</p>
      </div>
      <div>
        <button
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  redirect("/auth/sign-in");
                },
              },
            });
          }}
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
