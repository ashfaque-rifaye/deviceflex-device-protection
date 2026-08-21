// Remote Phone Diagnostics.
//
// This is the same inspection AT&T reserves the right to run before approving an
// enrolment, done from the customer's own device instead of a counter. It serves
// three jobs at once, which is why it lives in one place:
//
//   · ENROLMENT — proves "good working condition", the gate on both the 30-day
//     window and Open Enrollment.
//   · CLAIMS    — corroborates what the photos show, and catches faults a photo
//     can't (a dead mic, a failing digitizer, a swollen battery).
//   · PROTECTION SCORE — turns a guess about device health into a measurement.
//
// Four passes, mirroring how real remote-diagnostic suites are built:
//   1. Sensors & hardware   touch, cameras, speakers, mics, buttons, IMU
//   2. System & battery     charge cycles, thermals, true capacity, logs
//   3. Visual AI scan       computer vision over photos for cracks and frame damage
//   4. Device identity      IMEI, model and OS, for eligibility and fraud
//
// Deterministic: the same device always produces the same report, so a demo never
// surprises anyone. Swap `runDiagnostics` for real telemetry and nothing above changes.
import type { MemberDevice } from "@/data/member";

export type CheckStatus = "pass" | "warn" | "fail";

export type DiagnosticCheck = {
  id: string;
  label: string;
  /** Shown while this check is running. */
  running: string;
  /** The measured value, once it settles. */
  result: string;
  status: CheckStatus;
};

export type DiagnosticPass = {
  id: "sensors" | "system" | "visual" | "identity";
  title: string;
  blurb: string;
  checks: DiagnosticCheck[];
};

export type DiagnosticReport = {
  passes: DiagnosticPass[];
  /** Overall device condition, which is what enrolment actually gates on. */
  condition: "good" | "impaired" | "damaged";
  headline: string;
  summary: string;
  /** 0–100 hardware health, feeds the Protection Score. */
  healthScore: number;
  failures: DiagnosticCheck[];
  warnings: DiagnosticCheck[];
};

/** Screen-risk is our stand-in for accumulated impact history. */
const impact = (d: MemberDevice) =>
  d.screenRisk === "High" ? 2 : d.screenRisk === "Medium" ? 1 : 0;

