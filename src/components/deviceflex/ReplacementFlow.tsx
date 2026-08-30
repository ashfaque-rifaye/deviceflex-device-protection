// The replacement / upgrade journey, modelled on Asurion's real phoneclaim.com/att flow.
//
// Once a claim is approved, Asurion runs three screens before the order is placed:
//
//   1. "Now, let's get you back up and running!" — replace with the same or similar
//      model, or upgrade to something else. Both cost the SAME deductible; they differ
//      in what you end up holding and whose warranty covers it.
//   2. "Choose your replacement device" — a grid with the closest match surfaced first,
//      each card carrying rating, colours and an "as low as" monthly.
//   3. "Billing and payment" — split into Due today (tax, accessories) and Due monthly
//      (installments, plan, protection), because the deductible itself goes onto the
//      AT&T bill over the next one or two cycles rather than being charged at checkout.
//
// That split is the part worth copying. A customer's real question after a loss is not
// "how much is the deductible" but "what am I paying, and when" — and answering it here
// is what stops the claim ending on an unpleasant surprise.
import { useMemo, useState } from "react";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Star,
  ShieldCheck,
  Truck,
  Sparkles,
  Package,
  Receipt,
} from "lucide-react";
import type { MemberDevice } from "@/data/member";
import { DEVICES } from "@/data/devices";
import { deductibleFor, ASURION } from "@/data/deductibles";

export type ReplacementChoice = {
  path: "replace" | "upgrade";
  deviceName: string;
  colorName: string;
  image: string;
  storage: string;
  monthly: number;
  deductible: number;
  salesTax: number;
};

/** Sales tax is charged on the full retail value of the replacement, and it is due today. */
const TAX_RATE = 0.0825;

