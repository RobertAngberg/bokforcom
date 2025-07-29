# 🔧 Lonekorning.tsx Refaktorering - TODO Lista

> ⚠️ **VIKTIGT**: Filnamn kan INTE innehålla åäö på grund av tekniska begränsningar. Använd svenska namn men ersätt: `å` → `a`, `ä` → `a`, `ö` → `o`

## 🌟 FÖRE vs EFTER

### ❌ FÖRE (Nu)

```
personal/Lonekorning/
├── Lonekorning.tsx (1229 rader - ALLT i en fil)
├── AnstalldaLista.tsx
├── BankgiroExport.tsx
└── BokforKnappOc1. **Börja med STEG 1.2** - AGIDebugModal (nästa stora komponent)
2. **Testa grundligt** efter varje komponent
3. **Commit ofta** - en komponent per commit
4. **Kör dev server** - se att allt fungerar

---

## 🎉 Framsteg

### ✅ Steg 1.1 - SkatteBokforingModal (KLART!)
- **Datum**: 30 juli 2025
- **Resultat**: 202 rader flyttade från huvudkomponenten
- **Status**: Fungerar identiskt som tidigare
- **Nästa**: AGIDebugModal (Steg 1.2)

**Nästa steg: Extrahera AGIDebugModal! 🚀**

---

## 📝 Minnesanteckningar

- ⚠️ **Filnamn**: Inga åäö tillåtna - använd `å`→`a`, `ä`→`a`, `ö`→`o`
- 🎯 **Komponent-fokuserad approach**: Allt i komponenter, inga hooks/utils ännu
- 📦 **En komponent per commit**: Gör små, testbara ändringar
- 🔧 **Testa alltid**: Kör dev server efter varje ändring
### ✅ EFTER (Mål)

```

📁 personal/Lonekorning/
├── Lonekorning.tsx (huvudkomponent, ~150 rader)
├── AGIDebugModal.tsx (~280 rader)
├── AGIGenerator.tsx (~320 rader)
├── ActionButtonRow.tsx (~50 rader)
├── LonespecLista.tsx (~150 rader)
├── NySpecKnapp.tsx (~30 rader)
├── NySpecModal.tsx (~140 rader)
├── SkatteBokforingModal.tsx (~250 rader)
├── UtbetalningsdatumValjare.tsx (~80 rader)
├── AnstalldaLista.tsx (behålls)
├── BankgiroExport.tsx (behålls)
└── BokforKnappOchModal.tsx (behålls)

```

---

## 📊 Nuvarande Status

- **Filstorlek**: 1027 rader (var 1229 - minskade med 202 rader! 🎉)
- **Framsteg**: ✅ Steg 1.1 klart (SkatteBokforingModal extraherad)
- **Problem**: Resterande kod fortfarande i en enda komponent = svårt att underhålla
- **Mål**: Dela upp i logiska, återanvändbara komponenter (BARA komponenter, inga hooks/utils ännu)

---

## 🎯 Steg-för-steg Refaktorering

### ✅ STEG 1: Extrahera Stora UI Komponenter

**Prioritet: HÖG** - Största delarna först

#### ✅ 1.1 SkatteBokforingModal (som komponent) - KLART!

```

✅ FÄRDIG: personal/Lonekorning/SkatteBokforingModal.tsx (196 rader)
📝 Innehåll: Komplett skattemodal med exakt samma funktionalitet
🔗 Props: skatteModalOpen, setSkatteModalOpen, skatteData, skatteDatum, setSkatteDatum, utbetalningsdatum, hanteraBokförSkatter, skatteBokförPågår, valdaSpecar
💡 Resultat: Lonekorning.tsx minskade från 1229 → 1027 rader (-202 rader!)
🎯 Status: Funktionalitet identisk som tidigare, bara bättre struktur

```

#### ✅ 1.2 AGIDebugModal (som komponent) - KLART!

```

📁 Fil: personal/Lonekorning/AGIDebugModal.tsx (240 rader)
📝 Innehåll: Complete AGI debug modal med XML-visning
🔗 Props: visaDebug, setVisaDebug, agiDebugData
💡 Inkluderar: XML-display, företagsdata, anställddata, lönespec, debug controls
💫 Resultat: Lonekorning.tsx reducerad från 1027 → 806 rader (-221 rader)
🎯 Status: Fullt funktionell, inga förändringar i logik

