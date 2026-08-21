// Remote Phone Diagnostics, run from a dialog.
//
// Opened from three places — the Protection Score, the enrolment flow's condition
// check, and the claim flow — because all three are asking the same question in
// different words: is this device sound? Running it live, pass by pass, is the
// point: an inspection that resolves in one frame doesn't read as an inspection.
import { useEffect, useRef, useState } from "react";
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
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="diag-title"
        className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
      >
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
              {flat.length} checks across hardware, battery, housing and identity — about 15
              seconds, all from this device.
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
                We&rsquo;ll read this device&rsquo;s sensors, battery controller and system logs,
                run the vision model over any photos, and confirm its identity against the line on
                your account. Nothing leaves your account.
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
                      {passActive && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00388F]" />
                      )}
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
      </div>
    </div>
  );
}
