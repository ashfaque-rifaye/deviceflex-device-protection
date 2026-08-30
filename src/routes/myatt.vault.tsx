import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Database,
  Image,
  Film,
  Users,
  MessageSquare,
  Grid3x3,
  Sparkles,
  Loader2,
  Check,
  CloudUpload,
  CloudCheck,
  CloudOff,
  Trash2,
  ArrowRight,
  History,
  ShieldCheck,
  Sparkle,
  ArrowUpCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { RequireAuth, RequirePlan, useAuth } from "@/lib/auth";
import { vaultShares } from "@/lib/ai";
import { provisionFromManifest, verifyToken } from "@/lib/manifest";
import { KeyRound, Fingerprint } from "lucide-react";
import { SmartRestore } from "@/components/deviceflex/SmartRestore";
import { TIERS } from "@/data/deviceflex";
import {
  deviceVaultGB,
  vaultUsedGB,
  formatCapacity,
  vaultCapacityGB,
  vaultGrowthPerDevice,
  TIER_VAULT_GB,
  type Member,
  type MemberDevice,
} from "@/data/member";

export const Route = createFileRoute("/myatt/vault")({ component: VaultPage });

/**
 * MECHANISM 2 — the restoration manifest, anchored to the subscriber line.
 *
 * The thing to notice on this panel is what the manifest is keyed by. Coverage and data
 * hang off the phone *number*; the handset underneath is listed as a pointer, and it is
 * expected to change. That inversion is the whole mechanism — it is why a replacement can
 * rebuild in minutes without the broken device participating at all.
 */
