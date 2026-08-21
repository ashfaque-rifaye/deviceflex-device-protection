// What a claim on this device would actually cost — shown before anything breaks.
//
// This is the whole ideation point. Today a customer finds out the number at the counter,
// after they've already committed. Here it sits on the device page, on the plan page, and
// next to every device in the claim flow, so the decision is informed from the start.
import { Info } from "lucide-react";
import {
  deductibleSummary,
  SCREEN_REPAIR_FEE,
  ASURION,
  type TieredDevice,
} from "@/data/deductibles";

export function DeductibleCard({
  device,
  compact = false,
}: {
  device: TieredDevice;
  compact?: boolean;
}) {
  const d = deductibleSummary(device);

  const rows = [
    {
      label: "Screen & back-glass repair",
      value: "No charge",
      note: "Unlimited, every device tier",
    },
    {
      label: "Replacement — damage, loss or theft",
      value: `$${d.replacement}`,
      note: `Tier ${d.tier} device`,
    },
    { label: "Battery replacement", value: "No charge", note: "Under 80% health" },
    { label: "In-warranty repair", value: "No charge", note: "Handled by the manufacturer" },
  ];

  if (compact) {
    return (
      <p className="text-xs text-[#686E74]">
        If you claim: <b className="text-[#1D2329]">$0 screen repair</b> ·{" "}
        <b className="text-[#1D2329]">${d.replacement} replacement</b>{" "}
        <span className="whitespace-nowrap">(Tier {d.tier})</span>
      </p>
    );
  }

  return (
    <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold">What a claim would cost you</h2>
        <span className="rounded-full bg-[#E7F5FB] px-2.5 py-0.5 text-[11px] font-bold text-[#0057B8]">
          Tier {d.tier} device
        </span>
      </div>
      <p className="mt-1 text-sm text-[#686E74]">
        Known upfront, not at the counter. Set by {ASURION.short} and charged to your AT&amp;T bill
        only when a claim is approved.
      </p>

      <dl className="mt-4 divide-y divide-[#DCDFE3]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="min-w-0">
              <span className="block text-sm font-bold">{r.label}</span>
              <span className="block text-xs text-[#686E74]">{r.note}</span>
            </dt>
            <dd
              className={`shrink-0 text-lg font-extrabold tabular-nums ${
                r.value === "No charge" ? "text-[#1F7A3D]" : ""
              }`}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-[#686E74]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0057B8]" />
        {ASURION.claimLimit} claims. Report within {ASURION.filingWindowDays} days of the incident.
        Repairs at AT&amp;T stores and {ASURION.repairStores}+ {ASURION.repairNetwork} locations.
        Administered by {ASURION.administrator}, underwritten by {ASURION.underwriter}.
      </p>
    </section>
  );
}

/** One-line version for lists of devices. */
export function DeductibleInline({ device }: { device: TieredDevice }) {
  const d = deductibleSummary(device);
  return (
    <span className="whitespace-nowrap text-[11px] text-[#686E74]">
      Free repair · ${d.replacement} replace
    </span>
  );
}
