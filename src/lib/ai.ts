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
  /** What this path costs the member. "Covered" where the plan absorbs it;
   *  a real figure once the deductible schedule is wired in. */
  price: string;
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

  if (reason === "damage") {
    const beyond = damage?.beyondEconomicalRepair;
    const repairQuote = damage?.retailRepairCost ?? 329;

    if (!beyond) {
      if (HOME_REPAIR.available) {
        opts.push({
          id: "home-repair",
          title: "Home screen repair",
          detail: `A technician comes to you and repairs the screen in about ${HOME_REPAIR.etaMinutes} minutes. You keep your device — nothing to restore.`,
          price: "Covered",
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
          price: "Covered",
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
        price: "Covered",
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
        price: "Covered",
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
      price: "Covered",
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
        detail: `Your ${device.name} is still in warranty — repair is handled under the manufacturer's warranty at no cost.`,
        price: "Covered",
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
        price: "Covered",
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
          ? `Battery health is ${device.batteryHealth}% — below the 80% threshold, so replacement is included in your plan.`
          : `Health is ${device.batteryHealth}%. We'll test in store; if it reads under 80% the replacement is included.`,
        price: "Covered",
        time: `~45 min · ${at(batteryStore)}`,
        recommended: true,
        restore: "none",
        outcome: "Your own device with a new battery",
        withoutCoverage: "$89",
        storeId: batteryStore.store.id,
      });
    }
  }

  // Upgrade is offered only when the member has Next Up Anytime AND the device
  // cannot be economically repaired (or is gone). Anything else and an upgrade
  // would be an upsell dressed as a claim.
  const beyondRepair = damage?.beyondEconomicalRepair || reason === "loss" || reason === "theft";
  if (device.nextUp && beyondRepair) {
    const monthly = Math.round((device.retail / 36) * 100) / 100;
    opts.push({
      id: "upgrade",
      title: "Upgrade to a new device (Next Up Anytime)",
      detail: `You're on Next Up Anytime and this device can't be economically repaired. Your guaranteed trade-in value of ${money(device.tradeIn)} is applied — upgrade now instead of replacing like-for-like.`,
      price: `from $${monthly.toFixed(2)}/mo.`,
      time: "Same visit",
      restore: "in-store",
      outcome: "A newer model, with your trade-in value locked in",
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

  if (reason === "damage" && damage?.beyondEconomicalRepair) {
    const upgrade = options.find((o) => o.id === "upgrade");
    return {
      headline: `Replace it — repair isn't worth it on this one`,
      reasoning: upgrade
        ? `A repair would run about ${money(damage.retailRepairCost)} against a device worth ${money(device.retail)}, and the frame damage means it won't hold a new screen properly. A swap gets you a factory-new ${device.name} in 15 minutes, with your cost confirmed before you book. You're also on Next Up Anytime, so upgrading with your ${money(device.tradeIn)} trade-in is a real alternative if you'd rather move up a model.`
        : `A repair would run about ${money(damage.retailRepairCost)} against a device worth ${money(device.retail)}, and the frame damage means it won't hold a new screen properly. A swap gets you a factory-new ${device.name} in 15 minutes, with your cost confirmed before you book.`,
      pick: pick.id,
    };
  }
  if (reason === "damage") {
    return {
      headline: "Repair it — you keep your own device",
      reasoning: `The damage is limited to the front glass and everything else tests clean, so there's no reason to give up your ${device.name}. Home repair is the fastest path and nothing needs restoring, because your data never leaves the device. Without coverage this repair would be ${money(damage?.retailRepairCost ?? 329)}.`,
      pick: pick.id,
    };
  }
  if (reason === "loss" || reason === "theft") {
    return {
      headline: "Replace today, and suspend the old line first",
      reasoning: `${reason === "theft" ? "Theft" : "Loss"} is covered. Picking up in store is faster than shipping and lets Smart Restore run on the spot, so you leave with your photos and messages already back. Without coverage a replacement would be ${money(device.retail)}.`,
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
          ? `Your ${device.name} is still inside the manufacturer's warranty, so the repair costs nothing and doesn't consume anything on your plan. We only use Protect Advantage once that warranty is done.`
          : `The warranty has expired and the diagnostics point at a hardware fault, which is exactly what out-of-warranty malfunction cover is for. A swap is ${money(device.retail)} without coverage and $0 with it.`,
      pick: pick.id,
    };
  }
  return {
    headline:
      device.batteryHealth < 80
        ? "Book the battery replacement — it's covered"
        : "Get it tested, it's close to the threshold",
    reasoning:
      device.batteryHealth < 80
        ? `Health is ${device.batteryHealth}%, under the 80% line, so the replacement is included in your plan.`
        : `Health is ${device.batteryHealth}%, so it's above the covered threshold today. A store test settles it — if it reads under 80% the replacement is free, and if not you'll know where you stand.`,
    pick: pick.id,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// AGENT 4 — Smart Restore
// Moves a member's vault onto a loaner or replacement. Reports what it will
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
  if (score >= 40) return { label: "Fair", tone: "#B26A00" };
  return { label: "Needs attention", tone: "#C70032" };
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

export type FraudSignal = { level: "clear" | "review"; label: string; note: string };

export function fraudCheck(m: Member, reason: ClaimReasonId, device: MemberDevice): FraudSignal[] {
  const recent = m.claims.filter((c) => c.deviceId === device.id).length;
  const signals: FraudSignal[] = [
    {
      level: "clear",
      label: "Account standing",
      note: `Member since ${m.memberSince} · balance ${m.balance}`,
    },
    {
      level: recent >= 3 ? "review" : "clear",
      label: "Claim velocity",
      note:
        recent === 0
          ? "No prior claims on this device"
          : `${recent} prior claim${recent > 1 ? "s" : ""} on this device`,
    },
    {
      level: "clear",
      label: "Device match",
      note: `IMEI ${device.imei} matches the line on file`,
    },
  ];
  if (reason === "loss" || reason === "theft") {
    signals.push({
      level: "clear",
      label: "Identity verification",
      note: "One-time code to the account holder's verified number",
    });
  }
  return signals;
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
  const backed = m.devices.filter((d) => d.backedUp);
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
        ? `Upgrades run through Next Up Anytime — ${nextUp.map((d) => `${d.owner.split(" ")[0]}'s ${d.name}`).join(" and ")} ${nextUp.length > 1 ? "are" : "is"} enrolled. Your membership also locks a guaranteed trade-in value, so if a device can't be economically repaired we'll offer the upgrade instead of a like-for-like replacement.`
        : "Upgrades run through Next Up Anytime. None of your devices are enrolled right now, but your membership still locks a guaranteed trade-in value on each one.",
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
