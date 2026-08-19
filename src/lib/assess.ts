// Bridge between the claim flow and the Damage Assessment Agent.
//
// The browser calls `analyzeDamage({ data })`; the handler runs on the server, where the
// API key lives. If the model is unconfigured or the call fails, we return the
// deterministic assessment instead and say so — the claim flow must always resolve.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assessDamage, type DamageResult } from "@/lib/ai";
import type { MemberDevice } from "@/data/member";

/** Roughly 10 MB of base64 is the Fireworks ceiling for a single request. Stay under it. */
const MAX_TOTAL_CHARS = 9_000_000;

const Input = z.object({
  images: z.array(z.string().startsWith("data:image/")).min(1).max(3),
  deviceName: z.string().min(1).max(80),
  /** Signals the simulation uses when it has to stand in. */
  screenRisk: z.enum(["Low", "Medium", "High"]),
  retail: z.number().int().positive().max(5000),
});

export type AssessSource = "model" | "simulation";
export type AssessResponse = DamageResult & {
  source: AssessSource;
  /** Present when we fell back, so the UI can be honest about why. */
  fallbackReason?: string;
  model?: string;
};

/** Shape a model verdict into the DamageResult the rest of the app already speaks. */
function toDamageResult(
  v: {
    is_phone: boolean;
    damage_found: boolean;
    severity: "None" | "Minor" | "Moderate" | "Severe";
    beyond_economical_repair: boolean;
    confidence: number;
    summary: string;
    detected: string[];
    screen_functional: boolean;
  },
  deviceName: string,
  retail: number,
): DamageResult {
  // A "None" verdict still has to render, so map it onto Minor with an honest summary.
  const severity = v.severity === "None" ? "Minor" : v.severity;
  const repairShare = v.beyond_economical_repair ? 0.55 : severity === "Moderate" ? 0.35 : 0.28;

  return {
    severity,
    beyondEconomicalRepair: v.beyond_economical_repair,
    confidence: v.confidence,
    summary: v.damage_found
      ? v.summary
      : `No damage was visible on your ${deviceName} in these photos. ${v.summary}`,
    detected: v.detected.length ? v.detected : ["No visible damage identified"],
    recommendation: v.beyond_economical_repair
      ? "This device is beyond economical repair. A replacement is the fastest path."
      : v.screen_functional
        ? "The screen can be repaired — no need to replace the device."
        : "The display is not responding correctly, so a swap is likely the better path.",
    retailRepairCost: Math.round(retail * repairShare),
  };
}

export const analyzeDamage = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof Input>) => Input.parse(d))
  .handler(async ({ data }): Promise<AssessResponse> => {
    // Imported lazily so the provider module never enters the client graph.
    const { assessPhotos, readVisionConfig, VisionError } = await import("@/lib/vision.server");

    const stand_in = (reason: string): AssessResponse => ({
      ...assessDamage(
        { name: data.deviceName, screenRisk: data.screenRisk, retail: data.retail } as MemberDevice,
        data.images.length,
      ),
      source: "simulation",
      fallbackReason: reason,
    });

    const cfg = readVisionConfig();
    if (!cfg) return stand_in("No vision model configured");

    const total = data.images.reduce((n, s) => n + s.length, 0);
    if (total > MAX_TOTAL_CHARS) return stand_in("Photos too large to send");

    try {
      // 25s ceiling — past that the demo has stalled and the stand-in is better.
      const verdict = await assessPhotos(data.images, data.deviceName, AbortSignal.timeout(25_000));

      if (!verdict.is_phone) {
        return {
          ...stand_in("Those photos don't appear to show a phone"),
          source: "simulation",
        };
      }

      return {
        ...toDamageResult(verdict, data.deviceName, data.retail),
        source: "model",
        model: cfg.model,
      };
    } catch (err) {
      const reason =
        err instanceof VisionError
          ? err.message
          : err instanceof Error && err.name === "TimeoutError"
            ? "The model took too long to respond"
            : "Could not reach the vision model";
      console.error("[assess] falling back:", err);
      return stand_in(reason);
    }
  });
