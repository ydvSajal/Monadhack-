"use client";

import { useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { explorerTx } from "@/lib/chain";
import { Button } from "./ui";

type Props = {
  label: string;
  request: {
    address: `0x${string}`;
    abi: unknown;
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
  } | null;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  onConfirmed?: () => void;
};

export function TxButton({
  label,
  request,
  disabled,
  variant = "primary",
  className,
  onConfirmed,
}: Props) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      onConfirmed?.();
      const t = setTimeout(reset, 4000);
      return () => clearTimeout(t);
    }
  }, [isSuccess, onConfirmed, reset]);

  const busy = isPending || mining;

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant={variant}
        className={className}
        disabled={disabled || busy || !request}
        onClick={() => request && writeContract(request as never)}
      >
        {isPending ? "Confirm in wallet…" : mining ? "Mining…" : label}
      </Button>
      {hash && (
        <a
          className="tabular text-xs text-accent-soft hover:underline"
          href={explorerTx(hash)}
          target="_blank"
          rel="noreferrer"
        >
          {isSuccess ? "Confirmed" : "Pending"} · {hash.slice(0, 12)}…
        </a>
      )}
      {error && (
        <span className="text-xs text-danger">
          {(error as { shortMessage?: string }).shortMessage ?? "Transaction failed"}
        </span>
      )}
    </div>
  );
}
