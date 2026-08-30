// Mock account data for the AT&T Protect Advantage prototype (no real account system).
// Two demo accounts: one enrolled, one not yet enrolled with eligible devices.
// Device images reuse the real AT&T CDN assets already in /public/att.
//
// The three mechanism types below are imported type-only. That keeps the cycle
// (member → manifest → member) erased at compile time rather than real at runtime.
import type { LineManifest } from "@/lib/manifest";
import type { DecisionTrace } from "@/lib/ledger";
import type { ConditionAttestation } from "@/lib/attestation";

export type TierId = "basic" | "plus" | "family";
export type WarrantyStatus = "In warranty" | "Out of warranty";

/** Per-device vault contribution, in GB, split by content type. */
export type VaultBreakdown = {
  photos: number;
  videos: number;
  messages: number;
  apps: number;
  contacts: number;
};

export type MemberDevice = {
  id: string;
  owner: string;
  relation: string; // "You" | "Spouse" | "Child"
  brand: string;
  name: string;
  color: string;
  storage: string;
  image: string;
  line: string; // phone number
  imei: string;
  purchased: string;
  warranty: WarrantyStatus;
  protected: boolean; // enrolled in Protect Advantage
  tier?: TierId;
  nextUp: boolean; // enrolled in Next Up Anytime (upgrade program)
  installmentsLeft?: number;
  batteryHealth: number;
  screenRisk: "Low" | "Medium" | "High";
  backedUp: boolean;
  lastBackup: string;
  eligible: boolean; // eligible to enroll if not protected
  // ── added for the agent layer ──────────────────────────────────────────────
  screenGuard: boolean; // has a screen protector fitted (Proactive Care)
  tradeIn: number; // guaranteed trade-in value, USD (locked by membership)
  retail: number; // device retail price, USD — drives ROI + repair quotes
  autoBackup: boolean; // vault auto-backup switch
  vault: VaultBreakdown; // this device's footprint in the shared vault
  replacedOn?: string; // set when a swap/replacement is fulfilled
};

export type Claim = {
  id: string;
  date: string;
  device: string;
  deviceId?: string;
  reason: "Accidental damage" | "Loss" | "Theft" | "Malfunction" | "Battery";
  resolution: string;
  status: "Resolved" | "In progress" | "Booked";
  detail?: string; // store + slot, or shipping note
};

export type Redemption = {
  id: string;
  accessoryId: string;
  accessoryName: string;
  image?: string;
  deviceName: string;
  method: "Ship to me" | "Pick up in store";
  date: string;
  status: "Ordered" | "Ready for pickup" | "Delivered";
};

/** "New, not refurbished" certificate, issued when a replacement is fulfilled. */
export type Guarantee = {
  id: string;
  deviceId: string;
  deviceName: string;
  issued: string;
  serial: string;
  condition: "Factory new — sealed";
};

export type RestoreRecord = {
  id: string;
  date: string;
  fromDevice: string;
  toDevice: string;
  gb: number;
  items: number;
};

export type Member = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  accountNumber: string;
  memberSince: string;
  enrolled: boolean; // has Protect Advantage at all
  tier?: TierId;
  tierPrice?: number;
  balance: string;
  protectionScore: number;
  devices: MemberDevice[];
  vault: {
    totalGB: number;
    lastBackup: string;
    junkGB: number; // reclaimable duplicates + junk, found by the cleaner
    duplicates: number;
    autoBackup: boolean;
  };
  perks: {
    accessoryCredits: number; // free accessories left this year
    accessoryTotal: number; // allowance for the tier
    resetsOn: string;
    redemptions: Redemption[];
  };
  claims: Claim[];
  guarantees: Guarantee[];
  restores: RestoreRecord[];
  parental: Record<string, boolean>; // deviceId → parental controls on
  dismissedNudges: string[]; // Proactive Care nudges the member cleared

  // ── The patentable mechanisms ─────────────────────────────────────────────
  /**
   * Mechanism 2 — one manifest per subscriber line, rebuilt by `reconcile()` on every
   * mutation. Optional because a record persisted before this existed must still load.
   */
  manifests?: LineManifest[];
  /** Mechanism 3 — hashed, replayable traces of every automated decision. */
  ledger?: DecisionTrace[];
  /** Mechanism 5 — signed device-condition attestations, keyed by device id. */
  attestations?: Record<string, ConditionAttestation>;
};

