import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  ShieldOff,
  Settings,
  Camera,
  MessageSquare,
  Users,
  Database,
  Activity,
  Gift,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GlobalWidgets } from "@/components/site/GlobalWidgets";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountNav } from "@/components/deviceflex/AccountNav";
import { DeviceCard, AddDevicePanel } from "@/components/deviceflex/DeviceCard";
import { ProtectionScore } from "@/components/deviceflex/ProtectionScore";
import { openChat } from "@/components/site/GlobalWidgets";
import { RequireAuth, useAuth } from "@/lib/auth";
import { getTier } from "@/data/deviceflex";
import type { Member } from "@/data/member";

export const Route = createFileRoute("/myatt/")({ component: MyAtt });

function MyAtt() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1D2329]">
      <SiteHeader />
      <RequireAuth returnTo="/myatt">
        <Overview />
      </RequireAuth>
      <SiteFooter />
      <GlobalWidgets />
    </div>
  );
}

function Overview() {
  const { user } = useAuth();
  const m = user as Member;
  const tier = getTier(m.tier);
  const eligible = m.devices.filter((d) => d.eligible);

  return (
    <>
      <AccountNav active="Account" />
      <div className="bg-[#0057B8] py-2.5 text-center text-sm text-white">
        AT&amp;T will never call you for a one-time PIN.{" "}
        <a href="#" className="font-bold underline">
          Learn safety tips ›
        </a>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#E7F5FB] text-lg font-extrabold text-[#0057B8]">
                {m.firstName[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#686E74]">Welcome back</p>
                <p className="truncate text-2xl font-extrabold leading-tight">
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-xs text-[#686E74]">Account {m.accountNumber}</p>
              </div>
              <Settings className="h-5 w-5 shrink-0 text-[#0057B8]" />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#DCDFE3] pt-4 text-sm font-bold text-[#0057B8]">
              <a href="#" className="hover:underline">
                Manage profile
              </a>
              <span className="text-[#DCDFE3]">|</span>
              <a href="#" className="hover:underline">
                Manage AT&amp;T IDs
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
            <p className="text-sm font-bold text-[#686E74]">Total balance</p>
            <p className="mt-1 text-4xl font-extrabold">{m.balance}</p>
            <p className="mt-1 text-xs text-[#686E74]">AutoPay on · next bill Sep 2</p>
            <div className="mt-4 space-y-2">
              <button className="btn-primary w-full">Make a payment</button>
              <button className="btn-secondary w-full">View bill</button>
            </div>
          </section>

          {/* Protection status — enrolled vs not */}
          {m.enrolled ? (
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0057B8] to-[#009FDB] p-6 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[16px] border-white/15" />
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/90">
                  AT&amp;T Protect Advantage
                </p>
              </div>
              <p className="mt-2 text-2xl font-extrabold">
                {tier?.name} · ${m.tierPrice}/mo.
              </p>
              <p className="mt-1 text-sm text-white/90">
                {m.devices.filter((d) => d.protected).length} devices covered
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/myatt/protection"
                  search={{ device: "" }}
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0057B8] hover:bg-white/90"
                >
                  Manage plan
                </Link>
                <Link
                  to="/myatt/claims/new"
                  search={{ device: "" }}
                  className="inline-flex items-center justify-center rounded-full border border-white px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
                >
                  File a claim
                </Link>
              </div>
            </section>
          ) : (
            <section className="relative overflow-hidden rounded-2xl border-2 border-[#0057B8] bg-white p-6">
              <div className="flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-[#C70032]" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
                  Device protection
                </p>
              </div>
              <p className="mt-2 text-2xl font-extrabold">You're not protected</p>
              <p className="mt-1 text-sm text-[#686E74]">
                {eligible.length} eligible device{eligible.length !== 1 && "s"} on your account can
                be covered against damage, loss, theft and malfunction.
              </p>
              <Link to="/myatt/enroll" className="btn-primary mt-4 w-full">
                See protection options
              </Link>
            </section>
          )}
        </div>

        {/* Protection Score — Proactive Care, as a proper tile on the dashboard */}
        {m.enrolled && (
          <section className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="att-h3">Your protection health</h2>
              <Link to="/myatt/protection" search={{ device: "" }} className="link-blue text-sm">
                Manage protection
              </Link>
            </div>
            <div className="mt-4">
              <ProtectionScore member={m} compact limit={3} />
            </div>
          </section>
        )}

        {/* I need to */}
        <section className="mt-6 rounded-2xl border border-[#DCDFE3] bg-white p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="att-h4">I need to:</span>
            {m.enrolled && <Quick to="/myatt/claims/new" Icon={Camera} label="File a claim" />}
            <ChatQuick />
            {m.enrolled ? (
              <Quick to="/myatt/protection" Icon={ShieldCheck} label="Manage protection" />
            ) : (
              <Quick to="/myatt/enroll" Icon={ShieldCheck} label="Get protection" />
            )}
            {m.enrolled && m.perks.accessoryCredits > 0 && (
              <Quick
                to="/myatt/perks"
                Icon={Gift}
                label={`Redeem accessory (${m.perks.accessoryCredits})`}
              />
            )}
            {m.enrolled && <Quick to="/myatt/family" Icon={Users} label="Manage family" />}
            {m.enrolled && <Quick to="/myatt/vault" Icon={Database} label="Data vault" />}
            <Quick to="/myatt" Icon={Activity} label="Review my usage" />
          </div>
        </section>

        {/* My devices — AT&T style, each with Manage Plan */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="att-h3">My devices</h2>
            {m.enrolled && (
              <Link to="/myatt/family" className="text-sm font-bold text-[#0057B8] hover:underline">
                Manage family &gt;
              </Link>
            )}
          </div>
          <div className="mt-4 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {m.devices.map((d) => (
              <DeviceCard key={d.id} d={d} />
            ))}
            <AddDevicePanel />
          </div>
        </section>
      </div>
    </>
  );
}

function Quick({ to, Icon, label }: { to: string; Icon: typeof Camera; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-[#DCDFE3] px-4 py-2 text-sm font-bold hover:border-[#0057B8]"
    >
      <Icon className="h-4 w-4 text-[#0057B8]" /> {label}
    </Link>
  );
}
function ChatQuick() {
  return (
    <button
      onClick={openChat}
      className="inline-flex items-center gap-2 rounded-full border border-[#DCDFE3] px-4 py-2 text-sm font-bold hover:border-[#0057B8]"
    >
      <MessageSquare className="h-4 w-4 text-[#0057B8]" /> Chat with us
    </button>
  );
}
