# Architecture

Verdikt is a data-labeling / opinion marketplace. The reference point is
[code100x/decentralized-fiverr](https://github.com/code100x/decentralized-fiverr) — same problem
(pay a crowd to pick the best thumbnail), different trust model.

## decentralized-fiverr

```
user-frontend ─┐
worker-frontend─┼─► Express backend ──► Postgres (Prisma)   ← source of truth
                │        │
                │        ├─ verifies a Solana pay-in tx by signature, then writes the Task row
                │        └─ holds a hot private key, sends SOL to workers on withdrawal
                └─────────► S3 presigned upload for thumbnail images
```

- Chain is used for two things only: checking that the employer paid the parent wallet, and paying
  workers out from that wallet.
- Escrow, vote counts, and payout accounting all live in the database. You trust the operator.
- The repo's own comments flag the holes: `// TODO: There's a double spending problem here` on
  payout, `// Signature should be unique ... else people can reuse a signature` on task creation,
  `// We should add a lock here`.

## Verdikt

```
Next.js app ──► OpinionMarket.sol on Monad testnet   ← source of truth
   │
   └─ /api/waitlist ──► Vercel Blob   (landing-page email list only, not core)
```

- The contract holds the MON escrow, counts every vote per item, tracks each labeler's claimable
  balance, and releases payment. There is no server, no database, no hot wallet, no JWT.
- Task metadata (image URLs, choice labels) is encoded as a `data:` URI and stored on-chain in the
  `metadataURI` string. No S3, no IPFS.
- Double-spend and signature-reuse are not possible: `claimed[taskId][voter]` and
  `voted[taskId][itemId][voter]` are contract state, and payout uses checks-effects-interactions
  plus a reentrancy guard.

## What was borrowed

| From decentralized-fiverr | In Verdikt |
| --- | --- |
| Worker "nextTask" flow — one unvoted item at a time, tap to pick, auto-advance | `components/app/label-flow.tsx`, the default tab |
| Employer results view — image plus vote count per option | `components/app/task-explorer.tsx` |
| Fixed submission cap per task (`TOTAL_SUBMISSIONS = 100`) | budget drain: voting stops when `escrow < rewardPerVote` |
| Default task title "Select the most clickable thumbnail" | create form prefills "Which thumbnail wins?" |

## What was not borrowed

The Express backend, Prisma/Postgres, S3 uploads, JWT auth, the hot-wallet payout, and the
double-spend / signature-reuse bugs. Moving that logic into the contract is the point.

## Roadmap

Commit-reveal voting, labeler staking and slashing, quorum / redundancy consensus, sybil
resistance, reputation, a staked jury instead of a single arbiter.
