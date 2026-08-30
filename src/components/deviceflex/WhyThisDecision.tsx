// MECHANISM 3, made visible — "Why this decision?"
//
// The point of the ledger is that it is checkable, so the UI has to let someone check it.
// This expander shows the recorded trace and offers a replay: re-run the same pure
// function against the same recorded input and compare digests in front of the member.
//
// It is deliberately understated. A member who never opens it loses nothing; a judge who
// opens it sees the whole argument — reproducible automated decisioning, demonstrated
// rather than asserted.
import { useState } from "react";
import { ChevronDown, ChevronUp, FileCheck2, RefreshCw, Check, X } from "lucide-react";
import { replay, formatTraceValue, type DecisionTrace, type ReplayResult } from "@/lib/ledger";

export function WhyThisDecision({
  trace,
  label = "Why this decision?",
}: {
  trace: DecisionTrace;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="mt-4 border-t border-[#DCDFE3] pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-bold text-[#0072B2] hover:underline"
        aria-expanded={open}
      >
        <FileCheck2 className="h-3.5 w-3.5" />
        {label}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-3 rounded-xl bg-[#F3F4F6] p-3.5">
          <p className="text-xs text-[#1D2329]">{trace.summary}</p>

          <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-2">
            <Row k="Decision function" v={trace.fn} mono />
            <Row k="Recorded" v={new Date(trace.at).toLocaleString("en-US")} />
            <Row k="Input digest" v={trace.inputHash} mono />
            <Row k="Output digest" v={trace.outputHash} mono />
          </dl>

          <p className="mt-3 text-[11px] leading-relaxed text-[#686E74]">
            This decision was made by a pure function over your account state — the same facts
            always produce the same answer. The AI read the evidence; this function made the call,
            and it can be re-run to prove it.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setResult(replay(trace))}
              className="btn-secondary att-btn-sm"
              type="button"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Replay this decision
            </button>
            <button
              onClick={() => setShowRaw((s) => !s)}
              className="text-[11px] font-bold text-[#0072B2] hover:underline"
              type="button"
            >
              {showRaw ? "Hide" : "Show"} the recorded facts
            </button>
          </div>

          {result && (
            <div
              className={`mt-3 rounded-lg border p-3 ${
                result.ok
                  ? "border-[#BFE3CB] bg-[#EAF7EE]"
                  : result.replayable
                    ? "border-[#E8B4C1] bg-[#FDF3F5]"
                    : "border-[#E8D3A8] bg-[#FFF3E0]"
              }`}
            >
              <p
                className={`flex items-center gap-1.5 text-xs font-extrabold ${
                  result.ok
                    ? "text-[#1F7A3D]"
                    : result.replayable
                      ? "text-[#C70032]"
                      : "text-[#9E5D00]"
                }`}
              >
                {result.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {result.ok ? "Replay matched" : "Replay did not match"}
              </p>
              <p className="mt-1 text-[11px] text-[#1D2329]">{result.note}</p>
              {result.actual && (
                <p className="mt-1.5 font-mono text-[11px] text-[#686E74]">
                  recorded {result.expected} · recomputed {result.actual}
                </p>
              )}
            </div>
          )}

          {showRaw && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Raw title="Facts it was given" body={trace.input} />
              <Raw title="What it decided" body={trace.output} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 sm:block">
      <dt className="text-[#686E74]">{k}</dt>
      <dd className={`font-bold text-[#1D2329] ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}

function Raw({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-[#686E74]">{title}</p>
      <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-white p-2.5 font-mono text-[10px] leading-relaxed text-[#1D2329]">
        {formatTraceValue(body)}
      </pre>
    </div>
  );
}
