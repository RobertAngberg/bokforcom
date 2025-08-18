# SÄKRA FAKTURA FUNKTIONER - UTVECKLARGUIDE

## Hur man använder de nya säkra funktionerna

### VIKTIGT! ANVÄND DE SÄKRA EXPORTERNA

Alla kritiska funktioner har nu säkra versioner med rate limiting och förstärkt validering.

#### ❌ ANVÄND INTE DESSA (osäkra):

```typescript
import { deleteFaktura, deleteKund, bokförFaktura } from "./actions";
```

#### ✅ ANVÄND DESSA ISTÄLLET (säkra):

```typescript
import {
  saveInvoice, // Istället för saveInvoiceInternal
  deleteInvoiceSecure, // Istället för deleteFaktura
  deleteCustomerSecure, // Istället för deleteKund
  bookInvoiceSecure, // Istället för bokförFaktura
} from "./actions";
```

### ANVÄNDNINGSEXEMPEL

#### 1. Säker faktursparning

```typescript
// Automatiskt rate-limiterad och säkerhetsvaliderad
const result = await saveInvoice(formData);
if (result.success) {
  console.log("Faktura sparad säkert");
} else {
  console.error("Säkerhetsfel:", result.error);
}
```

#### 2. Säker fakturaradering

```typescript
// Validerar ägarskap och rate-limiterar
const result = await deleteInvoiceSecure(fakturaId);
if (result.success) {
  console.log("Faktura raderad säkert");
} else {
  console.error("Säkerhetsfel:", result.error);
}
```

#### 3. Säker kundradering

```typescript
// Omfattande säkerhetsvalidering
const result = await deleteCustomerSecure(kundId);
if (result.success) {
  console.log("Kund raderad säkert");
} else {
  console.error("Säkerhetsfel:", result.error);
}
```

#### 4. Säker bokföring

```typescript
// Kritisk funktion med maximal säkerhet
const bokförData = {
  fakturaId: 123,
  fakturanummer: "F-2024-001",
  kundnamn: "Test AB",
  totaltBelopp: 1250,
  poster: [
    { konto: "1510", debet: 1250, kredit: 0 },
    { konto: "3001", debet: 0, kredit: 1000 },
    { konto: "2611", debet: 0, kredit: 250 },
  ],
};

const result = await bookInvoiceSecure(bokförData);
if (result.success) {
  console.log("Bokföring genomförd säkert");
} else {
  console.error("Säkerhetsfel:", result.error);
}
```

### RATE LIMITING GRÄNSER

Alla säkra funktioner har automatisk rate limiting:

- **Form-baserade operationer**: 20 förfrågningar per 15 minuter per IP
- **Email-operationer**: 10 förfrågningar per timme per IP
- **Sök-operationer**: 30 förfrågningar per minut per IP

### SÄKERHETSFEL HANTERING

Alla säkra funktioner returnerar enhetliga felmeddelanden:

```typescript
interface SecurityResult {
  success: boolean;
  error?: string;
  data?: any;
}
```

#### Vanliga säkerhetsfel:

- `"Säkerhetsvalidering misslyckades"` - Ogiltig session
- `"Rate limit exceeded"` - För många förfrågningar
- `"Finns inte eller tillhör inte dig"` - Ägarskapsvalidering misslyckades
- `"Ogiltigt ID"` - ID-validering misslyckades

### SESSIONSÄKERHET

Alla säkra funktioner använder förstärkt sessionsvalidering:

```typescript
// Automatiskt i alla säkra funktioner
const sessionResult = await validateSecureSession(auth);
if (!sessionResult.isValid) {
  // Säkerhetsfel loggas automatiskt
  return { success: false, error: "Säkerhetsvalidering misslyckades" };
}
```

### XSS-SKYDD

All textinput saniteras automatiskt:

```typescript
// Automatiskt i alla säkra funktioner
const säkertText = sanitizeFakturaInput(userInput);
// Farliga tecken (<, >, &, ", ') neutraliseras
```

### SÄKERHETSLOGGNING

Alla säkra operationer loggar säkerhetshändelser:

```typescript
// Framgångsrika operationer
console.log(`🔒 Säker operation för user ${userId}`);
console.log(`✅ Operation slutförd säkert`);

// Säkerhetsvarningar
console.error(`❌ Säkerhetsvarning: Ogiltig operation`);
```

### MONITORING & DEBUGGING

För att övervaka säkerhetsoperationer:

1. **Kontrollera browser console** för säkerhetsloggar
2. **Server logs** visar detaljerade säkerhetshändelser
3. **Rate limiting** loggar överträdelser automatiskt

### UTVECKLINGSRIKTLINJER

#### GÖR:

✅ Använd alltid de säkra exporterna  
✅ Kontrollera `result.success` innan du fortsätter  
✅ Hantera säkerhetsfel gracefully  
✅ Logga säkerhetsrelaterade händelser

#### GÖR INTE:

❌ Använd de osäkra grundfunktionerna direkt  
❌ Ignorera säkerhetsfel  
❌ Kringgå rate limiting  
❌ Skippa error handling

### TESTNING AV SÄKRA FUNKTIONER

```typescript
// Test rate limiting
for (let i = 0; i < 25; i++) {
  const result = await saveInvoice(testData);
  if (!result.success && result.error.includes("Rate limit")) {
    console.log("Rate limiting fungerar korrekt");
    break;
  }
}

// Test ägarskapsvalidering
const result = await deleteInvoiceSecure(andraUsersInvoiceId);
console.assert(!result.success, "Ägarskapsvalidering ska förhindra radering");
```

### MIGRATION FRÅN GAMLA FUNKTIONER

Om du hittar gamla anrop, uppdatera enligt denna tabell:

| Gammal funktion         | Ny säker funktion        |
| ----------------------- | ------------------------ |
| `deleteFaktura()`       | `deleteInvoiceSecure()`  |
| `deleteKund()`          | `deleteCustomerSecure()` |
| `bokförFaktura()`       | `bookInvoiceSecure()`    |
| `saveInvoiceInternal()` | `saveInvoice()`          |

Alla nya funktioner har samma signatur men förstärkt säkerhet.
