# Refactor-förslag för att minska code smell

## 1. Typsäkerhet & Interface

```typescript
interface ExtraradData {
  lönespecifikation_id: number;
  typ: string;
  beskrivning: string; // Istället för kolumn1
  antal: string; // Istället för kolumn2
  beloppPerEnhet: string; // Istället för kolumn3
  kommentar?: string; // Istället för kolumn4
}

interface UtläggData {
  id: number;
  beskrivning: string;
  belopp: number;
  kommentar?: string;
  status: "Väntande" | "Inkluderat i lönespec";
}
```

## 2. Dedicated Utlägg-funktion

```typescript
export async function läggTillUtläggSomExtrarad(
  lönespecId: number,
  utlägg: UtläggData
): Promise<{ success: boolean; error?: string }> {
  const extraradData: ExtraradData = {
    lönespecifikation_id: lönespecId,
    typ: "utlägg", // Egen typ för utlägg
    beskrivning: utlägg.beskrivning,
    antal: "1",
    beloppPerEnhet: utlägg.belopp.toString(),
    kommentar: utlägg.kommentar || "",
  };

  return sparaExtrarad(extraradData);
}
```

## 3. Bättre konfiguration för utlägg

```typescript
// I extraradDefinitioner.ts
utlägg: {
  label: "Utlägg",
  enhet: "st",
  skattepliktig: false,
  beräknaTotalt: (grundlön, modalFields) => {
    // Direkt belopp, ingen komplex beräkning
    return parseFloat(modalFields.beloppPerEnhet) * parseFloat(modalFields.antal);
  },
  fält: {
    antalLabel: "Antal",
    antalPlaceholder: "1",
    beloppPlaceholder: "Belopp",
    beräknaTotalsummaAutomatiskt: true,
  },
},
```

## 4. Konsistent namngivning

```typescript
// Överallt: använd samma namn
lönespecifikationId; // CamelCase för JS/TS
lönespecifikation_id; // Snake_case för databas

// Eller skapa mapper:
const dbMapper = {
  lönespecId: "lönespecifikation_id",
  // ... andra mappningar
};
```

## 5. Förenklad Utlagg.tsx

```typescript
const handleLäggTillUtlägg = async () => {
  const väntandeUtlägg = lönespecUtlägg.filter((u) => u.status === "Väntande");

  if (väntandeUtlägg.length === 0) {
    alert("Inga väntande utlägg att lägga till");
    return;
  }

  try {
    for (const utlägg of väntandeUtlägg) {
      // Enkel, tydlig funktion
      await läggTillUtläggSomExtrarad(lönespecId, utlägg);
      await uppdateraUtläggStatus(utlägg.id, "Inkluderat i lönespec");
    }
    alert(`${väntandeUtlägg.length} utlägg tillagda!`);
    window.location.reload();
  } catch (error) {
    console.error("Fel:", error);
    alert("Något gick fel!");
  }
};
```

## Prioritering:

1. **TypeScript interfaces** (mest akut)
2. **Konsistent namngivning** (förhindrar framtida buggar)
3. **Dedicated utlägg-funktioner** (gör koden tydligare)
4. **Refactor kolumn1-4** (långsiktig förbättring)
