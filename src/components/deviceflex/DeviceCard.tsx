// AT&T "My devices" card, rebuilt from att.com device-card markup.
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import {
  IconKebab,
  IconSim,
  IconUnlock,
  IconChevronR,
  IconPhone,
  IconTablet,
  IconWatch,
  IconCar,
} from "./AttIcons";
import type { MemberDevice } from "@/data/member";

const Divider = () => (
  <div className="mx-6">
    <hr className="h-px border-0 bg-[#DCDFE3]" />
  </div>
);

const CtaLink = ({
  children,
  to,
  onClick,
}: {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
}) => {
  const cls = "inline-flex items-center text-[14px] font-bold text-[#0072B2] hover:no-underline";
  const inner = (
    <>
      {children}
      <IconChevronR className="ml-1 h-4 w-4" />
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
};

export function DeviceCard({ d }: { d: MemberDevice }) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const upgradeReady = (d.installmentsLeft ?? 0) <= 6;
  const tierLabel = d.tier === "family" ? "Family" : d.tier === "plus" ? "Plus" : "Basic";

  const addons = [
    ...(d.protected ? [`AT&T Protect Advantage ${tierLabel}`] : []),
    ...(d.nextUp ? ["Next Up Anytime"] : []),
    "ActiveArmor® mobile security",
    "Wi-Fi Calling",
  ];

  return (
    <article
      className="relative flex w-full flex-col rounded-2xl border border-[#DCDFE3] bg-white"
      data-testid={`device-card-${d.id}`}
    >
      {/* Kebab menu */}
      <div className="absolute right-2 top-2 z-10">
        <button
          aria-label={`Options for ${d.name}`}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
          className="grid h-6 w-6 place-items-center rounded-full bg-[#00388F] text-white hover:bg-[#0057B8]"
        >
          <IconKebab className="h-4 w-4" />
        </button>
        {menu && (
          <ul className="absolute right-0 top-8 w-52 overflow-hidden rounded-lg border border-[#DCDFE3] bg-white py-1 text-[14px] shadow-lg">
            {[
              ["Device details", () => navigate({ to: "/myatt/device/$id", params: { id: d.id } })],
              [
                "Manage protection",
                () => navigate({ to: "/myatt/protection", search: { device: d.id } as never }),
              ],
              [
                "File a claim",
                () => navigate({ to: "/myatt/claims/new", search: { device: d.id } as never }),
              ],
            ].map(([label, fn]) => (
              <li key={label as string}>
                <button
                  onClick={() => {
                    setMenu(false);
                    (fn as () => void)();
                  }}
                  className="block w-full px-4 py-2.5 text-left hover:bg-[#F2FAFD] hover:text-[#0072B2]"
                >
                  {label as string}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Identity */}
      <div className="mx-6 mt-6">
        <div className="flex items-start gap-4">
          <img src={d.image} alt="" className="w-[37px] shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[20px] font-bold leading-tight">{d.owner}</h3>
            <p className="mt-0.5 truncate text-[18px] leading-[25px] text-[#454B52]">
              {d.brand} {d.name}
            </p>
            <p className="truncate text-[18px] leading-[25px] text-[#454B52]">{d.line}</p>
            <span className="mt-1 inline-flex items-center text-[#0072B2]">
              <IconUnlock className="h-3 w-3" />
              <span className="pl-1.5 text-[12px] font-bold">Unlock Eligible</span>
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center pb-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#009FDB] text-white">
            <IconSim className="h-4 w-4" />
          </span>
          <span className="pl-1 text-[16px] font-bold">SIM card</span>
        </div>
      </div>

      <Divider />

      {/* Installment */}
      <div className="mx-6 mt-4">
        <h4 className="text-[14px] font-bold leading-[18px]">Installment details</h4>
        <p className="mt-0.5 text-[18px] leading-[25px] text-[#454B52]">
          {upgradeReady
            ? "Yay! Your phone is upgrade ready"
            : `${d.installmentsLeft} of 36 payments left`}
        </p>
        {upgradeReady && (
          <button
            onClick={() => navigate({ to: "/buy/phones" })}
            className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-full bg-[#00388F] px-6 text-[12px] font-bold text-white hover:bg-[#0057B8]"
          >
            Upgrade Now
          </button>
        )}
      </div>

      <div className="mt-4">
        <Divider />
      </div>

      {/* Plan → Protect Advantage */}
      <div className="mx-6 mt-4">
        <Link
          to="/myatt/protection"
          search={{ device: d.id } as never}
          className="flex items-center gap-4 hover:no-underline"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold leading-[18px]">My plan</span>
            <span className="mt-0.5 block truncate text-[18px] leading-[25px] text-[#454B52]">
              {d.protected ? `AT&T Protect Advantage ${tierLabel}` : "No device protection"}
            </span>
          </span>
          <IconChevronR className="h-6 w-6 shrink-0 text-[#1D2329]" />
        </Link>
        <div className="pt-2">
          <CtaLink to="/myatt/protection">
            {d.protected ? "Manage my plan" : "Add protection"}
          </CtaLink>
        </div>
      </div>

      <div className="mt-4">
        <Divider />
      </div>

      {/* Add-ons */}
      <div className="mx-6 mt-4">
        <h4 className="text-[14px] font-bold leading-[18px]">My add-ons</h4>
        <div className="mt-1 space-y-1">
          {addons.map((a) => (
            <a
              key={a}
              href="#"
              className="block truncate text-[15px] font-bold leading-[21px] text-[#0057B8] hover:underline"
            >
              {a}
            </a>
          ))}
        </div>
        <div className="pt-2">
          <CtaLink to="/buy/addons">View and manage add-ons</CtaLink>
        </div>
      </div>

      <div className="mt-4">
        <Divider />
      </div>

      {/* Protection health (AT&T usage-meter pattern) */}
      <div className="mx-6 mt-4">
        <div className="flex justify-between">
          <span className="mr-4 text-[15px] font-bold">Device health</span>
          <span className="text-[15px] text-[#454B52]">Battery {d.batteryHealth}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={d.batteryHealth}
          aria-label={`Battery health ${d.batteryHealth}%`}
          className="relative my-2 h-2 overflow-hidden rounded-full bg-[#DCDFE3]"
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${d.batteryHealth}%`,
              backgroundColor:
                d.batteryHealth < 80 ? "#C70032" : d.batteryHealth < 85 ? "#9E5D00" : "#1F7A3D",
            }}
          />
        </div>
        <p className="text-[15px]">
          Screen risk:{" "}
          <b
            style={{
              color:
                d.screenRisk === "High"
                  ? "#C70032"
                  : d.screenRisk === "Medium"
                    ? "#9E5D00"
                    : "#1F7A3D",
            }}
          >
            {d.screenRisk}
          </b>
          {" · "}
          {d.backedUp ? "Backed up" : "Backup due"}
        </p>
        <div className="pt-1">
          <CtaLink to="/myatt/device/$id">See device details</CtaLink>
        </div>
      </div>

      {/* Footer status + CTA */}
      <div className="mx-6 mb-6 mt-4">
        <p className="mb-3">
          {d.protected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#1F7A3D]">
              <ShieldCheck className="h-3.5 w-3.5" /> Protected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDE9EE] px-2.5 py-0.5 text-[11px] font-bold text-[#C70032]">
              <ShieldOff className="h-3.5 w-3.5" /> Not protected
            </span>
          )}
        </p>
        <Link
          to="/myatt/protection"
          search={{ device: d.id } as never}
          className="inline-flex h-8 w-full items-center justify-center rounded-full border-2 border-[#00388F] px-6 text-[12px] font-bold text-[#00388F] hover:bg-[#0057B8] hover:text-white hover:no-underline"
        >
          Manage wireless
        </Link>
      </div>
    </article>
  );
}

// "Add device" column from the same AT&T panel.
export function AddDevicePanel() {
  const tiles = [
    { Icon: IconPhone, label: "Phone" },
    { Icon: IconTablet, label: "Tablet" },
    { Icon: IconWatch, label: "Smartwatch" },
    { Icon: IconCar, label: "Connected Car" },
  ];
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#0072B2] bg-[#F2FAFD] px-6 py-8">
      <h2 className="text-[20px] font-bold">Add device</h2>
      <ul className="mt-6 w-full">
        {tiles.map(({ Icon, label }) => (
          <li key={label} className="mb-6 text-center last:mb-0">
            <button className="w-full cursor-pointer" aria-label={`Add device ${label}`}>
              <span className="grid place-items-center p-2">
                <Icon className="h-8 w-8 text-[#0057B8]" />
              </span>
              <span className="mt-1 block text-[15px] text-[#0057B8]">{label}</span>
            </button>
          </li>
        ))}
      </ul>
      <Link to="/buy/phones" className="btn-primary mt-6 w-full text-sm">
        Or bring your own device
      </Link>
    </div>
  );
}
