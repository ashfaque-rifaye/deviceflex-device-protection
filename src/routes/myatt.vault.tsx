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
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { RequireAuth, RequirePlan, useAuth } from "@/lib/auth";
import { planRestore, smartRestoreSteps, vaultShares } from "@/lib/ai";
import {
  deviceVaultGB,
  vaultUsedGB,
  formatCapacity,
  type Member,
  type MemberDevice,
} from "@/data/member";

export const Route = createFileRoute("/myatt/vault")({ component: VaultPage });

function VaultPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />
      <RequireAuth returnTo="/myatt/vault">
        <AccountNav active="Account" />
        <RequirePlan
          title="The AI Data Vault comes with Protect Advantage"
          blurb="Every plan includes a secure AT&T vault — 50 GB on Basic, 500 GB on Plus, and 1 TB shared across the household on Family."
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
  const { user, backupDevice, backupAll, setAutoBackup, cleanVault } = useAuth();
  const m = user as Member;

  const used = vaultUsedGB(m);
  const total = m.vault.totalGB;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const backed = m.devices.filter((d) => d.backedUp);
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
            <h1 className="text-3xl font-extrabold md:text-4xl">AI Data Vault</h1>
            <p className="text-sm text-[#686E74]">
              Secure AT&amp;T vault · last backup {m.vault.lastBackup}
            </p>
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
              <span className="text-sm font-bold text-[#0057B8]">{pct.toFixed(0)}% used</span>
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
          <SmartRestore member={m} />

          {m.restores.length > 0 && (
            <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#0057B8]" />
                <h2 className="text-base font-extrabold">Restore history</h2>
              </div>
              <ul className="mt-3 space-y-3 text-sm">
                {m.restores.map((r) => (
                  <li key={r.id} className="rounded-xl border border-[#DCDFE3] p-3">
                    <p className="font-bold">
                      {r.fromDevice} → {r.toDevice}
                    </p>
                    <p className="text-xs text-[#686E74]">
                      {r.date} · {formatCapacity(r.gb)} · {r.items.toLocaleString()} items
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
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
          className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold ${d.backedUp ? "text-[#1F7A3D]" : "text-[#B26A00]"}`}
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

// ── Smart Restore ────────────────────────────────────────────────────────────
function SmartRestore({ member }: { member: Member }) {
  const { restoreTo } = useAuth();
  const backed = member.devices.filter((d) => d.backedUp);
  const [open, setOpen] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);

  const from = member.devices.find((d) => d.id === fromId);
  const to = member.devices.find((d) => d.id === toId);
  const plan = from ? planRestore(from) : null;
  const steps = plan && to ? smartRestoreSteps(plan, to.name) : [];

  useEffect(() => {
    if (step < 0 || step >= steps.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, steps.length]);

  useEffect(() => {
    if (step >= 0 && step === steps.length - 1 && !done && from && to) {
      restoreTo(from.id, to.id);
      setDone(true);
    }
  }, [step, steps.length, done, from, to, restoreTo]);

  const reset = () => {
    setOpen(false);
    setStep(-1);
    setDone(false);
    setFromId("");
    setToId("");
  };

  return (
    <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F5FB]">
          <Sparkles className="h-5 w-5 text-[#0057B8]" />
        </span>
        <h2 className="text-base font-extrabold">Smart Restore</h2>
      </div>
      <p className="mt-3 text-sm text-[#686E74]">
        Move everything from one device&rsquo;s backup onto another in under two minutes — photos,
        messages, contacts and apps.
      </p>

      {backed.length === 0 ? (
        <p className="mt-4 rounded-xl bg-[#FFF3E0] p-3 text-sm">
          Back up a device first — there&rsquo;s nothing in the vault to restore yet.
        </p>
      ) : !open ? (
        <button
          onClick={() => {
            setOpen(true);
            setFromId(backed[0].id);
          }}
          className="btn-primary mt-4 w-full"
        >
          Restore to a device
        </button>
      ) : step < 0 ? (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
              Restore from
            </label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#DCDFE3] px-3 py-2 text-sm outline-none focus:border-[#0057B8]"
            >
              {backed.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.owner.split(" ")[0]} · {formatCapacity(deviceVaultGB(d))}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
              Restore onto
            </label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#DCDFE3] px-3 py-2 text-sm outline-none focus:border-[#0057B8]"
            >
              <option value="">Choose a device…</option>
              {member.devices
                .filter((d) => d.id !== fromId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.owner.split(" ")[0]}
                  </option>
                ))}
            </select>
          </div>

          {plan && (
            <div className="rounded-xl bg-[#F3F4F6] p-4 text-xs">
              <p className="font-bold text-[#1D2329]">This will move {formatCapacity(plan.gb)}</p>
              <ul className="mt-2 space-y-0.5 text-[#686E74]">
                <li>
                  {plan.photos.toLocaleString()} photos · {plan.videos.toLocaleString()} videos
                </li>
                <li>
                  {plan.messages.toLocaleString()} messages · {plan.contacts.toLocaleString()}{" "}
                  contacts
                </li>
                <li>{plan.apps} apps and your settings</li>
              </ul>
              <p className="mt-2 text-[#686E74]">
                Estimated {plan.minutes} minute{plan.minutes > 1 ? "s" : ""}.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={reset} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button
              disabled={!toId}
              onClick={() => setStep(0)}
              className={`btn-primary flex-1 text-sm ${!toId ? "opacity-50" : ""}`}
            >
              Start restore <ArrowRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-[#DCDFE3] p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
            {done ? "Complete" : "Restoring"}
          </p>
          <p className="mt-2 text-sm">{steps[step]}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full bg-[#0057B8] transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          {done && (
            <>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#1F7A3D]">
                <ShieldCheck className="h-4 w-4" /> {to?.name} is ready
              </p>
              <button onClick={reset} className="btn-secondary mt-3 w-full text-sm">
                Done
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
