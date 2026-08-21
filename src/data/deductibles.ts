// AT&T Protect Advantage deductible / service-fee schedule.
//
// Real published figures, not invented ones. Two sources, because they disagree and the
// newer one wins:
//   · Replacement deductibles by device tier come from the Protect Advantage for 1
//     brochure (49-state consumer edition): Tier 1 $25 · Tier 2 $100 · Tier 3 $225 ·
//     Tier 4 $275.
//   · Screen and back-glass repair is $0 and uncapped on current Protect Advantage,
//     alongside unlimited battery replacement, unlimited claims, same-day replacement
//     and ProTech support. The $29 screen fee in the 2023 brochure is the old schedule.
//
// Surfacing these upfront is the whole ideation: today a customer finds the number out at
// the counter. It is also what gives the Claim-to-Upgrade Advisor something real to argue
// — the same cracked screen is $0 repaired and a tiered deductible replaced.

export type DeviceTier = 1 | 2 | 3 | 4;

/** Non-refundable deductible charged per approved replacement claim, by device tier. */
export const REPLACEMENT_DEDUCTIBLE: Record<DeviceTier, number> = {
  1: 25,
  2: 100,
  3: 225,
  4: 275,
};

/**
 * Screen and back-glass repair carry no service fee on current Protect Advantage,
 * and there is no cap on how many you can have. This is the single strongest thing
 * about the plan and the reason the Advisor argues for repair over replacement:
 * the same cracked screen is $0 repaired and a tiered deductible replaced.
 */
export const SCREEN_REPAIR_FEE = 0;
export const BACK_GLASS_FEE = 0;

/** Battery replacement on an eligible device carries no service fee. */
export const BATTERY_FEE = 0;

/** Charged if a damaged device isn't returned after a replacement is issued. */
export const NON_RETURN_FEE = 850;

/**
 * Asurion administers the program on behalf of the underwriter. Every claim filed here is
 * submitted to them — they own fulfilment, the replacement device and the blocklist entry.
 */
export const ASURION = {
  administrator: "Asurion Protection Services, LLC",
  short: "Asurion",
  underwriter: "Continental Casualty Company, a CNA Company",
  claimsUrl: "phoneclaim.com/att",
  claimsPhone: "888.562.8662",
  /** A claim must be reported within this many days of the incident. */
  filingWindowDays: 60,
  /** Current Protect Advantage carries no claim cap. */
  claimLimit: "Unlimited" as const,
  claimLimitWindow: "12 months",
  /** Repairs are done in AT&T stores and Asurion's own uBreakiFix network. */
  repairNetwork: "uBreakiFix by Asurion",
  repairStores: 700,
  maxDeviceValue: 3500,
  hours: "Mon–Fri 8am–10pm ET · Sat–Sun 9am–9pm ET",
} as const;

/**
 * Explicit tier assignment, the way AT&T publishes it — a lookup table by make/model, not a
 * formula. Anything unlisted falls back to a price band, and a non-AT&T device is Tier 2 per
 * the program terms.
 */
const TIER_BY_MODEL: Record<string, DeviceTier> = {
  // Tier 4 — current flagships. AT&T places the iPhone 13/14 families, Galaxy S Ultra,
  // Z Fold/Flip and Pixel Pro here, so their 2026 successors sit in the same band.
  "iPhone 17 Pro Max": 4,
  "iPhone 17 Pro": 4,
  "iPhone 17": 4,
  "iPhone 16": 4,
  "iPhone Air": 4,
  "Galaxy S26 Ultra": 4,
  "Galaxy S26+": 4,
  "Galaxy Z Fold7": 4,
  "Galaxy Z Fold8": 4,
  "Galaxy Z Flip8": 4,
  "Pixel 10 Pro": 4,
  "Pixel 10 Pro XL": 4,

  // Tier 3 — mid and entry flagship.
  "iPhone 17e": 3,
  "Galaxy S26": 3,
  "Pixel 10a": 3,
  "Motorola Edge 2026": 3,

  // Tier 2 — budget smartphones and any bring-your-own device.
  "Galaxy A37 5G": 2,
  "Galaxy A17 5G": 2,
  "Moto G 2026": 2,

  // Tier 1 — wearables and feature phones.
};

export type TieredDevice = { name: string; retail?: number };

/** Which tier a device sits in, and therefore what a replacement costs. */
export function deviceTier(device: TieredDevice): DeviceTier {
  const listed = TIER_BY_MODEL[device.name];
  if (listed) return listed;
  // Fallback band, calibrated against the published list.
  const retail = device.retail ?? 0;
  if (retail >= 900) return 4;
  if (retail >= 600) return 3;
  if (retail >= 300) return 2;
  return 1;
}

/** The kinds of resolution that carry different fees. */
export type FeeKind = "screen-repair" | "replacement" | "battery" | "warranty" | "upgrade";

export type Deductible = {
  amount: number;
  /** How it reads on screen — "$29" or "No charge". */
  label: string;
  /** Why this amount applies, in plain English. */
  basis: string;
  tier: DeviceTier;
};

export function deductibleFor(device: TieredDevice, kind: FeeKind): Deductible {
  const tier = deviceTier(device);

  switch (kind) {
    case "screen-repair":
      return {
        amount: SCREEN_REPAIR_FEE,
        label: "No charge",
        basis:
          "Screen and back-glass repair carry no service fee, with no limit on how many times you use it",
        tier,
      };
    case "battery":
      return {
        amount: BATTERY_FEE,
        label: "No charge",
        basis:
          "Battery replacement carries no service fee, unlimited, once ProTech testing confirms it won't hold a charge",
        tier,
      };
    case "warranty":
      return {
        amount: 0,
        label: "No charge",
        basis: "Handled under the manufacturer's warranty, so your plan isn't used",
        tier,
      };
    case "upgrade":
      return {
        amount: 0,
        label: "No deductible",
        basis: "An upgrade runs through Next Up Anytime rather than a claim",
        tier,
      };
    case "replacement":
    default:
      return {
        amount: REPLACEMENT_DEDUCTIBLE[tier],
        label: `$${REPLACEMENT_DEDUCTIBLE[tier]}`,
        basis: `Tier ${tier} device — the replacement deductible set by your device's make and model`,
        tier,
      };
  }
}

/** Deductibles a member should be able to see before anything breaks. */
export function deductibleSummary(device: TieredDevice) {
  const tier = deviceTier(device);
  return {
    tier,
    screenRepair: SCREEN_REPAIR_FEE,
    replacement: REPLACEMENT_DEDUCTIBLE[tier],
    battery: BATTERY_FEE,
  };
}
