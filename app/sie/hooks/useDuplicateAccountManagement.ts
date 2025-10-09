/**
 * Hook för hantering av dubbletter i kontoplanen
 *
 * Hanterar:
 * - Kontrollera om dubbletter finns (on mount)
 * - Rensa dubbletter
 * - Loading state och resultat
 */

"use client";

import { useState, useEffect } from "react";
import { kontrolleraDubbletter, rensaDubblettkonton } from "../actions/actions";
import type { DublettResultatSimple } from "../types/types";

const isDev = process.env.NODE_ENV !== "production";
const debugSie = (...args: Parameters<typeof console.debug>) => {
  if (isDev) {
    console.debug(...args);
  }
};

export function useDuplicateAccountManagement() {
  const [rensarDubbletter, setRensarDubbletter] = useState(false);
  const [dublettResultat, setDublettResultat] = useState<DublettResultatSimple | null>(null);
  const [harDubbletter, setHarDubbletter] = useState(false);

  // Kontrollera dubbletter när komponenten laddas
  useEffect(() => {
    const kontrolleraDublettStatus = async () => {
      try {
        const resultat = await kontrolleraDubbletter();
        if (resultat.success) {
          setHarDubbletter(resultat.harDubbletter);
        }
      } catch (error) {
        console.error("❌ Kunde inte kontrollera dubbletter:", error);
      }
    };

    kontrolleraDublettStatus();
  }, []);

  // Funktion för att rensa dubbletter
  const handleRensaDubbletter = async () => {
    setRensarDubbletter(true);
    setDublettResultat(null);

    try {
      const resultat = await rensaDubblettkonton();
      setDublettResultat(resultat);

      if (resultat.success) {
        debugSie(`✅ Rensade ${resultat.rensade} dubbletter`);

        // Kontrollera igen om det finns fler dubbletter
        const kontrollResultat = await kontrolleraDubbletter();
        if (kontrollResultat.success) {
          setHarDubbletter(kontrollResultat.harDubbletter);
        }
      } else {
        console.error("❌ Kunde inte rensa dubbletter:", resultat.error);
      }
    } catch (error) {
      console.error("❌ Fel vid rensning av dubbletter:", error);
      setDublettResultat({
        success: false,
        error: "Okänt fel vid rensning",
      });
    } finally {
      setRensarDubbletter(false);
    }
  };

  // Återkontrollera dubbletter (kan användas efter t.ex. import)
  const recheckDuplicates = async () => {
    try {
      const resultat = await kontrolleraDubbletter();
      if (resultat.success) {
        setHarDubbletter(resultat.harDubbletter);
      }
    } catch (error) {
      console.error("❌ Kunde inte återkontrollera dubbletter:", error);
    }
  };

  return {
    rensarDubbletter,
    dublettResultat,
    harDubbletter,
    handleRensaDubbletter,
    recheckDuplicates,
  };
}