const IMG = {
  proMax: "/att/devices/apple-iphone-17-pro-max/cosmic-orange-hero.webp",
  s26ultra: "/att/devices/samsung-galaxy-s26-ultra/black-hero.png",
  iphone16: "/att/devices/apple-iphone-16/black-hero.webp",
  pixel10pro: "/att/devices/google-pixel-10-pro/obsidian-hero.webp",
  iphone17e: "/att/devices/apple-iphone-17e/soft-pink-hero.png",
  iphone17: "/att/devices/apple-iphone-17/black-hero.webp",
  fold7: "/att/devices/samsung-galaxy-z-fold7/jetblack-hero.webp",
};

/** Sum a device's vault breakdown. */
export const deviceVaultGB = (d: MemberDevice) =>
  d.vault.photos + d.vault.videos + d.vault.messages + d.vault.apps + d.vault.contacts;

/**
 * Vault usage — only devices that are BOTH covered and backed up occupy the plan's
 * allowance. Drop a device from the plan and its backup stops counting against you,
 * which is why the usage figure and the device list below it always agree.
 */
export const vaultUsedGB = (m: Member) =>
  m.devices.filter((d) => d.backedUp && d.protected).reduce((n, d) => n + deviceVaultGB(d), 0);

/** Vault capacity that reads the way AT&T writes it: "50 GB", "500 GB", "1 TB". */
export function formatCapacity(gb: number): string {
  if (gb <= 0) return "—";
  if (gb >= 1024) {
    const tb = gb / 1024;
    return `${Number.isInteger(tb) ? tb : tb.toFixed(1)} TB`;
  }
  return `${Math.round(gb)} GB`;
}

/** Vault size that comes with each tier — the ceiling, not the starting point. */
export const TIER_VAULT_GB: Record<TierId, number> = { basic: 50, plus: 500, family: 1024 };

/**
 * On Family the vault grows with the household: each covered device brings its own
 * allocation, up to the tier ceiling. A family of three isn't paying for a terabyte
 * they don't use, and adding a fourth device visibly adds room.
 */
export const VAULT_PER_DEVICE_GB: Record<TierId, number> = { basic: 50, plus: 500, family: 205 };

export function vaultCapacityGB(m: Pick<Member, "tier" | "devices">): number {
  if (!m.tier) return 0;
  const covered = m.devices.filter((d) => d.protected).length;
  const perDevice = VAULT_PER_DEVICE_GB[m.tier];
  return Math.min(TIER_VAULT_GB[m.tier], Math.max(perDevice, perDevice * covered));
}

/** What one more covered device would add, for the "add a device" nudge. */
export const vaultGrowthPerDevice = (tier?: TierId) => (tier ? VAULT_PER_DEVICE_GB[tier] : 0);
/** How many devices each tier can pool. */
export const TIER_POOL: Record<TierId, number> = { basic: 1, plus: 1, family: 5 };
/** Free annual accessory credits per tier. */
export const TIER_CREDITS: Record<TierId, number> = { basic: 0, plus: 1, family: 2 };
export const TIER_PRICE: Record<TierId, number> = { basic: 15, plus: 25, family: 40 };

