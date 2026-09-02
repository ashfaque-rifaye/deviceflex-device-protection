// The production signing path, written out so the gap between this prototype and a
// deployment is a primitive swap rather than a redesign.
//
// `lib/ledger.ts` signs with FNV-1a over canonical JSON. That is honest — it is a
// checksum, not a credential, and it is labelled as one everywhere it appears. It is
// also *synchronous*, which is why it is what the pure functions use: `crypto.subtle`
// is async and cannot sit inside a function that must stay replayable.
//
// What this file establishes is that the surrounding structure is already correct. The
// bytes that get signed are the same canonical serialisation; only the function applied
// to them changes. Nothing upstream of a signature knows or cares which one ran.
//
// It is server-only (`.server.ts` keeps it out of the client graph) and off unless a key
// is present, so the demo path is unchanged.
import { canonical, digest } from "@/lib/ledger";

/** Set both to move signing onto HMAC-SHA-256. Absent, the deterministic digest stands. */
type SigningConfig = { secret: string; keyId: string };

export function readSigningConfig(): SigningConfig | null {
  const secret = process.env.LEDGER_SIGNING_KEY;
  const keyId = process.env.LEDGER_SIGNING_KEY_ID;
  if (!secret || !keyId) return null;
  return { secret, keyId };
}

export type SignedEnvelope = {
  /** The canonical bytes that were signed — identical either way. */
  payload: string;
  signature: string;
  /** `fnv1a-64` in the prototype, `hmac-sha256` once a key is configured. */
  alg: "fnv1a-64" | "hmac-sha256";
  /** Which key signed it. `local` when no key material is present. */
  keyId: string;
  at: string;
};

/**
 * Sign a decision trace, an attestation body or a continuity token.
 *
 * The argument is any JSON-serialisable value: it is canonicalised here so that two
 * structurally identical inputs always produce identical bytes. Without key ordering the
 * signature proves nothing, which is the same reason `canonical()` exists in the ledger.
 */
export async function signCanonical(value: unknown): Promise<SignedEnvelope> {
  const payload = canonical(value);
  const cfg = readSigningConfig();
  const at = new Date().toISOString();

  if (!cfg) {
    return { payload, signature: digest(payload), alg: "fnv1a-64", keyId: "local", at };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(cfg.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const signature = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { payload, signature, alg: "hmac-sha256", keyId: cfg.keyId, at };
}

/**
 * Verify an envelope against a fresh signing of the same value.
 *
 * Constant-time comparison matters once a real MAC is in play: a byte-by-byte early
 * return leaks how much of a forged signature was correct.
 */
export async function verifyCanonical(value: unknown, env: SignedEnvelope): Promise<boolean> {
  const fresh = await signCanonical(value);
  if (fresh.alg !== env.alg || fresh.signature.length !== env.signature.length) return false;
  let diff = 0;
  for (let i = 0; i < fresh.signature.length; i += 1) {
    diff |= fresh.signature.charCodeAt(i) ^ env.signature.charCodeAt(i);
  }
  return diff === 0;
}
