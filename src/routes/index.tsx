import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Wifi,
  Check,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import heroImg from "@/assets/hero-internet-air.jpg";
import promoFriends from "@/assets/promo-friends.jpg";
import wirelessWoman from "@/assets/wireless-woman.jpg";
import btsKid from "@/assets/back-to-school-kid.jpg";
import editFamily from "@/assets/edit-family.jpg";
import editSavings from "@/assets/edit-savings.jpg";
import editCard from "@/assets/edit-card.jpg";
import editWifi from "@/assets/edit-wifi.jpg";

export const Route = createFileRoute("/")({ component: Index });

// Real AT&T CDN device images + guarantee, served from /public/att
const IMG = {
  iphone17pro: "/att/devices/apple-iphone-17-pro/cosmic-orange-hero.webp",
  iphone17e: "/att/devices/apple-iphone-17e/black-hero.png",
  galaxyS26: "/att/devices/samsung-galaxy-s26/black-hero.png",
  galaxyS26Ultra: "/att/devices/samsung-galaxy-s26-ultra/black-hero.png",
  guarantee: "/att/misc/att-guarantee.jpg",
  // Lifestyle shot of a cracked phone in hand. Falls back to the crack render below
  // until the photo is dropped in, so the banner never shows a broken image.
  protect: "/att/misc/protect-cracked-phone.webp",
  protectFallback: "/att/samples/cracked-screen-severe.png",
};

const DEALS = [
  {
    img: IMG.iphone17e,
    title: "Get iPhone 17e for less than $1/mo.",
    body: "Add a new line. No trade-in required.",
  },
  {
    img: IMG.galaxyS26,
    title: "Get Samsung Galaxy S26 for $0",
    body: "Add a new line. No trade-in required.",
  },
  {
    img: IMG.galaxyS26Ultra,
    title: "Get the new Samsung Galaxy S26 Ultra for up to $1,100 off",
    body: "New & existing customers. Any condition trade-in.",
  },
];

