// AT&T Protect Advantage product data (DeviceFlex = the AI feature set inside it).

export type Tier = {
  id: "basic" | "plus" | "family";
  name: string;
  price: number;
  blurb: string;
  ribbon?: string;
  devices: string;
  highlights: string[];
};

export const PRODUCT = "AT&T Protect Advantage";
export const AI_BRAND = "DeviceFlex AI";

export const TIERS: Tier[] = [
  {
    id: "basic",
    name: "Basic",
    price: 15,
    devices: "1 device",
    blurb: "Instant swaps and AI claims with a $0 deductible.",
    highlights: [
      "15-min in-store swap · $0 deductible",
      "Damage, loss, theft & out-of-warranty malfunction",
      "Free loaner during repair",
      "DeviceFlex AI claim + 24/7 chat support",
      "50 GB secure data vault",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 25,
    devices: "1 device",
    ribbon: "Most popular",
    blurb: "Everything in Basic, plus home repair and the gadget library.",
    highlights: [
      "Everything in Basic",
      "Home screen repair included",
      "Gadget & accessory library",
      "500 GB secure data vault",
      "1 FREE annual accessory",
      "“New, not refurbished” guarantee",
    ],
  },
  {
    id: "family",
    name: "Family",
    price: 40,
    devices: "Up to 5 devices",
    ribbon: "Best value",
    blurb: "One membership for the whole household — up to 5 devices.",
    highlights: [
      "Everything in Plus, for up to 5 devices",
      "Shared family device pool",
      "1 TB shared data vault",
      "2 FREE annual accessories",
      "Parental controls & shared vault",
      "“New, not refurbished” guarantee",
    ],
  },
];

export const getTier = (id?: string) => TIERS.find((t) => t.id === id);

// What Protect Advantage actually covers — drives the claim flow branches.
export type ClaimReasonId = "damage" | "loss" | "theft" | "malfunction" | "battery";
export type ClaimReason = {
  id: ClaimReasonId;
  title: string;
  desc: string;
  needsPhotos: boolean;
  needsIdVerify: boolean;
  needsDiagnostics: boolean;
};

export const CLAIM_REASONS: ClaimReason[] = [
  {
    id: "damage",
    title: "Damaged device",
    desc: "Dropped, cracked screen, liquid or spill damage.",
    needsPhotos: true,
    needsIdVerify: false,
    needsDiagnostics: false,
  },
  {
    id: "loss",
    title: "Lost device",
    desc: "You can't find it and it may be gone for good.",
    needsPhotos: false,
    needsIdVerify: true,
    needsDiagnostics: false,
  },
  {
    id: "theft",
    title: "Stolen device",
    desc: "Your device was taken. We'll block it and replace it.",
    needsPhotos: false,
    needsIdVerify: true,
    needsDiagnostics: false,
  },
  {
    id: "malfunction",
    title: "Not working properly",
    desc: "Mechanical or electrical failure — won't charge, won't power on, camera or speaker faults.",
    needsPhotos: false,
    needsIdVerify: false,
    needsDiagnostics: true,
  },
  {
    id: "battery",
    title: "Battery problem",
    desc: "Battery drains fast or health has dropped below 80%.",
    needsPhotos: false,
    needsIdVerify: false,
    needsDiagnostics: true,
  },
];

export const CAPABILITIES = [
  {
    title: "15-minute Instant Swap",
    body: "Hand over a damaged, lost or stolen device in-store and walk out in ~15 minutes with a configured replacement. $0 deductible.",
  },
  {
    title: "DeviceFlex AI claim",
    body: "Tell us what happened. AI assesses damage from 3 photos, or runs guided diagnostics for malfunctions, then books the fastest fix.",
  },
  {
    title: "AI chat that knows your plan",
    body: "The AT&T chat, upgraded. It answers “am I covered?” in plain English, shows fees upfront, and takes you straight to the claim, vault or perk you asked about.",
  },
  {
    title: "Secure data vault + Smart Restore",
    body: "Photos, contacts and apps sync to a secure AT&T vault and restore onto your replacement device in under 2 minutes.",
  },
  {
    title: "Free loaner during repair",
    body: "Device in for repair? Keep a fully working loaner for the whole duration. Never phoneless.",
  },
  {
    title: "Family device pool",
    body: "One Family plan covers up to 5 devices — phones, tablets, kids' devices — under a single subscription.",
  },
];

export const KPIS = [
  {
    label: "Protection attach",
    today: "~40%",
    future: "55–65%",
    note: "Close the 18% online vs 70% retail gap",
    dir: "up" as const,
  },
  {
    label: "ARPU (protection)",
    today: "$25",
    future: "up to $40",
    note: "Tier ladder: Basic → Plus → Family",
    dir: "up" as const,
  },
  {
    label: "Revenue streams",
    today: "1",
    future: "7+",
    note: "Tiers, home-repair, deposits, perks, enterprise",
    dir: "up" as const,
  },
  {
    label: "Replacement time",
    today: "1–3 days",
    future: "~15 min",
    note: "In-store swap vs shipping + forms",
    dir: "down" as const,
  },
  {
    label: "Feature churn",
    today: "~1.26%",
    future: "lower",
    note: "Family pool + vault lock-in",
    dir: "down" as const,
  },
  {
    label: "Care-center calls",
    today: "high",
    future: "lower",
    note: "AI chat deflects routine questions",
    dir: "down" as const,
  },
];

export const OPPORTUNITY = {
  base: "21.4M mobility customers",
  subs: "~18M protection subscribers",
  revenue: "$5.2B protection revenue (2025)",
  incremental: "$1B+ incremental opportunity",
  claimRate: "~0.9% monthly claim rate",
  demand: [
    "28% will pay for device protection",
    "43% on family / multi-line plans",
    "61% prefer customized plans",
  ],
};
