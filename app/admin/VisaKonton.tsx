"use client";

import { useState, useEffect } from "react";
import { hämtaAllaKonton } from "./actions";

export type Konto = {
  kontonummer: string;
  kontobeskrivning: string;
  kontoklass: string;
  sökord: string[];
  kategori: string;
};

export default function VisaKonton() {
  const [accounts, setAccounts] = useState<Konto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kategori, setKategori] = useState("");
  const [klass, setKlass] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetch = async () => {
      const data = await hämtaAllaKonton();
      setAccounts(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const allaKategorier =
    accounts.length > 0 ? Array.from(new Set(accounts.map((k) => k.kategori))).sort() : [];

  const allaKlasser =
    accounts.length > 0 ? Array.from(new Set(accounts.map((k) => k.kontoklass))).sort() : [];

  const harSökfilter = query || kategori || klass;

  const filtrerade = (
    harSökfilter
      ? accounts.filter((konto) => {
          const matchQuery =
            konto.kontonummer.includes(query) ||
            konto.kontobeskrivning.toLowerCase().includes(query.toLowerCase()) ||
            konto.sökord.some((word) => word.toLowerCase().includes(query.toLowerCase()));

          const matchKategori = kategori ? konto.kategori === kategori : true;
          const matchKlass = klass ? konto.kontoklass === klass : true;

          return matchQuery && matchKategori && matchKlass;
        })
      : accounts
  ).sort((a, b) => {
    return sortOrder === "asc"
      ? a.kontonummer.localeCompare(b.kontonummer)
      : b.kontonummer.localeCompare(a.kontonummer);
  });

  const kontoklassFärg: Record<string, string> = {
    Intäkter: "bg-green-500",
    Kostnader: "bg-red-500",
    Tillgångar: "bg-blue-500",
    Skulder: "bg-yellow-500",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Kontoinformation</h1>

      {loading ? (
        <p className="text-gray-400">🔄 Laddar konton...</p>
      ) : (
        <>
          <div className="text-gray-300 mb-6">{filtrerade.length} konton</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök kontonamn, nummer eller sökord..."
              className="w-full p-3 border border-gray-700 rounded bg-slate-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full p-3 border border-gray-700 rounded bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Alla kategorier</option>
              {allaKategorier.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              className="w-full p-3 border border-gray-700 rounded bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Alla kontoklasser</option>
              {allaKlasser.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end mb-4">
            <button
              className="text-sm underline text-cyan-300"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            >
              Sortera: {sortOrder === "asc" ? "Stigande" : "Fallande"}
            </button>
          </div>

          {filtrerade.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filtrerade.map((konto) => (
                <div
                  key={konto.kontonummer + konto.kontobeskrivning}
                  className="bg-slate-800 shadow rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-white">
                      {konto.kontonummer} – {konto.kontobeskrivning}
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full ml-2 ${
                        kontoklassFärg[konto.kontoklass] || "bg-gray-400"
                      }`}
                      title={konto.kontoklass}
                    ></span>
                  </div>
                  <div className="text-sm text-gray-300 mb-1">
                    <strong>Kategori:</strong> {konto.kategori}
                  </div>
                  <div className="text-sm text-gray-400">
                    <strong>Sökord:</strong> {konto.sökord.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">Inga konton hittades.</p>
          )}
        </>
      )}
    </div>
  );
}
