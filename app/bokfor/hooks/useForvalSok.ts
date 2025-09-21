"use client";

import { useState, useEffect, useCallback } from "react";
import { normalize } from "../../_utils/textUtils";
import { loggaFavoritförval } from "../actions/actions";
import type { Förval, KontoRad } from "../types/types";

interface UseForvalSokProps {
  favoritFörval: Förval[];
  allaFörval: Förval[];
  levfaktMode: boolean;
  utlaggMode: boolean;
  onForvalVald: (förval: Förval, huvudkonto?: KontoRad) => void;
}

export function useForvalSok({
  favoritFörval,
  allaFörval,
  levfaktMode,
  utlaggMode,
  onForvalVald,
}: UseForvalSokProps) {
  // Lokal UI state för sök
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Förval[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Uppdatera results när favoritFörval kommer från store
  useEffect(() => {
    if (searchText.length < 2 && favoritFörval.length > 0) {
      setResults(favoritFörval);
    }
  }, [favoritFörval, searchText]);

  // Sökfunktion
  const performSearch = useCallback(
    async (inputText: string) => {
      const input = normalize(inputText);

      if (input.length < 2) {
        setResults(favoritFörval);
        setHighlightedIndex(0);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const alla = allaFörval;
        const q = input;

        function score(f: Förval): number {
          let poäng = 0;

          const basePointsMapping: Record<string, number> = {
            "Försäljning varor 25% moms": 150,
            "Försäljning tjänster 25% moms": 140,
            "Inköp varor 25% moms": 130,
            "Inköp tjänster 25% moms": 120,
          };

          poäng += basePointsMapping[f.namn] || 0;

          const namn = normalize(f.namn);

          if (namn === q) poäng += 500;
          else if (namn.startsWith(q)) poäng += 300;
          else if (namn.includes(q)) poäng += 100;

          for (const ord of f.sökord || []) {
            const s = normalize(ord);
            if (s === q) poäng += 400;
            else if (s.startsWith(q)) poäng += 200;
            else if (s.includes(q)) poäng += 80;
          }

          const längdBonus = Math.max(0, 50 - namn.length);
          poäng += längdBonus;

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

        // Filtrera baserat på mode
        if (levfaktMode) {
          träffar = träffar.filter((f) => {
            const harKostnadskonto = f.konton.some((k: KontoRad) => {
              const kontonummer = k.kontonummer || "";
              return /^[456]/.test(kontonummer);
            });
            return harKostnadskonto;
          });
        }

        if (utlaggMode) {
          träffar = träffar.filter((f) => {
            const harKostnadskonto = f.konton.some((k: KontoRad) => {
              const kontonummer = k.kontonummer || "";
              return /^[45678]/.test(kontonummer);
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
    },
    [allaFörval, levfaktMode, utlaggMode, favoritFörval]
  );

  const väljFörval = useCallback(
    (f: Förval) => {
      loggaFavoritförval(f.id);

      const huvudkonto = f.konton.find(
        (k: KontoRad) => k.kontonummer !== "1930" && (k.kredit || k.debet) && !!k.kontonummer
      );

      onForvalVald(f, huvudkonto);
    },
    [onForvalVald]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        setResults(favoritFörval);
        setHighlightedIndex(0);
      }
    },
    [results, highlightedIndex, väljFörval, favoritFörval]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setSearchText(newValue);
      performSearch(newValue);
    },
    [performSearch]
  );

  const getTitle = useCallback(() => {
    if (utlaggMode) return "Steg 1: Välj förval för utlägg";
    if (levfaktMode) return "Steg 1: Välj förval för leverantörsfaktura";
    return "Steg 1: Sök förval";
  }, [utlaggMode, levfaktMode]);

  const clearSearch = useCallback(() => {
    setSearchText("");
    setResults(favoritFörval);
    setHighlightedIndex(0);
  }, [favoritFörval]);

  return {
    // State
    searchText,
    results,
    highlightedIndex,
    loading,

    // Handlers
    handleSearchChange,
    handleKeyDown,
    väljFörval,
    clearSearch,

    // Helpers
    getTitle,
  };
}
