// Eligibility & Fraud Agent, run as a dialog.
//
// Three things were wrong with the inline version this replaces:
//
//   1. It sat in the page, under a form, so it read as a status widget rather than as
//      something being *performed*. An agent doing consequential work deserves the
//      screen while it does it.
//   2. It resolved in about 900ms per check — too fast to follow, let alone present. A
//      panellist could not see what was being interrogated, only that something had
//      happened. Each check now takes a real beat, and shows its individual operations
//      ticking off underneath.
//   3. It suspended the line and blocklisted the IMEI automatically, as the last item in
//      the list. That is the one destructive act in the whole flow — the handset stops
//      working on every US carrier — and it happened without asking. It is now a separate
//      consented step, refused outright when the network disputes the report.
//
// The pacing constants are deliberate, not padding: the modal is the demo's most-watched
// screen and the work it narrates is real work in a deployed system.
import { useEffect, useRef, useState } from "react";
import { Overlay } from "@/components/att/Modal";
import {
  Check,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  RadioTower,
  MapPin,
  X,
  ShieldX,
  Ban,
  Info,
  Sparkles,
} from "lucide-react";
import type { Corroboration, FraudSignal, FraudVerdict, SuspensionPlan } from "@/lib/ai";
import { ASURION } from "@/data/deductibles";

/** Per-operation dwell. Four or five of these make a check feel like a check. */
const STEP_MS = 520;
/** Held after the last operation so the conclusion has a moment to land. */
const SETTLE_MS = 620;

type Phase = "checks" | "consent" | "suspending" | "done";

