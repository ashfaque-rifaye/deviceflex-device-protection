import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { SearchChatIcon } from "./NavIcons";

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
      {/*
        att.com's right-edge rail: the Feedback tab sits directly above the Fusion
        chat launcher, both flush to the viewport edge and rounded only on the
        left (4px 0 0 4px), so they read as one stack tabbed out of the page.
      */}
      <div className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2 md:flex">
        <button
          type="button"
          aria-label="Feedback"
          onClick={openChat}
          className="rounded-l border border-r-0 border-[#DCDFE3] bg-white px-1.5 py-4 text-xs font-bold text-[#0057B8] shadow-[0_2px_8px_rgba(37,48,58,0.16)] hover:bg-[#F3F4F6]"
          style={{ writingMode: "vertical-rl", borderRadius: "4px 0 0 4px" }}
        >
          Feedback
        </button>

        {!chatOpen && (
          <button
            type="button"
            id="fusionChatActiveBtn"
            aria-label="Open chat"
            onClick={() => setChatOpen(true)}
            className="flex w-16 flex-col items-center justify-center gap-1 bg-[#00388F] px-0 py-2 text-white shadow-[0_2px_8px_rgba(37,48,58,0.16)] hover:bg-[#0057B8]"
            style={{ borderRadius: "4px 0 0 4px", minHeight: 55 }}
          >
            <SearchChatIcon className="h-8 w-8 [&_path]:fill-white" />
            <span className="text-[11px] font-bold leading-none">CHAT</span>
          </button>
        )}
      </div>

      {/* Below md the rail would eat the thumb zone, so the launcher docks bottom-right. */}
      {!chatOpen && (
        <button
          type="button"
          aria-label="Open chat"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#00388F] text-white shadow-xl hover:bg-[#0057B8] md:hidden"
        >
          <SearchChatIcon className="h-7 w-7 [&_path]:fill-white" />
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
