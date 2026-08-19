import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  CloudCheck,
  CloudOff,
  Info,
  Package,
  BadgeCheck,
  Scale,
  AlertTriangle,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { RequireAuth, RequirePlan, useAuth } from "@/lib/auth";
import { CLAIM_REASONS, type ClaimReasonId } from "@/data/deviceflex";
import {
  assessDamage,
  runDiagnostics,
  resolutionOptions,
  advise,
  fraudCheck,
  findStores,
  homeRepairWindows,
  planRestore,
  smartRestoreSteps,
  type DamageResult,
  type ClaimOption,
  type Diagnostic,
  type StoreMatch,
} from "@/lib/ai";
import type { Member, MemberDevice, Claim } from "@/data/member";

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
          blurb="AT&T Protect Advantage covers accidental damage, loss, theft and out-of-warranty malfunction at a $0 deductible."
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
  const { user, fileClaim, issueGuarantee } = useAuth();
  const m = user as Member;
  const covered = m.devices.filter((d) => d.protected);

  const [step, setStep] = useState(0);
  const [reason, setReason] = useState<ClaimReasonId | null>(null);
  const [device, setDevice] = useState<MemberDevice>(
    covered.find((d) => d.id === preselect) ?? covered[0],
  );
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [busy, setBusy] = useState(false);
  const [damage, setDamage] = useState<DamageResult | null>(null);
  const [diags, setDiags] = useState<Diagnostic[] | null>(null);
  const [verified, setVerified] = useState(false);
  const [option, setOption] = useState<ClaimOption | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [claimId, setClaimId] = useState<string | null>(null);

  const cfg = CLAIM_REASONS.find((r) => r.id === reason);
  const filled = photos.filter(Boolean).length;
  const back = () => setStep((s) => Math.max(0, s - 1));

  const analyzePhotos = () => {
    setBusy(true);
    setTimeout(() => {
      setDamage(assessDamage(device, filled));
      setBusy(false);
      setStep(3);
    }, 1500);
  };
  const doDiagnostics = () => {
    setBusy(true);
    setTimeout(() => {
      setDiags(runDiagnostics(device, reason!));
      setBusy(false);
    }, 1500);
  };
  const verifyIdentity = () => {
    setBusy(true);
    setTimeout(() => {
      setVerified(true);
      setBusy(false);
    }, 1200);
  };

  const options = reason ? resolutionOptions(device, reason, damage) : [];
  const verdict = reason ? advise(device, reason, options, damage) : null;

  // Which store list applies depends on what the chosen option needs.
  const need = option?.id === "battery" ? "battery" : option?.id === "repair" ? "repair" : "swap";
  const storeMatches: StoreMatch[] =
    option && option.id !== "home-repair" && option.id !== "ship" ? findStores(device, need) : [];
  const chosenStore = storeMatches.find((s) => s.store.id === storeId) ?? storeMatches[0] ?? null;
  const isHomeRepair = option?.id === "home-repair";
  const isShip = option?.id === "ship";
  const needsSlot = !isShip;

  const confirm = () => {
    if (!option || !reason) return;
    const where = isShip
      ? "Next-day delivery to the address on file"
      : isHomeRepair
        ? `Technician visit · ${slot}`
        : `${chosenStore?.store.name} · ${slot}`;
    const id = fileClaim({
      device: `${device.name} (${device.owner.split(" ")[0]})`,
      deviceId: device.id,
      reason: REASON_LABEL[reason],
      resolution: option.title,
      detail: where,
      status: option.id === "ship" ? "In progress" : "Booked",
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
        className="inline-flex items-center gap-1 text-sm font-bold text-[#0057B8] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my protection
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">File a claim</h1>

      {!done && (
        <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`flex items-center gap-2 ${i === step ? "text-[#0057B8]" : i < step ? "text-[#1F7A3D]" : "text-[#B7BFC7]"}`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                  i === step
                    ? "bg-[#0057B8] text-white"
                    : i < step
                      ? "bg-[#1F7A3D] text-white"
                      : "bg-[#DCDFE3] text-[#686E74]"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-6 sm:p-8">
        {/* ── Step 0 — what happened ───────────────────────────────── */}
        {!done && step === 0 && (
          <div>
            <h2 className="text-xl font-extrabold">What happened?</h2>
            <p className="mt-1 text-sm text-[#686E74]">
              Your plan covers damage, loss, theft and out-of-warranty malfunction.
            </p>
            <div className="mt-5 grid gap-3">
              {CLAIM_REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setReason(r.id);
                    setStep(1);
                  }}
                  className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-left hover:border-[#0057B8] ${reason === r.id ? "border-[#0057B8] bg-[#E7F5FB]" : "border-[#DCDFE3]"}`}
                >
                  <div>
                    <p className="font-extrabold">{r.title}</p>
                    <p className="mt-0.5 text-sm text-[#686E74]">{r.desc}</p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#0057B8]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1 — device ──────────────────────────────────────── */}
        {!done && step === 1 && (
          <div>
            <h2 className="text-xl font-extrabold">Which device?</h2>
            <p className="mt-1 text-sm text-[#686E74]">
              Only devices covered by your plan are listed.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {covered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDevice(d)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left ${device.id === d.id ? "border-[#0057B8] ring-2 ring-[#0057B8]/30" : "border-[#DCDFE3] hover:border-[#0057B8]"}`}
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
            <h2 className="text-xl font-extrabold">Show us the damage</h2>
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
                      <Camera className="mx-auto mb-1 h-6 w-6 text-[#0057B8]" />
                      Add photo {i + 1}
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const u = URL.createObjectURL(f);
                        setPhotos((ph) => ph.map((x, j) => (j === i ? u : x)));
                      }
                    }}
                  />
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#686E74]">{filled}/3 photos added</p>
            <Nav
              onBack={back}
              nextLabel={busy ? "Analyzing…" : "Analyze with AI"}
              nextDisabled={filled < 3 || busy}
              onNext={analyzePhotos}
              busy={busy}
            />
          </div>
        )}

        {/* ── Step 2b — identity (loss / theft) ────────────────────── */}
        {!done && step === 2 && cfg?.needsIdVerify && (
          <div>
            <h2 className="text-xl font-extrabold">
              {reason === "theft" ? "Report your stolen device" : "Report your lost device"}
            </h2>
            <p className="mt-1 text-sm text-[#686E74]">
              No photos needed. We'll verify it's you, then suspend the line so nobody else can use
              it.
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-[#DCDFE3] p-4">
                <p className="text-sm font-extrabold">Device</p>
                <p className="mt-1 text-sm text-[#686E74]">
                  {device.name} · {device.line} · IMEI {device.imei}
                </p>
              </div>
              {reason === "theft" && (
                <label className="block rounded-xl border border-[#DCDFE3] p-4">
                  <span className="text-sm font-extrabold">
                    Police report number{" "}
                    <span className="font-normal text-[#686E74]">(optional)</span>
                  </span>
                  <input
                    placeholder="e.g. DPD-2026-114872"
                    className="mt-2 w-full rounded-lg border border-[#DCDFE3] px-3 py-2 text-sm outline-none focus:border-[#0057B8]"
                  />
                </label>
              )}
              <div
                className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${verified ? "border-[#1F7A3D] bg-[#EAF7EE]" : "border-[#DCDFE3]"}`}
              >
                <PhoneOff className={`h-5 w-5 ${verified ? "text-[#1F7A3D]" : "text-[#0057B8]"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">
                    {verified ? "Identity verified · line suspended" : "Verify your identity"}
                  </p>
                  <p className="text-xs text-[#686E74]">
                    {verified
                      ? "The device is blocked and can't be used or resold."
                      : "We'll send a one-time code to your account email."}
                  </p>
                </div>
                {!verified && (
                  <button
                    onClick={verifyIdentity}
                    disabled={busy}
                    className="btn-secondary text-sm"
                  >
                    {busy ? "Verifying…" : "Verify"}
                  </button>
                )}
              </div>
            </div>
            {verified && <FraudPanel member={m} reason={reason!} device={device} />}
            <Nav
              onBack={back}
              nextLabel="See my options"
              nextDisabled={!verified}
              onNext={() => setStep(3)}
            />
          </div>
        )}

        {/* ── Step 2c — diagnostics ────────────────────────────────── */}
        {!done && step === 2 && cfg?.needsDiagnostics && (
          <div>
            <h2 className="text-xl font-extrabold">Let's run a quick diagnostic</h2>
            <p className="mt-1 text-sm text-[#686E74]">
              No photos needed for {reason === "battery" ? "battery issues" : "a malfunction"}.
              We'll check the device remotely and confirm what's covered.
            </p>
            {!diags ? (
              <div className="mt-6 grid place-items-center rounded-xl bg-[#F3F4F6] p-10 text-center">
                <Stethoscope className="h-8 w-8 text-[#0057B8]" />
                <p className="mt-3 text-sm text-[#686E74]">
                  We'll read device telemetry from your {device.name}.
                </p>
                <button onClick={doDiagnostics} disabled={busy} className="btn-primary mt-4">
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Running…
                    </span>
                  ) : (
                    "Run diagnostics"
                  )}
                </button>
              </div>
            ) : (
              <>
                <ul className="mt-5 divide-y divide-[#DCDFE3] rounded-xl border border-[#DCDFE3]">
                  {diags.map((d) => (
                    <li
                      key={d.label}
                      className="flex items-center justify-between gap-3 p-3.5 text-sm"
                    >
                      <span className="text-[#686E74]">{d.label}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 font-bold ${d.ok ? "text-[#1F7A3D]" : "text-[#C70032]"}`}
                      >
                        {d.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {d.result}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-xl bg-[#E7F5FB] p-4 text-sm">
                  <b>Result:</b>{" "}
                  {reason === "battery"
                    ? device.batteryHealth < 80
                      ? "Battery health is below 80% — a free replacement is included in your plan."
                      : `Battery health is ${device.batteryHealth}%, still above the 80% threshold. We'll test in store and replace it free if it's under.`
                    : device.warranty === "In warranty"
                      ? "Hardware failure confirmed. This device is still in the manufacturer's warranty, so repair is handled there at no cost."
                      : "Hardware failure confirmed and the manufacturer's warranty has expired — Protect Advantage covers the replacement."}
                </div>
              </>
            )}
            <Nav
              onBack={back}
              nextLabel="See my options"
              nextDisabled={!diags}
              onNext={() => setStep(3)}
            />
          </div>
        )}

        {/* ── Step 3 — assessment + the Advisor ────────────────────── */}
        {!done && step === 3 && (
          <div>
            {damage && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EAF7EE] px-3 py-1 text-xs font-bold text-[#1F7A3D]">
                    DeviceFlex AI · {Math.round(damage.confidence * 100)}% confidence
                  </span>
                  <span className="rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-bold text-[#B26A00]">
                    {damage.severity} damage
                  </span>
                  {damage.beyondEconomicalRepair && (
                    <span className="rounded-full bg-[#FDE9EE] px-3 py-1 text-xs font-bold text-[#C70032]">
                      Beyond economical repair
                    </span>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-extrabold">Here's what we found</h2>
                <p className="mt-2 text-sm text-[#686E74]">{damage.summary}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {damage.detected.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0057B8]" />
                      {d}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Claim-to-Upgrade Advisor — the verdict, in plain English */}
            {verdict && (
              <div className="mt-6 rounded-2xl border border-[#0057B8] bg-[#E7F5FB] p-5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0057B8]">
                  <Scale className="h-4 w-4" /> Claim-to-Upgrade Advisor
                </p>
                <p className="mt-2 text-lg font-extrabold">{verdict.headline}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#1D2329]">{verdict.reasoning}</p>
                <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[#00388F]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />A store associate confirms the
                  final path with you before anything is actioned.
                </p>
              </div>
            )}

            <h3 className="mt-6 text-base font-extrabold">Compare every option</h3>
            <div className="mt-3 grid gap-3">
              {options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setOption(o);
                    setStoreId(null);
                    setSlot(null);
                    setStep(4);
                  }}
                  className={`rounded-xl border p-4 text-left hover:border-[#0057B8] ${o.recommended ? "border-[#0057B8] bg-[#E7F5FB]" : "border-[#DCDFE3]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold">
                        {o.title}
                        {o.recommended && (
                          <span className="ml-2 rounded-full bg-[#0057B8] px-2 py-0.5 text-[10px] text-white">
                            Recommended
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-[#686E74]">{o.detail}</p>
                    </div>
                    <p className="shrink-0 text-right font-extrabold">{o.price}</p>
                  </div>
                  <dl className="mt-3 grid gap-2 border-t border-[#DCDFE3]/70 pt-3 text-xs sm:grid-cols-3">
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
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#1F7A3D]">
                      <BadgeCheck className="h-3.5 w-3.5" /> New, not refurbished — guaranteed
                    </p>
                  )}
                </button>
              ))}
            </div>

            {!device.nextUp && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#F3F4F6] p-3 text-xs text-[#686E74]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0057B8]" />
                Upgrading instead of replacing requires <b className="mx-1">Next Up Anytime</b> and
                a device that can't be economically repaired. This device isn't enrolled in Next Up.
              </p>
            )}
            <Nav onBack={back} hideNext />
          </div>
        )}

        {/* ── Step 4 — confirm, with real store routing ────────────── */}
        {!done && step === 4 && option && (
          <div>
            <h2 className="text-xl font-extrabold">Confirm your {option.title.toLowerCase()}</h2>

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
                      className={`rounded-full border px-4 py-2 text-sm font-bold ${slot === w ? "border-[#0057B8] bg-[#E7F5FB] text-[#0057B8]" : "border-[#DCDFE3]"}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </>
            )}

            {!isShip && !isHomeRepair && (
              <>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#0057B8]">
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
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left ${active ? "border-[#0057B8] bg-[#E7F5FB]" : "border-[#DCDFE3] hover:border-[#0057B8]"}`}
                      >
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0057B8]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold">{sm.store.name}</p>
                          <p className="text-xs text-[#686E74]">
                            {sm.store.address} · {sm.store.miles} mi · {sm.store.hours}
                          </p>
                          <p
                            className={`mt-1 text-xs font-bold ${sm.inStock || need !== "swap" ? "text-[#1F7A3D]" : "text-[#B26A00]"}`}
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
                          className={`rounded-full border px-4 py-2 text-sm font-bold ${slot === s ? "border-[#0057B8] bg-[#E7F5FB] text-[#0057B8]" : "border-[#DCDFE3]"}`}
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

            <div className="mt-5 rounded-xl bg-[#F3F4F6] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#686E74]">Deductible</span>
                <span className="font-extrabold text-[#1F7A3D]">$0.00</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-[#686E74]">Without coverage</span>
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
            </div>

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
          <Confirmation
            option={option}
            device={device}
            slot={slot}
            member={m}
            claimId={claimId}
            storeName={chosenStore?.store.name ?? null}
            onDashboard={() => navigate({ to: "/myatt/protection", search: { device: "" } })}
          />
        )}
      </div>
    </div>
  );
}

// ── Eligibility & Fraud Agent, shown rather than hidden ──────────────────────
function FraudPanel({
  member,
  reason,
  device,
}: {
  member: Member;
  reason: ClaimReasonId;
  device: MemberDevice;
}) {
  const signals = fraudCheck(member, reason, device);
  const flagged = signals.some((s) => s.level === "review");
  return (
    <div className="mt-4 rounded-xl border border-[#DCDFE3] p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#686E74]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#0057B8]" /> Eligibility &amp; Fraud check
      </p>
      <ul className="mt-3 space-y-2">
        {signals.map((s) => (
          <li key={s.label} className="flex items-start gap-2 text-xs">
            {s.level === "clear" ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1F7A3D]" />
            ) : (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B26A00]" />
            )}
            <span>
              <b>{s.label}</b> — <span className="text-[#686E74]">{s.note}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-[#686E74]">
        {flagged
          ? "One signal needs a human look. Your claim continues — an associate reviews it before fulfilment."
          : "All checks clear. Your claim proceeds without review."}
      </p>
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
  storeName,
  onDashboard,
}: {
  option: ClaimOption;
  device: MemberDevice;
  slot: string | null;
  member: Member;
  claimId: string | null;
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
          ? `A technician is on the way — ${slot ?? "today"}, $0 deductible. You keep your device, so nothing needs restoring.`
          : option.restore === "on-arrival"
            ? "Your replacement arrives tomorrow. $0 deductible."
            : `${option.title} confirmed${slot ? ` for ${slot}` : ""}${storeName ? ` at ${storeName}` : ""}. $0 deductible.`}
      </p>
      {claimId && (
        <p className="mt-1 text-xs text-[#686E74]">Claim {claimId} · saved to your account</p>
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
                <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-[#B26A00]" />
              )}
              <span>
                Vault backup: <b>{device.lastBackup}</b>
                {!device.backedUp &&
                  " — back up before you go, or Smart Restore has nothing to bring across"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0057B8]" /> Bring the damaged device
              and a photo ID
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0057B8]" /> Your new device is
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
                  className="h-full rounded-full bg-[#0057B8] transition-all"
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
