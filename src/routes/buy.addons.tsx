import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Check,
  X,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BuyFlowStepper } from "@/components/site/BuyFlowStepper";
import { TierCards } from "@/components/deviceflex/TierCards";
import { type Tier } from "@/data/deviceflex";
import { useCart } from "@/lib/cart";
import caseFootball from "@/assets/case-football.jpg";
import casePattern from "@/assets/case-pattern.jpg";
import caseClear from "@/assets/case-clear.jpg";
import caseChrome from "@/assets/case-chrome.jpg";

export const Route = createFileRoute("/buy/addons")({ component: AddonsPage });

const BENEFITS = [
  "15-minute in-store swaps, with your cost confirmed upfront",
  "Free loaner phone for the entire repair",
  "AI Damage Assessment — 3 photos, auto-booked",
  "Smart Restore — your data back in under 2 minutes",
  "Family pool, gadget library & annual accessory perk",
];

const TABS = ["Cases", "Screen protectors", "Chargers", "Headphones", "Other top picks", "SALE"];

type Accessory = {
  id: string;
  brand: string;
  name: string;
  img: string;
  price: string;
  value: number;
  original?: string;
  rating: string;
  sale?: boolean;
};
const ACCESSORIES: Accessory[] = [
  {
    id: "ac1",
    brand: "Casetify",
    name: "FIFA World Cup 26 Football Case - iPhone 17 Pro Max",
    img: caseFootball,
    price: "+$64.00",
    value: 64,
    rating: "0.0",
  },
  {
    id: "ac2",
    brand: "Casetify",
    name: "FIFA World Cup 26 Pattern Case - iPhone 17 Pro Max",
    img: casePattern,
    price: "+$64.00",
    value: 64,
    rating: "0.0",
  },
  {
    id: "ac3",
    brand: "Body Glove",
    name: "Prism Grip MagSafe Case - iPhone 17 Pro Max",
    img: caseClear,
    price: "+$20.00",
    value: 20,
    original: "$40.00",
    rating: "3.1 | 134",
    sale: true,
  },
  {
    id: "ac4",
    brand: "Speck",
    name: "Presidio Perfect-Clear Grip Chrome ClickLock MagSafe Case",
    img: caseChrome,
    price: "+$55.00",
    value: 55,
    rating: "3.6 | 301",
  },
];

