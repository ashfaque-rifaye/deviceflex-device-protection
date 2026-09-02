import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Check,
  X,
  MapPin,
  Clock,
  Loader2,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  PhoneOff,
  Stethoscope,
  FileText,
  CloudCheck,
  CloudOff,
  Info,
  Package,
  BadgeCheck,
  Scale,
  AlertTriangle,
  Sparkle,
  WifiOff,
  Receipt,
  Building2,
  CalendarDays,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { RequireAuth, RequirePlan, useAuth } from "@/lib/auth";
import { CLAIM_REASONS, CLAIM_GROUPS, type ClaimReasonId } from "@/data/deviceflex";
import {
  runDiagnostics,
  resolutionOptions,
  advise,
  fraudCheck,
  fraudVerdict,
  findStores,
  homeRepairWindows,
  planRestore,
  smartRestoreSteps,
  type DamageResult,
  type ClaimOption,
  type Diagnostic,
  type StoreMatch,
  type FraudVerdict,
  corroborateClaim,
  incidentHoursAgo,
  suspensionPlan,
} from "@/lib/ai";
import { telemetryFor } from "@/data/network-signals";
import { decide } from "@/lib/ledger";
import type { Member, MemberDevice, Claim } from "@/data/member";
import type { DiagnosticReport } from "@/lib/diagnostics";
import { analyzeDamage, type AssessResponse } from "@/lib/assess";
import { EligibilityAgentModal } from "@/components/deviceflex/EligibilityAgentModal";
import {
  ReplacementFlow,
  ReplacementConfirmed,
  type ReplacementChoice,
} from "@/components/deviceflex/ReplacementFlow";
import { DeductibleInline } from "@/components/deviceflex/DeductibleCard";
import { AdvisorPanel } from "@/components/deviceflex/AdvisorPanel";
import { DiagnosticsModal } from "@/components/deviceflex/DiagnosticsModal";
import { Field } from "@/components/att/Field";
import { Button } from "@/components/att/Button";
import { StatusPill } from "@/components/att/Feedback";
import { Card } from "@/components/att/Layout";
import { Stepper } from "@/components/att/Stepper";
import { deductibleFor, ASURION } from "@/data/deductibles";
import {
  buildClaimPayload,
  submitClaim,
  daysSince,
  type IncidentDetails,
  type AsurionAck,
} from "@/lib/asurion";
import { toDataUrl } from "@/lib/image";

export const Route = createFileRoute("/myatt/claims/new")({
  validateSearch: (s: Record<string, unknown>) => ({ device: (s.device as string) || "" }),
  component: NewClaim,
});

const REASON_LABEL: Record<ClaimReasonId, Claim["reason"]> = {
  damage: "Accidental damage",
  loss: "Loss",
  theft: "Theft",
  malfunction: "Malfunction",
  battery: "Battery",
};

function NewClaim() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />
      <RequireAuth returnTo="/myatt/claims/new">
        <AccountNav active="Account" />
        <RequirePlan
          title="Filing a claim needs an active plan"
          blurb="AT&T Protect Advantage covers accidental damage, loss, theft and out-of-warranty malfunction."
        >
          <Flow />
        </RequirePlan>
      </RequireAuth>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

const STEPS = ["What happened", "Device", "Assessment", "Your options", "Confirm"];

