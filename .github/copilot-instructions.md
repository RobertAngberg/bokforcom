# BokförCom - AI Coding Agent Instructions

## Project Overview
Swedish accounting SaaS application built with Next.js App Router, PostgreSQL, and Better Auth. All UI text, comments, and variable names are in Swedish.

## Architecture

### App Structure (Next.js App Router)
- **Feature-based routing**: Each route folder (`bokfor/`, `faktura/`, `personal/`, etc.) contains:
  - `page.tsx` - Server component that fetches initial data
  - `actions/` - Server actions ("use server") for database operations
  - `components/` - Client components
  - `hooks/` - Custom React hooks
  - `types/` - TypeScript interfaces
  - `context/` (where needed) - React Context providers

### State Management Pattern
**NO Zustand or Redux**. Uses a layered Context + Custom Hooks pattern:

1. **Page level** (`page.tsx`): Server component fetches initial data with `Promise.all()`
2. **Provider level**: Wraps children with Context Provider
3. **Hook level**: Custom hook (`useBokfor`, `useFaktura`, etc.) contains ALL business logic
4. **Context level**: Context wraps hook and exposes via `useContext`

Example from `bokfor/`:
```tsx
// page.tsx - Server component
export default async function BokforPage() {
  const [favoritFörval, allaFörval] = await Promise.all([
    hämtaFavoritförval(),
    hämtaAllaFörval()
  ]);
  return (
    <BokforProvider>
      <Bokfor initialData={{ favoritFörval, allaFörval }} />
    </BokforProvider>
  );
}

// hooks/useBokfor.ts - ALL state and logic
export function useBokfor() {
  const [favoritFörval, setFavoritFörval] = useState<Förval[]>([]);
  // ... all useState, useEffect, handlers, helpers
  return { favoritFörval, setFavoritFörval, ... };
}

// context/BokforContextProvider.tsx - Wraps hook
export function BokforProvider({ children }) {
  const bokforData = useBokfor();
  return (
    <BokforContext.Provider value={bokforData}>
      {children}
    </BokforContext.Provider>
  );
}
```

### Database Access
- **Connection**: Singleton `pool` from `_lib/db.ts` (pg Pool with global caching)
- **Auth**: All server actions MUST call `ensureSession()` first (from `_utils/session.ts`)
- **Pattern**: Direct SQL queries via `pool.query()` in server actions
- **No ORM**: Raw SQL only, no Prisma/Drizzle

### Authentication (Better Auth)
- Config in `_lib/better-auth.ts`
- Session check: `await ensureSession()` in server actions
- Client hook: `useSession()` from `_lib/auth-client`
- Email verification via Resend integration
- Returns `userId` as string (UUID format)

### File Uploads
- **Storage**: Vercel Blob Storage
- **Pattern**: Client-side compression → Server action → Blob upload
- **Helper**: `_utils/blobUpload.ts` exports `uploadReceiptImage()`, `uploadCompanyLogo()`
- **Security**: Always validates file type, size, and requires session
- **Paths**: `userId/descriptive-name-YYYYMMDD.ext` (user-scoped)

### OCR & AI Processing
- **OCR**: Tesseract.js (client-side) + PDF parsing
- **AI**: OpenAI GPT-4.1-nano for data extraction
- **Pattern**: Upload file → OCR → send text to `bokfor/actions/ocrActions.ts` → AI extracts structured data
- **Location**: `extractDataFromOCR()`, `extractDataFromOCRLevFakt()` in `ocrActions.ts`

## Critical Conventions

### Swedish Language
- **ALL** code, variables, functions, comments in Swedish
- Examples: `hämtaFöretagsprofil()`, `sparaNyKund()`, `lönespecifikation`
- UI text: "Bokför", "Ladda upp fil", "Spara", etc.

### Naming Patterns
- **Server actions**: `hämta*()` (fetch), `spara*()` (save), `taBort*()` (delete), `uppdatera*()` (update)
- **Hooks**: `use*()` - contain ALL logic for a feature
- **Components**: PascalCase, descriptive Swedish names
- **Types**: Interfaces, no type aliases for objects

### Security Requirements
1. **Every server action** starts with `await ensureSession()`
2. **File uploads** validate type and size before processing
3. **User input** sanitized via `_utils/validationUtils.ts` or `_utils/textUtils.ts`
4. **Database queries** use parameterized queries (never string concatenation)

### Component Patterns
- **Server components**: Default, fetch data at page level
- **Client components**: Marked with `"use client"`, for interactivity
- **Shared UI**: Reusable components in `_components/` (Knapp, Modal, Tabell, etc.)
- **Toast notifications**: `showToast(message, type)` from `_components/Toast.tsx`

### Type Safety
- Extensive type definitions in each feature's `types/types.ts`
- Shared types (rare) in `_types/common.ts` if needed
- Type imports: `import type { ... }` for type-only imports

## Key Workflows

### Adding a New Server Action
1. Create function in `actions/` folder with `"use server"`
2. First line: `const { userId } = await ensureSession();`
3. Use `pool.query()` with parameterized queries
4. Return typed result or throw error
5. Import in component/hook and call directly

### Adding a New Feature Route
1. Create folder: `app/new-feature/`
2. Add `page.tsx` (server component with data fetching)
3. Create `actions/`, `components/`, `hooks/`, `types/` subfolders
4. Define types in `types/types.ts`
5. Create main hook in `hooks/useFeature.ts`
6. Create context provider if needed
7. Add to navbar in `_components/Navbar.tsx`

### Working with Forms
- Use native form handling or controlled components
- Validation helpers in `_utils/validationUtils.ts`
- Submit via server action, not API route
- Show feedback with `showToast()`

## Environment Variables
Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `OPENAI_API_KEY` - For OCR data extraction
- `RESEND_API_KEY` - Email service
- `AUTH_RESEND_KEY` - Better Auth email sending
- `RESEND_FROM_EMAIL` - From address
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage

## Testing & Debugging
- No formal test suite (add tests as needed)
- Console logs common in development
- Check Network tab for server action failures
- Use `showToast("debug", "info")` for quick debugging

## Domain Context
BokförCom is a Swedish accounting system supporting:
- **Bokföring** (Bookkeeping): Transaction entry with OCR
- **Faktura** (Invoicing): Create and manage invoices
- **Personal** (Payroll): Employee management, salary specifications, AGI reporting
- **Rapporter** (Reports): Financial reports, balance sheets
- **SIE Import**: Import accounting data from Swedish SIE format
- **Bokslut** (Year-end closing): Annual accounts

### Swedish Accounting Terms
- **Förval** = Transaction template/preset
- **Verifikat** = Accounting voucher
- **Leverantörsfaktura** = Supplier invoice
- **Utlägg** = Expense claim
- **Lönespecifikation** = Salary specification
- **AGI** = Swedish employer tax reporting format
