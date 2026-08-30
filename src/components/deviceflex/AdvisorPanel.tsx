// Claim-to-Upgrade Advisor.
//
// AT&T's own recommendation surfaces are white cards with a coloured rule on top, an
// eyebrow, one bold statement, and a comparison the customer can read at a glance —
// the same shape as their plan-comparison blocks. A flat tinted panel with a
// paragraph in it reads as a generic notice, which is what this was.
//
// So: a rule, an eyebrow, the verdict as a headline, the money side by side, then the
// reasoning underneath. The comparison is the part that does the persuading.
import { Scale, Info, ArrowRight } from "lucide-react";
import type { AdvisorVerdict, ClaimOption } from "@/lib/ai";
import { ASURION } from "@/data/deductibles";
import { WhyThisDecision } from "@/components/deviceflex/WhyThisDecision";
import type { DecisionTrace } from "@/lib/ledger";

export function AdvisorPanel({
  verdict,
  options,
  recommended,
  trace,
}: {
  verdict: AdvisorVerdict;
  options: ClaimOption[];
  recommended: ClaimOption | undefined;
  /** Mechanism 3 — the replayable record of how this recommendation was reached. */
  trace?: DecisionTrace;
}) {
  // The two paths worth contrasting: the cheapest and what it saves against.
  const cheapest = [...options].sort((a, b) => a.deductible - b.deductible)[0];
  const dearest = [...options].sort((a, b) => b.deductible - a.deductible)[0];
  const showCompare = cheapest && dearest && cheapest.deductible !== dearest.deductible;

  return (
    <section
      className="mt-6 overflow-hidden rounded-2xl border border-[#DCDFE3] bg-white"
      style={{ boxShadow: "var(--att-shadow-1)" }}
      aria-labelledby="advisor-heading"
    >
      {/* AT&T's recommendation cards lead with a brand rule, not a tinted fill. */}
      <div className="h-1 w-full bg-gradient-to-r from-[#00388F] via-[#0057B8] to-[#009FDB]" />

      <div className="p-6">
        <p className="att-eyebrow flex items-center gap-2 text-[#00388F]">
          <Scale className="h-3.5 w-3.5" />
          Claim-to-Upgrade Advisor
        </p>

        <h3 id="advisor-heading" className="att-h3 mt-2">
          {verdict.headline}
        </h3>

        {/* The money, side by side. This is the argument. */}
        {showCompare && (
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-xl border-2 border-[#00388F] bg-[#F2FAFD] p-4">
              <p className="att-eyebrow text-[#00388F]">Recommended</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#00388F]">
                {cheapest.price}
              </p>
              <p className="mt-0.5 text-sm font-bold">{cheapest.title}</p>
              <p className="att-small mt-1">{cheapest.time}</p>
            </div>

            <div className="hidden place-items-center sm:grid">
              <span className="att-eyebrow rotate-0">vs</span>
            </div>

            <div className="rounded-xl border border-[#DCDFE3] p-4">
              <p className="att-eyebrow">Other path</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{dearest.price}</p>
              <p className="mt-0.5 text-sm font-bold">{dearest.title}</p>
              <p className="att-small mt-1">{dearest.time}</p>
            </div>
          </div>
        )}

        <p className="mt-5 text-[15px] leading-relaxed text-[#1D2329]">{verdict.reasoning}</p>

        {recommended && (
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#0072B2]">
            <ArrowRight className="h-4 w-4" />
            {recommended.title} is preselected below — change it if you&rsquo;d rather not
          </p>
        )}

        {trace && <WhyThisDecision trace={trace} />}
      </div>

      <div className="flex items-start gap-2 border-t border-[#DCDFE3] bg-[#F3F4F6] px-6 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00388F]" />
        <p className="att-small">
          A store associate confirms the final path with you before anything is actioned. Fees are
          set by {ASURION.short} and charged to your AT&amp;T bill only once a claim is approved.
        </p>
      </div>
    </section>
  );
}
