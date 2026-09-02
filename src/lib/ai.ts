// ─────────────────────────────────────────────────────────────────────────────
// The DeviceFlex agent layer inside AT&T Protect Advantage.
//
// Eight agents, one supervisor surface. Every function here is deterministic —
// same input, same output — so the demo never surprises anyone on stage. Each
// is a pure function over account state, which is also what makes them swappable
// for real models later: the call signature is the contract.
//
//   CUSTOMER-FACING          BEHIND THE SCENES
//   1 Damage Assessment      6 Retail & Inventory
//   2 Coverage Assistant     7 Eligibility & Fraud
//   3 Claim-to-Upgrade       8 Family Orchestration
//   4 Smart Restore
//   5 Proactive Care
// ─────────────────────────────────────────────────────────────────────────────
import type { Member, MemberDevice } from "@/data/member";
import { deviceVaultGB, TIER_POOL, TIER_VAULT_GB, formatCapacity } from "@/data/member";
import type { ClaimReasonId } from "@/data/deviceflex";
import { STORES, HOME_REPAIR, type Store, type StoreCapability } from "@/data/stores";
import { deductibleFor, deviceTier, ASURION, type FeeKind } from "@/data/deductibles";
import { daysSince, withinFilingWindow, type IncidentDetails } from "@/lib/asurion";
import { formatLastSeen, lastSeenAt, type NetworkTelemetry } from "@/data/network-signals";

const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 1 — Damage Assessment
// Vision model stand-in: photos in, severity + resolution path out.
// ═════════════════════════════════════════════════════════════════════════════

export type DamageResult = {
  severity: "Minor" | "Moderate" | "Severe";
  beyondEconomicalRepair: boolean;
  confidence: number;
  summary: string;
  detected: string[];
  recommendation: string;
  /** What this repair would cost without coverage — the number that sells the plan. */
  retailRepairCost: number;
};

