// How AT&T actually decides who can enrol in Protect Advantage.
//
// There are only two doors in, and they behave differently:
//
//   1. NEW DEVICE — within 30 days of buying, upgrading or activating a device.
//      This door is always open, but only for that one device, and only briefly.
//
//   2. OPEN ENROLMENT — a limited promotional window AT&T runs once or twice a
//      year, usually late winter or mid-to-late summer. While it's open, device
//      age stops mattering entirely: a phone you've had for three years can be
//      enrolled. The current window runs through 31 Aug 2026.
//
// Both doors share one hard gate: the device must be in GOOD WORKING CONDITION.
// You cannot insure something that is already broken, and AT&T reserves the right
// to inspect before approving. That gate is what the remote diagnostics run is
// for — it's the inspection, done from the customer's own phone.
//
// Switching tiers is a third, separate thing. It is NOT an enrolment: an existing
// member can move between tiers any time, no window required, and devices already
// covered stay covered no matter how old they are. Only devices being ADDED to a
// bigger tier have to pass the enrolment test.

export type DeviceCondition = "good" | "damaged" | "unverified";

/** The promotional window. Change these two dates and the whole app follows. */
export const OPEN_ENROLLMENT = {
  active: true,
  opensOn: "2026-07-14",
  endsOn: "2026-08-31",
  label: "Open Enrollment",
} as const;

/** Days after purchase/activation during which any new device can be enrolled. */
export const NEW_DEVICE_WINDOW_DAYS = 30;

const MS_DAY = 86_400_000;

/** "Sep 19, 2025" → Date. Returns null on anything unparseable. */
export function parseDeviceDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysOwned(purchased: string, now = new Date()): number | null {
  const d = parseDeviceDate(purchased);
  if (!d) return null;
  return Math.floor((now.getTime() - d.getTime()) / MS_DAY);
}

export function openEnrollmentDaysLeft(now = new Date()): number {
  const end = new Date(`${OPEN_ENROLLMENT.endsOn}T23:59:59`);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / MS_DAY));
}

export function isOpenEnrollmentActive(now = new Date()): boolean {
  if (!OPEN_ENROLLMENT.active) return false;
  const start = new Date(`${OPEN_ENROLLMENT.opensOn}T00:00:00`);
  const end = new Date(`${OPEN_ENROLLMENT.endsOn}T23:59:59`);
  return now >= start && now <= end;
}

/** Which door a device is coming through, if any. */
export type EnrolmentRoute = "new-device" | "open-enrollment" | "already-covered" | "none";

export type EnrolmentVerdict = {
  eligible: boolean;
  route: EnrolmentRoute;
  /** One line the customer sees on the device row. */
  headline: string;
  /** The reasoning underneath it. */
  detail: string;
  /** True when the only thing standing in the way is an unverified condition. */
  needsInspection: boolean;
  daysOwned: number | null;
  daysLeftInWindow: number | null;
};

export type EnrolmentInput = {
  purchased: string;
  protectedAlready: boolean;
  condition: DeviceCondition;
  /** Set when a diagnostics run has confirmed the device is sound. */
  conditionVerified?: boolean;
};

