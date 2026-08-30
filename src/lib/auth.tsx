// Prototype account state for the Protect Advantage demo. NOT real authentication —
// it keeps a demo session in localStorage so account pages gate like att.com.
//
// The whole member record is persisted, not just the user id, so enrolling,
// filing a claim, redeeming a perk or running a backup survives a page reload.
// That matters on stage: a stray refresh used to silently undo the demo.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import {
  ACCOUNTS,
  getAccount,
  deviceVaultGB,
  TIER_CREDITS,
  TIER_POOL,
  TIER_PRICE,
  TIER_VAULT_GB,
  type Member,
  type MemberDevice,
  type Redemption,
  type Claim,
  type TierId,
} from "@/data/member";
import { computeProtectionScore } from "@/lib/ai";
import { reconcileManifest, rebindManifest } from "@/lib/manifest";
import { appendTrace, type DecisionTrace } from "@/lib/ledger";
import { verifyAttestation, type ConditionAttestation } from "@/lib/attestation";

const SESSION_KEY = "att_pa_session"; // which demo account is signed in
const STATE_PREFIX = "att_pa_state_v2:"; // that account's mutated record

type NewClaim = Omit<Claim, "id" | "date" | "status"> & { status?: Claim["status"] };

type AuthCtx = {
  user: Member | null;
  isAuthed: boolean;
  login: (userId: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  /** Discard every mutation and put this account back to its seeded state. */
  resetAccount: () => void;

  enroll: (tierId: TierId, deviceIds: string[]) => void;
  /** Explicit device list — a tier change is a coverage decision, not just a price change. */
  changeTier: (tierId: TierId, deviceIds?: string[]) => void;
  redeemAccessory: (r: Omit<Redemption, "id" | "date" | "status">) => void;

  fileClaim: (c: NewClaim) => string;
  /** Fulfil a replacement: issue the "new, not refurbished" certificate. */
  issueGuarantee: (deviceId: string) => void;

  backupDevice: (deviceId: string) => void;
  backupAll: () => void;
  setAutoBackup: (deviceId: string, on: boolean) => void;
  cleanVault: () => void;
  restoreTo: (fromId: string, toId: string) => void;

  addScreenGuard: (deviceId: string) => void;
  setParental: (deviceId: string, on: boolean) => void;
  addToPool: (deviceId: string) => void;
  removeFromPool: (deviceId: string) => void;
  dismissNudge: (id: string) => void;

  // ── The patentable mechanisms ─────────────────────────────────────────────
  /** Mechanism 3 — commit a decision trace to the ledger. */
  record: (trace: DecisionTrace) => void;
  /** Mechanism 5 — store a signed condition attestation for a device. */
  attestDevice: (deviceId: string, attestation: ConditionAttestation) => void;
  /** Mechanism 5 — the gate. True when this device may be enrolled today. */
  isAttested: (deviceId: string) => boolean;
  /** Mechanism 2 — point a line's manifest at a replacement handset. */
  rebindLine: (line: string, deviceId: string) => void;
};

const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within <AuthProvider>");
  return c;
};

