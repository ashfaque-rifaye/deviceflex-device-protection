import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Signal,
  AlertTriangle,
  Edit2,
  Trash2,
  ChevronDown,
  Zap,
  Shield,
  Package,
  Sparkles,
  ShieldCheck,
  ShieldOff,
  Check,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
const phone = "/att/devices/apple-iphone-17-pro-max/cosmic-orange-hero.webp";

export const Route = createFileRoute("/buy/cart")({ component: CartPage });

function CartPage() {
  const { cart, protectionTier, setProtection, removeAccessory, monthlyTotal } = useCart();
  const accessoryTotal = cart.accessories.reduce((n, a) => n + a.price, 0);
  const [autopay, setAutopay] = useState(true);
  const [payMethod, setPayMethod] = useState<"bank" | "debit">("bank");
  const [promoOpen, setPromoOpen] = useState(false);

  return (
    <div className="bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold md:text-4xl">My cart</h1>
          <div className="flex items-center gap-4 text-sm font-bold text-[#0057B8]">
            <a href="#" className="hover:underline">
              Save
            </a>
            <span className="text-[#DCDFE3]">|</span>
            <a href="#" className="hover:underline">
              Share
            </a>
            <span className="text-[#DCDFE3]">|</span>
            <a href="#" className="hover:underline">
              Empty
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT */}
          <div>
            <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Signal className="h-5 w-5 text-[#0057B8]" /> Wireless
              </h2>
              <p className="mt-3 text-sm font-bold">Delivery and pickup options</p>
              <a
                href="#"
                className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#0057B8] hover:underline"
              >
                <AlertTriangle className="h-4 w-4" /> Edit my shipping address
              </a>

              <div className="mt-6 border-t border-[#DCDFE3] pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold">Line 1</p>
                  <div className="flex gap-2">
                    <button aria-label="Edit" className="rounded p-1.5 hover:bg-[#F3F4F6]">
                      <Edit2 className="h-4 w-4 text-[#0057B8]" />
                    </button>
                    <button aria-label="Delete" className="rounded p-1.5 hover:bg-[#F3F4F6]">
                      <Trash2 className="h-4 w-4 text-[#0057B8]" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-4">
                  <img
                    src={phone}
                    alt="iPhone 17 Pro Max"
                    className="h-28 w-20 shrink-0 object-contain"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-[#686E74]">Apple</p>
                    <p className="font-extrabold">iPhone 17 Pro Max</p>
                    <p className="text-sm text-[#686E74]">Cosmic Orange · 256GB</p>
                    <p className="mt-1 text-sm text-[#686E74]">eSIM activation</p>
                  </div>
                  <p className="font-extrabold">$33.34/mo.</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#DCDFE3] pt-4">
                  <p className="text-sm font-bold">AT&amp;T Extra 2.0</p>
                  <p className="font-extrabold">$70.00/mo.</p>
                </div>
                {/* Device protection — the payoff for the add-ons step */}
                {protectionTier ? (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#0057B8] bg-[#E7F5FB] p-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
                      <ShieldCheck className="h-5 w-5 text-[#0057B8]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold">
                        AT&amp;T Protect Advantage {protectionTier.name}
                      </p>
                      <p className="text-xs text-[#686E74]">
                        {protectionTier.devices} · $0 deductible · 15-minute swaps
                      </p>
                      <button
                        onClick={() => setProtection(null)}
                        className="mt-1.5 text-xs font-bold text-[#0057B8] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="shrink-0 font-extrabold">
                      ${protectionTier.price.toFixed(2)}/mo.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-start gap-3 rounded-xl border border-[#DCDFE3] bg-[#FDF3F5] p-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
                      <ShieldOff className="h-5 w-5 text-[#C70032]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold">This device is not protected</p>
                      <p className="text-xs text-[#686E74]">
                        A cracked screen is $329 out of pocket without coverage.
                      </p>
                    </div>
                    <Link to="/buy/addons" className="btn-secondary shrink-0 text-xs">
                      Add protection
                    </Link>
                  </div>
                )}

                {/* Accessories carried over from Get add-ons */}
                {cart.accessories.length > 0 && (
                  <div className="mt-4 border-t border-[#DCDFE3] pt-4">
                    <p className="text-sm font-extrabold">Accessories</p>
                    <ul className="mt-2 space-y-2">
                      {cart.accessories.map((a) => (
                        <li key={a.id} className="flex items-center gap-3">
                          {a.image && (
                            <img
                              src={a.image}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg object-contain"
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{a.name}</span>
                            <button
                              onClick={() => removeAccessory(a.id)}
                              className="text-xs font-bold text-[#0057B8] hover:underline"
                            >
                              Remove
                            </button>
                          </span>
                          <span className="shrink-0 text-sm font-extrabold">
                            ${a.price.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-4 rounded-lg bg-[#E7F5FB] p-3 text-xs text-[#1D2329]">
                  <span className="font-extrabold">Trade in and save.</span> Save up to $1100 when
                  you trade in an eligible device.
                </p>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="font-extrabold">See what other people also bought</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { Icon: Zap, l: "Early upgrade" },
                  { Icon: Sparkles, l: "Plan add-ons" },
                  { Icon: Shield, l: "Device protection" },
                  { Icon: Package, l: "Accessories" },
                ].map(({ Icon, l }) => (
                  <Link
                    key={l}
                    to="/buy/addons"
                    className="flex flex-col items-center gap-2 rounded-xl border border-[#DCDFE3] bg-white p-4 text-center text-xs font-bold hover:border-[#0057B8] hover:no-underline"
                  >
                    <Icon className="h-6 w-6 text-[#0057B8]" />
                    {l}
                    {l === "Device protection" && protectionTier && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1F7A3D]">
                        <Check className="h-3 w-3" /> Added
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-6">
              <h3 className="text-lg font-extrabold">Add another line and save</h3>
              <p className="mt-2 text-sm text-[#686E74]">
                The more lines you add, the more you can save on your monthly plan.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="btn-secondary">Add a new device</button>
                <button className="btn-secondary">Bring my own device</button>
              </div>
            </section>
          </div>

          {/* RIGHT: sticky summary */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-[#DCDFE3] bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Due monthly*</p>
                <p className="text-2xl font-extrabold">${monthlyTotal.toFixed(2)}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-bold">Due today</p>
                <p className="text-2xl font-extrabold">${accessoryTotal.toFixed(2)}</p>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[#686E74]">
                Plus taxes and fees.{" "}
                <a href="#" className="text-[#0057B8] hover:underline">
                  See disclosures
                </a>
                . Your services will auto-renew monthly at then-current rates until canceled. See{" "}
                <a href="#" className="text-[#0057B8] hover:underline">
                  att.com/cancel-info
                </a>
                .
              </p>
              <button className="btn-primary mt-5 w-full">Check out</button>
            </div>

            <div className="rounded-2xl border border-[#DCDFE3] bg-white p-5 text-sm">
              <p className="font-extrabold">Price details</p>
              <div className="mt-3 flex items-center justify-between border-b border-[#DCDFE3] pb-3">
                <p className="font-bold">Due monthly</p>
                <p className="font-extrabold">${monthlyTotal.toFixed(2)}</p>
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs">Apple iPhone 17 Pro Max — Cosmic Orange · 256GB</p>
                  <div className="mt-1 flex items-start justify-between text-xs text-[#686E74]">
                    <span>Price for 36 mos. at 0% APR</span>
                    <span className="font-extrabold text-[#1D2329]">$33.34</span>
                  </div>
                </div>
                <p className="rounded-md bg-[#EAF7EE] p-2 text-[11px] leading-relaxed text-[#0F5132]">
                  <span className="font-extrabold">ONLINE ONLY:</span> Additional $200 in monthly
                  bill credits ($5.56/mo. for 36 months) with new voice on elig. unlimited plan.
                </p>
                <div className="flex items-start justify-between text-xs">
                  <span>{cart.plan.name}</span>
                  <span className="font-extrabold">${cart.plan.monthly.toFixed(2)}</span>
                </div>
                {protectionTier && (
                  <div className="flex items-start justify-between text-xs">
                    <span>
                      AT&amp;T Protect Advantage {protectionTier.name} — {protectionTier.devices}
                    </span>
                    <span className="font-extrabold">${protectionTier.price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-start justify-between text-xs">
                  <span>
                    AT&amp;T Administrative/Regulatory Cost Recovery Fee{" "}
                    <a href="#" className="ml-1 text-[#0057B8] hover:underline">
                      See details
                    </a>
                  </span>
                  <span className="font-extrabold">$3.99</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-y border-[#DCDFE3] py-3">
                <p className="font-bold">Due only on first bill</p>
                <p className="font-extrabold">$35.00</p>
              </div>
              <div className="mt-2 flex items-start justify-between text-xs text-[#686E74]">
                <span>Activation fee</span>
                <span className="font-extrabold text-[#1D2329]">$35.00</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#DCDFE3] pt-3">
                <p className="font-bold">Due today</p>
                <p className="font-extrabold">${accessoryTotal.toFixed(2)}</p>
              </div>
              {cart.accessories.length > 0 && (
                <div className="mt-2 space-y-1">
                  {cart.accessories.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between text-xs text-[#686E74]"
                    >
                      <span className="pr-2">{a.brand}</span>
                      <span className="font-extrabold text-[#1D2329]">${a.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] text-[#686E74]">
                Estimated device sales tax (Calculated at checkout)
              </p>
            </div>

            <div className="rounded-2xl border border-[#DCDFE3] bg-white p-5 text-sm">
              <p className="font-extrabold">Savings &amp; promotions</p>

              <div className="mt-3 flex items-start justify-between">
                <p className="pr-3 text-sm">AutoPay and paperless billing discount</p>
                <button
                  onClick={() => setAutopay(!autopay)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${autopay ? "bg-[#0057B8]" : "bg-[#DCDFE3]"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${autopay ? "left-5" : "left-0.5"}`}
                  />
                </button>
              </div>

              {autopay && (
                <div className="mt-3 space-y-2 text-xs">
                  {(
                    [
                      [
                        "bank",
                        "Save $10.00/mo. with a bank account or AT&T Points Plus Card from Citi.",
                      ],
                      ["debit", "Save $5.00/mo. with a debit card."],
                    ] as const
                  ).map(([k, l]) => (
                    <label
                      key={k}
                      className="flex items-start gap-2 rounded-lg border border-[#DCDFE3] p-3"
                    >
                      <input
                        type="radio"
                        name="pay"
                        checked={payMethod === k}
                        onChange={() => setPayMethod(k)}
                        className="mt-0.5 h-4 w-4 accent-[#0057B8]"
                      />
                      <span>{l}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-[#DCDFE3] pt-3">
                <p className="font-bold">Total monthly savings</p>
                <p className="font-extrabold">$10.00</p>
              </div>

              <button
                onClick={() => setPromoOpen(!promoOpen)}
                className="mt-4 flex w-full items-center justify-between border-t border-[#DCDFE3] pt-3 text-sm font-bold text-[#0057B8]"
              >
                Got a promo code?
                <ChevronDown className={`h-4 w-4 transition ${promoOpen ? "rotate-180" : ""}`} />
              </button>
              {promoOpen && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 rounded-lg border border-[#DCDFE3] px-3 py-2 text-sm outline-none focus:border-[#0057B8]"
                  />
                  <button className="btn-primary text-sm">Apply</button>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="h-16" />
      </div>

      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}