export function assessDamage(device: MemberDevice, photoCount = 3): DamageResult {
  // Confidence rises with evidence; three photos is the designed input.
  const confidence = Math.min(0.97, 0.72 + photoCount * 0.083);

  if (device.screenRisk === "High") {
    return {
      severity: "Severe",
      beyondEconomicalRepair: true,
      confidence,
      summary: `Multiple impact points and frame deformation detected on ${device.name}. The display no longer responds across the lower third.`,
      detected: [
        "Front glass — shattered (2 impact points)",
        "Touch digitizer — partial failure, lower third",
        "Frame — bent lower-left",
        "Rear glass — cracked",
      ],
      recommendation: "This device is beyond economical repair. A replacement is the fastest path.",
      retailRepairCost: Math.round(device.retail * 0.55),
    };
  }

  if (device.screenRisk === "Medium") {
    return {
      severity: "Moderate",
      beyondEconomicalRepair: false,
      confidence,
      summary: `Cracked front glass detected on ${device.name}. Display and touch are functional; no frame or camera damage found.`,
      detected: [
        "Front glass — cracked (upper-right origin)",
        "Touch digitizer — functional",
        "Rear glass — intact",
        "Cameras — intact",
      ],
      recommendation: "The screen can be repaired — no need to replace the device.",
      retailRepairCost: 329,
    };
  }

  return {
    severity: "Minor",
    beyondEconomicalRepair: false,
    confidence,
    summary: `Surface damage detected on ${device.name}. A hairline crack in the corner glass; every component tests normal.`,
    detected: [
      "Front glass — hairline crack, lower-left corner",
      "Touch digitizer — fully functional",
      "Frame — no deformation",
      "Cameras & sensors — intact",
    ],
    recommendation: "A screen repair resolves this. Your device stays with you either way.",
    retailRepairCost: 249,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 6 — Retail & Inventory
// Store routing, live stock and technician capacity. Agent 3 depends on this,
// so it is defined first.
// ═════════════════════════════════════════════════════════════════════════════

export type StoreMatch = {
  store: Store;
  inStock: boolean;
  slots: string[];
  reason: string;
};

/** Rank stores by capability, then stock, then distance. */
export function findStores(device: MemberDevice, need: StoreCapability): StoreMatch[] {
  return STORES.filter((s) => s.capabilities.includes(need))
    .map((s) => {
      const inStock = s.stock.includes(device.name);
      return {
        store: s,
        inStock,
        slots: s.slots,
        reason:
          need === "swap"
            ? inStock
              ? `${device.name} in ${device.color} ${device.storage} on hand`
              : "No matching stock — would need a transfer"
            : s.benchOpen
              ? "Repair bench open today"
              : "Repair bench fully booked today",
      };
    })
    .sort((a, b) => {
      if (need === "swap" && a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      if (need !== "swap" && a.store.benchOpen !== b.store.benchOpen)
        return a.store.benchOpen ? -1 : 1;
      return a.store.miles - b.store.miles;
    });
}

/** The single store the agent would book, given what the member needs. */
export function bestStore(device: MemberDevice, need: StoreCapability): StoreMatch | null {
  return findStores(device, need)[0] ?? null;
}

export const homeRepairWindows = () => (HOME_REPAIR.available ? HOME_REPAIR.windows : []);

// ═════════════════════════════════════════════════════════════════════════════
// Guided diagnostics — the malfunction / battery branch of Agent 1
// ═════════════════════════════════════════════════════════════════════════════

export type Diagnostic = { label: string; result: string; ok: boolean };

export function runDiagnostics(device: MemberDevice, reason: ClaimReasonId): Diagnostic[] {
  if (reason === "battery") {
    return [
      {
        label: "Battery health",
        result: `${device.batteryHealth}%`,
        ok: device.batteryHealth >= 80,
      },
      { label: "Charge cycles", result: "842 cycles", ok: true },
      { label: "Charging port", result: "Responding normally", ok: true },
      {
        label: "Peak performance",
        result: device.batteryHealth < 85 ? "Throttling under load" : "Sustained",
        ok: device.batteryHealth >= 85,
      },
      { label: "Thermal behaviour", result: "Within normal range", ok: true },
    ];
  }
  return [
    { label: "Power & boot", result: "Fails to complete boot", ok: false },
    { label: "Charging port", result: "No charge detected", ok: false },
    { label: "Display output", result: "Backlight only", ok: false },
    { label: "Logic board", result: "Responds to diagnostic ping", ok: true },
    { label: "Water-damage indicator", result: "Not triggered", ok: true },
  ];
}

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 3 — Claim-to-Upgrade Advisor
// Compares every available path on the four things a person actually weighs:
// what it costs, how long it takes, what happens to their data, and what they
// end up holding. Then it recommends one, and says why.
// ═════════════════════════════════════════════════════════════════════════════

export type ClaimOption = {
  id: "repair" | "home-repair" | "swap" | "ship" | "upgrade" | "battery";
  title: string;
  detail: string;
  /** What this path costs the member — the Asurion deductible or service fee, as text. */
  price: string;
  /** Which line of the fee schedule applies, so payload and UI can't drift apart. */
  feeKind: FeeKind;
  /** The same figure in dollars, for comparison and sorting. */
  deductible: number;
  time: string;
  recommended?: boolean;
  restore: "none" | "in-store" | "on-arrival"; // where Smart Restore happens
  /** What the member walks away with. */
  outcome: string;
  /** Retail cost of this path without Protect Advantage. */
  withoutCoverage: string;
  /** Guarantee applies only where a physical replacement is issued. */
  newNotRefurbished?: boolean;
  storeId?: string;
};

export function resolutionOptions(
  device: MemberDevice,
  reason: ClaimReasonId,
  damage?: DamageResult | null,
): ClaimOption[] {
  const opts: ClaimOption[] = [];
  const swapStore = bestStore(device, "swap");
  const repairStore = bestStore(device, "repair");
  const batteryStore = bestStore(device, "battery");
  const at = (m: StoreMatch | null) => (m ? `nearest store ${m.store.miles} mi` : "nearest store");

  // Every path quotes the real Asurion fee for that kind of resolution.
  const fee = (kind: FeeKind) => {
    const d = deductibleFor(device, kind);
    return { price: d.label, feeKind: kind, deductible: d.amount };
  };

  if (reason === "damage") {
    const beyond = damage?.beyondEconomicalRepair;
    const repairQuote = damage?.retailRepairCost ?? 329;

    if (!beyond) {
      if (HOME_REPAIR.available) {
        opts.push({
          id: "home-repair",
          title: "Home screen repair",
          detail: `A technician comes to you and repairs the screen in about ${HOME_REPAIR.etaMinutes} minutes. You keep your device — nothing to restore.`,
          ...fee("screen-repair"),
          time: HOME_REPAIR.windows[0],
          recommended: true,
          restore: "none",
          outcome: "Your own device, repaired, same day",
          withoutCoverage: money(repairQuote + 60),
        });
      }
      if (repairStore) {
        opts.push({
          id: "repair",
          title: "Repair at an AT&T store",
          detail: `Drop in and we'll repair the screen while you wait. ${repairStore.reason}.`,
          ...fee("screen-repair"),
          time: `~45 min · ${at(repairStore)}`,
          restore: "none",
          outcome: "Your own device, repaired",
          withoutCoverage: money(repairQuote),
          storeId: repairStore.store.id,
        });
      }
    }

    if (swapStore) {
      opts.push({
        id: "swap",
        title: "15-minute in-store swap",
        detail: `Hand over the damaged device, walk out with a replacement. ${swapStore.reason}. Smart Restore runs in store on your new device.`,
        ...fee("replacement"),
        time: `~15 min · ${at(swapStore)}`,
        recommended: !!beyond,
        restore: "in-store",
        outcome: `A factory-new ${device.name}, same colour and storage`,
        withoutCoverage: money(device.retail),
        newNotRefurbished: true,
        storeId: swapStore.store.id,
      });
    }
  }

  if (reason === "loss" || reason === "theft") {
    if (swapStore) {
      opts.push({
        id: "swap",
        title: "Same-day in-store replacement",
        detail: `Pick up a replacement today. We'll suspend the old line and Smart Restore your data in store. ${swapStore.reason}.`,
        ...fee("replacement"),
        time: `Today · ${at(swapStore)}`,
        recommended: true,
        restore: "in-store",
        outcome: `A factory-new ${device.name}`,
        withoutCoverage: money(device.retail),
        newNotRefurbished: true,
        storeId: swapStore.store.id,
      });
    }
    opts.push({
      id: "ship",
      title: "Ship a replacement to me",
      detail:
        "Next-day delivery. Smart Restore runs automatically when your device arrives and you sign in.",
      ...fee("replacement"),
      time: "Arrives tomorrow",
      restore: "on-arrival",
      outcome: `A factory-new ${device.name}, delivered`,
      withoutCoverage: money(device.retail),
      newNotRefurbished: true,
    });
  }

  if (reason === "malfunction") {
    if (device.warranty === "In warranty") {
      opts.push({
        id: "repair",
        title: "Manufacturer warranty repair",
        detail: `Your ${device.name} is still in warranty — repair is handled under the manufacturer's warranty at no cost, and it doesn't use a claim.`,
        ...fee("warranty"),
        time: "3–5 days",
        recommended: true,
        restore: "none",
        outcome: "Your own device, repaired under warranty",
        withoutCoverage: "$0 (in warranty)",
      });
    }
    if (swapStore) {
      opts.push({
        id: "swap",
        title: "Replace under Protect Advantage",
        detail: `Out-of-warranty mechanical or electrical failure is covered. ${swapStore.reason}.`,
        ...fee("replacement"),
        time: `~15 min · ${at(swapStore)}`,
        recommended: device.warranty === "Out of warranty",
        restore: "in-store",
        outcome: `A factory-new ${device.name}`,
        withoutCoverage: money(device.retail),
        newNotRefurbished: true,
        storeId: swapStore.store.id,
      });
    }
  }

  if (reason === "battery") {
    const failing = device.batteryHealth < 80;
    if (batteryStore) {
      opts.push({
        id: "battery",
        title: "Battery replacement at a store",
        detail: failing
          ? `Battery health is ${device.batteryHealth}% — below the 80% threshold, so replacement carries no service fee.`
          : `Health is ${device.batteryHealth}%. We'll test in store; if it reads under 80% the replacement carries no service fee.`,
        ...fee("battery"),
        time: `~45 min · ${at(batteryStore)}`,
        recommended: true,
        restore: "none",
        outcome: "Your own device with a new battery",
        withoutCoverage: "$89",
        storeId: batteryStore.store.id,
      });
    }
  }

  // Upgrade-through-a-claim, exactly as Asurion presents it: the same deductible as a
  // replacement, differing only in what you end up holding and whose warranty covers it.
  //
  // Note this is NOT Next Up Anytime. Next Up requires trading in a device in good
  // working condition, so it is unavailable on the handset being claimed for — offering
  // it here at $0 (as we used to) would promise something the program does not allow.
  const beyondRepair = damage?.beyondEconomicalRepair || reason === "loss" || reason === "theft";
  if (beyondRepair) {
    const monthly = Math.round((device.retail / 36) * 100) / 100;
    opts.push({
      id: "upgrade",
      title: "Upgrade to a newer device",
      detail: `Same deductible as a like-for-like replacement, but you choose a newer model and it comes with the manufacturer's warranty${device.nextUp ? `. Your guaranteed trade-in value of ${money(device.tradeIn)} still comes off the balance` : ""}.`,
      ...fee("upgrade"),
      price: `from $${monthly.toFixed(2)}/mo.`,
      time: "Same visit",
      restore: "in-store",
      outcome: "A newer model, on the manufacturer's warranty",
      withoutCoverage: money(device.retail - device.tradeIn),
      newNotRefurbished: true,
      storeId: swapStore?.store.id,
    });
  }

  return opts;
}

/** The Advisor's own verdict — shown above the options as a plain-English call. */
export type AdvisorVerdict = {
  headline: string;
  reasoning: string;
  pick: ClaimOption["id"] | null;
};

export function advise(
  device: MemberDevice,
  reason: ClaimReasonId,
  options: ClaimOption[],
  damage?: DamageResult | null,
): AdvisorVerdict {
  const pick = options.find((o) => o.recommended) ?? options[0] ?? null;
  if (!pick) return { headline: "No options available", reasoning: "", pick: null };

  const replaceFee = deductibleFor(device, "replacement").amount;
  const tier = deviceTier(device);

  if (reason === "damage" && damage?.beyondEconomicalRepair) {
    const upgrade = options.find((o) => o.id === "upgrade");
    return {
      headline: `Replace it — repair isn't worth it on this one`,
      reasoning: upgrade
        ? `The frame damage means it won't hold a new screen properly, so the free screen repair isn't an option here — the glass won't seat against a bent frame. A swap is ${money(replaceFee)}, your Tier ${tier} replacement deductible, against ${money(device.retail)} to buy the device outright. If you'd rather move up a model, upgrading through the claim costs the same ${money(replaceFee)} and comes with the manufacturer's warranty instead of ours.`
        : `The frame damage means it won't hold a new screen properly, so the free screen repair isn't an option here — the glass won't seat against a bent frame. A swap is ${money(replaceFee)}, your Tier ${tier} replacement deductible, against ${money(device.retail)} to buy the device outright.`,
      pick: pick.id,
    };
  }
  if (reason === "damage") {
    return {
      headline: `Repair it — free, instead of a ${money(replaceFee)} deductible`,
      reasoning: `The damage is limited to the front glass and everything else tests clean, so there's no reason to give up your ${device.name}. Screen and back-glass repair costs nothing on your plan and there's no limit on how often you use it; swapping the device instead would trigger your Tier ${tier} replacement deductible of ${money(replaceFee)}. Repair also keeps your data where it is, so nothing needs restoring. Without any coverage this repair would be ${money(damage?.retailRepairCost ?? 329)}.`,
      pick: pick.id,
    };
  }
  if (reason === "loss" || reason === "theft") {
    return {
      headline: "Replace today, and suspend the old line first",
      reasoning: `${reason === "theft" ? "Theft" : "Loss"} is covered, with a ${money(replaceFee)} Tier ${tier} replacement deductible billed to your next AT&T bill — against ${money(device.retail)} to replace it yourself. Picking up in store is faster than shipping and lets Smart Restore run on the spot, so you leave with your photos and messages already back.`,
      pick: pick.id,
    };
  }
  if (reason === "malfunction") {
    return {
      headline:
        device.warranty === "In warranty"
          ? "Route it through the manufacturer's warranty first"
          : "Replace it under Protect Advantage",
      reasoning:
        device.warranty === "In warranty"
          ? `Your ${device.name} is still inside the manufacturer's warranty, so the repair costs nothing, carries no deductible, and doesn't use a claim at all. We only use Protect Advantage once that warranty is done.`
          : `The warranty has expired and the diagnostics point at a hardware fault, which is exactly what out-of-warranty malfunction cover is for. A swap costs your Tier ${tier} deductible of ${money(replaceFee)}, against ${money(device.retail)} to replace it yourself.`,
      pick: pick.id,
    };
  }
  return {
    headline:
      device.batteryHealth < 80
        ? "Book the battery replacement — no service fee"
        : "Get it tested, it's close to the threshold",
    reasoning:
      device.batteryHealth < 80
        ? `Health is ${device.batteryHealth}%, under the 80% line, so the battery is replaced with no service fee on any device tier.`
        : `Health is ${device.batteryHealth}%, so it's above the covered threshold today. A store test settles it — if it reads under 80% the replacement is free, and if not you'll know where you stand.`,
    pick: pick.id,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 4 — Smart Restore
// Moves a member's vault onto a replacement device. Reports what it will
// move before it moves it, because "trust us" is not a feature.
// ═════════════════════════════════════════════════════════════════════════════

export type RestorePlan = {
  gb: number;
  photos: number;
  videos: number;
  messages: number;
  apps: number;
  contacts: number;
  items: number;
  minutes: number;
};

/** Vault GB → a believable item count. */
const itemsFor = (gb: number, perGb: number) => Math.round(gb * perGb);

export function planRestore(source: MemberDevice): RestorePlan {
  const v = source.vault;
  const gb = deviceVaultGB(source);
  const photos = itemsFor(v.photos, 220);
  const videos = itemsFor(v.videos, 12);
  const messages = itemsFor(v.messages, 4000);
  const apps = itemsFor(v.apps, 9);
  const contacts = itemsFor(v.contacts, 512);
  return {
    gb,
    photos,
    videos,
    messages,
    apps,
    contacts,
    items: photos + videos + messages + apps + contacts,
    minutes: Math.max(1, Math.round(gb / 60)),
  };
}

export const smartRestoreSteps = (plan: RestorePlan, target: string): string[] => [
  `Verifying your AT&T vault backup — ${plan.gb} GB found…`,
  `Restoring ${plan.photos.toLocaleString()} photos and ${plan.videos.toLocaleString()} videos…`,
  `Restoring ${plan.messages.toLocaleString()} messages and ${plan.contacts.toLocaleString()} contacts…`,
  `Reinstalling ${plan.apps} apps and your settings…`,
  `${target} is ready — everything's back.`,
];

/** Kept for the claim confirmation, which previews the flow generically. */
export const SMART_RESTORE_STEPS = [
  "Verifying your AT&T vault backup…",
  "Restoring photos, contacts & messages…",
  "Reinstalling your apps and settings…",
  "Your new device is ready — everything's back.",
];

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 5 — Proactive Care
// Watches device health and turns it into things a person can actually do.
// This is the agent that makes the plan worth paying for in a month when
// nothing breaks.
// ═════════════════════════════════════════════════════════════════════════════

export type NudgeAction =
  | { kind: "link"; label: string; to: string; search?: Record<string, string> }
  | { kind: "backup"; label: string; deviceId: string }
  | { kind: "screenGuard"; label: string; deviceId: string }
  | { kind: "battery"; label: string; deviceId: string }
  | { kind: "chat"; label: string; prompt: string };

export type Nudge = {
  id: string;
  icon: "risk" | "backup" | "battery" | "unprotected" | "vault" | "perk";
  severity: "critical" | "warning" | "info";
  text: string;
  detail: string;
  action?: NudgeAction;
};

export function runProactiveScan(m: Member): Nudge[] {
  const out: Nudge[] = [];

  const unprotected = m.devices.filter((d) => !d.protected);
  if (unprotected.length) {
    out.push({
      id: "n-unprotected",
      icon: "unprotected",
      severity: "critical",
      text: `${unprotected.length} device${unprotected.length > 1 ? "s" : ""} not protected`,
      detail: `${unprotected.map((d) => d.name).join(", ")} — a cracked screen on any of these is a full retail repair today.`,
      action: { kind: "link", label: "Enroll now", to: "/myatt/enroll" },
    });
  }

  m.devices
    .filter((d) => d.protected && d.screenRisk === "High" && !d.screenGuard)
    .forEach((d) =>
      out.push({
        id: `n-risk-${d.id}`,
        icon: "risk",
        severity: "warning",
        text: `${d.owner.split(" ")[0]}'s ${d.name} — high screen risk`,
        detail:
          "Impact history puts this device well above average for a cracked screen. A guard is free with your accessory perk.",
        action: { kind: "screenGuard", label: "Add screen guard", deviceId: d.id },
      }),
    );

  m.devices
    .filter((d) => d.protected && !d.backedUp)
    .forEach((d) =>
      out.push({
        id: `n-backup-${d.id}`,
        icon: "backup",
        severity: "warning",
        text: `${d.owner.split(" ")[0]}'s ${d.name} — last backup ${d.lastBackup.toLowerCase()}`,
        detail:
          "Smart Restore can only bring back what the vault holds. Back this device up before anything happens to it.",
        action: { kind: "backup", label: "Back up now", deviceId: d.id },
      }),
    );

  m.devices
    .filter((d) => d.protected && d.batteryHealth < 85)
    .forEach((d) =>
      out.push({
        id: `n-battery-${d.id}`,
        icon: "battery",
        severity: "info",
        text: `${d.owner.split(" ")[0]}'s ${d.name} — battery at ${d.batteryHealth}%`,
        detail:
          d.batteryHealth < 80
            ? "Below 80% — a replacement is included in your plan."
            : "Approaching the 80% mark. Once it crosses, replacement is free on your plan.",
        action: { kind: "battery", label: "Book a check", deviceId: d.id },
      }),
    );

  if (m.enrolled && m.vault.junkGB > 2) {
    out.push({
      id: "n-vault",
      icon: "vault",
      severity: "info",
      text: `${m.vault.junkGB} GB of duplicates and junk in your vault`,
      detail: `${m.vault.duplicates.toLocaleString()} duplicate files are taking up space you're paying for.`,
      action: { kind: "link", label: "Run the cleaner", to: "/myatt/vault" },
    });
  }

  if (m.enrolled && m.perks.accessoryCredits > 0) {
    out.push({
      id: "n-perk",
      icon: "perk",
      severity: "info",
      text: `${m.perks.accessoryCredits} free accessor${m.perks.accessoryCredits === 1 ? "y" : "ies"} unclaimed`,
      detail: `Your allowance resets on ${m.perks.resetsOn}. Unused credits don't carry over.`,
      action: { kind: "link", label: "Redeem now", to: "/myatt/perks" },
    });
  }

  const order = { critical: 0, warning: 1, info: 2 };
  return out
    .filter((n) => !m.dismissedNudges.includes(n.id))
    .sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Household Protection Score — derived, never stored, so it always tells the truth. */
export function computeProtectionScore(m: Member): number {
  if (!m.devices.length) return 0;
  let score = 100;
  for (const d of m.devices) {
    if (!d.protected) {
      score -= 22;
      continue;
    }
    if (!d.backedUp) score -= 7;
    if (d.screenRisk === "High" && !d.screenGuard) score -= 6;
    else if (d.screenRisk === "Medium" && !d.screenGuard) score -= 2;
    if (d.batteryHealth < 80) score -= 5;
    else if (d.batteryHealth < 85) score -= 2;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreBand(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: "Excellent", tone: "#1F7A3D" };
  if (score >= 60) return { label: "Good", tone: "#0057B8" };
  if (score >= 40) return { label: "Fair", tone: "#9E5D00" };
  return { label: "Needs attention", tone: "#C70032" };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDITION ② — the Protection Score as a closed control loop.
//
// The score used to be a thermometer: a number on a dashboard that nothing read back.
// Here its output becomes an input to three other subsystems — how hard the fraud gate
// looks, whether enrolment demands a fresh inspection, and whether a replacement is
// pre-positioned. A control loop is a system; a displayed number is a readout.
//
// Every threshold below is a constant, so the loop is reproducible: the same account
// state always produces the same posture, which is what lets it go through the ledger.
// ─────────────────────────────────────────────────────────────────────────────

export type FraudSensitivity = "standard" | "elevated";

export type Posture = {
  score: number;
  band: string;
  fraudSensitivity: FraudSensitivity;
  /** Prior claims tolerated before the velocity check asks for a human. */
  velocityThreshold: number;
  /** Enrolment requires a fresh device attestation below this posture. */
  requiresInspection: boolean;
  /** Pre-staging arms when the household is trending toward a failure. */
  preStageArmed: boolean;
  /**
   * The feedback edges in mechanism language — for the judges' impact panel and the
   * patent narrative. NOT for the member: it reads as surveillance and jargon.
   */
  effects: string[];
  /**
   * The same three edges, written for the person whose account it is.
   *
   * These are two different audiences and conflating them was a real mistake: a
   * customer told "fraud sensitivity raised to elevated" hears an accusation, and
   * "inventory pre-staging armed" is a benefit that reads like a warning. Each entry
   * below says what actually happens to *them*, in words they'd use, and the two
   * lists always describe the same underlying state.
   */
  memberEffects: Array<{ title: string; detail: string; good: boolean }>;
};

export const POSTURE_ELEVATED_BELOW = 60;
export const POSTURE_INSPECTION_BELOW = 45;
export const PRESTAGE_ARM_BELOW = 70;

export function protectionPosture(score: number): Posture {
  const elevated = score < POSTURE_ELEVATED_BELOW;
  const requiresInspection = score < POSTURE_INSPECTION_BELOW;
  const preStageArmed = score < PRESTAGE_ARM_BELOW;
  const effects: string[] = [];

  effects.push(
    elevated
      ? `Fraud sensitivity raised to elevated — a claim goes to a specialist after ${2} prior claims instead of ${4}.`
      : "Fraud sensitivity held at standard — nothing about this account warrants extra scrutiny.",
  );
  effects.push(
    requiresInspection
      ? "Adding a device requires a fresh diagnostics attestation before coverage starts."
      : "Devices can be added on the standard eligibility check.",
  );
  effects.push(
    preStageArmed
      ? "Inventory pre-staging armed — a replacement is positioned before anything breaks."
      : "Inventory pre-staging idle — no device is trending toward failure.",
  );

  const memberEffects: Posture["memberEffects"] = [
    elevated
      ? {
          title: "A claim may take one extra step",
          detail:
            "If you file again soon, someone checks it before it's approved. It doesn't cost you anything — it just isn't instant.",
          good: false,
        }
      : {
          title: "Claims go through without extra checks",
          detail: "File one and it's approved straight away, with no waiting on a review.",
          good: true,
        },
    requiresInspection
      ? {
          title: "New devices need a quick check first",
          detail:
            "Adding a phone to your plan starts with a one-minute condition check on that phone.",
          good: false,
        }
      : {
          title: "You can add another device right away",
          detail: "No inspection needed — pick the device and coverage starts.",
          good: true,
        },
    preStageArmed
      ? {
          title: "A replacement is already waiting nearby",
          detail:
            "One of your devices is showing wear, so we've moved a spare to a store near you. If it fails, you walk in and swap instead of waiting on shipping.",
          good: true,
        }
      : {
          title: "Nothing on your plan is close to failing",
          detail: "Every device is healthy enough that no spare needs holding for you.",
          good: true,
        },
  ];

  return {
    score,
    band: scoreBand(score).label,
    fraudSensitivity: elevated ? "elevated" : "standard",
    velocityThreshold: elevated ? 2 : 4,
    requiresInspection,
    preStageArmed,
    effects,
    memberEffects,
  };
}

/**
 * MECHANISM 4 — device-health decay index.
 *
 * A single deterministic number per device that trends downward as the things that
 * actually precede a failure get worse. Crossing the threshold is what arms pre-staging,
 * which is the step that turns a software decision into physical stock movement.
 */
export const PRESTAGE_THRESHOLD = 55;

export type PreStaging = {
  armed: boolean;
  index: number;
  device: string;
  /** The fulfilment node holding the pre-positioned unit. */
  store: Store | null;
  /** Why the index fell where it did — the deterministic part, stated. */
  drivers: string[];
  headline: string;
  detail: string;
  /** Working days of cover bought by staging early, versus ordering on the day. */
  daysSaved: number;
};

/**
 * MECHANISM 4 — pre-position a replacement before the failure.
 *
 * This is the mechanism that touches the physical world: crossing a deterministic
 * threshold causes a device and a restore snapshot to physically move to a named store.
 * Patent examiners care about that, because it is plainly not an abstract idea on a
 * computer — it produces a concrete real-world effect.
 *
 * Perception (a model forecasting "this will likely fail in ~3 weeks") supplies the
 * index; which store, and whether to act, stays deterministic.
 */
export function preStage(device: MemberDevice, stores: StoreMatch[]): PreStaging {
  const index = healthDecayIndex(device);
  const drivers: string[] = [];
  if (device.batteryHealth < 85)
    drivers.push(`Battery at ${device.batteryHealth}% of original capacity`);
  if (device.screenRisk === "High")
    drivers.push(
      device.screenGuard
        ? "High screen-risk profile, partly offset by a fitted protector"
        : "High screen-risk profile with no protector fitted",
    );
  else if (device.screenRisk === "Medium" && !device.screenGuard)
    drivers.push("Medium screen-risk profile with no protector fitted");
  if (device.warranty === "Out of warranty") drivers.push("Outside the manufacturer warranty");
  if (!device.backedUp) drivers.push("No current backup on this line");

  const armed = index < PRESTAGE_THRESHOLD;
  // Stock is the constraint: staging is only meaningful at a node that has the model.
  const node = stores.find((s) => s.inStock) ?? null;

  if (!armed) {
    return {
      armed: false,
      index,
      device: device.name,
      store: null,
      drivers: drivers.length ? drivers : ["Nothing on this device is trending downward"],
      headline: "No action needed",
      detail: `Health index ${index}, above the ${PRESTAGE_THRESHOLD} threshold that triggers staging. Nothing is pre-positioned, because nothing needs to be.`,
      daysSaved: 0,
    };
  }

  return {
    armed: true,
    index,
    device: device.name,
    store: node?.store ?? null,
    drivers,
    headline: node
      ? `A replacement is pre-staged at ${node.store.name}`
      : "Staging requested — no local node holds this model yet",
    detail: node
      ? `Health index ${index} crossed the ${PRESTAGE_THRESHOLD} threshold, so a ${device.name} and your restore snapshot were moved to ${node.store.name}, ${node.store.miles} miles away. If it fails, the swap is a walk-in rather than a wait.`
      : `Health index ${index} crossed the ${PRESTAGE_THRESHOLD} threshold. No store within range holds a ${device.name} today, so one has been requested from the regional depot.`,
    daysSaved: node ? 3 : 1,
  };
}

export function healthDecayIndex(d: MemberDevice): number {
  let index = 100;
  // Battery capacity is the strongest published predictor of an imminent service event.
  if (d.batteryHealth < 80) index -= 34;
  else if (d.batteryHealth < 85) index -= 22;
  else if (d.batteryHealth < 90) index -= 12;
  else if (d.batteryHealth < 95) index -= 5;

  if (d.screenRisk === "High") index -= d.screenGuard ? 12 : 26;
  else if (d.screenRisk === "Medium") index -= d.screenGuard ? 4 : 12;

  if (d.warranty === "Out of warranty") index -= 8;
  if (!d.backedUp) index -= 6;
  return Math.max(0, Math.min(100, Math.round(index)));
}

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 7 — Eligibility & Fraud
// Decides who can enrol what, verifies identity on loss and theft, and keeps
// an eye on claim velocity. Human-in-the-loop: it flags, it never refuses.
// ═════════════════════════════════════════════════════════════════════════════

export type Eligibility = { eligible: boolean; reason: string };

export function checkEligibility(d: MemberDevice): Eligibility {
  if (d.protected) return { eligible: false, reason: "Already covered under this plan" };
  if (d.screenRisk === "High" && d.warranty === "Out of warranty")
    return {
      eligible: true,
      reason: "Eligible — pre-existing damage is not covered, new incidents are",
    };
  if (d.warranty === "Out of warranty")
    return {
      eligible: true,
      reason: "Eligible — out of warranty, so malfunction cover starts immediately",
    };
  return {
    eligible: true,
    reason: `Eligible — ${d.warranty.toLowerCase()}, purchased ${d.purchased}`,
  };
}

/** Tier capacity check, used by both enrolment and the family pool. */
export function checkTierFit(tier: "basic" | "plus" | "family", deviceCount: number): Eligibility {
  const cap = TIER_POOL[tier];
  if (deviceCount > cap) {
    return {
      eligible: false,
      reason: `You selected ${deviceCount} devices — ${tier === "family" ? "Family" : tier === "plus" ? "Plus" : "Basic"} covers ${cap}. Choose Family, or go back and select fewer devices.`,
    };
  }
  return { eligible: true, reason: `${deviceCount} of ${cap} device${cap > 1 ? "s" : ""} used` };
}

// ─────────────────────────────────────────────────────────────────────────────
// MECHANISM 1 — Network-Signal-Corroborated Claim Engine.
//
// The decision half of the carrier-telemetry mechanism. Perception (an anomaly model
// deciding a disconnect pattern is abnormal) happens upstream; this function only turns
// structured facts into a verdict, deterministically, so it can go through the ledger.
//
// `now` arrives as a parameter rather than being read from the clock. A function that
// calls `Date.now()` internally is not replayable — it would return a different answer
// tomorrow and the ledger's central claim would be false.
// ─────────────────────────────────────────────────────────────────────────────

export type CorroborationOutcome = "corroborated" | "inconclusive" | "contradicted";

export type Corroboration = {
  outcome: CorroborationOutcome;
  /** 0–1, and shown to the member. Never presented as certainty. */
  confidence: number;
  headline: string;
  /** Each observation the verdict rests on, in the order it was weighed. */
  reasons: string[];
  lastSeen: string;
  cellSite: string;
  /** True when the network is not competent to speak to this claim type. */
  advisory: boolean;
};

export type CorroborationInput = {
  reason: ClaimReasonId;
  telemetry: NetworkTelemetry;
  /** Hours before `now` that the member says it happened; null when unstated. */
  incidentHoursAgo: number | null;
  /** Epoch milliseconds. Passed in to keep this function pure. */
  now: number;
};

export function corroborateClaim(input: CorroborationInput): Corroboration {
  const { reason, telemetry: t, incidentHoursAgo, now } = input;
  const nowDate = new Date(now);
  const seen = lastSeenAt(t, nowDate);
  const lastSeen = formatLastSeen(seen, nowDate);
  const site = `${t.cellSite} · ${t.cellSiteArea}`;
  const reasons: string[] = [];

  // A malfunctioning or ageing battery leaves no network trace. Saying anything
  // confident here would be inventing evidence.
  if (reason === "malfunction" || reason === "battery") {
    return {
      outcome: "inconclusive",
      confidence: 0,
      advisory: true,
      headline: "Network records don't speak to a hardware fault",
      reasons: [
        `Device last reached cell site ${t.cellSite} at ${lastSeen}.`,
        "A device that won't charge or holds no battery can still register normally, so presence on the network neither supports nor contradicts this claim. Remote diagnostics carry this one.",
      ],
      lastSeen,
      cellSite: site,
    };
  }

  const wentDark = t.disconnectPattern === "abrupt" && t.imeiStatus === "silent";
  const stillLive = t.disconnectPattern === "none" || t.activitySinceLastSeen;

  // ── The contradiction path. Only loss and theft can be contradicted by presence:
  // a cracked screen still makes calls. ──────────────────────────────────────
  if ((reason === "loss" || reason === "theft") && stillLive) {
    reasons.push(`Device last reached cell site ${t.cellSite} (${t.cellSiteArea}) at ${lastSeen}.`);
    if (t.activitySinceLastSeen)
      reasons.push("Voice or data activity has continued on this line since the reported time.");
    // The seeded anomaly, when there is one, already says this in more detail —
    // stating both reads as padding.
    if (t.simStatus === "swapped-to-other-handset" && !t.anomaly)
      reasons.push("The SIM for this line is currently active in a different handset.");
    if (t.anomaly) reasons.push(t.anomaly);
    reasons.push(
      "Carrier records and the reported account of events don't line up, so this claim goes to an Asurion specialist rather than being auto-approved.",
    );
    return {
      outcome: "contradicted",
      confidence: 0.93,
      advisory: false,
      headline: "Network records don't match the report",
      reasons,
      lastSeen,
      cellSite: site,
    };
  }

  // ── The corroboration path. ────────────────────────────────────────────────
  if (wentDark) {
    reasons.push(
      `AT&T network confirms this device dropped off at ${lastSeen} near cell site ${t.cellSite} (${t.cellSiteArea}).`,
    );
    reasons.push(
      "The signal stopped mid-session with no shutdown sequence — the pattern of a device that was damaged, lost or taken, not one switched off.",
    );
    if (!t.activitySinceLastSeen)
      reasons.push("No calls, data or SIM changes on the line since that moment.");

    // Agreement between the reported time and the network record is what lifts
    // confidence. A gap doesn't sink the claim — memories are approximate — but it
    // is weighed openly rather than ignored.
    let confidence = 0.88;
    if (incidentHoursAgo !== null) {
      const gap = Math.abs(incidentHoursAgo - t.lastSeenHoursAgo);
      if (gap <= 1) {
        confidence = 0.97;
        reasons.push(
          "That is within an hour of the time you reported, so the two accounts agree independently.",
        );
      } else if (gap <= 4) {
        confidence = 0.92;
        reasons.push(
          `That is about ${Math.round(gap)} hours from the time you reported — close enough to be consistent.`,
        );
      } else {
        confidence = 0.72;
        reasons.push(
          `You reported this about ${Math.round(gap)} hours away from when the network lost the device. Not disqualifying, but it is noted on the claim.`,
        );
      }
    }
    return {
      outcome: "corroborated",
      confidence,
      advisory: reason === "damage",
      headline:
        reason === "damage"
          ? "Network records support the reported damage"
          : `Loss auto-verified — network confirms the device went dark at ${lastSeen}`,
      reasons,
      lastSeen,
      cellSite: site,
    };
  }

  // ── Everything else: a clean power-down looks the same as a flat battery. ──
  reasons.push(`Device last reached cell site ${t.cellSite} (${t.cellSiteArea}) at ${lastSeen}.`);
  reasons.push(
    "It wound down normally rather than cutting out, which is what a discharged battery or a device switched off looks like. The network can't distinguish those from the event reported.",
  );
  return {
    outcome: "inconclusive",
    confidence: 0.4,
    advisory: false,
    headline: "Network records are consistent, but not conclusive",
    reasons,
    lastSeen,
    cellSite: site,
  };
}

/** Hours between an incident date/time and now — the input the engine compares against. */
export function incidentHoursAgo(
  incident: IncidentDetails | undefined,
  now: number,
): number | null {
  if (!incident?.date) return null;
  const stamp = new Date(`${incident.date}T${incident.time?.trim() || "12:00"}:00`);
  if (Number.isNaN(stamp.getTime())) return null;
  return Math.max(0, (now - stamp.getTime()) / 3_600_000);
}

export type FraudSignal = {
  id: string;
  level: "clear" | "review";
  label: string;
  /** What the agent is doing, shown while the check runs. */
  running: string;
  /** What it concluded, shown once it settles. */
  note: string;
  /**
   * The individual operations behind this check, ticked off one at a time while it runs.
   *
   * A check that resolves in a single frame doesn't read as work — it reads as a
   * pre-baked answer, which is exactly the wrong impression for the one screen that is
   * supposed to show an agent reasoning. These are what makes the run legible: a panellist
   * can see *what* is being interrogated, not just that something happened.
   */
  steps: string[];
  /** Where the fact came from — shown as a provenance line under the result. */
  source: string;
};

/**
 * The checks Asurion expects before a loss or theft claim is fulfilled. Returned as an
 * ordered list so the UI can run them one at a time and show the agent working, rather
 * than flipping a device to "blocked" the instant a button is pressed.
 */
export function fraudCheck(
  m: Member,
  reason: ClaimReasonId,
  device: MemberDevice,
  incident?: IncidentDetails,
  /** Mechanism 1's verdict. Supplied by the caller so this stays a pure function. */
  corr?: Corroboration,
): FraudSignal[] {
  const priorOnDevice = m.claims.filter((c) => c.deviceId === device.id).length;
  const priorTotal = m.claims.length;
  const age = daysSince(incident?.date);
  const inWindow = withinFilingWindow(incident?.date);
  // Addition ② — the closed loop. How tolerant this gate is comes from the account's
  // own Protection Score rather than a fixed constant.
  const posture = protectionPosture(m.protectionScore);

  const signals: FraudSignal[] = [
    {
      id: "identity",
      level: "clear",
      label: "Identity verification",
      running: "Confirming it's really you",
      steps: [
        "Reading the contact details on the account",
        `Sending a one-time code to ${m.email}`,
        "Waiting for the code to be confirmed",
        "Matching the confirmation against the account holder",
      ],
      note: `One-time code confirmed against ${m.email}`,
      source: "AT&T account record",
    },
    {
      id: "standing",
      level: "clear",
      label: "Account standing",
      running: "Checking the account is in good standing",
      steps: [
        `Opening account ${m.accountNumber}`,
        "Reading billing history and current balance",
        "Checking for suspensions or collections activity",
        "Confirming the protection feature is active",
      ],
      note: `Member since ${m.memberSince} · balance ${m.balance} · in good standing`,
      source: "AT&T billing system",
    },
    {
      id: "velocity",
      level: priorTotal >= posture.velocityThreshold ? "review" : "clear",
      label: "Claim history",
      running: `Reviewing claim frequency at ${posture.fraudSensitivity} sensitivity`,
      steps: [
        `Pulling claims filed in the last ${ASURION.claimLimitWindow}`,
        `Reading the review threshold from your Protection Score (${posture.score})`,
        `Comparing ${priorTotal} prior claim${priorTotal === 1 ? "" : "s"} against a threshold of ${posture.velocityThreshold}`,
        priorOnDevice
          ? `Checking how many were on this device (${priorOnDevice})`
          : "Checking whether any were on this device",
      ],
      note:
        priorTotal >= posture.velocityThreshold
          ? `${priorTotal} claims in the last ${ASURION.claimLimitWindow} — claims are unlimited, but a Protection Score of ${posture.score} sets the review threshold at ${posture.velocityThreshold}, so Asurion looks at this one`
          : `${priorTotal} claim${priorTotal === 1 ? "" : "s"} in the last ${ASURION.claimLimitWindow} · claims are unlimited on this plan` +
            (priorOnDevice ? ` · ${priorOnDevice} on this device` : ""),
      source: "Asurion claim history",
    },
    {
      id: "device",
      level: "clear",
      label: "Device and line match",
      running: "Making sure this device belongs to this line",
      steps: [
        `Reading the IMEI on file for ${device.line}`,
        `Comparing it against the reported device (${device.name})`,
        "Confirming the line sits on this account",
        "Checking the device is covered under the active plan",
      ],
      note: `IMEI ${device.imei} matches ${device.line} on account ${m.accountNumber}`,
      source: "AT&T device registry",
    },
  ];

  if (reason === "loss" || reason === "theft") {
    signals.push({
      id: "window",
      level: inWindow ? "clear" : "review",
      label: "Reporting window",
      running: `Checking the ${ASURION.filingWindowDays}-day filing window`,
      steps: [
        "Reading the incident date you gave us",
        "Calculating how long ago that was",
        `Comparing against Asurion's ${ASURION.filingWindowDays}-day limit`,
      ],
      note:
        age === null
          ? "No incident date given — reported today"
          : inWindow
            ? `Reported ${age === 0 ? "same day" : `${age} day${age === 1 ? "" : "s"} after the incident`}, inside the ${ASURION.filingWindowDays}-day window`
            : `Reported ${age} days after the incident — past the ${ASURION.filingWindowDays}-day window, so Asurion reviews this one`,
      source: "Asurion program terms",
    });
    // Mechanism 1. This is the only check on the list that no other administrator
    // could run, because it reads the carrier's own device-presence records.
    signals.push({
      id: "network",
      level: corr?.outcome === "contradicted" ? "review" : "clear",
      label: "Network corroboration",
      running: "Cross-checking against AT&T's own network records",
      steps: [
        "Querying carrier device-presence records for this line",
        "Reading last-seen time and cell-site location",
        "Analysing the disconnection pattern",
        "Checking SIM and IMEI status since that moment",
        "Comparing the network's account against yours",
      ],
      note: corr
        ? `${corr.headline} · ${Math.round(corr.confidence * 100)}% confidence`
        : "No network records available for this line",
      source: "AT&T network telemetry — no other administrator can read this",
    });
  }

  return signals;
}

// ─────────────────────────────────────────────────────────────────────────────
// The suspension action, deliberately separated from the checks above.
//
// Suspending a line and submitting an IMEI to the national blocklist is the one
// genuinely destructive thing in this flow: the handset stops working on every US
// carrier, and unwinding it means a call to Asurion. It used to happen automatically as
// the last "check" in the list, which is wrong — a customer who has just told us their
// phone is missing should be asked before we brick it, not informed afterwards.
//
// So it is now a separate, explicitly consented step, and it is refused outright when the
// network disputes the report.
// ─────────────────────────────────────────────────────────────────────────────

export type SuspensionPlan = {
  /** False when the network contradicts the report — we don't brick on disputed evidence. */
  allowed: boolean;
  line: string;
  imei: string;
  deviceName: string;
  /** Exactly what will happen, so consent is informed. */
  consequences: string[];
  /** What will NOT happen — the reassurance half. */
  reassurances: string[];
  /** The one thing a member most needs to understand before agreeing. */
  warning: string;
  /** Shown instead of the consent prompt when `allowed` is false. */
  blockedReason?: string;
};

export function suspensionPlan(
  m: Member,
  device: MemberDevice,
  reason: ClaimReasonId,
  corr?: Corroboration,
): SuspensionPlan {
  const base = {
    line: device.line,
    imei: device.imei,
    deviceName: device.name,
  };

  if (corr?.outcome === "contradicted") {
    return {
      ...base,
      allowed: false,
      consequences: [],
      reassurances: [],
      warning: "",
      blockedReason:
        "AT&T's network records don't match the report, so we won't suspend the line or block the device. Blocking on disputed evidence would strand a phone that appears to be working. An Asurion specialist reviews this before anything else happens.",
    };
  }

  return {
    ...base,
    allowed: true,
    consequences: [
      `Line ${device.line} is suspended — no calls, texts or data on this number until a replacement is activated.`,
      `IMEI ${device.imei} is submitted to the national blocklist, so the ${device.name} can't be activated on AT&T or any other US carrier.`,
      "The device can't be sold or traded in by anyone who finds or took it.",
      `If it turns up, call ${ASURION.short} on ${ASURION.claimsPhone} — reversing a blocklist entry can't be done from this app.`,
    ],
    reassurances: [
      "Your phone number is not lost. It moves to your replacement device.",
      `Everything in your Data Vault stays exactly where it is — it's anchored to ${device.line}, not to the handset.`,
      "Your bill doesn't change, and coverage stays active throughout.",
    ],
    warning:
      reason === "theft"
        ? "Only do this if the device is genuinely gone. Blocking is how you stop someone else using or reselling it — but it is hard to undo."
        : "Only do this if you're confident the device is gone for good. If there's a chance it's under a car seat, look first — a blocklist entry is hard to undo.",
  };
}

/** The decision the agent lands on once every check has run. */
export type FraudVerdict = {
  outcome: "approved" | "review";
  headline: string;
  detail: string;
};

export function fraudVerdict(signals: FraudSignal[]): FraudVerdict {
  const flagged = signals.filter((s) => s.level === "review");
  if (!flagged.length) {
    return {
      outcome: "approved",
      headline: "Verified — your claim can proceed",
      detail: `All ${signals.length} checks cleared. ${ASURION.short} has what it needs to fulfil this claim without a manual review.`,
    };
  }
  return {
    outcome: "review",
    headline: "Verified, with one thing for a human to confirm",
    detail: `${flagged.map((f) => f.label.toLowerCase()).join(" and ")} needs a look. Your claim still goes through — an ${ASURION.short} specialist confirms it before the replacement ships, usually within a couple of hours.`,
  };
}

export const needsIdentityCheck = (reason: ClaimReasonId) =>
  reason === "loss" || reason === "theft";

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 8 — Family Orchestration
// The pool, its capacity, parental controls, and who is using the shared vault.
// ═════════════════════════════════════════════════════════════════════════════

export type PoolStatus = {
  capacity: number;
  used: number;
  free: number;
  full: boolean;
  label: string;
  shareable: boolean; // only Family pools have more than one seat
};

export function poolStatus(m: Member): PoolStatus {
  const capacity = m.tier ? TIER_POOL[m.tier] : 0;
  const used = m.devices.filter((d) => d.protected).length;
  const free = Math.max(0, capacity - used);
  return {
    capacity,
    used,
    free,
    full: free === 0,
    label: capacity === 0 ? "No plan" : `${used} of ${capacity} device${capacity > 1 ? "s" : ""}`,
    shareable: capacity > 1,
  };
}

export type VaultShare = { device: MemberDevice; gb: number; pct: number };

/** Who is actually consuming the shared vault — the family lock-in argument, shown. */
export function vaultShares(m: Member): VaultShare[] {
  const backed = m.devices.filter((d) => d.backedUp && d.protected);
  const total = backed.reduce((n, d) => n + deviceVaultGB(d), 0) || 1;
  return backed
    .map((d) => ({ device: d, gb: deviceVaultGB(d), pct: (deviceVaultGB(d) / total) * 100 }))
    .sort((a, b) => b.gb - a.gb);
}

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 2 — Coverage Assistant
// The chat AT&T already puts on every page, but one that can actually answer
// coverage questions and hand you straight to the thing you asked about.
// ═════════════════════════════════════════════════════════════════════════════

export type ChatAction = {
  label: string;
  to?: string;
  search?: Record<string, string>;
  ask?: string;
};
export type ChatMessage = { role: "user" | "agent"; text: string; actions?: ChatAction[] };

type ChatContext = { member: Member | null };

export function assistantGreeting(ctx: ChatContext): ChatMessage {
  const m = ctx.member;
  if (!m) {
    return {
      role: "agent",
      text: "Hi — I'm the AT&T virtual assistant. I can explain what device protection covers, what it costs, and what happens when you file a claim. What can I help with?",
      actions: [
        { ask: "What does device protection cover?", label: "What's covered?" },
        { ask: "How much does it cost?", label: "How much is it?" },
        { label: "Compare plans", to: "/deviceflex" },
      ],
    };
  }
  if (!m.enrolled) {
    return {
      role: "agent",
      text: `Hi ${m.firstName} — I can see ${m.devices.filter((d) => d.eligible).length} devices on your account that aren't covered yet. Ask me anything about what protection includes, or I can take you to your options.`,
      actions: [
        { ask: "What does it cover?", label: "What's covered?" },
        { label: "See my options", to: "/myatt/enroll" },
        { ask: "How much does it cost?", label: "How much is it?" },
      ],
    };
  }
  return {
    role: "agent",
    text: `Hi ${m.firstName} — you're on Protect Advantage ${m.tier === "family" ? "Family" : m.tier === "plus" ? "Plus" : "Basic"}. Ask me about a claim, your coverage, your devices or your vault, and I'll take you straight there.`,
    actions: [
      { ask: "Am I covered for a cracked screen?", label: "Cracked screen?" },
      { ask: "My phone was stolen", label: "Phone stolen" },
      { ask: "What's my deductible?", label: "My deductible" },
    ],
  };
}

export function assistantReply(input: string, ctx: ChatContext): ChatMessage {
  const q = input.toLowerCase();
  const m = ctx.member;
  const enrolled = !!m?.enrolled;
  const tierName = m?.tier === "family" ? "Family" : m?.tier === "plus" ? "Plus" : "Basic";

  // Not signed in — keep it factual and route to sign-in where it needs an account.
  if (!m && /(my |claim|deductible|vault|device|score)/.test(q)) {
    return {
      role: "agent",
      text: "I'll need you signed in to look at your account. Once you're in I can check your coverage, start a claim, or open your vault.",
      actions: [
        { label: "Sign in", to: "/login" },
        { ask: "What does protection cover?", label: "What's covered generally?" },
      ],
    };
  }

  // Not enrolled — every coverage question becomes an enrolment answer.
  if (m && !enrolled && /(cover|deductible|claim|protect|crack|screen|lost|stolen|broke)/.test(q)) {
    const elig = m.devices.filter((d) => d.eligible).length;
    return {
      role: "agent",
      text: `You're not on AT&T Protect Advantage yet, so a cracked screen or a lost phone would be full retail today. You have ${elig} eligible device${elig === 1 ? "" : "s"} — coverage starts at $15/mo. and includes damage, loss, theft and out-of-warranty malfunction, with any claim cost shown before you commit.`,
      actions: [
        { label: "See my options", to: "/myatt/enroll" },
        { label: "Compare tiers", to: "/deviceflex" },
      ],
    };
  }

  if (/(crack|screen|broke|shatter|drop|damag)/.test(q)) {
    return {
      role: "agent",
      text: "Yes — accidental damage including cracked screens is covered. Send three photos and the assessment comes back in seconds, then you pick a home repair, an in-store repair, or a 15-minute swap. Your cost is confirmed before you book anything.",
      actions: [
        { label: "Start a claim", to: "/myatt/claims/new" },
        { ask: "Where is my nearest store?", label: "Nearest store" },
      ],
    };
  }

  if (/(lost|lose|stolen|steal|theft|missing)/.test(q)) {
    return {
      role: "agent",
      text: "Loss and theft are both covered. We verify it's you, suspend the line so nobody else can use it, and get you a same-day replacement — Smart Restore brings your photos and messages back in store.",
      actions: [
        { label: "Report it now", to: "/myatt/claims/new" },
        { ask: "How does Smart Restore work?", label: "What's Smart Restore?" },
      ],
    };
  }

  if (/(not working|malfunction|won'?t|charge|power|broken|fault)/.test(q)) {
    return {
      role: "agent",
      text: "Mechanical and electrical failures are covered. If the device is still inside the manufacturer's warranty we route it there first — that costs you nothing and doesn't touch your plan. Once it's out of warranty, Protect Advantage covers the replacement.",
      actions: [{ label: "Run diagnostics", to: "/myatt/claims/new" }],
    };
  }

  if (/(battery|drain)/.test(q)) {
    const worst = m?.devices
      .filter((d) => d.protected)
      .sort((a, b) => a.batteryHealth - b.batteryHealth)[0];
    return {
      role: "agent",
      text: worst
        ? `Battery replacement is included once health drops below 80%. Your lowest right now is ${worst.owner.split(" ")[0]}'s ${worst.name} at ${worst.batteryHealth}% — ${worst.batteryHealth < 80 ? "that's already covered, I can book it." : "still above the line, but I'm watching it."}`
        : "Battery replacement is included once health drops below 80%.",
      actions: [{ label: "Book a battery check", to: "/myatt/claims/new" }],
    };
  }

  if (/(deductible|fee|cost|how much|price|pay|bill)/.test(q)) {
    return {
      role: "agent",
      text: enrolled
        ? `Your deductible depends on the device and the type of claim — I show you the exact amount before you confirm anything, so there is nothing to discover later. You're on ${tierName} at $${m?.tierPrice}/mo., which covers ${poolStatus(m!).capacity} device${poolStatus(m!).capacity > 1 ? "s" : ""}, ${m?.perks.accessoryTotal} free annual accessor${m?.perks.accessoryTotal === 1 ? "y" : "ies"} and a ${formatCapacity(m!.vault.totalGB)} vault.`
        : "Protect Advantage runs $15/mo. for one device, $25 with home repair and the accessory perk, or $40 for up to five devices. Any claim deductible is shown upfront before you commit.",
      actions: enrolled
        ? [{ label: "See my plan", to: "/myatt/protection" }]
        : [{ label: "Compare tiers", to: "/deviceflex" }],
    };
  }

  if (/(upgrade|new phone|next up|trade[- ]?in)/.test(q)) {
    const nextUp = m?.devices.filter((d) => d.nextUp) ?? [];
    return {
      role: "agent",
      text: nextUp.length
        ? `If a device can't be economically repaired, we offer an upgrade beside the like-for-like replacement — same deductible, but you pick a newer model and it carries the manufacturer's warranty. Separately, ${nextUp.map((d) => `${d.owner.split(" ")[0]}'s ${d.name}`).join(" and ")} ${nextUp.length > 1 ? "are" : "is"} on Next Up Anytime, which locks a guaranteed trade-in value against the balance. Next Up needs a device in good working order, so it isn't available on the handset you're claiming for.`
        : "If a device can't be economically repaired, we offer an upgrade beside the like-for-like replacement — same deductible, but you pick a newer model and it carries the manufacturer's warranty. None of your devices are on Next Up Anytime right now, but your membership still locks a guaranteed trade-in value on each one.",
      actions: [
        { label: "See my devices", to: "/myatt" },
        { label: "Shop phones", to: "/buy/phones" },
      ],
    };
  }

  if (/(smart restore|restore|backup|back up|vault|photo|data|storage)/.test(q)) {
    return {
      role: "agent",
      text: enrolled
        ? `Your vault holds ${formatCapacity(m!.vault.totalGB)} shared across the household. Smart Restore pulls it onto a replacement device in under two minutes — in store, right after the associate hands it to you. Nothing restores before then, because the new device doesn't exist yet.`
        : "The AT&T vault backs up photos, messages, contacts and apps, and Smart Restore puts them onto a replacement device in under two minutes.",
      actions: enrolled
        ? [{ label: "Open my vault", to: "/myatt/vault" }]
        : [{ label: "See plans", to: "/deviceflex" }],
    };
  }

  if (/(refurb|refurbish|used|second hand|new)/.test(q)) {
    return {
      role: "agent",
      text: "Every replacement we issue is factory new and sealed — never refurbished. You get a written guarantee with the serial number on it when the swap is fulfilled.",
      actions: enrolled
        ? [{ label: "See my guarantees", to: "/myatt/protection" }]
        : [{ label: "See plans", to: "/deviceflex" }],
    };
  }

  if (/(family|kid|child|pool|add device|parental)/.test(q)) {
    if (enrolled && m) {
      const p = poolStatus(m);
      return {
        role: "agent",
        text: `Your ${tierName} plan covers ${p.capacity} device${p.capacity > 1 ? "s" : ""} and you're using ${p.used}. ${p.free > 0 ? `You've got ${p.free} seat${p.free > 1 ? "s" : ""} free.` : "The pool is full."} Every device gets swaps, the vault and repair benefits, and kids' devices can have parental controls on.`,
        actions: [{ label: "Manage family", to: "/myatt/family" }],
      };
    }
    return {
      role: "agent",
      text: "The Family tier covers up to five devices under one $40/mo. subscription — phones, tablets and kids' devices, with a shared vault and parental controls.",
      actions: [{ label: "Compare tiers", to: "/deviceflex" }],
    };
  }

  if (/(store|near|location|appointment|book|slot)/.test(q)) {
    const d = m?.devices.find((x) => x.protected) ?? m?.devices[0];
    const match = d ? bestStore(d, "swap") : null;
    return {
      role: "agent",
      text: match
        ? `Your nearest store with capacity is ${match.store.name}, ${match.store.miles} mi away — ${match.store.hours.toLowerCase()}. ${match.reason}. Next free slots are ${match.slots.slice(0, 3).join(", ")}.`
        : "I can find your nearest store once you're signed in.",
      actions: [{ label: "Book a visit", to: "/myatt/claims/new" }],
    };
  }

  if (/(score|health|risk|proactive)/.test(q) && m) {
    const s = computeProtectionScore(m);
    const nudges = runProactiveScan(m);
    return {
      role: "agent",
      text: `Your household protection score is ${s} out of 100 — ${scoreBand(s).label.toLowerCase()}. ${nudges.length ? `The biggest thing to fix: ${nudges[0].text.toLowerCase()}.` : "Nothing needs your attention right now."}`,
      actions: [{ label: "See my score", to: "/myatt/protection" }],
    };
  }

  if (/(cancel|leave|stop|downgrade)/.test(q)) {
    return {
      role: "agent",
      text: "You can change or cancel your plan at any time from Manage plan — there's no contract and no cancellation fee. Changes take effect on your next bill.",
      actions: [{ label: "Manage plan", to: "/myatt/protection" }],
    };
  }

  if (/(agent|human|person|representative|call)/.test(q)) {
    return {
      role: "agent",
      text: "I can hand you to a person any time — the team is on 866-971-4383, or you can book an in-store appointment and talk to someone face to face.",
      actions: [{ label: "Find a store", to: "/myatt/claims/new" }],
    };
  }

  if (/(cover|what.*includ|protect)/.test(q)) {
    return {
      role: "agent",
      text: "Protect Advantage covers accidental damage, loss, theft, and out-of-warranty mechanical or electrical failure. It also includes battery replacement under 80% health, a secure data vault, and a free accessory each year on Plus and Family. Whatever a claim costs, you see it before you book.",
      actions: enrolled
        ? [
            { label: "See my plan", to: "/myatt/protection" },
            { ask: "How do I file a claim?", label: "Filing a claim" },
          ]
        : [{ label: "See my options", to: "/myatt/enroll" }],
    };
  }

  if (/(claim|file|report)/.test(q)) {
    return {
      role: "agent",
      text: "Filing takes about a minute. Tell us what happened, pick the device, add three photos if it's damage or run a quick diagnostic if it isn't, and you'll get resolution options with real times and costs.",
      actions: [{ label: "File a claim", to: "/myatt/claims/new" }],
    };
  }

  return {
    role: "agent",
    text: "I can help with claims, what's covered, your deductible, upgrades, your vault or your family plan. What would you like to do?",
    actions: [
      { ask: "Am I covered for a cracked screen?", label: "Cracked screen?" },
      { ask: "What's my deductible?", label: "My deductible" },
      { ask: "How does Smart Restore work?", label: "Smart Restore" },
    ],
  };
}

export { formatCapacity, TIER_VAULT_GB };
