// Eligibility & Fraud Agent, running where the member can watch it.
//
// The old behaviour flipped a device to "blocked" the instant Verify was pressed, which
// reads as theatre — nothing that consequential happens in one frame. This runs each check
// in sequence, shows what it is doing while it does it, and only then commits to a decision.
// The line suspension and blocklist submission are the last steps, not the first, because
// that is the order Asurion actually works in.
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  RadioTower,
  MapPin,
} from "lucide-react";
import type { Corroboration, FraudSignal, FraudVerdict } from "@/lib/ai";
import { ASURION } from "@/data/deductibles";

type Phase = "idle" | "running" | "done";

/**
 * MECHANISM 1, made visible.
 *
 * This panel is the one screen in the prototype that a competitor could not build, and
 * it earns its prominence: it is carrier-side device-presence data deciding a claim.
 * Rendered after the sequence finishes rather than alongside it, so the conclusion lands
 * as a conclusion.
 */
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
        <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
          AT&amp;T network corroboration
        </p>
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
      <p className="mt-1.5 text-[11px] text-[#686E74]">
        Read from AT&amp;T's own network records. A protection administrator that doesn't run a
        network has no equivalent — it can only ask you to fill in a form.
      </p>
    </div>
  );
}

export function FraudCheckRun({
  signals,
  verdict,
  corroboration,
  onComplete,
}: {
  signals: FraudSignal[];
  verdict: FraudVerdict;
  corroboration?: Corroboration | null;
  onComplete: (v: FraudVerdict) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(-1);
  const completed = useRef(false);

  // Walk the checks one at a time. Staggered timings so it reads as work rather than
  // a progress bar — the blocklist submission is deliberately the slowest.
  useEffect(() => {
    if (phase !== "running") return;
    if (index >= signals.length) return;
    const current = signals[index];
    const dwell = current?.id === "blocklist" ? 1500 : current?.id === "identity" ? 1200 : 900;
    const t = setTimeout(() => setIndex((i) => i + 1), dwell);
    return () => clearTimeout(t);
  }, [phase, index, signals]);

  useEffect(() => {
    if (phase === "running" && index >= signals.length && !completed.current) {
      completed.current = true;
      setPhase("done");
      onComplete(verdict);
    }
  }, [phase, index, signals.length, verdict, onComplete]);

  const start = () => {
    if (phase !== "idle") return;
    setPhase("running");
    setIndex(0);
  };

  if (phase === "idle") {
    return (
      <div className="mt-5 rounded-2xl border border-[#DCDFE3] p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
            <ShieldCheck className="h-5 w-5 text-[#0072B2]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Verify your identity</p>
            <p className="mt-1 text-sm text-[#686E74]">
              Before we suspend the line we run {signals.length} checks — identity, account
              standing, your claim limits, the device record
              {signals.some((s) => s.id === "window") ? ", and the reporting window" : ""}. It takes
              about ten seconds.
            </p>
          </div>
          <button onClick={start} className="btn-secondary shrink-0 text-sm">
            Start verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#DCDFE3] p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#0072B2]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
          Eligibility &amp; Fraud Agent
        </p>
        {phase === "running" && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#0072B2]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {Math.min(index + 1, signals.length)} of {signals.length}
          </span>
        )}
      </div>

      <ol className="mt-4 space-y-1">
        {signals.map((s, i) => {
          const state = i < index ? "done" : i === index ? "active" : "waiting";
          return (
            <li
              key={s.id}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                state === "active" ? "bg-[#F3F4F6]" : ""
              }`}
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
                {state === "done" ? (
                  s.level === "review" ? (
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
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-bold ${state === "waiting" ? "text-[#878C94]" : ""}`}
                >
                  {s.label}
                </span>
                {state !== "waiting" && (
                  <span
                    className={`mt-0.5 block text-xs ${
                      state === "done" && s.level === "review" ? "text-[#9E5D00]" : "text-[#686E74]"
                    }`}
                  >
                    {state === "active" ? s.running : s.note}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {phase === "done" && corroboration && !corroboration.advisory && (
        <CorroborationPanel corr={corroboration} />
      )}

      {phase === "done" && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
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
          <p className="mt-2 text-[11px] text-[#686E74]">
            Findings are submitted to {ASURION.administrator}, who administers Protect Advantage and
            fulfils the claim.
          </p>
        </div>
      )}
    </div>
  );
}
