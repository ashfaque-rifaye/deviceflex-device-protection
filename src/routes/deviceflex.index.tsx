import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Sparkles, Store, Wallet, Leaf, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TierCards } from "@/components/deviceflex/TierCards";
import { CAPABILITIES, TIERS, type Tier } from "@/data/deviceflex";
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

function RoiCalculator() {
  const [lines, setLines] = useState(3);
  const [tierId, setTierId] = useState<Tier["id"]>("family");
  const tier = TIERS.find((t) => t.id === tierId)!;
  // Illustrative model: avoided out-of-pocket per protected line per year.
  const avoidedRepairCosts = lines * 129; // avg out-of-pocket repair avoided per line
  const annualPerkValue = tierId === "basic" ? 0 : tierId === "plus" ? 40 : 80;
  const protechValue = lines * 45;
  const memberCost = tier.price * 12;
  const totalValue = avoidedRepairCosts + annualPerkValue + protechValue;
  const net = totalValue - memberCost;

  return (
    <section className="bg-[#0057B8] text-white">
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
              <label className="text-sm font-bold">
                Devices on plan: <span className="text-white">{lines}</span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={lines}
                onChange={(e) => setLines(Number(e.target.value))}
                className="mt-2 w-full accent-white"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTierId(t.id)}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${tierId === t.id ? "bg-white text-[#0057B8]" : "border border-white/60 text-white hover:bg-white/10"}`}
                  >
                    {t.name} · ${t.price}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 text-[#1D2329]">
            <p className="text-sm font-bold text-[#686E74]">Estimated annual value</p>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Repair costs avoided" value={`$${avoidedRepairCosts.toLocaleString()}`} />
              <Row label="ProTech support value" value={`$${protechValue.toLocaleString()}`} />
              <Row label="Annual accessory perk" value={`$${annualPerkValue.toLocaleString()}`} />
              <div className="my-2 border-t border-[#DCDFE3]" />
              <Row label="Total value" value={`$${totalValue.toLocaleString()}`} bold />
              <Row
                label={`Membership cost (${tier.name})`}
                value={`-$${memberCost.toLocaleString()}`}
              />
            </div>
            <div className="mt-4 rounded-xl bg-[#E7F5FB] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0057B8]">
                Net member benefit / year
              </p>
              <p className="mt-1 text-3xl font-extrabold text-[#0057B8]">${net.toLocaleString()}</p>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs text-[#686E74]">
              Illustrative estimate <ArrowRight className="h-3 w-3" /> not a quote.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-extrabold" : "text-[#686E74]"}>{label}</span>
      <span className={bold ? "font-extrabold" : "font-bold"}>{value}</span>
    </div>
  );
}
