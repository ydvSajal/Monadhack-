"use client";

import { useAccount, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";
import { fmtMON, isClosed } from "@/lib/format";
import { useTasks, type Task } from "@/lib/useMarket";
import { Card, Pill } from "@/components/ui";
import { TxButton } from "@/components/tx-button";

export function EarningsPanel() {
  const { address } = useAccount();
  const { tasks, refetch } = useTasks();

  if (!address) return <p className="text-sm text-muted">Connect a wallet to see earnings.</p>;
  if (!tasks.length) return <p className="text-sm text-muted">No tasks yet.</p>;

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((t) => (
        <EarningsRow key={t.id} task={t} me={address} onChange={refetch} />
      ))}
    </div>
  );
}

function EarningsRow({
  task,
  me,
  onChange,
}: {
  task: Task;
  me: `0x${string}`;
  onChange: () => void;
}) {
  const base = { address: MARKET_ADDRESS, abi: marketAbi } as const;
  const { data, refetch } = useReadContracts({
    contracts: [
      { ...base, functionName: "earnings", args: [BigInt(task.id), me] },
      { ...base, functionName: "claimed", args: [BigInt(task.id), me] },
    ],
  });

  const earned = (data?.[0]?.result as bigint | undefined) ?? 0n;
  const claimed = Boolean(data?.[1]?.result);
  const isEmployer = task.employer.toLowerCase() === me.toLowerCase();
  const closed = isClosed(task.deadline);
  const nothing = earned === 0n && !isEmployer;

  if (nothing && !claimed) return null;

  const claimable = earned > 0n && !claimed && closed && (!task.frozen || task.resolved);
  const done = () => {
    refetch();
    onChange();
  };

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{task.meta?.title ?? `Task #${task.id}`}</span>
          {isEmployer && <Pill tone="accent">your task</Pill>}
          {claimed && <Pill tone="positive">claimed</Pill>}
        </div>
        <p className="tabular mt-1 text-xs text-muted">
          {earned > 0n ? `claimable ${fmtMON(earned)}` : "no votes"} ·{" "}
          {isEmployer ? `${fmtMON(task.escrow)} unspent` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {claimable && (
          <TxButton
            label={`Claim ${fmtMON(earned)}`}
            request={{ ...base, functionName: "claim", args: [BigInt(task.id)] }}
            onConfirmed={done}
          />
        )}
        {earned > 0n && !closed && task.frozen && (
          <span className="self-center text-xs text-danger">frozen — wait for resolution</span>
        )}
        {isEmployer && !closed && !task.frozen && !task.resolved && (
          <TxButton
            label="Freeze (dispute)"
            variant="danger"
            request={{ ...base, functionName: "freeze", args: [BigInt(task.id)] }}
            onConfirmed={done}
          />
        )}
        {isEmployer && (closed || task.resolved) && task.escrow > 0n && (
          <TxButton
            label={`Withdraw ${fmtMON(task.escrow)}`}
            variant="ghost"
            request={{ ...base, functionName: "withdrawUnspent", args: [BigInt(task.id)] }}
            onConfirmed={done}
          />
        )}
      </div>
    </Card>
  );
}