export function EligibilityAgentModal({
  signals,
  verdict,
  corroboration,
  plan,
  onClose,
  onComplete,
}: {
  signals: FraudSignal[];
  verdict: FraudVerdict;
  corroboration?: Corroboration | null;
  /** Null for claim types that never touch the line (damage, malfunction, battery). */
  plan: SuspensionPlan | null;
  onClose: () => void;
  /** Fires once the member has a final answer. `suspended` records what they consented to. */
  onComplete: (v: FraudVerdict, suspended: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("checks");
  const [checkIndex, setCheckIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [suspendStep, setSuspendStep] = useState(0);
  const [suspended, setSuspended] = useState(false);
  const fired = useRef(false);

  const current = signals[checkIndex];
  const total = signals.length;

  // Walk operations within a check, then move to the next check.
  useEffect(() => {
    if (phase !== "checks" || !current) return;
    const last = stepIndex >= current.steps.length;
    const t = setTimeout(
      () => {
        if (!last) {
          setStepIndex((i) => i + 1);
          return;
        }
        if (checkIndex + 1 < total) {
          setCheckIndex((i) => i + 1);
          setStepIndex(0);
        } else {
          // Every check has run. If the claim can touch the line, stop and ask.
          setPhase(plan ? "consent" : "done");
        }
      },
      last ? SETTLE_MS : STEP_MS,
    );
    return () => clearTimeout(t);
  }, [phase, checkIndex, stepIndex, current, total, plan]);

  const SUSPEND_STEPS = [
    "Suspending the line with the network",
    "Submitting the IMEI to the national blocklist",
    "Notifying Asurion and attaching it to your claim",
    "Confirming the device can no longer be activated",
  ];

  useEffect(() => {
    if (phase !== "suspending") return;
    if (suspendStep >= SUSPEND_STEPS.length) {
      const t = setTimeout(() => {
        setSuspended(true);
        setPhase("done");
      }, SETTLE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSuspendStep((i) => i + 1), 700);
    return () => clearTimeout(t);
  }, [phase, suspendStep, SUSPEND_STEPS.length]);

  useEffect(() => {
    if (phase === "done" && !fired.current) {
      fired.current = true;
      onComplete(verdict, suspended);
    }
  }, [phase, suspended, verdict, onComplete]);

  const progress =
    phase === "done"
      ? 1
      : phase === "consent" || phase === "suspending"
        ? 0.85
        : (checkIndex + stepIndex / Math.max(1, current?.steps.length ?? 1)) / Math.max(1, total);

  return (
    <Overlay
      open
      onClose={onClose}
      label="Eligibility and fraud checks"
      className="flex max-h-[90vh] max-w-[620px] flex-col overflow-hidden"
    >
      {/* Head */}
      <div className="flex items-start gap-3 border-b border-[#DCDFE3] px-6 py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
          <ShieldCheck className="h-5 w-5 text-[#0072B2]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="att-eyebrow">Eligibility &amp; Fraud Agent</p>
          <h2 className="att-h3 mt-0.5">
            {phase === "checks"
              ? "Verifying your claim"
              : phase === "consent"
                ? "One thing to confirm"
                : phase === "suspending"
                  ? "Securing your device"
                  : "Verification complete"}
          </h2>
        </div>
        {phase !== "suspending" && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#686E74] hover:bg-[#F3F4F6]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="h-1 w-full bg-[#DCDFE3]">
        <div
          className="h-full bg-[#009FDB] transition-[width] duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {/* ── Checks ─────────────────────────────────────────────── */}
        {phase === "checks" && (
          <>
            <p className="att-small">
              Running {total} checks before anything happens to your line. Each one reads a real
              system.
            </p>
            <ol className="mt-4 space-y-2.5">
              {signals.map((s, i) => (
                <CheckRow
                  key={s.id}
                  signal={s}
                  state={i < checkIndex ? "done" : i === checkIndex ? "active" : "waiting"}
                  stepIndex={i === checkIndex ? stepIndex : 0}
                />
              ))}
            </ol>
          </>
        )}

        {/* ── Consent — the gate before anything irreversible ────── */}
        {phase === "consent" && plan && <ConsentPanel plan={plan} corroboration={corroboration} />}

        {/* ── Suspending ─────────────────────────────────────────── */}
        {phase === "suspending" && (
          <>
            <p className="att-small">
              This takes a few seconds. Please don&rsquo;t close the page.
            </p>
            <ol className="mt-4 space-y-2.5">
              {SUSPEND_STEPS.map((s, i) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
                    {i < suspendStep ? (
                      <Check className="h-4 w-4 text-[#1F7A3D]" />
                    ) : i === suspendStep ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#0072B2]" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[#DCDFE3]" />
                    )}
                  </span>
                  <span
                    className={`text-sm ${i <= suspendStep ? "font-bold text-[#1D2329]" : "text-[#878C94]"}`}
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}

        {/* ── Done ───────────────────────────────────────────────── */}
        {phase === "done" && (
          <>
            <div
              className={`rounded-xl border p-4 ${
                verdict.outcome === "approved"
                  ? "border-[#BFE3CB] bg-[#EAF7EE]"
                  : "border-[#E8D3A8] bg-[#FFF3E0]"
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-extrabold">
                {verdict.outcome === "approved" ? (
                  <ShieldCheck className="h-4 w-4 text-[#1F7A3D]" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-[#9E5D00]" />
                )}
                {verdict.headline}
              </p>
              <p className="mt-1.5 text-sm text-[#1D2329]">{verdict.detail}</p>
            </div>

            {corroboration && !corroboration.advisory && (
              <CorroborationPanel corr={corroboration} />
            )}

            {plan && (
              <div
                className={`mt-4 rounded-xl border p-4 ${
                  suspended ? "border-[#DCDFE3] bg-[#F3F4F6]" : "border-[#E8D3A8] bg-[#FFF3E0]"
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  {suspended ? (
                    <Ban className="h-4 w-4 text-[#1D2329]" />
                  ) : (
                    <Info className="h-4 w-4 text-[#9E5D00]" />
                  )}
                  {suspended ? "Line suspended · IMEI blocked" : "Your line is still active"}
                </p>
                <p className="mt-1 text-sm text-[#1D2329]">
                  {suspended
                    ? `${plan.line} is suspended and ${plan.imei} is on the national blocklist. Your number moves to the replacement device.`
                    : plan.allowed
                      ? "You chose not to suspend it yet. You can still continue with your claim, and block the device later from your account or by calling Asurion."
                      : plan.blockedReason}
                </p>
              </div>
            )}

            <p className="att-small mt-4">
              Findings are submitted to {ASURION.administrator}, who administers Protect Advantage
              and fulfils the claim.
            </p>
          </>
        )}
      </div>

      {/* Foot */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#DCDFE3] bg-[#F3F4F6] px-6 py-4">
        {phase === "checks" && (
          <span className="mr-auto flex items-center gap-2 text-xs font-bold text-[#0072B2]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Check {Math.min(checkIndex + 1, total)} of {total}
          </span>
        )}

        {phase === "consent" && plan && (
          <>
            <button onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            {plan.allowed ? (
              <>
                <button
                  onClick={() => setPhase("done")}
                  className="text-sm font-bold text-[#0072B2] hover:underline"
                >
                  Not yet — keep my line active
                </button>
                <button onClick={() => setPhase("suspending")} className="btn-primary text-sm">
                  Suspend line &amp; block device
                </button>
              </>
            ) : (
              <button onClick={() => setPhase("done")} className="btn-primary text-sm">
                I understand
              </button>
            )}
          </>
        )}

        {phase === "done" && (
          <button onClick={onClose} className="btn-primary text-sm">
            Continue
          </button>
        )}
      </div>
    </Overlay>
  );
}

/** One check, with its operations ticking off underneath while it runs. */
function CheckRow({
  signal,
  state,
  stepIndex,
}: {
  signal: FraudSignal;
  state: "waiting" | "active" | "done";
  stepIndex: number;
}) {
  return (
    <li
      className={`rounded-xl border px-3.5 py-3 transition-colors ${
        state === "active" ? "border-[#00388F] bg-[#F2FAFD]" : "border-[#DCDFE3]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
          {state === "done" ? (
            signal.level === "review" ? (
              <AlertTriangle className="h-4 w-4 text-[#9E5D00]" />
            ) : (
              <Check className="h-4 w-4 text-[#1F7A3D]" />
            )
          ) : state === "active" ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#0072B2]" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-[#DCDFE3]" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold ${state === "waiting" ? "text-[#878C94]" : "text-[#1D2329]"}`}
          >
            {signal.label}
          </p>

          {state === "active" && (
            <>
              <p className="att-small mt-0.5">{signal.running}</p>
              <ul className="mt-2 space-y-1">
                {signal.steps.map((s, i) => {
                  if (i > stepIndex) return null;
                  const doing = i === stepIndex;
                  return (
                    <li
                      key={s}
                      className={`flex items-start gap-2 text-xs ${doing ? "text-[#1D2329]" : "text-[#686E74]"}`}
                    >
                      <span className="mt-[3px] grid h-3 w-3 shrink-0 place-items-center">
                        {doing ? (
                          <Loader2 className="h-3 w-3 animate-spin text-[#0072B2]" />
                        ) : (
                          <Check className="h-3 w-3 text-[#1F7A3D]" />
                        )}
                      </span>
                      <span>{s}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {state === "done" && (
            <>
              <p
                className={`mt-0.5 text-xs ${signal.level === "review" ? "text-[#9E5D00]" : "text-[#686E74]"}`}
              >
                {signal.note}
              </p>
              <p className="mt-1 text-[11px] text-[#878C94]">Source: {signal.source}</p>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * The consent gate. Everything destructive is named before it happens, and the
 * reassurances sit next to the consequences so the choice is informed rather than scary.
 */
function ConsentPanel({
  plan,
  corroboration,
}: {
  plan: SuspensionPlan;
  corroboration?: Corroboration | null;
}) {
  if (!plan.allowed) {
    return (
      <div className="rounded-xl border border-[#E8B4C1] bg-[#FDF3F5] p-4">
        <p className="flex items-center gap-2 text-sm font-extrabold text-[#C70032]">
          <ShieldX className="h-4 w-4" />
          We&rsquo;re not going to block this device
        </p>
        <p className="mt-1.5 text-sm text-[#1D2329]">{plan.blockedReason}</p>
        {corroboration && <CorroborationPanel corr={corroboration} />}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[#E8D3A8] bg-[#FFF3E0] p-4">
        <p className="flex items-center gap-2 text-sm font-extrabold text-[#7A4A00]">
          <AlertTriangle className="h-4 w-4" />
          This step is hard to undo
        </p>
        <p className="mt-1.5 text-sm text-[#1D2329]">{plan.warning}</p>
      </div>

      <p className="mt-4 text-sm font-extrabold">What happens if you continue</p>
      <ul className="mt-2 space-y-2">
        {plan.consequences.map((c) => (
          <li key={c} className="flex gap-2.5 text-sm text-[#1D2329]">
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-[#C70032]" />
            <span>{c}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm font-extrabold">What doesn&rsquo;t change</p>
      <ul className="mt-2 space-y-2">
        {plan.reassurances.map((r) => (
          <li key={r} className="flex gap-2.5 text-sm text-[#1D2329]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1F7A3D]" />
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <p className="att-small mt-4">
        You can continue your claim either way — blocking the device is your call, not a condition
        of being covered.
      </p>
    </>
  );
}

/** MECHANISM 1, made visible — carrier telemetry deciding a claim. */
function CorroborationPanel({ corr }: { corr: Corroboration }) {
  const tone =
    corr.outcome === "contradicted"
      ? { border: "border-[#E8B4C1]", bg: "bg-[#FDF3F5]", ink: "text-[#C70032]" }
      : corr.outcome === "corroborated"
        ? { border: "border-[#BFE3CB]", bg: "bg-[#EAF7EE]", ink: "text-[#1F7A3D]" }
        : { border: "border-[#DCDFE3]", bg: "bg-[#F3F4F6]", ink: "text-[#686E74]" };

  return (
    <div className={`mt-4 rounded-2xl border ${tone.border} ${tone.bg} p-4`}>
      <div className="flex items-center gap-2">
        <RadioTower className={`h-4 w-4 ${tone.ink}`} />
        <p className="att-eyebrow">AT&amp;T network corroboration</p>
        {!corr.advisory && (
          <span className="ml-auto text-xs font-bold text-[#686E74]">
            {Math.round(corr.confidence * 100)}% confidence
          </span>
        )}
      </div>
      <p className={`mt-2 text-sm font-extrabold ${tone.ink}`}>{corr.headline}</p>
      <ul className="mt-2 space-y-1.5">
        {corr.reasons.map((r) => (
          <li key={r} className="flex gap-2 text-sm text-[#1D2329]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#686E74]" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#686E74]">
        <MapPin className="h-3 w-3" />
        Last seen {corr.lastSeen} · cell site {corr.cellSite}
      </p>
      <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-[#686E74]">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
        Read from AT&amp;T&rsquo;s own network records. A protection administrator that
        doesn&rsquo;t run a network has no equivalent — it can only ask you to fill in a form.
      </p>
    </div>
  );
}
