// MECHANISM 5 — Device-Attested Underwriting Gate.
//
// The problem is adverse selection, and it is the oldest problem in insurance: people wait
// until the screen is already cracked, then buy the plan and file a claim. AT&T's terms
// already say a device must be in good working condition and reserve the right to inspect —
// but an inspection nobody performs is a sentence in a contract, not a control.
//
// So make the device prove its own condition. The diagnostics run that already exists
// (src/lib/diagnostics.ts, surfaced by DiagnosticsModal) produces a signed condition
// attestation: what was checked, what it measured, when, and a signature over the whole
// body. Enrolment is gated on a valid, recent one.
//
// Why this is a technical mechanism and not a policy: the gate does not read a rule and
// apply it, it verifies a cryptographic artefact produced by the endpoint being underwritten.
// On-device attestation aligns with device-identity standards work, which is one of AT&T's
// three patent anchors.
//
// Honest label: `signature` is a digest over canonical JSON, not a real signed credential.
// A browser prototype has no key material and no secure element, and faking that convincingly
// would be worse than stating the boundary. The structure is what is claimable; a deployment
// signs in the device's secure enclave and verifies against the manufacturer's root.
import { canonical, digest } from "@/lib/ledger";
import type { MemberDevice } from "@/data/member";

export type AttestedCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  value: string;
};

export type ConditionAttestation = {
  deviceId: string;
  imei: string;
  /** 0–100. The gate reads this, not the individual checks. */
  healthScore: number;
  checks: AttestedCheck[];
  /** ISO timestamp of the run. Freshness is part of validity. */
  issued: string;
  signature: string;
  /** What the attestation asserts, in one line. */
  statement: string;
};

/** An attestation older than this can't gate an enrolment — conditions change. */
export const ATTESTATION_VALID_DAYS = 30;
/** Below this the device is not in "good working condition" and enrolment is refused. */
export const ATTESTATION_PASS_SCORE = 60;

/** Produce a signed attestation from a completed diagnostics run. */
export function signAttestation(
  device: Pick<MemberDevice, "id" | "imei" | "name">,
  checks: AttestedCheck[],
): ConditionAttestation {
  const failed = checks.filter((c) => c.status === "fail").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - failed * 30 - warned * 8)));
  const issued = new Date().toISOString();
  const body = { deviceId: device.id, imei: device.imei, healthScore, checks, issued, v: 1 };
  return {
    deviceId: device.id,
    imei: device.imei,
    healthScore,
    checks,
    issued,
    signature: digest(canonical(body)),
    statement:
      failed > 0
        ? `${device.name} reports ${failed} hardware fault${failed === 1 ? "" : "s"} — it is not in good working condition.`
        : warned > 0
          ? `${device.name} passes inspection with ${warned} item${warned === 1 ? "" : "s"} to watch.`
          : `${device.name} passes every hardware check and is in good working condition.`,
  };
}

/**
 * Adapter from the existing diagnostics run to a signed attestation.
 *
 * Deliberately not a second inspection. The device already runs four passes over sensors,
 * battery, housing and identity; this signs that result rather than inventing a parallel
 * one, so what the member watched and what the underwriter reads are the same evidence.
 */
export function attestFromReport(
  device: Pick<MemberDevice, "id" | "imei" | "name">,
  report: {
    passes: Array<{
      checks: Array<{ id: string; label: string; result: string; status: AttestedCheck["status"] }>;
    }>;
  },
): ConditionAttestation {
  const checks: AttestedCheck[] = report.passes.flatMap((p) =>
    p.checks.map((c) => ({ id: c.id, label: c.label, status: c.status, value: c.result })),
  );
  return signAttestation(device, checks);
}

export type AttestationVerdict = {
  valid: boolean;
  /** Distinguishes "no attestation" from "device failed" — they need different UI. */
  reason: "ok" | "missing" | "expired" | "tampered" | "failed-inspection";
  headline: string;
  detail: string;
  ageDays: number | null;
};

