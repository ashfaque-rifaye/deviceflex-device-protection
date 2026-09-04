import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Lock, ShieldCheck, ShieldOff, Plus, Database, AlertTriangle } from "lucide-react";
import { Button, Modal, StatusPill, Switch } from "@/components/att";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { RequireAuth, RequirePlan, useAuth } from "@/lib/auth";
import { poolStatus, checkEligibility } from "@/lib/ai";
import { deviceVaultGB, formatCapacity, type Member } from "@/data/member";
import { getTier } from "@/data/deviceflex";

export const Route = createFileRoute("/myatt/family")({ component: FamilyPage });

function FamilyPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />
      <RequireAuth returnTo="/myatt/family">
        <AccountNav active="Account" />
        <RequirePlan
          title="The family pool comes with Protect Advantage"
          blurb="Family covers up to 5 devices under one $50/mo. membership — a shared vault, shared perks, and parental controls on kids' devices."
        >
          <Family />
        </RequirePlan>
      </RequireAuth>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

function Family() {
  const { user, setParental, addToPool, removeFromPool } = useAuth();
  const m = user as Member;
  const pool = poolStatus(m);
  const tier = getTier(m.tier);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const covered = m.devices.filter((d) => d.protected);
  const uncovered = m.devices.filter((d) => !d.protected);

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-10">
      <Link to="/myatt" className="text-sm font-bold text-[#0072B2] hover:underline">
        &lt; Back to dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E7F5FB]">
            <Users className="h-5 w-5 text-[#0072B2]" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold md:text-4xl">
              {pool.shareable ? "Family device pool" : "Your covered device"}
            </h1>
            <p className="text-sm text-[#686E74]">
              {pool.label} · AT&amp;T Protect Advantage {tier?.name} · ${m.tierPrice}/mo.
            </p>
          </div>
        </div>
        {!pool.shareable && (
          <Link to="/myatt/protection" search={{ device: "" }} className="btn-secondary">
            Upgrade to Family
          </Link>
        )}
      </div>

      {/* Capacity meter — the pool is a real, finite thing */}
      <section className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-extrabold">
            {pool.used} of {pool.capacity} seat{pool.capacity > 1 ? "s" : ""} used
          </p>
          <p className="text-sm text-[#686E74]">
            {pool.full ? "Pool is full" : `${pool.free} seat${pool.free > 1 ? "s" : ""} available`}
          </p>
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: pool.capacity }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-full ${i < pool.used ? "bg-[#00388F]" : "bg-[#DCDFE3]"}`}
            />
          ))}
        </div>
      </section>

      {/* Covered devices */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {covered.map((d) => {
          const isKid = d.relation === "Child";
          const parental = !!m.parental[d.id];
          return (
            <div
              key={d.id}
              className="flex flex-col rounded-2xl border border-[#DCDFE3] bg-white p-5"
            >
              <div className="flex gap-4">
                <img src={d.image} alt="" className="h-24 w-16 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{d.name}</p>
                  <p className="text-xs text-[#686E74]">
                    {d.owner} · {d.relation}
                  </p>
                  <StatusPill
                    tone="success"
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    className="mt-2"
                  >
                    Covered
                  </StatusPill>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-[#686E74]">
                    <Database className="h-3 w-3" />
                    {d.backedUp ? `${formatCapacity(deviceVaultGB(d))} in vault` : "Not backed up"}
                  </p>
                </div>
              </div>

              {isKid && (
                <div className="mt-4 flex items-center justify-between border-t border-[#DCDFE3] pt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                    <Lock className="h-4 w-4 text-[#0072B2]" /> Parental controls
                  </span>
                  <Switch
                    checked={parental}
                    aria-label={`Parental controls for ${d.name}`}
                    onChange={(e) => setParental(d.id, e.target.checked)}
                  />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3 border-t border-[#DCDFE3] pt-3 text-xs font-bold">
                <Link
                  to="/myatt/device/$id"
                  params={{ id: d.id }}
                  className="text-[#0072B2] hover:underline"
                >
                  Device details
                </Link>
                <Link
                  to="/myatt/claims/new"
                  search={{ device: d.id } as never}
                  className="text-[#0072B2] hover:underline"
                >
                  File a claim
                </Link>
                {pool.shareable && (
                  <button
                    onClick={() => setConfirmRemove(d.id)}
                    className="ml-auto text-[#686E74] hover:text-[#C70032] hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Free seats — real eligibility, real add */}
        {!pool.full &&
          uncovered.length > 0 &&
          uncovered.map((d) => {
            const elig = checkEligibility(d);
            return (
              <div
                key={d.id}
                className="flex flex-col rounded-2xl border-2 border-dashed border-[#0072B2] bg-[#F2FAFD] p-5"
              >
                <div className="flex gap-4">
                  <img
                    src={d.image}
                    alt=""
                    className="h-24 w-16 shrink-0 object-contain opacity-70"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{d.name}</p>
                    <p className="text-xs text-[#686E74]">
                      {d.owner} · {d.relation}
                    </p>
                    <StatusPill
                      tone="danger"
                      icon={<ShieldOff className="h-3.5 w-3.5" />}
                      className="mt-2"
                    >
                      Not covered
                    </StatusPill>
                    <p className="mt-2 text-[11px] text-[#686E74]">{elig.reason}</p>
                  </div>
                </div>
                <button onClick={() => addToPool(d.id)} className="btn-primary mt-4 w-full text-sm">
                  <Plus className="mr-1 inline h-4 w-4" /> Add to pool
                </button>
              </div>
            );
          })}

        {pool.full && (
          <div className="grid place-items-center rounded-2xl border-2 border-dashed border-[#DCDFE3] p-6 text-center text-sm font-bold text-[#686E74]">
            <span>
              <Plus className="mx-auto mb-1 h-6 w-6 text-[#DCDFE3]" />
              Pool full ({pool.used}/{pool.capacity})
              <span className="mt-1 block text-xs font-normal">Remove a device to free a seat</span>
            </span>
          </div>
        )}

        {!pool.full && uncovered.length === 0 && (
          <div className="grid place-items-center rounded-2xl border-2 border-dashed border-[#DCDFE3] p-6 text-center text-sm font-bold text-[#686E74]">
            <span>
              <Plus className="mx-auto mb-1 h-6 w-6 text-[#0072B2]" />
              {pool.free} seat{pool.free > 1 ? "s" : ""} free
              <span className="mt-1 block text-xs font-normal">
                Add a device to your account to use {pool.free > 1 ? "them" : "it"}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-[#E7F5FB] p-5 text-sm">
        <b>Household lock-in:</b> everyone shares one vault, one perk pool, and same-day swaps — the
        reason families stay.
      </div>

      {/* Remove confirmation — this drops coverage, so it asks first */}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove this device from your plan?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmRemove(null)}>
              Keep it covered
            </Button>
            <Button
              className="!bg-[#C70032] hover:!bg-[#A3002A]"
              onClick={() => {
                if (confirmRemove) removeFromPool(confirmRemove);
                setConfirmRemove(null);
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#FDE9EE]">
          <AlertTriangle className="h-6 w-6 text-[#C70032]" />
        </span>
        <p className="att-body text-[#686E74]">
          {m.devices.find((d) => d.id === confirmRemove)?.name} loses cover for damage, loss, theft
          and malfunction immediately. Its vault backup stays until you delete it.
        </p>
      </Modal>
    </div>
  );
}
