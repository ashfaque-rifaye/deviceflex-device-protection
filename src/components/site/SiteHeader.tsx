import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AccountTray } from "@/components/deviceflex/AccountTray";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import { AttLogo } from "@/components/AttLogo";
import {
  SearchIcon,
  SearchChatIcon,
  CartIcon,
  AccountIcon,
  NavChevron,
} from "@/components/site/NavIcons";
import { openChat } from "@/components/site/GlobalWidgets";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { MEGA_NAV, type MegaMenu, type MegaLink } from "@/data/meganav";
import shopBackToSchool from "@/assets/hero-internet-air.jpg";
import iphonePromo from "@/assets/phone-iphone17pro.jpg";

const NAV = ["Shop", "Deals", "AT&T Difference", "Support"] as const;
type NavLabel = (typeof NAV)[number];

// Official AT&T header nav icons (svg-base colored via styles.css)
const NAV_ICONS: Record<NavLabel, string> = {
  Shop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path class="svg-base" d="M22 8V7a6 6 0 00-12 0v1H4v20a3 3 0 003 3h18a3 3 0 003-3V8zM12 7a4 4 0 018 0v1h-8zm14 21a1 1 0 01-1 1H7a1 1 0 01-1-1V10h4v4h2v-4h8v4h2v-4h4z"></path></svg>`,
  Deals: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path class="svg-base" d="M29.16 12.54A6.39 6.39 0 0128 11a7.08 7.08 0 01-.29-2 5.28 5.28 0 00-1.11-3.66A5.28 5.28 0 0023 4.28 7.08 7.08 0 0121 4a6.39 6.39 0 01-1.52-1.15A5.38 5.38 0 0016 1a5.38 5.38 0 00-3.46 1.84A6.39 6.39 0 0111 4a7.08 7.08 0 01-2 .29 5.28 5.28 0 00-3.61 1.1 5.28 5.28 0 00-1.11 3.66A7.08 7.08 0 014 11a6.39 6.39 0 01-1.15 1.52A5.38 5.38 0 001 16a5.38 5.38 0 001.84 3.46A6.39 6.39 0 014 21a7.08 7.08 0 01.29 2 5.28 5.28 0 001.11 3.66 5.28 5.28 0 003.66 1.11A7.08 7.08 0 0111 28a6.39 6.39 0 011.52 1.15A5.38 5.38 0 0016 31a5.38 5.38 0 003.46-1.84A6.39 6.39 0 0121 28a7.08 7.08 0 012-.29 5.28 5.28 0 003.66-1.11 5.28 5.28 0 001.06-3.6 7.08 7.08 0 01.28-2 6.39 6.39 0 011.15-1.52A5.38 5.38 0 0031 16a5.38 5.38 0 00-1.84-3.46zm-1.48 5.58a7.42 7.42 0 00-1.51 2.09 8 8 0 00-.44 2.63 4 4 0 01-.54 2.35 4 4 0 01-2.35.54 8 8 0 00-2.63.44 7.42 7.42 0 00-2.09 1.51C17.37 28.36 16.66 29 16 29s-1.37-.64-2.12-1.32a7.42 7.42 0 00-2.09-1.51 8 8 0 00-2.63-.44 4 4 0 01-2.35-.54 4 4 0 01-.54-2.35 8 8 0 00-.44-2.63 7.42 7.42 0 00-1.51-2.09C3.64 17.37 3 16.66 3 16s.64-1.37 1.32-2.12a7.42 7.42 0 001.51-2.09 8 8 0 00.44-2.63 4 4 0 01.54-2.35 4 4 0 012.35-.54 8 8 0 002.63-.44 7.42 7.42 0 002.09-1.51C14.63 3.64 15.34 3 16 3s1.37.64 2.12 1.32a7.42 7.42 0 002.09 1.51 8 8 0 002.63.44 4 4 0 012.35.54 4 4 0 01.54 2.35 8 8 0 00.44 2.63 7.42 7.42 0 001.51 2.09c.68.75 1.32 1.46 1.32 2.12s-.64 1.37-1.32 2.12zm-6.68.37A3.59 3.59 0 0117.34 22H17v2h-2v-2h-3v-2h5.34a1.51 1.51 0 100-3h-2.68A3.58 3.58 0 0111 13.51 3.52 3.52 0 0114.52 10H15V8h2v2h3v2h-5.48A1.51 1.51 0 0013 13.49 1.59 1.59 0 0014.66 15h2.68A3.58 3.58 0 0121 18.49z"></path></svg>`,
  "AT&T Difference": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path class="svg-base" d="m23 9h-14l-7.2 7 14.3 14.4 14.2-14.4-7.2-7zm-11 6 2.1-4h3.8l2.1 4zm8.2 2-4.1 9.5-4-9.5h8.2zm-10.4 0 3.2 7.5-7.5-7.5zm12.5 0h4l-7.3 7.4 3.2-7.4zm4-2h-3.9l-2.1-4h2l4.1 4zm-16.6-4h2.1l-2.1 4h-4.2l4.1-4zm7.3-5h-2v-4h2zm8.1 2.2-1.4-1.4 2.8-2.8 1.4 1.4zm-18.4 0-2.8-2.8 1.4-1.4 2.8 2.8z"></path></svg>`,
  Support: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path class="svg-base" d="M16 1a15 15 0 1015 15A15 15 0 0016 1zm0 28a13 13 0 1113-13 13 13 0 01-13 13zm-1-7h2v2h-2zm5.92-9.18a4.59 4.59 0 01-2 3.64l-.22.18C17.43 17.67 17 18 17 19.29V20h-2v-.71c0-2.23 1.07-3.1 2.43-4.2l.23-.19a2.59 2.59 0 001.26-2.08c0-1.68-1.85-1.81-2.42-1.81a4.94 4.94 0 00-3.29 1.43L11.86 11a6.94 6.94 0 014.64-2c2.64 0 4.42 1.54 4.42 3.82z"></path></svg>`,
};

