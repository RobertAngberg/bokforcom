"use client";

import { useState, KeyboardEvent } from "react";
import { körSQL } from "./actions";

/* ---------- Typer ---------- */
type QueryResult = { rows: any[] } | { rowCount: number | null; command: string };

/* ---------- Mallar & tabeller ---------- */
const templates = [
  { label: "Visa allt", sql: "SELECT * FROM {T};" },
  { label: "Räkna rader", sql: "SELECT COUNT(*) FROM {T};" },
  { label: "Senaste 10", sql: "SELECT * FROM {T} ORDER BY id DESC LIMIT 10;" },
  { label: "Infoga rad", sql: "INSERT INTO {T} (...) VALUES (...);" },
  { label: "Uppdatera rad", sql: "UPDATE {T} SET ... WHERE id = ?;" },
  { label: "Ta bort rad", sql: "DELETE FROM {T} WHERE id = ?;" },
];

const TABLES = ["förval", "konton", "transaktioner", "transaktionsposter"];

/* ---------- Komponent ---------- */
export default function SQLEditor() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openTable, setOpenTable] = useState<string | null>(null);
  const [expandedCell, setExpandedCell] = useState<Record<string, boolean>>({});

  /* gemensam stil */
  const fieldClasses =
    "w-full bg-slate-800 text-slate-200 placeholder:text-slate-400 " +
    "placeholder:italic placeholder:font-light p-2 border border-gray-500 " +
    "rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600";

  /* ---------- SQL‑call ---------- */
  async function run() {
    if (!query.trim()) return;
    setError(null);
    setResult(null);
    try {
      setResult(await körSQL(query));
    } catch (err: any) {
      setError(err.message);
    }
  }

  function reset() {
    setQuery("");
    setResult(null);
    setError(null);
    setOpenTable(null);
    setExpandedCell({});
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      run();
    }
  }

  /* ---------- helpers ---------- */
  const prettyObject = (obj: Record<string, any>) =>
    Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"); // radbryt per fält

  const fmt = (v: any): string => {
    if (v instanceof Date) return v.toISOString().slice(0, 19).replace("T", " ");
    if (v === null) return "NULL";

    if (Array.isArray(v)) {
      if (!v.length) return "[]";
      if (typeof v[0] === "object") {
        // objekten separeras med linje
        return v.map((o) => prettyObject(o as Record<string, any>)).join("\n───\n");
      }
      return v.join(", ");
    }

    if (typeof v === "object") return prettyObject(v);
    return String(v);
  };

  /* ---------- Resultat ---------- */
  function renderResult() {
    if (!result) return null;

    if ("rows" in result) {
      if (!result.rows.length) return <p className="mt-4">0 rader.</p>;
      const cols = Object.keys(result.rows[0]);

      return (
        <div className="mt-4 max-h-96 overflow-y-auto">
          <table className="table-auto w-full border-collapse text-sm font-sans">
            <thead className="sticky top-0 bg-cyan-950">
              <tr>
                {cols.map((c) => (
                  <th
                    key={c}
                    className="px-3 py-3 h-12 text-left text-xs tracking-wide font-medium whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="[&>tr:nth-child(odd)]:bg-slate-800 [&>tr:nth-child(even)]:bg-slate-700">
              {result.rows.map((row, i) => (
                <tr key={i}>
                  {cols.map((c) => {
                    const raw = fmt(row[c]);
                    const cellId = `${i}-${c}`;
                    const expanded = expandedCell[cellId];
                    const isLong = raw.includes("\n") || raw.length > 120; // kriterium för collapse
                    const preview = raw.includes("\n")
                      ? raw.split("\n")[0] + " …"
                      : raw.slice(0, 120) + (raw.length > 120 ? " …" : "");

                    return (
                      <td
                        key={c}
                        className="px-2 py-1 whitespace-pre-wrap break-words max-w-[16rem] cursor-pointer hover:bg-slate-600 transition"
                        onClick={() =>
                          isLong &&
                          setExpandedCell((p) => ({
                            ...p,
                            [cellId]: !expanded,
                          }))
                        }
                      >
                        {isLong && !expanded ? preview : raw}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <p className="mt-4">
        {result.command.toUpperCase()} – {result.rowCount ?? 0} rad(er) påverkade.
      </p>
    );
  }

  /* ---------- JSX ---------- */
  return (
    <div className="p-6 space-y-6 text-white">
      <h2 className="text-xl font-bold">SQL‑verktyg (Admin)</h2>

      {/* textinput */}
      <textarea
        className={fieldClasses}
        rows={8}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Skriv SQL här…  (Enter = kör, Shift+Enter = ny rad)"
      />

      {/* knappar */}
      <div className="flex gap-4">
        <button
          onClick={run}
          className="flex items-center gap-2 pl-3 pr-6 py-4 font-bold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700 transition"
        >
          🚀 Kör
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 pl-3 pr-6 py-4 font-bold text-white rounded-lg bg-slate-600 hover:bg-slate-700 transition"
        >
          🧹 Rensa
        </button>
      </div>

      {error && <pre className="text-red-600 whitespace-pre-wrap mt-4">{error}</pre>}
      {renderResult()}

      {/* Vanliga kommandon */}
      <div className="space-y-2">
        {TABLES.map((tbl) => {
          const open = openTable === tbl;
          return (
            <div key={tbl} className="border border-slate-600 rounded">
              <button
                onClick={() => setOpenTable(open ? null : tbl)}
                className="w-full flex justify-between items-center px-3 py-2 bg-slate-900 text-left hover:bg-slate-800 transition"
              >
                <span className="font-medium capitalize">{tbl}</span>
                <span>{open ? "▲" : "▼"}</span>
              </button>

              {open && (
                <ul className="divide-y divide-slate-700">
                  {templates.map((t) => (
                    <li key={t.label}>
                      <button
                        onClick={() => setQuery(t.sql.replace("{T}", tbl))}
                        className="w-full text-left px-4 py-2 bg-slate-800 hover:bg-slate-700 transition whitespace-pre"
                      >
                        {t.sql.replace("{T}", tbl)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
