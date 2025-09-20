"use client";
import { UtbetalningsdatumValjareProps } from "../../types/types";

export default function UtbetalningsdatumValjare({
  datumLista,
  utbetalningsdatum,
  setUtbetalningsdatum,
  specarPerDatum,
}: UtbetalningsdatumValjareProps) {
  if (datumLista.length === 0) return null;

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-white mb-2">Välj utbetalningsdatum:</h2>
      <div className="flex flex-col gap-2">
        {datumLista.map((datum) => (
          <a
            key={datum}
            href="#"
            className={`px-3 py-1 rounded bg-slate-700 text-white hover:bg-cyan-600 w-fit ${datum === utbetalningsdatum ? "ring-2 ring-cyan-400" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setUtbetalningsdatum(datum);
            }}
          >
            {new Date(datum).toLocaleDateString("sv-SE")} ({specarPerDatum[datum]?.length ?? 0}{" "}
            lönespecar)
          </a>
        ))}
      </div>
    </div>
  );
}
