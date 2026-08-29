"use client";

import { useState } from "react";
import { Button, Input } from "./ui";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setState("done");
    } else {
      const { error } = await res.json().catch(() => ({ error: "Something broke. Try again." }));
      setMsg(error);
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-6 rounded-lg border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-positive">
        You are in. We will ping you when Verdikt opens.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="sm:flex-1"
      />
      <Button type="submit" disabled={state === "loading"}>
        {state === "loading" ? "Adding…" : "Join the waitlist"}
      </Button>
      {state === "error" && <span className="text-xs text-danger">{msg}</span>}
    </form>
  );
}
