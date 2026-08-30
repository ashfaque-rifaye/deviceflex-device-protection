import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  ShieldOff,
  Camera,
  Database,
  Users,
  Gift,
  ChevronRight,
  ArrowLeft,
  BadgeCheck,
  FileText,
  Check,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { ProtectionScore } from "@/components/deviceflex/ProtectionScore";
import { OnboardingTour } from "@/components/deviceflex/OnboardingTour";
import { telemetryFor } from "@/data/network-signals";
import { RequireAuth, useAuth } from "@/lib/auth";
import { poolStatus } from "@/lib/ai";
import { DeductibleInline } from "@/components/deviceflex/DeductibleCard";
import { PlanChangeFlow } from "@/components/deviceflex/PlanChangeFlow";
import { TIER_POOL, formatCapacity } from "@/data/member";
import { getTier, TIERS } from "@/data/deviceflex";
import type { Member, MemberDevice } from "@/data/member";

export const Route = createFileRoute("/myatt/protection")({
  validateSearch: (s: Record<string, unknown>) => ({ device: (s.device as string) || "" }),
  component: ProtectionPage,
});

function ProtectionPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />
      <RequireAuth returnTo="/myatt/protection">
        <Manage />
      </RequireAuth>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

function Manage() {
  const { user, changeTier } = useAuth();
  const [confirmTier, setConfirmTier] = useState<"basic" | "plus" | "family" | null>(null);
  const { device: deviceId } = Route.useSearch();
  const m = user as Member;
  const focus = m.devices.find((d) => d.id === deviceId);
  const tier = getTier(m.tier);

  if (!m.enrolled) {
    return (
      <>
        <AccountNav active="Account" />
        <div className="mx-auto max-w-[900px] px-4 py-10 text-center sm:px-6">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FDE9EE]">
            <ShieldOff className="h-7 w-7 text-[#C70032]" />
          </span>
          <h1 className="att-h1 mt-5">No protection on this account</h1>
          <p className="mt-2 text-sm text-[#686E74]">
            You have {m.devices.filter((d) => d.eligible).length} eligible devices that can be
            covered today.
          </p>
          <Link to="/myatt/enroll" className="btn-primary mt-6">
            See protection options
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AccountNav active="Account" />
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10">
        <Link
          to="/myatt"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#0072B2] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to account
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="att-eyebrow">Manage plan</p>
            <h1 className="att-h1 mt-1">AT&amp;T Protect Advantage</h1>
            <p className="att-small mt-1">
              {tier?.name} · ${m.tierPrice}/mo. · {poolStatus(m).label}
            </p>
          </div>
          <Link
            to="/myatt/claims/new"
            search={{ device: "" }}
            className="btn-primary"
            data-tour="claim"
          >
            File a claim
          </Link>
        </div>

        {/* Focused device banner when arriving from a device card */}
        {focus && (
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#00388F] bg-[#E7F5FB] p-5">
            <img src={focus.image} alt={focus.name} className="h-20 w-14 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#686E74]">
                {focus.owner} · {focus.line}
              </p>
              <p className="text-lg font-extrabold">{focus.name}</p>
              <p className="text-sm text-[#0072B2]">
                {focus.protected ? `Covered under Protect Advantage ${tier?.name}` : "Not covered"}{" "}
                · {focus.warranty} · Next Up {focus.nextUp ? "enrolled" : "not enrolled"}
              </p>
            </div>
            <Link to="/myatt/device/$id" params={{ id: focus.id }} className="btn-secondary">
              Device details
            </Link>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div data-tour="score">
              <ProtectionScore member={m} />
            </div>
            <section
              className="rounded-2xl border border-[#DCDFE3] bg-white p-6"
              style={{ boxShadow: "var(--att-shadow-1)" }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F5FB]">
                  <Gift className="h-5 w-5 text-[#0072B2]" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold">Annual accessory perk</h2>
                  <p className="text-xs text-[#686E74]">
                    {m.perks.accessoryCredits > 0
                      ? `${m.perks.accessoryCredits} of ${m.perks.accessoryTotal} free accessor${m.perks.accessoryTotal === 1 ? "y" : "ies"} available`
                      : `All redeemed · resets ${m.perks.resetsOn}`}
                  </p>
                </div>
              </div>
              <Link
                to="/myatt/perks"
                className={
                  m.perks.accessoryCredits > 0
                    ? "btn-primary mt-4 w-full"
                    : "btn-secondary mt-4 w-full"
                }
              >
                {m.perks.accessoryCredits > 0 ? "Redeem now" : "View redemptions"}
              </Link>
            </section>
          </div>

          <div className="space-y-6">
            {/* What's covered */}
            <section
              className="rounded-2xl border border-[#DCDFE3] bg-white p-6"
              style={{ boxShadow: "var(--att-shadow-1)" }}
            >
              <h2 className="att-h4">What your plan covers</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Accidental damage", "Drops, cracked screens, liquid & spills"],
                  ["Loss & theft", "Same-day replacement, line suspended"],
                  ["Out-of-warranty malfunction", "Mechanical & electrical failure"],
                  ["Battery replacement", "Free when health drops below 80%"],
                ].map(([t, s]) => (
                  <div
                    key={t}
                    className="flex items-start gap-3 rounded-xl border border-[#DCDFE3] p-4"
                  >
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1F7A3D]" />
                    <div>
                      <p className="text-sm font-extrabold">{t}</p>
                      <p className="text-xs text-[#686E74]">{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Covered devices */}
            <section
              data-tour="devices"
              className="rounded-2xl border border-[#DCDFE3] bg-white p-6"
              style={{ boxShadow: "var(--att-shadow-1)" }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="att-h4">Devices on this plan</h2>
                <p className="text-xs text-[#686E74]">
                  Your deductible if you claim — known upfront
                </p>
              </div>

              {/* Laid out as the "My Service" tile row rather than a list: a portrait
                  card per line, each with a live network dot. Reading a household at a
                  glance is what this row is for, and a stacked list makes five devices
                  look like a queue rather than a family. */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {m.devices.map((d) => (
                  <DevicePlanTile key={d.id} d={d} />
                ))}
              </div>
            </section>

            {/* Plan actions */}
            <section
              className="rounded-2xl border border-[#DCDFE3] bg-white p-6"
              style={{ boxShadow: "var(--att-shadow-1)" }}
            >
              <h2 className="att-h4">Plan actions</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Action
                  to="/myatt/claims/new"
                  Icon={Camera}
                  title="File a claim"
                  desc="Damage, loss, theft or malfunction"
                />
                <Action
                  to="/myatt/vault"
                  Icon={Database}
                  title="Data vault"
                  desc="Backups & Smart Restore"
                />
                <Action
                  to="/myatt/family"
                  Icon={Users}
                  title="Family devices"
                  desc="Pool, parental controls"
                />
                <Action
                  to="/myatt/perks"
                  Icon={Gift}
                  title="Accessory perk"
                  desc={`${m.perks.accessoryCredits} of ${m.perks.accessoryTotal} credits left`}
                />
              </div>
            </section>

            {/* Claim history — every claim filed on this account */}
            <section
              className="rounded-2xl border border-[#DCDFE3] bg-white p-6"
              style={{ boxShadow: "var(--att-shadow-1)" }}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0072B2]" />
                <h2 className="att-h4">Claim history</h2>
              </div>
              {m.claims.length === 0 ? (
                <p className="mt-3 text-sm text-[#686E74]">No claims yet on this account.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[#DCDFE3]">
                  {m.claims.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold">{c.resolution}</p>
                        <p className="text-xs text-[#686E74]">
                          {c.device} · {c.reason} · {c.date}
                        </p>
                        {c.detail && (
                          <p className="mt-0.5 text-[11px] text-[#686E74]">{c.detail}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          c.status === "Resolved"
                            ? "bg-[#EAF7EE] text-[#1F7A3D]"
                            : c.status === "Booked"
                              ? "bg-[#E7F5FB] text-[#0072B2]"
                              : "bg-[#FFF3E0] text-[#9E5D00]"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#686E74]">{c.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* New, not refurbished — the certificates we have issued */}
            {m.guarantees.length > 0 && (
              <section
                className="rounded-2xl border border-[#DCDFE3] bg-white p-6"
                style={{ boxShadow: "var(--att-shadow-1)" }}
              >
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-[#1F7A3D]" />
                  <h2 className="att-h4">&ldquo;New, not refurbished&rdquo; guarantees</h2>
                </div>
                <p className="att-small mt-1">
                  Every replacement we issue is factory new and sealed. Here is the proof.
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {m.guarantees.map((g) => (
                    <li
                      key={g.id}
                      className="rounded-xl border-2 border-[#BFE3CB] bg-[#EAF7EE] p-4"
                    >
                      <p className="text-sm font-extrabold">{g.deviceName}</p>
                      <p className="mt-1 text-xs text-[#1F7A3D]">{g.condition}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <dt className="text-[#686E74]">Serial</dt>
                          <dd className="font-bold">{g.serial}</dd>
                        </div>
                        <div>
                          <dt className="text-[#686E74]">Issued</dt>
                          <dd className="font-bold">{g.issued}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Tier ladder — a real switch, not a display */}
            <section
              className="rounded-2xl border border-[#DCDFE3] bg-white p-6"
              style={{ boxShadow: "var(--att-shadow-1)" }}
            >
              <h2 className="att-h4">Compare tiers</h2>
              <p className="att-small mt-1">
                Change any time. No contract, no cancellation fee — it takes effect on your next
                bill.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {TIERS.map((t) => {
                  const current = t.id === m.tier;
                  return (
                    <div
                      key={t.id}
                      className={`flex flex-col rounded-xl border p-4 ${current ? "border-[#00388F] bg-[#E7F5FB]" : "border-[#DCDFE3]"}`}
                    >
                      <p className="text-sm font-extrabold">{t.name}</p>
                      <p className="mt-1 text-2xl font-extrabold">
                        ${t.price}
                        <span className="text-xs font-normal text-[#686E74]">/mo.</span>
                      </p>
                      <p className="mt-1 text-xs text-[#686E74]">
                        {t.devices} ·{" "}
                        {formatCapacity(t.id === "family" ? 1024 : t.id === "plus" ? 500 : 50)}{" "}
                        vault
                      </p>
                      {current ? (
                        <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0072B2]">
                          <Check className="h-3.5 w-3.5" /> Your current plan
                        </p>
                      ) : (
                        <button
                          onClick={() => setConfirmTier(t.id)}
                          className="btn-secondary mt-3 text-xs"
                        >
                          Switch to {t.name}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Changing tier is a coverage decision, so it gets a real flow rather than
          a one-click swap — which devices carry over, which can be added, what the
          bill does. */}
      {confirmTier && (
        <PlanChangeFlow
          member={m}
          target={confirmTier}
          onClose={() => setConfirmTier(null)}
          onConfirm={(t, ids) => {
            changeTier(t, ids);
            setConfirmTier(null);
          }}
        />
      )}

      {/* Three steps, on the page that actually rewards explanation. The account
          overview was the wrong home for this: nothing there is unfamiliar, whereas the
          score, the device row and the claim entry all repay a sentence. */}
      <OnboardingTour
        storageKey={`att_tour_protection_v1:${m.userId}`}
        steps={[
          {
            target: '[data-tour="score"]',
            title: "Your protection health, at a glance",
            body: "One score across every covered device — battery, screen risk and backups. It moves the moment you fix something.",
            hint: "Tap the ⓘ beside the score to see what it changes for you.",
          },
          {
            target: '[data-tour="devices"]',
            title: "Every line on the plan",
            body: "Each device shows whether it's covered, whether it's on the network right now, and exactly what a claim would cost — before anything breaks.",
          },
          {
            target: '[data-tour="claim"]',
            title: "When something does happen",
            body: "Filing takes a few minutes. AT&T's own network records help verify what happened, and nothing is suspended without asking you first.",
          },
        ]}
      />
    </>
  );
}

function Action({
  to,
  Icon,
  title,
  desc,
}: {
  to: string;
  Icon: typeof Camera;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-xl border border-[#DCDFE3] p-4 hover:border-[#00388F]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
        <Icon className="h-5 w-5 text-[#0072B2]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{title}</p>
        <p className="text-xs text-[#686E74]">{desc}</p>
      </div>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#0072B2]" />
    </Link>
  );
}

/**
 * One device on the plan, as a tile.
 *
 * Modelled on the "My Service" row in AT&T's support prototype: a portrait card carrying
 * the device, the owner, the line and a coloured dot for whether the line is currently
 * reachable. The dot is not decoration — it reads the same carrier telemetry Mechanism 1
 * uses for claims, so what a member sees here is what the claim engine would see.
 */
function DevicePlanTile({ d }: { d: MemberDevice }) {
  const t = telemetryFor(d.id);
  const online = t ? t.disconnectPattern === "none" || t.activitySinceLastSeen : true;

  return (
    <Link
      to="/myatt/device/$id"
      params={{ id: d.id }}
      className="flex flex-col items-center rounded-2xl border border-[#DCDFE3] p-4 text-center transition-colors hover:border-[#00388F] hover:bg-[#F2FAFD]"
    >
      <img src={d.image} alt="" className="h-24 w-16 object-contain" />
      <p className="mt-2 line-clamp-2 text-sm font-extrabold">
        {d.owner.split(" ")[0]}&rsquo;s {d.name}
      </p>
      <p className="att-small">{d.line}</p>

      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold">
        <span
          className={`h-2 w-2 rounded-full ${online ? "bg-[#1F7A3D]" : "bg-[#C70032]"}`}
          aria-hidden
        />
        <span className={online ? "text-[#1F7A3D]" : "text-[#C70032]"}>
          {online ? "Online · LTE" : "Offline"}
        </span>
      </p>

      <span
        className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
          d.protected ? "bg-[#EAF7EE] text-[#1F7A3D]" : "bg-[#FDE9EE] text-[#C70032]"
        }`}
      >
        {d.protected ? "Covered" : "Not covered"}
      </span>

      {d.protected && (
        <span className="mt-1.5 block">
          <DeductibleInline device={d} />
        </span>
      )}
    </Link>
  );
}
