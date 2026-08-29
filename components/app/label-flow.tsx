"use client";

import { useMemo, useState } from "react";
import { zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";
import { fmtMON, isClosed } from "@/lib/format";
import { useTasks } from "@/lib/useMarket";
import { Card, Pill } from "@/components/ui";
import { TxButton } from "@/components/tx-button";

// One unvoted item at a time, tap to pick, auto-advance. The card layout switches
// on task kind: thumbnails = big image A/B/C, labeling = prompt + choice list.
type Kind = "thumbnail" | "label";
type Slot = {
  taskId: number;
  itemId: number;
  title: string;
  kind: Kind;
  reward: bigint;
  item: { prompt?: string; imageUrls?: string[]; choices: string[] };
};

export function LabelFlow() {
  const { address } = useAccount();
  const { tasks, refetch } = useTasks();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [i, setI] = useState(0);

  const slots = useMemo<Slot[]>(() => {
    const out: Slot[] = [];
    for (const t of tasks) {
      if (!t.meta || t.frozen || t.resolved || isClosed(t.deadline)) continue;
      if (t.escrow < t.rewardPerVote) continue;
      t.meta.items.forEach((item, itemId) => {
        if (item.choices.length >= 2) {
          out.push({
            taskId: t.id,
            itemId,
            title: t.meta!.title,
            kind: t.meta!.kind,
            reward: t.rewardPerVote,
            item,
          });
        }
      });
    }
    return out;
  }, [tasks]);

  const { data: votedData } = useReadContracts({
    contracts: slots.map((s) => ({
      address: MARKET_ADDRESS,
      abi: marketAbi,
      functionName: "voted" as const,
      args: [BigInt(s.taskId), BigInt(s.itemId), address ?? zeroAddress] as const,
    })),
    query: { enabled: slots.length > 0 },
  });

  const queue = slots.filter((s, idx) => {
    const key = `${s.taskId}-${s.itemId}`;
    const onChainVoted = address ? Boolean(votedData?.[idx]?.result) : false;
    return !onChainVoted && !done.has(key);
  });

  const current = queue[Math.min(i, queue.length - 1)];

  if (!address) return <p className="text-sm text-muted">Connect a wallet to start labeling.</p>;
  if (!queue.length)
    return (
      <Card>
        <p className="text-sm text-muted">
          Nothing left to label right now. Check back when new tasks open.
        </p>
      </Card>
    );

  const isThumb = current.kind === "thumbnail";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {queue.length} item{queue.length === 1 ? "" : "s"} left
        </span>
        <Pill tone="accent">{fmtMON(current.reward)} / vote</Pill>
      </div>

      <Card className="flex flex-col gap-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{current.title}</p>
          <p className="mt-1 text-lg font-medium">
            {isThumb
              ? "Which thumbnail earns the click?"
              : current.item.prompt || "Pick the correct label"}
          </p>
          {isThumb && current.item.prompt && (
            <p className="mt-1 text-sm text-muted">{current.item.prompt}</p>
          )}
        </div>

        {isThumb && current.item.imageUrls?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {current.item.imageUrls.map((u, ci) => (
              <ThumbChoice
                key={ci}
                taskId={current.taskId}
                itemId={current.itemId}
                choiceId={ci}
                label={current.item.choices[ci] ?? `Option ${ci + 1}`}
                imageUrl={u}
                onVoted={advance}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {current.item.choices.map((c, ci) => (
              <LabelChoice
                key={ci}
                taskId={current.taskId}
                itemId={current.itemId}
                choiceId={ci}
                label={c}
                onVoted={advance}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
          <span className="tabular">task #{current.taskId} · item {current.itemId + 1}</span>
          <button onClick={skip} className="font-medium hover:text-foreground">
            Skip →
          </button>
        </div>
      </Card>
    </div>
  );

  function advance() {
    if (current) setDone((d) => new Set(d).add(`${current.taskId}-${current.itemId}`));
    setI(0);
    refetch();
  }
  function skip() {
    setI((n) => n + 1);
  }
}

function ThumbChoice({
  taskId,
  itemId,
  choiceId,
  label,
  imageUrl,
  onVoted,
}: {
  taskId: number;
  itemId: number;
  choiceId: number;
  label: string;
  imageUrl: string;
  onVoted: () => void;
}) {
  return (
    <div className="group flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-surface-2 p-2 transition hover:border-accent">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={label}
        className="aspect-video w-full rounded-lg border border-border object-cover"
      />
      <TxButton
        label={`Pick ${label}`}
        request={{
          address: MARKET_ADDRESS,
          abi: marketAbi,
          functionName: "vote",
          args: [BigInt(taskId), BigInt(itemId), choiceId],
        }}
        onConfirmed={onVoted}
      />
    </div>
  );
}

function LabelChoice({
  taskId,
  itemId,
  choiceId,
  label,
  onVoted,
}: {
  taskId: number;
  itemId: number;
  choiceId: number;
  label: string;
  onVoted: () => void;
}) {
  return (
    <div className="rounded-xl">
      <TxButton
        label={label}
        variant="ghost"
        className="w-full justify-start px-4 py-3 text-base"
        request={{
          address: MARKET_ADDRESS,
          abi: marketAbi,
          functionName: "vote",
          args: [BigInt(taskId), BigInt(itemId), choiceId],
        }}
        onConfirmed={onVoted}
      />
    </div>
  );
}