const now = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const today = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Keep every derived field honest after any mutation. */
function reconcile(m: Member): Member {
  m.protectionScore = computeProtectionScore(m);
  if (m.enrolled && m.tier) {
    m.tierPrice = TIER_PRICE[m.tier];
    m.vault.totalGB = TIER_VAULT_GB[m.tier];
  }
  m.enrolled = m.devices.some((d) => d.protected);
  if (!m.enrolled) {
    m.tier = undefined;
    m.tierPrice = undefined;
  }
  // Mechanism 2 — the manifest is "continuously reconciled" because this runs after
  // every single mutation. Doing it here rather than at call sites is what makes that
  // property true by construction instead of by discipline.
  m.manifests = reconcileManifest(m);
  m.ledger ??= [];
  m.attestations ??= {};
  return m;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Member | null>(null);
  // Skip the first persist pass — it would write the seed back over a restored record.
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        hydrated.current = true;
        return;
      }
      const saved = localStorage.getItem(STATE_PREFIX + id);
      if (saved) {
        const parsed = JSON.parse(saved) as Member;
        // A seeded account gaining new fields shouldn't break a stale save.
        if (parsed?.devices?.length) {
          setUser(reconcile(parsed));
          hydrated.current = true;
          return;
        }
      }
      setUser(reconcile(structuredClone(getAccount(id) ?? ACCOUNTS[0])));
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current || !user) return;
    try {
      localStorage.setItem(STATE_PREFIX + user.userId, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }, [user]);

  /** Every mutation goes through here so nothing forgets to reconcile. */
  const mutate = (fn: (m: Member) => void) =>
    setUser((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return reconcile(next);
    });

  const login = (userId: string) => {
    try {
      localStorage.setItem(SESSION_KEY, userId);
      const saved = localStorage.getItem(STATE_PREFIX + userId);
      if (saved) {
        const parsed = JSON.parse(saved) as Member;
        if (parsed?.devices?.length) {
          setUser(reconcile(parsed));
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setUser(reconcile(structuredClone(getAccount(userId) ?? ACCOUNTS[0])));
  };

  const switchUser = (userId: string) => login(userId);

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  const resetAccount = () => {
    if (!user) return;
    const id = user.userId;
    try {
      localStorage.removeItem(STATE_PREFIX + id);
    } catch {
      /* ignore */
    }
    setUser(reconcile(structuredClone(getAccount(id) ?? ACCOUNTS[0])));
  };

  // ── Plan ──────────────────────────────────────────────────────────────────
  const enroll = (tierId: TierId, deviceIds: string[]) =>
    mutate((m) => {
      const cap = TIER_POOL[tierId];
      // MECHANISM 5 — the underwriting gate, enforced here rather than in the UI.
      // A device without a valid, recent, signed condition attestation is not enrolled
      // even if the caller asks for it. Putting the check in the reducer means no screen
      // can route around it, which is the difference between a control and a suggestion.
      const attested = deviceIds.filter((id) => verifyAttestation(m.attestations?.[id]).valid);
      if (!attested.length) return;
      const covered = attested.slice(0, cap);
      m.tier = tierId;
      m.tierPrice = TIER_PRICE[tierId];
      m.devices = m.devices.map((d) =>
        covered.includes(d.id) ? { ...d, protected: true, tier: tierId, eligible: false } : d,
      );
      m.vault.totalGB = TIER_VAULT_GB[tierId];
      if (m.vault.lastBackup === "Not set up") m.vault.lastBackup = "Backup pending";
      const allowance = TIER_CREDITS[tierId];
      m.perks = {
        ...m.perks,
        accessoryCredits: allowance,
        accessoryTotal: allowance,
        resetsOn: "Jan 1, 2027",
      };
    });

  const changeTier = (tierId: TierId, deviceIds?: string[]) =>
    mutate((m) => {
      const cap = TIER_POOL[tierId];
      // Caller picks which devices carry over; falling back to the first N keeps
      // older call sites working.
      const covered = (deviceIds ?? m.devices.filter((d) => d.protected).map((d) => d.id)).slice(
        0,
        cap,
      );
      m.tier = tierId;
      m.tierPrice = TIER_PRICE[tierId];
      m.devices = m.devices.map((d) =>
        covered.includes(d.id)
          ? { ...d, protected: true, tier: tierId }
          : { ...d, protected: false, tier: undefined, eligible: true },
      );
      m.vault.totalGB = TIER_VAULT_GB[tierId];
      const allowance = TIER_CREDITS[tierId];
      m.perks = {
        ...m.perks,
        accessoryCredits: Math.min(m.perks.accessoryCredits, allowance),
        accessoryTotal: allowance,
      };
    });

  const redeemAccessory: AuthCtx["redeemAccessory"] = (r) =>
    mutate((m) => {
      if (m.perks.accessoryCredits < 1) return;
      m.perks.accessoryCredits -= 1;
      m.perks.redemptions = [
        {
          ...r,
          id: `r${Date.now()}`,
          date: today(),
          status: r.method === "Pick up in store" ? "Ready for pickup" : "Ordered",
        },
        ...m.perks.redemptions,
      ];
    });

  // ── Claims ────────────────────────────────────────────────────────────────
  const fileClaim: AuthCtx["fileClaim"] = (c) => {
    const id = `c${Math.floor(1000 + Math.random() * 8999)}`;
    mutate((m) => {
      m.claims = [{ ...c, id, date: today(), status: c.status ?? "Booked" }, ...m.claims];
    });
    return id;
  };

  const issueGuarantee = (deviceId: string) =>
    mutate((m) => {
      const d = m.devices.find((x) => x.id === deviceId);
      if (!d) return;
      m.guarantees = [
        {
          id: `g${Date.now()}`,
          deviceId,
          deviceName: d.name,
          issued: today(),
          serial: `F${Math.floor(100000 + Math.random() * 899999)}${d.name.replace(/\D/g, "").slice(0, 2) || "00"}`,
          condition: "Factory new — sealed",
        },
        ...m.guarantees,
      ];
      d.replacedOn = today();
      // A brand-new device starts clean and, with the vault, immediately current.
      d.screenRisk = "Low";
      d.batteryHealth = 100;
      d.warranty = "In warranty";
    });

  // ── Vault ─────────────────────────────────────────────────────────────────
  const stampBackup = (d: MemberDevice) => {
    d.backedUp = true;
    d.lastBackup = `Today, ${now()}`;
  };

  const backupDevice = (deviceId: string) =>
    mutate((m) => {
      const d = m.devices.find((x) => x.id === deviceId);
      if (!d) return;
      stampBackup(d);
      m.vault.lastBackup = d.lastBackup;
    });

  const backupAll = () =>
    mutate((m) => {
      m.devices.filter((d) => d.protected).forEach(stampBackup);
      m.vault.lastBackup = `Today, ${now()}`;
    });

  const setAutoBackup = (deviceId: string, on: boolean) =>
    mutate((m) => {
      const d = m.devices.find((x) => x.id === deviceId);
      if (d) d.autoBackup = on;
      m.vault.autoBackup = m.devices.filter((x) => x.protected).every((x) => x.autoBackup);
    });

  const cleanVault = () =>
    mutate((m) => {
      // Reclaimed space comes off the largest contributors, proportionally.
      const freed = m.vault.junkGB;
      const backed = m.devices.filter((d) => d.backedUp);
      const total = backed.reduce((n, d) => n + deviceVaultGB(d), 0) || 1;
      backed.forEach((d) => {
        const share = (deviceVaultGB(d) / total) * freed;
        // Duplicates live in photos and videos, so that is where the space returns.
        const fromPhotos = Math.min(d.vault.photos, share * 0.65);
        const fromVideos = Math.min(d.vault.videos, share - fromPhotos);
        d.vault.photos = Math.max(0, Math.round((d.vault.photos - fromPhotos) * 10) / 10);
        d.vault.videos = Math.max(0, Math.round((d.vault.videos - fromVideos) * 10) / 10);
      });
      m.vault.junkGB = 0;
      m.vault.duplicates = 0;
    });

  const restoreTo = (fromId: string, toId: string) =>
    mutate((m) => {
      const from = m.devices.find((x) => x.id === fromId);
      const to = m.devices.find((x) => x.id === toId);
      if (!from || !to) return;
      to.vault = { ...from.vault };
      stampBackup(to);
      m.restores = [
        {
          id: `rs${Date.now()}`,
          date: today(),
          fromDevice: from.name,
          toDevice: to.name,
          gb: deviceVaultGB(from),
          items: Math.round(
            from.vault.photos * 220 +
              from.vault.videos * 12 +
              from.vault.messages * 4000 +
              from.vault.apps * 9 +
              from.vault.contacts * 512,
          ),
        },
        ...m.restores,
      ];
    });

  // ── Devices & family ──────────────────────────────────────────────────────
  const addScreenGuard = (deviceId: string) =>
    mutate((m) => {
      const d = m.devices.find((x) => x.id === deviceId);
      if (!d || d.screenGuard) return;
      d.screenGuard = true;
      // Fitting a guard is what actually lowers the risk the score is measuring.
      if (d.screenRisk === "High") d.screenRisk = "Medium";
      else if (d.screenRisk === "Medium") d.screenRisk = "Low";
    });

  const setParental = (deviceId: string, on: boolean) =>
    mutate((m) => {
      m.parental[deviceId] = on;
    });

  const addToPool = (deviceId: string) =>
    mutate((m) => {
      if (!m.tier) return;
      if (m.devices.filter((d) => d.protected).length >= TIER_POOL[m.tier]) return;
      // Adding a device to the pool is an enrolment, so it passes the same gate.
      if (!verifyAttestation(m.attestations?.[deviceId]).valid) return;
      const d = m.devices.find((x) => x.id === deviceId);
      if (!d) return;
      d.protected = true;
      d.tier = m.tier;
      d.eligible = false;
    });

  const removeFromPool = (deviceId: string) =>
    mutate((m) => {
      const d = m.devices.find((x) => x.id === deviceId);
      if (!d) return;
      d.protected = false;
      d.tier = undefined;
      d.eligible = true;
    });

  const dismissNudge = (id: string) =>
    mutate((m) => {
      if (!m.dismissedNudges.includes(id)) m.dismissedNudges.push(id);
    });

  // ── Mechanisms ────────────────────────────────────────────────────────────
  /**
   * Committing a trace is the one mutation that gets called from an effect, so it has to
   * be safe to call on every render: stable identity via useCallback, and a genuine no-op
   * (returning `prev` by reference, which React bails out on) when the trace is already
   * recorded. Without both, recording a decision re-renders, which re-records it.
   *
   * It also skips `reconcile` — the ledger is an append-only side record and no derived
   * field reads from it.
   */
  const record: AuthCtx["record"] = useCallback((trace) => {
    setUser((prev) => {
      if (!prev) return prev;
      if (prev.ledger?.some((t) => t.id === trace.id)) return prev;
      const next = structuredClone(prev);
      next.ledger = appendTrace(next.ledger ?? [], trace);
      return next;
    });
  }, []);

  const attestDevice: AuthCtx["attestDevice"] = (deviceId, attestation) =>
    mutate((m) => {
      m.attestations = { ...(m.attestations ?? {}), [deviceId]: attestation };
    });

  const isAttested: AuthCtx["isAttested"] = (deviceId) =>
    verifyAttestation(user?.attestations?.[deviceId]).valid;

  const rebindLine: AuthCtx["rebindLine"] = (line, deviceId) =>
    mutate((m) => {
      const device = m.devices.find((d) => d.id === deviceId);
      const manifest = m.manifests?.find((x) => x.line === line);
      if (!device || !manifest) return;
      m.manifests = m.manifests!.map((x) => (x.line === line ? rebindManifest(x, device) : x));
    });

  return (
    <Ctx.Provider
      value={{
        user,
        isAuthed: !!user,
        login,
        logout,
        switchUser,
        resetAccount,
        enroll,
        changeTier,
        redeemAccessory,
        fileClaim,
        issueGuarantee,
        backupDevice,
        backupAll,
        setAutoBackup,
        cleanVault,
        restoreTo,
        addScreenGuard,
        setParental,
        addToPool,
        removeFromPool,
        dismissNudge,
        record,
        attestDevice,
        isAttested,
        rebindLine,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// Gate for member-only routes (mirrors how att.com gates account pages).
export function RequireAuth({ children, returnTo }: { children: ReactNode; returnTo: string }) {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  if (isAuthed) return <>{children}</>;
  return (
    <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#E7F5FB]">
        <Lock className="h-7 w-7 text-[#0057B8]" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold">Please sign in</h1>
      <p className="mt-2 text-sm text-[#686E74]">
        Sign in to your myAT&amp;T account to manage AT&amp;T Protect Advantage, file a claim and
        view your devices.
      </p>
      <button
        onClick={() => navigate({ to: "/login", search: { returnTo } as never })}
        className="btn-primary mt-6"
      >
        Sign in
      </button>
      <Link to="/" className="mt-4 text-sm font-bold text-[#0057B8] hover:underline">
        Return to att.com
      </Link>
    </div>
  );
}

/** Guard for pages that only make sense with an active plan. */
export function RequirePlan({
  children,
  title,
  blurb,
}: {
  children: ReactNode;
  title: string;
  blurb: string;
}) {
  const { user } = useAuth();
  if (user?.enrolled) return <>{children}</>;
  const eligible = user?.devices.filter((d) => d.eligible).length ?? 0;
  return (
    <div className="mx-auto max-w-[800px] px-4 py-16 text-center sm:px-6">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F3F4F6]">
        <Lock className="h-7 w-7 text-[#686E74]" />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold">{title}</h1>
      <p className="mt-2 text-sm text-[#686E74]">{blurb}</p>
      {eligible > 0 && (
        <p className="mt-1 text-sm text-[#686E74]">
          You have {eligible} eligible device{eligible === 1 ? "" : "s"} on this account.
        </p>
      )}
      <Link to="/myatt/enroll" className="btn-primary mt-6">
        See protection options
      </Link>
    </div>
  );
}
