"use client";

import { useState } from "react";
import { zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";
import { fmtMON, timeLeft, isClosed, shortAddr } from "@/lib/format";
import { useTasks, type Task } from "@/lib/useMarket";
import { Card, Pill } from "@/components/ui";
import { TxButton } from "@/components/tx-button";

export function TaskExplorer() {
  const { tasks, isLoading, refetch } = useTasks();
  const [open, setOpen] = useState<number | null>(null);

  if (isLoading) return <p className="text-sm text-muted">Loading tasks…</p>;
  if (!tasks.length)
    return <p className="text-sm text-muted">No tasks yet. Create one from the Create tab.</p>;

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          open={open === t.id}
          onToggle={() => setOpen(open === t.id ? null : t.id)}
          onVoted={refetch}
        />
      ))}
    </div>
  );
}

function TaskRow({
  task,
  open,
  onToggle,
  onVoted,
}: {
  task: Task;
  open: boolean;
  onToggle: () => void;
  onVoted: () => void;
}) {
  const closed = isClosed(task.deadline);
  const status = task.resolved
    ? { tone: "muted" as const, text: "resolved" }
    : task.frozen
      ? { tone: "danger" as const, text: "frozen" }
      : closed
        ? { tone: "muted" as const, text: "closed" }
        : { tone: "positive" as const, text: timeLeft(task.deadline) };

  return (
    <Card className="p-0">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{task.meta?.title ?? `Task #${task.id}`}</span>
            <Pill tone={status.tone}>{status.text}</Pill>
          </div>
          <p className="tabular mt-1 text-xs text-muted">
            #{task.id} · {task.meta?.kind ?? "task"} · {fmtMON(task.rewardPerVote)}/vote ·{" "}
            {fmtMON(task.escrow)} left · by {shortAddr(task.employer)}
          </p>
        </div>
        <span className="text-muted">{open ? "–" : "+"}</span>
      </button>

      {open && task.meta && (
        <div className="flex flex-col gap-4 border-t border-border p-4">
          {task.meta.items.map((item, itemId) => (
            <ItemVote
              key={itemId}
              taskId={task.id}
              itemId={itemId}
              item={item}
              votingOpen={!closed && !task.frozen && !task.resolved}
              onVoted={onVoted}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function ItemVote({
  taskId,
  itemId,
  item,
  votingOpen,
  onVoted,
}: {
  taskId: number;
  itemId: number;
  item: { prompt?: string; imageUrls?: string[]; choices: string[] };
  votingOpen: boolean;
  onVoted: () => void;
}) {
  const { address } = useAccount();
  const base = { address: MARKET_ADDRESS, abi: marketAbi } as const;

  const { data, refetch } = useReadContracts({
    contracts: [
      { ...base, functionName: "getTally", args: [BigInt(taskId), BigInt(itemId)] },
      {
        ...base,
        functionName: "voted",
        args: [BigInt(taskId), BigInt(itemId), address ?? zeroAddress],
      },
    ],
  });

  const tally = (data?.[0]?.result as readonly number[] | undefined) ?? [0, 0, 0, 0];
  const hasVoted = Boolean(address) && Boolean(data?.[1]?.result);
  const total = tally.reduce((a, b) => a + Number(b), 0);

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      {item.imageUrls?.length ? (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {item.imageUrls.map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={u}
              alt={item.choices[i] ?? `Option ${i + 1}`}
              className="h-24 w-40 shrink-0 rounded-md border border-border object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm">{item.prompt}</p>
      )}

      <div className="flex flex-col gap-2">
        {item.choices.map((c, choiceId) => {
          const count = Number(tally[choiceId] ?? 0);
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={choiceId} className="flex items-center gap-3">
              <div className="relative flex-1 overflow-hidden rounded-md border border-border bg-surface">
                <div
                  className="absolute inset-y-0 left-0 bg-accent/20"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex justify-between px-3 py-2 text-sm">
                  <span>{c}</span>
                  <span className="tabular text-muted">
                    {count} · {pct}%
                  </span>
                </div>
              </div>
              {votingOpen && !hasVoted && (
                <TxButton
                  label="Vote"
                  variant="ghost"
                  request={{
                    address: MARKET_ADDRESS,
                    abi: marketAbi,
                    functionName: "vote",
                    args: [BigInt(taskId), BigInt(itemId), choiceId],
                  }}
                  onConfirmed={() => {
                    refetch();
                    onVoted();
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {hasVoted && <p className="mt-2 text-xs text-positive">You voted on this item.</p>}
    </div>
  );
}
