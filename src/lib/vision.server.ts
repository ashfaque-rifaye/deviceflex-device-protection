// Damage Assessment Agent — the real model call.
//
// Server-only. The API key is read from the environment here and never reaches the
// browser. Written against the OpenAI-compatible chat-completions shape, which is what
// both Fireworks and an AMD/vLLM cloud-native endpoint speak — so switching provider is
// three environment variables, not a rewrite.
//
//   AI_BASE_URL   e.g. https://api.fireworks.ai/inference/v1
//   AI_API_KEY    your key
//   AI_MODEL      a vision-capable model id
//
// If any of those are missing, or the call fails or comes back malformed, the caller
// falls back to the deterministic simulation in src/lib/ai.ts. A demo must never show
// a spinner that never resolves.
import { z } from "zod";

/** What the model is asked to return. Kept flat and small — VLMs are much more reliable
 *  at a short schema than a nested one. */
const ModelVerdict = z.object({
  is_phone: z.boolean(),
  damage_found: z.boolean(),
  severity: z.enum(["None", "Minor", "Moderate", "Severe"]),
  beyond_economical_repair: z.boolean(),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(400),
  detected: z.array(z.string().max(120)).max(8),
  screen_functional: z.boolean(),
});

export type ModelVerdict = z.infer<typeof ModelVerdict>;

const SYSTEM = `You are the Damage Assessment Agent for AT&T Protect Advantage, a device
protection plan. You inspect customer photos of a damaged mobile phone and report what you
can actually see.

Rules:
- Report only observable damage. Never invent a fault that is not visible in the photos.
- "beyond_economical_repair" is true only when there is frame deformation, multiple impact
  points, a failed display, or liquid ingress — cosmetic glass cracking alone is repairable.
- If the photos do not show a mobile phone, set is_phone false and damage_found false.
- Keep "summary" to one or two plain sentences a customer would understand. No jargon.
- Each "detected" entry names one component and its condition, e.g.
  "Front glass — cracked, upper-right origin" or "Rear camera — intact".
- Set "confidence" to how sure you are given the photo quality and coverage.

Reply with a single JSON object and nothing else. No prose, no markdown fence.
Schema:
{"is_phone":bool,"damage_found":bool,"severity":"None|Minor|Moderate|Severe",
"beyond_economical_repair":bool,"confidence":0-1,"summary":string,
"detected":[string],"screen_functional":bool}`;

export type VisionConfig = { baseUrl: string; apiKey: string; model: string };

/** Read provider config from the environment. Returns null when unconfigured. */
export function readVisionConfig(): VisionConfig | null {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();
  if (!baseUrl || !apiKey || !model) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey, model };
}

export class VisionError extends Error {}

/**
 * Send the customer's photos to the vision model and return its verdict.
 * @param images data URIs — "data:image/jpeg;base64,…"
 * @param deviceName so the model can name the device in its summary
 */
export async function assessPhotos(
  images: string[],
  deviceName: string,
  signal?: AbortSignal,
): Promise<ModelVerdict> {
  const cfg = readVisionConfig();
  if (!cfg) throw new VisionError("Vision provider is not configured");
  if (!images.length) throw new VisionError("No photos supplied");

  const body = {
    model: cfg.model,
    // Low temperature: two runs of the same photos should agree.
    temperature: 0.1,
    max_tokens: 700,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `The customer says this is their ${deviceName}. Here ${
              images.length === 1 ? "is 1 photo" : `are ${images.length} photos`
            }. Assess the damage.`,
          },
          ...images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
        ],
      },
    ],
  };

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Never let a provider error body reach the client — it can carry key hints.
    console.error("[vision] provider %d: %s", res.status, detail.slice(0, 500));
    throw new VisionError(`Provider returned ${res.status}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new VisionError("Provider returned an empty completion");

  return parseVerdict(raw);
}

/** Models sometimes wrap JSON in a fence or add a sentence. Recover the object. */
export function parseVerdict(raw: string): ModelVerdict {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  if (!text.startsWith("{")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) throw new VisionError("No JSON object in completion");
    text = text.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new VisionError("Completion was not valid JSON");
  }

  const result = ModelVerdict.safeParse(parsed);
  if (!result.success) throw new VisionError(`Verdict failed validation: ${result.error.message}`);
  return result.data;
}
