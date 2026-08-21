// Household Protection Score — the monthly-utility tile for Agent 5 (Proactive Care).
//
// The score is derived from device state on every render, so it moves the moment the
// member actually fixes something. Every recommendation does real work, and the tile
// carries its own entry into remote diagnostics: a score is a claim about device
// health, and the honest way to back that up is to let someone measure it.
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ShieldOff,
  CloudOff,
  BatteryWarning,
  Trash2,
  Gift,
  ChevronRight,
  Loader2,
  Check,
  X,
  Stethoscope,
} from "lucide-react";
import { scoreBand, computeProtectionScore, runProactiveScan, type Nudge } from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import type { Member, MemberDevice } from "@/data/member";
import { DiagnosticsModal } from "./DiagnosticsModal";

const ICONS = {
  risk: AlertTriangle,
  backup: CloudOff,
  battery: BatteryWarning,
  unprotected: ShieldOff,
  vault: Trash2,
  perk: Gift,
};
const TONES = {
  critical: "#C70032",
  warning: "#9E5D00",
  info: "#00388F",
};

export function ProtectionScore({
  member,
  compact = false,
  limit = 4,
}: {
  member: Member;
  compact?: boolean;
  limit?: number;
}) {
  const score = computeProtectionScore(member);
  const band = scoreBand(score);
  const nudges = runProactiveScan(member).slice(0, limit);
  const [diagFor, setDiagFor] = useState<MemberDevice | null>(null);

  // Diagnostics run against the device most likely to be hiding something.
  const focus =
    member.devices.find((d) => d.protected && d.screenRisk === "High") ??
    member.devices.find((d) => d.protected && d.batteryHealth < 85) ??
    member.devices.find((d) => d.protected) ??
    member.devices[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#DCDFE3] bg-white">
      {/* Tile head — the score sits on AT&T's pale band, not floating on white. */}
      <div className="flex flex-wrap items-center gap-5 bg-[#F2FAFD] p-6">
        <Ring score={score} tone={band.tone} size={compact ? 104 : 120} />
        <div className="min-w-0 flex-1">
          <p className="att-eyebrow">Household Protection Score</p>
          <p className="att-h3 mt-0.5" style={{ color: band.tone }}>
            {band.label}
          </p>
          <p className="att-small mt-1 max-w-md">
            {nudges.length === 0
              ? "Nothing needs your attention — everything's covered, backed up and healthy."
              : "Protection that works every month, not only when something breaks."}
          </p>
        </div>
        {focus && (
          <button onClick={() => setDiagFor(focus)} className="btn-secondary att-btn-sm shrink-0">
            <Stethoscope className="h-4 w-4" />
            Run diagnostics
          </button>
        )}
      </div>

      {nudges.length > 0 && (
        <div className="p-6">
          <p className="att-eyebrow">Recommended actions</p>
          <ul className="mt-3 space-y-2">
            {nudges.map((n) => (
              <li key={n.id}>
                <NudgeRow nudge={n} onDiagnose={setDiagFor} member={member} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {diagFor && (
        <DiagnosticsModal device={diagFor} onClose={() => setDiagFor(null)} onComplete={() => {}} />
      )}
    </section>
  );
}

function NudgeRow({
  nudge,
  onDiagnose,
  member,
}: {
  nudge: Nudge;
  onDiagnose: (d: MemberDevice) => void;
  member: Member;
}) {
  const { backupDevice, addScreenGuard, dismissNudge } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const Icon = ICONS[nudge.icon];
  const tone = TONES[nudge.severity];
  const a = nudge.action;

  const run = () => {
    if (!a || busy) return;
    if (a.kind === "link") {
      navigate({ to: a.to } as never);
      return;
    }
    if (a.kind === "battery") {
      // A battery flag is a hardware question — measure before booking anything.
      const d = member.devices.find((x) => x.id === a.deviceId);
      if (d) onDiagnose(d);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      if (a.kind === "backup") {
        backupDevice(a.deviceId);
        setDone("Backed up");
      }
      if (a.kind === "screenGuard") {
        addScreenGuard(a.deviceId);
        setDone("Guard fitted");
      }
      setBusy(false);
    }, 1200);
  };

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#BFE3CB] bg-[#EAF7EE] p-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white">
          <Check className="h-4 w-4 text-[#1F7A3D]" />
        </span>
        <span className="min-w-0 flex-1 text-[13px] font-bold text-[#1F7A3D]">
          {done} — {nudge.text}
        </span>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-[#DCDFE3] p-3 transition-colors hover:border-[#00388F]">
      <span
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
        style={{ background: `${tone}14` }}
      >
        <Icon className="h-4 w-4" style={{ color: tone }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold leading-snug">{nudge.text}</span>
        <span className="att-small mt-0.5 block leading-snug">{nudge.detail}</span>
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {a && (
          <button
            onClick={run}
            disabled={busy}
            className="whitespace-nowrap text-xs font-bold text-[#0072B2] hover:underline disabled:opacity-60"
          >
            {busy ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…
              </span>
            ) : (
              <>
                {a.kind === "battery" ? "Run diagnostics" : a.label}{" "}
                <ChevronRight className="inline h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
        <button
          aria-label="Dismiss this recommendation"
          onClick={() => dismissNudge(nudge.id)}
          className="rounded p-1 text-[#878C94] opacity-0 transition hover:bg-[#F3F4F6] hover:text-[#686E74] focus:opacity-100 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Ring({ score, tone, size }: { score: number; tone: string; size: number }) {
  const r = 52,
    c = 2 * Math.PI * r,
    off = c - (score / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#FFFFFF" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .6s ease, stroke .3s" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p
            className="font-extrabold leading-none tabular-nums"
            style={{ fontSize: size * 0.28, letterSpacing: "-0.03em" }}
          >
            {score}
          </p>
          <p className="att-eyebrow mt-0.5">/ 100</p>
        </div>
      </div>
    </div>
  );
}
