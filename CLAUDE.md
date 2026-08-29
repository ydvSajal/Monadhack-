# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project

**Verdikt** — on-chain escrow marketplace for crowd opinions + data labeling. Built for the Monad hackathon (submission closes **2026-08-29 17:45**). No relation to any prior project.

Two sides:
- **Employers** (YouTubers, companies, researchers) escrow MON, create a task with items to judge — raw data to label, or thumbnails A/B/C to score.
- **Labelers** connect wallet, vote/label each item, earn a fixed reward per vote, claim payout after a challenge window.

Trust model: contract holds escrow. Silence after the window = labelers get paid (optimistic). Employer disputes by freezing the task; a fixed arbiter voids fraudulent labelers and returns their share. On-chain tally per item **is** the product output (thumbnail scores / label consensus live in the contract, not a DB) — that is the reason to be on-chain.

## Hackathon scoring (400 pts)

- **Basic 100** (prize eligibility, say all 4 in pitch): public GitHub repo (25), README with live URL + contract address (25), contracts on Monad testnet (25), publicly hosted (25).
- **Advance 200**:
  - Working 100: all announced functions work (25), live on-chain tx during demo (25), contract verified on explorer (25), someone else runs it from README unaided (25).
  - Build in public 100: X/LinkedIn post tagging @monad @monad_dev @geeky_kartikey (25), 30s+ demo video (25), creative ad video (25), 5K+ collective views OR 25+ waitlist signups OR 10+ external users (25).
- **Bonus 100**: mainnet deploy (25), custom domain (15), PMF (≤20), revenue strategy (≤20), innovation (≤20).

Rubric reality: ~300 pts are shipping + marketing, innovation is 20. Build the smallest fully-working thing; spend saved time on posts + video. Fewer announced functions = easier 25 pts for "all functions work".

## Architecture

- **Contract**: single `OpinionMarket.sol`. No factory, no proxy. Solidity ^0.8.24. Hardhat (npm, Windows-friendly) for build + deploy + tests.
  - `createTask(string metadataURI, uint64 itemCount, uint128 rewardPerVote, uint64 duration) payable` — employer escrows msg.value
  - `vote(uint256 taskId, uint256 itemId, uint8 choice)` — 1 tx, one wallet = one vote per item, credits earnings + on-chain tally
  - `freeze(uint256 taskId)` — employer disputes, blocks claims until resolved
  - `resolve(uint256 taskId, address[] badVoters)` — arbiter voids fraud, returns their reward to employer escrow
  - `claim(uint256 taskId)` — labeler pulls earnings after deadline (pull-payment, nonReentrant)
  - `withdrawUnspent(uint256 taskId)` — employer reclaims unallocated budget
  - `choice` is `uint8`, `MAX_CHOICES = 4` so majority tally is cheap on-chain
  - demo tasks use `duration ≈ 60` so full lifecycle (create → vote → claim) is filmable live
  - metadata JSON hosted off-chain (Vercel Blob / static file), URI stored on-chain
  - arbiter = fixed address set at deploy (constructor). Roadmap: staked jury.
- **Frontend**: Next.js App Router on Vercel. shadcn/ui + reactbits components, taste skill for direction. Mobile-first. **PWA** (manifest + service worker). wagmi + viem, Monad testnet only.
- **Landing**: same deploy — waitlist form (fallback for the views line) + link to the app.

## Deployment

- Contract → **Monad testnet** (app targets this). Optionally also **mainnet** for 25 bonus pts, app never points at mainnet (unaudited escrow, no upgrade path).
- Verify contract source on the Monad explorer (25 pts).
- Monad **testnet**: chainId 10143, RPC https://testnet-rpc.monad.xyz/, explorer https://testnet.monadexplorer.com/, currency MON, faucet https://faucet.monad.xyz
- Monad **mainnet**: chainId 143, RPC https://rpc.monad.xyz, explorer https://monadscan.com

## Scope cuts (README roadmap, not v1)

Commit-reveal voting, labeler staking, slashing, quorum, sybil resistance, IPFS pinning, reputation scores, freeze griefing protection.

## Conventions

- Keep changes minimal. Stdlib / existing deps over new ones.
- Pull-payment for all payouts. Escrow on `createTask`.
- Match surrounding code style.

## Notes

- Windows dev env, PowerShell primary shell. App lives in repo subdir (currently `skypay/`, rename to `verdikt/` — pending).
