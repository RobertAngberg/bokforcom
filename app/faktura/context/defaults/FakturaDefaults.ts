// Rymmer de tomma context-behållarna som FakturaProvider fyller med data senare.
// Delas upp så hooks-filen kan fokusera på att exponera enklare API:n.

"use client";

import { createContext } from "react";
import type { FakturaContextType, ServerData } from "../../types/types";

export const FakturaContext = createContext<FakturaContextType | undefined>(undefined);
export const FakturaInitialDataContext = createContext<ServerData | null>(null);
