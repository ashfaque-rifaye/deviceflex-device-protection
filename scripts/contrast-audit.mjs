// WCAG 2.1 contrast audit of the AT&T token pairs actually used in the prototype.
const hex = (h) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const T = {
  cyan: "#009fdb",
  navy: "#00388f",
  navyHover: "#0057b8",
  link: "#0072b2",
  ink: "#1d2329",
  ink2: "#454b52",
  ink3: "#686e74",
  muted: "#878c94",
  white: "#ffffff",
  gray: "#f3f4f6",
  pale: "#f2fafd",
  pale2: "#e7f5fb",
  cyanSoft: "#dcf3fa",
  deep: "#002837",
  border: "#dcdfe3",
  success: "#1f7a3d",
  warning: "#9e5d00",
  danger: "#c70032",
};

// [label, foreground, background, size] — "lg" = >=18.66px bold or >=24px
const PAIRS = [
  ["Body copy on white", T.ink, T.white, "sm"],
  ["Body copy on gray section", T.ink, T.gray, "sm"],
  ["Body copy on pale section", T.ink, T.pale, "sm"],
  ["Body copy on pale-2", T.ink, T.pale2, "sm"],
  ["Secondary copy on white", T.ink2, T.white, "sm"],
  ["Tertiary copy on white", T.ink3, T.white, "sm"],
  ["Tertiary copy on gray", T.ink3, T.gray, "sm"],
  ["Tertiary copy on pale-2", T.ink3, T.pale2, "sm"],
  ["Link on white", T.link, T.white, "sm"],
  ["Link on gray", T.link, T.gray, "sm"],
  ["Link on pale-2", T.link, T.pale2, "sm"],
  ["Primary button label", T.white, T.navy, "sm"],
  ["Primary button label (hover)", T.white, T.navyHover, "sm"],
  ["Secondary button label", T.navy, T.white, "sm"],
  ["Secondary label on hover fill", T.white, T.navyHover, "sm"],
  // WCAG 1.4.3 exempts inactive controls from contrast. These are AT&T's own
  // production values, so we keep them rather than diverging from the brand.
  ["Disabled label (exempt)", T.muted, T.border, "exempt"],
  ["On-dark button label", T.pale, T.deep, "sm"],
  ["On-dark hover label", T.navy, T.cyanSoft, "sm"],
  ["White on deep band", T.white, T.deep, "sm"],
  ["White on navy band", T.white, T.navy, "sm"],
  ["Success text on white", T.success, T.white, "sm"],
  ["Warning text on white", T.warning, T.white, "sm"],
  ["Warning text on amber tint", T.warning, "#fff3e0", "sm"],
  ["Danger text on white", T.danger, T.white, "sm"],
  ["Cyan on white (LARGE only)", T.cyan, T.white, "lg"],
  ["Cyan on navy (accent)", T.cyan, T.navy, "lg"],
];

const need = (size) =>
  size === "exempt"
    ? { AA: 0, AAA: Infinity }
    : { AA: size === "lg" ? 3 : 4.5, AAA: size === "lg" ? 4.5 : 7 };

let fails = 0;
const rows = PAIRS.map(([label, fg, bg, size]) => {
  const r = ratio(fg, bg);
  const { AA, AAA } = need(size);
  const grade = size === "exempt" ? "n/a" : r >= AAA ? "AAA" : r >= AA ? "AA" : "FAIL";
  if (grade === "FAIL") fails++;
  return { label, fg, bg, size, r: r.toFixed(2), grade };
});

const pad = (s, n) => String(s).padEnd(n);
console.log(
  pad("PAIR", 32) + pad("FG", 10) + pad("BG", 10) + pad("SIZE", 6) + pad("RATIO", 8) + "GRADE",
);
console.log("-".repeat(74));
for (const x of rows) {
  console.log(
    pad(x.label, 32) + pad(x.fg, 10) + pad(x.bg, 10) + pad(x.size, 6) + pad(x.r, 8) + x.grade,
  );
}
console.log("-".repeat(74));
const aaa = rows.filter((r) => r.grade === "AAA").length;
const aa = rows.filter((r) => r.grade === "AA").length;
console.log(`${rows.length} pairs · ${aaa} AAA · ${aa} AA · ${fails} failing`);
process.exit(fails ? 1 : 0);
