// MECHANISM 1 — carrier-side device-presence telemetry.
//
// This is the file that only AT&T could populate. Apple and Asurion administer device
// protection without running a network: when a customer says "my phone was stolen at 6:40",
// they can believe it or demand an affidavit, and that gap is where most claim fraud lives.
//
// AT&T already knows, for every line on the account:
//   · when the device last reached a tower, and which one
//   · whether it went dark abruptly or wound down normally
//   · whether the SIM is still active, or turned up in a different handset
//   · whether the IMEI has been seen since
//
// Feeding those four facts into the claim flow turns "do we believe this customer?" into a
// measurement. The verdict function lives in src/lib/ai.ts (`corroborateClaim`); this file
// is only the data.
//
// ── Seeded as offsets, not timestamps ────────────────────────────────────────
// Everything below is expressed relative to *now* rather than as fixed dates, so the demo
// reads correctly whenever it is run. A hardcoded "last seen 2026-08-30T18:42" is stale the
// next morning and quietly makes the corroboration nonsense.
//
// ── One device deliberately contradicts ──────────────────────────────────────
// `d5` shows network activity that continues past any plausible incident time. A verifier
// that always agrees verifies nothing, and it is the flagged path — not the happy path —
// that shows the mechanism is real. Pick the iPhone 17e in the demo to show the catch.

export type DisconnectPattern =
  /** Signal stopped mid-session, no shutdown sequence — consistent with damage, loss or theft. */
  | "abrupt"
  /** Battery ran down or the handset was powered off cleanly. */
  | "graceful"
  /** Still on the network right now. */
  | "none";

export type SimStatus = "active" | "inactive" | "swapped-to-other-handset";
export type ImeiStatus = "on-network" | "silent" | "seen-with-other-sim";

export type NetworkTelemetry = {
  deviceId: string;
  /** Hours before now that the device last registered with a tower. */
  lastSeenHoursAgo: number;
  /** Cell site identifier, as it appears in carrier records. */
  cellSite: string;
  /** Where that site is, for the customer-facing line. */
  cellSiteArea: string;
  disconnectPattern: DisconnectPattern;
  simStatus: SimStatus;
  imeiStatus: ImeiStatus;
  /** Voice, data or SMS observed after `lastSeenHoursAgo`. Contradicts a loss report. */
  activitySinceLastSeen: boolean;
  /** Set when the SIM or IMEI resurfaced somewhere it shouldn't have. */
  anomaly?: string;
};

/** Orlando-area sites, matching the store network in src/data/stores.ts. */
export const NETWORK_TELEMETRY: NetworkTelemetry[] = [
  // ── Alex Rivera's household ──────────────────────────────────────────────
  {
    // The primary demo device. Dropped off mid-session a few hours ago and has not
    // been seen since — textbook corroboration of damage, loss or theft.
    deviceId: "d1",
    lastSeenHoursAgo: 5.3,
    cellSite: "ORL-1147",
    cellSiteArea: "Winter Park, FL",
    disconnectPattern: "abrupt",
    simStatus: "active",
    imeiStatus: "silent",
    activitySinceLastSeen: false,
  },
  {
    deviceId: "d2",
    lastSeenHoursAgo: 0.1,
    cellSite: "ORL-0938",
    cellSiteArea: "Maitland, FL",
    disconnectPattern: "none",
    simStatus: "active",
    imeiStatus: "on-network",
    activitySinceLastSeen: true,
  },
  {
    // Mia's iPhone 16 — the claim-to-upgrade device. Abrupt drop, still silent.
    deviceId: "d3",
    lastSeenHoursAgo: 2.6,
    cellSite: "ORL-1147",
    cellSiteArea: "Winter Park, FL",
    disconnectPattern: "abrupt",
    simStatus: "active",
    imeiStatus: "silent",
    activitySinceLastSeen: false,
  },
  {
    deviceId: "d4",
    lastSeenHoursAgo: 0.3,
    cellSite: "ORL-2210",
    cellSiteArea: "Altamonte Springs, FL",
    disconnectPattern: "none",
    simStatus: "active",
    imeiStatus: "on-network",
    activitySinceLastSeen: true,
  },
  {
    // THE CONTRADICTING CASE. Reported as lost, but the line kept passing data long
    // afterwards and the SIM has since appeared in a different handset. This is what an
    // insurer never sees today, and what the network makes obvious.
    deviceId: "d5",
    lastSeenHoursAgo: 0.4,
    cellSite: "ORL-3471",
    cellSiteArea: "Kissimmee, FL",
    disconnectPattern: "none",
    simStatus: "swapped-to-other-handset",
    imeiStatus: "seen-with-other-sim",
    activitySinceLastSeen: true,
    anomaly:
      "The SIM for this line has been active in a different handset since 11:20 this morning, and the original IMEI reappeared on the network with a second SIM.",
  },

  // ── Jordan Kim's household (not enrolled) ────────────────────────────────
  {
    deviceId: "j1",
    lastSeenHoursAgo: 0.2,
    cellSite: "ORL-0771",
    cellSiteArea: "Orlando, FL",
    disconnectPattern: "none",
    simStatus: "active",
    imeiStatus: "on-network",
    activitySinceLastSeen: true,
  },
  {
    deviceId: "j2",
    lastSeenHoursAgo: 1.1,
    cellSite: "ORL-0771",
    cellSiteArea: "Orlando, FL",
    disconnectPattern: "graceful",
    simStatus: "active",
    imeiStatus: "silent",
    activitySinceLastSeen: false,
  },
  {
    deviceId: "j3",
    lastSeenHoursAgo: 0.6,
    cellSite: "ORL-2210",
    cellSiteArea: "Altamonte Springs, FL",
    disconnectPattern: "none",
    simStatus: "active",
    imeiStatus: "on-network",
    activitySinceLastSeen: true,
  },
];

export const telemetryFor = (deviceId: string): NetworkTelemetry | undefined =>
  NETWORK_TELEMETRY.find((t) => t.deviceId === deviceId);

/** Resolve the seeded offset into a real instant. */
export function lastSeenAt(t: NetworkTelemetry, now = new Date()): Date {
  return new Date(now.getTime() - t.lastSeenHoursAgo * 3_600_000);
}

export const formatClock = (d: Date): string =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** "6:42 PM today" / "6:42 PM on Aug 28" — how a carrier record reads to a customer. */
export function formatLastSeen(d: Date, now = new Date()): string {
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `${formatClock(d)} today`;
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (d.toDateString() === yesterday.toDateString()) return `${formatClock(d)} yesterday`;
  return `${formatClock(d)} on ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
