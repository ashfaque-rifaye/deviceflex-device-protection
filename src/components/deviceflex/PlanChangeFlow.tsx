// Changing tier, as the coverage decision it actually is.
//
// The old behaviour swapped the tier on one click, which hid the only part that
// matters: which devices end up covered. Moving up frees seats you can fill; moving
// down takes seats away and something has to give. Either way the bill changes, and
// the customer should see all three of those before they commit.
//
// The rules encoded here are AT&T's, not ours:
//   · Switching tiers is NOT an enrolment. Devices already covered carry over
//     regardless of age — no 30-day test, no Open Enrollment needed.
//   · Devices being newly ADDED do face the enrolment test: inside the 30-day
//     window, or during Open Enrollment, and in good working condition.
//   · Changes take effect on the next bill.
import { useMemo, useState } from "react";
import {
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldOff,
  Stethoscope,
  Receipt,
} from "lucide-react";
import { TIERS, type Tier } from "@/data/deviceflex";
import { TIER_POOL, TIER_VAULT_GB, formatCapacity, type Member } from "@/data/member";
import { assessEnrolment, OPEN_ENROLLMENT, formatDate } from "@/data/eligibility";
import { deviceCondition } from "@/lib/condition";
import { DiagnosticsModal } from "./DiagnosticsModal";

