import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Bookmark,
  Check,
  Edit2,
  Briefcase,
  Users,
  Shield,
  HeartPulse,
  GraduationCap,
  Handshake,
  BookOpen,
  Wifi,
  Signal,
  Smartphone,
  Video,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BuyFlowStepper } from "@/components/site/BuyFlowStepper";

export const Route = createFileRoute("/buy/plan")({ component: PlanPage });

const DISCOUNTS = [
  { Icon: Briefcase, label: "Business employees" },
  { Icon: Users, label: "55+" },
  { Icon: Shield, label: "Military & veterans" },
  { Icon: HeartPulse, label: "Retired responders" },
  { Icon: GraduationCap, label: "Teachers" },
  { Icon: Handshake, label: "Unions" },
  { Icon: BookOpen, label: "Students" },
];

type Plan = {
  name: string;
  ribbon: string;
  ribbonColor: string;
  desc: string;
  original: string;
  price: string;
  hotspot: string;
  streaming: string;
  turbo: "included" | { price: string } | "unavailable";
};

const PLANS: Plan[] = [
  {
    name: "Elite 2.0",
    ribbon: "Our best plan",
    ribbonColor: "#0057B8",
    desc: "Our best unlimited with premium data and Elite hotspot.",
    original: "$130",
    price: "$110.00",
    hotspot: "60GB",
    streaming: "4K UHD",
    turbo: "included",
  },
  {
    name: "Premium 2.0",
    ribbon: "Save on a switch or tablet plan",
    ribbonColor: "#0072B2",
    desc: "Premium unlimited with generous hotspot data.",
    original: "$100",
    price: "$90.00",
    hotspot: "60GB",
    streaming: "HD",
    turbo: { price: "$7.00/mo." },
  },
  {
    name: "Extra 2.0",
    ribbon: "Most popular",
    ribbonColor: "#009FDB",
    desc: "Great value with plenty of hotspot and unlimited data.",
    original: "$80",
    price: "$70.00",
    hotspot: "100GB",
    streaming: "SD",
    turbo: { price: "$7.00/mo." },
  },
  {
    name: "Value 2.0",
    ribbon: "Most affordable",
    ribbonColor: "#686E74",
    desc: "Unlimited essentials at our lowest price.",
    original: "$60",
    price: "$50.00",
    hotspot: "0GB",
    streaming: "SD",
    turbo: "unavailable",
  },
];

