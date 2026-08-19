import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, Check, Clock, BadgeCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { RequireAuth, useAuth } from "@/lib/auth";
import { checkEligibility, checkTierFit } from "@/lib/ai";
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
  const eligible = m.devices.filter((d) => d.eligible || !d.protected);

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>(eligible.map((d) => d.id));
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
              malfunction — with a $0 deductible and AI-guided claims.
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

        {/* Step 0 — eligible devices */}
        {step === 0 && (
          <section className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <h2 className="text-lg font-extrabold">Eligible devices on your account</h2>
            <p className="mt-1 text-sm text-[#686E74]">Select the devices you'd like to protect.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {eligible.map((d) => {
                const on = picked.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggle(d.id)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left ${on ? "border-[#0057B8] bg-[#E7F5FB]" : "border-[#DCDFE3] hover:border-[#0057B8]"}`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${on ? "border-[#0057B8] bg-[#0057B8]" : "border-[#DCDFE3]"}`}
                    >
                      {on && <Check className="h-4 w-4 text-white" />}
                    </span>
                    <img src={d.image} alt={d.name} className="h-16 w-11 shrink-0 object-contain" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{d.name}</span>
                      <span className="block text-xs text-[#686E74]">
                        {d.owner} · {d.line}
                      </span>
                      <span className="mt-1 flex items-start gap-1 text-[11px] font-bold text-[#1F7A3D]">
                        <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="font-normal">{checkEligibility(d).reason}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F3F4F6] p-3 text-xs text-[#686E74]">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0057B8]" />
              <span>
                <b className="text-[#1D2329]">Eligibility &amp; Fraud Agent</b> checked all{" "}
                {eligible.length} devices against the account, warranty status and IMEI on file.
                Pre-existing damage is never covered — new incidents are, from day one.
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-[#686E74]">{picked.length} selected</p>
              <button
                disabled={!picked.length}
                onClick={() => setStep(1)}
                className={`btn-primary ${!picked.length ? "opacity-50" : ""}`}
              >
                Continue
              </button>
            </div>
          </section>
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
              Advantage {chosen.name} — ${chosen.price}/mo. with a $0 deductible.
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
    </>
  );
}