```

#### ✅ 1.3 NySpecModal (som komponent) - KLART!

```

📁 Fil: personal/Lonekorning/NySpecModal.tsx (70 rader)
📝 Innehåll: Modal för att skapa ny lönespecifikation med datum-väljare
🔗 Props: isOpen, onClose, nySpecDatum, setNySpecDatum, anstallda, onSpecCreated
💡 Inkluderar: DatePicker, valideringslogik, refresh-logik efter skapande
💫 Resultat: Lonekorning.tsx reducerad från 806 → 755 rader (-51 rader)
🎯 Status: Fullt funktionell, bättre separation av concerns

```

#### ✅ 1.4 UtbetalningsdatumValjare (som komponent) - KLART!

```

📁 Fil: personal/Lonekorning/UtbetalningsdatumValjare.tsx (35 rader)
📝 Innehåll: Väljare för utbetalningsdatum med klickbara datum-knappar
🔗 Props: datumLista, utbetalningsdatum, setUtbetalningsdatum, specarPerDatum
💡 Inkluderar: Datum-formatering, aktiv-status, antal lönespecar per datum
💫 Resultat: Lonekorning.tsx reducerad från 755 → 741 rader (-14 rader)
🎯 Status: Enkel och ren komponent, bättre läsbarhet

```
💫 Resultat: Lonekorning.tsx reducerad ytterligare ~240 rader
🎯 Status: Fullt funktionell, inga förändringar i logik

```

```

#### 1.3 NySpecModal (som komponent)

```

📁 Ny fil: personal/Lonekorning/NySpecModal.tsx
📝 Innehåll: Lines 504-556 (ny lönespec modal)
🔗 Props: nySpecModalOpen, setNySpecModalOpen, nySpecDatum, setNySpecDatum, anstallda, onSuccess callback
💡 Inkluderar: Modal UI + create logic

```

---

### ✅ STEG 2: Extrahera Andra UI Komponenter

**Prioritet: MEDIUM** - Gör UI:n mer modulär

#### 2.1 UtbetalningsdatumValjare

```

📁 Ny fil: personal/Lonekorning/UtbetalningsdatumValjare.tsx
📝 Innehåll: Lines 557-578 (datum lista)
🔗 Props: datumLista, utbetalningsdatum, setUtbetalningsdatum, specarPerDatum
💡 Inkluderar: All datum-väljare UI och logik

```

### 🎯 Steg 2: Lista-komponenter (Prio 2 - Struktur förbättring)
- ✅ **2.1 LonespecLista.tsx** (65 rader) - Lönespec-lista med action buttons - KLART!

```

📁 Fil: personal/Lonekorning/LonespecLista.tsx (65 rader)
📝 Innehåll: Lista över lönespecar med borttagning och action-knappar
🔗 Props: valdaSpecar, anstallda, utlaggMap, onTaBortSpec, callback-funktioner
💡 Inkluderar: LönespecView-rendering, Ta bort-logik, Export/bokföring-knappar
💫 Resultat: Lonekorning.tsx reducerad från 741 → 721 rader (-20 rader)
🎯 Status: Bättre separation mellan data och UI-hantering

```

- ⏳ **2.2 ActionButtons.tsx** (20 rader) - Knappar för export och bokföring

```

📁 Ny fil: personal/Lonekorning/UtbetalningsdatumVäljare.tsx
📝 Innehåll: Lines 557-578 (datum lista)
🔗 Props: datumLista, utbetalningsdatum, setUtbetalningsdatum, specarPerDatum
💡 Inkluderar: All datum-väljare UI och logik

```

#### 2.2 LönespecLista

```

📁 Ny fil: personal/Lonekorning/LönespecLista.tsx
📝 Innehåll: Lines 579-700 (lönespec rendering + borttagning)
🔗 Props: valdaSpecar, anstallda, utlaggMap, beräknadeVärden, extrarader, refresh callbacks
💡 Inkluderar: Lista UI + all borttagningslogik

```

#### 2.3 ActionButtonRow

```

📁 Ny fil: personal/Lonekorning/ActionButtonRow.tsx
📝 Innehåll: Lines 701-706 (knapp-raden)
🔗 Props: alla modal setters + hanteraAGI function
💡 Inkluderar: Bara knapp-rad UI