export function ReplacementFlow({
  device,
  onDone,
  onBack,
}: {
  device: MemberDevice;
  onDone: (choice: ReplacementChoice) => void;
  onBack: () => void;
}) {
  const [sub, setSub] = useState(0);
  const [path, setPath] = useState<"replace" | "upgrade">("replace");
  const [pickSlug, setPickSlug] = useState<string | null>(null);
  const [colorIdx, setColorIdx] = useState(0);

  const fee = deductibleFor(device, "replacement");
  const upgradeFee = deductibleFor(device, "upgrade");

  // The closest match is the same model. An upgrade widens the field to everything else
  // in the catalogue, which is exactly how Asurion frames the two paths.
  const same = DEVICES.find((d) => d.name === device.name);
  const catalogue = useMemo(() => {
    if (path === "replace") return same ? [same] : DEVICES.slice(0, 3);
    return DEVICES.filter((d) => d.name !== device.name).slice(0, 6);
  }, [path, same, device.name]);

  const picked = catalogue.find((d) => d.slug === pickSlug) ?? catalogue[0];
  const color = picked?.colors[Math.min(colorIdx, (picked?.colors.length ?? 1) - 1)];
  const monthly = Math.round((device.retail / 36) * 100) / 100;
  const salesTax = Math.round(device.retail * TAX_RATE * 100) / 100;
  const deductible = path === "upgrade" ? upgradeFee.amount : fee.amount;

  return (
    <div>
      {/* Sub-stepper — Asurion labels these "Step n of 3". */}
      <ol className="flex items-center gap-2 text-xs font-bold">
        {["Pick your path", "Pick your device", "Billing"].map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                i < sub
                  ? "bg-[#00388F] text-white"
                  : i === sub
                    ? "border border-[#00388F] text-[#00388F]"
                    : "border border-[#DCDFE3] text-[#878C94]"
              }`}
            >
              {i < sub ? "✓" : i + 1}
            </span>
            <span className={i === sub ? "text-[#00388F]" : "text-[#686E74]"}>{s}</span>
            {i < 2 && <span className="text-[#DCDFE3]">·</span>}
          </li>
        ))}
      </ol>

      {/* ── 1 · Replace or upgrade ───────────────────────────────────── */}
      {sub === 0 && (
        <div className="mt-5">
          <h2 className="att-h3">Now, let&rsquo;s get you back up and running</h2>
          <p className="att-small mt-1">
            Choose whether to replace or upgrade your device. Both carry the same deductible — what
            changes is the device you end up with and whose warranty covers it.
          </p>

          <div className="mt-4 space-y-3">
            <PathCard
              active={path === "replace"}
              onSelect={() => setPath("replace")}
              title="Replace your device"
              blurb={`Replace your ${device.name} with the same or a similar model. Nothing about your plan or your monthly payment changes.`}
              rows={[
                ["Deductible", `$${fee.amount.toFixed(2)}`],
                ["Warranty", "1 year — AT&T warranty"],
                ["Time", "Same-day in store, or 1–2 days shipped"],
              ]}
            />
            <PathCard
              active={path === "upgrade"}
              onSelect={() => setPath("upgrade")}
              title="Upgrade to a new device"
              blurb="Upgrade to the latest model or a different device of your choice. Your monthly installment changes to match the new device."
              rows={[
                ["Deductible", `$${upgradeFee.amount.toFixed(2)}`],
                ["Warranty", "1 year — manufacturer's warranty"],
                ["Time", "Same-day in store, or 1–2 days shipped"],
              ]}
            />
          </div>

          <p className="att-small mt-4 flex items-start gap-2 rounded-xl bg-[#F3F4F6] p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00388F]" />
            Whichever you choose, your replacement is new — not refurbished — and your number, your
            vault and your coverage carry over untouched.
          </p>

          <Foot
            onBack={onBack}
            onNext={() => {
              setPickSlug(catalogue[0]?.slug ?? null);
              setSub(1);
            }}
            nextLabel="Choose a device"
          />
        </div>
      )}

      {/* ── 2 · Choose the device ────────────────────────────────────── */}
      {sub === 1 && (
        <div className="mt-5">
          <h2 className="att-h3">
            {path === "replace" ? "Choose your replacement device" : "Choose your new device"}
          </h2>
          <p className="att-small mt-1">
            {path === "replace"
              ? "These are the same or similar to what you had, so your payment doesn't change."
              : "Pick anything in the range. Your installment updates to match."}
          </p>

          {/* Current device, for comparison — Asurion pins this to the top. */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#DCDFE3] bg-[#F3F4F6] p-3">
            <img src={device.image} alt="" className="h-14 w-10 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="att-small font-bold text-[#686E74]">Current device</p>
              <p className="text-sm font-extrabold">{device.name}</p>
              <p className="att-small">
                {device.color} · {device.storage}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {catalogue.map((d, i) => {
              const on = d.slug === (picked?.slug ?? "");
              return (
                <button
                  key={d.slug}
                  onClick={() => {
                    setPickSlug(d.slug);
                    setColorIdx(0);
                  }}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    on
                      ? "border-[#00388F] ring-2 ring-[#00388F]/25"
                      : "border-[#DCDFE3] hover:border-[#00388F]"
                  }`}
                >
                  {i === 0 && (
                    <span className="inline-block rounded-full bg-[#E7F5FB] px-2.5 py-0.5 text-[11px] font-bold text-[#0072B2]">
                      {path === "replace" ? "Closest match" : "Most popular"}
                    </span>
                  )}
                  <img
                    src={d.colors[0]?.gallery[0] ?? device.image}
                    alt=""
                    className="mx-auto my-2 h-28 object-contain"
                  />
                  <p className="att-small flex items-center gap-1">
                    {d.brand}
                    <Star className="h-3 w-3 fill-[#009FDB] text-[#009FDB]" />
                    <span className="font-bold text-[#1D2329]">{d.rating}</span>
                  </p>
                  <p className="text-sm font-extrabold">{d.name}</p>
                  <p className="att-small">{device.storage}</p>
                  <div className="mt-2 flex gap-1.5">
                    {d.colors.map((c, ci) => (
                      <span
                        key={c.slug}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickSlug(d.slug);
                          setColorIdx(ci);
                        }}
                        title={c.name}
                        className={`h-4 w-4 cursor-pointer rounded-full border ${
                          on && ci === colorIdx ? "ring-2 ring-[#00388F] ring-offset-1" : ""
                        }`}
                        style={{ background: c.hex, borderColor: "#DCDFE3" }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-bold">
                    As low as {path === "replace" ? `$${monthly.toFixed(2)}/mo.` : d.price}
                  </p>
                </button>
              );
            })}
          </div>

          <Foot
            onBack={() => setSub(0)}
            onNext={() => setSub(2)}
            nextDisabled={!picked}
            nextLabel="Continue to billing"
          />
        </div>
      )}

      {/* ── 3 · Billing ──────────────────────────────────────────────── */}
      {sub === 2 && picked && (
        <div className="mt-5">
          <h2 className="att-h3">Billing and payment</h2>
          <p className="att-small mt-1">
            Your ${deductible.toFixed(2)} deductible is applied to your AT&amp;T Wireless bill over
            the next 1–2 bill periods. Deductibles are non-refundable and taxes may apply.
          </p>

          <div className="mt-4 rounded-2xl border border-[#DCDFE3]">
            <Group
              title="Due today"
              total={salesTax}
              rows={[
                ["Accessories", 0, "One-time payment"],
                ["Sales tax", salesTax, "One-time payment, on the full device value"],
              ]}
            />
            <div className="h-px bg-[#DCDFE3]" />
            <Group
              title="Due monthly"
              total={monthly + 85 + 17 - 10}
              rows={[
                ["Device installments", monthly, "Recurring payment"],
                ["AT&T Unlimited Premium plan", 85, "Recurring payment"],
                ["AT&T Protect Advantage", 17, "Recurring payment"],
                ["AutoPay and paperless billing discount", -10, "Recurring credit"],
              ]}
            />
            <div className="h-px bg-[#DCDFE3]" />
            <div className="flex items-start gap-2 p-4">
              <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-[#00388F]" />
              <p className="att-small">
                The ${deductible.toFixed(2)} deductible is billed separately by {ASURION.short} on
                your AT&amp;T Wireless bill — it is not charged today.
              </p>
            </div>
          </div>

          <Foot
            onBack={() => setSub(1)}
            onNext={() =>
              onDone({
                path,
                deviceName: picked.name,
                colorName: color?.name ?? "",
                image: color?.gallery[0] ?? device.image,
                storage: device.storage,
                monthly:
                  path === "replace"
                    ? monthly
                    : Number(picked.price.replace(/[^0-9.]/g, "")) || monthly,
                deductible,
                salesTax,
              })
            }
            nextLabel="Place my order"
          />
        </div>
      )}
    </div>
  );
}

