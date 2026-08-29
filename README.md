# Verdikt

On-chain escrow marketplace for crowd opinions and data labeling, built for the Monad hackathon.

Employers escrow MON and post items to judge (thumbnails to score, data to label). Anyone connects a
wallet, votes once per item, and earns a fixed reward per vote. After the window closes, labelers
claim their earnings. Silence means everyone gets paid. Fraud is disputed on-chain: the employer
freezes the task and a fixed arbiter voids the bad wallets. The per-item vote tally lives in the
contract, so every result is auditable.

- **Live app:** _TODO after deploy_ (Vercel)
- **Contract (Monad testnet):** _TODO after deploy_ — verified on https://testnet.monadexplorer.com
- **Contract (Monad mainnet):** _TODO, optional_
- **Network:** Monad testnet, chain id `10143`

> Unaudited escrow. Testnet only. Do not send real funds.

---

## What is on-chain

`contracts/contracts/OpinionMarket.sol` — one contract, native MON escrow, six external functions:

| Function | Who | Does |
| --- | --- | --- |
| `createTask(metadataURI, itemCount, rewardPerVote, duration)` payable | employer | escrows `msg.value`, opens voting for `duration` seconds |
| `vote(taskId, itemId, choice)` | anyone | one vote per wallet per item, credits `rewardPerVote`, bumps the tally |
| `freeze(taskId)` | employer | disputes a task, blocks claims until resolved |
| `resolve(taskId, badVoters[])` | arbiter | voids fraudulent voters, returns their reward to the employer |
| `claim(taskId)` | labeler | pulls earnings after the deadline |
| `withdrawUnspent(taskId)` | employer | reclaims unallocated budget after the deadline |

Task metadata (items, image URLs, choice labels) is encoded as a `data:` URI and stored on-chain in
the `metadataURI` string. No IPFS, no backend.

---

## Run it yourself

Requires Node 20+ and a wallet with Monad testnet MON (https://faucet.monad.xyz).

### 1. Contract

```bash
cd contracts
npm install
cp .env.example .env          # put your funded PRIVATE_KEY in .env
npm test                      # 5 passing
npm run deploy:testnet        # prints the deployed address
npx hardhat verify --network monadTestnet <address> <arbiterAddress>
```

### 2. Frontend

```bash
cd ..
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_MARKET_ADDRESS to the address from step 1
npm run dev                   # http://localhost:3000
```

Deploy to Vercel: import the repo, set `NEXT_PUBLIC_MARKET_ADDRESS`, and (optional) enable a Blob
store for the landing-page waitlist. The app is a PWA — installable, works offline for the shell.

---

## Stack

- Solidity `^0.8.24`, Hardhat, `hardhat-toolbox`, Sourcify verification
- Next.js 16 (App Router), React 19, Tailwind v4
- wagmi + viem, injected connector, Monad testnet only

## Roadmap (not in this build)

Commit-reveal voting, labeler staking and slashing, quorum / redundancy consensus, sybil resistance,
reputation scores, a staked jury instead of a single arbiter, freeze-griefing protection.