export function assessEnrolment(d: EnrolmentInput, now = new Date()): EnrolmentVerdict {
  const owned = daysOwned(d.purchased, now);
  const openNow = isOpenEnrollmentActive(now);
  const windowLeft = openNow ? openEnrollmentDaysLeft(now) : null;

  if (d.protectedAlready) {
    return {
      eligible: false,
      route: "already-covered",
      headline: "Already covered",
      detail: "This device is on your plan. Coverage continues as long as the plan is active.",
      needsInspection: false,
      daysOwned: owned,
      daysLeftInWindow: windowLeft,
    };
  }

  // Pre-existing damage closes both doors. This is the rule people are most
  // surprised by, so say it plainly rather than just refusing.
  if (d.condition === "damaged") {
    return {
      eligible: false,
      route: "none",
      headline: "Not eligible — existing damage",
      detail:
        "Protect Advantage can't be added to a device that's already damaged. Get it repaired first, then enrol while a window is open.",
      needsInspection: false,
      daysOwned: owned,
      daysLeftInWindow: windowLeft,
    };
  }

  const withinNewWindow = owned !== null && owned <= NEW_DEVICE_WINDOW_DAYS;
  const needsInspection = d.condition === "unverified" && !d.conditionVerified;

  if (withinNewWindow) {
    const left = NEW_DEVICE_WINDOW_DAYS - (owned ?? 0);
    return {
      eligible: true,
      route: "new-device",
      headline: `Eligible — ${left} day${left === 1 ? "" : "s"} left on the new-device window`,
      detail: `Bought ${owned} day${owned === 1 ? "" : "s"} ago. Any device can be enrolled within ${NEW_DEVICE_WINDOW_DAYS} days of purchase, upgrade or activation.`,
      needsInspection,
      daysOwned: owned,
      daysLeftInWindow: left,
    };
  }

  if (openNow) {
    return {
      eligible: true,
      route: "open-enrollment",
      headline: `Eligible under ${OPEN_ENROLLMENT.label}`,
      detail:
        owned !== null
          ? `You've had this device ${formatOwned(owned)}, which is normally past the ${NEW_DEVICE_WINDOW_DAYS}-day window — but ${OPEN_ENROLLMENT.label} removes the age limit until ${formatDate(OPEN_ENROLLMENT.endsOn)}.`
          : `${OPEN_ENROLLMENT.label} removes the age limit until ${formatDate(OPEN_ENROLLMENT.endsOn)}.`,
      needsInspection,
      daysOwned: owned,
      daysLeftInWindow: windowLeft,
    };
  }

  return {
    eligible: false,
    route: "none",
    headline: "Not eligible right now",
    detail: `You've had this device ${owned !== null ? formatOwned(owned) : "a while"}, past the ${NEW_DEVICE_WINDOW_DAYS}-day window, and ${OPEN_ENROLLMENT.label} isn't running. AT&T opens one once or twice a year — we'll flag it when the next one starts.`,
    needsInspection: false,
    daysOwned: owned,
    daysLeftInWindow: null,
  };
}

/**
 * Switching tiers. Not an enrolment — an existing member can move any time and
 * their covered devices keep coverage regardless of age. Only devices being
 * newly ADDED have to clear the enrolment test.
 */
export type SwitchVerdict = {
  allowed: boolean;
  keepsCoverage: string[];
  /** Devices that would be dropped because the target tier holds fewer seats. */
  wouldDrop: string[];
  /** Devices that could be added because the target tier has room. */
  couldAdd: Array<{ name: string; verdict: EnrolmentVerdict }>;
  note: string;
};

export function assessSwitch(args: {
  currentlyCovered: Array<{ id: string; name: string }>;
  uncovered: Array<{ id: string; name: string; purchased: string; condition: DeviceCondition }>;
  targetCapacity: number;
  keepIds: string[];
  now?: Date;
}): SwitchVerdict {
  const now = args.now ?? new Date();
  const keep = args.currentlyCovered.filter((d) => args.keepIds.includes(d.id));
  const dropped = args.currentlyCovered.filter((d) => !args.keepIds.includes(d.id));
  const room = Math.max(0, args.targetCapacity - keep.length);

  const couldAdd = args.uncovered.slice(0, room).map((d) => ({
    name: d.name,
    verdict: assessEnrolment(
      { purchased: d.purchased, protectedAlready: false, condition: d.condition },
      now,
    ),
  }));

  return {
    allowed: keep.length <= args.targetCapacity,
    keepsCoverage: keep.map((d) => d.name),
    wouldDrop: dropped.map((d) => d.name),
    couldAdd,
    note:
      dropped.length > 0
        ? `${dropped.length} device${dropped.length === 1 ? "" : "s"} would lose coverage immediately.`
        : room > 0
          ? `${room} free seat${room === 1 ? "" : "s"} on this tier — you can add devices that pass the eligibility check.`
          : "Every covered device carries over. Your change takes effect on your next bill.",
  };
}

function formatOwned(days: number): string {
  if (days < 60) return `${days} days`;
  const months = Math.round(days / 30);
  if (months < 24) return `${months} months`;
  return `${(days / 365).toFixed(1)} years`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
