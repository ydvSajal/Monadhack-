import Link from "next/link";
import { MARKET_ADDRESS } from "@/lib/contract";
import { explorerAddress } from "@/lib/chain";
import { WaitlistForm } from "@/components/waitlist-form";
import { DemoVoteCard } from "@/components/demo-vote-card";

export default function Landing() {
  const deployed = MARKET_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <main className="mx-auto w-full max-w-6xl px-5">
      <nav className="flex h-16 items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">Verdikt</span>
        <Link
          href="/app"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-soft"
        >
          Open app
        </Link>
      </nav>

      {/* Hero */}
      <section className="hero-grid relative grid min-h-[calc(100dvh-4rem)] items-center gap-12 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-soft">
            On-chain opinion market
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            The crowd&apos;s verdict,
            <br />
            settled on-chain.
          </h1>
          <p className="max-w-[52ch] text-base leading-relaxed text-muted">
            Escrow MON, post your thumbnails or data, get scored by real people. Payout releases
            automatically after the window. No platform holding the bag.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app"
              className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition hover:bg-accent-soft"
            >
              Open app
            </Link>
            <a
              href="#waitlist"
              className="rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:bg-surface-2"
            >
              Join the waitlist
            </a>
          </div>
          <p className="tabular text-xs text-muted">Live on Monad testnet · chain 10143</p>
        </div>
        <DemoVoteCard />
      </section>

      {/* How it works */}
      <section className="border-t border-border py-20">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">How it works</h2>
        <ol className="mt-10 flex flex-col gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border">
          {[
            {
              n: "01",
              t: "Employer escrows MON",
              d: "Post a task with your items and choice labels. The full reward budget is locked in the contract on create.",
            },
            {
              n: "02",
              t: "The crowd votes",
              d: "Anyone connects a wallet and votes once per item. Each vote credits a fixed reward and updates the on-chain tally.",
            },
            {
              n: "03",
              t: "Payout is automatic",
              d: "After the window closes, labelers claim their earnings. Silence means everyone gets paid. No approval step.",
            },
            {
              n: "04",
              t: "Fraud gets disputed",
              d: "Spot bad votes before the window ends? Freeze the task. An arbiter voids the bad wallets and returns their share.",
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-5 bg-surface p-5 sm:p-6">
              <span className="tabular text-sm text-accent-soft">{s.n}</span>
              <div>
                <h3 className="font-medium">{s.t}</h3>
                <p className="mt-1 max-w-[60ch] text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Use cases */}
      <section className="grid gap-6 border-t border-border py-20 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h3 className="text-lg font-medium">Thumbnail scoring</h3>
          <p className="mt-2 text-sm text-muted">
            Upload two or three thumbnails, let hundreds of people pick the winner before you publish.
            The tally lives on-chain, so the result is auditable.
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h3 className="text-lg font-medium">Data labeling</h3>
          <p className="mt-2 text-sm text-muted">
            Post raw items with a fixed choice set. Get a labeled dataset with per-item vote
            distributions, priced per label, settled in one transaction.
          </p>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="border-t border-border py-20">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Get the crowd&apos;s verdict on your work
          </h2>
          <p className="mt-2 text-sm text-muted">
            Verdikt is live on testnet now. Leave your email and we will ping you when mainnet opens.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-border py-10 text-sm text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <a className="hover:text-foreground" href="https://github.com/sajalkumar1765/MONAD_HACK">
            GitHub
          </a>
          <a className="hover:text-foreground" href="https://testnet.monadexplorer.com">
            Monad testnet explorer
          </a>
          {deployed && (
            <a className="tabular hover:text-foreground" href={explorerAddress(MARKET_ADDRESS)}>
              Contract {MARKET_ADDRESS.slice(0, 10)}…
            </a>
          )}
        </div>
        <p>Unaudited escrow. Testnet only. Do not send real funds.</p>
      </footer>
    </main>
  );
}