function PlanPage() {
  const navigate = useNavigate();
  const [offerOpen, setOfferOpen] = useState(true);
  const [saveOpen, setSaveOpen] = useState(true);
  const [discount, setDiscount] = useState<number | null>(null);
  const [tab, setTab] = useState<"unlimited" | "other">("unlimited");
  const [openFeat, setOpenFeat] = useState<number | null>(0);

  return (
    <div className="bg-white text-[#1D2329]">
      <SiteHeader cartCount={1} />

      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
          Adding a new device
        </p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Choose your plan</h1>
        <div className="mt-6">
          <BuyFlowStepper current={3} />
        </div>

        {/* Offer applied */}
        <div className="mt-8 rounded-2xl bg-[#F3F4F6] p-5">
          <button
            onClick={() => setOfferOpen(!offerOpen)}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00388F] text-white">
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

        {/* Savings through employer */}
        <div className="mt-4 rounded-2xl bg-[#F3F4F6] p-5">
          <button
            onClick={() => setSaveOpen(!saveOpen)}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#0072B2]">
              <Bookmark className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm md:text-[15px]">
              You may be able to get savings through your employer, organization, or school.{" "}
              <a href="#" className="font-bold text-[#0072B2] hover:underline">
                Learn more
              </a>
            </span>
            <ChevronUp className={`h-5 w-5 transition ${saveOpen ? "" : "rotate-180"}`} />
          </button>
          {saveOpen && (
            <div className="mt-5 rounded-xl bg-white p-6 text-center">
              <p className="text-lg font-extrabold">Select the discount that applies to you:</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
                {DISCOUNTS.map(({ Icon, label }, i) => {
                  const active = discount === i;
                  return (
                    <button
                      key={label}
                      onClick={() => setDiscount(active ? null : i)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-[11px] font-bold ${active ? "border-[#00388F] bg-[#E7F5FB] text-[#0072B2]" : "border-[#DCDFE3] hover:border-[#1D2329]"}`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Plan tabs */}
        <div className="mt-10 flex justify-center gap-10 border-b border-[#DCDFE3] text-sm">
          {(
            [
              ["unlimited", "Unlimited Your Way (4)"],
              ["other", "Other plans (2)"],
            ] as const
          ).map(([k, l]) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`relative pb-3 ${active ? "font-extrabold text-[#1D2329]" : "font-bold text-[#686E74] hover:text-[#1D2329]"}`}
              >
                {l}
                {active && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-[#009FDB]" />}
              </button>
            );
          })}
        </div>

        {/* Plan grid */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p, i) => (
            <article
              key={p.name}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#DCDFE3] bg-white"
            >
              <div
                className="px-4 py-2 text-center text-xs font-bold text-white"
                style={{ background: p.ribbonColor }}
              >
                {p.ribbon}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
                  AT&amp;T
                </p>
                <h3 className="mt-1 text-xl font-extrabold">{p.name}</h3>
                <p className="mt-2 text-sm text-[#686E74]">{p.desc}</p>

                <button
                  onClick={() => navigate({ to: "/buy/addons" })}
                  className="btn-primary mt-4 w-full"
                >
                  Select this plan
                </button>

                <div className="mt-5">
                  <p className="text-sm text-[#686E74] line-through">{p.original}</p>
                  <p className="text-3xl font-extrabold">
                    {p.price}
                    <span className="text-sm font-normal text-[#686E74]">/mo.</span>
                  </p>
                  <a
                    href="#"
                    className="mt-1 inline-block text-xs font-bold text-[#0072B2] hover:underline"
                  >
                    See plan discounts
                  </a>
                </div>

                <button
                  onClick={() => setOpenFeat(openFeat === i ? null : i)}
                  className="mt-5 flex w-full items-center justify-between border-t border-[#DCDFE3] pt-4 text-sm font-bold text-[#0072B2]"
                >
                  See all features & benefits
                  <ChevronDown
                    className={`h-4 w-4 transition ${openFeat === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFeat === i && (
                  <ul className="mt-3 space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <Signal className="mt-0.5 h-4 w-4 text-[#0072B2]" /> Unlimited talk, text &
                      data
                    </li>
                    <li className="flex items-start gap-2">
                      <Wifi className="mt-0.5 h-4 w-4 text-[#0072B2]" /> 5G access included
                    </li>
                    <li className="flex items-start gap-2">
                      <Smartphone className="mt-0.5 h-4 w-4 text-[#0072B2]" /> {p.hotspot} mobile
                      hotspot
                    </li>
                    <li className="flex items-start gap-2">
                      <Video className="mt-0.5 h-4 w-4 text-[#0072B2]" /> {p.streaming} streaming
                      quality
                    </li>
                  </ul>
                )}

                <div className="mt-5 rounded-lg border border-[#DCDFE3] p-3 text-xs">
                  <p className="font-extrabold">AT&amp;T turbo</p>
                  {p.turbo === "included" ? (
                    <p className="mt-1 flex items-center gap-1 text-[#0072B2]">
                      <Check className="h-3.5 w-3.5" /> Included with AT&amp;T Elite 2.0
                    </p>
                  ) : p.turbo === "unavailable" ? (
                    <p className="mt-1 text-[#686E74]">Not available with Value 2.0</p>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <span>{p.turbo.price}</span>
                      <button className="rounded-full border border-[#00388F] px-3 py-1 text-[11px] font-bold text-[#0072B2] hover:bg-[#E7F5FB]">
                        Select
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xs">
                  <p className="font-extrabold">AT&amp;T ActiveArmor mobile security</p>
                  <p className="mt-1 flex items-start gap-1">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-[#0072B2]" /> Free app with Spam Call
                    Blocking and more
                  </p>
                  <p className="mt-1 flex items-start gap-1">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-[#0072B2]" /> 24/7 security you can
                    count on
                  </p>
                </div>

                <div className="mt-4 text-xs text-[#686E74]">
                  <p className="font-extrabold text-[#1D2329]">International roaming</p>
                  <p className="mt-1">
                    Talk, text, and use data in 210+ destinations. Rates and coverage may vary.
                  </p>
                </div>

                <a href="#" className="mt-3 text-xs font-bold text-[#0072B2] hover:underline">
                  Read the legal stuff
                </a>

                <div className="mt-4 rounded-lg border border-[#DCDFE3] p-3 text-xs">
                  <p className="font-extrabold">Broadband Facts</p>
                  <p className="mt-1">AT&amp;T</p>
                  <p className="text-[#686E74]">{p.name} — Mobile Broadband Consumer</p>
                  <p className="mt-2 font-extrabold">
                    Monthly Price <span className="float-right">{p.price}/mo.</span>
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-[#686E74]">
                    This Monthly Price is not an introductory rate. Additional charges & terms may
                    apply.
                  </p>
                  <a
                    href="#"
                    className="mt-2 inline-flex items-center gap-1 font-bold text-[#0072B2] hover:underline"
                  >
                    Expand Broadband facts <ChevronDown className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm">
          <span className="text-[#686E74]">Primary place of use: 121 OPC 467, APO, AE 09005</span>
          <button aria-label="Edit address" className="text-[#0072B2] hover:text-[#009FDB]">
            <Edit2 className="h-4 w-4" />
          </button>
        </div>

        <div className="h-16" />
      </div>

      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}
