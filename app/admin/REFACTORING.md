# Bokför.com - Arkitektur & Patterns

## 🏗️ Projektöversikt

Detta är en mellanstor bokföringsapplikation byggd med Next.js, TypeScript och React. Appen följer moderna React-patterns med custom hooks, grupperade props och clean architecture.

## 📁 Mappstruktur

### Nuvarande struktur:

```
app/
├── admin/                   # Admin-modul (refaktorerad, modern struktur)
│   ├── _components/         # React komponenter
│   ├── _hooks/              # Custom hooks
│   ├── _types/              # TypeScript definitioner
│   └── _actions/            # Server actions
├── _components/             # Globala komponenter
├── _utils/                  # Globala utilities
├── bokfor/                  # Bokföringsmodul
├── faktura/                 # Faktureringsmodul
├── personal/                # Personal/HR-modul
├── bokslut/                 # Bokslut
├── rapporter/               # Rapporter
├── sie/                     # SIE import/export
├── historik/                # Historik
├── feedback/                # Feedback
├── start/                   # Startsida
├── login/                   # Inloggning
└── api/                     # Backend API routes
```

### Rekommenderad framtida struktur:

```
app/
├── bokforing/               # Bokföringsmodul
│   ├── komponenter/
│   ├── hooks/
│   ├── actions/            # actions
│   ├── typer/
│   └── verktyg/            # utils
├── fakturering/             # Faktureringsmodul (byt från 'faktura')
│   ├── komponenter/
│   │   ├── NyFaktura/
│   │   ├── Leverantorer/
│   │   └── Forhandsgranskning/
│   ├── hooks/
│   ├── actions/
│   ├── typer/
│   └── verktyg/
├── personal/                # Personal/HR
│   ├── komponenter/
│   │   ├── Anstallda/
│   │   ├── Lonekorning/
│   │   └── Semester/
│   ├── hooks/
│   ├── actions/
│   ├── typer/
│   └── verktyg/
├── admin/                   # Admin (redan modern struktur)
│   ├── komponenter/         # _components
│   ├── hooks/               # _hooks
│   ├── typer/               # _types
│   └── actions/             # _actions
├── inloggning/              # Inloggning (byt från 'login')
├── delat/                   # Globalt delad kod
│   ├── komponenter/         # _components
│   │   ├── ui/             # Knapp, TextFalt, Modal
│   │   ├── layout/         # MainLayout, Navbar
│   │   ├── formular/       # Form-komponenter
│   │   └── data/           # Tabell, TabellRad
│   ├── hooks/              # Globala hooks
│   ├── verktyg/            # _utils
│   ├── typer/              # Globala types
│   └── api/                # API utilities
└── api/                     # Backend routes
```

## 🎯 Arkitektur-patterns

### 1. Component ↔ Hook Mapping Pattern

Varje komponent har en motsvarande hook med samma namn:

```typescript
// Komponenter:
UserProfileSection.tsx    ↔ useUserProfile.ts
CompanyProfileSection.tsx ↔ useCompanyProfile.ts
DeleteSection.tsx         ↔ useDeleteSection.ts

// Pattern:
[ComponentName].tsx ↔ use[ComponentName].ts
```

### 2. Grupperade Props Pattern

**FÖRE (dåligt):**

```typescript
export default function UserProfileSection({
  userInfo,
  editForm,
  isEditing,
  isSaving,
  message,
  session,
  handleEdit,
  handleCancel,
  handleSave,
  updateEditForm,
}: UserProfileSectionProps) {
```

**EFTER (bra):**

```typescript
export default function UserProfileSection({
  userInfo,
  editForm,
  state: { isEditing, isSaving, message },
  session,
  handlers: { handleEdit, handleCancel, handleSave, updateEditForm },
}: UserProfileSectionProps) {
```

**Type Definition:**

```typescript
export interface UserProfileSectionProps {
  userInfo: UserInfo | null;
  editForm: UserEditForm;
  session: any;
  state: {
    isEditing: boolean;
    isSaving: boolean;
    message: MessageState | null;
  };
  handlers: {
    handleEdit: () => void;
    handleCancel: () => void;
    handleSave: () => void;
    updateEditForm: (field: keyof UserEditForm, value: string) => void;
  };
}
```

