import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Heart, Smartphone, MapPin } from "lucide-react";
import { Checkbox } from "@/components/att";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BuyFlowStepper } from "@/components/site/BuyFlowStepper";
import { PLP_ITEMS, EDITORIAL_CARDS, FAQS, type PlpDevice } from "@/data/plp";

export const Route = createFileRoute("/buy/phones/")({ component: PhonesPage });

const CATS = [
  "Phones",
  "AT&T Prepaid",
  "Tablets",
  "Smartwatches",
  "Hotspots & more",
  "Accessories",
];
const PDP = "/buy/phones/apple-iphone-17-pro-max" as const;

function PhonesPage() {
  const [tradeIn, setTradeIn] = useState(true);
  return (
    <div className="bg-white text-[#1D2329]">
      <SiteHeader />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Shop phones</h1>
        <div className="mt-5">
          <BuyFlowStepper current={1} />
        </div>

        {/* Category tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 border-b border-[#DCDFE3] text-sm">
          {CATS.map((c, i) => {
            const active = i === 0;
            return (
              <button
                key={c}
                className={`relative pb-3 ${active ? "font-extrabold text-[#1D2329]" : "text-[#686E74] hover:text-[#1D2329]"}`}
              >
                {c}
                {active && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-[#009FDB]" />}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* Filter sidebar */}
          <aside className="text-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">Filters</h2>
              <button className="text-xs font-bold text-[#0072B2] hover:underline">
                Clear all
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[13px]">Show prices with trade-in</span>
              <button
                onClick={() => setTradeIn(!tradeIn)}
                className={`relative h-6 w-11 rounded-full transition ${tradeIn ? "bg-[#0057B8]" : "bg-[#DCDFE3]"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${tradeIn ? "left-5" : "left-0.5"}`}
                />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#DCDFE3] p-3">
              <Smartphone className="h-5 w-5 text-[#0072B2]" />
              <div className="text-[13px]">
                <div className="font-bold">Bring your own device</div>
                <a href="#" className="text-xs font-bold text-[#0072B2] hover:underline">
                  Get started &gt;
                </a>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#DCDFE3] p-3">
              <MapPin className="h-5 w-5 text-[#0072B2]" />
              <div className="text-[13px]">
                <div className="font-bold">Buy online &amp; pick up at store</div>
                <a href="#" className="text-xs font-bold text-[#0072B2] hover:underline">
                  Find stores &gt;
                </a>
              </div>
            </div>

            <FilterGroup
              title="Brand"
              defaultOpen
              items={[
                ["Apple", 18],
                ["Samsung", 32],
                ["Google", 8],
                ["Motorola", 6],
                ["Sonim", 6],
              ]}
              showAll
            />
            <FilterGroup
              title="Featured"
              items={[
                ["5G", 40],
                ["Trade-in eligible", 22],
              ]}
              showAll
            />
            <FilterGroup
              title="Color"
              items={[
                ["Black", 40],
                ["Blue", 12],
                ["Silver", 9],
              ]}
              showAll
            />
            <FilterGroup
              title="OS"
              items={[
                ["iOS", 18],
                ["Android", 39],
              ]}
            />
            <FilterGroup
              title="Delivery method"
              items={[
                ["Ship to me", 57],
                ["Pick up in store", 44],
              ]}
            />
            <FilterGroup
              title="Price range"
              items={[
                ["$0 - $199", 14],
                ["$200 - $599", 13],
                ["$600+", 30],
              ]}
              showAll
            />
            <FilterGroup
              title="Device condition"
              items={[
                ["New", 49],
                ["AT&T Certified Pre-Owned", 8],
              ]}
            />
          </aside>

          {/* Grid */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold">57 items</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button className="rounded-full border border-[#00388F] px-4 py-1.5 text-xs font-bold text-[#0072B2] hover:bg-[#E7F5FB]">
                  Help me choose
                </button>
                <button className="text-xs font-bold text-[#0072B2]">Hide filters</button>
                <button className="inline-flex items-center gap-1 rounded-md border border-[#DCDFE3] px-3 py-1.5 text-xs font-bold">
                  Sort-by: Best-selling <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PLP_ITEMS.map((item, i) =>
                item.kind === "promo" ? (
                  <a
                    key={`promo-${i}`}
                    href="#"
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#DCDFE3] bg-white"
                  >
                    <img
                      src={item.img}
                      alt={item.alt}
                      loading="lazy"
                      className="h-full w-full flex-1 object-cover"
                    />
                    <span className="p-4 text-sm font-bold text-[#0072B2] group-hover:underline">
                      See offer details &gt;
                    </span>
                  </a>
                ) : (
                  <ProductCard key={item.name} p={item} />
                ),
              )}
            </div>

            {/* Editorial row (exact titles + images) */}
            <section className="mt-16">
              <h2 className="text-center text-2xl font-extrabold md:text-3xl">
                Stay connected with the latest phones and wireless plans from AT&amp;T
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {EDITORIAL_CARDS.map((c) => (
                  <article key={c.title}>
                    <img
                      src={c.img}
                      alt={c.title}
                      loading="lazy"
                      className="h-28 w-full rounded-xl object-cover"
                    />
                    <h3 className="mt-3 text-sm font-extrabold leading-snug">{c.title}</h3>
                    <a
                      href="#"
                      className="mt-2 inline-block text-xs font-bold text-[#0072B2] hover:underline"
                    >
                      {c.cta} &gt;
                    </a>
                  </article>
                ))}
              </div>
            </section>

            {/* FAQ (exact questions) */}
            <section className="mt-16">
              <div className="flex items-center justify-between">
                <h2 className="text-center text-2xl font-extrabold md:text-3xl">
                  Frequently asked questions
                </h2>
                <a href="#" className="text-sm font-bold text-[#0072B2] hover:underline">
                  Expand all
                </a>
              </div>
              <div className="mt-6 divide-y divide-[#DCDFE3] border-y border-[#DCDFE3]">
                {FAQS.map((q) => (
                  <details key={q} className="group py-5">
                    <summary className="flex cursor-pointer items-center justify-between text-base font-bold">
                      {q}
                      <ChevronDown className="h-5 w-5 text-[#0072B2] transition group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-sm text-[#686E74]">
                      Placeholder answer explaining details about this question.
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {/* SEO block */}
            <section className="mt-16 rounded-2xl bg-[#F3F4F6] p-8">
              <h2 className="text-xl font-extrabold">Explore our best phone options</h2>
              <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2 md:grid-cols-4">
                {[
                  [
                    "Phone brand",
                    [
                      "Apple phones",
                      "Samsung phones",
                      "Google phones",
                      "Motorola phones",
                      "Sonim phones",
                    ],
                  ],
                  [
                    "Phone OS and popular colors",
                    ["iOS phones", "Android phones", "Black phones", "Blue phones", "Pink phones"],
                  ],
                  [
                    "Popular phones",
                    [
                      "iPhone 17 Pro Max",
                      "iPhone 17",
                      "Galaxy S26 Ultra",
                      "Pixel 10 Pro",
                      "Galaxy Z Fold8",
                    ],
                  ],
                  [
                    "Accessories",
                    ["Headphones", "Wearables", "Phone cases", "Chargers", "Screen protectors"],
                  ],
                ].map(([h, items]) => (
                  <div key={h as string}>
                    <h4 className="font-extrabold">{h as string}</h4>
                    <ul className="mt-2 space-y-1">
                      {(items as string[]).map((l) => (
                        <li key={l}>
                          <a href="#" className="text-[#0072B2] hover:underline">
                            {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

function FilterGroup({
  title,
  items,
  defaultOpen,
  showAll,
}: {
  title: string;
  items: [string, number][];
  defaultOpen?: boolean;
  showAll?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="mt-6 border-t border-[#DCDFE3] pt-4">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen(!open)}>
        <span className="text-sm font-extrabold">{title}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map(([l, n]) => (
            <li key={l}>
              <Checkbox
                className="min-h-0 py-1"
                label={
                  <>
                    {l} <span className="text-[#686E74]">({n})</span>
                  </>
                }
              />
            </li>
          ))}
          {showAll && (
            <li>
              <a href="#" className="text-xs font-bold text-[#0072B2] hover:underline">
                [+] Show all
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function ProductCard({ p }: { p: PlpDevice }) {
  return (
    <article className="flex flex-col rounded-2xl border border-[#DCDFE3] bg-white p-5">
      {p.badge && (
        <span className="mb-2 inline-block self-start rounded-full bg-[#1D2329] px-3 py-1 text-[11px] font-bold text-white">
          {p.badge}
        </span>
      )}
      <Link to={PDP} className="grid h-44 place-items-center">
        <img src={p.img} alt={p.name} loading="lazy" className="max-h-44 object-contain" />
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <span
          className="h-4 w-4 rounded-full border border-[#DCDFE3] ring-2 ring-[#0057B8] ring-offset-1"
          style={{ background: p.colorHex }}
        />
        <span className="text-xs text-[#686E74]">{p.colorName}</span>
      </div>
      <a href="#" className="mt-2 text-xs font-bold text-[#0072B2] hover:underline">
        Quick view &gt;
      </a>
      <p className="mt-2 text-xs text-[#686E74]">{p.brand}</p>
      <h3 className="text-base font-extrabold">{p.name}</h3>
      <p className="text-xs text-[#686E74]">★ {p.rating}</p>
      <p className="mt-2 text-xs text-[#686E74]">As low as</p>
      <p className="text-2xl font-extrabold">
        {p.price}{" "}
        <span className="ml-1 align-middle text-sm font-normal text-[#686E74] line-through">
          {p.original}
        </span>
      </p>
      <p className="text-xs text-[#686E74]">with eligible trade-in</p>
      <p className="mt-2 text-[11px] leading-relaxed text-[#686E74]">
        Req's new line &amp; elig. unlimited plan. Promo credit/mo. for 36 mos. via bill credits.
        Restrictions apply.
      </p>
      <a href="#" className="mt-1 text-xs font-bold text-[#0072B2] hover:underline">
        See offer details
      </a>
      <div className="mt-4 flex items-center justify-between border-t border-[#DCDFE3] pt-3 text-xs">
        <Checkbox className="min-h-0 py-0 font-bold" label="Compare" />
        <button aria-label="Save" className="rounded-full p-1 hover:bg-[#F3F4F6]">
          <Heart className="h-4 w-4" />
        </button>
        <Link to={PDP} className="font-bold text-[#0072B2] hover:underline">
          See device offers &gt;
        </Link>
      </div>
    </article>
  );
}