function AddonsPage() {
  const navigate = useNavigate();
  const { cart, protectionTier, setProtection, declineProtection, addAccessory, monthlyTotal } =
    useCart();
  const [offerOpen, setOfferOpen] = useState(true);
  const [modal, setModal] = useState(false);
  const protection = cart.protection;

  // Nudge once. If they've already declined, respect it and move on.
  const goCart = () => {
    if (protection || cart.protectionDeclined) navigate({ to: "/buy/cart" });
    else setModal(true);
  };

  return (
    <div className="bg-white text-[#1D2329]">
      <SiteHeader />

      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
          Adding a new device
        </p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Get add-ons</h1>
        <div className="mt-6">
          <BuyFlowStepper current={4} />
        </div>

        <div className="mt-8 rounded-2xl bg-[#F3F4F6] p-5">
          <button
            onClick={() => setOfferOpen(!offerOpen)}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0057B8] text-white">
              <DollarSign className="h-5 w-5" />
            </span>
            <span className="flex-1 font-extrabold">Offer applied (1)</span>
            <ChevronUp className={`h-5 w-5 transition ${offerOpen ? "" : "rotate-180"}`} />
          </button>
          {offerOpen && (
            <div className="mt-4 rounded-xl bg-white p-4 text-sm leading-relaxed">
              ONLINE ONLY: You will get an additional $200 in monthly bill credits ($5.56/mo. for 36
              months) with new voice on elig. unlimited plan (speed restr's apply). Credits start
              within 3 bills.
            </div>
          )}
        </div>

        {/* Protect your new phone with DeviceFlex */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-extrabold">Protect it with AT&amp;T Protect Advantage</h2>
            <span className="rounded-full bg-[#E7F5FB] px-3 py-1 text-[11px] font-bold text-[#0057B8]">
              Powered by DeviceFlex AI
            </span>
          </div>
          <p className="mt-2 text-sm text-[#686E74]">
            Protection that delivers value every month — not just when your device breaks.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
                  <Check className="h-4 w-4 text-[#0057B8]" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl bg-[#F3F4F6] p-6">
            <p className="text-center text-lg font-extrabold">
              Choose your Protect Advantage membership
            </p>
            <p className="mt-1 text-center text-sm text-[#686E74]">
              All tiers include AI-guided claims, 15-minute swaps, and upfront pricing.
            </p>
            <div className="mt-6">
              <TierCards
                selected={protection ?? undefined}
                onSelect={(id) => setProtection(id)}
                ctaLabel="Add to cart"
              />
            </div>
            {protectionTier && (
              <p className="mt-5 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-white p-3 text-sm font-bold text-[#1F7A3D]">
                <ShieldCheck className="h-4 w-4" />
                AT&amp;T Protect Advantage {protectionTier.name} added — ${protectionTier.price}/mo.
                <button
                  onClick={() => setProtection(null)}
                  className="ml-1 text-xs font-bold text-[#686E74] hover:underline"
                >
                  Remove
                </button>
              </p>
            )}
          </div>
        </section>

        {/* Accessories */}
        <section className="mt-14">
          <h2 className="text-center text-2xl font-extrabold">Accessories for your new device</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 border-b border-[#DCDFE3] text-sm">
            {TABS.map((t, i) => {
              const active = i === 0;
              return (
                <button
                  key={t}
                  className={`relative pb-3 ${active ? "font-extrabold text-[#1D2329]" : "font-bold text-[#686E74] hover:text-[#1D2329]"}`}
                >
                  {t}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-[3px] bg-[#009FDB]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative mt-6">
            <button className="absolute -left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#DCDFE3] bg-white shadow">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="absolute -right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#DCDFE3] bg-white shadow">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="mx-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ACCESSORIES.map((a) => (
                <article
                  key={a.name}
                  className="flex flex-col rounded-2xl border border-[#DCDFE3] bg-white p-4"
                >
                  {a.sale && (
                    <span className="mb-2 inline-block self-start rounded-full bg-[#1D2329] px-2.5 py-0.5 text-[10px] font-bold text-white">
                      On sale
                    </span>
                  )}
                  <img
                    src={a.img}
                    alt={a.name}
                    loading="lazy"
                    className="mx-auto h-32 object-contain"
                  />
                  <p className="mt-3 text-[11px] text-[#686E74]">{a.brand}</p>
                  <p className="text-xs text-[#686E74]">★ {a.rating}</p>
                  <h3 className="mt-1 text-sm font-extrabold leading-snug">{a.name}</h3>
                  <p className="mt-2 text-lg font-extrabold">
                    {a.original && (
                      <span className="mr-2 text-sm font-normal text-[#686E74] line-through">
                        {a.original}
                      </span>
                    )}
                    {a.price}
                  </p>
                  <AccessoryButton
                    a={a}
                    onAdd={() =>
                      addAccessory({
                        id: a.id,
                        name: a.name,
                        brand: a.brand,
                        price: a.value,
                        image: a.img,
                      })
                    }
                    inCart={cart.accessories.some((x) => x.id === a.id)}
                  />
                </article>
              ))}
            </div>
            <div className="mt-5 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i === 0 ? "bg-[#0057B8]" : "bg-[#DCDFE3]"}`}
                />
              ))}
            </div>
          </div>
        </section>

        <div className="h-24" />
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-30 border-t border-[#DCDFE3] bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <div>
            <p className="text-lg font-extrabold">
              ${monthlyTotal.toFixed(2)} Monthly <span className="mx-2 text-[#DCDFE3]">|</span>{" "}
              $0.00 Today
            </p>
            <p className="text-xs text-[#686E74]">
              {protectionTier
                ? `Includes Protect Advantage ${protectionTier.name} at $${protectionTier.price}/mo. Taxes and fees extra.`
                : "Totals are estimated. Taxes and fees extra."}
            </p>
          </div>
          <button onClick={goCart} className="btn-primary">
            Go to cart
          </button>
        </div>
      </div>

      <SiteFooter />
      <GlobalWidgets />

      {modal && (
        <ProtectionModal
          onClose={() => setModal(false)}
          onContinue={() => {
            declineProtection();
            setModal(false);
            navigate({ to: "/buy/cart" });
          }}
        />
      )}
    </div>
  );
}

function ProtectionModal({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 px-4 py-8 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 hover:bg-[#F3F4F6]"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E7F5FB]">
            <Shield className="h-7 w-7 text-[#0057B8]" />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold">Wait! Your device isn't protected.</h2>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-[#DCDFE3]">
          <div className="grid grid-cols-3 bg-[#F3F4F6] text-xs font-extrabold">
            <div className="p-3">Claim</div>
            <div className="p-3 text-center">Without coverage</div>
            <div className="relative p-3 text-center">
              With coverage
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#0057B8] px-2 py-0.5 text-[10px] text-white">
                Recommended
              </span>
            </div>
          </div>
          {[
            ["Cracked screen repair", "$329*", "$0"],
            ["Phone replacement", "Full retail price", "Deductible & service fees"],
            ["Battery replacement", "$69*", "$0"],
          ].map(([c, a, b]) => (
            <div key={c} className="grid grid-cols-3 border-t border-[#DCDFE3] text-sm">
              <div className="p-3 font-bold">{c}</div>
              <div className="p-3 text-center">{a}</div>
              <div className="p-3 text-center bg-[#E7F5FB]">{b}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-[#F3F4F6] p-5">
          <p className="text-sm font-extrabold">AT&amp;T Protect Advantage offers more:</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-[#0057B8]" /> Unlimited number of claims for
              damage, loss, and theft
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-[#0057B8]" /> ProTech expert support to help you
              with your covered devices
            </li>
          </ul>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-[#686E74]">
          *Prices vary by device. See terms for full details on coverage, deductibles, and service
          fees.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
          <button onClick={onContinue} className="btn-primary flex-1">
            Continue without device protection
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            See device protection options
          </button>
        </div>
      </div>
    </div>
  );
}

function AccessoryButton({
  a,
  onAdd,
  inCart,
}: {
  a: Accessory;
  onAdd: () => void;
  inCart: boolean;
}) {
  return inCart ? (
    <button disabled className="btn-secondary mt-auto pt-3 text-sm opacity-70">
      <Check className="mr-1 inline h-4 w-4" /> In cart
    </button>
  ) : (
    <button onClick={onAdd} className="btn-primary mt-auto pt-3 text-sm">
      Add to Cart
    </button>
  );
}
