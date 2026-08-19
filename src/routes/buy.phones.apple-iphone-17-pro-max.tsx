import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Shield,
  Camera,
  Zap,
  Battery,
  Cpu,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getDevice } from "@/data/devices";

export const Route = createFileRoute("/buy/phones/apple-iphone-17-pro-max")({ component: PDP });

const DEVICE = getDevice("apple-iphone-17-pro-max")!;
const STORAGE = ["256GB", "512GB", "1TB", "2TB"];
const PAYMENTS = ["36-mo. installment", "Pay in full", "Lease"];

const FEATURES = [
  { Icon: Shield, t: "UNIBODY DESIGN. FOR EXCEPTIONAL DURABILITY." },
  { Icon: Camera, t: "48MP FUSION CAMERA SYSTEM." },
  { Icon: Zap, t: "CERAMIC SHIELD. FRONT AND BACK." },
  { Icon: Battery, t: "BEST-EVER BATTERY LIFE." },
  { Icon: Cpu, t: "A19 PRO CHIP. UNMATCHED SPEED." },
];

function PDP() {
  const navigate = useNavigate();
  const [colorIdx, setColorIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const [storage, setStorage] = useState(0);
  const [payment, setPayment] = useState(0);
  const [nextUp, setNextUp] = useState<"yes" | "no" | null>(null);
  const [modal, setModal] = useState(true);

  const color = DEVICE.colors[colorIdx];
  const gallery = color.gallery;
  const current = gallery[Math.min(imgIdx, gallery.length - 1)];
  const selectColor = (i: number) => {
    setColorIdx(i);
    setImgIdx(0);
  };
  const prev = () => setImgIdx((imgIdx - 1 + gallery.length) % gallery.length);
  const next = () => setImgIdx((imgIdx + 1) % gallery.length);

  return (
    <div className="bg-white text-[#1D2329]">
      <SiteHeader cartCount={0} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10">
        <Link to="/buy/phones" className="text-sm font-bold text-[#0057B8] hover:underline">
          &lt; Back to phones
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative rounded-2xl border border-[#DCDFE3] bg-white p-6">
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#DCDFE3] bg-white shadow hover:bg-[#F3F4F6]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#DCDFE3] bg-white shadow hover:bg-[#F3F4F6]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <img
                src={current}
                alt={`${DEVICE.name} ${color.name}`}
                className="mx-auto h-96 object-contain"
              />
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {gallery.map((g, i) => (
                  <button
                    key={g}
                    onClick={() => setImgIdx(i)}
                    className={`h-20 w-20 shrink-0 rounded-lg border p-1 ${i === imgIdx ? "border-[#0057B8] ring-2 ring-[#0057B8]/30" : "border-[#DCDFE3]"}`}
                  >
                    <img src={g} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="font-bold">★ {DEVICE.rating}</span>
              <a href="#" className="font-bold text-[#0057B8] hover:underline">
                Write a review
              </a>
            </div>
            <a
              href="#"
              className="mt-2 inline-block text-sm font-bold text-[#0057B8] hover:underline"
            >
              Learn more about this device &gt;
            </a>
          </div>

          {/* Configurator */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
              {DEVICE.brand}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{DEVICE.name}</h1>
            <p className="mt-2 text-2xl font-extrabold">
              $33.34/mo.{" "}
              <span className="ml-2 text-sm font-normal text-[#686E74]">for 36 months</span>
            </p>

            <Section title={`Color: ${color.name}`}>
              <div className="flex gap-3">
                {DEVICE.colors.map((c, i) => (
                  <button
                    key={c.slug}
                    onClick={() => selectColor(i)}
                    className={`h-9 w-9 rounded-full border-2 ${i === colorIdx ? "border-[#0057B8] ring-2 ring-[#0057B8]/30" : "border-[#DCDFE3]"}`}
                    style={{ background: c.hex }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </Section>

            <Section title="Storage">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STORAGE.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setStorage(i)}
                    className={`rounded-lg border px-3 py-3 text-sm font-bold ${i === storage ? "border-[#0057B8] bg-[#E7F5FB] text-[#0057B8]" : "border-[#DCDFE3] hover:border-[#1D2329]"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Payment option">
              <div className="grid gap-2">
                {PAYMENTS.map((p, i) => (
                  <button
                    key={p}
                    onClick={() => setPayment(i)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-bold ${i === payment ? "border-[#0057B8] bg-[#E7F5FB] text-[#0057B8]" : "border-[#DCDFE3]"}`}
                  >
                    {p}
                    <span className={i === payment ? "text-[#0057B8]" : "text-[#686E74]"}>›</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Add Next Up Anytime +$10.00/mo.">
              <div className="grid gap-2">
                <button
                  onClick={() => setNextUp("yes")}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-bold ${nextUp === "yes" ? "border-[#0057B8] bg-[#E7F5FB] text-[#0057B8]" : "border-[#DCDFE3]"}`}
                >
                  Yes, add Next Up Anytime
                </button>
                <button
                  onClick={() => setNextUp("no")}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-bold ${nextUp === "no" ? "border-[#0057B8] bg-[#E7F5FB] text-[#0057B8]" : "border-[#DCDFE3]"}`}
                >
                  No thanks
                </button>
              </div>
              <p className="mt-2 text-xs text-[#686E74]">
                Upgrade your phone early once you've paid off 50% of your device.
              </p>
            </Section>

            <button
              onClick={() => navigate({ to: "/buy/plan" })}
              className="btn-primary mt-6 w-full"
            >
              Continue
            </button>
          </div>
        </div>

        {/* Overview */}
        <section className="mt-16">
          <h2 className="text-2xl font-extrabold md:text-3xl">Overview</h2>
          <p className="mt-4 max-w-4xl text-[15px] leading-relaxed text-[#1D2329]">
            iPhone 17 Pro Max. The most powerful iPhone ever, with a heat-forged aluminum unibody
            design, A19 Pro chip, all-new 48MP rear cameras, and best-ever battery life.
          </p>
        </section>

        {/* Key features */}
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold md:text-3xl">Key features</h2>
          <div className="relative mt-6">
            <button className="absolute left-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#DCDFE3] bg-white shadow">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="absolute right-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#DCDFE3] bg-white shadow">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="mx-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {FEATURES.slice(0, 4).map(({ Icon, t }) => (
                <article key={t} className="rounded-2xl border border-[#DCDFE3] p-5 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E7F5FB]">
                    <Icon className="h-6 w-6 text-[#0057B8]" />
                  </span>
                  <p className="mt-4 text-sm font-extrabold leading-snug">{t}</p>
                  <a
                    href="#"
                    className="mt-3 inline-block text-xs font-bold text-[#0057B8] hover:underline"
                  >
                    Read more
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="h-24" />
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-30 border-t border-[#DCDFE3] bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <div>
            <p className="text-lg font-extrabold">$33.34 Monthly</p>
            <p className="text-xs text-[#686E74]">Plus taxes and fees.</p>
          </div>
          <button onClick={() => navigate({ to: "/buy/plan" })} className="btn-primary">
            Continue
          </button>
        </div>
      </div>

      <SiteFooter />
      <GlobalWidgets />

      {/* First-load modal */}
      {modal && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 px-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <button
              aria-label="Close"
              onClick={() => setModal(false)}
              className="absolute right-4 top-4 rounded p-1 hover:bg-[#F3F4F6]"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E7F5FB]">
                <User className="h-7 w-7 text-[#0057B8]" />
              </span>
              <h2 className="mt-4 text-xl font-extrabold">What do you want to do?</h2>
            </div>
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
                Start new wireless service
              </p>
              <div className="mt-2 space-y-2">
                <button onClick={() => setModal(false)} className="btn-secondary w-full">
                  I'm brand new here
                </button>
                <button onClick={() => setModal(false)} className="btn-secondary w-full">
                  I have another AT&amp;T account
                </button>
              </div>
            </div>
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
                Manage my wireless
              </p>
              <div className="mt-2 space-y-2">
                <button onClick={() => setModal(false)} className="btn-secondary w-full">
                  Add a line
                </button>
                <button onClick={() => setModal(false)} className="btn-secondary w-full">
                  Upgrade my device
                </button>
              </div>
            </div>
            <div className="my-5 border-t border-[#DCDFE3]" />
            <div className="text-center">
              <a href="#" className="text-sm font-bold text-[#0057B8] hover:underline">
                I am a business customer
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-[#DCDFE3] pt-5">
      <p className="mb-3 text-sm font-extrabold">{title}</p>
      {children}
    </div>
  );
}