export function PlanChangeFlow({
  member,
  target,
  onClose,
  onConfirm,
}: {
  member: Member;
  target: Tier["id"];
  onClose: () => void;
  onConfirm: (tier: Tier["id"], deviceIds: string[]) => void;
}) {
  const tier = TIERS.find((t) => t.id === target)!;
  const capacity = TIER_POOL[target];
  const currentTier = TIERS.find((t) => t.id === member.tier);

  const covered = member.devices.filter((d) => d.protected);
  const uncovered = member.devices.filter((d) => !d.protected);

  // Already-covered devices carry over free of any eligibility test.
  const [keep, setKeep] = useState<string[]>(covered.slice(0, capacity).map((d) => d.id));
  const [add, setAdd] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [diagFor, setDiagFor] = useState<string | null>(null);
  const [verified, setVerified] = useState<string[]>([]);

  const selected = [...keep, ...add];
  const room = capacity - keep.length;
  const dropped = covered.filter((d) => !keep.includes(d.id));

  const addable = useMemo(
    () =>
      uncovered.map((d) => ({
        device: d,
        verdict: assessEnrolment({
          purchased: d.purchased,
          protectedAlready: false,
          condition: deviceCondition(d),
          conditionVerified: verified.includes(d.id),
        }),
      })),
    [uncovered, verified],
  );

  const delta = tier.price - (member.tierPrice ?? 0);

  const toggleKeep = (id: string) =>
    setKeep((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id]));
  const toggleAdd = (id: string) =>
    setAdd((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const overCapacity = selected.length > capacity;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pc-title"
        className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start gap-4 border-b border-[#DCDFE3] p-6">
          <div className="min-w-0 flex-1">
            <p className="att-eyebrow">Change your plan</p>
            <h2 id="pc-title" className="att-h3 mt-1">
              {currentTier?.name} → {tier.name}
            </h2>
            <p className="att-small mt-1">
              ${tier.price}/mo. · {tier.devices} · {formatCapacity(TIER_VAULT_GB[target])} vault
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#686E74] hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[54vh] overflow-y-auto p-6">
          {/* ── Step 0 — which devices carry over ─────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h3 className="att-h4">Devices already covered</h3>
                <p className="att-small mt-1">
                  These carry over at any age — switching tiers isn&rsquo;t a new enrolment, so the
                  30-day rule doesn&rsquo;t apply to them.
                </p>
                <div className="mt-3 grid gap-2">
                  {covered.map((d) => {
                    const on = keep.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className={`att-choice flex items-center gap-3 !p-4 ${on ? "att-choice-on" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleKeep(d.id)}
                          className="att-checkbox shrink-0"
                        />
                        <img src={d.image} alt="" className="h-12 w-9 shrink-0 object-contain" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">{d.name}</span>
                          <span className="att-small block">{d.owner}</span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${on ? "bg-[#EAF7EE] text-[#1F7A3D]" : "bg-[#FDE9EE] text-[#C70032]"}`}
                        >
                          {on ? "Stays covered" : "Loses cover"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {overCapacity && (
                <p className="flex items-start gap-2 rounded-xl bg-[#FDF3F5] p-3 text-sm text-[#C70032]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {tier.name} covers {capacity} device{capacity > 1 ? "s" : ""} and you&rsquo;ve
                  kept {selected.length}. Uncheck {selected.length - capacity} to continue.
                </p>
              )}

              {/* Room to add — each candidate faces the real eligibility test. */}
              {room > 0 && addable.length > 0 && (
                <div>
                  <h3 className="att-h4">
                    Add a device · {room} seat{room > 1 ? "s" : ""} free
                  </h3>
                  <p className="att-small mt-1">
                    New devices do face the enrolment rules.{" "}
                    {OPEN_ENROLLMENT.active && (
                      <>
                        {OPEN_ENROLLMENT.label} is running until{" "}
                        {formatDate(OPEN_ENROLLMENT.endsOn)}, so age isn&rsquo;t a barrier right
                        now.
                      </>
                    )}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {addable.map(({ device: d, verdict }) => {
                      const on = add.includes(d.id);
                      const blocked = !verdict.eligible;
                      const full = !on && add.length >= room;
                      return (
                        <div
                          key={d.id}
                          className={`att-choice !p-4 ${on ? "att-choice-on" : ""} ${blocked || full ? "opacity-70" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={blocked || full}
                              onChange={() => toggleAdd(d.id)}
                              className="att-checkbox shrink-0 disabled:cursor-not-allowed"
                            />
                            <img
                              src={d.image}
                              alt=""
                              className="h-12 w-9 shrink-0 object-contain"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold">{d.name}</span>
                              <span className="att-small block">{d.owner}</span>
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                blocked
                                  ? "bg-[#FDE9EE] text-[#C70032]"
                                  : "bg-[#EAF7EE] text-[#1F7A3D]"
                              }`}
                            >
                              {blocked ? "Not eligible" : "Eligible"}
                            </span>
                          </div>
                          <p className="att-small mt-2 pl-8">{verdict.detail}</p>
                          {verdict.needsInspection && !blocked && (
                            <div className="mt-2 flex flex-wrap items-center gap-3 pl-8">
                              <p className="att-small flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5 text-[#00388F]" />
                                Needs a condition check before it can be added
                              </p>
                              <button
                                onClick={() => setDiagFor(d.id)}
                                className="btn-secondary att-btn-sm"
                              >
                                <Stethoscope className="h-4 w-4" /> Run diagnostics
                              </button>
                            </div>
                          )}
                          {verified.includes(d.id) && (
                            <p className="mt-2 flex items-center gap-1.5 pl-8 text-xs font-bold text-[#1F7A3D]">
                              <ShieldCheck className="h-3.5 w-3.5" /> Condition verified — good
                              working order
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1 — what it costs ────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h3 className="att-h4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#00388F]" /> What changes on your bill
              </h3>
              <dl className="mt-4 divide-y divide-[#DCDFE3] rounded-xl border border-[#DCDFE3]">
                <Row k={`${currentTier?.name} (current)`} v={`$${member.tierPrice}.00/mo.`} />
                <Row k={`${tier.name} (new)`} v={`$${tier.price}.00/mo.`} strong />
                <Row
                  k={delta === 0 ? "No change" : delta > 0 ? "Increase" : "Saving"}
                  v={`${delta > 0 ? "+" : ""}$${Math.abs(delta).toFixed(2)}/mo.`}
                  tone={delta > 0 ? "up" : delta < 0 ? "down" : undefined}
                />
              </dl>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#DCDFE3] p-4">
                  <p className="att-eyebrow">Covered after the change</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selected.map((id) => {
                      const d = member.devices.find((x) => x.id === id)!;
                      return (
                        <li key={id} className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#1F7A3D]" />
                          {d.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="rounded-xl border border-[#DCDFE3] p-4">
                  <p className="att-eyebrow">Vault</p>
                  <p className="mt-2 text-sm">
                    {formatCapacity(TIER_VAULT_GB[target])} ceiling
                    {target === "family" && ", growing 205 GB per covered device"}
                  </p>
                  <p className="att-eyebrow mt-3">Accessory credits</p>
                  <p className="mt-1 text-sm">
                    {target === "family" ? "2" : target === "plus" ? "1" : "0"} per year
                  </p>
                </div>
              </div>

              {dropped.length > 0 && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#FDF3F5] p-3 text-sm text-[#C70032]">
                  <ShieldOff className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <b>
                      {dropped.map((d) => d.name).join(", ")}{" "}
                      {dropped.length > 1 ? "lose" : "loses"} coverage immediately.
                    </b>{" "}
                    Re-adding later needs an open enrolment window and a device in good working
                    condition.
                  </span>
                </p>
              )}

              <p className="att-small mt-4 flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00388F]" />
                No contract and no cancellation fee. The change appears on your next bill, and
                coverage on kept devices is continuous — it never lapses.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#DCDFE3] p-6">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(0))}
            className="btn-secondary att-btn-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step === 0 ? (
            <button
              onClick={() => setStep(1)}
              disabled={overCapacity || selected.length === 0}
              className="btn-primary att-btn-sm"
            >
              Review <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => onConfirm(target, selected)} className="btn-primary att-btn-sm">
              <Check className="h-4 w-4" /> Confirm change
            </button>
          )}
        </div>
      </div>

      {diagFor && (
        <DiagnosticsModal
          device={member.devices.find((d) => d.id === diagFor)!}
          onClose={() => setDiagFor(null)}
          onComplete={(r) => {
            if (r.condition === "good") setVerified((v) => [...v, diagFor]);
          }}
        />
      )}
    </div>
  );
}

function Row({
  k,
  v,
  strong,
  tone,
}: {
  k: string;
  v: string;
  strong?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <dt className={strong ? "font-bold" : ""}>{k}</dt>
      <dd
        className={`font-extrabold tabular-nums ${tone === "up" ? "text-[#C70032]" : tone === "down" ? "text-[#1F7A3D]" : ""}`}
      >
        {v}
      </dd>
    </div>
  );
}
