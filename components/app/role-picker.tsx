"use client";

import type { Role } from "@/lib/role";

const CARDS: { role: Role; title: string; blurb: string; points: string[] }[] = [
  {
    role: "employer",
    title: "I post tasks",
    blurb: "Escrow MON, upload your thumbnails or drop in data, let the crowd score it.",
    points: ["Fund a task in one transaction", "Watch the tally settle on-chain", "Dispute bad voters before payout"],
  },
  {
    role: "labeler",
    title: "I label & earn",
    blurb: "Connect a wallet, judge one item at a time, claim a fixed reward per vote.",
    points: ["No sign-up, just a wallet", "One tap per item", "Paid automatically after the window"],
  },
];

export function RolePicker({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-5 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">How will you use Verdikt?</h1>
        <p className="mt-2 text-sm text-muted">Pick one to start. You can switch later from the top bar.</p>
      </div>
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <button
            key={c.role}
            onClick={() => onPick(c.role)}
            className="glass group flex flex-col gap-3 rounded-[var(--radius-lg)] p-6 text-left transition hover:-translate-y-0.5 hover:border-border-strong"
          >
            <span className="text-lg font-semibold">{c.title}</span>
            <span className="text-sm text-muted">{c.blurb}</span>
            <ul className="mt-1 flex flex-col gap-1.5 text-sm">
              {c.points.map((p) => (
                <li key={p} className="flex gap-2 text-foreground/80">
                  <span className="text-accent">—</span>
                  {p}
                </li>
              ))}
            </ul>
            <span className="mt-2 text-sm font-medium text-accent group-hover:text-accent-soft">
              Continue →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
