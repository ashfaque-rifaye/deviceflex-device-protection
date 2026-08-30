// AT&T "My wireless" device screen — Device info / Data use / Device options tabs.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  BatteryFull,
  CloudCheck,
  CloudOff,
  AlertTriangle,
  Camera,
  Pencil,
  Bell,
  Globe,
  Plus,
  TrendingUp,
  SlidersHorizontal,
  Smartphone,
  Lock,
  Tag,
  BadgeCheck,
  Check,
  Loader2,
  PackageCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { IconSim, IconKebab, IconChevronR } from "@/components/deviceflex/AttIcons";
import { RequireAuth, useAuth } from "@/lib/auth";
import { DeductibleCard } from "@/components/deviceflex/DeductibleCard";
import { getTier } from "@/data/deviceflex";
import { preStage, findStores, PRESTAGE_THRESHOLD } from "@/lib/ai";
import type { Member, MemberDevice } from "@/data/member";

export const Route = createFileRoute("/myatt/device/$id")({ component: DevicePage });

function DevicePage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />
      <RequireAuth returnTo="/myatt">
        <Detail />
      </RequireAuth>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

const TABS = [
  { id: "info", label: "Device info", Icon: Smartphone },
  { id: "data", label: "Data use", Icon: TrendingUp },
  { id: "options", label: "Device options", Icon: SlidersHorizontal },
] as const;

