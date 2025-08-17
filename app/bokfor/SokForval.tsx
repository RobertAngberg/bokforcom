"use client";

import { useState, useEffect } from "react";
import { fetchAllaForval, loggaFavoritförval } from "./actions";
import FörvalKort from "./ForvalKort";
import TextFalt from "../_components/TextFalt";

type KontoRad = {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
};

type Extrafält = {
  namn: string;
  label: string;
  konto: string;
  debet: boolean;
  kredit: boolean;
};

type Forval = {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: KontoRad[];
  sökord: string[];
  extrafält?: Extrafält[];
};

type Props = {
  favoritFörvalen: Forval[];
  setCurrentStep: (val: number) => void;
  setvaltFörval: (val: Forval) => void;
  setKontonummer: (val: string) => void;
  setKontobeskrivning: (val: string) => void;
  levfaktMode?: boolean;
};

export default function SokForval({
  favoritFörvalen,
  setCurrentStep,
  setvaltFörval,
  setKontonummer,
  setKontobeskrivning,
  levfaktMode = false,
}: Props) {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Forval[]>(favoritFörvalen ?? []);
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

      if (input.length < 2) {
        let baseResults = favoritFörvalen;

        // Filtrera för att bara visa kostnadskonton (4xxx, 5xxx, 6xxx) i leverantörsfaktura-mode
        if (levfaktMode) {
          baseResults = baseResults.filter((f) => {
            // Filtrera bort alla konton som inte är 1930, 2440 eller kostnadskonton (4xxx, 5xxx, 6xxx)
            const relevantaKonton = f.konton.filter((k: KontoRad) => {
              const kontonummer = k.kontonummer || "";
              // Behåll alltid 1930 (Förutbetald moms) och 2440 (Leverantörsskulder)
              if (kontonummer === "1930" || kontonummer === "2440") return true;
              // Behåll endast kostnadskonton (4xxx, 5xxx, 6xxx)
              return /^[456]/.test(kontonummer);
            });

            // Visa bara förval som har minst ett kostnadskonto (4xxx, 5xxx, 6xxx)
            // eller som är specialförval för leverantörsfakturor
            const harKostnadskonto = relevantaKonton.some((k: KontoRad) => {
              const kontonummer = k.kontonummer || "";
              return /^[456]/.test(kontonummer);
            });

            return harKostnadskonto;
          });
        }

        setResults(baseResults);
        setHighlightedIndex(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      const alla = await fetchAllaForval();
      const q = input; // Redan normaliserad

      function score(f: Forval): number {
        let poäng = 0;

        const namn = normalize(f.namn);
        if (namn === q) poäng += 200;
        else if (namn.startsWith(q)) poäng += 100;
        else if (namn.includes(q)) poäng += 40;

        for (const ord of f.sökord || []) {
          const s = normalize(ord);
          if (s === q) poäng += 300;
          else if (s.startsWith(q)) poäng += 150;
          else if (s.includes(q)) poäng += 60;
        }

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

      setResults(träffar);
      setHighlightedIndex(0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchText, favoritFörvalen, levfaktMode]);

  const väljFörval = (f: Forval) => {
    loggaFavoritförval(f.id);
    setvaltFörval(f);

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
      setResults(favoritFörvalen);
      setHighlightedIndex(0);
    }
  };

  return (
    <div className="w-full">
      <h1 className="mb-8 text-3xl text-center text-white">
        {levfaktMode ? "Steg 1: Välj förval för leverantörsfaktura" : "Steg 1: Sök förval"}
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