export function buildPasses(d: MemberDevice, hasPhotos: boolean): DiagnosticPass[] {
  const hit = impact(d);
  const batteryPoor = d.batteryHealth < 80;
  const batteryFading = d.batteryHealth < 85;

  return [
    {
      id: "sensors",
      title: "Sensors & hardware",
      blurb: "Touch accuracy, cameras, audio, buttons and motion sensors.",
      checks: [
        {
          id: "touch",
          label: "Touch digitizer",
          running: "Sweeping the touch grid for dead zones…",
          result: hit >= 2 ? "Dead zone detected, lower third" : "All zones responsive",
          status: hit >= 2 ? "fail" : "pass",
        },
        {
          id: "display",
          label: "Display output",
          running: "Cycling test patterns across the panel…",
          result: hit >= 2 ? "Backlight uneven near impact point" : "Uniform, no dead pixels",
          status: hit >= 2 ? "warn" : "pass",
        },
        {
          id: "cameras",
          label: "Cameras",
          running: "Capturing focus and exposure samples…",
          result: hit >= 2 ? "Rear wide: autofocus hunting" : "Front and rear focus normally",
          status: hit >= 2 ? "warn" : "pass",
        },
        {
          id: "audio",
          label: "Speakers & microphones",
          running: "Playing a sweep tone and recording it back…",
          result: "Earpiece, loudspeaker and 3 mics all responding",
          status: "pass",
        },
        {
          id: "buttons",
          label: "Buttons & haptics",
          running: "Polling power, volume and the action button…",
          result: "All inputs register; haptic engine responding",
          status: "pass",
        },
        {
          id: "imu",
          label: "Accelerometer & gyroscope",
          running: "Reading motion sensors against a known reference…",
          result: hit >= 2 ? "Gyro drift beyond tolerance" : "Within tolerance on all axes",
          status: hit >= 2 ? "warn" : "pass",
        },
      ],
    },
    {
      id: "system",
      title: "System & battery",
      blurb: "Charge cycles, thermals, true capacity and internal logs.",
      checks: [
        {
          id: "capacity",
          label: "True battery capacity",
          running: "Reading the battery management controller…",
          result: `${d.batteryHealth}% of original capacity`,
          status: batteryPoor ? "fail" : batteryFading ? "warn" : "pass",
        },
        {
          id: "cycles",
          label: "Charge cycles",
          running: "Counting completed charge cycles…",
          result: `${400 + (100 - d.batteryHealth) * 38} cycles`,
          status: d.batteryHealth < 82 ? "warn" : "pass",
        },
        {
          id: "thermal",
          label: "Thermal behaviour",
          running: "Sampling temperature under synthetic load…",
          result: batteryPoor ? "Peaks 6°C above normal under load" : "Within normal range",
          status: batteryPoor ? "warn" : "pass",
        },
        {
          id: "charge",
          label: "Charging & port",
          running: "Negotiating charge handshake…",
          result: "Fast charge negotiated, port clean",
          status: "pass",
        },
        {
          id: "logs",
          label: "System logs",
          running: "Scanning crash and kernel panic logs…",
          result: hit >= 2 ? "3 display-driver faults in 30 days" : "No repeated faults in 30 days",
          status: hit >= 2 ? "warn" : "pass",
        },
        {
          id: "liquid",
          label: "Liquid-contact indicator",
          running: "Reading the moisture indicator…",
          result: "Not triggered",
          status: "pass",
        },
      ],
    },
    {
      id: "visual",
      title: "Visual & cosmetic AI scan",
      blurb: hasPhotos
        ? "Computer vision over the photos you added, checking glass, frame and housing."
        : "Add photos and the vision model checks glass, frame and housing.",
      checks: hasPhotos
        ? [
            {
              id: "front",
              label: "Front glass",
              running: "Running the vision model over the front-face photo…",
              result:
                hit >= 2
                  ? "Shattered — multiple impact points"
                  : hit === 1
                    ? "Hairline crack, upper-right"
                    : "No cracks or chips found",
              status: hit >= 2 ? "fail" : hit === 1 ? "warn" : "pass",
            },
            {
              id: "frame",
              label: "Frame & housing",
              running: "Checking edges for deformation…",
              result: hit >= 2 ? "Deformation, lower-left corner" : "Straight, no deformation",
              status: hit >= 2 ? "fail" : "pass",
            },
            {
              id: "rear",
              label: "Rear glass & camera bezel",
              running: "Inspecting the rear housing…",
              result: hit >= 2 ? "Rear glass cracked" : "Intact",
              status: hit >= 2 ? "warn" : "pass",
            },
          ]
        : [
            {
              id: "skipped",
              label: "Visual scan",
              running: "Waiting for photos…",
              result: "Skipped — no photos supplied",
              status: "warn",
            },
          ],
    },
    {
      id: "identity",
      title: "Device identity",
      blurb: "Confirms the device on the line, for eligibility and fraud.",
      checks: [
        {
          id: "imei",
          label: "IMEI",
          running: "Reading the IMEI from the modem…",
          result: `${d.imei} — matches ${d.line}`,
          status: "pass",
        },
        {
          id: "model",
          label: "Model & storage",
          running: "Confirming the hardware model…",
          result: `${d.brand} ${d.name} · ${d.storage} · ${d.color}`,
          status: "pass",
        },
        {
          id: "os",
          label: "OS build",
          running: "Reading the software build…",
          result: "Current build, not jailbroken or rooted",
          status: "pass",
        },
        {
          id: "blocklist",
          label: "Blocklist status",
          running: "Checking the national blocklist…",
          result: "Clear — not reported lost or stolen",
          status: "pass",
        },
      ],
    },
  ];
}

export function runDiagnostics(d: MemberDevice, hasPhotos = false): DiagnosticReport {
  const passes = buildPasses(d, hasPhotos);
  const all = passes.flatMap((p) => p.checks);
  const failures = all.filter((c) => c.status === "fail");
  const warnings = all.filter((c) => c.status === "warn");

  const healthScore = Math.max(0, Math.min(100, 100 - failures.length * 22 - warnings.length * 6));

  const condition: DiagnosticReport["condition"] =
    failures.length > 0 ? "damaged" : warnings.length >= 3 ? "impaired" : "good";

  const headline =
    condition === "damaged"
      ? "Damage found — this device isn't in good working condition"
      : condition === "impaired"
        ? "Working, with wear worth addressing"
        : "Good working condition";

  const summary =
    condition === "damaged"
      ? `${failures.length} hardware ${failures.length === 1 ? "fault" : "faults"} found: ${failures.map((f) => f.label.toLowerCase()).join(", ")}. A device in this state can't be newly enrolled — but if it's already covered, this is exactly what a claim is for.`
      : condition === "impaired"
        ? `Everything essential works. ${warnings.length} things are showing wear — mostly ${warnings
            .slice(0, 2)
            .map((w) => w.label.toLowerCase())
            .join(" and ")} — which is worth knowing before they become a claim.`
        : `All ${all.length} checks passed. Hardware, battery, housing and identity all read normal, so this device meets the good-working-condition requirement for enrolment.`;

  return { passes, condition, headline, summary, healthScore, failures, warnings };
}

/** How long each check dwells on screen, so the run reads as work. */
export const dwellFor = (c: DiagnosticCheck) =>
  c.status === "fail" ? 850 : c.id === "capacity" || c.id === "front" ? 700 : 420;
