"use client";

import { useState, useEffect } from "react";
import { fetchAllaForval, loggaFavoritförval } from "../_actions/actions";
import FörvalKort from "./ForvalKort";
import TextFalt from "../../_components/TextFalt";
import { KontoRad, Förval, SokForvalProps } from "../_types/types";
import { useBokforStore } from "../_stores/bokforStore";

export default function SokForval({
  favoritFörvalen,
  levfaktMode = false,
  utlaggMode = false,
}: SokForvalProps) {
  // Hämta alla funktioner från Zustand store istället för props
  const { setCurrentStep, setValtFörval, setKontonummer, setKontobeskrivning } = useBokforStore();
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Förval[]>([]); // Börja med tom lista
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Säker text-normalisering med escaping
  const normalize = (s: string) => {
    if (!s || typeof s !== "string") return "";
    return s
      .toLowerCase()
      .replace(/[<>'"&]/g, "") // Ta bort farliga tecken
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 100); // Begränsa längd
  };

  useEffect(() => {
    // TextFalt hanterar autoFocus automatiskt
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      const input = normalize(searchText); // Säker normalisering

      // Visa bara förval när användaren skriver (minst 2 tecken)
      if (input.length < 2) {
        setResults([]); // Tom lista när ingen sökning
        setHighlightedIndex(0);
        setLoading(false);
        return;
      }

      setLoading(true);
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
    }, 300);

    return () => clearTimeout(delay);
  }, [searchText, favoritFörvalen, levfaktMode, utlaggMode]);

  const väljFörval = (f: Förval) => {
    loggaFavoritförval(f.id);
    setValtFörval(f);

    const huvudkonto = f.konton.find(
      (k) => k.kontonummer !== "1930" && (k.kredit || k.debet) && !!k.kontonummer
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
      setResults(favoritFörvalen || []);
      setHighlightedIndex(0);
    }
  };

  return (
    <div className="w-full">
      <h1 className="mb-8 text-3xl text-center text-white">
        {utlaggMode
          ? "Steg 1: Välj förval för utlägg"
          : levfaktMode
            ? "Steg 1: Välj förval för leverantörsfaktura"
            : "Steg 1: Sök förval"}
      </h1>

      <div onKeyDown={handleKeyDown}>
        <TextFalt
          label=""
          name="forval-search"
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Skriv t.ex. representation eller leasing..."
          required={false}
          maxLength={20}
          pattern="[A-Za-z0-9åäöÅÄÖ\s\-\.]*"
          autoFocus={true}
          className="text-center border-2 border-gray-700"
        />
      </div>

      {loading && (
        <div className="flex justify-center mt-6">
          <div className="w-8 h-8 border-4 border-gray-500 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-fade-in">
          {results.map((f, index) => (
            <FörvalKort
              key={f.id}
              förval={f}
              isHighlighted={index === highlightedIndex}
              onClick={() => väljFörval(f)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
