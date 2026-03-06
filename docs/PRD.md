# PRD — Goldilock Zone

## 1) Summary
Goldilock Zone is a salary‑negotiation simulator that makes total compensation, tax impact, and negotiation tradeoffs visible through interactive sliders and clear verdicts.

## 2) Problem
Negotiation happens in the dark. Candidates lack tools to model tradeoffs between base, bonus, equity, signing, currency, and tax. This causes under‑negotiation and poor decision‑making.

## 3) Target Users
- Candidates negotiating offers (ICs & managers)
- Employees comparing relocation offers
- Senior hires balancing cash vs equity

## 4) Goals
- Make offer comparisons understandable in < 60 seconds
- Help users identify **negotiation leverage** (which components move the needle)
- Provide a clear “verdict” on whether the offer is low/ok/good/great

## 5) Non‑Goals (v1)
- Employer verification
- Legal/tax advice beyond simplified models
- Full multi‑currency portfolio tracking

## 6) Core Use Cases
1. **Compare current comp vs offer** in the same currency.
2. **Adjust sliders** to see how negotiation changes total comp and take‑home.
3. **Get a verdict** with action‑oriented guidance (“Push for signing bonus”).

## 7) MVP Features
### Inputs
- Current comp (base, bonus, equity)
- New offer builder (base, bonus %, equity, signing)
- Tax profile toggle (country or preset)
- Currency toggle
- Live FX rates for top tech currencies

### Outputs
- Total compensation (Year 1)
- Take‑home (annual + monthly)
- % change vs current
- Breakdown bars (base/bonus/equity/signing)
- Verdict card with suggestion

### Visuals
- Modern “negotiation cockpit” UI (based on the provided HTML)
- Clear interactive sliders
- Big TC number + delta

## 8) UX Direction
- Dark, finance‑terminal vibe (high contrast)
- Sliding controls are the primary interaction
- Emphasis on clarity and confidence
- “Goldilock” framing (not too low/high, just right)

## 9) Success Metrics
- Time to understand offer < 60s (user testing)
- ≥ 60% of users interact with sliders
- ≥ 30% of users export/share summary

## 10) Data & Logic (v1)
- Basic tax model by preset (simple slabs or flat %)
- Currency conversion static for v1
- Avoid legal/tax compliance claims

## 11) Technical Notes (Proposed)
- Web app (Next.js + Tailwind)
- Stateless client‑side calculations
- Preset tax profiles
- Live FX via a free rates API (cached, daily refresh)
- Top tech currencies: USD, EUR, GBP, INR, SGD, CAD, AUD, THB, AED

## 12) Information Architecture & Screens
### Screen 1 — Current Details (Intake)
**Goal:** capture baseline comp + location/tax profile
- Fields: country, currency, base (annual), bonus (annual), equity (annualized), other
- Toggle: tax regime (preset)
- CTA: **Continue →**

### Screen 2 — Goldilock Simulator
**Goal:** interactive negotiation cockpit
- Offer sliders: base, bonus %, equity, signing
- Live TC + take‑home panel
- Verdict engine (lowball → goldmine)
- Currency toggle (live FX)
- Save / share summary

## 13) Future Ideas
- Offer templates by company/level
- Market benchmarks (levels.fyi style)
- Save/share negotiation profile
- PDF export of summary
- Multiple offers side‑by‑side

---

## Appendix: Inspiration (Provided HTML)
- Dual‑currency toggle
- Baseline vs offer builder
- Verdict engine with narrative
- Breakdown bars and take‑home panels
