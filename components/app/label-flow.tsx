"use client";

import { useMemo, useState } from "react";
import { zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";
import { fmtMON, isClosed } from "@/lib/format";
import { useTasks } from "@/lib/useMarket";
import { Button, Card, Pill } from "@/components/ui";
import { TxButton } from "@/components/tx-button";

// Borrowed from decentralized-fiverr's worker "nextTask" flow: serve one unvoted
// item at a time, tap to pick, auto-advance. Faster to use and better on camera
// than expanding every task. All reads are on-chain; no backend queue.
type Slot = {
  taskId: number;
  itemId: number;
  title: string;
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
          Nothing left to label right now. Check back when new tasks open, or create one.
        </p>
      </Card>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {queue.length} item{queue.length === 1 ? "" : "s"} to label
        </span>
        <Pill tone="accent">{fmtMON(current.reward)} / vote</Pill>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-muted">{current.title}</p>
          {current.item.prompt && <p className="mt-1 text-lg">{current.item.prompt}</p>}
        </div>

        {current.item.imageUrls?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {current.item.imageUrls.map((u, ci) => (
              <Choice
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
              <Choice
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

        <Button variant="ghost" className="self-end" onClick={skip}>
          Skip
        </Button>
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

function Choice({
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
  imageUrl?: string;
  onVoted: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-2">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={label}
          className="aspect-video w-full rounded-md border border-border object-cover"
        />
      )}
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
