# The patentable core

Source: `chat-images/35-44` — photographs of the Word document holding the patent working
session. This file is the distilled, actionable version. Where I disagreed with the source I
say so and explain why.

## The constraint that governs everything

Under the **Alice/Mayo** two-step test, *"a tiered device-protection membership with better
ARPU"* is not patentable. Insurance and pricing tiers are a fundamental economic practice — an
abstract idea. Doing it "on an app" fails step 1.

To survive, a claim must clear **step 2**: an inventive concept delivering a *concrete
technical improvement to how the machine works*, not what the business achieves. Courts uphold
`Enfish` (a specific data structure that improved computer performance) and `McRO` (a specific
rules-based technique); they reject "AI-powered system" claims that describe only what the
software does.

> **We patent the mechanism, not the membership.**

## The organising principle

**AI perceives. Deterministic functions decide.**

| Layer | Job | Nature | Lives in |
|---|---|---|---|
| AI (perception) | Messy real-world input → clean structured facts | Probabilistic | Vision model, LLM, anomaly detector |
| Deterministic engine (decision) | Structured facts → verdict + resolution | Pure function, replayable | `src/lib/ai.ts` |

The vision model reads a cracked screen and says *"severity: moderate, confidence 0.82."* The
decision — *approve → home repair → $0* — is made by a pure function anyone can replay. That
gives us the intelligence of AI **and** the auditability of a pure function, and it is the
answer to the only hard question a judge can ask: *how do we trust the AI?*

This split is simultaneously the moat, the patent claim, and the pitch.

## Product change: the gadget library and loaner are cut

Decided by the user, and correct. A loaner's availability is **non-deterministic** — it cannot
be promised. The Data Vault is the deterministic substitute: data continuity is guaranteed even
when a spare handset is not. Gadget borrow adds cost and logistics risk and dilutes the core.

Removing them makes the concept tighter *and* more patentable, because it forces the value into
a technical mechanism rather than a service perk.

**Cleanup required:** `DeviceFlex-Blueprint.html` still lists "Gadget & accessory library" and
"Free loaner during repair" as capability pills and tier rows.

---

## The five mechanisms

Ranked by defensibility. #1 is the crown jewel because only a carrier can build it.

### 1. Network-Signal-Corroborated Claim Engine — *the AT&T-only moat*

**Plain English:** let the network confirm the story instead of trusting a form.

Today, when someone says "my phone was lost," Asurion has no way to check. They believe the
customer or demand an affidavit. That is where most insurance fraud lives.

AT&T runs the network, so it already knows: when the device last reached a tower, whether it
went dark abruptly, whether the SIM or IMEI went silent, and roughly which cell site it was on.
Fusing that telemetry with the claim flow auto-corroborates loss and theft, gates fraud, and
pre-authorises resolution *before* a human reviews it.

**Why only AT&T:** Apple and Asurion do not run a network. They structurally cannot see tower
pings or SIM status.

**Why patentable:** not a business rule ("we approve claims") but a machine that ingests network
signals and produces a faster, more accurate fraud decision — a concrete technical effect.

**Where it lands:** `src/data/network-signals.ts` (new) → `corroborateClaim()` in `src/lib/ai.ts`
→ surfaced in `FraudCheckRun.tsx`.

> **My change to the spec:** the source treats this as one always-passing check. That is
> theatre. The corroboration must compare the member's *reported incident time* against
> `lastSeenOnNetwork` and disagree when they don't line up — and at least one seeded device must
> genuinely contradict, so the demo can show a flagged case. A verifier that always says yes
> verifies nothing, and a judge will notice.

### 2. Line-Anchored Restoration Manifest

**Plain English:** your coverage and your data belong to your phone *number*, not your handset.

Insurance today is bound to a physical device (its IMEI). The vault instead maintains a
continuously reconciled, device-agnostic **state manifest keyed to the subscriber identifier** —
a live checklist of apps, contacts, photos and settings hanging off the line, with devices as
pointers. A replacement pulls the manifest and rebuilds in ~2 minutes, because the recipe for
the phone was never tied to the broken one.

**Technical effect:** reduces restore time from days to <2 minutes, and turns "15-minute swap"
from a logistics promise into a *provisioning* improvement.

**Why patentable:** a specific data-structure design (manifest keyed to subscriber, not device).
This is the `Enfish` argument — a data structure that makes the system work better.

