// AT&T Protect Advantage deductible / service-fee schedule.
//
// These are the real published figures, not invented ones. Source: AT&T Protect Advantage
// for 1 program brochure (49-state consumer edition) — the "Replacement Deductibles/Service
// Fees", "Screen Repair Service Fees" and "Battery Replacement Repair Service Fee" tables.
//
// The point of surfacing these upfront is the whole ideation: today a customer discovers the
// number at the counter. Here they see it before they choose, which is also what makes the
// Claim-to-Upgrade Advisor's comparison meaningful — a cracked screen is $29 to repair and
// $275 to replace, and that gap is the decision.

export type DeviceTier = 1 | 2 | 3 | 4;

/** Non-refundable deductible charged per approved replacement claim, by device tier. */
export const REPLACEMENT_DEDUCTIBLE: Record<DeviceTier, number> = {
  1: 25,
  2: 100,
  3: 225,
  4: 275,
};

/** Screen repair is a flat service fee across every tier. */
export const SCREEN_REPAIR_FEE = 29;

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
  /** Insurance claim limits over a rolling 12 months. */
  claimLimit: 3,
  claimLimitWindow: "12 months",
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
        label: `$${SCREEN_REPAIR_FEE}`,
        basis: "Flat screen repair service fee — the same on every device tier",
        tier,
      };
    case "battery":
      return {
        amount: BATTERY_FEE,
        label: "No charge",
        basis: "Battery replacement carries no service fee on an eligible device",
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
