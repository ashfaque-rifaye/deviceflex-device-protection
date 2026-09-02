# AT&T DeviceFlex

**AT&T Protect Advantage, reimagined as an AI-powered device membership — and rebuilt around evidence only a carrier can see.**

Sprint-a-thon 2026 · working prototype · <https://deviceflex-device-protection.vercel.app>

---

## Contents

- [What this is](#what-this-is)
- [The organising principle](#the-organising-principle)
- [Quick start](#quick-start)
- [Demo accounts and the demo path](#demo-accounts-and-the-demo-path)
- [The problem](#the-problem)
- [The product](#the-product)
- [The five mechanisms](#the-five-mechanisms-the-patentable-core)
- [System architecture](#system-architecture)
- [Tech stack](#tech-stack)
- [Repository map](#repository-map)
- [What is real, what is seeded, what is absent](#what-is-real-what-is-seeded-what-is-absent)
- [Design fidelity](#design-fidelity)
- [Security, compliance and governance](#security-compliance-and-governance)
- [Unit economics](#unit-economics)
- [Roadmap](#roadmap)
- [Failure modes](#failure-modes)
- [Deployment and the two-repo arrangement](#deployment-and-the-two-repo-arrangement)
- [Related documents](#related-documents)

---

## What this is

Device protection is the only product a customer pays for monthly and hopes never to use.

DeviceFlex turns it into a membership that does something every month, and rebuilds the claim itself around signals only the network operator holds. It is **not a competing product** — it is a layer on top of the $5.2B protection programme AT&T already operates, sitting inside the existing myAT&T experience. There is no separate app and no new brand: the buy flow, account overview and device pages are the ones customers already use, with protection promoted from a line item to a managed plan.

Underneath the membership sits the part that is genuinely novel and genuinely defensible: a decision architecture in which probabilistic models are confined to perception, and every consequential decision is made by a pure, replayable function over account state.

**Who it is for**

| Audience  | Who                                                                                 | What they get                                                                              |
| --------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Primary   | The covered household — 21.4M AT&T mobility customers, ~18M on a protection feature | Know the cost and the resolution before committing; the network helps prove the story      |
| Secondary | Store associates and ProTech agents                                                 | A claim already verified, priced, and routed to a node with stock on hand                  |
| Tertiary  | Asurion and its underwriter                                                         | A complete, corroborated, auditable claim payload instead of an affidavit and a phone call |

---

## The organising principle

> **AI perceives. Deterministic functions decide.**

| Layer      | Job                                             | Nature                    | Lives in                            |
| ---------- | ----------------------------------------------- | ------------------------- | ----------------------------------- |
| Perception | Messy real-world input → clean structured facts | Probabilistic             | Vision model, LLM, anomaly detector |
| Decision   | Structured facts → verdict + resolution         | Pure function, replayable | `src/lib/ai.ts`                     |

The vision model reads a cracked screen and says _"severity: moderate, confidence 0.82."_ The decision — _approve → home repair → $0_ — is made by a pure function anyone can replay.

This split is simultaneously the moat, the patent claim, and the pitch. It is also the governance mechanism: a model **cannot** approve, deny, price or blocklist. It can only describe what it observed. That constraint is architectural rather than procedural, which means it holds under pressure and can be demonstrated rather than attested.

---

## Quick start

```bash
npm install
```

```bash
npm run dev
```

The app runs at <http://localhost:8080>.

### Scripts

| Command            | What it does                                                  |
| ------------------ | ------------------------------------------------------------- |
| `npm run dev`      | Vite dev server on port 8080                                  |
| `npm run build`    | Production build via Nitro                                    |
| `npm run preview`  | Preview the built Worker bundle                               |
| `npm run lint`     | ESLint (expect 0 errors, 4 cosmetic `react-refresh` warnings) |
| `npm run format`   | Prettier across the repo                                      |
| `npm run contrast` | Colour-contrast audit of the AT&T token palette               |

### Environment

The vision model is **optional**. Leave it unconfigured and the claim flow falls back to the deterministic on-device assessment and says so in the UI.

Copy `.env.example` to `.env` and fill in a key to enable it:

```bash
cp .env.example .env
```

| Variable      | Purpose                                                                           |
| ------------- | --------------------------------------------------------------------------------- |
| `AI_BASE_URL` | OpenAI-compatible endpoint (Fireworks by default)                                 |
| `AI_API_KEY`  | Server-side only — **never** prefix with `VITE_`, or the key ships to the browser |
| `AI_MODEL`    | A vision-capable model served there                                               |

Switching to an AMD cloud-native / vLLM endpoint is those three variables, not a rewrite — the bridge speaks the OpenAI-compatible chat-completions shape.

> `npx tsc --noEmit` reports errors about `./routeTree.gen` — that file is gitignored and generated by the Vite plugin at dev time. Run the dev server once and they clear.

---

## Demo accounts and the demo path

Sign in at `/login` and pick an account. There is **no real authentication** — it is a demo session selector, labelled as such in the code.

| Account       | State                                                          | Shows                                                                                     |
| ------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `alex.rivera` | Enrolled · Family tier · 5 devices · 2 prior claims · score 85 | The main path — and the iPhone 17e whose telemetry deliberately contradicts a loss report |
| `jordan.kim`  | Not enrolled · 3 ageing devices · outstanding balance          | Eligibility under Open Enrollment, and the not-protected state                            |
| `maya.osei`   | Brand new · 1 phone, 9 days old                                | The 30-day new-device enrolment door — the cleanest run at the flow                       |

### Suggested demo path — about four minutes

1. **Sign in as Alex → Manage protection.** The Protection Score, the closed loop behind the ⓘ, the device tiles with live network status.
2. **File a loss claim on the iPhone 17 Pro Max.** Watch the six checks run. The network corroborates at 88%. Stop at the consent gate.
3. **Repeat on the iPhone 17e.** The network _contradicts_ at 93%, the SIM is in another handset, and the blocklist submission is withheld.
4. **Take the upgrade path.** Replace-vs-upgrade at the same $275, then the billing split.
5. **Finish on `/deviceflex/impact`** and replay a decision live.

---

## The problem

Device protection is a mature, commoditised category. Verizon, T-Mobile and AT&T all resell substantially the same Asurion-administered product on substantially the same terms. Differentiation on price is impossible; differentiation on experience has not been seriously attempted.

|               |                                                       |
| ------------- | ----------------------------------------------------- |
| **18% / 70%** | Protection attach online versus in retail — the wedge |
| **$5.2B**     | AT&T device-protection programme revenue, 2025        |
| **~0.9%**     | Monthly claim rate — a large, stable base             |
| **1–3 days**  | Typical shipped-replacement wait today                |

**Where it breaks**

- **The deductible is a surprise.** A member discovers their $275 replacement deductible at the counter, or at step two of a claim form. The single most important number in the product is the one hidden longest.
- **Loss claims run on trust alone.** An administrator that does not operate a network cannot check whether a phone really went dark. It can believe the customer or demand an affidavit. Most claim fraud lives here, and honest customers pay for it in premiums and friction.
- **Coverage is bound to a handset.** The policy names an IMEI; the backup belongs to whichever cloud account the customer set up months earlier. Restoring takes days and only works if they did something right long before the incident.
- **Zero utility between claims.** The product activates only during a disaster. There is nothing to open in the eleven months nothing happens.

**Why the alternatives fall short**

| Alternative              | What it does                                      | Where it fails                                                                                                     |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Asurion / phoneclaim.com | Web intake, tiered deductibles, next-day shipping | No network visibility. Manual fraud review. Handset-bound. No engagement surface.                                  |
| AppleCare+               | Excellent repair network, strong brand trust      | Single-manufacturer. No carrier data. No household pooling. Cannot see the line.                                   |
| Verizon / T-Mobile       | Same underwriter, near-identical terms            | Structurally identical, so competes only on price — eroding the category for everyone                              |
| Self-insuring            | Pay retail when something breaks                  | A $1,199 flagship against a $275 deductible is bad arithmetic, but the product never makes that comparison visible |

**The unfair advantage.** AT&T runs the network. For every line on the account it already knows when the device last reached a tower, which one, whether it went dark abruptly or wound down cleanly, and whether the SIM has since turned up in a different handset. A protection administrator without a network can ask a customer to fill in a form. It has no equivalent and no path to one — a structural asymmetry, not a head start.

---

## The product

### Three tiers, one membership

| Capability                 | Basic · $15/mo                                                  | Plus · $25/mo | Family · $40/mo |
| -------------------------- | --------------------------------------------------------------- | ------------- | --------------- |
| Devices covered            | 1                                                               | 1             | Up to 5         |
| Screen & back-glass repair | $0, unlimited                                                   | $0, unlimited | $0, unlimited   |
| Replacement deductible     | Asurion tier schedule — $25 / $100 / $225 / $275 by device tier |               |                 |
| Home screen repair         | —                                                               | Included      | Included        |
| Data Vault                 | 50 GB                                                           | 500 GB        | 1 TB shared     |
| Annual accessory perk      | —                                                               | 1 free        | 2 free          |
| "New, not refurbished"     | —                                                               | Yes           | Yes             |

### The journey

| Step             | What happens                                                                                                                                                                                                             | Where                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 1 · Discover     | Protection appears as a tiered membership at the add-ons step of a normal purchase, not as a checkbox. Deductibles visible before the plan is chosen.                                                                    | `/buy/phones → /buy/plan → /buy/addons → /buy/cart`        |
| 2 · Enrol        | Two real doors: the 30-day new-device window, or Open Enrollment. Each device must present a signed condition attestation before coverage starts — **enforced in the reducer**, so no screen can route around it.        | `/myatt/enroll` · `eligibility.ts` · `attestation.ts`      |
| 3 · Live with it | A Protection Score across the household sets the fraud-review threshold, whether adding a device needs inspection, and whether a spare is pre-positioned.                                                                | `/myatt/protection` · `/vault` · `/family` · `/perks`      |
| 4 · Claim        | Choose what happened, choose the device, then three photos (damage), an incident report (loss/theft) or remote diagnostics (malfunction/battery). Six checks run in a dialog, each operation shown as it executes.       | `/myatt/claims/new` · `EligibilityAgentModal.tsx`          |
| 5 · Consent      | Suspending a line and blocklisting an IMEI stops the handset working on every US carrier. A separate, explicitly consented step naming every consequence — **refused outright** when the network contradicts the report. | `suspensionPlan()`                                         |
| 6 · Resolve      | The Advisor ranks repair, home repair, swap, ship and upgrade on cost, time, data and outcome, then opens the three-screen Asurion journey.                                                                              | `resolutionOptions()` · `advise()` · `ReplacementFlow.tsx` |
| 7 · Restore      | The replacement is provisioned from the line's manifest. The broken device participates in nothing — which is why it working, being destroyed or being blocklisted makes no difference.                                  | `provisionFromManifest()` · `SmartRestore.tsx`             |

### Deliberately cut

An earlier concept included a borrowable gadget library and loaner devices. Both were removed. **A loaner's availability is non-deterministic — it cannot be promised**, and gadget logistics add cost while diluting the core. The Data Vault is the deterministic substitute: data continuity is guaranteed even when a spare handset is not. Cutting them made the concept tighter _and_ more patentable, because it forced the value into a technical mechanism rather than a service perk.

---

## The five mechanisms (the patentable core)

Under the **Alice/Mayo** two-step test, _"a tiered device-protection membership with better ARPU"_ is not patentable — insurance and pricing tiers are a fundamental economic practice, and implementing one "on an app" fails step one. To survive, a claim must clear step two: a concrete technical improvement to how the machine works, not what the business achieves.

> **We patent the mechanism, not the membership.**

Ranked by defensibility.

### 1 · Network-Signal-Corroborated Claim Engine — the AT&T-only moat

Fuses carrier-side device-presence telemetry — last-seen-on-network, disconnection pattern, SIM/IMEI status, cell-site context — with the claim flow to auto-corroborate loss and theft and gate fraud before a human reviews it.

**Technical effect:** improves the machine's fraud-decision accuracy using signals structurally unavailable to Asurion and Apple. Not a business rule — a machine that ingests network signals and produces a faster, more accurate decision.
**Where:** `src/data/network-signals.ts` → `corroborateClaim()` in `src/lib/ai.ts`

### 2 · Line-Anchored Restoration Manifest

A continuously reconciled, device-agnostic state manifest keyed to the **subscriber identifier** rather than the IMEI, with handsets as pointers, plus a cryptographic continuity token binding coverage and manifest pointer to the line.

**Technical effect:** reduces restore from days to under two minutes and makes the 15-minute swap a _provisioning_ improvement rather than a logistics promise. This is the `Enfish` argument — a data structure that makes the system work better.
**Where:** `src/lib/manifest.ts` → `reconcileManifest()`, `provisionFromManifest()`

### 3 · Deterministic, Replayable Decision Ledger

Every automated decision is emitted by a pure function and recorded with digests of its canonical input and output. Replay re-executes the same function against the recorded input and compares digests.

**Technical effect:** eliminates model drift and enables verifiable, reproducible automated underwriting — and answers _"how do we know the AI was right?"_
**Where:** `src/lib/ledger.ts` — `decide()` is a **combinator, not a logging wrapper**: it runs the function and returns `{ value, trace }`, so a recorded decision and an executed one are the same event by construction. Digests are over _canonical_ (key-ordered) JSON, and synchronous, because `crypto.subtle` is async and cannot sit inside a pure function.

### 4 · Multi-Path Resolution Optimizer with Inventory Pre-Staging

A deterministic device-health decay index that, on crossing a threshold, pre-positions a matching replacement plus restore snapshot at the nearest capable fulfilment node.

**Technical effect:** ties software decisions to physical supply-chain movement — a concrete real-world effect, which is precisely what clears Alice step two.
**Where:** `healthDecayIndex()`, `preStage()`, `resolutionOptions()` in `src/lib/ai.ts`

### 5 · Device-Attested Underwriting Gate

On-device diagnostics produce a signed condition attestation over sensors, battery, housing and identity — `{ deviceId, checks, healthScore, signature, timestamp }`. Enrolment is gated on a valid, recent, signature-verified attestation.

**Technical effect:** prevents adverse selection and pre-existing-damage fraud through a technical security mechanism rather than a policy rule.
**Where:** `src/lib/attestation.ts` · `DiagnosticsModal.tsx` — the gate is enforced in the **state-mutation layer**, so no presentation-layer path can bypass it.

### Why a PHOSITA would not expect this

The prevailing direction of travel in automated underwriting is _more_ model, not less. A person of ordinary skill, handed a vision model and a claim flow, would wire the model's confidence directly into the approve/deny path. This design does the opposite — it deliberately quarantines the probabilistic component to perception, forbids it from touching the decision, then makes that boundary auditable by hashing both sides.

The second non-obvious step is **inverting the key** of the restoration data structure. Every incumbent binds coverage and backup to the handset, because the handset is what breaks. Keying to the subscriber line is counter-intuitive precisely because the line is not the thing being insured.

### Sequencing constraint

The US is first-to-file, and presenting to judges is a **public disclosure**. The Invention Disclosure Form must be filed **before** the demo. Recommended anchor: mechanisms **1 + 2 + 3** as a single integrated system claim.

Full claim skeleton and prior-art framing: **[`PATENT.md`](PATENT.md)**.

---

## System architecture

The architecture figure lives in **[`DeviceFlex-Dossier.html`](DeviceFlex-Dossier.html) §07**. It draws two lanes:

**Today** — claim form → manual review → Asurion intake → replacement ships → customer restores from their own backup. Nothing on that path is measured: no carrier signal reaches it, coverage is bound to the handset's IMEI, and no decision can be re-run.

**With DeviceFlex** — same administrator, every upstream input measured:

```
SOURCE SYSTEMS   Handset camera · Claim intake form · On-device inspection
                 Carrier network ┐ Account & billing ┐   (AT&T-only)
                       │              │                  │
PERCEPTION       Damage assessment · Disconnect analysis · Coverage assistant
(probabilistic)        │              │                  │   already structured —
                       │              │                  │   no model in the path
═══════════════════════▼══════════════▼══════════════════▼═════════════════════
FACT CONTRACT    enum severity · boolean flags · integer scores · ISO timestamps
                 · signed digests — schema-validated on arrival
═══════════════════════════════════════════════════════════════════════════════
DECISION ENGINE  Claim corroboration · Underwriting gate ·
(pure functions) Resolution optimiser · Protection posture ──┐
                       │                                     │ closed loop
                       ▼                                     │
LEDGER           canonical JSON, digest in and digest out  ◄──┘
                       │
EFFECTS          Asurion intake · Blocklist & suspension ·
                 Fulfilment pre-staging · Line-anchored provisioning
```

Both lanes end at the same administrator — **that is the point**. DeviceFlex changes what reaches that intake, not who receives it.

### Data flow, end to end

1. **Ingress.** Photos are read client-side, converted to data URIs, and posted to a TanStack server function. They never touch a third-party host from the browser.
2. **Perception.** The server function lazily imports `vision.server.ts` so the provider module never enters the client bundle. The API key is read from `process.env` server-side only.
3. **Validation.** The model's reply is parsed out of any markdown fence and validated against a flat Zod schema. Failure throws a `VisionError`, and the caller falls back to the deterministic assessment.
4. **Decision.** Structured facts plus account state enter pure functions. **`now` is passed as a parameter** rather than read from the clock — a function that calls `Date.now()` internally is not replayable.
5. **Recording.** `decide()` runs the function and returns `{ value, trace }`.
6. **Reconciliation.** Every state mutation passes through `reconcile()`, which recomputes the score and rebuilds every line manifest. "Continuously reconciled" is true _by construction_, not by discipline.
7. **Egress.** Whatever the claim type, **one payload shape** reaches Asurion. Swapping the simulated transport for a real POST changes nothing upstream.

### Production shape — what would change

The prototype's persistence is deliberately trivial. A deployed system keeps the same decision architecture and replaces the edges:

| Concern   | Production                                                                                                                                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State     | Postgres; the manifest as a versioned JSONB document keyed by subscriber identifier, row-level security by line                                                                                                                         |
| Ledger    | Append-only, write-once storage with S3 Object Lock or equivalent — _a ledger that can be edited proves nothing_                                                                                                                        |
| Telemetry | AT&T's internal network-data APIs, with strict purpose limitation and a short retention window                                                                                                                                          |
| Signing   | Attestations signed in the device's secure enclave, verified against the manufacturer root; continuity tokens signed by a carrier key in an HSM                                                                                         |
| Inference | Vision serving behind an internal gateway with per-tenant quotas, request signing and a circuit breaker to the deterministic path                                                                                                       |
| Scale     | ~0.9% monthly claims on 18M subscribers ≈ 162k claims/month — trivial write volume. The load is read-heavy dashboard traffic (edge-cacheable per line) and burst inference at incident peaks (queues behind the deterministic fallback) |

---

## Tech stack

| Layer          | Choice                             | Why                                                                                                  |
| -------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Framework      | TanStack Start · React 19          | File-based routing with typed search params; SSR without a separate server codebase                  |
| Server runtime | Nitro                              | Preset-portable — the same build targets Vercel, Cloudflare Workers or Node with one env var         |
| Build          | Vite 8 · Rolldown                  | Sub-5-second production builds; route-level code splitting by default                                |
| Styling        | Tailwind v4 + an AT&T token layer  | Design tokens in `styles.css` carry the real brand values                                            |
| Validation     | Zod                                | Model output validated at the boundary — a malformed VLM response falls back rather than propagating |
| Vision         | OpenAI-compatible chat-completions | Fireworks today; an AMD/vLLM endpoint is three env vars                                              |
| State          | React context + localStorage       | **Prototype only**                                                                                   |

---

## Repository map

```
src/
├── routes/          17 route modules + __root layout
├── components/
│   ├── att/         Primitives on the AT&T design system (Button, Field, Modal, …)
│   ├── deviceflex/  Product surfaces (ProtectionScore, ReplacementFlow, …)
│   └── site/        Chrome — header, mega-nav, footer, chat, global widgets
├── data/            Seeded domain data
├── lib/             Agents, ledger, manifest, attestation, vision bridge
└── styles.css       AT&T token layer
```

### Routes

| Route                                                  | Purpose                                         |
| ------------------------------------------------------ | ----------------------------------------------- |
| `/`                                                    | AT&T homepage replica                           |
| `/buy/phones`, `/buy/plan`, `/buy/addons`, `/buy/cart` | Storefront buy flow                             |
| `/login`                                               | Demo session selector                           |
| `/myatt`                                               | Account overview                                |
| `/myatt/device/$id`                                    | Device detail                                   |
| `/myatt/enroll`                                        | Two-door enrolment with the attestation gate    |
| `/myatt/protection`                                    | Plan management, Protection Score, device tiles |
| `/myatt/claims/new`                                    | The claim engine                                |
| `/myatt/vault`, `/myatt/family`, `/myatt/perks`        | Vault, household pool, accessory perk           |
| `/deviceflex`, `/deviceflex/impact`                    | Concept landing and the impact / replay surface |

### Key modules

| File                      | Role                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `lib/ai.ts`               | The deterministic agents — corroboration, resolution ranking, posture, scoring, fraud, pre-staging |
| `lib/ledger.ts`           | Canonical serialisation, digests, `decide()`, `replay()`                                           |
| `lib/manifest.ts`         | Line manifests, continuity tokens, provisioning                                                    |
| `lib/attestation.ts`      | Signed condition attestation and the enrolment gate                                                |
| `lib/asurion.ts`          | The single outbound claim payload shape                                                            |
| `lib/vision.server.ts`    | Server-only VLM call with schema validation and fallback                                           |
| `lib/auth.tsx`            | Demo session, `reconcile()` on every mutation                                                      |
| `data/network-signals.ts` | Carrier telemetry — the file only AT&T could populate                                              |
| `data/deductibles.ts`     | The real Asurion schedule                                                                          |
| `data/meganav.ts`         | The att.com mega-nav, transcribed from the live header                                             |

---

## What is real, what is seeded, what is absent

A prototype that overstates itself is worse than one that admits its edges.

| Component                     | Status     | Detail                                                                                                         |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| Full journey, all routes      | **Real**   | Buy flow, account, enrolment, claim, replacement, vault, family, perks, impact                                 |
| Asurion deductible schedule   | **Real**   | $25 / $100 / $225 / $275 by tier; $0 uncapped screen repair; $850 non-return fee                               |
| Enrolment rules               | **Real**   | 30-day window and Open Enrollment, with the good-working-condition gate                                        |
| Vision model call             | **Real**   | OpenAI-compatible, Zod-validated, provider-swappable. Unconfigured in production, so it falls back and says so |
| Decision ledger & replay      | **Real**   | Canonical serialisation, digests, live re-execution. Verified byte-identical on replay                         |
| Consent gate on blocklisting  | **Real**   | Enforced flow; refused outright when telemetry contradicts                                                     |
| Attestation gate on enrolment | **Real**   | Enforced in the state reducer, not the UI                                                                      |
| AT&T design system            | **Real**   | Published palette and type; 34/34 pairs audited, 15 AAA / 18 AA, none failing                                  |
| Carrier network telemetry     | _Seeded_   | Eight devices, expressed as offsets from _now_ so the demo never goes stale. **One deliberately contradicts**  |
| Signatures & tokens           | _Digest_   | FNV-1a over canonical JSON — a checksum, **not a credential**. Labelled as such throughout the source          |
| Store inventory & technicians | _Fixed_    | Four Orlando-area stores with fixed stock and slots, so answers are reproducible                               |
| Account persistence           | _Local_    | `localStorage` per demo account; survives reload, resets on demand                                             |
| Payment & checkout            | **Absent** | Deliberately not built. No card entry exists anywhere in the system                                            |
| Real authentication           | **Absent** | A demo session selector, explicitly labelled as not authentication                                             |

### Edge cases, handled explicitly

- **Network contradicts the member** — the claim proceeds to a specialist rather than auto-approving, and the blocklist submission is withheld. Blocking on disputed evidence would strand a working device.
- **Vision provider unreachable** — falls back to the deterministic assessment and says so. A demo must never show a spinner that never resolves.
- **Device already damaged at enrolment** — attestation fails, enrolment refused, and the refusal is _evidenced_: the failing check set is stored, not just asserted.
- **Claim outside the 60-day window** — still accepted, flagged for Asurion review rather than silently rejected, with the day count stated.
- **No incident time given** — corroboration degrades to a pattern-only verdict at reduced confidence rather than fabricating agreement.
- **Malfunction or battery claim** — the engine declines to speak. A device that will not charge can still register normally, so network presence is neither support nor contradiction. Diagnostics carry it.
- **Stale persisted state** — a record saved before a schema field existed still loads; `reconcile()` backfills on read.
- **Tier downgrade drops devices** — the plan-change flow names which devices lose coverage before the change is committed.

---

## Design fidelity

The shell is a faithful att.com replica, because a prototype that looks like a mockup gets evaluated as one.

- **Mega-nav** — all four menus (Shop, Deals, AT&T Difference, Support), their rails, quick-action rows, column headings and links transcribed from the live header into `src/data/meganav.ts`.
- **Icons** — official AT&T SVG paths for nav categories, the header search / cart / account glyphs, the "Search or chat" fusion mark, and the account category nav.
- **Chrome** — the right-edge Feedback tab over the navy chat launcher at att.com's own `4px 0 0 4px` radius; the "Welcome back!" account hover tray with its quick-action row, three columns and blue swoosh.
- **Colour** — published AT&T palette in a token layer; `npm run contrast` audits every pair.

---

## Security, compliance and governance

**Stated plainly: this is a prototype.** Its "signatures" are FNV-1a digests over canonical JSON, not signed credentials — a browser has no key material and no secure element, and faking that convincingly would be worse than saying so. **The structure is what is claimable; the cryptography is what a deployment supplies.** Every such boundary is labelled in the source.

| Concern              | As designed for production                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| In transit           | TLS 1.3 throughout. Vision requests leave only from the server runtime, so no provider credential is ever client-reachable                                       |
| At rest              | AES-256 on the vault and claim store. Photographic evidence carries the shortest retention — deleted once the claim closes                                       |
| Authentication       | Federated through the existing AT&T ID, not a parallel identity                                                                                                  |
| Authorization        | Line-scoped. The manifest is keyed by subscriber identifier, which makes row-level security natural                                                              |
| Irreversible actions | Blocklist submission requires explicit informed consent, is refused when telemetry disputes the report, and is enforced in the mutation layer rather than the UI |
| Auditability         | Every automated underwriting decision carries a replayable trace — a compliance asset, not just a patent claim                                                   |

### Regulatory alignment

| Regime                     | Relevance                                                                                         | Architectural response                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **CPNI** (47 U.S.C. §222)  | Highest priority. Cell-site location and call detail are customer proprietary network information | Purpose limitation to an active claim on the member's own line; short retention; every access recorded in the ledger |
| State insurance regulation | Automated adverse decisions are regulated                                                         | Human-in-the-loop by design — the agent flags, it never refuses. The replay trace evidences any decision on review   |
| CCPA / CPRA                | Access and deletion rights over vault contents and claim evidence                                 | Manifest keyed to the line makes export and deletion a single-subject operation                                      |
| GDPR                       | Article 22 covers automated decision-making                                                       | The deterministic engine supplies the "meaningful information about the logic involved" — literally, by replay       |
| SOC 2                      | Expected at AT&T scale                                                                            | Append-only ledger and enforced-in-reducer gates map onto change-management and access-control criteria              |
| PCI DSS                    | Deductibles are billed, not charged at checkout                                                   | Deliberately out of scope — no card data enters this system                                                          |

---

## Unit economics

| Lever             | Today    | With DeviceFlex | Mechanism                                                                       |
| ----------------- | -------- | --------------- | ------------------------------------------------------------------------------- |
| Protection attach | ~40%     | 55–65%          | Close the 18%-online / 70%-retail gap by answering the deductible question      |
| ARPU (protection) | $25      | up to $40       | Tier ladder; Family raises revenue per _account_ faster than per device         |
| Revenue streams   | 1        | 7+              | Tiers, home-repair add-on, accessory upsell, enterprise/fleet, trade-in capture |
| Replacement time  | 1–3 days | ~15 min         | Pre-staging plus line-anchored provisioning                                     |
| Feature churn     | ~1.26%   | lower           | Family pool and shared vault create household switching costs                   |

**Cost to serve** is unusually favourable because the expensive component is bounded by the _claim rate_, not by traffic. At ~0.9% monthly claims, roughly 99% of member sessions invoke no inference at all — dashboards, scores, vault views and eligibility checks are all pure functions over state the system already holds.

---

## Roadmap

| Phase                 | Scope                                                                                                     | Success measure                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Now**               | Full journey, five mechanisms, deployed and clickable                                                     | Sprint-a-thon; **IDF filed before demo**                    |
| **1** · 0–3 mo        | IDF through InspireIP; deductible transparency shipped into the live claim flow as a standalone change    | Disclosure number issued; measurable lift in digital attach |
| **2** · 3–6 mo        | Network corroboration behind a flag on loss/theft, **shadow-mode first** — decisions logged, not enforced | Agreement rate versus manual review outcomes                |
| **3** · 6–9 mo        | Line-anchored manifest for one device family; attestation gate at enrolment                               | Restore time; adverse-selection claim rate at 90 days       |
| **4** · 9–15 mo       | Pre-staging pilot in one metro; tier ladder replaces the flat feature charge                              | Same-day swap rate; ARPU movement                           |
| **Platform** · 15 mo+ | Corroboration and attestation exposed as internal services to Fraud, Care and Retail                      | Adoption by teams outside protection                        |

There is no customer-acquisition problem — the audience is already inside myAT&T. The strategic prize is the platform phase: corroboration and attestation are generic capabilities that Fraud, Care and Retail all want.

---

## Failure modes

**The design principle: degrade to deterministic.** Every dependency has a defined answer for what happens when it is unavailable, and in every case the answer is a working, honest, lower-fidelity product — never a spinner.

| Dependency        | Failure                  | Fallback                                                                   | Member impact                                |
| ----------------- | ------------------------ | -------------------------------------------------------------------------- | -------------------------------------------- |
| Vision provider   | Down, slow, unconfigured | Deterministic on-device assessment, labelled in the UI                     | Claim proceeds; severity from diagnostics    |
| Network telemetry | Unavailable              | Corroboration returns _inconclusive_, never a fabricated pass              | Loss claim routes to manual review, as today |
| Asurion intake    | Unreachable              | Payload queued with an idempotency key; member sees a claim id immediately | None                                         |
| Store inventory   | Stale or down            | Optimizer drops to shipping paths and says stock could not be confirmed    | Fewer same-day options, no false promises    |
| Vault storage     | Degraded                 | Manifest reconciliation pauses; last-known manifest still provisions       | Restore may miss the most recent hours       |
| Cloud region      | Zone loss                | Nitro preset portability — the same build runs elsewhere                   | Read-only degradation during failover        |

### Honest risks

- **CPNI approval is the long pole.** Using cell-site data for claim adjudication is a privacy and regulatory question before it is an engineering one. Shadow mode in Phase 2 exists to build that case with evidence.
- **Corroboration can be wrong.** A phone left in a drawer looks like a lost phone. This is why the mechanism _flags_ rather than refuses, and why a contradicted claim withholds the blocklist instead of denying the claim.
- **Pre-staging carries inventory cost.** Positioning stock against a prediction ties up capital. The threshold is the control; start conservative, loosen on measured hit rate.

---

## Deployment and the two-repo arrangement

Production is Vercel:

```bash
npx vercel --prod
```

The build is Nitro-preset portable — `NITRO_PRESET=vercel` in `vercel.json`; Cloudflare and Node are configuration rather than migration.

**Two GitHub repos are in play and they are not peers.** `origin` (`deviceflex-device-protection`) is canonical; all work happens there on `main`. `lovable` (`pixel-perfect-at-t`) is Lovable's own repo, two-way synced with the Lovable editor, bridged by the local `lovable-sync` branch. Lovable only _exports_ — it cannot be pointed at an existing populated repo, which is why it made its own.

**Never force-push, rebase, amend or squash anything already pushed to `lovable`.** Full procedure: **[`SYNC.md`](SYNC.md)**.

---

## Related documents

| Document                                                 | Contents                                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| **[`DeviceFlex-Dossier.html`](DeviceFlex-Dossier.html)** | The full 14-section product & IP dossier, including the architecture figure |
| **[`PATENT.md`](PATENT.md)**                             | The five mechanisms in depth, claim skeleton, prior-art framing             |
| **[`GAPS.md`](GAPS.md)**                                 | Audited open gaps against `main`                                            |
| **[`SYNC.md`](SYNC.md)**                                 | The two-repo Lovable arrangement                                            |

### Private material — not in this repo

`Screenshots/`, `chat-images/`, `First Document.docx` and `Prompt - *.txt` are gitignored. Several are captures and DOM dumps of a **real signed-in myAT&T account** — account numbers, balances, billing pages and live auth tokens. They must not be pushed or published.

---

_AT&T DeviceFlex · Sprint-a-thon 2026 · Internal draft, not for external distribution._
_Figures sourced from internal AT&T programme data and Mintel, Mobile Network Providers — US, January 2026. Deductible schedule from the Protect Advantage brochure (49-state consumer edition)._
