"use client";

import { useEffect, useState } from "react";

// Non-interactive product preview for the hero. Real component shape, seeded demo data.
const OPTIONS = [
  { label: "Thumbnail A", img: "https://picsum.photos/seed/verdikt-thumb-a/320/180", votes: 61 },
  { label: "Thumbnail B", img: "https://picsum.photos/seed/verdikt-thumb-b/320/180", votes: 39 },
];

export function DemoVoteCard() {
  const [fill, setFill] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFill(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="glass rounded-[var(--radius-lg)] p-5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Which thumbnail wins?</span>
        <span className="tabular text-accent-soft">0.5 MON / vote</span>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {OPTIONS.map((o) => (
          <div key={o.label}>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={o.img}
                alt={o.label}
                className="h-12 w-20 shrink-0 rounded-md border border-border object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>{o.label}</span>
                  <span className="tabular text-muted">{o.votes}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                    style={{ width: fill ? `${o.votes}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="tabular mt-4 text-xs text-muted">100 votes · closes in 41s · tally on-chain</p>
    </div>
  );
}