// Official AT&T "Explore more" icons (two-tone; .svg-base + .svg-accent colored via styles.css)
const EXPLORE: { label: string; to?: "/buy/phones"; svg: string }[] = [
  {
    label: "Back-to-school deals",
    svg: `<svg class="h-14 w-14" height="56" width="56" role="img" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><path class="svg-base" d="M67 51V39.46L48 26.8 29 39.07V51H10v29a6 6 0 006 6h64a6 6 0 006-6V51zM16 84a4 4 0 01-4-4V53h17v31zm37 0H43v-8a5 5 0 015-5h.1a5 5 0 015 5zm2 0v-8a7 7 0 00-7-7 7 7 0 00-7 7v8H31V40.16l17-11 17 11.38V84zm29-4a4 4 0 01-4 4H67V53h17zM48 37a11 11 0 1011 11 11 11 0 00-11-11zm0 20a9 9 0 119-9 9 9 0 01-9 9zm1-9.37l2.64 2.64-1.41 1.41L47 48.46V43h2zM25 62v2h-9v-2zm-9 11h9v2h-9zm64-9h-9v-2h9zm-9 11v-2h9v2z"></path><path class="svg-accent" d="M49 24h-2V11.09l14.78 5.54L49 20.89zm0-10v4.8l6.78-2.26z"></path></svg>`,
  },
  {
    label: "Explore internet",
    svg: `<svg class="h-14 w-14" height="56" width="56" role="img" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><path class="svg-accent" d="M81.1 76.39l8.52-4.17-29-11.6 11.6 29 4.17-8.52 8.87 8.9L90 85.26zm-5.28 1.32l-3.42 7-8.19-20.5L84.7 72.4l-7 3.42 9.44 9.44-1.89 1.89z"></path><path class="svg-base" d="M49.51 79.56c3.19-2.93 5.9-8.39 7.69-15.8a85.27 85.27 0 002.19-19.24H80A35.89 35.89 0 0175.16 62l1.73 1a38 38 0 10-13.48 13.67l-1-1.72a36 36 0 01-12.9 4.61zm6.1-17.85a31 31 0 00-23.19 0 85.32 85.32 0 01-1.79-17.17h26.76a85.48 85.48 0 01-1.78 17.17zm-25-19.19a83.47 83.47 0 011.78-16.19A31.11 31.11 0 0044 28.57a31 31 0 0011.63-2.28 84.57 84.57 0 011.79 16.23zm49.32 0H59.38a86.17 86.17 0 00-1.89-17.07A31.22 31.22 0 0068 17.23a35.88 35.88 0 0112 25.29zM66.49 15.94A29.35 29.35 0 0157 23.47c-1.76-6.85-4.38-12.14-7.51-15a35.82 35.82 0 0117 7.47zm-11.35 8.38A29.14 29.14 0 0144 26.57a29.18 29.18 0 01-11.09-2.21C35.3 14.6 39.43 8 44 8s8.71 6.58 11.14 16.32zM31 23.51A29.26 29.26 0 0121.47 16a35.72 35.72 0 0117-7.54c-3.1 2.87-5.72 8.19-7.47 15.05zm-11-6.23a31.28 31.28 0 0010.52 8.22 85 85 0 00-1.88 17H8.06A35.91 35.91 0 0120 17.28zM8 44.52h20.63a86.34 86.34 0 001.89 18 31.32 31.32 0 00-10.58 8.22A35.93 35.93 0 018 44.52zm13.46 27.53A29.23 29.23 0 0131 64.51c1.75 6.85 4.37 12.16 7.51 15a35.91 35.91 0 01-17.05-7.46zm11.41-8.39a29.09 29.09 0 0122.29 0C52.65 73.75 48.4 80 44 80c-4.57 0-8.7-6.58-11.13-16.34z"></path></svg>`,
  },
  {
    label: "Shop phones",
    to: "/buy/phones",
    svg: `<svg class="h-14 w-14" height="56" width="56" role="img" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><path class="svg-base" d="M68 90H28a6 6 0 01-6-6V12a6 6 0 016-6h40a6 6 0 016 6v72a6 6 0 01-6 6zM28 8a4 4 0 00-4 4v72a4 4 0 004 4h40a4 4 0 004-4V12a4 4 0 00-4-4z"></path><path class="svg-accent" d="M56 15H40v-2h16z"></path></svg>`,
  },
  {
    label: "Explore wireless",
    svg: `<svg class="h-14 w-14" height="56" width="56" role="img" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><path class="svg-base" d="M22 86h-2V67h2zm18-38h-2v38h2zm18-19h-2v57h2z"></path><path class="svg-accent" d="M76 86h-2V10h2z"></path></svg>`,
  },
  {
    label: "Shop phone plans",
    svg: `<svg class="h-14 w-14" height="56" width="56" role="img" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><path class="svg-accent" d="M40.03 61.01h-2v-5h2v5zm6-11h-2v11h2v-11zm6-6h-2v17h2v-17zm6-6h-2v23h2v-23z"></path><path class="svg-base" d="M54.03 22.01h-12v-2h12v2zm15 55v-57c0-3.31-2.69-6-6-6h-30c-3.31 0-6 2.69-6 6v57c0 3.31 2.69 6 6 6h30c3.31 0 6-2.69 6-6zm-6-61c2.21 0 4 1.79 4 4v57c0 2.21-1.79 4-4 4h-30c-2.21 0-4-1.79-4-4v-57c0-2.21 1.79-4 4-4h30zM77.5 79.63c1.35-.86 2.29-2.2 2.63-3.76l9.8-44.21a5.95 5.95 0 00-.8-4.52 5.942 5.942 0 00-3.76-2.63L72.25 21.6l-.43 1.95 13.12 2.91c1.04.23 1.93.85 2.51 1.76s.76 1.97.53 3.01l-9.8 44.21c-.48 2.15-2.62 3.52-4.77 3.04l-1.16-.26-.43 1.95 1.16.26c.44.1.88.14 1.31.14 1.13 0 2.24-.32 3.21-.94zm1.79-51.04l-7.04-1.56-.43 1.95 7.04 1.56.43-1.95zm-56.2 51.84l1.16-.26-.43-1.95-1.16.26c-2.15.48-4.29-.89-4.77-3.04L8.08 31.23c-.23-1.04-.04-2.11.53-3.01s1.46-1.53 2.51-1.76l13.12-2.91-.43-1.95-13.12 2.91a5.994 5.994 0 00-4.56 7.15l9.8 44.21c.35 1.56 1.28 2.9 2.63 3.76.98.62 2.08.94 3.21.94.44 0 .87-.05 1.31-.14zm1.16-51.45l-.43-1.95-7.04 1.56.43 1.95 7.04-1.56z"></path></svg>`,
  },
  {
    label: "Bring your own devices",
    svg: `<svg class="h-14 w-14" height="56" width="56" role="img" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><path class="svg-base" d="M74 12v72a6 6 0 01-6 6H28a6 6 0 01-6-6V58h2v26a4 4 0 004 4h40a4 4 0 004-4V12a4 4 0 00-4-4H28a4 4 0 00-4 4v26h-2V12a6 6 0 016-6h40a6 6 0 016 6zm-18 1H40v2h16z"></path><path class="svg-accent" d="M44.17 49H10v-2h34.16L31.73 34.57l1.41-1.41L48 48 33.14 62.86l-1.41-1.42z"></path></svg>`,
  },
  {
    label: "Upgrade your phone",
    svg: `<svg class="h-14 w-14" height="56" width="56" role="img" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><path class="svg-base" d="M84 62v15h-2V64.93A38 38 0 0110 48h2a36 36 0 0068.23 16H69v-2zM48 10a38 38 0 00-34 21.07V19h-2v15h15v-2H15.77A36 36 0 0184 48h2a38 38 0 00-38-38z"></path><path class="svg-accent" d="M57 69H39a4 4 0 01-4-4V32a4 4 0 014-4h18a4 4 0 014 4v33a4 4 0 01-4 4zM39 30a2 2 0 00-2 2v33a2 2 0 002 2h18a2 2 0 002-2V32a2 2 0 00-2-2zm13 3h-8v2h8z"></path></svg>`,
  },
];

