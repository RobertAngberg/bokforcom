# Faktura Context Overview

Det här paketet består av ett par delmoduler som tillsammans skapar fakturaflödet:

- `defaults/` – äger själva context-objekten (`createContext`) och beskriver standardvärden för formulär- och artikelstate.
- `providers/` – monterar ihop reducer, actions och context, och exponerar React Providers (`FakturaProvider`, `FakturaFormProvider`, `FakturaArtikelProvider`).
- `hooks/` – samlar konsumtions-hookarna (`useFakturaContext`, `useFakturaClient`, `useFakturaFormSelector`, `useFakturaArtikelContext` m.fl.) som används i komponenterna.
- `state/` – innehåller reducer och actions som krävs av providers (`fakturaReducer.ts`, `useFakturaActions.ts`).
