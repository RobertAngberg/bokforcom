"use client";

import { useState, useEffect } from "react";
import { fetchAllaForval } from "../start/actions";

type KontoRad = {
  beskrivning: string;
  kontonummer?: string;
  debet?: string | boolean;
  kredit?: string | boolean;
};

type Forval = {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  sökord?: string[] | string | null;
  konton: KontoRad[];
};

export default function VisaForval() {
  const [forval, setForval] = useState<Forval[]>([]);
  const [allaFörval, setAllaFörval] = useState<Forval[]>([]);
  const [sök, setSök] = useState("");
  const [kategori, setKategori] = useState("");
  const [typ, setTyp] = useState("");

  // Hämta metadata till dropdowns
  useEffect(() => {
    const init = async () => {
      const alla = await fetchAllaForval();
      setAllaFörval(alla);
    };
    init();
  }, []);

  // Hämta filtrerade resultat
  useEffect(() => {
    const hämta = async () => {
      const visaFörval = sök.length > 0 || kategori || typ;
      if (!visaFörval) {
        setForval([]);
        return;
      }
      const resultat = await fetchAllaForval({ sök, kategori, typ });
      setForval(resultat);
    };
    hämta();
  }, [sök, kategori, typ]);

  const unikaKategorier = Array.from(new Set(allaFörval.map((f) => f.kategori))).sort();
  const unikaTyper = Array.from(
    new Set(allaFörval.map((f) => (f.typ ?? "").trim().toLowerCase()))
  ).sort();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Förval</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          value={sök}
          onChange={(e) => setSök(e.target.value)}
          placeholder="Sök namn, beskrivning eller sökord..."
          className="w-full p-3 border border-gray-700 rounded bg-slate-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className="w-full p-3 border border-gray-700 rounded bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Alla kategorier</option>
          {unikaKategorier.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          value={typ}
          onChange={(e) => setTyp(e.target.value)}
          className="w-full p-3 border border-gray-700 rounded bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Alla typer</option>
          {unikaTyper.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {forval.length === 0 ? (
        <p className="text-gray-400 mb-6">Inga förval matchar dina filter.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forval.map((f) => (
            <div key={f.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow">
              <div className="text-xl font-bold text-white mb-4">✓ {f.namn}</div>
              <div className="italic text-gray-300 mb-5">{f.beskrivning}</div>
              <div className="text-sm text-gray-400 mb-0">
                <strong>Kategori:</strong> {f.kategori}
              </div>
              <div className="text-sm text-gray-400 mb-5">
                <strong>Typ:</strong> {f.typ}
              </div>

              {Array.isArray(f.sökord) && f.sökord.length > 0 && (
                <div className="text-sm text-gray-500 mb-5">
                  <strong>Sökord:</strong> {f.sökord.join(", ")}
                </div>
              )}

              <table className="w-full border border-slate-600 text-sm text-gray-300 mb-2">
                <thead className="bg-slate-700 text-white">
                  <tr>
                    <th className="border border-slate-600 px-2 py-1 text-left">Konto</th>
                    <th className="border border-slate-600 px-2 py-1 text-center">Debet</th>
                    <th className="border border-slate-600 px-2 py-1 text-center">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {f.konton.map((konto, i) => (
                    <tr key={i}>
                      <td className="border border-slate-700 px-2 py-1">
                        {konto.kontonummer ? `${konto.kontonummer} ` : ""}
                        {konto.beskrivning}
                      </td>
                      <td className="border border-slate-700 px-2 py-1 text-center">
                        {konto.debet === true || typeof konto.debet === "string" ? "✓" : ""}
                      </td>
                      <td className="border border-slate-700 px-2 py-1 text-center">
                        {konto.kredit === true || typeof konto.kredit === "string" ? "✓" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
