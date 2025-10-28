# Onboarding Form App

A small Next.js + TypeScript app demonstrating a cohesive, testable form architecture with strong separation of concerns.

## Highlights

- Blur/idle-driven validation UX (no errors while typing)
- Deterministic field state machines (local + remote validation)
- Dependency-injected I/O adapters with error handling and cancellation
- In-memory TTL cache for remote corp number validation
- Accessible UI with consistent focus styles and ARIA semantics
- Comprehensive tests (RTL + Jest)

## Getting Started

Prereqs: Node 18+ (recommended 20)

- Install: `npm install`
- Dev: `npm run dev` then open http://localhost:3000
- Test: `npm test`
- Build: `npm run build` then `npm start`

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
  form-input.tsx           # Reusable input + label + error
  ui/                      # Small, focused UI primitives

lib/
  utils.ts                 # cn() utility

modules/
  domain/
    simple.ts              # Local validators + messages (name/phone)
    corpNo.ts              # Corp number types + local plausibility
  fields/
    useSimpleField.ts      # Local validation state machine
    useNameField.ts        # Name field (uses useSimpleField)
    usePhoneField.ts       # Phone field (uses useSimpleField)
    useCorpNoField.ts      # Corp number field (local + remote)
  io/
    corpFetcher.ts         # Remote corp number validation adapter
    postProfileDetails.ts  # Form submission adapter
  cache/
    inMemoryCorpNoCache.ts # TTL cache for corp validation results
  forms/
    useOnboardingForm.ts   # Composes fields + submit flow

hooks/
  usePhoneField.ts         # Re-export for compatibility

__tests__/                 # Unit/integration/E2E-style tests
```

## Architecture

- Domain (pure): `modules/domain/*`
  - `simple.ts` provides `isValidName`, `isValidPhoneCA`, and error helpers.
  - `corpNo.ts` provides `PlausibleCorpNo`, plausibility checks, and messages.

- Field state machines: `modules/fields/*`
  - `useSimpleField` manages local-only fields (empty → active → valid/invalid) with blur/idle triggers.
  - `useNameField` and `usePhoneField` wrap `useSimpleField` with domain validators and phone-specific conveniences (E.164).
  - `useCorpNoField` adds remote I/O + cache + cancellation on top of local plausibility.

- I/O adapters: `modules/io/*`
  - `corpFetcher` validates a corp number remotely with timeouts, abort handling, and typed results.
  - `postProfileDetails` submits the form payload robustly.

- Cache: `modules/cache/inMemoryCorpNoCache.ts` — TTL-based in-memory cache of corp results.

- Form composition: `modules/forms/useOnboardingForm.ts`
  - Composes field hooks, exposes `canSubmit`, `validateAll()`, `submit()`, and error getters.
  - Injects `corpFetcher`/`postProfileDetails` and uses a default cache unless one is provided.

- UI: presentational components only; no business logic. Errors render beside labels; inputs only show blue focus styles.

### Architecture Decisions

- See ADRs: docs/adr/README.md
- Direct link: docs/adr/0001-field-state-machines.md

### Validation UX

- While typing: no errors.
- After blur or idle timeout: errors appear for invalid inputs.
- Focus clears errors to reduce user friction.
- Corp number: local plausibility first; then remote validation with spinner/checkmark feedback.

## Usage Examples

Create the form in a page:

```ts
// app/onboarding/page.tsx
import { useOnboardingForm } from "@/modules/forms/useOnboardingForm";
import { corpFetcher } from "@/modules/io/corpFetcher";
import { postProfileDetails } from "@/modules/io/postProfileDetails";

const form = useOnboardingForm({
  corpFetcher,
  postProfileDetails,
  idleMs: 500,
  cacheTtlMs: 5 * 60 * 1000,
});
```

Render with `FormView` and route on submit success.

## Conventions

- Hooks expose structured state + small, named actions (`onChange`, `onBlur`, `validateNow`, `reset`).
- I/O adapters accept an `AbortSignal` and never throw for non-abort errors; instead, they return typed error results.
- Tests prefer behavior verification via the public surface (no internal state peeking).

## Notes

- `hooks/usePhoneField.ts` re-exports `modules/fields/usePhoneField` for compatibility.
- `AbortSignal.any` is used when available for timeouts; ensure runtime support or adapt with a small helper if needed.

## License

MIT
