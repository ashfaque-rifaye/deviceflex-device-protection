// Counts raw AT&T brand hexes still sitting in screens, via the opt-in ESLint rule.
//
// Kept out of `npm run lint` on purpose: the backlog is large enough that mixing it in
// would bury the handful of real warnings. This is a number to drive down, not a gate.
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["eslint", ".", "--format", "stylish"], {
  env: { ...process.env, LINT_TOKENS: "1" },
  encoding: "utf8",
  shell: process.platform === "win32",
});

const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
const hits = (out.match(/no-restricted-syntax/g) ?? []).length;

console.log(
  out
    .split("\n")
    .filter((l) => l.includes("no-restricted-syntax"))
    .slice(0, 25)
    .join("\n"),
);
console.log(
  `\nRaw brand hexes still in the codebase: ${hits}` +
    `\nThese should be var(--color-att-*) tokens or att/ components. The number only goes down.`,
);
