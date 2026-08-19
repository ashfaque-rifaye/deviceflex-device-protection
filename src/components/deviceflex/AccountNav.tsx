import { Link } from "@tanstack/react-router";
import {
  IconAccount,
  IconPayments,
  IconBilling,
  IconServices,
  IconProfile,
  IconSecurity,
  IconBenefits,
} from "./AttIcons";

type Item = { label: string; Icon: typeof IconAccount; to?: string };

const ITEMS: Item[] = [
  { label: "Account", Icon: IconAccount, to: "/myatt" },
  { label: "Payments", Icon: IconPayments },
  { label: "Billing", Icon: IconBilling },
  { label: "Services", Icon: IconServices, to: "/myatt/protection" },
  { label: "Profile", Icon: IconProfile },
  { label: "Security", Icon: IconSecurity },
  { label: "&More Benefits", Icon: IconBenefits },
];

export function AccountNav({ active = "Account" }: { active?: string }) {
  return (
    <div className="border-b border-[#DCDFE3] bg-white">
      <nav
        aria-label="Account sections"
        className="mx-auto flex max-w-[1280px] flex-nowrap justify-start overflow-x-auto px-4 sm:justify-center sm:px-6 lg:px-10
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ITEMS.map(({ label, Icon, to }) => {
          const isActive = label === active;
          const inner = (
            <>
              <Icon className="mb-1 h-8 w-8" />
              <span className="text-[12px] font-bold leading-none">{label}</span>
              <span
                className="mt-2 h-[3px] w-full rounded-[2px] transition-colors"
                style={{ backgroundColor: isActive ? "#009FDB" : "transparent" }}
              />
            </>
          );
          const cls =
            "group flex min-w-[120px] shrink-0 flex-col items-center px-1 pt-4 text-center text-[#1D2329] hover:no-underline";
          return to ? (
            <Link key={label} to={to} className={cls} aria-current={isActive ? "page" : undefined}>
              {inner}
            </Link>
          ) : (
            <a key={label} href="#" className={cls}>
              {inner}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