// ── Account 1 — ENROLLED (Protect Advantage Family) ───────────────────────────
export const MEMBER_ENROLLED: Member = {
  id: "m1",
  userId: "alex.rivera",
  firstName: "Alex",
  lastName: "Rivera",
  email: "alex.rivera@example.com",
  accountNumber: "534281355025",
  memberSince: "2023",
  enrolled: true,
  tier: "family",
  tierPrice: 40,
  balance: "$0.00",
  protectionScore: 82,
  devices: [
    {
      id: "d1",
      owner: "Alex Rivera",
      relation: "You",
      brand: "Apple",
      name: "iPhone 17 Pro Max",
      color: "Cosmic Orange",
      storage: "256GB",
      image: IMG.proMax,
      line: "469.428.1494",
      imei: "35 682910 445217 3",
      purchased: "Sep 19, 2025",
      warranty: "In warranty",
      protected: true,
      tier: "family",
      nextUp: true,
      installmentsLeft: 22,
      batteryHealth: 91,
      screenRisk: "Medium",
      backedUp: true,
      lastBackup: "Today, 6:12 AM",
      eligible: false,
      screenGuard: false,
      tradeIn: 640,
      retail: 1199,
      autoBackup: true,
      vault: { photos: 38, videos: 41, messages: 6, apps: 12, contacts: 1 },
    },

    {
      id: "d2",
      owner: "Sam Rivera",
      relation: "Spouse",
      brand: "Samsung",
      name: "Galaxy S26 Ultra",
      color: "Black",
      storage: "512GB",
      image: IMG.s26ultra,
      line: "469.428.7781",
      imei: "35 118820 662104 9",
      purchased: "Feb 2, 2026",
      warranty: "In warranty",
      protected: true,
      tier: "family",
      nextUp: false,
      installmentsLeft: 30,
      batteryHealth: 96,
      screenRisk: "Low",
      backedUp: true,
      lastBackup: "Today, 5:40 AM",
      eligible: false,
      screenGuard: true,
      tradeIn: 590,
      retail: 1299,
      autoBackup: true,
      vault: { photos: 29, videos: 22, messages: 4, apps: 9, contacts: 1 },
    },

    // Mia's iPhone 16: high screen risk AND on Next Up — this is the device the
    // Claim-to-Upgrade Advisor is designed for (beyond repair + upgrade eligible).
    {
      id: "d3",
      owner: "Mia Rivera",
      relation: "Child",
      brand: "Apple",
      name: "iPhone 16",
      color: "Black",
      storage: "128GB",
      image: IMG.iphone16,
      line: "469.428.3120",
      imei: "35 902711 338845 2",
      purchased: "Oct 4, 2024",
      warranty: "Out of warranty",
      protected: true,
      tier: "family",
      nextUp: true,
      installmentsLeft: 6,
      batteryHealth: 88,
      screenRisk: "High",
      backedUp: false,
      lastBackup: "3 days ago",
      eligible: false,
      screenGuard: false,
      tradeIn: 310,
      retail: 829,
      autoBackup: false,
      vault: { photos: 18, videos: 9, messages: 3, apps: 7, contacts: 1 },
    },

    {
      id: "d4",
      owner: "Leo Rivera",
      relation: "Child",
      brand: "Google",
      name: "Pixel 10 Pro",
      color: "Obsidian",
      storage: "128GB",
      image: IMG.pixel10pro,
      line: "469.428.9032",
      imei: "35 447120 771903 6",
      purchased: "Aug 21, 2025",
      warranty: "In warranty",
      protected: true,
      tier: "family",
      nextUp: false,
      installmentsLeft: 19,
      batteryHealth: 93,
      screenRisk: "Low",
      backedUp: true,
      lastBackup: "Yesterday, 9:20 PM",
      eligible: false,
      screenGuard: true,
      tradeIn: 420,
      retail: 999,
      autoBackup: true,
      vault: { photos: 11, videos: 6, messages: 2, apps: 5, contacts: 1 },
    },

    {
      id: "d5",
      owner: "Alex Rivera",
      relation: "You",
      brand: "Apple",
      name: "iPhone 17e",
      color: "Soft Pink",
      storage: "128GB",
      image: IMG.iphone17e,
      line: "469.428.5567",
      imei: "35 220914 553387 1",
      purchased: "Jan 12, 2026",
      warranty: "In warranty",
      protected: true,
      tier: "family",
      nextUp: false,
      installmentsLeft: 28,
      batteryHealth: 99,
      screenRisk: "Low",
      backedUp: true,
      lastBackup: "Today, 6:12 AM",
      eligible: false,
      screenGuard: false,
      tradeIn: 280,
      retail: 699,
      autoBackup: true,
      vault: { photos: 7, videos: 3, messages: 1, apps: 4, contacts: 1 },
    },
  ],
  vault: {
    totalGB: 1024,
    lastBackup: "Today, 6:12 AM",
    junkGB: 12.4,
    duplicates: 1204,
    autoBackup: true,
  },
  perks: {
    accessoryCredits: 2,
    accessoryTotal: 2,
    resetsOn: "Jan 1, 2027",
    redemptions: [],
  },
  claims: [
    {
      id: "c1024",
      date: "Mar 2, 2026",
      device: "iPhone 16 (Mia)",
      deviceId: "d3",
      reason: "Accidental damage",
      resolution: "Home screen repair",
      status: "Resolved",
      detail: "Technician visit · 32 min on site",
    },
    {
      id: "c0987",
      date: "Nov 18, 2025",
      device: "Galaxy S26 Ultra (Sam)",
      deviceId: "d2",
      reason: "Battery",
      resolution: "Store battery replacement",
      status: "Resolved",
      detail: "AT&T Winter Park · 41 min",
    },
  ],
  guarantees: [],
  restores: [],
  parental: { d3: true, d4: true },
  dismissedNudges: [],
};

