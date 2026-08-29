"use client";

import { useMemo, useState } from "react";
import { parseEther } from "viem";
import { marketAbi, MARKET_ADDRESS, type TaskMeta } from "@/lib/contract";
import { encodeMeta } from "@/lib/meta";
import { fmtMON } from "@/lib/format";
import { Button, Card, Field, Input, Pill } from "@/components/ui";
import { TxButton } from "@/components/tx-button";

type Row = { text: string; choices: string };

const LETTERS = ["A", "B", "C", "D"];

export function CreateTaskForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("Which thumbnail wins?");
  const [kind, setKind] = useState<TaskMeta["kind"]>("thumbnail");
  const [reward, setReward] = useState("0.5");
  const [durationSecs, setDurationSecs] = useState("60");
  const [fundVotes, setFundVotes] = useState("10");
  const [rows, setRows] = useState<Row[]>([
    { text: "https://picsum.photos/seed/a/400/225", choices: "" },
    { text: "https://picsum.photos/seed/b/400/225", choices: "" },
  ]);

  const meta: TaskMeta = useMemo(
    () => ({
      title: title.trim() || "Untitled task",
      kind,
      items: rows.map((r) =>
        kind === "thumbnail"
          ? {
              imageUrls: r.text
                .split(/[\n,]/)
                .map((s) => s.trim())
                .filter(Boolean),
              choices: r.text
                .split(/[\n,]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((_, i) => `Thumbnail ${LETTERS[i] ?? i + 1}`),
            }
          : {
              prompt: r.text.trim(),
              choices: r.choices
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            },
      ),
    }),
    [title, kind, rows],
  );

  const rewardWei = (() => {
    try {
      return parseEther(reward || "0");
    } catch {
      return 0n;
    }
  })();
  const votes = BigInt(Math.max(0, Math.floor(Number(fundVotes) || 0)));
  const value = rewardWei * votes;
  const dur = BigInt(Math.max(1, Math.floor(Number(durationSecs) || 0)));

  const validItems = meta.items.filter(
    (it) => it.choices.length >= 2 && (it.prompt || (it.imageUrls?.length ?? 0) >= 2),
  );
  const ok = validItems.length > 0 && rewardWei > 0n && value > 0n && dur > 0n;

  const request = ok
    ? ({
        address: MARKET_ADDRESS,
        abi: marketAbi,
        functionName: "createTask",
        args: [encodeMeta(meta), BigInt(meta.items.length), rewardWei, dur],
        value,
      } as const)
    : null;

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setKind("thumbnail")}
          className={`rounded-md px-3 py-1.5 text-sm ${kind === "thumbnail" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"}`}
        >
          Thumbnail scoring
        </button>
        <button
          onClick={() => setKind("label")}
          className={`rounded-md px-3 py-1.5 text-sm ${kind === "label" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"}`}
        >
          Data labeling
        </button>
      </div>

      <Field label="Task title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Reward per vote (MON)">
          <Input value={reward} onChange={(e) => setReward(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Votes to fund">
          <Input value={fundVotes} onChange={(e) => setFundVotes(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Window (seconds)" hint="60 keeps a live demo short">
          <Input
            value={durationSecs}
            onChange={(e) => setDurationSecs(e.target.value)}
            inputMode="numeric"
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">
          {kind === "thumbnail" ? "Items — one per line, comma-separate the image URLs" : "Items to label"}
        </span>
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <Pill>Item {i + 1}</Pill>
              {rows.length > 1 && (
                <button
                  className="text-xs text-danger"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              )}
            </div>
            <Input
              placeholder={
                kind === "thumbnail"
                  ? "https://…/a.jpg, https://…/b.jpg"
                  : "The text or item to label"
              }
              value={r.text}
              onChange={(e) =>
                setRows(rows.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
              }
            />
            {kind === "label" && (
              <Input
                placeholder="Choices, comma separated: spam, not spam"
                value={r.choices}
                onChange={(e) =>
                  setRows(rows.map((x, j) => (j === i ? { ...x, choices: e.target.value } : x)))
                }
              />
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() => setRows([...rows, { text: "", choices: "" }])}
          className="self-start"
        >
          Add item
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="tabular text-sm text-muted">
          Escrow now: {value > 0n ? fmtMON(value) : "—"} · {validItems.length} valid item
          {validItems.length === 1 ? "" : "s"}
        </span>
        <TxButton label="Create task" request={request} disabled={!ok} onConfirmed={onCreated} />
      </div>
    </Card>
  );
}