**Where it lands:** `manifest` on `Member` → `reconcileManifest()` called from the existing
`reconcile()` in `auth.tsx` (which already runs on every mutation) → `provisionFromManifest()`.

### 3. Deterministic, Replayable Decision Ledger — *the "we already built this" win*

**Plain English:** every AI decision can be re-run and proven. No black box.

The eight agents in `src/lib/ai.ts` are *already* pure functions — same input, same output, by
deliberate design. Making that patent-visible costs almost nothing: every decision emits a
hashed, replayable trace; `replayDecision(traceId)` re-runs the function and proves the same
output.

**Technical effect:** eliminates model drift and enables verifiable, reproducible automated
underwriting — a specific improvement over black-box ML.

**Where it lands:** `src/lib/ledger.ts` (new) → a "Why this decision?" expander on
`AdvisorPanel.tsx`.

> **My change to the spec:** the source proposes a logging *wrapper* that records alongside the
> real call. A parallel log drifts from the thing it claims to describe. Instead the ledger is
> the call path — a `decide()` combinator wraps a pure function and returns `{ value, trace }`,
> so a decision cannot happen without being recorded. Replay then genuinely re-executes and
> compares digests rather than reprinting a stored string. Two further details the source
> misses: the hash must be over **canonical** JSON (sorted keys) or it is not stable, and it
> must be **synchronous** — `crypto.subtle` is async and cannot sit inside a pure function.

### 4. Multi-Path Resolution Optimizer with Inventory Pre-Staging

**Plain English:** predict where a phone will break, and quietly move a replacement nearby
*before* it happens.

`resolutionOptions`, `findStores` and `bestStore` already rank repair / home-repair / swap /
ship against store stock and technician availability. The addition is a deterministic
**device-health decay index** that trends downward as battery and screen risk worsen, and a
`preStage()` function that pre-positions the matching device plus restore snapshot at the
nearest capable node when the index crosses a threshold.

**Technical effect:** ties software decisions to physical supply-chain movement — a real-world
effect, which is exactly what clears Alice step 2. Patent examiners like this because it is
plainly not "an abstract idea on a computer."

### 5. Device-Attested Underwriting Gate

**Plain English:** the phone proves its own condition, so nobody can insure an already-broken
phone.

People wait until the screen is cracked, then buy insurance and claim. Insurers call this
adverse selection. Before enrolment, the device runs its own diagnostic and produces a **signed
condition attestation** — `{ deviceId, checks, healthScore, signature, timestamp }`. The gate
blocks enrolment without a valid, recent attestation.

`DiagnosticsModal.tsx` + `runDiagnostics` already do the inspection, and `assessEnrolment` in
`eligibility.ts` already blocks pre-existing damage. This formalises it as a signed certificate.

**Why patentable:** on-device attestation is a technical security mechanism, not a policy rule,
and aligns with device-identity standards — one of AT&T's three patent anchors.

---

## The three additions that harden the disclosure

| # | Addition | Slots into | Effort |
|---|---|---|---|
| ① | Network corroboration | `FraudCheckRun.tsx` (Mechanism 1) | 1 data file + 1 function |
| ② | Closed-loop Protection Score | `computeProtectionScore` + `reconcile()` | Rewire outputs, no new UI |
| ③ | Coverage-continuity token | `enroll()` in `auth.tsx` | Small mock-crypto util |

**On ②:** the score is currently a *thermometer* — a number you look at. Make it a
**thermostat**: its output becomes an input to `assessEnrolment`, the fraud threshold, and
pre-staging. A closed control loop is far more clearly "technical" than a displayed number, and
the plumbing already exists because `reconcile()` recomputes on every mutation.

> **My change to the spec:** a control loop nobody can see is not a demo. The UI must show the
> feedback edge — *"Protection Score 82 → fraud sensitivity: standard"* — or the strongest claim
> in the set stays invisible to judges.

**On ③:** a cryptographic token bound to the line carrying "this line is covered" + a pointer to
the restore manifest. This is what makes "coverage follows the number, not the phone" a
claimable data-security mechanism rather than a slogan. Mocked for the demo.

---

## Illustrative claim skeleton

*For the IDF, not final legal language.*