// ── Account 2 — NOT ENROLLED (has eligible devices) ───────────────────────────
export const MEMBER_UNENROLLED: Member = {
  id: "m2",
  userId: "jordan.kim",
  firstName: "Jordan",
  lastName: "Kim",
  email: "jordan.kim@example.com",
  accountNumber: "156377548",
  memberSince: "2021",
  enrolled: false,
  balance: "$180.71",
  protectionScore: 34,
  devices: [
    {
      id: "j1",
      owner: "Jordan Kim",
      relation: "You",
      brand: "Apple",
      name: "iPhone 17",
      color: "Black",
      storage: "256GB",
      image: IMG.iphone17,
      line: "214.555.0182",
      imei: "35 771204 889231 4",
      purchased: "Feb 28, 2026",
      warranty: "In warranty",
      protected: false,
      nextUp: false,
      installmentsLeft: 33,
      batteryHealth: 100,
      screenRisk: "Low",
      backedUp: false,
      lastBackup: "Never",
      eligible: true,
      screenGuard: false,
      tradeIn: 520,
      retail: 929,
      autoBackup: false,
      vault: { photos: 22, videos: 17, messages: 3, apps: 8, contacts: 1 },
    },

    {
      id: "j2",
      owner: "Priya Kim",
      relation: "Spouse",
      brand: "Samsung",
      name: "Galaxy Z Fold7",
      color: "Jetblack",
      storage: "512GB",
      image: IMG.fold7,
      line: "214.555.0447",
      imei: "35 660418 220774 8",
      purchased: "Dec 6, 2025",
      warranty: "In warranty",
      protected: false,
      nextUp: false,
      installmentsLeft: 29,
      batteryHealth: 97,
      screenRisk: "Medium",
      backedUp: false,
      lastBackup: "Never",
      eligible: true,
      screenGuard: false,
      tradeIn: 780,
      retail: 1899,
      autoBackup: false,
      vault: { photos: 31, videos: 26, messages: 5, apps: 11, contacts: 1 },
    },

    {
      id: "j3",
      owner: "Noah Kim",
      relation: "Child",
      brand: "Apple",
      name: "iPhone 16",
      color: "Black",
      storage: "128GB",
      image: IMG.iphone16,
      line: "214.555.0913",
      imei: "35 330927 114562 0",
      purchased: "Jul 15, 2024",
      warranty: "Out of warranty",
      protected: false,
      nextUp: false,
      installmentsLeft: 2,
      batteryHealth: 81,
      screenRisk: "High",
      backedUp: false,
      lastBackup: "Never",
      eligible: true,
      screenGuard: false,
      tradeIn: 290,
      retail: 829,
      autoBackup: false,
      vault: { photos: 14, videos: 8, messages: 2, apps: 6, contacts: 1 },
    },
  ],
  vault: { totalGB: 0, lastBackup: "Not set up", junkGB: 0, duplicates: 0, autoBackup: false },
  perks: {
    accessoryCredits: 0,
    accessoryTotal: 0,
    resetsOn: "—",
    redemptions: [],
  },
  claims: [],
  guarantees: [],
  restores: [],
  parental: {},
  dismissedNudges: [],
};

export const ACCOUNTS: Member[] = [MEMBER_ENROLLED, MEMBER_UNENROLLED];
export const getAccount = (userId: string) => ACCOUNTS.find((a) => a.userId === userId);