```

#### 2.4 AGIGenerator

```

📁 Ny fil: personal/Lonekorning/AGIGenerator.tsx
📝 Innehåll: Lines 173-489 (hela AGI logiken)
🔗 Props: valdaSpecar, anstallda, beräknadeVärden, extrarader, utbetalningsdatum, setAgiDebugData, setVisaDebug
💡 Inkluderar: All AGI-generering + XML-skapande

```

#### 2.5 NySpecKnapp

```

📁 Ny fil: personal/Lonekorning/NySpecKnapp.tsx
📝 Innehåll: Bara knappen för ny spec
🔗 Props: onClick handler
💡 Inkluderar: Enkel knapp-komponent

````

---

### ✅ STEG 3: Huvudkomponent (Ny Lonekorning.tsx)

```tsx
// Bara imports, state, och komponent-komposition
return (
  <div className="space-y-6">
    <NySpecKnapp onClick={() => setNySpecModalOpen(true)} />

    <NySpecModal
      isOpen={nySpecModalOpen}
      onClose={() => setNySpecModalOpen(false)}
      // ... alla props med data och callbacks
    />

    <UtbetalningsdatumValjare
      datumLista={datumLista}
      utbetalningsdatum={utbetalningsdatum}
      setUtbetalningsdatum={setUtbetalningsdatum}
      specarPerDatum={specarPerDatum}
    />

    <LonespecLista
      valdaSpecar={valdaSpecar}
      anstallda={anstallda}
      utlaggMap={utlaggMap}
      // ... alla props och callbacks
    />    <ActionButtonRow
      onBankgiro={() => setBankgiroModalOpen(true)}
      onMail={() => setBatchMailModalOpen(true)}
      onBokför={() => setBokforModalOpen(true)}
      onAGI={() => handleAGI()}
      onSkatter={() => setSkatteModalOpen(true)}
    />

    {/* AGI Generator som "osynlig" komponent */}
    <AGIGenerator
      valdaSpecar={valdaSpecar}
      anstallda={anstallda}
      // ... props för AGI-generering
      ref={agiGeneratorRef} // så vi kan anropa den från ActionButtonRow
    />

    {/* Modal komponenter */}
    <SkatteBokforingModal
      isOpen={skatteModalOpen}
      onClose={() => setSkatteModalOpen(false)}
      valdaSpecar={valdaSpecar}
      beräknadeVärden={beräknadeVärden}
      utbetalningsdatum={utbetalningsdatum}
    />    <AGIDebugModal
      isOpen={visaDebug}
      onClose={() => setVisaDebug(false)}
      debugData={agiDebugData}
    />

    {/* Existing modals behålls som de är */}
    {bankgiroModalOpen && <BankgiroExport ... />}
    {batchMailModalOpen && <MailaLonespec ... />}
    {bokforModalOpen && <BokforLoner ... />}
  </div>
);
````

---

## 🚀 Implementeringsordning (Komponent-fokuserad)

### Sprint 1: Stora Komponenter (3-4h)

1. **SkatteBokforingModal** - störst, mest isolerad, inkluderar all skatte-logik
2. **AGIGenerator** - komplex men väldefinierad, all AGI-logik
3. **AGIDebugModal** - använder AGIGenerator data

### Sprint 2: Lista & Navigation (2-3h)

1. **LonespecLista** - stor komponent med borttagningslogik
2. **UtbetalningsdatumValjare** - datum-navigation
3. **NySpecModal** - modal med create-logik

### Sprint 3: Små Komponenter (1h)

1. **ActionButtonRow** - enkel knapp-rad
2. **NySpecKnapp** - enkel knapp
3. **Cleanup** av huvudkomponenten

---

## 🎁 Fördelar Efter Refaktorering (Komponent-stil)

### För Utvecklare

- ✅ **Läsbarhet**: Varje fil <350 rader, tydligt syfte
- ✅ **Testbarhet**: Kan testa komponenter isolerat med props
- ✅ **Återanvändning**: Modal-komponenter kan användas på andra ställen
- ✅ **Underhåll**: Bugfixar i avgränsade delar

### För Performance

- ✅ **Lazy Loading**: Komponenter kan lazy-loadas
- ✅ **React.memo**: Enklare att memoize mindre komponenter
- ✅ **Conditional Rendering**: Bara rendera vad som behövs

### För Teamwork

- ✅ **Parallell utveckling**: Flera kan jobba på olika komponenter
- ✅ **Code Review**: Mindre changesets per komponent
- ✅ **Onboarding**: Nya utvecklare förstår komponent-struktur

---

## 📊 Detaljerad Kodstruktur Efter Refaktorering

### 🎯 Lonekorning.tsx (Huvudkomponent - ~150 rader)

```tsx
//#region Imports
import { useState } from "react";
import { useLonespecContext } from "../Lonespecar/LonespecContext";

