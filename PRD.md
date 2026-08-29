# Verdikt — PRD (Monad Hackathon)

**Deadline:** 2026-08-29 17:45.
**Goal:** max points on the 400-pt rubric. Ship smallest fully-working escrow labeling dApp + market it.
_Name "Verdikt" is a placeholder — override anytime._

---

## 1. Problem

Creators and companies need cheap, honest crowd judgment — "which thumbnail wins", "label this dataset". Paying a crowd off-chain means trusting the payer not to ghost and workers not to spam. Verdikt puts escrow, payout, and the vote tally on-chain. Employer can't ghost (funds locked). Workers paid automatically unless the employer disputes fraud.

## 2. Users

- **Employer** — deposits MON, creates a task with N items + choices, gets an on-chain result per item.
- **Labeler** — connects wallet, votes on items, claims earnings after the window.
- **Arbiter** — hackathon: a fixed admin address set at deploy. Roadmap: staked jury.

## 3. Core flow

1. Employer `createTask(metadataURI, itemCount, rewardPerVote, duration)` + sends escrow. `metadataURI` points to JSON: items + choice labels + task kind (`thumbnail` | `label`).
2. Labelers `vote(taskId, itemId, choice)` — one vote per wallet per item. Contract increments tally, credits `rewardPerVote` to the labeler's claimable balance, decrements escrow. Task stops accepting votes when escrow < rewardPerVote or deadline passes.
3. Deadline passes, no dispute → labelers `claim(taskId)` → paid.
4. Employer sees fraud → `freeze(taskId)` → claims blocked.
5. Arbiter `resolve(taskId, badAddrs)` → zeros bad labelers' balances, returns their share to employer escrow, unfreezes.
6. Employer `withdrawUnspent(taskId)` → unallocated escrow back.

Result read: `getTally(taskId, itemId)` → `uint32[4]` vote counts per choice. That is the product.

## 4. Contract — `OpinionMarket.sol`

Single file, Solidity ^0.8.24, Hardhat. 6 external state fns (Section 3) + `taskCount()` + `getTally()`. Rules:

- Native MON escrow held in contract, per-task accounting (`escrow` = unallocated remainder).
- Earnings deducted from escrow at vote time; `claim` pays from contract balance.
- Pull-payment only, `nonReentrant` on `claim` / `withdrawUnspent`, checks-effects-interactions.
- `uint8 choice`, `MAX_CHOICES = 4` → cheap `getTally`.
- One vote per `(taskId, itemId, wallet)`.
- `duration` per task; demo task = 60s.
- Events on every state change (frontend + explorer story).

**Hardhat tests — 3 paths that score:**
1. Happy: create → 3 votes on an item → warp past deadline → each labeler `claim` paid, `getTally` correct.
2. Dispute: create → votes → `freeze` → `resolve([bad])` → bad labeler balance 0 + employer escrow credited, good labeler still claims, `claim` from bad reverts.
3. Reclaim: over-fund → partial votes → warp → `withdrawUnspent` returns leftover; double-claim reverts.

## 5. Frontend — Next.js on Vercel

shadcn/ui + reactbits, taste skill for direction, mobile-first, **PWA** (installable, offline shell). Pages:

- `/` — landing + waitlist form (email capture, fallback for the 5K-views line). CTA to `/app`.
- `/app` — connect wallet (wagmi injected connector, Monad testnet). Tabs:
  - **Create task**: form (reward per vote, duration, items as image URLs / text + choice labels) → upload metadata JSON → `createTask` tx.
  - **Label**: pick an open task, swipe/tap A/B/C per item → `vote` tx.
  - **Earnings**: claimable per task → `claim` tx. Employer view: `freeze` / `withdrawUnspent`.
- Task metadata: JSON to Vercel Blob (`@vercel/blob`, one dep, zero config on Vercel). URI stored on-chain.

Chain config: Monad testnet only — chainId 10143, RPC https://testnet-rpc.monad.xyz/, explorer https://testnet.monadexplorer.com/.

## 6. Deployment

| What | Where | Points |
|---|---|---|
| Contract | Monad testnet, verified on explorer | 25 + 25 |
| Contract (same) | Monad mainnet, no app wired to it | 25 bonus |
| Frontend | Vercel, public URL | 25 |
| Custom domain | if DNS propagates in time | 15 bonus |
| Repo | public GitHub | 25 |
| README | live URL + contract address + run-from-scratch steps | 25 + 25 |

## 7. Build order (post FIRST — views need hours)

| # | Task | Points |
|---|---|---|
| 1 | X + LinkedIn post "building Verdikt on @monad", tag @monad @monad_dev @geeky_kartikey | 25 (+ views) |
| 2 | `OpinionMarket.sol` + 3 Hardhat tests, deploy testnet, verify on explorer | 25+25+25 |
| 3 | deploy same contract to mainnet | 25 bonus |
| 4 | frontend: connect wallet, create task, vote, claim — wired to testnet | 25 + 25 |
| 5 | landing + waitlist + PWA, deploy Vercel, domain if owned | 25 + 25 + 15 |
| 6 | 30s demo video + creative ad video, post both | 25 + 25 |
| 7 | README, then clone into a fresh folder and follow it | 25 |
| 8 | seed a live 60s-window task, rehearse create→vote→claim on stage | 25 |

Cut order if short: `freeze`/`resolve` (announce fewer functions), ad video, mainnet deploy.

## 8. Pitch script (say all 4 basic items)

"Repo: github.com/.../MONAD_HACK. Contract: 0x… on Monad testnet, verified. Live: verdikt.vercel.app. Deployed on testnet — and mainnet, but the app stays on testnet because it's unaudited escrow holding real funds."

Then: problem → live demo (create task, vote from a second wallet, deadline passes, claim — real tx on screen) → PMF (creators already pay for thumbnail testing tools) → revenue (protocol fee % on escrow) → roadmap (commit-reveal, staked labelers, jury).

## 9. Marketing (I draft, you post)

- X + LinkedIn launch post + build-in-public thread
- 30s demo screen-recording script
- creative ad concept + shot list
- README

## 10. Out of scope (README roadmap)

Commit-reveal, staking + slashing, quorum/redundancy consensus, sybil resistance, IPFS, reputation, multi-arbiter jury, freeze-griefing guard.

## 11. Open items

- Fund deployer wallet with testnet MON (user).
- Mainnet MON for bonus deploy — optional.
- Domain ownership — confirm; skip if none.
- Final product name (Verdikt = placeholder).