### 3. Hook Return Pattern

Hooks returnerar grupperad data med helper-funktion:

```typescript
export const useCompanyProfile = () => {
  // ... hook logic

  return {
    // Data
    foretagsProfil,

    // State grupperat
    state: {
      isEditingCompany,
      isSavingCompany,
      companyMessage,
    },

    // Handlers grupperat
    handlers: {
      handleEditCompany,
      handleCancelCompany,
      handleSaveCompany,
      handleCompanyInputChange,
    },

    // Helper för komponentprops
    getComponentProps: () => ({
      foretagsProfil,
      state: {
        isEditingCompany,
        isSavingCompany,
        companyMessage,
      },
      handlers: {
        handleEditCompany,
        handleCancelCompany,
        handleSaveCompany,
        handleCompanyInputChange,
      },
    }),

    // Intern state (för parent page)
    fetchCompanyProfile,
    setCompanyMessage,
  };
};
```

### 4. Koordinator Hook Pattern

`useAdminPageState` koordinerar alla individuella hooks:

```typescript
export const useAdminPageState = () => {
  const auth = useAuth();
  const userProfile = useUserProfile();
  const companyProfile = useCompanyProfile();
  const deleteConfirmation = useDeleteSection();

  useEffect(() => {
    if (auth.session?.user?.id) {
      userProfile.fetchUserInfo();
      companyProfile.fetchCompanyProfile();
    }
  }, [auth.session]);

  return {
    auth,
    userProfile,
    companyProfile,
    deleteConfirmation,
    isLoading: auth.isLoading || userProfile.loading,
  };
};
```

### 5. Usage Pattern i Parent Component

```typescript
export default function AdminPage() {
  const { auth, userProfile, companyProfile, deleteConfirmation } = useAdminPageState();

  return (
    <MainLayout>
      <UserProfileSection {...userProfile} />
      <CompanyProfileSection {...companyProfile.getComponentProps()} />
      <DeleteSection {...deleteConfirmation.getComponentProps()} />
    </MainLayout>
  );
}
```

## 🧩 Komponent-patterns

### 1. TextFalt Pattern

Använd den återanvändbara `TextFalt` komponenten istället för raw inputs:

```typescript
// FÖRE (dåligt):
<input
  type="text"
  value={value}
  onChange={handleChange}
  className="w-full px-3 py-2 bg-gray-700 border border-gray-600..."
  placeholder="Placeholder"
/>

// EFTER (bra):
<TextFalt
  label="Företagsnamn"
  name="foretagsnamn"
  type="text"
  value={foretagsProfil.foretagsnamn}
  onChange={(e) => handleCompanyInputChange("foretagsnamn", e.target.value)}
  placeholder="Företagsnamn AB"
  maxLength={100}
  pattern="[regex]"  // För validering
  className="mb-0 [&>label]:text-gray-400 [&>input]:bg-gray-700..."
/>
```

**Fördelar med TextFalt:**

- XSS-skydd automatiskt
- Längdbegränsning med `maxLength`
- Pattern-validering med regex
- Konsistent styling
- Accessibility med proper labels
- Rätt input-typer (email, tel, url)

### 2. Säkerhets-pattern

**XSS-skydd:**

```typescript
// TextFalt gör automatiskt:
newValue = newValue.replace(/[<>]/g, ""); // Ta bort farliga tecken
```

**Längdbegränsning:**

```typescript
if (maxLength && newValue.length > maxLength) {
  newValue = newValue.substring(0, maxLength);
}
```

**Pattern-validering:**

```typescript
// Organisationsnummer:
pattern = "[0-9]{6}-[0-9]{4}";

// Postnummer:
pattern = "[0-9]{3} [0-9]{2}";

// Momsregistreringsnummer:
pattern = "SE[0-9]{12}";
```

## 📝 Komment-standarder

### FÖRE (dåligt):

```typescript
// 🔥 Hamta anvandare information
// Enterprise-grade user fetching with security
export async function hamtaAnvandarInfo(): Promise<UserInfo | null> {
```