const EDITORIAL = [
  {
    img: editFamily,
    title: "Stay connected with the whole family",
    body: "Flexible unlimited plans built for households of every size, with savings that grow as you add lines.",
  },
  {
    img: editSavings,
    title: "Save up to $420/year",
    body: "See how switching to AT&T can lower your monthly bill while keeping the fast, reliable service you rely on.",
  },
  {
    img: editCard,
    title: "The only card that lets you earn $10 discounts on your AT&T bills",
    body: "Rewards designed for AT&T customers, so every purchase helps trim your next monthly bill.",
  },
  {
    img: editWifi,
    title: "Wi-Fi the way you want it",
    body: "Straightforward home internet plans with all-in pricing, easy self-setup, and no annual contracts.",
  },
];

function Index() {
  const [deal, setDeal] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [edit, setEdit] = useState(0);

  return (
    <div className="bg-white text-[#1D2329]">
      <SiteHeader />

      {/* Promo strip */}
      <section className="bg-[#E7F5FB]">
        <div className="mx-auto max-w-[1280px] px-4 py-4 text-center sm:px-6 lg:px-10">
          <p className="text-[17px] font-bold leading-snug text-[#1D2329] md:text-lg">
            Switch to AT&amp;T and learn how to get up to $800/line to break your contract.
          </p>
          <p className="mt-1 text-xs text-[#686E74]">
            Up to $800 via reward card (redemption required). Restrictions apply.{" "}
            <a href="#" className="underline hover:text-[#0057B8]">
              See offer details
            </a>
          </p>
        </div>
      </section>

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
          <h1
            className="text-center font-extrabold text-[#009FDB]"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            Great connections start here
          </h1>

          <div className="relative mt-10 overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_#DCDFE3,inset_0_0_0_1px_#DCDFE3]">
            <div className="grid items-center gap-0 lg:grid-cols-2">
              <div className="p-8 sm:p-10 lg:p-14">
                <p className="text-sm font-bold text-[#686E74]">AT&amp;T Internet Air®</p>
                <h2
                  className="mt-3 font-extrabold text-[#1D2329]"
                  style={{
                    fontSize: "clamp(1.75rem, 3.4vw, 2.75rem)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Home internet with our reliable 5G network
                </h2>
                <p className="mt-4 text-lg text-[#1D2329]">
                  Get the connection you need with an easy self-setup.
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-[#686E74]">
                  In rare cases, if your usage is contributing to congestion on the network,
                  AT&amp;T will greatly reduce your speed for a minimum of 30 minutes. 5G coverage
                  not available everywhere.
                </p>
                <a href="#" className="btn-primary mt-6">
                  Shop now
                </a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute -left-24 top-1/2 z-10 h-[130%] w-56 -translate-y-1/2 rounded-full border-[24px] border-[#009FDB]" />
                <img
                  src={heroImg}
                  alt="People at home using AT&T Internet Air"
                  className="relative z-0 h-full w-full object-cover"
                  style={{ minHeight: 340 }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A — Two feature promo cards on blue band */}
      <section className="bg-[#009FDB]">
        <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-14 sm:px-6 md:grid-cols-2 lg:px-10">
          <article className="grid overflow-hidden rounded-2xl bg-white md:grid-cols-[1fr_180px]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
                New &amp; existing customers
              </p>
              <h3 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">
                Get iPhone 17 Pro for $0
              </h3>
              <p className="mt-3 text-sm text-[#686E74]">
                Learn how to get this offer with eligible trade-in.
              </p>
              <Link to="/buy/phones" className="btn-primary mt-5">
                Shop now
              </Link>
            </div>
            <div className="flex items-center justify-center bg-[#F2FAFD] p-4">
              <img
                src={IMG.iphone17pro}
                alt="iPhone 17 Pro"
                loading="lazy"
                className="max-h-48 object-contain"
              />
            </div>
          </article>

          <article className="grid overflow-hidden rounded-2xl bg-white md:grid-cols-[1fr_200px]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
                Learn how to
              </p>
              <h3 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">
                Get $200 off per line
              </h3>
              <p className="mt-3 text-sm text-[#686E74]">
                When you call or order online and get an eligible wireless plan with a new phone.
                Restrictions apply.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link to="/buy/phones" className="btn-primary">
                  Shop now
                </Link>
                <a
                  href="tel:18779999999"
                  className="text-sm font-bold text-[#0057B8] hover:underline"
                >
                  Call 1-877-999-9999
                </a>
              </div>
            </div>
            <div className="h-full min-h-[180px]">
              <img
                src={promoFriends}
                alt="Friends using phones"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </article>
        </div>
      </section>

      {/* SECTION A2 — AT&T Protect Advantage tile */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-10">
          <div className="grid overflow-hidden rounded-3xl border border-[#DCDFE3] lg:grid-cols-2">
            <div className="relative bg-gradient-to-br from-[#0057B8] via-[#0072B2] to-[#009FDB] p-10 text-white">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[22px] border-white/12" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">
                AT&amp;T Protect Advantage
              </p>
              <h2
                className="mt-3 font-extrabold"
                style={{
                  fontSize: "clamp(1.9rem,3.2vw,2.6rem)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                }}
              >
                Cracked it? Lost it? We'll fix it in 15 minutes.
              </h2>
              <p className="mt-4 max-w-md text-[15px] text-white/95">
                Damage, loss, theft and out-of-warranty malfunction — with <b>AI-guided claims</b>,
                your cost confirmed upfront, and same-day in-store swaps.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  "15-minute in-store swap",
                  "Free loaner during repair",
                  "Your data restored in under 2 minutes",
                  "Up to 5 devices on one plan",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" /> {x}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/deviceflex"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0057B8] hover:bg-white/90"
                >
                  Explore Protect Advantage
                </Link>
                <Link
                  to="/myatt/enroll"
                  className="inline-flex items-center justify-center rounded-full border border-white px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  Add to my plan
                </Link>
              </div>
            </div>
            <div className="relative grid place-items-center bg-[#F2FAFD] p-8">
              <img
                src={IMG.protect}
                alt="A cracked phone held in one hand"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src.endsWith(IMG.protectFallback)) return;
                  img.src = IMG.protectFallback;
                }}
                className="max-h-[360px] w-full rounded-2xl object-contain"
              />
              <span className="absolute left-6 top-6 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#0057B8] shadow">
                No hidden fees
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B — Deals carousel */}
      <section className="bg-[#E7F5FB]">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-10">
          <div className="grid gap-6 md:grid-cols-3">
            {DEALS.map((d, i) => (
              <article
                key={d.title}
                className={`flex flex-col rounded-2xl bg-white p-6 transition ${i === deal ? "ring-2 ring-[#0057B8]/40" : ""}`}
              >
                <span className="inline-block self-start rounded-full bg-[#E7F5FB] px-3 py-1 text-[11px] font-bold text-[#0057B8]">
                  Online only
                </span>
                <div className="mt-4 grid h-40 place-items-center">
                  <img
                    src={d.img}
                    alt={d.title}
                    loading="lazy"
                    className="max-h-40 object-contain"
                  />
                </div>
                <h3 className="mt-4 text-lg font-extrabold leading-snug">{d.title}</h3>
                <p className="mt-2 flex-1 text-sm text-[#686E74]">{d.body}</p>
                <Link to="/buy/phones" className="btn-primary mt-5 self-start">
                  Shop now
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex gap-2">
              {DEALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setDeal(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full transition ${i === deal ? "bg-[#0057B8]" : "bg-[#DCDFE3]"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? "Pause" : "Play"}
              className="grid h-8 w-8 place-items-center rounded-full border border-[#0057B8] text-[#0057B8] hover:bg-white"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION C — Explore more (official AT&T icons) */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-10">
          <h2 className="text-center text-3xl font-extrabold md:text-4xl">
            Explore more of AT&amp;T
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-8">
            {EXPLORE.map((item) => {
              const inner = (
                <>
                  <span
                    className="grid place-items-center"
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                  />
                  <span className="max-w-[9rem] text-center text-sm font-bold text-[#0057B8] group-hover:underline">
                    {item.label}
                  </span>
                </>
              );
              return item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex w-32 flex-col items-center gap-3"
                >
                  {inner}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href="#"
                  className="group flex w-32 flex-col items-center gap-3"
                >
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION D — Unlimited wireless banner */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-10">
          <img
            src={wirelessWoman}
            alt="Woman on her phone outdoors"
            loading="lazy"
            className="w-full rounded-3xl object-cover"
            style={{ aspectRatio: "5/4" }}
          />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#0057B8]">
              AT&amp;T Wireless
            </p>
            <h2
              className="mt-3 font-extrabold text-[#1D2329]"
              style={{
                fontSize: "clamp(2rem, 3.4vw, 2.75rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Get AT&amp;T unlimited starting at $30/mo. per line for four lines
            </h2>
            <p className="mt-5 max-w-lg text-[15px] text-[#686E74]">
              With AutoPay and paperless billing. No annual contract, and taxes &amp; fees extra.
              Restrictions apply.
            </p>
            <a href="#" className="btn-primary mt-7">
              View plans
            </a>
          </div>
        </div>
      </section>

      {/* SECTION E — Back to school */}
      <section className="bg-[#F3F4F6]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-20">
          <div>
            <h2
              className="font-extrabold text-[#1D2329]"
              style={{
                fontSize: "clamp(2rem, 3.4vw, 2.75rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Make it their best year yet
            </h2>
            <p className="mt-5 max-w-lg text-[15px] text-[#686E74]">
              Shop great deals on the tech they need to take on every challenge.
            </p>
            <a href="#" className="btn-primary mt-7">
              Shop now
            </a>
          </div>
          <div className="relative">
            <img
              src={btsKid}
              alt="Child using a tablet"
              loading="lazy"
              className="w-full rounded-3xl object-cover"
              style={{ aspectRatio: "5/4" }}
            />
            <span className="absolute left-4 top-4 rounded-full bg-[#009FDB] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow">
              Back to School
            </span>
            <div className="absolute -bottom-6 left-6 max-w-[16rem] rounded-2xl bg-white p-4 shadow-lg ring-1 ring-[#DCDFE3] sm:left-8">
              <p className="text-sm font-extrabold leading-snug">Get iPhone Air for under $5/mo.</p>
              <Link to="/buy/phones" className="btn-primary mt-3 !py-2 !px-4 text-xs">
                Shop now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F — Let's get you connected */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10">
          <h2 className="text-center text-3xl font-extrabold md:text-4xl">
            Let&rsquo;s get you connected
          </h2>
          <div className="relative mt-10">
            <button
              onClick={() => setEdit((edit - 1 + EDITORIAL.length) % EDITORIAL.length)}
              aria-label="Previous"
              className="absolute -left-2 top-24 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#DCDFE3] bg-white shadow md:grid"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setEdit((edit + 1) % EDITORIAL.length)}
              aria-label="Next"
              className="absolute -right-2 top-24 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#DCDFE3] bg-white shadow md:grid"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {EDITORIAL.map((e, i) => (
                <article
                  key={e.title}
                  className={`flex flex-col rounded-2xl border border-[#DCDFE3] bg-white p-4 ${i === edit ? "ring-2 ring-[#0057B8]/30" : ""}`}
                >
                  <img
                    src={e.img}
                    alt={e.title}
                    loading="lazy"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <h3 className="mt-4 text-base font-extrabold leading-snug">{e.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#686E74]">{e.body}</p>
                  <a
                    href="#"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0057B8] hover:underline"
                  >
                    Learn more <ChevronRight className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-2">
              {EDITORIAL.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setEdit(i)}
                  aria-label={`Card ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full transition ${i === edit ? "bg-[#0057B8]" : "bg-[#DCDFE3]"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G — Experience the AT&T difference */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-10">
          <h2 className="text-center text-3xl font-extrabold md:text-4xl">
            Experience the AT&amp;T difference
          </h2>
          <p className="mt-3 text-center text-[15px] text-[#686E74]">
            See what our customers love about us.
          </p>

          <div className="mt-10 grid items-center gap-6 lg:grid-cols-2">
            {/* AT&T Guarantee image (official) */}
            <img
              src={IMG.guarantee}
              alt="The AT&T Guarantee"
              loading="lazy"
              className="w-full rounded-3xl object-cover"
              style={{ aspectRatio: "1 / 1" }}
            />

            {/* Right list */}
            <ul className="flex flex-col gap-4">
              {[
                {
                  Icon: ShieldCheck,
                  h: "The one and only AT&T Guarantee",
                  p: "Connectivity you depend on. Deals you want. Friendly, helpful service — or we'll make it right.",
                },
                {
                  Icon: DollarSign,
                  h: "Amazing deals on the latest phones",
                  p: "Plus, you'll save without switching to our most expensive plan.",
                },
                {
                  Icon: Wifi,
                  h: "Reliable internet, no hidden fees",
                  p: "Plus, there are no extra costs and no data caps.",
                },
              ].map(({ Icon, h, p }) => (
                <li
                  key={h}
                  className="flex items-start gap-4 rounded-2xl border border-[#DCDFE3] p-5 hover:border-[#0057B8]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
                    <Icon className="h-5 w-5 text-[#0057B8]" strokeWidth={2} />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-base font-extrabold">{h}</h3>
                    <p className="mt-1 text-sm text-[#686E74]">{p}</p>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 text-[#0057B8]" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION H — Free trial */}
      <section className="bg-white">
        <div className="mx-auto max-w-[900px] px-4 pb-16 text-center sm:px-6 lg:px-10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#E7F5FB]">
            <Check className="h-6 w-6 text-[#0057B8]" strokeWidth={2.5} />
          </div>
          <h2
            className="mt-5 font-extrabold text-[#1D2329]"
            style={{
              fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Try AT&amp;T Wireless℠ FREE for 30 days!
          </h2>
          <p className="mt-4 text-[15px] text-[#686E74]">
            Keep your current service and number while you test drive our network from your phone.
          </p>
          <a href="#" className="btn-primary mt-6">
            Learn more
          </a>
        </div>
      </section>

      {/* SECTION I — Newsletter */}
      <section className="bg-[#F3F4F6]">
        <div className="mx-auto max-w-[900px] px-4 py-16 text-center sm:px-6 lg:px-10">
          <h2
            className="font-extrabold text-[#1D2329]"
            style={{
              fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Want to stay in the loop?
          </h2>
          <p className="mt-4 text-[15px] text-[#686E74]">
            Sign up for the latest deals, product news and more from AT&amp;T.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="Email address"
              aria-label="Email address"
              className="flex-1 rounded-full border border-[#686E74] bg-white px-5 py-3 text-sm outline-none focus:border-[#0057B8]"
            />
            <button type="submit" className="btn-primary">
              Sign up
            </button>
          </form>
          <p className="mt-4 text-[11px] leading-relaxed text-[#686E74]">
            By providing your email, you agree to receive marketing communications from AT&amp;T.
            You can unsubscribe at any time. See our Privacy Notice.
          </p>
        </div>
      </section>

      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}
