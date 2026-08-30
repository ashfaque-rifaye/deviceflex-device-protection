import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Check,
  Shield,
  Plug,
  Headphones,
  BatteryCharging,
  Truck,
  Store,
  PackageCheck,
  Clock,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { RequireAuth, useAuth } from "@/lib/auth";
import {
  ACCESSORIES,
  CATEGORIES,
  PERK_VALUE,
  type Accessory,
  type AccessoryCategory,
} from "@/data/accessories";
import type { Member, MemberDevice } from "@/data/member";

export const Route = createFileRoute("/myatt/perks")({ component: PerksPage });

function PerksPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader cartCount={0} />
      <RequireAuth returnTo="/myatt/perks">
        <Perks />
      </RequireAuth>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

const ICONS = { shield: Shield, plug: Plug, headphones: Headphones, battery: BatteryCharging };

function Perks() {
  const { user, redeemAccessory } = useAuth();
  const navigate = useNavigate();
  const m = user as Member;

  const [step, setStep] = useState(0);
  const [cat, setCat] = useState<AccessoryCategory>("Cases");
  const [item, setItem] = useState<Accessory | null>(null);
  const [device, setDevice] = useState<MemberDevice>(
    m.devices.filter((d) => d.protected)[0] ?? m.devices[0],
  );
  const [method, setMethod] = useState<"Ship to me" | "Pick up in store">("Ship to me");
  const [done, setDone] = useState(false);

  const credits = m.perks.accessoryCredits;
  const noCredits = credits < 1;

  const confirm = () => {
    if (!item) return;
    redeemAccessory({
      accessoryId: item.id,
      accessoryName: item.name,
      image: item.image,
      deviceName: device.name,
      method,
    });
    setDone(true);
  };

  // ── No plan / no allowance ────────────────────────────────────────────────
  if (!m.enrolled) {
    return (
      <>
        <AccountNav active="Account" />
        <div className="mx-auto max-w-[800px] px-4 py-16 text-center sm:px-6">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F3F4F6]">
            <Gift className="h-7 w-7 text-[#686E74]" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold">
            The accessory perk comes with Protect Advantage
          </h1>
          <p className="mt-2 text-sm text-[#686E74]">
            Plus includes 1 free accessory a year. Family includes 2.
          </p>
          <Link to="/myatt/enroll" className="btn-primary mt-6">
            See protection options
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AccountNav active="Account" />
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10">
        <Link
          to="/myatt/protection"
          search={{ device: "" }}
          className="inline-flex items-center gap-1 text-sm font-bold text-[#0072B2] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my protection
        </Link>

        {/* Perk header */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DCDFE3] bg-white p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#E7F5FB]">
              <Gift className="h-6 w-6 text-[#0072B2]" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold">Annual accessory perk</h1>
              <p className="text-sm text-[#686E74]">
                {credits} of {m.perks.accessoryTotal} free accessor
                {m.perks.accessoryTotal === 1 ? "y" : "ies"} available · resets {m.perks.resetsOn}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: m.perks.accessoryTotal }).map((_, i) => (
              <span
                key={i}
                className={`grid h-10 w-10 place-items-center rounded-full border-2 text-xs font-extrabold ${i < credits ? "border-[#00388F] bg-[#E7F5FB] text-[#0072B2]" : "border-[#DCDFE3] text-[#686E74]"}`}
              >
                {i < credits ? "1" : <Check className="h-4 w-4" />}
              </span>
            ))}
          </div>
        </div>

        {/* Already redeemed everything */}
        {noCredits && !done && (
          <div className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-8 text-center">
            <PackageCheck className="mx-auto h-10 w-10 text-[#1F7A3D]" />
            <h2 className="mt-3 text-xl font-extrabold">
              You've used your accessory credits for this year
            </h2>
            <p className="mt-2 text-sm text-[#686E74]">
              Your allowance resets on {m.perks.resetsOn}. You can still shop accessories at member
              pricing.
            </p>
            <Link to="/buy/addons" className="btn-secondary mt-5">
              Shop accessories
            </Link>
          </div>
        )}

        {/* Redemption history */}
        {m.perks.redemptions.length > 0 && (
          <section className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <h2 className="text-base font-extrabold">Your redemptions</h2>
            <ul className="mt-3 divide-y divide-[#DCDFE3]">
              {m.perks.redemptions.map((r) => (
                <li key={r.id} className="flex items-center gap-4 py-3">
                  {r.image ? (
                    <img src={r.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#F3F4F6]">
                      <Gift className="h-5 w-5 text-[#0072B2]" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{r.accessoryName}</p>
                    <p className="text-xs text-[#686E74]">
                      For {r.deviceName} · {r.method} · {r.date}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#EAF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#1F7A3D]">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Flow ─────────────────────────────────────────────────────── */}
        {!noCredits && !done && (
          <>
            <ol className="mt-6 flex flex-wrap gap-2">
              {["Choose an accessory", "Choose a device", "Delivery"].map((s, i) => (
                <li
                  key={s}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${i === step ? "bg-[#E7F5FB] text-[#0072B2]" : i < step ? "text-[#0072B2]" : "text-[#686E74]"}`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${i < step ? "bg-[#00388F] text-white" : i === step ? "border border-[#00388F]" : "border border-[#DCDFE3]"}`}
                  >
                    {i < step ? "✓" : i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>

            <div className="mt-4 rounded-2xl border border-[#DCDFE3] bg-white p-6">
              {/* Step 0 — catalog */}
              {step === 0 && (
                <div>
                  <h2 className="text-lg font-extrabold">Pick your free accessory</h2>
                  <p className="mt-1 text-sm text-[#686E74]">
                    Anything up to ${PERK_VALUE} is free with your credit. Premium items apply your
                    credit as a discount.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-b border-[#DCDFE3] text-sm">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCat(c)}
                        className={`relative pb-3 ${cat === c ? "font-extrabold text-[#1D2329]" : "font-bold text-[#686E74] hover:text-[#1D2329]"}`}
                      >
                        {c}
                        {cat === c && (
                          <span className="absolute inset-x-0 -bottom-px h-[3px] bg-[#009FDB]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ACCESSORIES.filter((a) => a.category === cat).map((a) => {
                      const Icon = a.icon ? ICONS[a.icon] : null;
                      const active = item?.id === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setItem(a)}
                          className={`flex flex-col rounded-xl border p-4 text-left ${active ? "border-[#00388F] ring-2 ring-[#00388F]/30" : "border-[#DCDFE3] hover:border-[#00388F]"}`}
                        >
                          <span className="grid h-28 place-items-center rounded-lg bg-[#F3F4F6]">
                            {a.image ? (
                              <img src={a.image} alt={a.name} className="h-24 object-contain" />
                            ) : Icon ? (
                              <Icon className="h-10 w-10 text-[#0072B2]" />
                            ) : null}
                          </span>
                          <span className="mt-3 text-[11px] text-[#686E74]">{a.brand}</span>
                          <span className="text-sm font-extrabold leading-snug">{a.name}</span>
                          <span className="mt-2 flex items-center gap-2">
                            {a.eligible ? (
                              <>
                                <span className="rounded-full bg-[#EAF7EE] px-2 py-0.5 text-[11px] font-bold text-[#1F7A3D]">
                                  FREE with perk
                                </span>
                                <span className="text-xs text-[#686E74] line-through">
                                  ${a.retail}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold text-[#9E5D00]">{a.note}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#DCDFE3] pt-5">
                    <p className="text-sm text-[#686E74]">
                      {item ? `Selected: ${item.name}` : "Select an accessory to continue"}
                    </p>
                    <button
                      disabled={!item}
                      onClick={() => setStep(1)}
                      className={`btn-primary ${!item ? "opacity-50" : ""}`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1 — device */}
              {step === 1 && item && (
                <div>
                  <h2 className="text-lg font-extrabold">Which device is it for?</h2>
                  <p className="mt-1 text-sm text-[#686E74]">We'll make sure it fits.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {m.devices
                      .filter((d) => d.protected)
                      .map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDevice(d)}
                          className={`flex items-center gap-3 rounded-xl border p-4 text-left ${device.id === d.id ? "border-[#00388F] ring-2 ring-[#00388F]/30" : "border-[#DCDFE3] hover:border-[#00388F]"}`}
                        >
                          <img src={d.image} alt={d.name} className="h-16 w-11 object-contain" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-extrabold">{d.name}</span>
                            <span className="block text-xs text-[#686E74]">
                              {d.owner} · {d.color}
                            </span>
                          </span>
                        </button>
                      ))}
                  </div>
                  <NavRow onBack={() => setStep(0)} onNext={() => setStep(2)} />
                </div>
              )}

              {/* Step 2 — delivery + confirm */}
              {step === 2 && item && (
                <div>
                  <h2 className="text-lg font-extrabold">How would you like it?</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ["Ship to me", Truck, "Free 2-day shipping to your address on file"],
                        ["Pick up in store", Store, "Ready today at AT&T Winter Park · 0.8 mi"],
                      ] as const
                    ).map(([label, Icon, desc]) => (
                      <button
                        key={label}
                        onClick={() => setMethod(label)}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left ${method === label ? "border-[#00388F] bg-[#E7F5FB]" : "border-[#DCDFE3] hover:border-[#00388F]"}`}
                      >
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#0072B2]" />
                        <span>
                          <span className="block text-sm font-extrabold">{label}</span>
                          <span className="block text-xs text-[#686E74]">{desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 rounded-xl border border-[#DCDFE3] p-5">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="grid h-16 w-16 place-items-center rounded-lg bg-[#F3F4F6]">
                          <Gift className="h-6 w-6 text-[#0072B2]" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold">{item.name}</p>
                        <p className="text-xs text-[#686E74]">
                          {item.brand} · for {device.name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 border-t border-[#DCDFE3] pt-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#686E74]">Retail price</span>
                        <span className="line-through text-[#686E74]">${item.retail}.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#686E74]">Annual accessory perk</span>
                        <span className="font-bold text-[#1F7A3D]">
                          −${item.eligible ? item.retail : PERK_VALUE}.00
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[#DCDFE3] pt-2 text-base">
                        <span className="font-extrabold">You pay today</span>
                        <span className="font-extrabold text-[#1F7A3D]">
                          ${item.eligible ? "0.00" : (item.retail - PERK_VALUE).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <NavRow onBack={() => setStep(1)} onNext={confirm} nextLabel="Redeem now" />
                </div>
              )}
            </div>
          </>
        )}

        {/* Done */}
        {done && item && (
          <div className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-10 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF7EE]">
              <PackageCheck className="h-8 w-8 text-[#1F7A3D]" />
            </span>
            <h2 className="mt-4 text-2xl font-extrabold">Perk redeemed</h2>
            <p className="mt-2 text-sm text-[#686E74]">
              {item.name} for {device.name} · {method}.{" "}
              {method === "Pick up in store" ? (
                <>
                  Ready today at <b>AT&amp;T Winter Park</b> — we'll text you when it's waiting.
                </>
              ) : (
                <>Arriving in 2 days, free shipping.</>
              )}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#E7F5FB] px-3 py-1 text-xs font-bold text-[#0072B2]">
              <Clock className="h-3.5 w-3.5" /> {m.perks.accessoryCredits} accessory credit
              {m.perks.accessoryCredits === 1 ? "" : "s"} left this year
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setDone(false);
                  setStep(0);
                  setItem(null);
                }}
                className="btn-secondary"
                disabled={m.perks.accessoryCredits < 1}
              >
                Redeem another
              </button>
              <button
                onClick={() => navigate({ to: "/myatt/protection", search: { device: "" } })}
                className="btn-primary"
              >
                Back to my protection
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function NavRow({
  onBack,
  onNext,
  nextLabel = "Continue",
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-[#DCDFE3] pt-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-bold text-[#0072B2] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <button onClick={onNext} className="btn-primary">
        {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </button>
    </div>
  );
}
