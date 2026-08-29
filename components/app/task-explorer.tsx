"use client";

import { useState } from "react";
import { zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";
import { fmtMON, timeLeft, isClosed, shortAddr } from "@/lib/format";
import { useTasks, type Task } from "@/lib/useMarket";
import { Card, Pill } from "@/components/ui";
import { TxButton } from "@/components/tx-button";

export function TaskExplorer({ mine = false, readOnly = false }: { mine?: boolean; readOnly?: boolean }) {
  const { address } = useAccount();
  const { tasks, isLoading, refetch } = useTasks();
  const [open, setOpen] = useState<number | null>(null);

  const shown = mine
    ? tasks.filter((t) => address && t.employer.toLowerCase() === address.toLowerCase())
    : tasks;

  if (isLoading) return <p className="text-sm text-muted">Loading tasks…</p>;
  if (mine && !address) return <p className="text-sm text-muted">Connect a wallet to see your tasks.</p>;
  if (!shown.length)
    return (
      <p className="text-sm text-muted">
        {mine ? "You have not created any tasks yet." : "No tasks yet."}
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      {shown.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          open={open === t.id}
          onToggle={() => setOpen(open === t.id ? null : t.id)}
          onVoted={refetch}
          readOnly={readOnly}
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
  readOnly,
}: {
  task: Task;
  open: boolean;
  onToggle: () => void;
  onVoted: () => void;
  readOnly: boolean;
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
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{task.meta?.title ?? `Task #${task.id}`}</span>
            <Pill tone={status.tone}>{status.text}</Pill>
            <Pill>{task.meta?.kind === "thumbnail" ? "thumbnails" : "labeling"}</Pill>
          </div>
          <p className="tabular mt-1 text-xs text-muted">
            #{task.id} · {fmtMON(task.rewardPerVote)}/vote · {fmtMON(task.escrow)} left · by{" "}
            {shortAddr(task.employer)}
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
              kind={task.meta!.kind}
              votingOpen={!readOnly && !closed && !task.frozen && !task.resolved}
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
  kind,
  votingOpen,
  onVoted,
}: {
  taskId: number;
  itemId: number;
  item: { prompt?: string; imageUrls?: string[]; choices: string[] };
  kind: "thumbnail" | "label";
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
  const top = Math.max(...item.choices.map((_, i) => Number(tally[i] ?? 0)), 0);

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      {kind === "thumbnail" && item.imageUrls?.length ? (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {item.imageUrls.map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={u}
              alt={item.choices[i] ?? `Option ${i + 1}`}
              className="aspect-video w-full rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm font-medium">{item.prompt}</p>
      )}

      <div className="flex flex-col gap-2">
        {item.choices.map((c, choiceId) => {
          const count = Number(tally[choiceId] ?? 0);
          const pct = total ? Math.round((count / total) * 100) : 0;
          const winning = count > 0 && count === top;
          return (
            <div key={choiceId} className="flex items-center gap-3">
              <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-surface-solid">
                <div
                  className={`absolute inset-y-0 left-0 ${winning ? "bg-accent-wash" : "bg-foreground/5"}`}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex justify-between px-3 py-2 text-sm">
                  <span className={winning ? "font-medium text-accent-soft" : ""}>{c}</span>
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
