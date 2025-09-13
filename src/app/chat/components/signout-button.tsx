"use client";

import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function SignOutButton() {
  return (
    <div
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              redirect("/auth/login");
            },
          },
        });
      }}
      className="w-full"
    >
      Sign out
    </div>
  );
}
