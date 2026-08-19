import { useState, useEffect, useRef } from "react";
import { Phone, MessageSquare, X, Send, Minus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { assistantReply, assistantGreeting, type ChatMessage, type ChatAction } from "@/lib/ai";

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
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 rotate-180 items-center gap-2 rounded-t-md bg-[#0057B8] px-3 py-3 text-xs font-bold text-white shadow-lg [writing-mode:vertical-rl] hover:bg-[#00388F] md:inline-flex"
        style={{ writingMode: "vertical-rl" }}
      >
        <Phone className="h-4 w-4 rotate-90" /> ORDER NOW / 866-971-4383
      </a>

      {/* Chat launcher — the same bubble att.com carries on every page */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#0057B8] px-5 py-3 text-sm font-bold text-white shadow-xl hover:bg-[#00388F]"
        >
          <MessageSquare className="h-4 w-4" /> Let&rsquo;s chat
        </button>
      )}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}

      {/* Cookie banner */}
      {cookie && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0F4C4C] text-white shadow-2xl">
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
                  className="rounded-full border border-white px-4 py-2 text-xs font-bold hover:bg-white hover:text-[#0F4C4C]"
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

function ChatPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<ChatMessage[]>(() => [assistantGreeting({ member: user })]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, assistantReply(t, { member: user })]);
      setTyping(false);
    }, 550);
  };

  const runAction = (a: ChatAction) => {
    if (a.ask) {
      send(a.ask);
      return;
    }
    if (a.to) {
      onClose();
      navigate(a.search ? { to: a.to, search: a.search as never } : ({ to: a.to } as never));
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Chat with AT&T"
      className="fixed bottom-0 right-0 z-50 flex h-[600px] max-h-[92vh] w-[380px] max-w-full flex-col overflow-hidden rounded-t-2xl border border-[#DCDFE3] bg-white shadow-2xl sm:bottom-4 sm:right-4 sm:rounded-2xl"
    >
      <header className="flex items-center justify-between bg-[#0057B8] px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-[13px] font-extrabold">
            AT
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold leading-tight">AT&amp;T Assistant</p>
            <p className="flex items-center gap-1.5 text-[11px] text-white/85">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7BE38B]" /> Online now
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Minimize chat"
            onClick={onClose}
            className="rounded p-1 hover:bg-white/10"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            aria-label="Close chat"
            onClick={onClose}
            className="rounded p-1 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#F3F4F6] p-4">
        <p className="text-center text-[11px] text-[#686E74]">
          Answers cover AT&amp;T device protection. Don&rsquo;t share passwords or card numbers in
          chat.
        </p>

        {msgs.map((m, i) => (
          <div key={i}>
            <div
              className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto rounded-br-md bg-[#0057B8] text-white"
                  : "rounded-bl-md bg-white text-[#1D2329] shadow-sm"
              }`}
            >
              {m.text}
            </div>
            {m.actions && m.actions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.actions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => runAction(a)}
                    className="rounded-full border border-[#0057B8] bg-white px-3 py-1.5 text-xs font-bold text-[#0057B8] hover:bg-[#E7F5FB]"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div
            className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm"
            aria-label="Assistant is typing"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#686E74]"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-[#DCDFE3] bg-white p-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          aria-label="Type your question"
          className="flex-1 rounded-full border border-[#DCDFE3] px-4 py-2 text-sm outline-none focus:border-[#0057B8]"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!input.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0057B8] text-white hover:bg-[#00388F] disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