**Independent claim (system).** A device-protection system comprising: a subscriber-identifier-
anchored state manifest continuously reconciled from a covered device; a network-telemetry
ingestion module that corroborates a claim event against carrier-side device-presence signals; a
deterministic decision engine that emits a replayable decision trace ranking resolution paths
against live fulfilment-node inventory and technician availability; and a provisioning module
that restores the manifest to a replacement device bound to the same subscriber identifier.

**Dependent claims.**
- …wherein the network telemetry comprises last-seen-on-network time, disconnection pattern, and cell-site location.
- …wherein the decision engine pre-positions a replacement device when a device-health decay index crosses a deterministic threshold.
- …wherein enrolment is gated by a signed on-device condition attestation.
- …wherein a cryptographic coverage token binds coverage and manifest pointer to the subscriber line across device changes.

**Prior-art framing** (the IDF asks for this without searching third-party patents): existing
solutions rely on manual claim forms, human fraud review, handset-bound coverage, and
shipping-based replacement with customer-managed backup. None corroborate claims using carrier
network telemetry, none anchor a restoration manifest to the subscriber line, and none use a
deterministic replayable decision ledger. This invention uniquely integrates network-rooted
verification, line-anchored provisioning, and reproducible decisioning into one system.

**Recommended anchor:** Mechanisms **#1 + #2 + #3** as a single integrated system claim. That
trio is uniquely AT&T, technically concrete enough to clear Alice step 2, and impossible for
Asurion or Apple to replicate.

## AT&T's three patent anchors

Every AT&T patent must map to at least one. This hits all three.

| Anchor | How DeviceFlex hits it |
|---|---|
| Products & Services | Protect Advantage, Mobility core, device provisioning — directly on the roadmap |
| Competitor Offerings | Clear differentiation vs Asurion / AppleCare / Verizon / T-Mobile |
| Industry Standards | On-device attestation + network-signal claims align to 3GPP / device-identity work |

## Submission path

Details are in `chat-images/38-patent-idf-submission-path.jpg`. The two things that matter for
sequencing:

1. **File the IDF before presenting to judges.** The US is first-to-file, and presenting is a
   public disclosure. This is a hard ordering constraint on the whole project.
2. Emailing the patent disclosure number to the Sprint-a-thon committee is worth **5 bonus
   points**.

The portal, the named patent developer, timelines and award amounts are in that screenshot —
deliberately not copied here, since this file is committed and those include a personal contact.

---

## Build status

All five mechanisms and all three additions are **implemented and verified in the running
app**, in the source's recommended impact-per-effort order.

| # | Item | Where it lives | Verified by |
|---|---|---|---|
| 1 | Decision Ledger (#3) | `src/lib/ledger.ts` · `WhyThisDecision.tsx` | Replay in the browser: `advise` re-executed, recorded `5384ee…bd1f` = recomputed `5384ee…bd1f` |
| 2 | Network corroboration (#1) | `src/data/network-signals.ts` · `corroborateClaim()` · `FraudCheckRun.tsx` | Corroborated path (88%, cell site ORL-1147) **and** contradicted path (93%, SIM in another handset) |
| 3 | Closed-loop score (②) | `protectionPosture()` · `ProtectionScore.tsx` | All three feedback edges render on the dashboard; fraud gate reads `velocityThreshold` |
| 4 | Line-anchored manifest (#2) | `src/lib/manifest.ts` · vault page | 5 manifests built, one per line, all continuity-token bindings verified |
| 5 | Attestation (#5) + token (③) | `src/lib/attestation.ts` | Enrolment gated end-to-end: 17 checks signed, health 92/100, sig `A493…C695`, persisted |
| 6 | Pre-staging (#4) | `preStage()` · device page | Mia's iPhone 16: index 48 crossed the 55 threshold → staged at AT&T Winter Park |

Health: build passes · eslint 0 errors (4 pre-existing warnings) · zero console errors on a
clean load.

### Behaviour worth pointing at during the demo

Two things make these read as mechanisms rather than decoration:

1. **A contradicted claim does not blocklist the handset.** Suspending a line and blacklisting
   an IMEI on evidence the network disputes is the one place this could do real harm, so the
   flagged path stops short of it and holds for a specialist. The network data changes what
   the system *does*, not just what it says.
2. **The enrolment gate is enforced in the reducer, not the UI.** `enroll()` silently drops any
   device without a valid signed attestation, so no screen can route around it. That is the
   difference between a control and a suggestion.
