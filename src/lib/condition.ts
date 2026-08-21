// Is this device in "good working condition"?
//
// It's the gate on every enrolment path AT&T offers, and the one rule people are
// most often caught out by — you cannot insure something that is already broken.
// Everywhere else in the app this is inferred from the signals we hold; the
// diagnostics run is what turns an inference into a verified answer.
import type { MemberDevice } from "@/data/member";
import type { DeviceCondition } from "@/data/eligibility";

/**
 * Our best read without running an inspection.
 *  · High screen risk means visible impact damage — that's a hard no.
 *  · A battery under 80% is a fault, but a covered one, so it reads as unverified
 *    rather than damaged: run diagnostics and let the report decide.
 */
export function deviceCondition(d: MemberDevice): DeviceCondition {
  if (d.screenRisk === "High") return "damaged";
  if (d.batteryHealth < 80) return "unverified";
  if (d.screenRisk === "Medium") return "unverified";
  return "good";
}

export const conditionLabel: Record<DeviceCondition, string> = {
  good: "Good working condition",
  damaged: "Existing damage",
  unverified: "Condition not yet verified",
};
