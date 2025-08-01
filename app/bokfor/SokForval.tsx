"use client";

import { useState, useEffect, useRef } from "react";
import { fetchAllaForval, loggaFavoritförval } from "./actions";
import FörvalKort from "./ForvalKort";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      const input = searchText.trim();

      if (input.length < 2) {
        setResults(favoritFörvalen);
        setHighlightedIndex(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      const alla = await fetchAllaForval();
      const q = normalize(input);

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

      const träffar = alla
        .map((f) => ({ förval: f, poäng: score(f) }))
        .filter((x) => x.poäng > 0)
        .sort((a, b) => b.poäng - a.poäng)
        .map((x) => x.förval);

      setResults(träffar);
      setHighlightedIndex(0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchText, favoritFörvalen]);

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

      <input
        ref={inputRef}
        className="text-center w-full p-3 text-white border-2 border-gray-700 rounded-lg bg-slate-900 placeholder-gray-400"
        type="text"
        autoComplete="off"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Skriv t.ex. representation eller leasing..."
      />

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
