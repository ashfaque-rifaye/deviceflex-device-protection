// MECHANISM 3 — Deterministic, Replayable Decision Ledger.
//
// Every automated decision in this system is made by a pure function over account state:
// same input, same output, every time. That was already true of the eight agents in
// src/lib/ai.ts — this file is what makes it *provable*.
//
// The claim being supported: a system that makes verifiable, reproducible, auditable
// automated underwriting decisions is a concrete technical improvement over black-box ML,
// which drifts and cannot explain itself. That is a technical effect, not a business rule.
//
// ── Why a combinator and not a logging wrapper ────────────────────────────────
// The obvious design is to log alongside the real call. That produces a record that can
// silently drift from the thing it claims to describe — the log says one thing, the code
// does another, and nobody notices until it matters. Here the ledger IS the call path:
// `decide()` runs the function and returns the value together with its trace, so a
// recorded decision and an executed decision are the same event by construction.
//
// `replay()` then genuinely re-executes the registered implementation against the stored
// input and compares digests. It is not reprinting a saved string.

/** One recorded decision. Small enough to persist a few dozen in localStorage. */
export type DecisionTrace = {
  id: string;
  /** The pure function that made the call. Also the replay key. */
  fn: string;
  /** Plain-English label for the UI. */
  summary: string;
  at: string;
  /** Canonical JSON of the input, kept so replay can actually re-run. */
  input: string;
  inputHash: string;
  /** Canonical JSON of the output, kept so the UI can show what was decided. */
  output: string;
  outputHash: string;
};

/**
 * Deterministic serialisation. Object keys are emitted in sorted order at every depth,
 * because `JSON.stringify` preserves insertion order and two structurally identical
 * objects built by different code paths would otherwise digest differently. Without this
 * the whole ledger is worthless — the hashes would be stable only by luck.
 */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const body = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(",");
  return `{${body}}`;
}

/**
 * FNV-1a, run twice with different offset bases to give 64 bits, printed as 16 hex chars.
 *
 * Honest label: this is a checksum, not a cryptographic hash. It is enough to demonstrate
 * replay determinism — the same input provably reaches the same output — and it is
 * synchronous, which matters because `crypto.subtle` is async and cannot sit inside a pure
 * function. A real deployment would sign traces with SHA-256 + HMAC under a carrier key.
 */
export function digest(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    a ^= c;
    a = Math.imul(a, 0x01000193) >>> 0;
    b ^= c + i;
    b = Math.imul(b, 0x85ebca6b) >>> 0;
  }
  return (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
}

/**
 * Implementations available for replay, keyed by the name they were recorded under.
 * `decide()` registers on first call, so anything that has ever run can be re-run.
 */
const REPLAYABLE = new Map<string, (input: never) => unknown>();

export type Decision<O> = { value: O; trace: DecisionTrace };

/**
 * Run a pure decision function and record it in one step.
 *
 * @param fn      stable name — this is the replay key, so don't rename casually
 * @param impl    the pure function; must not read anything outside `input`
 * @param input   everything the decision depends on
 * @param summary one line for the "Why this decision?" expander
 */
export function decide<I, O>(
  fn: string,
  impl: (input: I) => O,
  input: I,
  summary: string,
): Decision<O> {
  REPLAYABLE.set(fn, impl as (i: never) => unknown);
  const value = impl(input);
  const inputJson = canonical(input);
  const outputJson = canonical(value);
  const inputHash = digest(inputJson);
  return {
    value,
    trace: {
      // Derived from the content, not a counter — the same decision on the same facts
      // carries the same id, which is what makes traces comparable across sessions.
      id: `${fn}-${inputHash.slice(0, 8)}`,
      fn,
      summary,
      at: new Date().toISOString(),
      input: inputJson,
      inputHash,
      output: outputJson,
      outputHash: digest(outputJson),
    },
  };
}

export type ReplayResult = {
  ok: boolean;
  /** False when the function isn't registered in this session — not a mismatch. */
  replayable: boolean;
  expected: string;
  actual: string | null;
  note: string;
};

/**
 * Re-execute a recorded decision and compare digests. This is the part that makes the
 * ledger a proof rather than a paper trail: the original output is never trusted, it is
 * recomputed from the stored input.
 */
export function replay(trace: DecisionTrace): ReplayResult {
  const impl = REPLAYABLE.get(trace.fn);
  if (!impl) {
    return {
      ok: false,
      replayable: false,
      expected: trace.outputHash,
      actual: null,
      note: `${trace.fn} hasn't run in this session, so there's nothing registered to replay against.`,
    };
  }
  let actual: string;
  try {
    actual = digest(canonical(impl(JSON.parse(trace.input) as never)));
  } catch {
    return {
      ok: false,
      replayable: true,
      expected: trace.outputHash,
      actual: null,
      note: "Re-execution threw — the recorded input no longer satisfies this function.",
    };
  }
  return {
    ok: actual === trace.outputHash,
    replayable: true,
    expected: trace.outputHash,
    actual,
    note:
      actual === trace.outputHash
        ? "Re-executed against the recorded input and reached a byte-identical result."
        : "Re-execution produced a different result — the decision function has changed since this was recorded.",
  };
}

/** Traces we keep per account. Enough to show a history, small enough for localStorage. */
export const LEDGER_LIMIT = 40;

/** Newest first, de-duplicated by id so a repeated identical decision doesn't spam. */
export function appendTrace(ledger: DecisionTrace[], trace: DecisionTrace): DecisionTrace[] {
  return [trace, ...ledger.filter((t) => t.id !== trace.id)].slice(0, LEDGER_LIMIT);
}

/** Pretty-print canonical JSON for the expander, without pulling in a formatter. */
export function formatTraceValue(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}