function Flow() {
  const navigate = useNavigate();
  const { device: preselect } = Route.useSearch();
  const { user, fileClaim, issueGuarantee, record } = useAuth();
  const m = user as Member;
  const covered = m.devices.filter((d) => d.protected);

  const [step, setStep] = useState(0);
  const [reason, setReason] = useState<ClaimReasonId | null>(null);
  /** Which "what happened" group is expanded for its follow-up question. */
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [device, setDevice] = useState<MemberDevice>(
    covered.find((d) => d.id === preselect) ?? covered[0],
  );
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [busy, setBusy] = useState(false);
  const [damage, setDamage] = useState<AssessResponse | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [diagReport, setDiagReport] = useState<DiagnosticReport | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  /** Whether the member consented to suspending the line and blocklisting the IMEI. */
  const [suspended, setSuspended] = useState(false);
  const [incident, setIncident] = useState<IncidentDetails>({});
  const [verdictFraud, setVerdictFraud] = useState<FraudVerdict | null>(null);
  const [ack, setAck] = useState<AsurionAck | null>(null);
  const [option, setOption] = useState<ClaimOption | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [claimId, setClaimId] = useState<string | null>(null);
  /** What the member picked in the Asurion-style replacement journey. */
  const [replacement, setReplacement] = useState<ReplacementChoice | null>(null);

  const cfg = CLAIM_REASONS.find((r) => r.id === reason);
  const incidentAge = daysSince(incident.date);
  const filled = photos.filter(Boolean).length;
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Send the photos to the Damage Assessment Agent. The server function falls back to
  // the deterministic model if the provider is unconfigured or unreachable, so this
  // always resolves to something the flow can continue from.
  const analyzePhotos = async () => {
    const images = photos.filter((p): p is string => !!p);
    if (images.length < 3 || busy) return;
    setBusy(true);
    setPhotoError(null);
    try {
      const result = await analyzeDamage({
        data: {
          images,
          deviceName: device.name,
          screenRisk: device.screenRisk,
          retail: device.retail,
        },
      });
      setDamage(result);
      setStep(3);
    } catch (err) {
      console.error("[claim] assessment failed", err);
      setPhotoError("We couldn't analyse those photos. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };
  // MECHANISM 1 — carrier telemetry, corroborating the report before a human sees it.
  // Run through the ledger (Mechanism 3), so the verdict carries a replayable trace.
  // `now` is frozen per incident-date so the memo stays stable across re-renders and the
  // recorded decision is reproducible.
  const corroboration = useMemo(() => {
    const t = telemetryFor(device.id);
    if (!reason || !t) return null;
    const now = Date.now();
    return decide(
      "corroborateClaim",
      corroborateClaim,
      { reason, telemetry: t, incidentHoursAgo: incidentHoursAgo(incident, now), now },
      `Network corroboration for ${device.name} on a ${reason} claim`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reason, device.id, incident.date, incident.time]);

  // Commit the trace once per distinct decision. `record` de-duplicates by content hash.
  useEffect(() => {
    if (corroboration) record(corroboration.trace);
  }, [corroboration, record]);

  // Verification runs in a dialog the member watches — see <EligibilityAgentModal />.
  const signals = reason ? fraudCheck(m, reason, device, incident, corroboration?.value) : [];
  const onVerified = (v: FraudVerdict, didSuspend: boolean) => {
    setVerdictFraud(v);
    setSuspended(didSuspend);
    setVerified(true);
  };

  // The suspension is a separate consented action, so what the member agreed to has to
  // be tracked separately from whether the checks passed.
  const plan = useMemo(
    () =>
      reason && cfg?.needsIdVerify ? suspensionPlan(m, device, reason, corroboration?.value) : null,
    [reason, cfg, m, device, corroboration],
  );

  // Memoised so the preselect effect below has a stable dependency.
  const options = useMemo(
    () => (reason ? resolutionOptions(device, reason, damage) : []),
    [reason, device, damage],
  );
  // The Advisor's recommendation also goes through the ledger — this is the decision
  // with money attached, so it is the one most worth being able to replay.
  const adviceDecision = useMemo(() => {
    if (!reason) return null;
    return decide(
      "advise",
      (i: {
        device: MemberDevice;
        reason: ClaimReasonId;
        options: ClaimOption[];
        damage: AssessResponse | null;
      }) => advise(i.device, i.reason, i.options, i.damage),
      { device, reason, options, damage },
      `Resolution recommendation for a ${reason} claim on ${device.name}`,
    );
  }, [reason, device, options, damage]);
  const verdict = adviceDecision?.value ?? null;

  useEffect(() => {
    if (adviceDecision) record(adviceDecision.trace);
  }, [adviceDecision, record]);

  // Land on the step with the Advisor's pick already selected — the member confirms
  // a recommendation rather than starting from nothing.
  useEffect(() => {
    if (step !== 3 || option || !options.length) return;
    setOption(options.find((o) => o.recommended) ?? options[0]);
  }, [step, option, options]);

  // Which store list applies depends on what the chosen option needs.
  const need = option?.id === "battery" ? "battery" : option?.id === "repair" ? "repair" : "swap";
  const storeMatches: StoreMatch[] =
    option && option.id !== "home-repair" && option.id !== "ship" ? findStores(device, need) : [];
  const chosenStore = storeMatches.find((s) => s.store.id === storeId) ?? storeMatches[0] ?? null;
  const isHomeRepair = option?.id === "home-repair";
  const isShip = option?.id === "ship";
  /** Paths that hand over a different handset, and so need a device chosen first. */
  const needsReplacement =
    option?.id === "swap" || option?.id === "ship" || option?.id === "upgrade";
  const needsSlot = !isShip;
  const feeDetail = deductibleFor(device, option?.feeKind ?? "replacement");

  const confirm = () => {
    if (!option || !reason) return;
    const where = isShip
      ? "Next-day delivery to the address on file"
      : isHomeRepair
        ? `Technician visit · ${slot}`
        : `${chosenStore?.store.name} · ${slot}`;

    // Everything filed here goes to Asurion — they administer the program, charge the
    // deductible and fulfil the device. One payload, whatever path the member took.
    const payload = buildClaimPayload({
      member: m,
      device,
      reason,
      incident,
      feeKind: option.feeKind,
      resolutionTitle: option.title,
      fulfilment: where,
      assessment: damage
        ? {
            source: damage.source === "model" ? "vision-model" : "diagnostics",
            severity: damage.severity,
            beyondEconomicalRepair: damage.beyondEconomicalRepair,
            findings: damage.detected,
            confidence: damage.confidence,
          }
        : diagReport
          ? {
              source: "diagnostics",
              findings: [...diagReport.failures, ...diagReport.warnings].map(
                (c) => `${c.label}: ${c.result}`,
              ),
            }
          : { source: "attested" },
      identityVerified: verified,
      lineSuspended: verified && (reason === "loss" || reason === "theft"),
      signals: signals.map((sig) => ({ label: sig.label, outcome: sig.note })),
    });
    const receipt = submitClaim(payload);
    setAck(receipt);

    const id = fileClaim({
      device: `${device.name} (${device.owner.split(" ")[0]})`,
      deviceId: device.id,
      reason: REASON_LABEL[reason],
      resolution: option.title,
      detail: `${where} · ${ASURION.short} ref ${receipt.reference} · deductible ${option.price}`,
      status:
        receipt.status === "In review"
          ? "In progress"
          : option.id === "ship"
            ? "In progress"
            : "Booked",
    });
    // A physical replacement earns the "new, not refurbished" certificate.
    if (option.newNotRefurbished) issueGuarantee(device.id);
    setClaimId(id);
    setDone(true);
  };

  if (!covered.length) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-extrabold">No covered devices</h1>
        <p className="mt-2 text-sm text-[#686E74]">
          Add a device to your plan before filing a claim.
        </p>
        <Link to="/myatt/family" className="btn-primary mt-6">
          Manage my devices
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[920px] px-4 py-8 sm:px-6 lg:px-10">
      <Link
        to="/myatt/protection"
        search={{ device: "" }}
        className="inline-flex items-center gap-1 text-sm font-bold text-[#0072B2] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my protection
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">File a claim</h1>

      {!done && (
        <Stepper
          steps={STEPS}
          current={step}
          leading={<FileText className="h-4 w-4" />}
          label="Claim progress"
          className="mt-6"
        />
      )}

      <div className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-6 sm:p-8">
        {/* ── Step 0 — what happened ───────────────────────────────── */}
        {!done && step === 0 && (
          <div>
            <h2 className="att-h3">What happened?</h2>
            <p className="mt-1 text-sm text-[#686E74]">
              Your plan covers damage, loss, theft and out-of-warranty malfunction.
            </p>
            <div className="mt-5 grid gap-3">
              {CLAIM_GROUPS.map((g) => {
                const open = openGroup === g.id;
                return (
                  <div
                    key={g.id}
                    className={`rounded-xl border ${open ? "border-[#00388F] bg-[#E7F5FB]" : "border-[#DCDFE3]"}`}
                  >
                    <button
                      onClick={() => {
                        // One reason means there is nothing to disambiguate — go straight on.
                        if (g.reasons.length === 1) {
                          setReason(g.reasons[0]);
                          setStep(1);
                          return;
                        }
                        setOpenGroup(open ? null : g.id);
                      }}
                      aria-expanded={g.reasons.length > 1 ? open : undefined}
                      className="flex w-full items-start justify-between gap-4 rounded-xl p-4 text-left hover:border-[#0057B8]"
                    >
                      <div>
                        <p className="font-extrabold">{g.title}</p>
                        <p className="mt-0.5 text-sm text-[#686E74]">{g.desc}</p>
                      </div>
                      <ArrowRight
                        className={`mt-1 h-5 w-5 shrink-0 text-[#0072B2] transition-transform ${open ? "rotate-90" : ""}`}
                      />
                    </button>

                    {open && g.followUp && (
                      <div className="border-t border-[#BBDDF0] px-4 pb-4 pt-3">
                        <p className="text-sm text-[#1D2329]">{g.followUp.prompt}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {g.followUp.options.map((o) => (
                            <Button
                              key={o.id}
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setReason(o.id);
                                setStep(1);
                              }}
                            >
                              {o.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 1 — device ──────────────────────────────────────── */}
        {!done && step === 1 && (
          <div>
            <h2 className="att-h3">Which device?</h2>
            <p className="mt-1 text-sm text-[#686E74]">
              Only devices covered by your plan are listed.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {covered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDevice(d)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left ${device.id === d.id ? "border-[#00388F] ring-2 ring-[#00388F]/30" : "border-[#DCDFE3] hover:border-[#0057B8]"}`}
                >
                  <img src={d.image} alt={d.name} className="h-16 w-11 object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{d.name}</p>
                    <p className="text-xs text-[#686E74]">
                      {d.owner} · {d.line}
                    </p>
                    <p className="text-[11px] text-[#686E74]">
                      {d.warranty}
                      {d.nextUp && " · Next Up"}
                    </p>
                    <DeductibleInline device={d} />
                  </div>
                </button>
              ))}
            </div>
            <Nav onBack={back} onNext={() => setStep(2)} />
          </div>
        )}

        {/* ── Step 2a — photos ─────────────────────────────────────── */}
        {!done && step === 2 && cfg?.needsPhotos && (
          <div>
            <h2 className="att-h3">Show us the damage</h2>
            <p className="mt-1 text-sm text-[#686E74]">
              Add 3 photos of your {device.name}. DeviceFlex AI reviews them instantly — no forms.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <label
                  key={i}
                  className="grid aspect-[3/4] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-[#DCDFE3] bg-[#F3F4F6] hover:border-[#0057B8]"
                >
                  {p ? (
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-center text-xs font-bold text-[#686E74]">
                      <Camera className="mx-auto mb-1 h-6 w-6 text-[#0072B2]" />
                      Add photo {i + 1}
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        // Downscaled here so three photos stay well inside the
                        // provider's request ceiling.
                        const url = await toDataUrl(f);
                        setPhotoError(null);
                        setPhotos((ph) => ph.map((x, j) => (j === i ? url : x)));
                      } catch {
                        setPhotoError("That file couldn't be read as an image.");
                      }
                    }}
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#686E74]">{filled}/3 photos added</p>
              <p className="flex items-center gap-1.5 text-xs text-[#686E74]">
                <Sparkle className="h-3.5 w-3.5 text-[#00388F]" />A vision model reads these to
                identify the damage and its severity
              </p>
            </div>
            {photoError && (
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-[#FDE9EE] p-3 text-sm text-[#C70032]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {photoError}
              </p>
            )}
            <Nav
              onBack={back}
              nextLabel={busy ? "Reviewing your photos…" : "Continue"}
              nextDisabled={filled < 3 || busy}
              onNext={analyzePhotos}
              busy={busy}
            />
          </div>
        )}

        {/* ── Step 2b — incident details + verification (loss / theft) ─ */}
        {!done && step === 2 && cfg?.needsIdVerify && (
          <div>
            <h2 className="att-h3">
              {reason === "theft" ? "Report your stolen device" : "Report your lost device"}
            </h2>
            <p className="mt-1 text-sm text-[#686E74]">
              No photos needed. Tell us what you can about the incident, then we'll verify it's you
              and suspend the line so nobody else can use it.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-[#DCDFE3] p-4">
                <p className="text-sm font-extrabold">Device</p>
                <p className="mt-1 text-sm text-[#686E74]">
                  {device.name} · {device.line} · IMEI {device.imei}
                </p>
              </div>

              {/* Incident details — optional, but they sharpen the fraud checks and are
                  exactly what Asurion asks for on the phone. */}
              <div className="rounded-xl border border-[#DCDFE3] p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <CalendarDays className="h-4 w-4 text-[#0072B2]" />
                  Incident details <span className="font-normal text-[#686E74]">(optional)</span>
                </p>
                <p className="mt-1 text-xs text-[#686E74]">
                  Claims must be reported within {ASURION.filingWindowDays} days of the incident. An
                  approximate time is fine.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field
                    type="date"
                    label={`Date it ${reason === "theft" ? "was stolen" : "went missing"}`}
                    value={incident.date ?? ""}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setIncident((x) => ({ ...x, date: e.target.value }))}
                  />
                  <Field
                    type="time"
                    label="Approximate time"
                    value={incident.time ?? ""}
                    onChange={(e) => setIncident((x) => ({ ...x, time: e.target.value }))}
                  />
                </div>
                <label className="mt-3 block">
                  <span className="text-xs font-bold text-[#686E74]">
                    Where it happened, and anything you remember
                  </span>
                  <textarea
                    rows={2}
                    value={incident.circumstances ?? ""}
                    onChange={(e) => setIncident((x) => ({ ...x, circumstances: e.target.value }))}
                    placeholder={
                      reason === "theft"
                        ? "e.g. taken from my bag on the 14 bus, downtown"
                        : "e.g. left it in a taxi coming back from the airport"
                    }
                    className="mt-1.5 w-full resize-y rounded-lg border border-[#DCDFE3] px-3 py-2 text-sm outline-none focus:border-[#00388F]"
                  />
                </label>

                {incidentAge !== null && incidentAge > ASURION.filingWindowDays && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#FFF3E0] p-3 text-xs text-[#7A4A00]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    That's {incidentAge} days ago, past the {ASURION.filingWindowDays}-day reporting
                    window. You can still file — {ASURION.short} will review it rather than
                    approving automatically.
                  </p>
                )}
              </div>

              {reason === "theft" && (
                <div className="rounded-xl border border-[#DCDFE3] p-4">
                  <Field
                    label="Police report number (optional)"
                    hint="Format is usually something like DPD-2026-114872."
                    value={incident.policeReport ?? ""}
                    onChange={(e) => setIncident((x) => ({ ...x, policeReport: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* The agent runs in a dialog — it needs the screen while it works, and it
                must stop and ask before suspending the line. */}
            {!verified ? (
              <div className="mt-5 rounded-2xl border border-[#DCDFE3] p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
                    <ShieldCheck className="h-5 w-5 text-[#0072B2]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">Verify your claim</p>
                    <p className="mt-1 text-sm text-[#686E74]">
                      The Eligibility &amp; Fraud Agent runs {signals.length} checks — identity,
                      account standing, your claim history, the device record, the reporting window
                      and AT&amp;T&rsquo;s own network data. It asks before it suspends anything.
                    </p>
                  </div>
                  <button
                    onClick={() => setAgentOpen(true)}
                    className="btn-secondary shrink-0 text-sm"
                  >
                    Start verification
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-[#BFE3CB] bg-[#EAF7EE] p-5">
                <p className="flex items-center gap-2 text-sm font-extrabold text-[#1F7A3D]">
                  <ShieldCheck className="h-4 w-4" />
                  {verdictFraud?.headline ?? "Verified"}
                </p>
                <p className="mt-1.5 text-sm text-[#1D2329]">
                  {suspended
                    ? `Line ${device.line} suspended · IMEI ${device.imei} blocked. Your number moves to the replacement.`
                    : "Your line is still active — you chose not to block the device."}
                </p>
                <button
                  onClick={() => setAgentOpen(true)}
                  className="mt-2 text-xs font-bold text-[#0072B2] hover:underline"
                >
                  Review what was checked
                </button>
              </div>
            )}

            <Nav
              onBack={back}
              nextLabel="See my options"
              nextDisabled={!verified}
              onNext={() => setStep(3)}
            />
          </div>
        )}

        {/* ── Step 2c — remote diagnostics ─────────────────────────── */}
        {!done && step === 2 && cfg?.needsDiagnostics && (
          <div>
            <h2 className="att-h3">Let&rsquo;s inspect the device</h2>
            <p className="att-small mt-1">
              No photos needed for {reason === "battery" ? "a battery issue" : "a malfunction"}. We
              read the sensors, battery controller and system logs straight from your {device.name}{" "}
              — {reason === "battery" ? "true capacity" : "the fault"} shows up in the telemetry.
            </p>

            {!diagReport ? (
              <div className="mt-6 grid place-items-center rounded-2xl border border-[#DCDFE3] bg-[#F3F4F6] p-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white">
                  <Stethoscope className="h-7 w-7 text-[#00388F]" />
                </span>
                <p className="att-body mt-3 max-w-sm">
                  A full hardware inspection — 19 checks across sensors, battery, housing and device
                  identity. About 15 seconds.
                </p>
                <button onClick={() => setDiagOpen(true)} className="btn-primary mt-4">
                  Run diagnostics
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`mt-5 rounded-2xl border p-5 ${
                    diagReport.condition === "damaged"
                      ? "border-[#F0C2CE] bg-[#FDF3F5]"
                      : diagReport.condition === "impaired"
                        ? "border-[#E8D3A8] bg-[#FFF3E0]"
                        : "border-[#BFE3CB] bg-[#EAF7EE]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="att-h4">{diagReport.headline}</p>
                    <span className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-bold tabular-nums">
                      Hardware health {diagReport.healthScore}/100
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{diagReport.summary}</p>
                </div>

                {(diagReport.failures.length > 0 || diagReport.warnings.length > 0) && (
                  <ul className="mt-4 divide-y divide-[#DCDFE3] rounded-xl border border-[#DCDFE3]">
                    {[...diagReport.failures, ...diagReport.warnings].map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 p-3.5 text-sm"
                      >
                        <span className="text-[#686E74]">{c.label}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold ${c.status === "fail" ? "text-[#C70032]" : "text-[#9E5D00]"}`}
                        >
                          {c.status === "fail" ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                          {c.result}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 rounded-xl bg-[#E7F5FB] p-4 text-sm">
                  <b>What that means for this claim:</b>{" "}
                  {reason === "battery"
                    ? device.batteryHealth < 80
                      ? `True capacity is ${device.batteryHealth}%, under the 80% threshold — battery replacement carries no service fee and there's no limit on how often you use it.`
                      : `True capacity is ${device.batteryHealth}%, still above the 80% threshold. A store test settles it, and if it reads under, the replacement is free.`
                    : device.warranty === "In warranty"
                      ? "Hardware fault confirmed. This device is still inside the manufacturer's warranty, so the repair is handled there at no cost and doesn't use a claim."
                      : "Hardware fault confirmed and the manufacturer's warranty has expired — out-of-warranty malfunction is exactly what Protect Advantage covers."}
                </div>

                <button
                  onClick={() => setDiagOpen(true)}
                  className="att-link-arrow mt-3 text-sm"
                  type="button"
                >
                  See all {diagReport.passes.reduce((n, p) => n + p.checks.length, 0)} checks
                </button>
              </>
            )}

            <Nav
              onBack={back}
              nextLabel="See my options"
              nextDisabled={!diagReport}
              onNext={() => setStep(3)}
            />
          </div>
        )}

        {/* ── Step 3 — assessment + the Advisor ────────────────────── */}
        {!done && step === 3 && (
          <div>
            {damage && (
              <>
                {/*
                  Name the path that actually ran. The badge used to say "DeviceFlex AI"
                  either way, which claimed a vision model on runs where the deterministic
                  stand-in produced the verdict — the one place in the flow where the
                  perception layer could be overstated. `fallbackReason` was already being
                  carried here and never shown.
                */}
                <div className="flex flex-wrap items-center gap-2">
                  {damage.source === "model" ? (
                    <StatusPill tone="success" icon={<Sparkle className="h-3.5 w-3.5" />}>
                      Vision model · {Math.round(damage.confidence * 100)}% confidence
                    </StatusPill>
                  ) : (
                    <StatusPill tone="neutral" icon={<Stethoscope className="h-3.5 w-3.5" />}>
                      On-device assessment · {Math.round(damage.confidence * 100)}% confidence
                    </StatusPill>
                  )}
                  <StatusPill tone="warning">{damage.severity} damage</StatusPill>
                  {damage.beyondEconomicalRepair && (
                    <StatusPill tone="danger">Beyond economical repair</StatusPill>
                  )}
                </div>
                <h2 className="att-h3 mt-4">Here's what we found</h2>
                <p className="mt-2 text-sm text-[#686E74]">{damage.summary}</p>
                {damage.source !== "model" && (
                  <p className="att-note mt-3 flex items-start gap-1.5 py-3 text-xs text-[var(--color-att-ink-3)]">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0072B2]" />
                    <span>
                      {damage.fallbackReason
                        ? `${damage.fallbackReason} — this reading came from the device's own diagnostics instead.`
                        : "This reading came from the device's own diagnostics rather than a vision model."}{" "}
                      The deductible and resolution below are unaffected: they are computed from the
                      assessment, whichever produced it.
                    </span>
                  </p>
                )}
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {damage.detected.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0072B2]" />
                      {d}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {verdict && (
              <AdvisorPanel
                verdict={verdict}
                options={options}
                recommended={options.find((o) => o.recommended)}
              />
            )}

            <div className="mt-7 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-extrabold">Choose how to resolve it</h3>
              <p className="text-xs text-[#686E74]">
                Deductibles set by {ASURION.short}, billed to your next AT&amp;T bill
              </p>
            </div>

            <fieldset className="mt-3">
              <legend className="sr-only">Resolution options</legend>
              <div className="grid gap-3">
                {options.map((o) => {
                  const on = option?.id === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`att-choice ${on ? "att-choice-on" : ""}`}
                      data-testid={`option-${o.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="resolution"
                          value={o.id}
                          checked={on}
                          onChange={() => {
                            setOption(o);
                            setStoreId(null);
                            setSlot(null);
                          }}
                          className="att-radio mt-1 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                            <p className="font-extrabold">
                              {o.title}
                              {o.recommended && (
                                <StatusPill tone="info" className="ml-2 whitespace-nowrap">
                                  Recommended
                                </StatusPill>
                              )}
                            </p>
                            <p className="shrink-0 text-right">
                              <span className="block text-lg font-extrabold leading-none">
                                {o.price}
                              </span>
                              <span className="block text-[10px] uppercase tracking-wide text-[#686E74]">
                                {o.feeKind === "screen-repair"
                                  ? "service fee"
                                  : o.feeKind === "replacement"
                                    ? "deductible"
                                    : o.feeKind === "upgrade"
                                      ? "monthly"
                                      : "your cost"}
                              </span>
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-[#686E74]">{o.detail}</p>

                          <dl className="mt-3 grid gap-2 border-t border-[#DCDFE3] pt-3 text-xs sm:grid-cols-3">
                            <div>
                              <dt className="text-[#686E74]">How long</dt>
                              <dd className="font-bold">{o.time}</dd>
                            </div>
                            <div>
                              <dt className="text-[#686E74]">You end up with</dt>
                              <dd className="font-bold">{o.outcome}</dd>
                            </div>
                            <div>
                              <dt className="text-[#686E74]">Without coverage</dt>
                              <dd className="font-bold text-[#C70032]">{o.withoutCoverage}</dd>
                            </div>
                          </dl>

                          {o.newNotRefurbished && (
                            <StatusPill
                              tone="success"
                              icon={<BadgeCheck className="h-3.5 w-3.5" />}
                              className="mt-2"
                            >
                              New, not refurbished — guaranteed
                            </StatusPill>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {!options.some((o) => o.id === "upgrade") && (
              <p className="att-note mt-4 flex items-start gap-2 py-3 text-xs text-[var(--color-att-ink-3)]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0072B2]" />
                <span>
                  Upgrading instead of replacing is offered when a device can&rsquo;t be
                  economically repaired. This one can be, so repair comes first.
                </span>
              </p>
            )}

            <Nav
              onBack={back}
              nextLabel={
                option ? `Continue with ${option.title.toLowerCase()}` : "Select an option"
              }
              nextDisabled={!option}
              onNext={() => setStep(4)}
            />
          </div>
        )}

        {/* ── Step 4a — the replacement journey, Asurion's three screens ──
            Only for paths that actually put a new handset in the member's hands. A
            screen repair keeps the same device, so choosing a model would be nonsense. */}
        {!done && step === 4 && option && needsReplacement && !replacement && (
          <ReplacementFlow device={device} onBack={back} onDone={(c) => setReplacement(c)} />
        )}

        {/* ── Step 4 — confirm, with real store routing ────────────── */}
        {!done && step === 4 && option && (!needsReplacement || replacement) && (
          <div>
            <h2 className="att-h3">Confirm your {option.title.toLowerCase()}</h2>

            {replacement && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#DCDFE3] bg-[#F2FAFD] p-3">
                <img src={replacement.image} alt="" className="h-14 w-10 shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className="att-small font-bold text-[#686E74]">
                    {replacement.path === "upgrade" ? "Upgrading to" : "Replacing with"}
                  </p>
                  <p className="text-sm font-extrabold">{replacement.deviceName}</p>
                  <p className="att-small">
                    {replacement.colorName} · {replacement.storage} · $
                    {replacement.deductible.toFixed(2)} deductible on your next bill
                  </p>
                </div>
                <button
                  onClick={() => setReplacement(null)}
                  className="ml-auto shrink-0 text-xs font-bold text-[#0072B2] hover:underline"
                >
                  Change
                </button>
              </div>
            )}

            {isShip && (
              <p className="mt-2 text-sm text-[#686E74]">
                We'll ship a replacement to your address on file — arriving tomorrow.
              </p>
            )}

            {isHomeRepair && (
              <>
                <p className="mt-2 text-sm text-[#686E74]">
                  A mobile technician comes to you and repairs the screen on site.
                </p>
                <p className="mt-4 text-sm font-bold">Pick a window</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {homeRepairWindows().map((w) => (
                    <button
                      key={w}
                      onClick={() => setSlot(w)}
                      className={`rounded-full border px-4 py-2 text-sm font-bold ${slot === w ? "border-[#00388F] bg-[#E7F5FB] text-[#0072B2]" : "border-[#DCDFE3]"}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </>
            )}

            {!isShip && !isHomeRepair && (
              <>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#0072B2]">
                  <Package className="h-3.5 w-3.5" /> Retail &amp; Inventory Agent
                </p>
                <p className="mt-1 text-sm text-[#686E74]">
                  {storeMatches.length} store{storeMatches.length === 1 ? "" : "s"} near you can
                  handle this. Ranked by stock, then distance.
                </p>
                <div className="mt-3 grid gap-2">
                  {storeMatches.map((sm) => {
                    const active = (chosenStore?.store.id ?? "") === sm.store.id;
                    return (
                      <button
                        key={sm.store.id}
                        onClick={() => {
                          setStoreId(sm.store.id);
                          setSlot(null);
                        }}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left ${active ? "border-[#00388F] bg-[#E7F5FB]" : "border-[#DCDFE3] hover:border-[#0057B8]"}`}
                      >
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0072B2]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold">{sm.store.name}</p>
                          <p className="text-xs text-[#686E74]">
                            {sm.store.address} · {sm.store.miles} mi · {sm.store.hours}
                          </p>
                          <p
                            className={`mt-1 text-xs font-bold ${sm.inStock || need !== "swap" ? "text-[#1F7A3D]" : "text-[#9E5D00]"}`}
                          >
                            {sm.reason}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {chosenStore && (
                  <>
                    <p className="mt-4 text-sm font-bold">
                      Pick a time at {chosenStore.store.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {chosenStore.slots.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSlot(s)}
                          className={`rounded-full border px-4 py-2 text-sm font-bold ${slot === s ? "border-[#00388F] bg-[#E7F5FB] text-[#0072B2]" : "border-[#DCDFE3]"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {option.newNotRefurbished && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#BFE3CB] bg-[#EAF7EE] p-4">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1F7A3D]" />
                <p className="text-sm">
                  <b>New, not refurbished.</b> The device you receive is factory-new and sealed. We
                  issue a written guarantee with its serial number the moment it's handed over — it
                  lives in Manage plan.
                </p>
              </div>
            )}

            <Card className="mt-5 text-sm">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#686E74]">
                <Receipt className="h-3.5 w-3.5" /> What you'll pay
              </p>
              <div className="mt-3 flex items-baseline justify-between border-b border-[#DCDFE3] pb-3">
                <span className="font-bold">
                  {option.feeKind === "screen-repair"
                    ? "Screen repair service fee"
                    : option.feeKind === "replacement"
                      ? `Replacement deductible · Tier ${feeDetail.tier}`
                      : option.feeKind === "upgrade"
                        ? `Upgrade deductible · Tier ${feeDetail.tier}`
                        : "Service fee"}
                </span>
                <span className="text-2xl font-extrabold tabular-nums">{option.price}</span>
              </div>
              <p className="mt-2 text-xs text-[#686E74]">{feeDetail.basis}.</p>
              <div className="mt-3 flex justify-between">
                <span className="text-[#686E74]">Billed to</span>
                <span className="font-bold">Your next AT&amp;T wireless bill</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-[#686E74]">Same fix without coverage</span>
                <span className="font-bold text-[#C70032]">{option.withoutCoverage}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-[#686E74]">Your data</span>
                <span className="text-right font-bold">
                  {option.restore === "none"
                    ? "Stays on your device"
                    : option.restore === "in-store"
                      ? "Smart Restore in store"
                      : "Smart Restore on arrival"}
                </span>
              </div>
            </Card>

            <Nav
              onBack={back}
              nextLabel={
                isShip
                  ? "Confirm replacement"
                  : isHomeRepair
                    ? "Confirm home repair"
                    : "Confirm booking"
              }
              nextDisabled={needsSlot && !slot}
              onNext={confirm}
            />
          </div>
        )}

        {/* ── Done ─────────────────────────────────────────────────── */}
        {done && option && (
          <>
            {/* "Get ready to meet your new phone" comes first when there is a new phone —
                it is what the member actually wants to see. The claim receipt follows. */}
            {replacement && (
              <div className="mb-4">
                <ReplacementConfirmed choice={replacement} device={device} email={m.email} />
              </div>
            )}
            <Confirmation
              option={option}
              device={device}
              slot={slot}
              member={m}
              claimId={claimId}
              ack={ack}
              fraudVerdict={verdictFraud}
              storeName={chosenStore?.store.name ?? null}
              onDashboard={() => navigate({ to: "/myatt/protection", search: { device: "" } })}
            />
          </>
        )}
      </div>

      {diagOpen && (
        <DiagnosticsModal
          device={device}
          hasPhotos={filled > 0}
          onClose={() => setDiagOpen(false)}
          onComplete={(r) => setDiagReport(r)}
        />
      )}

      {agentOpen && reason && (
        <EligibilityAgentModal
          key={`${reason}-${incident.date ?? ""}-${incident.time ?? ""}`}
          signals={signals}
          verdict={fraudVerdict(signals)}
          corroboration={corroboration?.value}
          plan={plan}
          onClose={() => setAgentOpen(false)}
          onComplete={onVerified}
        />
      )}
    </div>
  );
}

// ── Confirmation — Smart Restore is explained where it actually happens ──────
function Confirmation({
  option,
  device,
  slot,
  member,
  claimId,
  ack,
  fraudVerdict: fv,
  storeName,
  onDashboard,
}: {
  option: ClaimOption;
  device: MemberDevice;
  slot: string | null;
  member: Member;
  claimId: string | null;
  ack: AsurionAck | null;
  fraudVerdict: FraudVerdict | null;
  storeName: string | null;
  onDashboard: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const [idx, setIdx] = useState(0);
  const plan = planRestore(device);
  const steps = smartRestoreSteps(plan, `Your new ${device.name}`);
  const guarantee = member.guarantees[0];

  useEffect(() => {
    if (preview && idx < steps.length - 1) {
      const t = setTimeout(() => setIdx((i) => i + 1), 1000);
      return () => clearTimeout(t);
    }
  }, [preview, idx, steps.length]);

  return (
    <div className="py-4 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF7EE]">
        <ShieldCheck className="h-8 w-8 text-[#1F7A3D]" />
      </span>
      <h2 className="mt-4 text-2xl font-extrabold">
        {option.id === "home-repair"
          ? "Home repair booked"
          : option.restore === "on-arrival"
            ? "Replacement on the way"
            : "You're booked"}
      </h2>
      <p className="mt-2 text-sm text-[#686E74]">
        {option.id === "home-repair"
          ? `A technician is on the way — ${slot ?? "today"}. You keep your device, so nothing needs restoring.`
          : option.restore === "on-arrival"
            ? "Your replacement arrives tomorrow."
            : `${option.title} confirmed${slot ? ` for ${slot}` : ""}${storeName ? ` at ${storeName}` : ""}.`}
      </p>
      {claimId && (
        <p className="mt-1 text-xs text-[#686E74]">Claim {claimId} · saved to your account</p>
      )}

      {/* The Asurion handoff, shown rather than implied — they administer the program,
          charge the deductible and fulfil the device. */}
      {ack && (
        <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-[#DCDFE3] p-5 text-left">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#686E74]">
            <Building2 className="h-3.5 w-3.5 text-[#0072B2]" /> Sent to {ASURION.short}
          </p>
          <p className="mt-2 text-sm">
            Your claim has been submitted to <b>{ASURION.administrator}</b>, who administers
            AT&amp;T Protect Advantage and fulfils the replacement.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[#DCDFE3] pt-3 text-xs">
            <div>
              <dt className="text-[#686E74]">{ASURION.short} reference</dt>
              <dd className="font-bold">{ack.reference}</dd>
            </div>
            <div>
              <dt className="text-[#686E74]">Status</dt>
              <dd
                className={`font-bold ${ack.status === "Approved" ? "text-[#1F7A3D]" : "text-[#9E5D00]"}`}
              >
                {ack.status}
              </dd>
            </div>
            <div>
              <dt className="text-[#686E74]">
                {option.feeKind === "screen-repair" ? "Service fee" : "Deductible"}
              </dt>
              <dd className="font-bold">{option.price}</dd>
            </div>
            <div>
              <dt className="text-[#686E74]">Billed to</dt>
              <dd className="font-bold">{ack.billedTo}</dd>
            </div>
          </dl>
          {fv?.outcome === "review" && (
            <p className="mt-3 rounded-lg bg-[#FFF3E0] p-3 text-xs text-[#7A4A00]">{fv.detail}</p>
          )}
          <p className="mt-3 text-[11px] text-[#686E74]">
            Questions about this claim: {ASURION.claimsUrl} or {ASURION.claimsPhone} ·{" "}
            {ASURION.hours}. Underwritten by {ASURION.underwriter}.
          </p>
        </div>
      )}

      {/* New, not refurbished — the certificate, issued */}
      {guarantee && option.newNotRefurbished && (
        <div className="mx-auto mt-6 max-w-lg rounded-2xl border-2 border-[#1F7A3D] p-5 text-left">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1F7A3D]">
            <BadgeCheck className="h-4 w-4" /> New, not refurbished — guaranteed
          </p>
          <p className="mt-2 text-sm">
            Your replacement {guarantee.deviceName} is <b>factory new and sealed</b>. This guarantee
            is on your account.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[#DCDFE3] pt-3 text-xs">
            <div>
              <dt className="text-[#686E74]">Serial</dt>
              <dd className="font-bold">{guarantee.serial}</dd>
            </div>
            <div>
              <dt className="text-[#686E74]">Issued</dt>
              <dd className="font-bold">{guarantee.issued}</dd>
            </div>
            <div>
              <dt className="text-[#686E74]">Condition</dt>
              <dd className="font-bold">{guarantee.condition}</dd>
            </div>
            <div>
              <dt className="text-[#686E74]">Warranty</dt>
              <dd className="font-bold">Full manufacturer term</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Prepare for your visit — the honest pre-swap step */}
      {option.restore === "in-store" && (
        <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-[#DCDFE3] p-5 text-left">
          <p className="text-sm font-extrabold">Prepare for your visit</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              {device.backedUp ? (
                <CloudCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1F7A3D]" />
              ) : (
                <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-[#9E5D00]" />
              )}
              <span>
                Vault backup: <b>{device.lastBackup}</b>
                {!device.backedUp &&
                  " — back up before you go, or Smart Restore has nothing to bring across"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0072B2]" /> Bring the damaged device
              and a photo ID
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0072B2]" /> Your new device is
              configured before you leave
            </li>
          </ul>

          <div className="mt-4 rounded-xl bg-[#E7F5FB] p-3 text-xs">
            <b>What is Smart Restore?</b> When the associate hands you the replacement, your{" "}
            {plan.gb} GB — {plan.photos.toLocaleString()} photos, {plan.messages.toLocaleString()}{" "}
            messages, {plan.apps} apps — are pulled from your AT&amp;T vault onto the new device, in
            under two minutes, in store. Nothing is restored before then, because the new device
            doesn't exist yet.
          </div>

          {!preview ? (
            <button
              onClick={() => {
                setPreview(true);
                setIdx(0);
              }}
              className="btn-secondary mt-4 w-full text-sm"
            >
              <Sparkles className="mr-2 inline h-4 w-4" /> Preview what happens in store
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-[#DCDFE3] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
                In-store preview
              </p>
              <p className="mt-2 text-sm">{steps[idx]}</p>
              <div className="mx-auto mt-3 h-2 w-56 overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className="h-full rounded-full bg-[#00388F] transition-all"
                  style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {option.restore === "on-arrival" && (
        <div className="mx-auto mt-6 max-w-lg rounded-2xl bg-[#E7F5FB] p-4 text-left text-xs">
          <b>What happens next:</b> when your replacement arrives and you sign in, Smart Restore
          automatically pulls your {plan.gb} GB from the AT&amp;T vault onto the new device.
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={onDashboard} className="btn-primary">
          Back to my protection
        </button>
        <Link to="/deviceflex/impact" className="btn-secondary">
          See the business impact
        </Link>
      </div>
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  busy,
  hideNext,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  hideNext?: boolean;
}) {
  return (
    <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#DCDFE3] pt-5">
      <button onClick={onBack} className="btn-secondary">
        Back
      </button>
      {!hideNext && onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className={`btn-primary ${nextDisabled ? "opacity-50" : ""}`}
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {nextLabel}
            </span>
          ) : (
            nextLabel
          )}
        </button>
      )}
    </div>
  );
}
