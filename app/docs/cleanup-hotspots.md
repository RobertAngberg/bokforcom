# Cleanup Hotspots

This note captures areas worth revisiting when tightening up spaghetti-prone code. Update as issues are validated or resolved.

## High-priority targets

- **`sie/actions.ts` (≈2000 lines)** – Contains file parsing, encoding heuristics, database writes, and logging in a single module. Split into dedicated services (encoding, parsing, persistence) and add tests around the parser before further changes.
- **`sie/page.tsx`** – Mirrors backend encoding logic and includes numerous `console.log` statements. Consider extracting shared helpers and gating logs behind a debug flag to keep the client bundle lean.
- **OCR extraction actions** (`bokfor/actions/ocrActions.ts`) – Three nearly identical OpenAI calls. Create one helper that accepts a schema/role prompt and normalizes the response.

## Medium-priority targets

- **TODO noise in Faktura UI** – Components under `faktura/components/NyFaktura/ProdukterTjanster/` still reference unimplemented handlers (`reset`, `close`, `edit`, `details`). Either implement or remove stubs to avoid dead UI paths.
- **Löner view wiring** (`personal/components/Anstallda/Lonespecar/SpecVy/LonespecList.tsx`) – TODO notes indicate duplicate hook usage; refactor to receive all data via props and keep hooks in parents.
- **Resultatrapport hook** (`rapporter/hooks/useResultatrapport.ts`) – Hard-coded function call lacks year parameter handling; refactor to accept `selectedYear` to match UI state.

## Type-safety follow-ups

- Replace `any` usage in `bokfor/components/Steg/Steg2Levfakt.tsx` (`useState<any>`) and dictionary types in `bokfor/types/types.ts` with specific interfaces.
- Review API routes like `api/email/send/route.ts` that cast payloads to `any`; formalize with `zod` schemas already present in `_utils/validationUtils.ts`.

---

_Update created by GitHub Copilot to track ongoing cleanup ideas._
