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
    blurb: "Unlimited claims and $0 screen repair, with your cost shown before you book.",
    highlights: [
      "Unlimited claims — damage, loss, theft & out-of-warranty malfunction",
      "$0 screen & back-glass repair, unlimited",
      "Same-day replacement & setup",
      "50 GB Data Vault",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 25,
    devices: "1 device",
    ribbon: "Most popular",
    blurb: "Everything in Basic, plus repair that comes to you, expert support and a bigger vault.",
    highlights: [
      "Everything in Basic",
      "Home screen repair — a technician comes to you",
      "ProTech expert support, 24/7",
      "Unlimited battery replacement",
      "ActiveArmor® Advanced security & identity monitoring",
      "500 GB Data Vault",
      "1 FREE annual accessory",
      "Guaranteed trade-in value, locked",
      "“New, not refurbished” guarantee",
    ],
  },
  {
    id: "family",
    name: "Family",
    price: 50,
    devices: "Up to 5 devices",
    ribbon: "Best value",
    blurb: "One membership for the whole household — up to 5 devices, one shared vault.",
    highlights: [
      "Everything in Plus, for up to 5 devices",
      "Shared family device pool",
      "1 TB shared Data Vault",
      "2 FREE annual accessories",
      "Parental controls on kids' devices",
      "Priority in-store appointments",
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

/**
 * The five reasons collapse into three flows: photos, identity verification, or
 * diagnostics. Asking a member to choose between "lost" and "stolen" before they
 * have chosen what kind of thing happened is a distinction the *claim* needs, not
 * one the member is thinking about — so the first screen offers the three, and a
 * group with more than one reason asks its follow-up only once it is picked.
 */
export type ClaimGroup = {
  id: "damage" | "missing" | "faulty";
  title: string;
  desc: string;
  /** Reasons this group resolves to. One entry means no follow-up is asked. */
  reasons: ClaimReasonId[];
  /** The question asked when there is more than one reason to separate. */
  followUp?: { prompt: string; options: { id: ClaimReasonId; label: string }[] };
};

export const CLAIM_GROUPS: ClaimGroup[] = [
  {
    id: "damage",
    title: "Damaged device",
    desc: "Dropped, cracked screen, liquid or spill damage.",
    reasons: ["damage"],
  },
  {
    id: "missing",
    title: "Lost or stolen",
    desc: "You can't find it, or someone took it.",
    reasons: ["loss", "theft"],
    followUp: {
      prompt: "Which was it? Theft adds a blocklist request, so we ask before filing.",
      options: [
        { id: "loss", label: "I lost it" },
        { id: "theft", label: "It was stolen" },
      ],
    },
  },
  {
    id: "faulty",
    title: "Not working properly",
    desc: "Won't charge or power on, camera or speaker faults, or a battery that won't hold.",
    reasons: ["malfunction", "battery"],
    followUp: {
      prompt: "Is this the battery? A battery claim carries its own fee, not a replacement one.",
      options: [
        { id: "malfunction", label: "Something else is faulty" },
        { id: "battery", label: "It's the battery" },
      ],
    },
  },
];

export const CAPABILITIES = [
  {
    title: "$0 screen & back-glass repair",
    body: "Cracked glass is repaired at no charge, as many times as you need it, at an AT&T store or one of 700+ uBreakiFix by Asurion locations.",
  },
  {
    title: "Same-day replacement & setup",
    body: "If a device can't be repaired, walk out with a replacement the same day — configured, activated and restored before you leave.",
  },
  {
    title: "DeviceFlex AI claim",
    body: "Tell us what happened. AI assesses damage from your photos, or runs remote diagnostics across sensors, battery and housing, then books the fastest fix.",
  },
  {
    title: "Remote phone diagnostics",
    body: "A full hardware inspection from your own device — touch, cameras, audio, motion sensors, true battery capacity and a vision scan of the housing.",
  },
  {
    title: "AI chat that knows your plan",
    body: "The AT&T chat, upgraded. It answers “am I covered?” in plain English, shows fees upfront, and takes you straight to the claim, vault or perk you asked about.",
  },
  {
    title: "Data Vault, powered by AI",
    body: "Photos, messages, contacts and apps sync to a secure AT&T vault that grows with your plan, and Smart Restore puts them on a replacement device in under 2 minutes.",
  },
  {
    title: "ProTech expert support",
    body: "Unlimited one-to-one help from AT&T's device experts — setup, transfers, troubleshooting, whether or not anything is broken.",
  },
  {
    title: "Unlimited battery replacement",
    body: "Once ProTech testing confirms a battery won't hold a charge, it's replaced at no cost — with no limit on how often.",
  },
  {
    title: "Family device pool",
    body: "One Family plan covers up to 5 devices — phones, tablets, kids' devices — under a single subscription with a shared vault.",
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
    future: "up to $50",
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
