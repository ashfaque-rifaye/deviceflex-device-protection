// Smart Restore, as an actual flow.
//
// The old version was one button and a progress bar, which skipped every question a
// person actually has: from which device, onto which device, and — the one nobody
// asks but everybody wants — do I have to take all of it? Restoring 90 GB of video
// onto a loaner you'll hand back in a week is nobody's idea of help.
//
// Four steps: source → what to bring → destination → review, then the run itself
// with per-category progress. Category selection is the part that makes this feel
// like a product rather than a demo.
import { useEffect, useMemo, useRef, useState } from "react";
import { Overlay } from "@/components/att/Modal";
import {
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Film,
  MessageSquare,
  Grid3x3,
  Users,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { formatCapacity, deviceVaultGB, type Member, type MemberDevice } from "@/data/member";

type CatKey = "photos" | "videos" | "messages" | "apps" | "contacts";

const CATS: Array<{
  key: CatKey;
  label: string;
  Icon: typeof ImageIcon;
  /** Items per GB, so counts read plausibly. */
  perGb: number;
  hint: string;
}> = [
  { key: "photos", label: "Photos", Icon: ImageIcon, perGb: 220, hint: "Full resolution" },
  { key: "videos", label: "Videos", Icon: Film, perGb: 12, hint: "Usually the bulk of it" },
  {
    key: "messages",
    label: "Messages",
    Icon: MessageSquare,
    perGb: 4000,
    hint: "Threads and attachments",
  },
  {
    key: "apps",
    label: "Apps & settings",
    Icon: Grid3x3,
    perGb: 9,
    hint: "Reinstalled, logged in",
  },
  { key: "contacts", label: "Contacts", Icon: Users, perGb: 512, hint: "Always worth taking" },
];

export function SmartRestore({
  member,
  onClose,
  onRestore,
}: {
  member: Member;
  onClose: () => void;
  onRestore: (fromId: string, toId: string) => void;
}) {
  const backed = member.devices.filter((d) => d.backedUp);
  const [step, setStep] = useState(0);
  const [fromId, setFromId] = useState(backed[0]?.id ?? "");
  const [toId, setToId] = useState("");
  const [picked, setPicked] = useState<CatKey[]>(CATS.map((c) => c.key));

  const from = member.devices.find((d) => d.id === fromId);
  const to = member.devices.find((d) => d.id === toId);

  const selected = useMemo(() => {
    if (!from)
      return { gb: 0, items: 0, rows: [] as Array<{ key: CatKey; gb: number; items: number }> };
    const rows = CATS.filter((c) => picked.includes(c.key)).map((c) => ({
      key: c.key,
      gb: from.vault[c.key],
      items: Math.round(from.vault[c.key] * c.perGb),
    }));
    return {
      gb: rows.reduce((n, r) => n + r.gb, 0),
      items: rows.reduce((n, r) => n + r.items, 0),
      rows,
    };
  }, [from, picked]);

  const minutes = Math.max(1, Math.round(selected.gb / 60));

  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const toggle = (k: CatKey) =>
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const STEPS = ["Source", "What to bring", "Destination", "Review"];

  return (
    <Overlay open onClose={onClose} labelledBy="sr-title" className="max-w-2xl">
      <div className="flex items-start gap-4 border-b border-[#DCDFE3] p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E7F5FB]">
          <ShieldCheck className="h-5 w-5 text-[#00388F]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="att-eyebrow">Smart Restore</p>
          <h2 id="sr-title" className="att-h3 mt-1">
            Move your data to another device
          </h2>
        </div>
        <button
          ref={closeRef}
          aria-label="Close Smart Restore"
          onClick={onClose}
          className="rounded-full p-1.5 text-[#686E74] hover:bg-[#F3F4F6]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {step < 4 && (
        <ol className="flex flex-wrap gap-x-5 gap-y-2 border-b border-[#DCDFE3] px-6 py-3 text-xs font-bold">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`flex items-center gap-1.5 ${i === step ? "text-[#00388F]" : i < step ? "text-[#1F7A3D]" : "text-[#878C94]"}`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                  i === step
                    ? "bg-[#00388F] text-white"
                    : i < step
                      ? "bg-[#1F7A3D] text-white"
                      : "bg-[#DCDFE3] text-[#686E74]"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      )}

      <div className="max-h-[52vh] overflow-y-auto p-6">
        {/* 0 — source */}
        {step === 0 && (
          <div>
            <h3 className="att-h4">Restore from which backup?</h3>
            <p className="att-small mt-1">Only devices with a backup in your vault are listed.</p>
            <div className="mt-4 grid gap-2">
              {backed.map((d) => (
                <DeviceRow
                  key={d.id}
                  d={d}
                  selected={fromId === d.id}
                  onSelect={() => setFromId(d.id)}
                  meta={`${formatCapacity(deviceVaultGB(d))} · backed up ${d.lastBackup.toLowerCase()}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 1 — categories */}
        {step === 1 && from && (
          <div>
            <h3 className="att-h4">What should we bring across?</h3>
            <p className="att-small mt-1">
              Leave anything out and it stays safe in the vault — you can pull it later.
            </p>
            <div className="mt-4 grid gap-2">
              {CATS.map(({ key, label, Icon, perGb, hint }) => {
                const on = picked.includes(key);
                const gb = from.vault[key];
                return (
                  <label
                    key={key}
                    className={`att-choice flex items-center gap-3 !p-4 ${on ? "att-choice-on" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(key)}
                      className="att-checkbox shrink-0"
                    />
                    <Icon className="h-5 w-5 shrink-0 text-[#00388F]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{label}</span>
                      <span className="att-small block">
                        {Math.round(gb * perGb).toLocaleString()} items · {hint}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums">
                      {formatCapacity(gb)}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F3F4F6] p-4 text-sm">
              <span className="font-bold">Selected</span>
              <span className="font-extrabold tabular-nums">
                {formatCapacity(selected.gb)} · {selected.items.toLocaleString()} items
              </span>
            </div>
          </div>
        )}

        {/* 2 — destination */}
        {step === 2 && (
          <div>
            <h3 className="att-h4">Restore onto which device?</h3>
            <p className="att-small mt-1">
              Anything already on the destination is kept — Smart Restore merges rather than wipes.
            </p>
            <div className="mt-4 grid gap-2">
              {member.devices
                .filter((d) => d.id !== fromId)
                .map((d) => (
                  <DeviceRow
                    key={d.id}
                    d={d}
                    selected={toId === d.id}
                    onSelect={() => setToId(d.id)}
                    meta={
                      d.backedUp
                        ? `Already holds ${formatCapacity(deviceVaultGB(d))} — will be merged`
                        : "No existing backup"
                    }
                  />
                ))}
            </div>
          </div>
        )}

        {/* 3 — review */}
        {step === 3 && from && to && (
          <div>
            <h3 className="att-h4">Ready to restore</h3>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#DCDFE3] p-4">
              <div className="min-w-0 flex-1">
                <p className="att-small">From</p>
                <p className="text-sm font-extrabold">{from.name}</p>
                <p className="att-small">{from.owner}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-[#00388F]" />
              <div className="min-w-0 flex-1">
                <p className="att-small">Onto</p>
                <p className="text-sm font-extrabold">{to.name}</p>
                <p className="att-small">{to.owner}</p>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-[#DCDFE3] rounded-xl border border-[#DCDFE3]">
              {selected.rows.map((r) => {
                const c = CATS.find((x) => x.key === r.key)!;
                return (
                  <li key={r.key} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      <c.Icon className="h-4 w-4 text-[#00388F]" />
                      {c.label}
                      <span className="att-small">· {r.items.toLocaleString()}</span>
                    </span>
                    <span className="font-bold tabular-nums">{formatCapacity(r.gb)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#E7F5FB] p-4 text-sm">
              <span className="font-bold">
                {formatCapacity(selected.gb)} · {selected.items.toLocaleString()} items
              </span>
              <span className="font-extrabold">
                About {minutes} minute{minutes > 1 ? "s" : ""}
              </span>
            </div>
            {selected.rows.length === 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#FFF3E0] p-3 text-sm text-[#7A4A00]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Nothing selected — go back and pick at least one category.
              </p>
            )}
          </div>
        )}

        {/* 4 — running / done */}
        {step === 4 && from && to && (
          <RunRestore
            from={from}
            to={to}
            rows={selected.rows}
            totalGb={selected.gb}
            onDone={() => onRestore(from.id, to.id)}
            onClose={onClose}
          />
        )}
      </div>

      {step < 4 && (
        <div className="flex items-center justify-between gap-3 border-t border-[#DCDFE3] p-6">
          <button
            onClick={() => (step === 0 ? onClose() : setStep((n) => n - 1))}
            className="btn-secondary att-btn-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={() => setStep((n) => n + 1)}
            disabled={
              (step === 0 && !fromId) ||
              (step === 1 && picked.length === 0) ||
              (step === 2 && !toId)
            }
            className="btn-primary att-btn-sm"
          >
            {step === 3 ? "Start restore" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </Overlay>
  );
}

function DeviceRow({
  d,
  selected,
  onSelect,
  meta,
}: {
  d: MemberDevice;
  selected: boolean;
  onSelect: () => void;
  meta: string;
}) {
  return (
    <label className={`att-choice flex items-center gap-3 !p-4 ${selected ? "att-choice-on" : ""}`}>
      <input type="radio" checked={selected} onChange={onSelect} className="att-radio shrink-0" />
      <img src={d.image} alt="" className="h-12 w-9 shrink-0 object-contain" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{d.name}</span>
        <span className="att-small block">
          {d.owner} · {meta}
        </span>
      </span>
    </label>
  );
}

function RunRestore({
  from,
  to,
  rows,
  totalGb,
  onDone,
  onClose,
}: {
  from: MemberDevice;
  to: MemberDevice;
  rows: Array<{ key: CatKey; gb: number; items: number }>;
  totalGb: number;
  onDone: () => void;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const done = i >= rows.length;
  const fired = useRef(false);

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setI((n) => n + 1), 900);
    return () => clearTimeout(t);
  }, [i, done]);

  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onDone();
    }
  }, [done, onDone]);

  return (
    <div>
      <h3 className="att-h4">{done ? `${to.name} is ready` : `Restoring onto ${to.name}`}</h3>
      <p className="att-small mt-1">
        From {from.name}&rsquo;s backup · {formatCapacity(totalGb)}
      </p>

      <ul className="mt-4 space-y-1">
        {rows.map((r, n) => {
          const c = CATS.find((x) => x.key === r.key)!;
          const state = n < i ? "done" : n === i ? "active" : "wait";
          return (
            <li
              key={r.key}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${state === "active" ? "bg-[#F3F4F6]" : ""}`}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center">
                {state === "done" ? (
                  <Check className="h-4 w-4 text-[#1F7A3D]" />
                ) : state === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#00388F]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#DCDFE3]" />
                )}
              </span>
              <c.Icon
                className={`h-4 w-4 shrink-0 ${state === "wait" ? "text-[#878C94]" : "text-[#00388F]"}`}
              />
              <span className={`flex-1 text-sm ${state === "wait" ? "text-[#878C94]" : ""}`}>
                {state === "active"
                  ? `Restoring ${r.items.toLocaleString()} ${c.label.toLowerCase()}…`
                  : `${r.items.toLocaleString()} ${c.label.toLowerCase()}`}
              </span>
              <span className="att-small shrink-0 tabular-nums">{formatCapacity(r.gb)}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
        <div
          className="h-full rounded-full bg-[#00388F] transition-all duration-500"
          style={{ width: `${(Math.min(i, rows.length) / Math.max(1, rows.length)) * 100}%` }}
        />
      </div>

      {done && (
        <>
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#BFE3CB] bg-[#EAF7EE] p-4 text-sm">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#1F7A3D]" />
            <span>
              <b>Everything&rsquo;s across.</b> {to.name} now has the {rows.length} categories you
              chose. Anything you left behind is still in the vault.
            </span>
          </p>
          <button onClick={onClose} className="btn-primary mt-4 w-full">
            Done
          </button>
        </>
      )}
    </div>
  );
}
