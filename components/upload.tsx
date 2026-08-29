"use client";

import { useRef, useState } from "react";

// Drag-drop image upload. Posts to /api/upload (Vercel Blob), returns public URLs.
// Falls back to a paste-a-URL box if the server has no blob token.
export function ImageUpload({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const [manual, setManual] = useState("");

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setBusy(true);
    setErr("");
    const body = new FormData();
    list.forEach((f) => body.append("file", f));
    const res = await fetch("/api/upload", { method: "POST", body });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(json.error || "Upload failed.");
      return;
    }
    onChange([...urls, ...(json.urls as string[])]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center text-sm transition ${
          drag ? "border-accent bg-accent-wash" : "border-border-strong bg-surface-2 text-muted"
        }`}
      >
        {busy ? "Uploading…" : "Drop images here, or click to choose"}
        <span className="mt-1 text-xs text-muted">PNG / JPG, up to 5 MB each</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {urls.map((u, i) => (
            <div key={u} className="group relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Thumbnail ${i + 1}`} className="aspect-video w-full object-cover" />
              <button
                onClick={() => onChange(urls.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-foreground/70 px-2 py-0.5 text-xs text-white"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="…or paste an image URL"
          className="w-full rounded-xl border border-border-strong bg-surface-solid px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="button"
          onClick={() => {
            const v = manual.trim();
            if (v) {
              onChange([...urls, v]);
              setManual("");
            }
          }}
          className="shrink-0 rounded-full border border-border-strong bg-surface-2 px-3 text-sm"
        >
          Add
        </button>
      </div>

      {err && <span className="text-xs text-danger">{err}</span>}
    </div>
  );
}
