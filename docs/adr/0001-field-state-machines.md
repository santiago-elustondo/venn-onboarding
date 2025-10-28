# ADR 0001 — Field State Machines for Onboarding Form

Status: Accepted

Date: 2025-10-28

## Context

We need a predictable, accessible, and testable way to model form fields with:
- Blur/idle-driven validation (no error while typing).
- Mixed local and remote validation (e.g., corporation number).
- Clear separation of concerns between domain rules, field logic, I/O adapters, and UI.
- Robustness against network issues, cancellation, and transient states.

## Decision

Adopt deterministic state machines per field, expressed as React hooks under `modules/fields/*`. Each machine:
- Exposes a small, consistent surface (value, onChange/onBlur/onFocus, validity, helpers).
- Encodes transitions in a reducer and drives side effects via `useEffect`.
- Defers domain rules to `modules/domain/*` and I/O to `modules/io/*`.

Form composition (`modules/forms/useOnboardingForm.ts`) orchestrates fields, aggregates state, and injects I/O dependencies.

## Scope

- Local-only fields: name, phone → `useSimpleField` + light wrappers.
- Remote-enhanced field: corporation number → `useCorpNoField`.
- Shared domain validators/messages → `modules/domain/*`.
- I/O adapters with timeouts/abort and typed results → `modules/io/*`.
- TTL cache for remote results → `modules/cache/*`.
- Presentational-only UI → `components/*` and `app/*` views.

## Architecture Overview

- Domain (pure):
  - `modules/domain/simple.ts`: `isValidName`, `isValidPhoneCA`, and message helpers.
  - `modules/domain/corpNo.ts`: `PlausibleCorpNo`, plausibility checks, message formatting.
- Fields (state machines):
  - `modules/fields/useSimpleField.ts`: generic local validation machine.
  - `modules/fields/useNameField.ts`: name field using `isValidName`.
  - `modules/fields/usePhoneField.ts`: phone field using `useSimpleField`, plus E.164 and error gating.
  - `modules/fields/useCorpNoField.ts`: corp number machine with local plausibility + remote I/O + cache.
- I/O:
  - `modules/io/corpFetcher.ts`: remote validity check for corporation numbers.
  - `modules/io/postProfileDetails.ts`: submit payload with robust error handling.
- Cache:
  - `modules/cache/inMemoryCorpNoCache.ts`: TTL-based in-memory cache.
- Form composition:
  - `modules/forms/useOnboardingForm.ts`: composes fields, injects dependencies, exposes `canSubmit`, `validateAll`, `submit`, `reset`.

## State Machines

### SimpleField (local validation)

File: `modules/fields/useSimpleField.ts`

Tags: `empty | active | invalid | valid`

Events:
- `change(value, timestamp)`: updates value; transitions to `empty` (when value empty) or `active`.
- `blur(timestamp)`: records touch (sets `lastBlurAt`), triggers evaluation in next tick.
- `focus(timestamp)`: clears error if in `invalid`, returns to `active` or `empty`.
- `evaluate(timestamp)`: runs validator; `valid` → `valid`, otherwise `invalid`.

Timers:
- Idle timer (default 500ms) when in `active` triggers `evaluate`.

Derived:
- `isTouched`: `lastBlurAt !== null || value.length > 0`.
- `isValid`: `tag === 'valid'`.
- `isInvalid`: `tag === 'invalid'`.

UX:
- No error while typing.
- Error appears after blur or idle tick.
- Focus clears visible error and returns to editing.

### NameField

File: `modules/fields/useNameField.ts`

Implementation: Thin wrapper over `useSimpleField` with `isValidName`. Error text is derived at form level via `getNameValidationError(name)` when `isInvalid` is true.

### PhoneField

File: `modules/fields/usePhoneField.ts`

Implementation: Built on `useSimpleField({ validator: isValidPhoneCA })` with phone-specific conveniences:
- `isValid`: computed from domain validator.
- `e164`: computed from `react-phone-number-input` when valid.
- Error gating: only show error after blur (`isTouched`) and while invalid; message is `Required` or `Invalid`.
- Focus clears error visibility but leaves validity intact.

Rationale: Keep a consistent machine for local validation while providing a user-friendly error cadence and formatting.

