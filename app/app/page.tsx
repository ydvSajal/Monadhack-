"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { MARKET_ADDRESS } from "@/lib/contract";
import { explorerAddress } from "@/lib/chain";
import { WalletButton } from "@/components/wallet";
import { CreateTaskForm } from "@/components/app/create-task-form";
import { LabelFlow } from "@/components/app/label-flow";
import { TaskExplorer } from "@/components/app/task-explorer";
import { EarningsPanel } from "@/components/app/earnings-panel";

const TABS = ["Label", "Browse & results", "Create task", "Earnings"] as const;
type Tab = (typeof TABS)[number];

export default function AppPage() {
  const [tab, setTab] = useState<Tab>("Label");
  const [bump, setBump] = useState(0);
  const { isConnected } = useAccount();
  const deployed = MARKET_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-24">
      <nav className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Verdikt
        </Link>
        <WalletButton />
      </nav>

      {!deployed && (
        <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          Contract address not set. Deploy the contract and set NEXT_PUBLIC_MARKET_ADDRESS.
        </p>
      )}

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm transition ${
              tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
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
        {tab === "Create task" && (
          <CreateTaskForm
            onCreated={() => {
              setBump((b) => b + 1);
              setTab("Browse & results");
            }}
          />
        )}
        {tab === "Label" && <LabelFlow />}
        {tab === "Browse & results" && <TaskExplorer />}
        {tab === "Earnings" && <EarningsPanel />}
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