### EFTER (bra):

```typescript
// ============================================================================
// Användarinformation
// ============================================================================

export async function hamtaAnvandarInfo(): Promise<UserInfo | null> {
```

**Regler:**

- Inga emojis i kommentarer
- Inga "Enterprise-grade" fluffiga beskrivningar
- Använd `// ============================================================================` för headers
- Korta, tydliga svenska kommentarer
- Proper svenska tecken (åäö)

## 🎨 CSS & Styling Patterns

### Tailwind med komponenter:

```typescript
// Admin-tema med grouped classes för TextFalt:
className =
  "mb-0 [&>label]:text-gray-400 [&>input]:bg-gray-700 [&>input]:border-gray-600 [&>input]:text-white [&>input]:focus:border-blue-500 [&>input]:focus:ring-1 [&>input]:focus:ring-blue-500";
```

### Consistent color scheme:

- Background: `bg-gray-800`
- Text: `text-white`, `text-gray-400` för labels
- Borders: `border-gray-600`
- Focus: `focus:border-blue-500`, `focus:ring-blue-500`
- Success: `bg-green-600/20 text-green-400`
- Error: `bg-red-600/20 text-red-400`

## 🔧 TypeScript Patterns

### 1. Centraliserade Types

Alla types för en modul i en fil:

```typescript
// admin/_types/types.ts
export interface UserInfo { ... }
export interface ForetagsProfil { ... }
export interface MessageState { ... }
export interface UserProfileSectionProps { ... }
```

### 2. Generic ActionResult

```typescript
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  user?: UserInfo;
}
```

### 3. Keyof Pattern för Type Safety

```typescript
updateEditForm: (field: keyof UserEditForm, value: string) => void;
handleCompanyInputChange: (field: keyof ForetagsProfil, value: string) => void;
```

## 📦 Import/Export Patterns

### Direct Imports (inget barrel export):

```typescript
// BRA:
import { useUserProfile } from "../_hooks/useUserProfile";
import { hamtaAnvandarInfo } from "../_actions/anvandarActions";

// UNDVIK:
import { useUserProfile, hamtaAnvandarInfo } from "../index";
```

**Varför:** Bättre tree-shaking, tydligare dependencies, mindre komplexitet.

## 🚀 Refactoring Guidelines

### När du refaktorerar komponenter:

1. **Kolla om komponenten kan använda TextFalt**

   - Ersätt raw inputs med TextFalt
   - Lägg till säkerhet (maxLength, pattern)
   - Använd rätt input-typer

2. **Gruppera props om komponenten har >5 parametrar**

   - Gruppera state i `state: { }`
   - Gruppera handlers i `handlers: { }`
   - Behåll grunddata på toppnivå

3. **Skapa matchande hook om det inte finns**

   - `ComponentName.tsx` → `useComponentName.ts`
   - Flytta logik från komponenten till hooken
   - Returnera grupperad struktur

4. **Rensa kommentarer**

   - Ta bort emojis och "enterprise-grade" fluff
   - Använd `// ============================================================================` headers
   - Korta svenska kommentarer med åäö

5. **Kontrollera TypeScript**
   - Centralisera types i modulens `_types/` mapp
   - Använd `keyof` för type safety
   - Generiska interfaces där det är lämpligt

## 🎯 Migration Plan

### Steg 1: Skapa delat-struktur

```bash
mkdir app/delat
mv app/_components app/delat/komponenter
mv app/_utils app/delat/verktyg
```

### Steg 2: Organisera delat/komponenter

```bash
mkdir app/delat/komponenter/{ui,layout,formular,data}
# Flytta komponenter till rätt undergrupper
```

### Steg 3: Gradvis uppdatera moduler

En modul i taget, börja med de minsta:

- Använd svenska mappnamn
- Implementera hook/komponent-mapping
- Gruppera props
- Använd TextFalt där lämpligt

### Steg 4: Uppdatera imports

När mappar flyttas, uppdatera alla imports systematiskt.

---

**Datum:** 8 september 2025  
**Status:** Admin-modulen är refaktorerad enligt dessa patterns  
**Nästa:** Implementera samma patterns i andra moduler gradvis
