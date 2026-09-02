// Remote Phone Diagnostics, run from a dialog.
//
// Opened from three places — the Protection Score, the enrolment flow's condition
// check, and the claim flow — because all three are asking the same question in
// different words: is this device sound? Running it live, pass by pass, is the
// point: an inspection that resolves in one frame doesn't read as an inspection.
import { useEffect, useRef, useState } from "react";
import { Overlay } from "@/components/att/Modal";
import {
  X,
  Check,
  AlertTriangle,
  XCircle,
  Loader2,
  Cpu,
  BatteryMedium,
  ScanEye,
  Fingerprint,
  Sparkle,
} from "lucide-react";
import { runDiagnostics, dwellFor, type DiagnosticReport } from "@/lib/diagnostics";
import type { MemberDevice } from "@/data/member";

const PASS_ICON = {
  sensors: Cpu,
  system: BatteryMedium,
  visual: ScanEye,
  identity: Fingerprint,
} as const;

export function DiagnosticsModal({
  device,
  hasPhotos = false,
  onClose,
  onComplete,
}: {
  device: MemberDevice;
  hasPhotos?: boolean;
  onClose: () => void;
  onComplete?: (r: DiagnosticReport) => void;
}) {
  const report = useRef<DiagnosticReport>(runDiagnostics(device, hasPhotos)).current;
  const flat = report.passes.flatMap((p) => p.checks.map((c) => ({ ...c, pass: p.id })));

  const [started, setStarted] = useState(false);
  const [i, setI] = useState(-1);
  const done = started && i >= flat.length;
  const fired = useRef(false);

  useEffect(() => {
    if (!started || i < 0 || i >= flat.length) return;
    const t = setTimeout(() => setI((n) => n + 1), dwellFor(flat[i]));
    return () => clearTimeout(t);
  }, [started, i, flat]);

  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onComplete?.(report);
    }
  }, [done, onComplete, report]);

  // Escape closes, and focus is trapped to the dialog's own close button on open.
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const globalIndex = (passId: string, checkId: string) =>
    flat.findIndex((f) => f.pass === passId && f.id === checkId);

  return (
    <Overlay open onClose={onClose} labelledBy="diag-title" className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-[#DCDFE3] p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
          <Cpu className="h-5 w-5 text-[#00388F]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="att-eyebrow">Remote diagnostics</p>
          <h2 id="diag-title" className="att-h3 mt-1">
            {device.brand} {device.name}
          </h2>
          <p className="att-small mt-1">
            {flat.length} checks across hardware, battery, housing and identity — about 15 seconds,
            all from this device.
          </p>
        </div>
        <button
          ref={closeRef}
          aria-label="Close diagnostics"
          onClick={onClose}
          className="rounded-full p-1.5 text-[#686E74] hover:bg-[#F3F4F6]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[52vh] overflow-y-auto p-6">
        {!started ? (
          <div className="text-center">
            <p className="att-body mx-auto max-w-md">
              We&rsquo;ll read this device&rsquo;s sensors, battery controller and system logs, run
              the vision model over any photos, and confirm its identity against the line on your
              account. Nothing leaves your account.
            </p>
            <ul className="mx-auto mt-5 grid max-w-md gap-2 text-left">
              {report.passes.map((p) => {
                const Icon = PASS_ICON[p.id];
                return (
                  <li
                    key={p.id}
                    className="flex items-start gap-3 rounded-xl border border-[#DCDFE3] p-3"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#00388F]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{p.title}</span>
                      <span className="att-small block">{p.blurb}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <button
              onClick={() => {
                setStarted(true);
                setI(0);
              }}
              className="btn-primary mt-6"
            >
              Run diagnostics
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Live progress, then the result summary — the shape AT&T's own device
                  health check uses: a percentage ring with the current operation named
                  underneath while it runs, and Passed / Failed / Warnings counts once it
                  settles. A list of ticks alone never answers "so is it healthy?". */}
            <HealthIndicator
              running={!done}
              percent={
                done
                  ? report.healthScore
                  : Math.round((Math.min(i, flat.length) / flat.length) * 100)
              }
              label={done ? "Healthy" : "Progress"}
              caption={done ? report.headline : (flat[Math.min(i, flat.length - 1)]?.running ?? "")}
              passed={flat.filter((c) => c.status === "pass").length}
              failed={report.failures.length}
              warnings={report.warnings.length}
              revealed={done}
            />

            {report.passes.map((p) => {
              const Icon = PASS_ICON[p.id];
              const idxs = p.checks.map((c) => globalIndex(p.id, c.id));
              const passDone = idxs.every((n) => n < i);
              const passActive = idxs.some((n) => n === i);
              return (
                <section key={p.id}>
                  <p className="flex items-center gap-2 text-sm font-extrabold">
                    <Icon
                      className={`h-4 w-4 ${passDone || passActive ? "text-[#00388F]" : "text-[#878C94]"}`}
                    />
                    {p.title}
                    {passActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00388F]" />}
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {p.checks.map((c) => {
                      const n = globalIndex(p.id, c.id);
                      const state = n < i ? "done" : n === i ? "active" : "wait";
                      return (
                        <li
                          key={c.id}
                          className={`flex items-start gap-3 rounded-lg px-3 py-2 ${state === "active" ? "bg-[#F3F4F6]" : ""}`}
                        >
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
                            {state === "done" ? (
                              c.status === "fail" ? (
                                <XCircle className="h-4 w-4 text-[#C70032]" />
                              ) : c.status === "warn" ? (
                                <AlertTriangle className="h-4 w-4 text-[#9E5D00]" />
                              ) : (
                                <Check className="h-4 w-4 text-[#1F7A3D]" />
                              )
                            ) : state === "active" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00388F]" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#DCDFE3]" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-[13px] font-bold ${state === "wait" ? "text-[#878C94]" : ""}`}
                            >
                              {c.label}
                            </span>
                            {state !== "wait" && (
                              <span
                                className={`block text-xs ${
                                  state === "done" && c.status === "fail"
                                    ? "text-[#C70032]"
                                    : state === "done" && c.status === "warn"
                                      ? "text-[#9E5D00]"
                                      : "text-[#686E74]"
                                }`}
                              >
                                {state === "active" ? c.running : c.result}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Verdict */}
      {done && (
        <div className="border-t border-[#DCDFE3] p-6">
          <div
            className={`rounded-xl border p-4 ${
              report.condition === "damaged"
                ? "border-[#F0C2CE] bg-[#FDF3F5]"
                : report.condition === "impaired"
                  ? "border-[#E8D3A8] bg-[#FFF3E0]"
                  : "border-[#BFE3CB] bg-[#EAF7EE]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-2 text-base font-extrabold">
                <Sparkle className="h-4 w-4 text-[#00388F]" />
                {report.headline}
              </p>
              <span className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-bold tabular-nums">
                Hardware health {report.healthScore}/100
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{report.summary}</p>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </div>
        </div>
      )}
    </Overlay>
  );
}

/**
 * The health readout: a progress ring that becomes a score ring.
 *
 * While the run is in flight it shows how far through it is and names the operation
 * currently executing. When it settles, the same ring holds the hardware-health score and
 * three counts appear beside it — passed, failed, warnings — which is the summary a
 * member (or a store associate) actually reads.
 *
 * Colour comes from the score, not from a fixed brand blue: a 33% result rendered in
 * cheerful cyan would be misleading.
 */
function HealthIndicator({
  running,
  percent,
  label,
  caption,
  passed,
  failed,
  warnings,
  revealed,
}: {
  running: boolean;
  percent: number;
  label: string;
  caption: string;
  passed: number;
  failed: number;
  warnings: number;
  revealed: boolean;
}) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, percent));
  const tone = running ? "#009FDB" : pct >= 80 ? "#1F7A3D" : pct >= 50 ? "#9E5D00" : "#C70032";

  return (
    <div className="rounded-2xl border border-[#DCDFE3] bg-[#F2FAFD] p-5">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative grid h-[92px] w-[92px] shrink-0 place-items-center">
          <svg viewBox="0 0 84 84" className="h-[92px] w-[92px] -rotate-90">
            <circle cx="42" cy="42" r={R} fill="none" stroke="#DCDFE3" strokeWidth="8" />
            <circle
              cx="42"
              cy="42"
              r={R}
              fill="none"
              stroke={tone}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 500ms ease-out, stroke 400ms ease" }}
            />
          </svg>
          <span className="absolute text-center leading-none">
            <span className="block text-[22px] font-extrabold tabular-nums" style={{ color: tone }}>
              {pct}%
            </span>
            <span className="att-small block">{label}</span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {running ? (
            <p className="flex items-center gap-2 text-sm font-bold">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#0072B2]" />
              <span className="min-w-0 truncate">{caption}</span>
            </p>
          ) : (
            <p className="text-sm font-extrabold">{caption}</p>
          )}

          <div
            className={`mt-3 grid grid-cols-3 gap-2 transition-opacity duration-500 ${
              revealed ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!revealed}
          >
            <Tally icon={<Check className="h-4 w-4" />} tone="#1F7A3D" label="Passed" n={passed} />
            <Tally
              icon={<XCircle className="h-4 w-4" />}
              tone="#C70032"
              label="Failed"
              n={failed}
            />
            <Tally
              icon={<AlertTriangle className="h-4 w-4" />}
              tone="#9E5D00"
              label="Warnings"
              n={warnings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Tally({
  icon,
  tone,
  label,
  n,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  n: number;
}) {
  return (
    <div className="rounded-xl border border-[#DCDFE3] bg-white px-3 py-2 text-center">
      <span className="flex items-center justify-center gap-1.5" style={{ color: tone }}>
        {icon}
        <span className="text-lg font-extrabold tabular-nums">{n}</span>
      </span>
      <span className="att-small block">{label}</span>
    </div>
  );
}
