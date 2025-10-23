# BokförCom Analytics & Admin System

## Snabbstart

### 1. Konfigurera admin-email

Byt ut placeholder-emailen i `/app/admin/lib/adminAuth.ts`:

```typescript
const ADMIN_EMAILS: string[] = [
  "din-email@exempel.se", // <-- Byt ut denna
  // Lägg till fler admin emails här om behövs
];
```

### 2. Testa systemet

1. Gå till `/admin` (omdirigeras till login om inte inloggad)
2. Logga in med din konfigurerade email
3. Använd "Test Tracking" knappen för att generera testdata
4. Se analytics i dashboarden

### 3. Integrera tracking i befintliga actions (valfritt)

Lägg till i dina server actions:

```typescript
import { Analytics } from "../analytics/client";

// I dina actions:
await Analytics.transactionCreated(userId, { amount: 1000, category: "income" });
await Analytics.pageView(userId, "/bokfor");
await Analytics.featureUsed(userId, "ocr_scan");
```

## Filer som skapats

### Analytics System

- `/app/analytics/actions.ts` - Server actions för tracking
- `/app/analytics/client.ts` - Client helpers
- `/app/analytics/types.ts` - TypeScript definitioner

### Admin Panel

- `/app/admin/page.tsx` - Admin route med säkerhet
- `/app/admin/lib/adminAuth.ts` - Centraliserad admin auth
- `/app/admin/components/` - Alla admin komponenter
- `/app/admin/users/page.tsx` - Användarhantering
- `/app/admin/actions/impersonation.ts` - User impersonation

### Database Schema

SQL för user_events tabell är redan körd (se tidigare meddelanden).

## Funktioner

✅ **Event Tracking** - Tracka alla user actions
✅ **Admin Dashboard** - Översikt med analytics
✅ **User Management** - Se och hantera användare  
✅ **User Impersonation** - Logga in som andra användare
✅ **Test Interface** - Generera testdata enkelt
✅ **Email-based Admin** - Säker admin-access via email

## Säkerhet

- Email-baserad admin access
- Session validering på alla admin routes
- Centraliserad admin checks via `requireAdmin()`
- Skyddade server actions

Admin systemet är **redo att användas** - du behöver bara konfigurera din email!
