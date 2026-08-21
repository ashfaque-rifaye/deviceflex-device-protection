import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Check,
  BadgeCheck,
  CalendarClock,
  Stethoscope,
  ShieldOff,
  Info,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { RequireAuth, useAuth } from "@/lib/auth";
import { checkTierFit } from "@/lib/ai";
import {
  assessEnrolment,
  isOpenEnrollmentActive,
  openEnrollmentDaysLeft,
  OPEN_ENROLLMENT,
  formatDate,
  NEW_DEVICE_WINDOW_DAYS,
} from "@/data/eligibility";
import { deviceCondition } from "@/lib/condition";
import { DiagnosticsModal } from "@/components/deviceflex/DiagnosticsModal";
import { TIERS, type Tier } from "@/data/deviceflex";
import type { Member } from "@/data/member";

export const Route = createFileRoute("/myatt/enroll")({ component: EnrollPage });

function EnrollPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />
      <RequireAuth returnTo="/myatt/enroll">
        <Enroll />
      </RequireAuth>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

function Enroll() {
  const { user, enroll } = useAuth();
  const navigate = useNavigate();
  const m = user as Member;
  const [verified, setVerified] = useState<string[]>([]);
  const [diagFor, setDiagFor] = useState<string | null>(null);

  // Every uncovered device, with the real verdict against AT&T's two enrolment
  // doors. Nothing is filtered out — a customer should see *why* something can't
  // be added, not just find it missing.
  const candidates = m.devices
    .filter((d) => !d.protected)
    .map((d) => ({
      device: d,
      verdict: assessEnrolment({
        purchased: d.purchased,
        protectedAlready: false,
        condition: deviceCondition(d),
        conditionVerified: verified.includes(d.id),
      }),
    }));
  const eligible = candidates.filter((c) => c.verdict.eligible).map((c) => c.device);
  const openNow = isOpenEnrollmentActive();
  const daysLeft = openEnrollmentDaysLeft();

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [tier, setTier] = useState<Tier["id"]>(eligible.length > 1 ? "family" : "plus");

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const chosen = TIERS.find((t) => t.id === tier)!;
  const fit = checkTierFit(tier, picked.length);
  const tooMany = !fit.eligible;

  const confirm = () => {
    enroll(tier, picked);
    setStep(2);
  };

  return (
    <>
      <AccountNav active="Account" />
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-10">
        <Link
          to="/myatt"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#0057B8] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to account
        </Link>

        {step < 2 && (
          <>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#686E74]">
              Add protection
            </p>
            <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">AT&amp;T Protect Advantage</h1>
            <p className="mt-2 max-w-2xl text-[15px] text-[#686E74]">
              Cover your devices against accidental damage, loss, theft and out-of-warranty
              malfunction — with AI-guided claims and your cost shown before you book.
            </p>

            <ol className="mt-6 flex flex-wrap gap-2">
              {["Choose devices", "Choose your plan"].map((s, i) => (
                <li
                  key={s}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${i === step ? "bg-[#E7F5FB] text-[#0057B8]" : i < step ? "text-[#0057B8]" : "text-[#686E74]"}`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${i < step ? "bg-[#0057B8] text-white" : i === step ? "border border-[#0057B8]" : "border border-[#DCDFE3]"}`}
                  >
                    {i < step ? "✓" : i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </>
        )}

        {/* Step 0 — eligibility, stated plainly */}
        {step === 0 && (
          <>
            {/* The window itself is the headline. Miss it and the answer changes. */}
            {openNow ? (
              <div className="att-note mt-6">
                <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
                  <CalendarClock className="h-4 w-4 text-[#00388F]" />
                  {OPEN_ENROLLMENT.label} is open — {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                </p>
                <p className="mt-1.5 text-sm">
                  Until {formatDate(OPEN_ENROLLMENT.endsOn)}, device age doesn&rsquo;t matter. Any
                  device on your account can be enrolled as long as it&rsquo;s in good working
                  condition. Outside this window you&rsquo;d only have {NEW_DEVICE_WINDOW_DAYS} days
                  from buying or upgrading.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-[#DCDFE3] bg-[#F3F4F6] p-5">
                <p className="text-sm font-extrabold">
                  Enrolment is limited to devices bought in the last {NEW_DEVICE_WINDOW_DAYS} days
                </p>
                <p className="att-small mt-1">
                  AT&amp;T runs an Open Enrollment window once or twice a year that removes the age
                  limit. We&rsquo;ll flag it here the moment the next one starts.
                </p>
              </div>
            )}

            <section className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-6">
              <h2 className="att-h4">Devices on your account</h2>
              <p className="att-small mt-1">
                Select the ones you&rsquo;d like to protect. A device has to be in good working
                order at the moment you enrol — pre-existing damage isn&rsquo;t covered.
              </p>

              <div className="mt-5 grid gap-3">
                {candidates.map(({ device: d, verdict }) => {
                  const on = picked.includes(d.id);
                  const blocked = !verdict.eligible;
                  return (
                    <div
                      key={d.id}
                      className={`att-choice !p-4 ${on ? "att-choice-on" : ""} ${blocked ? "opacity-75" : ""}`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={blocked}
                          onChange={() => toggle(d.id)}
                          aria-label={`Protect ${d.name}`}
                          className="h-5 w-5 shrink-0 accent-[#00388F] disabled:cursor-not-allowed"
                        />
                        <img src={d.image} alt="" className="h-16 w-11 shrink-0 object-contain" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold">{d.name}</span>
                          <span className="att-small block">
                            {d.owner} · {d.line}
                          </span>
                          <span className="att-small block">
                            Bought {d.purchased}
                            {verdict.daysOwned !== null && ` · ${verdict.daysOwned} days ago`}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            blocked ? "bg-[#FDE9EE] text-[#C70032]" : "bg-[#EAF7EE] text-[#1F7A3D]"
                          }`}
                        >
                          {blocked ? (
                            <>
                              <ShieldOff className="mr-1 inline h-3 w-3" />
                              Not eligible
                            </>
                          ) : verdict.route === "new-device" ? (
                            "New-device window"
                          ) : (
                            OPEN_ENROLLMENT.label
                          )}
                        </span>
                      </div>

                      <p className="att-small mt-2 pl-9">{verdict.detail}</p>

                      {verdict.needsInspection && !blocked && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 pl-9">
                          <p className="att-small flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-[#00388F]" />
                            AT&amp;T may inspect before approving — do it now from the device
                          </p>
                          <button
                            onClick={() => setDiagFor(d.id)}
                            className="btn-secondary att-btn-sm"
                          >
                            <Stethoscope className="h-4 w-4" /> Check condition
                          </button>
                        </div>
                      )}

                      {verified.includes(d.id) && (
                        <p className="mt-2 flex items-center gap-1.5 pl-9 text-xs font-bold text-[#1F7A3D]">
                          <ShieldCheck className="h-3.5 w-3.5" /> Diagnostics passed — good working
                          condition
                        </p>
                      )}

                      {blocked && verdict.route === "none" && deviceCondition(d) === "damaged" && (
                        <button
                          onClick={() => setDiagFor(d.id)}
                          className="btn-secondary att-btn-sm mt-2 ml-9"
                        >
                          <Stethoscope className="h-4 w-4" /> See what we found
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F3F4F6] p-3 text-xs text-[#686E74]">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00388F]" />
                <span>
                  <b className="text-[#1D2329]">Eligibility &amp; Fraud Agent</b> checked all{" "}
                  {candidates.length} devices against purchase date, warranty status, condition and
                  the IMEI on file.
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="att-small">
                  {picked.length} of {eligible.length} eligible selected
                </p>
                <button
                  disabled={!picked.length}
                  onClick={() => setStep(1)}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            </section>
          </>
        )}

        {/* Step 1 — plan */}
        {step === 1 && (
          <section className="mt-6">
            <div className="grid gap-5 md:grid-cols-3">
              {TIERS.map((t) => {
                const active = tier === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    className={`flex flex-col rounded-2xl border bg-white p-6 text-left ${active ? "border-[#0057B8] ring-2 ring-[#0057B8]/30" : "border-[#DCDFE3] hover:border-[#0057B8]"}`}
                  >
                    {t.ribbon && (
                      <span className="mb-2 inline-block self-start rounded-full bg-[#E7F5FB] px-3 py-1 text-[11px] font-bold text-[#0057B8]">
                        {t.ribbon}
                      </span>
                    )}
                    <p className="text-xl font-extrabold">{t.name}</p>
                    <p className="text-xs text-[#686E74]">{t.devices}</p>
                    <p className="mt-3 text-3xl font-extrabold">
                      ${t.price}
                      <span className="text-sm font-normal text-[#686E74]">/mo.</span>
                    </p>
                    <ul className="mt-4 space-y-1.5 text-xs">
                      {t.highlights.slice(0, 4).map((h) => (
                        <li key={h} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0057B8]" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {tooMany && <p className="mt-4 rounded-xl bg-[#FFF3E0] p-3 text-sm">{fit.reason}</p>}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCDFE3] bg-white p-5">
              <div>
                <p className="text-sm text-[#686E74]">
                  {picked.length} device{picked.length !== 1 && "s"} · {chosen.name}
                </p>
                <p className="text-2xl font-extrabold">${chosen.price}/mo.</p>
                <p className="text-xs text-[#686E74]">Added to your next bill. Cancel anytime.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary">
                  Back
                </button>
                <button
                  disabled={tooMany}
                  onClick={confirm}
                  className={`btn-primary ${tooMany ? "opacity-50" : ""}`}
                >
                  Confirm &amp; add to my plan
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Step 2 — done */}
        {step === 2 && (
          <section className="mt-10 rounded-2xl border border-[#DCDFE3] bg-white p-10 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF7EE]">
              <ShieldCheck className="h-8 w-8 text-[#1F7A3D]" />
            </span>
            <h2 className="mt-4 text-2xl font-extrabold">You're protected</h2>
            <p className="mt-2 text-sm text-[#686E74]">
              {picked.length} device{picked.length !== 1 && "s"} now covered under AT&amp;T Protect
              Advantage {chosen.name} — ${chosen.price}/mo.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate({ to: "/myatt/protection", search: { device: "" } })}
                className="btn-primary"
              >
                Manage my protection
              </button>
              <button onClick={() => navigate({ to: "/myatt" })} className="btn-secondary">
                Back to account
              </button>
            </div>
          </section>
        )}
      </div>
      {diagFor && (
        <DiagnosticsModal
          device={m.devices.find((d) => d.id === diagFor)!}
          onClose={() => setDiagFor(null)}
          onComplete={(r) => {
            if (r.condition === "good") setVerified((v) => [...v, diagFor]);
          }}
        />
      )}
    </>
  );
}
