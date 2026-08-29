"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-accent text-accent-fg shadow-sm hover:bg-accent-soft",
        variant === "ghost" &&
          "border border-border-strong bg-surface-2 text-foreground hover:bg-surface-solid",
        variant === "danger" &&
          "border border-danger/30 bg-surface-2 text-danger hover:bg-danger/10",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("glass rounded-[var(--radius-lg)] p-5", className)}>{children}</div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-border-strong bg-surface-solid px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent-wash",
        className,
      )}
      {...props}
    />
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "accent" | "positive" | "danger";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tabular",
        tone === "muted" && "bg-surface-2 text-muted",
        tone === "accent" && "bg-accent-wash text-accent-soft",
        tone === "positive" && "bg-positive/12 text-positive",
        tone === "danger" && "bg-danger/12 text-danger",
      )}
    >
      {children}
    </span>
  );
}
