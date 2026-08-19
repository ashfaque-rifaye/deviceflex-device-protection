// AT&T "Welcome back!" account mega hover-tray, rebuilt from att.com markup.
import { Link, useNavigate } from "@tanstack/react-router";
import { IconSwitchUser, TraySwoosh } from "./AttIcons";
import { useAuth } from "@/lib/auth";
import { ACCOUNTS } from "@/data/member";

type Col = { title: string; links: { label: string; to?: string; badge?: number }[] };

export function AccountTray({ onClose }: { onClose: () => void }) {
  const { user, logout, switchUser } = useAuth();
  const navigate = useNavigate();
  const other = ACCOUNTS.find((a) => a.userId !== user?.userId);

  const cols: Col[] = [
    {
      title: "Account overview",
      links: [
        { label: "Check my notifications", badge: 4 },
        { label: "Go to my account", to: "/myatt" },
        { label: "Update my profile" },
        { label: "View my orders & claims", to: "/myatt/claims/new" },
        { label: "Go to my prepaid account" },
      ],
    },
    {
      title: "Bill & payments",
      links: [{ label: "Make a payment" }, { label: "See my bill" }],
    },
    {
      title: "Protect Advantage",
      links: user?.enrolled
        ? [
            { label: "Manage my protection", to: "/myatt/protection" },
            { label: "File a claim", to: "/myatt/claims/new" },
            { label: "Redeem accessory perk", to: "/myatt/perks" },
            { label: "Open my data vault", to: "/myatt/vault" },
          ]
        : [
            { label: "See protection options", to: "/myatt/enroll" },
            { label: "What's covered", to: "/deviceflex" },
          ],
    },
  ];

  return (
    <div
      role="navigation"
      aria-label="Welcome back! menu"
      className="flex overflow-hidden rounded-2xl bg-white"
      style={{
        boxShadow:
          "0 4px 12px rgba(37,48,58,.16), 0 6px 8px -2px rgba(37,48,58,.06), 0 10px 10px rgba(37,48,58,.05)",
      }}
    >
      {/* Left aside */}
      <aside
        className="relative flex shrink-0 flex-col border-r border-[#DCDFE3] pb-6 pl-6 pr-5 pt-4"
        style={{ minWidth: 222 }}
      >
        <h2 className="pb-2 pr-2 text-[26px] font-black leading-tight tracking-[-0.03em]">
          Welcome back!
        </h2>
        <div className="pt-1">
          <button
            onClick={() => {
              if (other) {
                switchUser(other.userId);
                onClose();
                navigate({ to: "/myatt" });
              }
            }}
            className="inline-flex h-8 items-center justify-center rounded-full border-2 border-[#00388F] px-6 text-[12px] font-bold text-[#00388F] transition hover:border-[#0057B8] hover:bg-[#0057B8] hover:text-white"
          >
            <span className="mr-2 inline-flex">
              <IconSwitchUser className="h-5 w-5" />
            </span>
            Switch user
          </button>
          {other && (
            <p className="mt-2 max-w-[180px] text-[11px] leading-snug text-[#686E74]">
              Switch to <b>{other.userId}</b> — {other.enrolled ? "enrolled" : "not enrolled"}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            logout();
            onClose();
            navigate({ to: "/" });
          }}
          className="mt-auto self-start pt-8 text-[15px] font-bold text-[#0072B2] hover:underline"
        >
          Sign out &nbsp;›
        </button>
      </aside>

      {/* Right panel */}
      <div className="relative w-full min-w-0">
        <div className="ml-6 mr-2 mt-4">
          <nav
            aria-label="Quick actions"
            className="flex flex-wrap items-center border-b border-[#DCDFE3] pb-4"
          >
            <span className="pr-4 text-[14px] font-bold">Quick actions</span>
            {["&More Benefits", "My favorites", "Privacy choices"].map((q, i, arr) => (
              <a
                key={q}
                href="#"
                className={`relative mr-3 pr-3 text-[12px] font-bold text-[#0072B2] hover:underline ${i < arr.length - 1 ? "after:absolute after:right-0 after:top-1/2 after:h-4 after:w-px after:-translate-y-1/2 after:bg-[#E6E9EC]" : ""}`}
              >
                {q}
              </a>
            ))}
          </nav>
        </div>

        <div className="ml-6 mt-5 flex gap-8 pb-6 pr-[240px]">
          {cols.map((col) => (
            <section key={col.title} className="min-w-[150px] flex-1">
              <h3 className="mb-2 text-[16px] font-bold leading-tight">{col.title}</h3>
              <ul className="text-[15px]">
                {col.links.map((l) => (
                  <li key={l.label} className="mt-3">
                    {l.to ? (
                      <Link
                        to={l.to}
                        onClick={onClose}
                        className="leading-none text-[#1D2329] no-underline hover:text-[#0072B2] hover:underline"
                      >
                        <span>{l.label}</span>
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className="leading-none text-[#1D2329] no-underline hover:text-[#0072B2] hover:underline"
                      >
                        <span>{l.label}</span>
                      </a>
                    )}
                    {l.badge && (
                      <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C70032] px-1.5 text-[14px] font-bold leading-none text-white">
                        {l.badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Decorative swoosh */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 z-0 flex h-full items-center justify-center overflow-hidden"
        >
          <TraySwoosh className="h-full" />
        </div>
      </div>
    </div>
  );
}
