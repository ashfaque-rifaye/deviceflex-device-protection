import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Sparkles, Store, Wallet, Leaf, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TierCards } from "@/components/deviceflex/TierCards";
import { CAPABILITIES, TIERS, type Tier } from "@/data/deviceflex";
import { TIER_POOL, TIER_CREDITS, TIER_VAULT_GB } from "@/data/member";
import { PERK_VALUE } from "@/data/accessories";
import { REPLACEMENT_DEDUCTIBLE } from "@/data/deductibles";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/deviceflex/")({ component: DeviceFlexLanding });

function DeviceFlexLanding() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const [tier, setTier] = useState<Tier["id"]>("plus");

  const start = (id: Tier["id"]) => {
    setTier(id);
    navigate({ to: "/buy/addons" });
  };

  return (
    <div className="bg-white text-[#1D2329]">
      <SiteHeader cartCount={0} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0057B8] via-[#0072B2] to-[#009FDB] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">
            AT&amp;T DeviceFlex™
          </p>
          <h1
            className="mt-3 max-w-3xl font-extrabold"
            style={{
              fontSize: "clamp(2.25rem,5vw,3.75rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            Protection that works every month — not just when you break it.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/95">
            The AI-powered device membership: $0 screen repair, upfront pricing, same-day swaps, a
            family device pool, and a data vault that follows you everywhere.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#tiers" className="att-btn btn-primary btn-inverse">
              Choose a plan
            </a>
            {/* One button either way — signed out, it routes through sign-in and
                comes back to the dashboard rather than bouncing off a gate. */}
            <button
              onClick={() =>
                isAuthed
                  ? navigate({ to: "/myatt" })
                  : navigate({ to: "/login", search: { returnTo: "/myatt" } })
              }
              className="att-btn btn-secondary btn-on-dark"
            >
              {isAuthed ? "Go to my dashboard" : "Sign in to my dashboard"}
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm font-semibold text-white/90">
            <span>✓ $0 screen &amp; back-glass repair</span>
            <span>✓ Same-day replacement</span>
            <span>✓ Up to 5 devices</span>
            <span>✓ New, not refurbished</span>
          </div>
        </div>
      </section>

      {/* Capability stack */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10">
          <h2 className="text-center text-3xl font-extrabold md:text-4xl">
            Real value, every single month
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="rounded-2xl border border-[#DCDFE3] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E7F5FB]">
                  <ShieldCheck className="h-5 w-5 text-[#0057B8]" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#686E74]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section id="tiers" className="bg-[#F3F4F6]">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10">
          <h2 className="text-center text-3xl font-extrabold md:text-4xl">Pick your membership</h2>
          <p className="mt-3 text-center text-[15px] text-[#686E74]">
            All tiers include AI-guided claims, instant swaps, and upfront pricing.
          </p>
          <div className="mt-10">
            <TierCards selected={tier} onSelect={start} ctaLabel="Choose plan" />
          </div>
        </div>
      </section>

      {/* ROI calculator */}
      <RoiCalculator />

      {/* Sustainability */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E7F5FB]">
              <Leaf className="h-5 w-5 text-[#0057B8]" />
            </span>
            <h2 className="mt-4 text-3xl font-extrabold">
              Better for your budget — and the planet
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#686E74]">
              In-place repairs, unlimited battery replacement and refurb-avoidance keep working
              devices in use longer. DeviceFlex turns protection into a circular, lower-waste model
              — fewer devices in landfills, more value for members.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Store", Store, "Retail reactivated"],
              ["Wallet", Wallet, "Upfront pricing"],
              ["Perk", Sparkles, "Annual accessory"],
            ].map(([k, Icon, label]) => {
              const I = Icon as typeof Store;
              return (
                <div
                  key={k as string}
                  className="rounded-2xl border border-[#DCDFE3] p-5 text-center"
                >
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#E7F5FB]">
                    <I className="h-5 w-5 text-[#0057B8]" />
                  </span>
                  <p className="mt-3 text-sm font-bold">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

// The ROI model.
//
// The old one counted repair, ProTech and the perk and stopped there, leaving out
// the two largest benefits in the product - replacement cover and the vault. The
// value side could not carry the cost side, so Family at $600/yr showed a negative
// to anyone with fewer than three devices. It also let the slider put five devices
// on Basic, which covers one.
//
// Every figure below traces to a constant already in the repo or to a published
// consumer price.

/** ~0.9% monthly claim rate (OPPORTUNITY.claimRate), compounded across a year. */
const ANNUAL_CLAIM_RATE = 1 - Math.pow(1 - 0.009, 12); // about 10.3%
/** A Tier-4 flagship - the iPhone 17 Pro Max the demo account carries. */
const FLAGSHIP_RETAIL = 1199;
/** Out-of-pocket screen repair avoided per device per year - the model's original basis. */
const REPAIR_AVOIDED_PER_DEVICE = 129;
/** ProTech is a Plus benefit now, so Basic must not be credited with it. */
const PROTECH_PER_DEVICE = 45;
/** ~$89 battery service amortised over a three-year hold. Plus and Family only. */
const BATTERY_PER_DEVICE = 30;
/** Consumer cloud pricing for the same capacity, per month. */
const VAULT_MONTHLY: Record<Tier["id"], number> = { basic: 0.99, plus: 2.99, family: 9.99 };

/**
 * Family is sold as a household plan - "one membership for the whole household".
 * Pricing it against a single device is not a scenario the tier exists for, and it
 * is the one combination where the honest answer is "buy the cheaper tier".
 */
const TIER_MIN_DEVICES: Record<Tier["id"], number> = { basic: 1, plus: 1, family: 2 };

type ValueLine = { label: string; value: number; note?: string };

function roiFor(tierId: Tier["id"], devices: number) {
  const tier = TIERS.find((t) => t.id === tierId)!;
  const covered = Math.min(devices, TIER_POOL[tierId]);
  const hasSupport = tierId !== "basic"; // ProTech and battery moved to Plus
  const expectedReplacement = Math.round(
    ANNUAL_CLAIM_RATE * (FLAGSHIP_RETAIL - REPLACEMENT_DEDUCTIBLE[4]),
  );
  const vaultGb = TIER_VAULT_GB[tierId];

  const lines: ValueLine[] = [
    { label: "Screen & back-glass repair avoided", value: covered * REPAIR_AVOIDED_PER_DEVICE },
    {
      label: "Replacement cover",
      value: covered * expectedReplacement,
      note: "expected, at a ~0.9% monthly claim rate",
    },
    { label: "ProTech expert support", value: hasSupport ? covered * PROTECH_PER_DEVICE : 0 },
    { label: "Battery replacement", value: hasSupport ? covered * BATTERY_PER_DEVICE : 0 },
    { label: "Annual accessory perk", value: TIER_CREDITS[tierId] * PERK_VALUE },
    {
      label: "Data Vault",
      value: Math.round(VAULT_MONTHLY[tierId] * 12),
      note: (vaultGb >= 1024 ? "1 TB" : vaultGb + " GB") + " at consumer cloud rates",
    },
  ];

  const totalValue = lines.reduce((sum, l) => sum + l.value, 0);
  const memberCost = tier.price * 12;
  return { tier, covered, lines, totalValue, memberCost, net: totalValue - memberCost };
}

function RoiCalculator() {
  const [devices, setDevices] = useState(3);
  const [tierId, setTierId] = useState<Tier["id"]>("family");

  // A tier that cannot cover the household is not an option: choosing five devices
  // has to move you off Basic rather than quietly pricing five phones on a
  // one-device plan.
  const eligible = TIERS.filter(
    (t) => TIER_POOL[t.id] >= devices && TIER_MIN_DEVICES[t.id] <= devices,
  );
  const active = eligible.some((t) => t.id === tierId) ? tierId : eligible[0].id;
  const result = roiFor(active, devices);

  // The best tier for this household, so the calculator can argue against the more
  // expensive one exactly as the claim flow does.
  const best = eligible
    .map((t) => ({ id: t.id, name: t.name, net: roiFor(t.id, devices).net }))
    .sort((a, b) => b.net - a.net)[0];
  const beaten = best.id !== active ? best : null;

  return (
    <section className="bg-[var(--color-att-navy-hover)] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">
              ROI calculator
            </p>
            <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
              See what your membership is worth
            </h2>
            <p className="mt-4 max-w-lg text-[15px] text-white/90">
              A quick, illustrative estimate of what a DeviceFlex member saves versus what they pay
              in a year.
            </p>

            <div className="mt-8 rounded-2xl bg-white/10 p-5">
              <label className="text-sm font-bold" htmlFor="roi-devices">
                Devices on plan: <span className="text-white">{devices}</span>
              </label>
              <input
                id="roi-devices"
                type="range"
                min={1}
                max={5}
                value={devices}
                onChange={(e) => setDevices(Number(e.target.value))}
                className="mt-2 w-full accent-white"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {TIERS.map((t) => {
                  const fits = TIER_POOL[t.id] >= devices && TIER_MIN_DEVICES[t.id] <= devices;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTierId(t.id)}
                      disabled={!fits}
                      title={
                        fits
                          ? undefined
                          : TIER_MIN_DEVICES[t.id] > devices
                            ? t.name + " is a household plan - two devices or more"
                            : t.name + " covers " + TIER_POOL[t.id] + " device"
                      }
                      className={`rounded-full px-4 py-2 text-sm font-bold ${
                        active === t.id
                          ? "bg-white text-[var(--color-att-navy-hover)]"
                          : fits
                            ? "border border-white/60 text-white hover:bg-white/10"
                            : "cursor-not-allowed border border-white/25 text-white/40"
                      }`}
                    >
                      {t.name} · ${t.price}
                      {best.id === t.id && fits && active !== t.id && " · best value"}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-white/75">
                {devices > 1
                  ? "Basic and Plus each cover one device, so a household of " +
                    devices +
                    " is a Family plan."
                  : "Family is a household plan, so a single device is Basic or Plus."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 text-[var(--color-att-ink)]">
            <p className="text-sm font-bold text-[var(--color-att-ink-3)]">
              Estimated annual value
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {result.lines.map((l) => (
                <Row
                  key={l.label}
                  label={l.label}
                  note={l.note}
                  value={l.value ? "$" + l.value.toLocaleString() : "—"}
                  muted={!l.value}
                />
              ))}
              <div className="my-2 border-t border-[var(--color-att-border)]" />
              <Row label="Total value" value={"$" + result.totalValue.toLocaleString()} bold />
              <Row
                label={`Membership cost (${result.tier.name})`}
                value={"-$" + result.memberCost.toLocaleString()}
              />
            </div>
            <div className="mt-4 rounded-xl bg-[var(--color-att-pale-2)] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-att-navy-hover)]">
                Net member benefit / year
              </p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--color-att-navy-hover)]">
                ${result.net.toLocaleString()}
              </p>
            </div>
            {beaten && (
              <p className="mt-3 rounded-xl bg-[var(--color-att-gray)] p-3 text-xs text-[var(--color-att-ink-2)]">
                For {devices} device{devices > 1 ? "s" : ""}, <b>{beaten.name}</b> nets $
                {beaten.net.toLocaleString()} — ${(beaten.net - result.net).toLocaleString()} more
                than {result.tier.name}.
              </p>
            )}
            <p className="mt-3 flex items-center gap-1 text-xs text-[var(--color-att-ink-3)]">
              Illustrative estimate <ArrowRight className="h-3 w-3" /> not a quote.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
  note,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  note?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={bold ? "font-extrabold" : "text-[var(--color-att-ink-3)]"}>
        {label}
        {note && <span className="block text-[11px] text-[var(--color-att-muted)]">{note}</span>}
      </span>
      <span
        className={
          bold ? "font-extrabold" : muted ? "font-bold text-[var(--color-att-muted)]" : "font-bold"
        }
      >
        {value}
      </span>
    </div>
  );
}