function LineManifests({ member }: { member: Member }) {
  const manifests = (member.manifests ?? []).filter((x) => x.covered);
  if (!manifests.length) return null;

  return (
    <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
      <p className="att-eyebrow flex items-center gap-1.5 text-[#00388F]">
        <KeyRound className="h-3.5 w-3.5" />
        Coverage follows your number
      </p>
      <h2 className="mt-1 text-lg font-extrabold">Restoration manifest, by line</h2>
      <p className="mt-1 text-sm text-[#686E74]">
        Your coverage and your data are anchored to your phone number, not your handset. Each line
        keeps a live manifest of what&rsquo;s on it — so a replacement rebuilds from the number, and
        the broken device never has to be part of it.
      </p>

      <ul className="mt-4 space-y-3">
        {manifests.map((x) => {
          const plan = provisionFromManifest(x, { name: "a replacement device" });
          const intact = verifyToken(x.token, x.contents);
          return (
            <li key={x.line} className="rounded-xl border border-[#DCDFE3] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[15px] font-extrabold">{x.line}</p>
                <p className="att-small">
                  {x.owner} · currently on {x.boundDeviceName}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
                <Cell k="Photos" v={x.items.photos.toLocaleString()} />
                <Cell k="Messages" v={x.items.messages.toLocaleString()} />
                <Cell k="Contacts" v={x.items.contacts.toLocaleString()} />
                <Cell k="Apps" v={x.items.apps.toLocaleString()} />
              </div>

              <p className="att-small mt-3">
                {x.gb} GB · reconciled {x.lastReconciled} · rebuilds onto a new handset in about{" "}
                {plan.estimateSeconds < 90
                  ? `${plan.estimateSeconds} seconds`
                  : `${Math.round(plan.estimateSeconds / 60)} minutes`}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#DCDFE3] pt-3">
                <Fingerprint
                  className={`h-3.5 w-3.5 ${intact ? "text-[#1F7A3D]" : "text-[#C70032]"}`}
                />
                <span className="font-mono text-[11px] font-bold">{x.token.value}</span>
                <span className="att-small">
                  {intact
                    ? "coverage-continuity token · binding verified"
                    : "binding failed verification"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="att-small mt-4">
        The token binds three things together — the line, whether it&rsquo;s covered, and a pointer
        to this manifest — so coverage survives a device change without anything being re-entered.
        In the prototype the binding is a digest rather than a signed credential; the structure is
        the part that matters.
      </p>
    </section>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[#686E74]">{k}</p>
      <p className="font-bold text-[#1D2329]">{v}</p>
    </div>
  );
}

function VaultPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />
      <RequireAuth returnTo="/myatt/vault">
        <AccountNav active="Account" />
        <RequirePlan
          title="The Data Vault comes with Protect Advantage"
          blurb="Every plan includes a secure AT&T vault. Basic gives you 50 GB, Plus 500 GB, and on Family it grows with the household — 205 GB per covered device, up to 1 TB shared."
        >
          <Vault />
        </RequirePlan>
      </RequireAuth>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

const CATS = [
  { key: "photos" as const, label: "Photos", Icon: Image, color: "#0057B8" },
  { key: "videos" as const, label: "Videos", Icon: Film, color: "#009FDB" },
  { key: "apps" as const, label: "Apps", Icon: Grid3x3, color: "#5FC9F3" },
  { key: "messages" as const, label: "Messages", Icon: MessageSquare, color: "#8ED9F6" },
  { key: "contacts" as const, label: "Contacts", Icon: Users, color: "#BDE9FA" },
];

function Vault() {
  const { user, backupDevice, backupAll, setAutoBackup, cleanVault, restoreTo } = useAuth();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const m = user as Member;

  const used = vaultUsedGB(m);
  const total = vaultCapacityGB(m);
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const over = used > total;
  const nearFull = !over && total > 0 && used / total >= 0.85;
  const nextTier = TIERS.find((t) => (m.tier === "basic" ? t.id === "plus" : t.id === "family"));
  const growth = vaultGrowthPerDevice(m.tier);
  const atTierCeiling = m.tier ? total >= TIER_VAULT_GB[m.tier] : false;
  const backed = m.devices.filter((d) => d.backedUp && d.protected);
  const pending = m.devices.filter((d) => d.protected && !d.backedUp);

  const totals = CATS.map((c) => ({
    ...c,
    gb: backed.reduce((n, d) => n + d.vault[c.key], 0),
  }));
  const catTotal = totals.reduce((n, c) => n + c.gb, 0) || 1;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10">
      <Link to="/myatt" className="text-sm font-bold text-[#0057B8] hover:underline">
        &lt; Back to dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E7F5FB]">
            <Database className="h-5 w-5 text-[#0057B8]" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="att-h1">Data Vault</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F5FB] px-2.5 py-1 text-[11px] font-bold text-[#00388F]">
                <Sparkle className="h-3 w-3" /> Powered by AI
              </span>
            </div>
            <p className="att-small">Secure AT&amp;T vault · last backup {m.vault.lastBackup}</p>
          </div>
        </div>
        {pending.length > 0 && (
          <button onClick={backupAll} className="btn-primary">
            <CloudUpload className="mr-2 inline h-4 w-4" />
            Back up {pending.length} device{pending.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* ── Storage ─────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-2xl font-extrabold">
                {formatCapacity(used)}{" "}
                <span className="text-sm font-normal text-[#686E74]">
                  of {formatCapacity(total)}
                  {m.tier === "family" ? " shared" : ""}
                </span>
              </p>
              <span
                className={`text-sm font-bold ${over ? "text-[#C70032]" : nearFull ? "text-[#9E5D00]" : "text-[#00388F]"}`}
              >
                {pct.toFixed(0)}% used
              </span>
            </div>

            {/* Stacked by content type — where the space actually went */}
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              {totals.map((c) => (
                <div
                  key={c.key}
                  title={`${c.label} · ${formatCapacity(c.gb)}`}
                  style={{ width: `${(c.gb / catTotal) * pct}%`, background: c.color }}
                />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {totals.map(({ key, label, Icon, color, gb }) => (
                <div key={key} className="rounded-xl border border-[#DCDFE3] p-3 text-center">
                  <Icon className="mx-auto h-4 w-4" style={{ color }} />
                  <p className="mt-1.5 text-base font-extrabold tabular-nums">
                    {gb.toFixed(gb < 10 ? 1 : 0)}
                    <span className="text-[11px] font-normal text-[#686E74]"> GB</span>
                  </p>
                  <p className="text-[11px] text-[#686E74]">{label}</p>
                </div>
              ))}
            </div>

            {used === 0 && (
              <p className="mt-4 rounded-xl bg-[#FFF3E0] p-3 text-sm">
                Nothing is in your vault yet. Back up a device and Smart Restore will have something
                to work with.
              </p>
            )}

            {/* Out of room. Offer the two honest ways to fix it: a bigger tier, or —
                on Family — simply covering another device, which adds allocation. */}
            {(over || nearFull) && (
              <div
                className={`mt-4 rounded-xl border p-4 ${over ? "border-[#F0C2CE] bg-[#FDF3F5]" : "border-[#E8D3A8] bg-[#FFF3E0]"}`}
              >
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <ArrowUpCircle
                    className={`h-4 w-4 ${over ? "text-[#C70032]" : "text-[#9E5D00]"}`}
                  />
                  {over
                    ? `You're ${formatCapacity(used - total)} over your vault`
                    : `You're using ${pct.toFixed(0)}% of your vault`}
                </p>
                <p className="mt-1.5 text-sm">
                  {over
                    ? "New backups will stop until there's room. Free some space with the cleaner, or add capacity."
                    : "Worth adding room before it fills — a full vault means Smart Restore has less to bring back."}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {nextTier && (
                    <Link
                      to="/myatt/protection"
                      search={{ device: "" }}
                      className="btn-primary att-btn-sm"
                    >
                      Move to {nextTier.name} · {formatCapacity(TIER_VAULT_GB[nextTier.id])}
                    </Link>
                  )}
                  {m.tier === "family" && !atTierCeiling && (
                    <Link to="/myatt/family" className="btn-secondary att-btn-sm">
                      Cover another device · +{formatCapacity(growth)}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* How the allowance is built, so the number isn't a mystery. */}
            {m.tier === "family" && (
              <p className="att-small mt-4">
                {formatCapacity(growth)} per covered device ·{" "}
                {m.devices.filter((d) => d.protected).length} covered ·{" "}
                {atTierCeiling
                  ? "at the Family ceiling of 1 TB"
                  : `covering one more adds ${formatCapacity(growth)}`}
              </p>
            )}
          </section>

          {/* ── Devices & backups ───────────────────────────────────── */}
          <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <h2 className="text-lg font-extrabold">Devices in this vault</h2>
            <p className="mt-1 text-sm text-[#686E74]">
              {m.tier === "family"
                ? "Every covered device backs into one shared pool — that's the household lock-in."
                : "Your covered device backs into your vault automatically."}
            </p>
            <ul className="mt-4 divide-y divide-[#DCDFE3]">
              {m.devices
                .filter((d) => d.protected)
                .map((d) => (
                  <DeviceRow
                    key={d.id}
                    d={d}
                    onBackup={() => backupDevice(d.id)}
                    onAuto={(on) => setAutoBackup(d.id, on)}
                  />
                ))}
            </ul>
          </section>

          {/* ── Mechanism 2 — the manifest, anchored to the line ────── */}
          <LineManifests member={m} />

          {/* ── Cleaner ─────────────────────────────────────────────── */}
          <Cleaner member={m} onClean={cleanVault} />

          {/* ── Family attribution ──────────────────────────────────── */}
          {m.tier === "family" && backed.length > 1 && (
            <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
              <h2 className="text-lg font-extrabold">Who&rsquo;s using the space</h2>
              <ul className="mt-4 space-y-3">
                {vaultShares(m).map(({ device, gb, pct: sharePct }) => (
                  <li key={device.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold">
                        {device.owner.split(" ")[0]} · {device.name}
                      </span>
                      <span className="tabular-nums text-[#686E74]">{formatCapacity(gb)}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div
                        className="h-full rounded-full bg-[#0057B8]"
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Smart Restore ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F5FB]">
                <Sparkles className="h-5 w-5 text-[#00388F]" />
              </span>
              <h2 className="att-h4">Smart Restore</h2>
            </div>
            <p className="att-small mt-3">
              Move everything from one device&rsquo;s backup onto another — or just the parts you
              want. Photos, videos, messages, contacts and apps, in under two minutes.
            </p>
            {backed.length === 0 ? (
              <p className="mt-4 rounded-xl bg-[#FFF3E0] p-3 text-sm">
                Back up a device first — there&rsquo;s nothing in the vault to restore yet.
              </p>
            ) : (
              <button onClick={() => setRestoreOpen(true)} className="btn-primary mt-4 w-full">
                Restore to a device
              </button>
            )}
          </section>

          {m.restores.length > 0 && (
            <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#00388F]" />
                <h2 className="att-h4">Restore history</h2>
              </div>
              <ul className="mt-3 space-y-3 text-sm">
                {m.restores.map((r) => (
                  <li key={r.id} className="rounded-xl border border-[#DCDFE3] p-3">
                    <p className="font-bold">
                      {r.fromDevice} → {r.toDevice}
                    </p>
                    <p className="att-small">
                      {r.date} · {formatCapacity(r.gb)} · {r.items.toLocaleString()} items
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {restoreOpen && (
        <SmartRestore
          member={m}
          onClose={() => setRestoreOpen(false)}
          onRestore={(fromId, toId) => restoreTo(fromId, toId)}
        />
      )}
    </div>
  );
}

// ── One device row: status, size, backup control ─────────────────────────────
function DeviceRow({
  d,
  onBackup,
  onAuto,
}: {
  d: MemberDevice;
  onBackup: () => void;
  onAuto: (on: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const run = () => {
    setBusy(true);
    setTimeout(() => {
      onBackup();
      setBusy(false);
    }, 1400);
  };

  return (
    <li className="flex flex-wrap items-center gap-4 py-4">
      <img src={d.image} alt="" className="h-14 w-10 shrink-0 object-contain" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">{d.name}</p>
        <p className="text-xs text-[#686E74]">
          {d.owner} · {formatCapacity(deviceVaultGB(d))} in vault
        </p>
        <p
          className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold ${d.backedUp ? "text-[#1F7A3D]" : "text-[#9E5D00]"}`}
        >
          {d.backedUp ? (
            <CloudCheck className="h-3.5 w-3.5" />
          ) : (
            <CloudOff className="h-3.5 w-3.5" />
          )}
          {d.backedUp
            ? `Synced · ${d.lastBackup}`
            : `Backup due · last ${d.lastBackup.toLowerCase()}`}
        </p>
      </div>

      <label className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#686E74]">
        Auto
        <button
          role="switch"
          aria-checked={d.autoBackup}
          aria-label={`Auto-backup for ${d.name}`}
          onClick={() => onAuto(!d.autoBackup)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${d.autoBackup ? "bg-[#0057B8]" : "bg-[#DCDFE3]"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${d.autoBackup ? "left-5" : "left-0.5"}`}
          />
        </button>
      </label>

      <button
        onClick={run}
        disabled={busy}
        className="btn-secondary shrink-0 text-xs disabled:opacity-60"
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Backing up…
          </span>
        ) : d.backedUp ? (
          "Back up again"
        ) : (
          "Back up now"
        )}
      </button>
    </li>
  );
}

// ── Duplicate & junk cleaner ─────────────────────────────────────────────────
function Cleaner({ member, onClean }: { member: Member; onClean: () => void }) {
  const [state, setState] = useState<"idle" | "scanning" | "found" | "cleaning" | "done">(
    member.vault.junkGB > 0 ? "idle" : "done",
  );
  const junk = member.vault.junkGB;
  const dupes = member.vault.duplicates;

  const findings = [
    { label: "Duplicate photos", count: Math.round(dupes * 0.72), gb: +(junk * 0.58).toFixed(1) },
    { label: "Duplicate videos", count: Math.round(dupes * 0.06), gb: +(junk * 0.27).toFixed(1) },
    { label: "Cached app data", count: Math.round(dupes * 0.15), gb: +(junk * 0.11).toFixed(1) },
    {
      label: "Screenshots older than a year",
      count: Math.round(dupes * 0.07),
      gb: +(junk * 0.04).toFixed(1),
    },
  ];

  const scan = () => {
    setState("scanning");
    setTimeout(() => setState("found"), 1600);
  };
  const clean = () => {
    setState("cleaning");
    setTimeout(() => {
      onClean();
      setState("done");
    }, 1500);
  };

  return (
    <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F5FB]">
          <Trash2 className="h-5 w-5 text-[#0057B8]" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold">Duplicate &amp; Junk Cleaner</h2>
          <p className="text-xs text-[#686E74]">
            AI finds duplicate photos and junk files so you stop paying to store them twice.
          </p>
        </div>
      </div>

      {state === "idle" && (
        <button onClick={scan} className="btn-secondary mt-4">
          Scan my vault
        </button>
      )}

      {state === "scanning" && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0057B8]">
          <Loader2 className="h-4 w-4 animate-spin" /> Scanning{" "}
          {member.devices.filter((d) => d.backedUp).length} devices…
        </p>
      )}

      {(state === "found" || state === "cleaning") && (
        <>
          <p className="mt-4 text-sm font-extrabold">
            Found {junk} GB across {dupes.toLocaleString()} files
          </p>
          <ul className="mt-3 divide-y divide-[#DCDFE3] rounded-xl border border-[#DCDFE3]">
            {findings.map((f) => (
              <li key={f.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>
                  {f.label} <span className="text-[#686E74]">· {f.count.toLocaleString()}</span>
                </span>
                <span className="font-bold tabular-nums">{f.gb} GB</span>
              </li>
            ))}
          </ul>
          <button
            onClick={clean}
            disabled={state === "cleaning"}
            className="btn-primary mt-4 disabled:opacity-60"
          >
            {state === "cleaning" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Freeing space…
              </span>
            ) : (
              `Free up ${junk} GB`
            )}
          </button>
        </>
      )}

      {state === "done" && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EAF7EE] px-3 py-1.5 text-sm font-bold text-[#1F7A3D]">
          <Check className="h-4 w-4" /> Vault is clean — no duplicates found
        </p>
      )}
    </section>
  );
}
