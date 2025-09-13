"use client";

import { redirect } from "next/navigation";

export default function DashboardButton() {
  return (
    <div
      onClick={async () => {
        redirect("/dashboard");
      }}
      className="w-full"
    >
      Account
    </div>
  );
}
