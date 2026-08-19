// Household Protection Score — the monthly-utility surface for Agent 5 (Proactive Care).
// The score is derived from device state on every render, so it moves the moment
// the member actually fixes something. Each recommendation does real work.
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
} from "lucide-react";
import { scoreBand, computeProtectionScore, runProactiveScan, type Nudge } from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import type { Member } from "@/data/member";

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
  warning: "#B26A00",
  info: "#0057B8",
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

  return (
    <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
      <div className={compact ? "flex items-center gap-5" : "text-center"}>
        <Ring score={score} tone={band.tone} size={compact ? 104 : 144} />
        <div className={compact ? "min-w-0 text-left" : ""}>
          <p className="text-sm font-bold text-[#686E74]">Household Protection Score</p>
          <p className="mt-0.5 text-xl font-extrabold" style={{ color: band.tone }}>
            {band.label}
          </p>
          <p className="mt-1 text-xs text-[#686E74]">
            {nudges.length === 0
              ? "Nothing needs your attention — everything's covered, backed up and healthy."
              : "Protection that works every month — not only when something breaks."}
          </p>
        </div>
      </div>

      {nudges.length > 0 && (
        <div className="mt-5 border-t border-[#DCDFE3] pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
            Recommended actions
          </p>
          <ul className="mt-3 space-y-2">
            {nudges.map((n) => (
              <li key={n.id}>
                <NudgeRow nudge={n} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function NudgeRow({ nudge }: { nudge: Nudge }) {
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
      navigate({ to: "/myatt/claims/new", search: { device: a.deviceId } as never });
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

  const body = (
    <>
      <span
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
        style={{ background: `${tone}14` }}
      >
        <Icon className="h-4 w-4" style={{ color: tone }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold leading-snug">{nudge.text}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-[#686E74]">{nudge.detail}</span>
      </span>
    </>
  );

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
    <div className="group flex items-start gap-3 rounded-xl border border-[#DCDFE3] p-3 hover:border-[#0057B8]">
      {body}
      <div className="flex shrink-0 items-center gap-1">
        {a && (
          <button
            onClick={run}
            disabled={busy}
            className="whitespace-nowrap text-xs font-bold text-[#0057B8] hover:underline disabled:opacity-60"
          >
            {busy ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…
              </span>
            ) : (
              <>
                {a.label} <ChevronRight className="inline h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
        <button
          aria-label="Dismiss this recommendation"
          onClick={() => dismissNudge(nudge.id)}
          className="rounded p-1 text-[#B7BFC7] opacity-0 transition hover:bg-[#F3F4F6] hover:text-[#686E74] focus:opacity-100 group-hover:opacity-100"
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
    <div
      className="relative shrink-0"
      style={{ width: size, height: size, margin: size > 120 ? "16px auto" : undefined }}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
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
          <p className="font-extrabold leading-none tabular-nums" style={{ fontSize: size * 0.28 }}>
            {score}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#686E74]">/ 100</p>
        </div>
      </div>
    </div>
  );
}
