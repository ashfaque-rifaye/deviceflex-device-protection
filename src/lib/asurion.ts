// Asurion handoff.
//
// AT&T sells Protect Advantage; Asurion Protection Services administers it. Fulfilment, the
// replacement device, the deductible charge and the stolen-device blocklist all belong to
// them — AT&T's job is to gather a clean, complete claim and hand it over. Every path in the
// claim flow ends here, which is why the payload is built in one place: whatever a customer
// files, Asurion receives the same shape.
//
// The transport is simulated. Swap `submitClaim` for a real POST to their intake API and
// nothing upstream changes.
import type { Member, MemberDevice } from "@/data/member";
import type { ClaimReasonId } from "@/data/deviceflex";
import { ASURION, deductibleFor, deviceTier, type FeeKind } from "@/data/deductibles";

export type IncidentDetails = {
  /** ISO date, YYYY-MM-DD. */
  date?: string;
  /** Approximate local time, HH:MM. */
  time?: string;
  /** Free text — where it happened, what the member remembers. */
  circumstances?: string;
  policeReport?: string;
};

export type AsurionClaimPayload = {
  carrier: "AT&T";
  program: "AT&T Protect Advantage";
  administrator: string;
  underwriter: string;
  submittedAt: string;
  subscriber: {
    accountNumber: string;
    name: string;
    email: string;
    memberSince: string;
  };
  device: {
    make: string;
    model: string;
    imei: string;
    line: string;
    colour: string;
    storage: string;
    purchased: string;
    warranty: string;
    tier: number;
  };
  incident: {
    type: ClaimReasonId;
    reportedAt: string;
    occurredOn?: string;
    occurredAt?: string;
    circumstances?: string;
    policeReport?: string;
    withinFilingWindow: boolean;
  };
  assessment: {
    source: "vision-model" | "diagnostics" | "attested";
    severity?: string;
    beyondEconomicalRepair?: boolean;
    findings?: string[];
    confidence?: number;
  };
  resolution: {
    path: string;
    feeKind: FeeKind;
    deductible: number;
    fulfilment: string;
  };
  verification: {
    identityVerified: boolean;
    lineSuspended: boolean;
    signals: Array<{ label: string; outcome: string }>;
  };
};

/** Days between the incident and today — drives the 60-day filing window check. */
export function daysSince(isoDate?: string): number | null {
  if (!isoDate) return null;
  const then = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(then.getTime())) return null;
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

export function withinFilingWindow(isoDate?: string): boolean {
  const d = daysSince(isoDate);
  if (d === null) return true; // no date given — nothing to fail on yet
  return d >= 0 && d <= ASURION.filingWindowDays;
}

export function buildClaimPayload(args: {
  member: Member;
  device: MemberDevice;
  reason: ClaimReasonId;
  incident: IncidentDetails;
  feeKind: FeeKind;
  resolutionTitle: string;
  fulfilment: string;
  assessment: AsurionClaimPayload["assessment"];
  identityVerified: boolean;
  lineSuspended: boolean;
  signals: Array<{ label: string; outcome: string }>;
}): AsurionClaimPayload {
  const { member, device, reason, incident } = args;
  return {
    carrier: "AT&T",
    program: "AT&T Protect Advantage",
    administrator: ASURION.administrator,
    underwriter: ASURION.underwriter,
    submittedAt: new Date().toISOString(),
    subscriber: {
      accountNumber: member.accountNumber,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      memberSince: member.memberSince,
    },
    device: {
      make: device.brand,
      model: device.name,
      imei: device.imei,
      line: device.line,
      colour: device.color,
      storage: device.storage,
      purchased: device.purchased,
      warranty: device.warranty,
      tier: deviceTier(device),
    },
    incident: {
      type: reason,
      reportedAt: new Date().toISOString(),
      occurredOn: incident.date,
      occurredAt: incident.time,
      circumstances: incident.circumstances,
      policeReport: incident.policeReport,
      withinFilingWindow: withinFilingWindow(incident.date),
    },
    assessment: args.assessment,
    resolution: {
      path: args.resolutionTitle,
      feeKind: args.feeKind,
      deductible: deductibleFor(device, args.feeKind).amount,
      fulfilment: args.fulfilment,
    },
    verification: {
      identityVerified: args.identityVerified,
      lineSuspended: args.lineSuspended,
      signals: args.signals,
    },
  };
}

export type AsurionAck = {
  /** Asurion's own claim reference, which is what the member quotes on the phone. */
  reference: string;
  receivedAt: string;
  status: "Approved" | "In review";
  deductible: number;
  billedTo: string;
};

/**
 * Hand the claim to Asurion. Simulated: derives a stable-looking reference and echoes what
 * they would confirm back. Replace the body with a POST to their intake endpoint.
 */
export function submitClaim(payload: AsurionClaimPayload): AsurionAck {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const initials = payload.subscriber.name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return {
    reference: `ASU-${initials}${stamp}`,
    receivedAt: new Date().toISOString(),
    // Anything the fraud pass flagged goes to a human at Asurion rather than straight through.
    status: payload.verification.signals.some((s) => /review/i.test(s.outcome))
      ? "In review"
      : "Approved",
    deductible: payload.resolution.deductible,
    billedTo: "Your next AT&T wireless bill",
  };
}

export { ASURION };
