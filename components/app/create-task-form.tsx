"use client";

import { useMemo, useState } from "react";
import { parseEther } from "viem";
import { marketAbi, MARKET_ADDRESS, type TaskMeta } from "@/lib/contract";
import { encodeMeta } from "@/lib/meta";
import { fmtMON } from "@/lib/format";
import { Button, Card, Field, Input, Pill } from "@/components/ui";
import { TxButton } from "@/components/tx-button";
import { ImageUpload } from "@/components/upload";

const LETTERS = ["A", "B", "C", "D"];

type ThumbRow = { images: string[] };
type LabelRow = { text: string; choices: string };

export function CreateTaskForm({ onCreated }: { onCreated: () => void }) {
  const [kind, setKind] = useState<TaskMeta["kind"]>("thumbnail");
  const [title, setTitle] = useState("Which thumbnail wins?");
  const [reward, setReward] = useState("0.5");
  const [durationSecs, setDurationSecs] = useState("60");
  const [fundVotes, setFundVotes] = useState("10");
  const [thumbRows, setThumbRows] = useState<ThumbRow[]>([{ images: [] }]);
  const [labelRows, setLabelRows] = useState<LabelRow[]>([{ text: "", choices: "spam, not spam" }]);

  const meta: TaskMeta = useMemo(() => {
    if (kind === "thumbnail") {
      return {
        title: title.trim() || "Untitled task",
        kind,
        items: thumbRows.map((r) => ({
          imageUrls: r.images,
          choices: r.images.map((_, i) => `Thumbnail ${LETTERS[i] ?? i + 1}`),
        })),
      };
    }
    return {
      title: title.trim() || "Untitled task",
      kind,
      items: labelRows.map((r) => ({
        prompt: r.text.trim(),
        choices: r.choices
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      })),
    };
  }, [kind, title, thumbRows, labelRows]);

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
    <Card className="flex flex-col gap-6">
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            { k: "thumbnail" as const, t: "Thumbnail A/B test", d: "Upload 2–4 options per item, the crowd picks the winner." },
            { k: "label" as const, t: "Data labeling", d: "Post text or items, the crowd assigns a label from your set." },
          ]
        ).map(({ k, t, d }) => (
          <button
            key={k}
            onClick={() => {
              setKind(k);
              setTitle(k === "thumbnail" ? "Which thumbnail wins?" : "Label these items");
            }}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              kind === k
                ? "border-accent bg-accent-wash"
                : "border-border-strong bg-surface-2 hover:border-border-strong"
            }`}
          >
            <span className="font-medium">{t}</span>
            <span className="mt-0.5 block text-xs text-muted">{d}</span>
          </button>
        ))}
      </div>

      <Field label="Task title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Reward per vote (MON)">
          <Input value={reward} onChange={(e) => setReward(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Votes to fund">
          <Input
            value={fundVotes}
            onChange={(e) => setFundVotes(e.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field label="Window (seconds)" hint="60 keeps a live demo short">
          <Input
            value={durationSecs}
            onChange={(e) => setDurationSecs(e.target.value)}
            inputMode="numeric"
          />
        </Field>
      </div>

      {kind === "thumbnail" ? (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">Items — each is one A/B test</span>
          {thumbRows.map((r, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <Pill>Item {i + 1}</Pill>
                {thumbRows.length > 1 && (
                  <button
                    className="text-xs text-danger"
                    onClick={() => setThumbRows(thumbRows.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
              <ImageUpload
                urls={r.images}
                onChange={(images) =>
                  setThumbRows(thumbRows.map((x, j) => (j === i ? { images } : x)))
                }
              />
              {r.images.length < 2 && (
                <span className="text-xs text-muted">Add at least 2 images.</span>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() => setThumbRows([...thumbRows, { images: [] }])}
            className="self-start"
          >
            Add item
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">Items to label</span>
          {labelRows.map((r, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <Pill>Item {i + 1}</Pill>
                {labelRows.length > 1 && (
                  <button
                    className="text-xs text-danger"
                    onClick={() => setLabelRows(labelRows.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
              <Input
                placeholder="The text or item to label"
                value={r.text}
                onChange={(e) =>
                  setLabelRows(labelRows.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                }
              />
              <Input
                placeholder="Choices, comma separated: spam, not spam"
                value={r.choices}
                onChange={(e) =>
                  setLabelRows(
                    labelRows.map((x, j) => (j === i ? { ...x, choices: e.target.value } : x)),
                  )
                }
              />
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() => setLabelRows([...labelRows, { text: "", choices: "spam, not spam" }])}
            className="self-start"
          >
            Add item
          </Button>
        </div>
      )}

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