function PathCard({
  active,
  onSelect,
  title,
  blurb,
  rows,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  blurb: string;
  rows: Array<[string, string]>;
}) {
  return (
    <button
      onClick={onSelect}
      className={`block w-full rounded-2xl border p-4 text-left transition-colors ${
        active
          ? "border-[#00388F] ring-2 ring-[#00388F]/25"
          : "border-[#DCDFE3] hover:border-[#00388F]"
      }`}
    >
      <span className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
            active ? "border-[#00388F]" : "border-[#878C94]"
          }`}
        >
          {active && <span className="h-2.5 w-2.5 rounded-full bg-[#00388F]" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">{title}</span>
          <span className="att-small mt-0.5 block">{blurb}</span>
          <span className="mt-3 block divide-y divide-[#DCDFE3] border-t border-[#DCDFE3]">
            {rows.map(([k, v]) => (
              <span key={k} className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-[#686E74]">{k}</span>
                <span className="font-bold text-[#1D2329]">{v}</span>
              </span>
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}

function Group({
  title,
  total,
  rows,
}: {
  title: string;
  total: number;
  rows: Array<[string, number, string]>;
}) {
  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-extrabold">{title}</p>
        <p className="text-lg font-extrabold">${total.toFixed(2)}</p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {rows.map(([k, v, note]) => (
          <li key={k} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block">{k}</span>
              <span className="att-small block">{note}</span>
            </span>
            <span className={`shrink-0 font-bold ${v < 0 ? "text-[#1F7A3D]" : ""}`}>
              {v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Foot({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button onClick={onBack} className="btn-secondary">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <button onClick={onNext} disabled={nextDisabled} className="btn-primary disabled:opacity-50">
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** "Get ready to meet your new phone!" — the order confirmation. */
export function ReplacementConfirmed({
  choice,
  device,
  email,
}: {
  choice: ReplacementChoice;
  device: MemberDevice;
  email: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DCDFE3] bg-white p-6">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#EAF7EE]">
        <Sparkles className="h-6 w-6 text-[#1F7A3D]" />
      </span>
      <h2 className="att-h3 mt-4">Get ready to meet your new phone</h2>
      <p className="att-small mt-1.5">
        We&rsquo;re working on your {choice.path === "upgrade" ? "upgrade" : "replacement"}.
        You&rsquo;ll get it as soon as the next business day, and a confirmation email is on its way
        to <b className="text-[#1D2329]">{email}</b>.
      </p>

      <p className="mt-5 text-sm font-extrabold">
        Your {choice.path === "upgrade" ? "new" : "replacement"} device
      </p>
      <div className="mt-2 flex items-start gap-4 rounded-xl border border-[#DCDFE3] p-4">
        <img src={choice.image} alt="" className="h-20 w-14 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="att-small">{device.line}</p>
          {choice.path === "upgrade" && (
            <span className="inline-block rounded-full bg-[#E7F5FB] px-2 py-0.5 text-[11px] font-bold text-[#0072B2]">
              Upgrade
            </span>
          )}
          <p className="mt-0.5 text-sm font-extrabold">{choice.deviceName}</p>
          <p className="att-small">
            {choice.colorName} · {choice.storage} · ${choice.monthly.toFixed(2)}/mo.
          </p>
          <p className="att-small mt-2">
            Your original device: {device.name} {device.storage} — {device.color}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-xl bg-[#F3F4F6] p-3">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#00388F]" />
          <p className="att-small">
            <b className="block text-[#1D2329]">Delivery</b>
            456 Riverside Dr, Winter Park, FL — next business day
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-[#F3F4F6] p-3">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-[#00388F]" />
          <p className="att-small">
            <b className="block text-[#1D2329]">Return the old one</b>
            Only if it turns up. A prepaid label is in the box — the ${850} non-return fee only
            applies to a device you still have.
          </p>
        </div>
      </div>

      <p className="att-small mt-4 flex items-start gap-2">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1F7A3D]" />${choice.salesTax.toFixed(2)}{" "}
        sales tax was charged today. Your ${choice.deductible.toFixed(2)} deductible appears on your
        next AT&amp;T Wireless bill.
      </p>
    </div>
  );
}
