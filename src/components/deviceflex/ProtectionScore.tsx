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
  Info,
} from "lucide-react";
import {
  scoreBand,
  computeProtectionScore,
  protectionPosture,
  runProactiveScan,
  type Nudge,
} from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import { InfoTip } from "@/components/att/InfoTip";
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
  // Addition ② — the same posture the fraud gate and enrolment read.
  const posture = protectionPosture(score, member.devices);
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
          <p className="att-eyebrow flex items-center gap-1">
            Household Protection Score
            {/* ADDITION ② — the closed loop, behind an (i).
                It earns a mention but not permanent space: it is interesting the first time
                and clutter every time after, which is exactly what att.com puts behind one
                of these. The mechanism wording still lives on `posture.effects` for the
                judges' impact page; this is the member's reading of the same state. */}
            <InfoTip label="What your Protection Score changes" title="What your score changes">
              <span className="block space-y-2.5">
                {posture.memberEffects.map((e) => (
                  <span key={e.title} className="flex gap-2">
                    {e.good ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1F7A3D]" />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#9E5D00]" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold leading-snug">{e.title}</span>
                      <span className="att-small block leading-snug">{e.detail}</span>
                    </span>
                  </span>
                ))}
                <span className="att-small block border-t border-[#DCDFE3] pt-2.5">
                  Backing up your devices, fitting screen protectors and keeping everything covered
                  all raise your score — and these get better as it goes up.
                </span>
              </span>
            </InfoTip>
          </p>
          <p className="att-h3 mt-0.5" style={{ color: band.tone }}>
            {band.label}
          </p>
          <p className="att-small mt-1 max-w-md">
            {nudges.length === 0
              ? "Nothing needs your attention — everything's covered, backed up and healthy."
              : "Protection that works every month, not only when something breaks."}
          </p>
          {/*
            ADDITION 2 on the surface. The score is a thermostat, not a thermometer —
            it sets the thresholds the engine reads next time. That was only visible
            behind the info tip, so the strongest claim in the set was the easiest to
            miss.
          */}
          <p className="att-small mt-2 max-w-md font-bold text-[var(--color-att-link)]">
            {posture.memberSummary}
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

  // The card lives in a 360px rail, so the action sits *under* the copy rather than
  // beside it. Side-by-side left the text about 110px wide and broke it one word
  // per line — the layout, not the wording, was what made these unreadable.
  return (
    <div className="group relative rounded-xl border border-[#DCDFE3] p-3 transition-colors hover:border-[#00388F]">
      <button
        aria-label="Dismiss this recommendation"
        onClick={() => dismissNudge(nudge.id)}
        className="absolute right-1.5 top-1.5 rounded p-1 text-[#878C94] opacity-0 transition hover:bg-[#F3F4F6] hover:text-[#686E74] focus:opacity-100 group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
          style={{ background: `${tone}14` }}
        >
          <Icon className="h-4 w-4" style={{ color: tone }} />
        </span>
        <div className="min-w-0 flex-1 pr-5">
          <p className="text-[13px] font-bold leading-snug text-[#1D2329]">{nudge.text}</p>
          <p className="att-small mt-1 leading-snug">{nudge.detail}</p>
          {a && (
            <button
              onClick={run}
              disabled={busy}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0072B2] hover:underline disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…
                </>
              ) : (
                <>
                  {a.kind === "battery" ? "Run diagnostics" : a.label}
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
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
