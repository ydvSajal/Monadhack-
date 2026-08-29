"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS } from "./contract";
import { decodeMeta } from "./meta";
import type { TaskMeta } from "./contract";

const base = { address: MARKET_ADDRESS, abi: marketAbi } as const;

export type Task = {
  id: number;
  employer: `0x${string}`;
  metadataURI: string;
  meta: TaskMeta | null;
  itemCount: number;
  rewardPerVote: bigint;
  escrow: bigint;
  deadline: bigint;
  frozen: boolean;
  resolved: boolean;
};

export function useTaskCount() {
  return useReadContract({ ...base, functionName: "taskCount" });
}

export function useTasks() {
  const { data: count } = useTaskCount();
  const n = count ? Number(count) : 0;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({
      ...base,
      functionName: "tasks" as const,
      args: [BigInt(i)] as const,
    })),
    query: { enabled: n > 0 },
  });

  const tasks = useMemo<Task[]>(() => {
    if (!data) return [];
    return data
      .map((r, i) => {
        if (r.status !== "success") return null;
        const [employer, metadataURI, itemCount, rewardPerVote, escrow, deadline, frozen, resolved] =
          r.result as [
            `0x${string}`,
            string,
            bigint,
            bigint,
            bigint,
            bigint,
            boolean,
            boolean,
          ];
        return {
          id: i,
          employer,
          metadataURI,
          meta: decodeMeta(metadataURI),
          itemCount: Number(itemCount),
          rewardPerVote,
          escrow,
          deadline,
          frozen,
          resolved,
        };
      })
      .filter((t): t is Task => t !== null)
      .reverse();
  }, [data]);

  return { tasks, isLoading, refetch };
}