/** The gate. Verify signature, freshness, and the score — in that order. */
export function verifyAttestation(
  att: ConditionAttestation | undefined,
  now = new Date(),
): AttestationVerdict {
  if (!att) {
    return {
      valid: false,
      reason: "missing",
      headline: "Device inspection required",
      detail:
        "Protect Advantage covers devices in good working condition. Run the diagnostics check and this device attests to its own condition — it takes about a minute.",
      ageDays: null,
    };
  }

  const expected = digest(
    canonical({
      deviceId: att.deviceId,
      imei: att.imei,
      healthScore: att.healthScore,
      checks: att.checks,
      issued: att.issued,
      v: 1,
    }),
  );
  if (expected !== att.signature) {
    return {
      valid: false,
      reason: "tampered",
      headline: "Attestation failed verification",
      detail:
        "The signature doesn't match the contents of this attestation, so it can't be trusted. Run the inspection again.",
      ageDays: null,
    };
  }

  const ageDays = Math.floor((now.getTime() - new Date(att.issued).getTime()) / 86_400_000);
  if (ageDays > ATTESTATION_VALID_DAYS) {
    return {
      valid: false,
      reason: "expired",
      headline: "Inspection is out of date",
      detail: `This attestation is ${ageDays} days old. A device's condition can change, so enrolment needs one from the last ${ATTESTATION_VALID_DAYS} days.`,
      ageDays,
    };
  }

  if (att.healthScore < ATTESTATION_PASS_SCORE) {
    return {
      valid: false,
      reason: "failed-inspection",
      headline: "This device can't be enrolled yet",
      detail: `${att.statement} Protect Advantage can't be added to a device that's already damaged — get it repaired, then enrol while a window is open.`,
      ageDays,
    };
  }

  return {
    valid: true,
    reason: "ok",
    headline: "Device condition verified",
    detail: `${att.statement} Signed by the device ${ageDays === 0 ? "today" : `${ageDays} day${ageDays === 1 ? "" : "s"} ago`} and verified against its own record.`,
    ageDays,
  };
}

/**
 * Days an attestation may be old when the household's posture demands a fresh look.
 * The standard window is ATTESTATION_VALID_DAYS; this is the stricter one.
 */
export const ATTESTATION_STRICT_DAYS = 7;

/**
 * ADDITION 2, closing the loop for real.
 *
 * `protectionPosture()` computes `requiresInspection`, and until now nothing read it —
 * enrolment demanded the same attestation whatever the score, so the control loop was a
 * readout rather than a control. This is the single place both enrolment paths ask
 * "is this device admissible?", and it takes the posture flag as an argument, so a
 * low-scoring household genuinely gets the stricter path.
 *
 * Kept as a pure function over (attestation, flag, now) so it can be replayed like any
 * other decision.
 */
export function admissibleForEnrolment(
  att: ConditionAttestation | undefined,
  requiresInspection: boolean,
  now = new Date(),
): AttestationVerdict & { admissible: boolean; window: number } {
  const verdict = verifyAttestation(att, now);
  const window = requiresInspection ? ATTESTATION_STRICT_DAYS : ATTESTATION_VALID_DAYS;
  const withinWindow = verdict.ageDays === null ? false : verdict.ageDays <= window;
  const admissible = verdict.valid && withinWindow;
  if (verdict.valid && !withinWindow) {
    return {
      ...verdict,
      admissible: false,
      window,
      reason: "expired",
      headline: "A fresher inspection is needed",
      detail: `This account's protection score puts it on the stricter path, so enrolment needs an attestation from the last ${window} days. This one is ${verdict.ageDays} days old.`,
    };
  }
  return { ...verdict, admissible, window };
}

/** Single-input wrapper so the enrolment gate can be recorded and replayed. */
export function attestationGateDecision(input: {
  attestation: ConditionAttestation | undefined;
  requiresInspection: boolean;
  now: string;
}) {
  return admissibleForEnrolment(input.attestation, input.requiresInspection, new Date(input.now));
}

/** Short signature form for the UI — enough to compare by eye, not the whole digest. */
export const shortSignature = (att: ConditionAttestation) =>
  `${att.signature.slice(0, 4)}…${att.signature.slice(-4)}`.toUpperCase();
