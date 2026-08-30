import { useState, useEffect, useRef } from "react";
import { Phone, MessageSquare, X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";

const COOKIE_KEY = "att_cookie_dismissed";

/** Any page can open the chat: window.dispatchEvent(new CustomEvent("att-open-chat")) */
export const OPEN_CHAT = "att-open-chat";
export const openChat = () => window.dispatchEvent(new CustomEvent(OPEN_CHAT));

export function GlobalWidgets() {
  const [cookie, setCookie] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setCookie(true);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    const open = () => setChatOpen(true);
    window.addEventListener(OPEN_CHAT, open);
    return () => window.removeEventListener(OPEN_CHAT, open);
  }, []);

  const dismissCookie = () => {
    try {
      localStorage.setItem(COOKIE_KEY, "1");
    } catch {
      /* ignore */
    }
    setCookie(false);
  };

  return (
    <>
      {/* Right-edge Order Now tab */}
      <a
        href="tel:8669714383"
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 rotate-180 items-center gap-2 rounded-t-md bg-[#00388F] px-3 py-3 text-xs font-bold text-white shadow-lg [writing-mode:vertical-rl] hover:bg-[#0057B8] md:inline-flex"
        style={{ writingMode: "vertical-rl" }}
      >
        <Phone className="h-4 w-4 rotate-90" /> ORDER NOW / 866-971-4383
      </a>

      {/* Chat launcher — the same bubble att.com carries on every page */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#00388F] px-5 py-3 text-sm font-bold text-white shadow-xl hover:bg-[#0057B8]"
        >
          <MessageSquare className="h-4 w-4" /> Let&rsquo;s chat
        </button>
      )}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}

      {/* Cookie banner */}
      {cookie && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-[#002837] text-white shadow-2xl">
          <div className="mx-auto flex max-w-[1280px] items-start gap-4 px-4 py-4 sm:px-6 lg:px-10">
            <p className="flex-1 text-sm leading-relaxed">
              We use cookies to help enhance your experience on our site and for analytics. By
              continuing you agree to our use of cookies as described in our Privacy Policy.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Manage your preferences", "Opt out", "Continue without changes"].map((l) => (
                <button
                  key={l}
                  onClick={dismissCookie}
                  className="rounded-full border border-white px-4 py-2 text-xs font-bold hover:bg-white hover:text-[#002837]"
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              aria-label="Dismiss"
              onClick={dismissCookie}
              className="rounded p-1 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