function Detail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const m = user as Member;
  const d = m.devices.find((x) => x.id === id);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("info");

  if (!d) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Device not found</h1>
        <Link to="/myatt" className="btn-primary mt-6">
          Back to account
        </Link>
      </div>
    );
  }

  return (
    <>
      <AccountNav active="Services" />
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10">
        <Link
          to="/myatt"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#0072B2] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> My wireless
        </Link>
        <h1 className="mt-1 text-[34px] font-extrabold leading-tight tracking-[-0.03em]">
          {d.owner}
        </h1>
        <p className="text-[12px] text-[#454B52]">Account {m.accountNumber}</p>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {/* ── LEFT ───────────────────────────────────────────────── */}
          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl bg-white">
              {/* Tabs */}
              <div className="grid grid-cols-3">
                {TABS.map(({ id: t, label, Icon }) => {
                  const on = tab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex flex-col items-center gap-1 px-2 py-4 text-[12px] font-bold ${on ? "bg-white text-[#1D2329]" : "bg-[#E7F5FB] text-[#0072B2]"}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="h-px bg-[#DCDFE3]" />

              {tab === "info" && <TabInfo d={d} member={m} />}
              {tab === "data" && <TabData d={d} />}
              {tab === "options" && <TabOptions d={d} />}
            </section>

            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-6 text-[15px] font-bold text-[#0072B2] hover:underline">
              <Plus className="h-5 w-5" /> Add a line
            </button>
          </div>

          {/* ── RIGHT ──────────────────────────────────────────────── */}
          <div className="space-y-4">
            <ProtectPromo d={d} />

            <section className="rounded-2xl bg-white p-6">
              <p className="text-[15px] text-[#454B52]">Monthly plan details &amp; cost</p>
              <h2 className="mt-1 text-[26px] font-extrabold leading-tight">
                {d.protected
                  ? `AT&T Protect Advantage ${getTier(d.tier)?.name}`
                  : "AT&T Unlimited Starter® SL plan"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-[34px] font-extrabold leading-none">
                  ${d.protected ? `${m.tierPrice}.00` : "80.99"}
                  <span className="text-[14px] font-normal">/mo</span>
                </p>
                <span className="rounded-full border border-dashed border-[#1F7A3D] px-3 py-1 text-[11px] font-bold text-[#1F7A3D]">
                  Save $10 per line with AutoPay &amp; paperless billing. <u>Sign up now</u>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-[#454B52]">Excludes taxes and fees</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button className="btn-secondary text-sm">See monthly bill</button>
                <Link
                  to="/myatt/protection"
                  search={{ device: d.id } as never}
                  className="btn-primary text-sm"
                >
                  Change plan
                </Link>
              </div>

              <div className="mt-5 rounded-xl bg-[#F2FAFD] p-5">
                <p className="text-[15px] font-bold">Browse our protection plans</p>
                <p className="mt-1 text-[13px] text-[#454B52]">
                  Compare Basic, Plus and Family. Find the coverage that fits your household.
                </p>
                <Link to="/deviceflex" className="btn-primary mt-4 text-sm">
                  Explore and compare plans
                </Link>
              </div>

              <details className="group mt-5 border-t border-[#DCDFE3] pt-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-bold text-[#0072B2]">
                  See what's included in your plan
                  <IconChevronR className="h-4 w-4 rotate-90 transition-transform group-open:-rotate-90" />
                </summary>
                <ul className="mt-3 space-y-2 text-[14px]">
                  {[
                    "Your cost confirmed before you book",
                    "Accidental damage, loss, theft & malfunction",
                    "15-minute in-store swap",
                    "Unlimited battery replacement",
                    "Secure data vault + Smart Restore",
                  ].map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1F7A3D]" />
                      {x}
                    </li>
                  ))}
                </ul>
              </details>
            </section>

            {d.protected && <PreStagingCard device={d} />}

            <section className="rounded-2xl bg-white p-6">
              <h2 className="text-[20px] font-extrabold">My international coverage</h2>
              <p className="mt-2 text-[14px] text-[#454B52]">
                Before packing your bags, check your international coverage to make sure you can
                stay in touch wherever you go.
              </p>
              <p className="mt-4 text-[14px] font-bold">See where you're covered</p>
              <p className="text-[13px] text-[#454B52]">
                Search for your travel destination or cruise line to check if it's covered.
              </p>
              <div className="mt-3 flex overflow-hidden rounded-full border border-[#878C94] p-1">
                <button className="flex-1 rounded-full bg-[#00388F] py-2 text-[13px] font-bold text-white">
                  Destination
                </button>
                <button className="flex-1 rounded-full py-2 text-[13px] font-bold text-[#00388F]">
                  Cruise line
                </button>
              </div>
              <label className="mt-4 block">
                <span className="text-[14px] font-bold">Travel destination</span>
                <select className="mt-2 h-12 w-full rounded-lg border border-[#686E74] bg-white px-4 text-[15px] outline-none focus:border-[#0072B2]">
                  <option>Select country</option>
                  <option>Mexico</option>
                  <option>United Kingdom</option>
                  <option>Japan</option>
                </select>
              </label>
              <p className="mt-4 flex items-start gap-2 text-[13px] text-[#454B52]">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#0072B2]" />
                Protect Advantage covers your device abroad — same cover, with a replacement shipped
                to your hotel.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * MECHANISM 4 — Multi-Path Resolution Optimizer with Inventory Pre-Staging.
 *
 * The mechanism that reaches into the physical world: a deterministic health index
 * crossing a threshold causes a replacement device and a restore snapshot to move to a
 * named store, before anything has broken. Shown here because this is the page where a
 * member looks at one device's health.
 */
function PreStagingCard({ device }: { device: MemberDevice }) {
  const staging = preStage(device, findStores(device, "swap"));

  return (
    <section className="rounded-2xl bg-white p-6">
      <p className="att-eyebrow flex items-center gap-1.5 text-[#00388F]">
        <PackageCheck className="h-3.5 w-3.5" />
        Inventory pre-staging
      </p>
      <h2 className="mt-1 text-[20px] font-extrabold">{staging.headline}</h2>
      <p className="mt-2 text-[14px] text-[#454B52]">{staging.detail}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-[#F3F4F6] p-4">
        <div>
          <p className="att-small">Device health index</p>
          <p
            className="text-[26px] font-extrabold leading-none"
            style={{ color: staging.armed ? "#9E5D00" : "#1F7A3D" }}
          >
            {staging.index}
            <span className="text-[13px] font-bold text-[#686E74]">/100</span>
          </p>
        </div>
        <div className="h-10 w-px bg-[#DCDFE3]" />
        <div className="min-w-0 flex-1">
          <p className="att-small">Staging threshold</p>
          <p className="text-[14px] font-bold">
            {PRESTAGE_THRESHOLD} — {staging.armed ? "crossed" : "not reached"}
          </p>
        </div>
        {staging.armed && staging.daysSaved > 0 && (
          <div className="shrink-0 rounded-full bg-[#E7F5FB] px-3 py-1.5 text-[12px] font-bold text-[#00388F]">
            ~{staging.daysSaved} days saved if it fails
          </div>
        )}
      </div>

      <p className="att-small mt-3 font-bold text-[#1D2329]">What moved the index</p>
      <ul className="mt-1.5 space-y-1">
        {staging.drivers.map((x) => (
          <li key={x} className="flex gap-2 text-[13px] text-[#454B52]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#878C94]" />
            <span>{x}</span>
          </li>
        ))}
      </ul>

      <p className="att-small mt-3">
        The index is a fixed calculation over battery capacity, screen-risk profile, warranty state
        and backup status — the same device always produces the same number. A forecast model
        decides <i>when</i> failure is likely; the threshold decides what happens about it.
      </p>
    </section>
  );
}

// ── Promo card ("Accidents happen. Have a plan.") ─────────────────────────────
function ProtectPromo({ d }: { d: MemberDevice }) {
  if (d.protected) {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0057B8] to-[#009FDB] p-6 text-white">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border-[18px] border-white/15" />
        <h2 className="text-[22px] font-extrabold">You're covered. Relax.</h2>
        <p className="mt-2 max-w-sm text-[14px] text-white/95">
          Repair or replace your {d.brand} {d.name} as soon as the same day.
        </p>
        <Link
          to="/myatt/claims/new"
          search={{ device: d.id } as never}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-[13px] font-bold text-[#0057B8] hover:bg-white/90 hover:no-underline"
        >
          File a claim
        </Link>
      </section>
    );
  }
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#25303A] p-6 text-white">
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border-[18px] border-white/10" />
      <h2 className="text-[22px] font-extrabold">Accidents happen. Have a plan.</h2>
      <p className="mt-2 max-w-sm text-[14px] text-white/90">
        Repair or replace your {d.brand} {d.name} as soon as the same day.
      </p>
      <p className="mt-2 text-[14px] font-bold">Open Enrollment ends Sep 1 2026.</p>
      <Link
        to="/myatt/enroll"
        className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-[13px] font-bold text-[#00388F] hover:bg-white/90 hover:no-underline"
      >
        See my options
      </Link>
    </section>
  );
}

// ── Tab: Device info ─────────────────────────────────────────────────────────
function TabInfo({ d, member }: { d: MemberDevice; member: Member }) {
  const navigate = useNavigate();
  const upgradeReady = (d.installmentsLeft ?? 0) <= 6;
  const addons = [
    {
      label: "AT&T Protect Advantage",
      state: d.protected ? `${getTier(d.tier)?.name} · $${member.tierPrice}/mo` : "Not enrolled",
      on: d.protected,
    },
    { label: "Next Up Anytime", state: d.nextUp ? "Enrolled" : "Not enrolled", on: d.nextUp },
    { label: "ActiveArmor® mobile security", state: "No extra charge", on: true },
    { label: "Wi-Fi Calling", state: "No extra charge", on: true },
  ];

  return (
    <div className="p-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[18px] font-bold">
            {d.owner}
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#0072B2]">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </span>
          </p>
          <p className="mt-1 text-[14px] text-[#454B52]">
            {d.brand} {d.name} · {d.line}
          </p>
          <p className="mt-2 flex items-center gap-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#009FDB] text-white">
              <IconSim className="h-3 w-3" />
            </span>
            <span className="text-[14px] font-bold">SIM card</span>
          </p>
        </div>
        <button
          aria-label="Device options"
          className="grid h-6 w-6 place-items-center rounded-full bg-[#00388F] text-white"
        >
          <IconKebab className="h-4 w-4" />
        </button>
      </div>

      {upgradeReady && (
        <div className="mt-5 rounded-xl border border-[#0072B2] p-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F5FB] px-3 py-1 text-[11px] font-bold text-[#0072B2]">
            <Bell className="h-3.5 w-3.5" /> Upgrade time!
          </span>
          <p className="mt-2 text-[14px] font-bold">
            Your device is eligible to upgrade.{" "}
            <button
              onClick={() => navigate({ to: "/buy/phones" })}
              className="text-[#0072B2] hover:underline"
            >
              Upgrade now ›
            </button>
          </p>
        </div>
      )}

      <h3 className="mt-6 text-[20px] font-extrabold">My add-ons</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {addons.map((a) => (
          <div
            key={a.label}
            className={`flex min-h-[112px] flex-col justify-between rounded-xl border p-3 ${a.on ? "border-[#0072B2] bg-[#F2FAFD]" : "border-[#DCDFE3]"}`}
          >
            <p className="text-[11px] font-bold leading-snug">{a.label}</p>
            <p className={`text-[11px] ${a.on ? "font-bold text-[#0072B2]" : "text-[#686E74]"}`}>
              {a.state}
            </p>
          </div>
        ))}
        <Link
          to="/buy/addons"
          className="flex min-h-[112px] flex-col items-center justify-center rounded-xl border border-[#DCDFE3] p-3 text-center hover:border-[#0072B2] hover:no-underline"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#686E74]">
            <Plus className="h-4 w-4" />
          </span>
          <span className="mt-2 text-[11px] font-bold text-[#0072B2]">Explore other add-ons</span>
        </Link>
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-[#DCDFE3] pt-5 text-[14px] sm:grid-cols-2">
        <Row k="IMEI" v={d.imei} />
        <Row k="Purchased" v={d.purchased} />
        <Row k="Warranty" v={d.warranty} />
        <Row
          k="Installments left"
          v={d.installmentsLeft ? `${d.installmentsLeft} of 36` : "Paid off"}
        />
      </dl>
    </div>
  );
}

// ── Tab: Data use → device health ────────────────────────────────────────────
function TabData({ d }: { d: MemberDevice }) {
  const { addScreenGuard, backupDevice } = useAuth();
  const [busy, setBusy] = useState<"guard" | "backup" | null>(null);
  const riskTone =
    d.screenRisk === "High" ? "#C70032" : d.screenRisk === "Medium" ? "#9E5D00" : "#1F7A3D";

  const fitGuard = () => {
    setBusy("guard");
    setTimeout(() => {
      addScreenGuard(d.id);
      setBusy(null);
    }, 1100);
  };
  const runBackup = () => {
    setBusy("backup");
    setTimeout(() => {
      backupDevice(d.id);
      setBusy(null);
    }, 1300);
  };

  return (
    <div className="p-6">
      <h3 className="text-[20px] font-extrabold">Device health &amp; usage</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Health
          Icon={BatteryFull}
          label="Battery health"
          value={`${d.batteryHealth}%`}
          tone={d.batteryHealth < 80 ? "#C70032" : d.batteryHealth < 85 ? "#9E5D00" : "#1F7A3D"}
        />
        <Health Icon={AlertTriangle} label="Screen risk" value={d.screenRisk} tone={riskTone} />
        <Health
          Icon={d.backedUp ? CloudCheck : CloudOff}
          label="Backup"
          value={d.backedUp ? "Up to date" : "Overdue"}
          tone={d.backedUp ? "#1F7A3D" : "#9E5D00"}
          sub={d.lastBackup}
        />
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-[15px]">
          <span className="font-bold">My usage</span>
          <span className="text-[#454B52]">17 days left</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={62}
          aria-label="62% of data used"
          className="relative my-2 h-2 overflow-hidden rounded-full bg-[#DCDFE3]"
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[#1F7A3D]"
            style={{ width: "62%" }}
          />
        </div>
        <p className="text-[15px]">38.4 GB of Unlimited used</p>
      </div>

      {/* Proactive Care — the two things that actually move this device's score */}
      {d.protected && (!d.screenGuard || !d.backedUp) && (
        <div className="mt-5 space-y-2">
          {!d.screenGuard && d.screenRisk !== "Low" && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#FFF3E0] p-3 text-[14px]">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#9E5D00]" />
              <span className="min-w-0 flex-1">
                {d.screenRisk === "High"
                  ? "This device has a history of impacts. A screen protector is free with your accessory perk."
                  : "No screen protector fitted. One is free with your accessory perk."}
              </span>
              <button
                onClick={fitGuard}
                disabled={busy === "guard"}
                className="btn-secondary shrink-0 text-xs disabled:opacity-60"
              >
                {busy === "guard" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fitting…
                  </span>
                ) : (
                  "Add screen guard"
                )}
              </button>
            </div>
          )}
          {!d.backedUp && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#E7F5FB] p-3 text-[14px]">
              <CloudOff className="h-4 w-4 shrink-0 text-[#0057B8]" />
              <span className="min-w-0 flex-1">
                Last backup {d.lastBackup.toLowerCase()} — Smart Restore can only return what the
                vault holds.
              </span>
              <button
                onClick={runBackup}
                disabled={busy === "backup"}
                className="btn-secondary shrink-0 text-xs disabled:opacity-60"
              >
                {busy === "backup" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Backing up…
                  </span>
                ) : (
                  "Back up now"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {d.screenGuard && (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#EAF7EE] px-3 py-1.5 text-[13px] font-bold text-[#1F7A3D]">
          <Lock className="h-4 w-4" /> Screen guard fitted — risk reduced to{" "}
          {d.screenRisk.toLowerCase()}
        </p>
      )}
    </div>
  );
}

// ── Tab: Device options ──────────────────────────────────────────────────────
function TabOptions({ d }: { d: MemberDevice }) {
  const opts = d.protected
    ? [
        {
          label: "File a claim",
          desc: "Damage, loss, theft or malfunction",
          to: "/myatt/claims/new",
        },
        {
          label: "Manage protection",
          desc: "Tier, covered devices, perks",
          to: "/myatt/protection",
        },
        { label: "Open data vault", desc: "Backups & Smart Restore", to: "/myatt/vault" },
        { label: "Redeem accessory perk", desc: "Free accessory each year", to: "/myatt/perks" },
      ]
    : [
        {
          label: "Protect this device",
          desc: "Damage, loss, theft & malfunction",
          to: "/myatt/enroll",
        },
      ];

  return (
    <div className="p-6">
      {/* Guaranteed trade-in value — locked by the membership, not by the market */}
      {d.protected && (
        <section className="mb-6 rounded-2xl border-2 border-[#0057B8] bg-[#E7F5FB] p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0057B8]">
            <Tag className="h-3.5 w-3.5" /> Guaranteed trade-in value
          </p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums">${d.tradeIn.toLocaleString()}</p>
          <p className="mt-1 text-[14px] text-[#1D2329]">
            Locked for as long as you stay on Protect Advantage — it doesn&rsquo;t fall as the model
            ages. Applied automatically if you upgrade, or if a claim can&rsquo;t be economically
            repaired.
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            <li className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0057B8]" /> No inspection
              haggling — cosmetic wear is already covered
            </li>
            <li className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0057B8]" />{" "}
              {d.nextUp
                ? "Combines with Next Up Anytime for an upgrade any time"
                : "Enroll in Next Up Anytime to upgrade before the term ends"}
            </li>
          </ul>
          <p className="mt-3 text-[12px] text-[#00388F]">
            Device retail today ${d.retail.toLocaleString()} · {d.installmentsLeft} of 36 payments
            left
          </p>
        </section>
      )}

      {d.protected && (
        <div className="mb-6">
          <DeductibleCard device={d} />
        </div>
      )}

      <h3 className="text-[20px] font-extrabold">Device options</h3>
      <div className="mt-4 space-y-2">
        {opts.map((o) => (
          <Link
            key={o.label}
            to={o.to}
            search={{ device: d.id } as never}
            className="flex items-center gap-3 rounded-xl border border-[#DCDFE3] p-4 hover:border-[#0072B2] hover:no-underline"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
              <Camera className="h-5 w-5 text-[#0057B8]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-extrabold">{o.label}</span>
              <span className="block text-[12px] text-[#686E74]">{o.desc}</span>
            </span>
            <IconChevronR className="h-4 w-4 shrink-0 text-[#0072B2]" />
          </Link>
        ))}
      </div>
      <ul className="mt-6 space-y-2 border-t border-[#DCDFE3] pt-4 text-[14px]">
        {["Unlock this device", "Transfer number", "Suspend service", "Report a problem"].map(
          (l) => (
            <li key={l}>
              <a
                href="#"
                className="flex items-center justify-between font-bold text-[#0072B2] hover:underline"
              >
                {l}
                <IconChevronR className="h-4 w-4" />
              </a>
            </li>
          ),
        )}
      </ul>
      <p className="mt-5 flex items-center gap-2 text-[13px] text-[#686E74]">
        {d.protected ? (
          <ShieldCheck className="h-4 w-4 text-[#1F7A3D]" />
        ) : (
          <ShieldOff className="h-4 w-4 text-[#C70032]" />
        )}
        {d.protected ? "Covered by AT&T Protect Advantage" : "This device has no protection"}
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 sm:block">
      <dt className="text-[#686E74]">{k}</dt>
      <dd className="font-bold sm:mt-0.5">{v}</dd>
    </div>
  );
}

function Health({
  Icon,
  label,
  value,
  tone,
  sub,
}: {
  Icon: typeof BatteryFull;
  label: string;
  value: string;
  tone: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[#DCDFE3] p-4">
      <Icon className="h-5 w-5" style={{ color: tone }} />
      <p className="mt-2 text-lg font-extrabold" style={{ color: tone }}>
        {value}
      </p>
      <p className="text-xs text-[#686E74]">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-[#686E74]">{sub}</p>}
    </div>
  );
}
