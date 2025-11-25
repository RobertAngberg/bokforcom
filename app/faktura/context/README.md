# Faktura Context Overview

Det här paketet består av ett par delmoduler som tillsammans skapar fakturaflödet:

- `defaults/` – äger själva context-objekten (`createContext`) och beskriver standardvärden för formulär- och artikelstate.

- `providers/` – monterar ihop reducer, actions och context, och exponerar React Providers

- `hooks/` – samlar konsumtions-hookarna som används i komponenterna.

- `state/` – innehåller reducer och actions som krävs av providers
