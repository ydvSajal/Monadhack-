"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/chain";
import { shortAddr } from "@/lib/format";
import { Button } from "./ui";

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    const injected = connectors[0];
    return (
      <Button
        onClick={() => injected && connect({ connector: injected })}
        disabled={isPending || !injected}
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  if (chainId !== monadTestnet.id) {
    return (
      <Button variant="danger" onClick={() => switchChain({ chainId: monadTestnet.id })}>
        Switch to Monad testnet
      </Button>
    );
  }

  return (
    <Button variant="ghost" onClick={() => disconnect()} className="tabular">
      {shortAddr(address)}
    </Button>
  );
}
