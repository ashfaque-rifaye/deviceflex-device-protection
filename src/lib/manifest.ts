// MECHANISM 2 — Line-Anchored Restoration Manifest, and ADDITION ③ — the
// coverage-continuity token that binds it.
//
// Device protection today is bound to a handset. The policy names an IMEI; the backup
// belongs to whichever cloud account the customer happened to set up; restoring takes days
// and only works if they did something right months earlier.
//
// Invert it. The thing AT&T actually owns is the *subscriber line*. So the manifest — a
// continuously reconciled checklist of what is on the phone — hangs off the line, and
// devices are pointers into it. Swap the handset and nothing about the manifest changes:
// the replacement pulls the recipe for the phone from the number, and rebuilds.
//
// The patent argument is Enfish-shaped: this is a specific data-structure design that makes
// the system work better, not a promise about service levels. It is what turns "15-minute
// swap" from a logistics claim into a provisioning one.
import type { Member, MemberDevice, VaultBreakdown } from "@/data/member";
import { deviceVaultGB } from "@/data/member";
import { digest, canonical } from "@/lib/ledger";

/**
 * What a line is carrying. Anchored to `line` — the subscriber identifier — with
 * `boundDeviceId` as a pointer that is expected to change over the life of the manifest.
 */
export type LineManifest = {
  /** The subscriber identifier. This is the key. Everything else is mutable. */
  line: string;
  owner: string;
  /** The handset currently materialising this manifest. A pointer, not an identity. */
  boundDeviceId: string;
  boundDeviceName: string;
  /** True while the line's coverage is active. */
  covered: boolean;
  contents: VaultBreakdown;
  /** Item counts, derived — what the member actually recognises. */
  items: { photos: number; videos: number; messages: number; apps: number; contacts: number };
  gb: number;
  lastReconciled: string;
  /** Addition ③ — proves the binding between line, coverage and manifest. */
  token: ContinuityToken;
};

/**
 * ADDITION ③ — a token bound to the line, carrying two facts: this line is covered, and
 * here is the pointer to its restore manifest.
 *
 * Honest label: `signature` is a digest, not a signed credential — there is no key
 * material in a browser prototype and pretending otherwise would be worse than saying so.
 * The structure is the claimable part: coverage and manifest pointer bound to the
 * subscriber identifier, surviving device changes. A deployment signs this with a carrier
 * key in an HSM.
 */
export type ContinuityToken = {
  /** Display form — what a support agent would read back. */
  value: string;
  line: string;
  issued: string;
  covered: boolean;
  /** Digest over the canonical binding, so tampering with any field is detectable. */
  signature: string;
};

const ITEMS_PER_GB = { photos: 220, videos: 12, messages: 4000, apps: 9, contacts: 512 };

export function mintToken(
  line: string,
  covered: boolean,
  contents: VaultBreakdown,
): ContinuityToken {
  const issued = new Date().toISOString();
  // The binding deliberately covers the manifest contents as well as the line, so a
  // token cannot be replayed against a different manifest.
  const signature = digest(canonical({ line, covered, contents, v: 1 }));
  return {
    value: `CCT-${line.replace(/\D/g, "").slice(-4)}-${signature.slice(0, 8).toUpperCase()}`,
    line,
    issued,
    covered,
    signature,
  };
}

/** Re-derive the signature and compare. Catches an edited manifest or a swapped token. */
export function verifyToken(t: ContinuityToken, contents: VaultBreakdown): boolean {
  return t.signature === digest(canonical({ line: t.line, covered: t.covered, contents, v: 1 }));
}

/**
 * Rebuild every line's manifest from current account state.
 *
 * Called from `reconcile()` in auth.tsx, which already runs after every mutation — so the
 * manifest is continuously reconciled by construction rather than on a schedule that can
 * be missed. That "continuously reconciled" property is load-bearing in the claim.
 */
