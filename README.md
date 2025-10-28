# Onboarding Form Architecture

A testable form architecture in Next.js + TypeScript

## Principles

- Purity at the core: domain modules are side‑effect free and easy to test.
- Single responsibility: domain vs. field machines vs. form orchestration vs. I/O vs. UI.
- Deterministic reducer state machines for fields; no errors while typing (blur/idle validation).
- Dependency‑injected I/O with abort + timeout handling; typed results instead of throwing.
- Accessibility: stable focus, ARIA live regions, unobtrusive feedback (spinner/checkmark beside labels).

## Project Structure

```
app/
  page.tsx                 # Landing
  onboarding/
    page.tsx               # Form route
    FormView.tsx           # Presentational form view
    PhoneFieldView.tsx     # Presentational phone field view
  welcome/page.tsx         # Success route

components/
  form-input.tsx           # Reusable input + label + right‑aligned status
  ui/                      # Focused UI primitives (button, input, label, etc.)

lib/
  tailwind.ts              # cn() utility (clsx + tailwind-merge)

modules/
  domain/                  # Pure validation & types (no React)
    simple.ts              # Name/phone validators + messages
    corpNo.ts              # Plausibility + messages + branded type
  fields/                  # Field state machines (React hooks)
    useSimpleField.ts      # Local field machine (empty → active → valid/invalid)
    useNameField.ts        # Name field wrapper
    usePhoneField.ts       # Phone field wrapper (E.164 + error gating)
    useCorpNoField.ts      # Corp number (local + remote + cache)
  io/                      # I/O adapters with abort + timeout
    abort.ts               # composeAbortSignal, withTimeoutSignal
    config.ts              # API_BASE_URL
    corpFetcher.ts         # Remote corp number validation
    postProfileDetails.ts  # Form submission
  cache/
    inMemoryCorpNoCache.ts # TTL cache for corp validation results
  forms/
    useOnboardingForm.ts   # Composes fields + submit flow

__tests__/                 # Unit/integration/UX behavior tests
```

## Field State Machines

### SimpleField (name, phone)
- Tags: `empty | active | invalid | valid`.
- Events: `change`, `blur`, `focus`, `evaluate`.
- Idle timer (default ~500ms) when `active` triggers `evaluate`.
- Derived: `isTouched`, `isValid`, `isInvalid`.
- UX: No error while typing; show after blur or idle. Focus clears visible error and returns to editing.

`useNameField` and `usePhoneField` are thin wrappers around `useSimpleField`. Phone adds:
- `e164` formatting via `react-phone-number-input` when valid.
- Error gating: `Required` or `Invalid`, shown only after blur.

### CorpNoField (local + remote)
- Tags: `empty | active | implausible | checking | valid | invalid | error`.
- Local plausibility (`whyNotPlausibleCorpNo`) → if ok, go `checking` with `currentValue` (branded type).
- Remote I/O:
  - Aborts stale requests on change.
  - Uses TTL cache for `valid`/`invalid` results.
  - Returns typed results; input remains enabled during `checking`.
  - `validateNow()` resolves when remote completes or immediately for terminal states.
  - `reset()` aborts, clears awaiters, and empties value.

## I/O Adapters
- Accept an `AbortSignal` and merge with a timeout (`withTimeoutSignal`).
- `corpFetcher`: GET corp validity; supports legacy shapes; maps HTTP to `valid/invalid/error`.
- `postProfileDetails`: POST submission; typed `ok/false` with friendly messages.
- Only throw on `AbortError`; otherwise return typed error results.

## UX Patterns
- No errors while typing; blur/idle displays validation.
- Spinner and checkmark align to the right of labels (not in inputs).
- Live region announces status succinctly; focus stays stable during `checking`.

## Tests (What We Cover)
- Domain validators and messages.
- Field hook transitions (idle/blur timing, cancellation, reset).
- App UX: focus stability under validation, spinner/checkmark positions, error messaging.
  - Remote corp validation uses a deferred fetcher mock to simulate in‑flight and completion.

## Quickstart
- Install: `npm install`
- Dev: `npm run dev` → http://localhost:3000
- Test: `npm test`