// Components
import NySpecKnapp from "./NySpecKnapp";
import UtbetalningsdatumValjare from "./UtbetalningsdatumValjare";
import LonespecLista from "./LonespecLista";
import ActionButtonRow from "./ActionButtonRow";
import AGIGenerator from "./AGIGenerator";

// Modals
import NySpecModal from "./NySpecModal";
import AGIDebugModal from "./AGIDebugModal";
import SkatteBokforingModal from "./SkatteBokforingModal";

// Existing modals (behålls som de är)
import BankgiroExport from "./BankgiroExport";
import MailaLonespec from "../Lonespecar/MailaLonespec";
import BokforLoner from "../Lonespecar/BokforLoner";
//#endregion

export default function Lonekorning() {
  // State management (alla useState calls)
  // Data fetching (useEffect + fetch calls)
  // Event handlers (bara koordinering mellan komponenter)
  // Return statement med komponent-komposition
}
```

### 💰 SkatteBokforingModal.tsx (~250 rader)

```tsx
// Innehåller:
// - All skatteberäknings-logik
// - DatePicker för datum
// - Modal UI med sammanfattning
// - Bokföring-funktionalitet
// - Props: isOpen, onClose, valdaSpecar, beräknadeVärden, utbetalningsdatum
```

### 🤖 AGIGenerator.tsx (~320 rader)

```tsx
// Innehåller:
// - All AGI XML-generering
// - Organisationsnummer-validering
// - AGI-export logik
// - Debug data-skapande
// - Props: valdaSpecar, anstallda, beräknadeVärden, onDebugData
```

### 📋 LonespecLista.tsx (~150 rader)

```tsx
// Innehåller:
// - Lönespec rendering
// - Borttagnings-funktionalitet
// - Sammanfattnings-data
// - Props: valdaSpecar, anstallda, utlaggMap, beräknadeVärden, onDelete
```

### 📅 UtbetalningsdatumValjare.tsx (~80 rader)

```tsx
// Innehåller:
// - Datum-lista rendering
// - Datum-selection logik
// - Props: datumLista, utbetalningsdatum, setUtbetalningsdatum, specarPerDatum
```

### 🎯 ActionButtonRow.tsx (~50 rader)

```tsx
// Innehåller:
// - Knapp-layout
// - onClick handlers (bara delegation till parent)
// - Props: onBankgiro, onMail, onBokför, onAGI, onSkatter
```

### ➕ NySpecModal.tsx (~140 rader)

```tsx
// Innehåller:
// - Ny spec creation UI
// - Datum-väljare
// - Anställd-selection
// - Create-logik
// - Props: isOpen, onClose, anstallda, onSuccess
```

### 🔍 AGIDebugModal.tsx (~280 rader)

```tsx
// Innehåller:
// - Debug data display
// - Modal UI för AGI debug
// - Props: isOpen, onClose, debugData
```

### 🔘 NySpecKnapp.tsx (~30 rader)

```tsx
// Innehåller:
// - Enkel knapp för ny spec
// - Props: onClick
```

---

## 📋 Nästa Steg

1. **Börja med STEG 1.1** - SkatteBokföringModal (inkl. all skatte-logik)
2. **Testa grundligt** efter varje komponent
3. **Commit ofta** - en komponent per commit
4. **Kör dev server** - se att allt fungerar

**Redo att börja? Låt oss börja med SkatteBokforingModal som en komplett komponent! 🚀**

---

## 📝 Minnesanteckningar

- ⚠️ **Filnamn**: Inga åäö tillåtna - använd engelska namn
- 🎯 **Komponent-fokuserad approach**: Allt i komponenter, inga hooks/utils ännu
- 📦 **En komponent per commit**: Gör små, testbara ändringar
- 🔧 **Testa alltid**: Kör dev server efter varje ändring