export function SiteHeader({ cartCount }: { cartCount?: number }) {
  const [mobile, setMobile] = useState(false);
  const [openMenu, setOpenMenu] = useState<NavLabel | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [rail, setRail] = useState(0);
  const signInRef = useRef<HTMLDivElement>(null);
  const { isAuthed, user } = useAuth();
  const { count } = useCart();
  // Explicit count wins (the buy flow sets its own); otherwise show the real cart.
  const badge = cartCount ?? count;
  const navigate = useNavigate();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (signInRef.current && !signInRef.current.contains(e.target as Node)) setSignInOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <>
      {/* Utility bar */}
      <div className="border-b border-[#DCDFE3] bg-[#F3F4F6]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="relative flex h-10 items-center">
            <div className="flex items-end gap-6 text-sm">
              <button className="relative py-2.5 font-bold text-[#1D2329]">
                Personal
                <span className="absolute inset-x-0 -bottom-px h-[2px] bg-[#1D2329]" />
              </button>
              <button className="py-2.5 font-medium text-[#686E74] hover:text-[#1D2329]">
                Business
              </button>
            </div>
            <div className="absolute right-0 hidden items-center gap-5 text-xs font-semibold text-[#1D2329] sm:flex">
              <a href="#" className="hover:text-[#0072B2]">
                Find a store
              </a>
              <a href="#" className="hover:text-[#0072B2]">
                Ver en español
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-40 border-b border-[#DCDFE3] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="flex h-[72px] items-center gap-8">
            <Link to="/" className="flex shrink-0 items-center" aria-label="AT&T home">
              <AttLogo height={30} />
            </Link>

            <nav className="hidden flex-1 items-center gap-1 lg:flex">
              {NAV.map((label) => {
                const active = openMenu === label;
                return (
                  <button
                    key={label}
                    onClick={() => {
                      setRail(0);
                      setOpenMenu(active ? null : label);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-bold ${
                      active ? "bg-[#E7F5FB] text-[#0072B2]" : "text-[#1D2329] hover:bg-[#F3F4F6]"
                    }`}
                  >
                    <span
                      className="[&>svg]:h-5 [&>svg]:w-5"
                      dangerouslySetInnerHTML={{ __html: NAV_ICONS[label] }}
                    />
                    <span>{label}</span>
                    {active ? (
                      <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-1">
              {/* "Search or chat" pill — att.com's fusion entry point. Collapses to a
                  bare icon button below lg, exactly as the real header does. */}
              <button
                type="button"
                aria-label="Search or chat"
                onClick={openChat}
                className="mega-search-chat-btn hidden h-10 items-center gap-2 rounded-full border border-[#DCDFE3] bg-white pl-2 pr-4 text-sm font-bold text-[#1D2329] hover:bg-[#F3F4F6] lg:inline-flex"
              >
                <SearchChatIcon className="h-6 w-6" />
                <span>Search or chat</span>
              </button>
              <button
                type="button"
                aria-label="Search or chat"
                onClick={openChat}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#E7F5FB] lg:hidden"
              >
                <SearchChatIcon className="h-6 w-6" />
              </button>

              <button
                aria-label="Open search"
                className="hidden h-10 w-10 place-items-center rounded-full hover:bg-[#E7F5FB] sm:grid"
              >
                <SearchIcon className="h-6 w-6" />
              </button>

              <button
                aria-label="Cart"
                title={badge > 0 ? `Cart, ${badge} item${badge === 1 ? "" : "s"}` : "Cart"}
                onClick={() => navigate({ to: "/buy/cart" })}
                className="relative hidden h-10 w-10 place-items-center rounded-full hover:bg-[#E7F5FB] sm:grid"
              >
                <CartIcon className="h-6 w-6" />
                {badge > 0 && (
                  <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#009FDB] px-1 text-[11px] font-bold leading-none text-white">
                    <span aria-hidden="true">{badge}</span>
                    <span className="sr-only">{badge} cart items</span>
                  </span>
                )}
              </button>

              <div className="relative" ref={signInRef}>
                <button
                  aria-label="Account"
                  aria-haspopup="dialog"
                  aria-expanded={signInOpen}
                  onClick={() => setSignInOpen(!signInOpen)}
                  className="hidden h-10 items-center gap-2 rounded-full border border-transparent px-2 text-[#1D2329] hover:bg-[#E7F5FB] sm:inline-flex"
                >
                  <AccountIcon className="h-5 w-5" />
                  {isAuthed && <span className="text-sm font-bold">{user!.firstName}</span>}
                  <NavChevron
                    className={`h-3 w-3 transition-transform ${signInOpen ? "rotate-180" : ""}`}
                  />
                  {isAuthed && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#C70032] px-1 text-[11px] font-bold text-white">
                      4
                    </span>
                  )}
                </button>

                {/* Signed-in: full AT&T "Welcome back!" hover tray */}
                {signInOpen && isAuthed && (
                  <div className="fixed left-1/2 top-[104px] z-50 w-[min(1296px,calc(100vw-32px))] -translate-x-1/2">
                    <AccountTray onClose={() => setSignInOpen(false)} />
                  </div>
                )}

                {signInOpen && !isAuthed && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] rounded-2xl border border-[#DCDFE3] bg-white p-5 shadow-xl">
                    {
                      <>
                        <button
                          onClick={() => {
                            setSignInOpen(false);
                            navigate({ to: "/login", search: { returnTo: "/myatt" } });
                          }}
                          className="btn-primary w-full"
                        >
                          Sign in
                        </button>
                        <button className="btn-secondary mt-3 w-full">Create an account</button>
                        <div className="mt-3 text-center">
                          <a href="#" className="text-sm font-bold text-[#0072B2] hover:underline">
                            Forgot user ID?
                          </a>
                        </div>
                        <div className="my-4 border-t border-[#DCDFE3]" />
                        <ul className="space-y-3 text-sm font-bold text-[#0072B2]">
                          <li>
                            <a href="#" className="hover:underline">
                              Make a payment
                            </a>
                          </li>
                          <li>
                            <a href="#" className="hover:underline">
                              Pay without signing in
                            </a>
                          </li>
                          <li>
                            <a href="#" className="hover:underline">
                              Go to my prepaid account
                            </a>
                          </li>
                        </ul>
                      </>
                    }
                  </div>
                )}
              </div>

              <button
                aria-label="Menu"
                onClick={() => setMobile(!mobile)}
                className="rounded-md p-2 hover:bg-[#F3F4F6] lg:hidden"
              >
                {mobile ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {mobile && (
            <div className="border-t border-[#DCDFE3] py-3 lg:hidden">
              {NAV.map((label) => (
                <button
                  key={label}
                  className="flex w-full items-center gap-3 px-2 py-3 text-left text-base font-bold text-[#1D2329] hover:bg-[#F3F4F6]"
                >
                  <span
                    className="[&>svg]:h-5 [&>svg]:w-5"
                    dangerouslySetInnerHTML={{ __html: NAV_ICONS[label] }}
                  />
                  <span className="flex-1">{label}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              ))}
              <Link to="/buy/phones" className="block px-2 py-3 text-base font-bold text-[#0072B2]">
                Shop phones
              </Link>
            </div>
          )}
        </div>

        {/* Full-width megamenu */}
        {openMenu && (
          <div className="absolute inset-x-0 top-full z-50 border-t border-[#DCDFE3] bg-white shadow-xl">
            <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10">
              <Mega
                menu={MEGA_NAV[openMenu]}
                rail={rail}
                setRail={setRail}
                onClose={() => setOpenMenu(null)}
              />
            </div>
          </div>
        )}
      </header>

      {openMenu && (
        <div
          onClick={() => setOpenMenu(null)}
          className="fixed inset-0 top-[112px] z-30 bg-black/40"
          aria-hidden="true"
        />
      )}
    </>
  );
}

/**
 * One mega-menu panel set. att.com's layout is fixed across all four menus:
 * a 3-column left rail of sub-panels, a 6-column body carrying a quick-action
 * row over 2–3 link columns, and a 3-column promo card on the right.
 */
function Mega({
  menu,
  rail,
  setRail,
  onClose,
}: {
  menu: MegaMenu;
  rail: number;
  setRail: (i: number) => void;
  onClose: () => void;
}) {
  const panel = menu.panels[rail] ?? menu.panels[0];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left rail */}
      <aside className="col-span-3 border-r border-[#DCDFE3] pr-4">
        <h3 className="mb-4 text-2xl font-extrabold text-[#1D2329]">{menu.title}</h3>
        <div className="space-y-1">
          {menu.panels.map((p, i) => {
            const active = i === rail;
            return (
              <button
                key={p.rail}
                onMouseEnter={() => setRail(i)}
                onClick={() => setRail(i)}
                className={`relative flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-[15px] ${
                  active
                    ? "bg-[#E7F5FB] font-bold text-[#0072B2]"
                    : "font-semibold text-[#1D2329] hover:bg-[#F3F4F6]"
                }`}
              >
                {p.rail}
                {active && (
                  <span className="absolute right-0 top-2 bottom-2 w-1 rounded-l bg-[#009FDB]" />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Body */}
      <div className={panel.promo ? "col-span-6" : "col-span-9"}>
        {panel.quick && (
          <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-[#DCDFE3] pb-3 text-sm">
            <span className="font-extrabold text-[#1D2329]">{panel.quickLabel}</span>
            {panel.quick.map((q, i) => (
              <span key={q.label} className="flex items-center gap-3">
                {i > 0 && <span className="text-[#DCDFE3]">|</span>}
                <MegaLinkEl link={q} onClose={onClose} className="font-bold text-[#0072B2]" />
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-6 text-sm">
          {panel.columns.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-3 font-extrabold text-[#1D2329]">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <MegaLinkEl link={l} onClose={onClose} className="text-[#1D2329]" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Right promo */}
      {panel.promo && (
        <div className="col-span-3">
          <article className="overflow-hidden rounded-2xl border border-[#DCDFE3] bg-white p-4 text-center shadow-sm">
            <img
              src={panel.promo.image === "plans" ? shopBackToSchool : iphonePromo}
              alt=""
              className="mx-auto h-32 w-full rounded-xl object-cover"
            />
            <p className="mt-4 text-[15px] font-extrabold leading-snug text-[#1D2329]">
              {panel.promo.copy}
            </p>
            <Link to="/buy/phones" onClick={onClose} className="btn-primary mt-4 w-full text-sm">
              {panel.promo.cta}
            </Link>
          </article>
        </div>
      )}
    </div>
  );
}

/** A mega-nav link: a real route where the prototype has one, inert otherwise. */
function MegaLinkEl({
  link,
  onClose,
  className,
}: {
  link: MegaLink;
  onClose: () => void;
  className: string;
}) {
  const cls = `${className} hover:text-[#0072B2] hover:underline`;
  return link.to ? (
    <Link to={link.to} onClick={onClose} className={cls}>
      {link.label}
    </Link>
  ) : (
    <a href="#" className={cls}>
      {link.label}
    </a>
  );
}