### CorpNoField (local + remote validation)

File: `modules/fields/useCorpNoField.ts`

Tags:
- `empty` — no input.
- `active` — editing in progress, no error while typing.
- `implausible` — fails local plausibility (non-digits, wrong length).
- `checking` — plausible locally, remote validation in-flight.
- `valid` — remote accepted.
- `invalid` — remote rejected with a message.
- `error` — network/timeout/server error with message.

Events:
- Local: `change(value, ts)`, `blur(ts)`, `focus(ts)`, `evaluate(ts)`.
- Remote: `remote:start(currentValue, ts)`, `remote:ok(result, ts)`, `remote:invalid(result, ts)`, `remote:error(result, ts)`.

Core logic:
1. Input changes drive `empty`/`active`. Any in-flight request is aborted.
2. Blur or idle triggers `evaluate`.
3. `evaluate` runs `whyNotPlausibleCorpNo`:
   - If issue → `implausible` with `localIssue`.
   - Else → `checking` with `currentValue` (`PlausibleCorpNo`).
4. `checking` launches remote I/O:
   - Uses `cache` first. Otherwise calls injected `fetcher(currentValue, signal)`.
   - Aborts stale requests on value changes.
   - Maps typed results to `valid` / `invalid` / `error` states.
   - Caches `valid`/`invalid` results with TTL.
5. `validateNow()` returns a Promise that resolves to the final validity once remote completes (or immediately for terminal/immediate states).
6. `reset()` aborts in-flight requests, clears timers and state.

UX:
- No error while typing; implausible issues (“Only digits”, “9 digits”) appear on blur/idle only.
- While `checking`, input remains enabled (no focus flicker). Spinner shows beside label.
- Result message (invalid/error) shows beside label. Focus behavior remains stable.

### I/O Adapters

Files: `modules/io/corpFetcher.ts`, `modules/io/postProfileDetails.ts`

Conventions:
- Accept `AbortSignal` for cancellation.
- Apply timeouts with `AbortController` and (optionally) `AbortSignal.any` when available.
- Return typed results; do not throw on non-abort errors (network/server/timeout mapped to structured result).
- Be lenient on legacy API shapes (e.g., `corporationNumber` present) for compatibility.

### Cache

File: `modules/cache/inMemoryCorpNoCache.ts`

Simple TTL cache (default 5 min), periodic cleanup, and safe `destroy()`. Reduces duplicate remote calls for repeated corp numbers.

## Rationale & Trade-offs

Pros:
- Deterministic transitions; richer observability of state versus boolean flags.
- Clear separation of domain rules, field logic, and I/O; easier to test.
- Better UX guarantees (no errors while typing; accessible messages; focus stability).
- Resilient to network issues and cancellation.

Cons:
- More code than ad-hoc form handling or single-library solutions.
- Requires disciplined testing and edge-case handling (e.g., stale requests, timeouts).

Alternatives considered:
- Centralized form library with schema-driven validation for everything. Rejected for remote validation complexity, cancellation, and fine-grained UX control.
- Ad-hoc per-field logic without machines. Rejected for lack of predictability and testability.

## Testing Strategy

We verify both logic and UX:
- Domain tests (`__tests__/modules/domain/*`): validators and message helpers.
- Hook integration (`__tests__/modules/hooks/*`): local machine transitions, idle/blur edges.
- App-level behavior (`__tests__/app/*`):
  - Validation timing (no errors while typing; after blur/idle).
  - Focus/label/error interactions (no flicker; blue focus maintained).
  - Corp number remote validation with a controllable deferred fetcher to simulate in-flight and completion.
  - Stability and continuity test suites assert the enabled-during-checking behavior.

## Consequences

- UI surfaces stay presentational and easy to reason about (spinner/checkmark/errors beside label).
- Machines make it straightforward to add new fields following the same pattern.
- If we change UX (e.g., disable inputs during checking), we can adjust a single place and update tests.

## Future Work

- Consider a tiny helper around `AbortSignal.any` for broad runtime support.
- If we add more remote fields, consider extracting a generic remote-checking machine with pluggable domain + fetcher.
- Expand error messages to support localized copy and telemetry of state transitions if needed.