export function reconcileManifest(m: Member): LineManifest[] {
  const stamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return m.devices.map((d) => {
    const gb = deviceVaultGB(d);
    const existing = m.manifests?.find((x) => x.line === d.line);
    const contents = { ...d.vault };
    // Reuse the token while the binding still holds; re-mint when coverage or contents
    // move, so the signature never silently goes stale.
    const token =
      existing && existing.covered === d.protected && verifyToken(existing.token, contents)
        ? existing.token
        : mintToken(d.line, d.protected, contents);
    return {
      line: d.line,
      owner: d.owner,
      boundDeviceId: d.id,
      boundDeviceName: d.name,
      covered: d.protected,
      contents,
      gb: Math.round(gb * 10) / 10,
      items: {
        photos: Math.round(d.vault.photos * ITEMS_PER_GB.photos),
        videos: Math.round(d.vault.videos * ITEMS_PER_GB.videos),
        messages: Math.round(d.vault.messages * ITEMS_PER_GB.messages),
        apps: Math.round(d.vault.apps * ITEMS_PER_GB.apps),
        contacts: Math.round(d.vault.contacts * ITEMS_PER_GB.contacts),
      },
      lastReconciled: d.backedUp ? stamp : "Never — backup not run on this line",
      token,
    };
  });
}

export const manifestForLine = (m: Member, line: string): LineManifest | undefined =>
  m.manifests?.find((x) => x.line === line);

export const manifestForDevice = (m: Member, deviceId: string): LineManifest | undefined =>
  m.manifests?.find((x) => x.boundDeviceId === deviceId);

/** What provisioning a replacement from the manifest would do, before it is done. */
export type ProvisionPlan = {
  line: string;
  fromDevice: string;
  toDevice: string;
  gb: number;
  totalItems: number;
  /** Restore order. Ordering is the AI's contribution; the plan itself is deterministic. */
  steps: Array<{ label: string; detail: string; items: number }>;
  estimateSeconds: number;
  tokenValid: boolean;
};

/**
 * MECHANISM 2, the provisioning half. Note what is *not* here: any reference to the
 * broken handset's identity. The replacement is built from the line's manifest, which is
 * why the old device being destroyed, lost or blocklisted changes nothing.
 *
 * The restore ORDER is where AI genuinely contributes — deciding that a member wants their
 * photos and messages before their app layout. The plan it produces stays deterministic.
 */
export function provisionFromManifest(
  manifest: LineManifest,
  replacement: Pick<MemberDevice, "name">,
): ProvisionPlan {
  const i = manifest.items;
  const steps = [
    {
      label: "Identity and line",
      detail: `Bind ${replacement.name} to ${manifest.line} and validate the continuity token`,
      items: 1,
    },
    {
      label: "Contacts and messages",
      detail: "The things you need working before you leave the store",
      items: i.contacts + i.messages,
    },
    {
      label: "Photos and video",
      detail: "Newest first, so the last year is there before the restore finishes",
      items: i.photos + i.videos,
    },
    {
      label: "Apps and settings",
      detail: "Layout, accounts and preferences reapplied in the background",
      items: i.apps,
    },
  ];
  return {
    line: manifest.line,
    fromDevice: manifest.boundDeviceName,
    toDevice: replacement.name,
    gb: manifest.gb,
    totalItems: steps.reduce((n, s) => n + s.items, 0),
    steps,
    // Deterministic estimate: throughput over a store's provisioning link.
    estimateSeconds: Math.max(45, Math.round(manifest.gb * 0.9)),
    tokenValid: verifyToken(manifest.token, manifest.contents),
  };
}

/** Re-point a manifest at a new handset. The line — and therefore coverage — is untouched. */
export function rebindManifest(
  manifest: LineManifest,
  device: Pick<MemberDevice, "id" | "name">,
): LineManifest {
  return { ...manifest, boundDeviceId: device.id, boundDeviceName: device.name };
}
