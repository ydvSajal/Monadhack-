"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { MARKET_ADDRESS } from "@/lib/contract";
import { explorerAddress } from "@/lib/chain";
import { useRole, type Role } from "@/lib/role";
import { WalletButton } from "@/components/wallet";
import { RolePicker } from "@/components/app/role-picker";
import { CreateTaskForm } from "@/components/app/create-task-form";
import { LabelFlow } from "@/components/app/label-flow";
import { TaskExplorer } from "@/components/app/task-explorer";
import { EarningsPanel } from "@/components/app/earnings-panel";

const TABS: Record<Role, string[]> = {
  labeler: ["Label", "Browse", "Earnings"],
  employer: ["My tasks", "Create task", "Earnings"],
};

export default function AppPage() {
  const { role, setRole, ready } = useRole();
  const [tab, setTab] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const { isConnected } = useAccount();
  const deployed = MARKET_ADDRESS !== "0x0000000000000000000000000000000000000000";

  if (!ready) return <main className="p-10 text-sm text-muted">Loading…</main>;
  if (!role) return <RolePicker onPick={(r) => setRole(r)} />;

  const tabs = TABS[role];
  const active = tab && tabs.includes(tab) ? tab : tabs[0];

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-24">
      <nav className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Verdikt
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRole(role === "employer" ? "labeler" : "employer");
              setTab(null);
            }}
            className="rounded-full border border-border-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
          >
            {role === "employer" ? "Employer" : "Labeler"} · switch
          </button>
          <WalletButton />
        </div>
      </nav>

      {!deployed && (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Contract address not set. Deploy the contract and set NEXT_PUBLIC_MARKET_ADDRESS.
        </p>
      )}

      <div className="glass mb-6 flex gap-1 rounded-full p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-sm transition ${
              active === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!isConnected && (
        <p className="mb-4 text-sm text-muted">Connect a wallet on Monad testnet to interact.</p>
      )}

      <div key={bump}>
        {active === "Create task" && (
          <CreateTaskForm
            onCreated={() => {
              setBump((b) => b + 1);
              setTab("My tasks");
            }}
          />
        )}
        {active === "Label" && <LabelFlow />}
        {active === "Browse" && <TaskExplorer />}
        {active === "My tasks" && <TaskExplorer mine readOnly />}
        {active === "Earnings" && <EarningsPanel />}
      </div>

      {deployed && (
        <a
          className="tabular mt-10 block text-xs text-muted hover:text-foreground"
          href={explorerAddress(MARKET_ADDRESS)}
          target="_blank"
          rel="noreferrer"
        >
          Contract: {MARKET_ADDRESS}
        </a>
      )}
    </main>
  );
}
