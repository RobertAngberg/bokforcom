"use client";

import { useState } from "react";
import { fetchAllaForval, loggaFavoritförval } from "../_actions/actions";
import { KontoRad, Förval } from "../_types/types";
import { useBokforStore } from "../_stores/bokforStore";
import { normalize } from "../../_utils/textUtils";

export function useSokForval() {
  // Hämta allt från Zustand store
  const {
    favoritFörvalen,
    levfaktMode,
    utlaggMode,
    setCurrentStep,
    setValtFörval,
    setKontonummer,
    setKontobeskrivning,
  } = useBokforStore();

  // Lokal UI state (INTE Zustand) - bara för denna komponent
  const [searchText, setSearchText] = useState(""); // Temporär söktext
  const [results, setResults] = useState<Förval[]>(favoritFörvalen || []); // Initiera med favoriter
  const [highlightedIndex, setHighlightedIndex] = useState(0); // Keyboard navigation
  const [loading, setLoading] = useState(false); // Visuell loading state

  // Sökfunktion som kan anropas direkt
  const performSearch = async (inputText: string) => {
    const input = normalize(inputText); // Säker normalisering

    // Visa bara förval när användaren skriver (minst 2 tecken)
    if (input.length < 2) {
      setResults([]); // Tom lista när ingen sökning
      setHighlightedIndex(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const alla = await fetchAllaForval();
      const q = input; // Redan normaliserad

      function score(f: Förval): number {
        let poäng = 0;

        // 4. BASE POINTS: Prioritera vanliga förval från början
        const basePointsMapping: Record<string, number> = {
          "Försäljning varor 25% moms": 150,
          "Försäljning tjänster 25% moms": 140,
          "Inköp varor 25% moms": 130,
          "Inköp tjänster 25% moms": 120,
        };

        poäng += basePointsMapping[f.namn] || 0;

        const namn = normalize(f.namn);

        // 1. LOGISK HIERARKI-FIX: Namn ska ha högre prioritet än sökord
        if (namn === q) poäng += 500;
        else if (namn.startsWith(q)) poäng += 300;
        else if (namn.includes(q)) poäng += 100;

        // Sökord med lägre prioritet än namn
        for (const ord of f.sökord || []) {
          const s = normalize(ord);
          if (s === q) poäng += 400;
          else if (s.startsWith(q)) poäng += 200;
          else if (s.includes(q)) poäng += 80;
        }

        // 2. KORTHET-BONUS: Kortare namn = mer relevant
        const längdBonus = Math.max(0, 50 - namn.length);
        poäng += längdBonus;

        // 3. POPULARITETS-BOOST: Baserat på hur ofta förvalet används
        const popularitetsBonus = (f.användningar || 0) * 3;
        poäng += popularitetsBonus;

        const desc = normalize(f.beskrivning);
        if (desc.includes(q)) poäng += 30;

        if (normalize(f.typ).includes(q)) poäng += 20;
        if (normalize(f.kategori).includes(q)) poäng += 20;

        return poäng;
      }

      let träffar = alla
        .map((f) => ({ förval: f, poäng: score(f) }))
        .filter((x) => x.poäng > 0)
        .sort((a, b) => b.poäng - a.poäng)
        .map((x) => x.förval);

      // Filtrera även sökresultat för leverantörsfakturor - bara kostnadskonton (4xxx, 5xxx, 6xxx)
      if (levfaktMode) {
        träffar = träffar.filter((f) => {
          // Kontrollera att förvalet har minst ett kostnadskonto (4xxx, 5xxx, 6xxx)
          const harKostnadskonto = f.konton.some((k: KontoRad) => {
            const kontonummer = k.kontonummer || "";
            return /^[456]/.test(kontonummer);
          });

          return harKostnadskonto;
        });
      }

      // Filtrera även sökresultat för utlägg - bara kostnadskonton (4xxx, 5xxx, 6xxx)
      if (utlaggMode) {
        träffar = träffar.filter((f) => {
          // Kontrollera att förvalet har minst ett kostnadskonto (4xxx, 5xxx, 6xxx)
          const harKostnadskonto = f.konton.some((k: KontoRad) => {
            const kontonummer = k.kontonummer || "";
            return /^[456]/.test(kontonummer);
          });

          return harKostnadskonto;
        });
      }

      setResults(träffar);
      setHighlightedIndex(0);
      setLoading(false);
    } catch (error) {
      console.error("Sökfel:", error);
      setLoading(false);
    }
  };

  const väljFörval = (f: Förval) => {
    loggaFavoritförval(f.id);
    setValtFörval(f);

    const huvudkonto = f.konton.find(
      (k: KontoRad) => k.kontonummer !== "1930" && (k.kredit || k.debet) && !!k.kontonummer
    );

    if (huvudkonto) {
      setKontonummer(huvudkonto.kontonummer ?? "");
      setKontobeskrivning(huvudkonto.beskrivning ?? "");
    } else {
      console.warn("⚠️ Hittade inget huvudkonto i förval:", f);
    }

    setCurrentStep(2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter") {
      if (results[highlightedIndex]) {
        väljFörval(results[highlightedIndex]);
      }
    }
    if (e.key === "Escape") {
      setSearchText("");
      setResults(favoritFörvalen);
      setHighlightedIndex(0);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setSearchText(newValue);
    performSearch(newValue); // Direkt sökning utan useEffect
  };

  const getTitle = () => {
    if (utlaggMode) return "Steg 1: Välj förval för utlägg";
    if (levfaktMode) return "Steg 1: Välj förval för leverantörsfaktura";
    return "Steg 1: Sök förval";
  };

  return {
    searchText,
    results,
    highlightedIndex,
    loading,
    handleKeyDown,
    handleSearchChange,
    väljFörval,
    getTitle,
  };
}
