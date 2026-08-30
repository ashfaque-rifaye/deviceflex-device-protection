import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, ArrowRight, FileCheck2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { KPIS, OPPORTUNITY } from "@/data/deviceflex";
import { useAuth } from "@/lib/auth";
import { WhyThisDecision } from "@/components/deviceflex/WhyThisDecision";

export const Route = createFileRoute("/deviceflex/impact")({ component: ImpactPage });

/**
 * MECHANISM 3 — the decision ledger, on the page built for the people who care about it.
 *
 * This used to hang off the Advisor card in the claim flow, where it was wrong: a customer
 * filing a claim about a phone they just lost does not want input digests and a replay
 * button, and showing them raises a question ("should I be checking this?") the product
 * shouldn't ask them to answer. The auditability claim is aimed at engineers, underwriters
 * and patent examiners, so it lives with the rest of the technical story.
 *
 * Nothing about the mechanism changed — every decision is still recorded as it is made.
 * Only the audience for the readout did.
 */
function DecisionLedgerPanel() {
  const { user } = useAuth();
  const ledger = user?.ledger ?? [];

  return (
    <section className="mt-8 rounded-2xl border border-[#DCDFE3] bg-white p-6">
      <p className="att-eyebrow flex items-center gap-1.5 text-[#00388F]">
        <FileCheck2 className="h-3.5 w-3.5" />
        Mechanism 3 · Deterministic decision ledger
      </p>
      <h2 className="att-h3 mt-1">Every automated decision, replayable</h2>
      <p className="att-small mt-1 max-w-2xl">
        Each recommendation and corroboration in this prototype is made by a pure function over
        account state and recorded with a hash of its input and output. Replaying one re-executes
        the same function against the recorded facts and compares digests — so an automated
        underwriting decision can be proved rather than trusted. This is the answer to &ldquo;how do
        we know the AI was right?&rdquo;
      </p>

      {ledger.length === 0 ? (
        <p className="mt-4 rounded-xl bg-[#F3F4F6] p-4 text-sm text-[#686E74]">
          No decisions recorded in this session yet. Sign in and file a claim, then come back —
          every decision made along the way appears here.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {ledger.slice(0, 6).map((t) => (
            <WhyThisDecision key={t.id} trace={t} label={t.summary} />
          ))}
        </div>
      )}
    </section>
  );
}

function ImpactPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader cartCount={0} />
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
          Business impact · for review
        </p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">
          An incremental revenue engine on the existing base
        </h1>
        <p className="mt-2 max-w-3xl text-[15px] text-[#686E74]">
          DeviceFlex turns a static $5.2B insurance line into a multi-tier membership — on
          infrastructure AT&amp;T already owns. Sources: Internal AT&amp;T · Mintel, Mobile Network
          Providers, US, Jan 2026.
        </p>

        {/* Headline stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["18% → 70%", "Online vs retail attach — the wedge"],
            ["~40% → 55–65%", "Protection attach: today → target"],
            ["$25 → $40", "ARPU uplift (Basic → Family)"],
            ["$1B+", "Incremental opportunity"],
          ].map(([big, sub]) => (
            <div
              key={sub}
              className="rounded-2xl bg-gradient-to-br from-[#0057B8] to-[#009FDB] p-5 text-white"
            >
              <p className="text-3xl font-extrabold">{big}</p>
              <p className="mt-1 text-sm text-white/90">{sub}</p>
            </div>
          ))}
        </div>

        {/* KPI table */}
        <section className="mt-8 rounded-2xl border border-[#DCDFE3] bg-white p-6">
          <h2 className="text-lg font-extrabold">Every experience improvement maps to a KPI</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th className="border-b border-[#DCDFE3] p-3">Metric</th>
                  <th className="border-b border-[#DCDFE3] p-3">Today</th>
                  <th className="border-b border-[#DCDFE3] p-3">With DeviceFlex</th>
                  <th className="border-b border-[#DCDFE3] p-3">Why</th>
                </tr>
              </thead>
              <tbody>
                {KPIS.map((k) => (
                  <tr key={k.label}>
                    <td className="border-b border-[#DCDFE3] p-3 font-bold">{k.label}</td>
                    <td className="border-b border-[#DCDFE3] p-3 text-[#686E74]">{k.today}</td>
                    <td className="border-b border-[#DCDFE3] p-3">
                      <span className="inline-flex items-center gap-1 font-extrabold text-[#0057B8]">
                        {k.dir === "up" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {k.future}
                      </span>
                    </td>
                    <td className="border-b border-[#DCDFE3] p-3 text-[#686E74]">{k.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Foundation + demand */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <h2 className="text-lg font-extrabold">The foundation (Internal AT&amp;T)</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {[OPPORTUNITY.base, OPPORTUNITY.subs, OPPORTUNITY.revenue, OPPORTUNITY.claimRate].map(
                (x) => (
                  <li key={x} className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 text-[#0057B8]" /> {x}
                  </li>
                ),
              )}
            </ul>
          </section>
          <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <h2 className="text-lg font-extrabold">The demand (Mintel 2026)</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {OPPORTUNITY.demand.map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-[#0057B8]" /> {x}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <DecisionLedgerPanel />

        <div className="mt-8 rounded-2xl bg-[#1D2329] p-6 text-center text-white">
          <p className="text-lg font-extrabold">
            "Yesterday it was insurance. Today it's a membership. Tomorrow it's your entire mobile
            lifestyle."
          </p>
          <div className="mt-4">
            <Link
              to="/deviceflex"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#0057B8]"
            >
              Back to DeviceFlex
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}
