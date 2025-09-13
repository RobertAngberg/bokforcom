//#region Huvud
"use client";

import { useState } from "react";
import { hämtaAnställda } from "../../_actions/actions";
import { UtlaggAnställd, UtläggProps } from "../../_types/types";
//#endregion

export default function Utlägg({ onUtläggChange, initialValue = false }: UtläggProps) {
  //#region State
  const [isUtlägg, setIsUtlägg] = useState(initialValue);
  const [anställda, setAnställda] = useState<UtlaggAnställd[]>([]);
  const [valdaAnställda, setValdaAnställda] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  //#endregion

  //#region Handlers
  const handleUtläggChange = async (checked: boolean) => {
    setIsUtlägg(checked);

    if (checked) {
      setLoading(true);
      try {
        const anställdaData = await hämtaAnställda();
        setAnställda(anställdaData || []);
      } catch (error) {
        console.error("❌ Fel vid hämtning av anställda:", error);
        setAnställda([]);
      }
      setLoading(false);
    } else {
      setAnställda([]);
      setValdaAnställda([]);
    }

    onUtläggChange?.(checked, checked ? valdaAnställda : []);
  };

  const handleAnställdChange = (anställdId: number, checked: boolean) => {
    const nyaValda = checked
      ? [...valdaAnställda, anställdId]
      : valdaAnställda.filter((id) => id !== anställdId);

    setValdaAnställda(nyaValda);
    onUtläggChange?.(isUtlägg, nyaValda);
  };
  //#endregion

  return (
    <div className="space-y-4">
      {/* Huvudcheckbox */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="checkbox"
          id="utlägg-checkbox"
          checked={isUtlägg}
          onChange={(e) => handleUtläggChange(e.target.checked)}
          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <label
          htmlFor="utlägg-checkbox"
          className="text-gray-400 text-base font-medium cursor-pointer select-none"
        >
          Är ett utlägg åt en anställd
        </label>
      </div>

      {/* Anställda lista */}
      {isUtlägg && (
        <div>
          <h4 className="text-gray-400 font-semibold mb-3">Välj anställd:</h4>

          {loading && <div className="text-gray-300">Laddar anställda...</div>}

          {!loading && anställda.length === 0 && (
            <div className="text-gray-400">Inga anställda hittades</div>
          )}

          {!loading && anställda.length > 0 && (
            <div className="space-y-2">
              {anställda.map((anställd) => (
                <div key={anställd.id} className="flex items-center gap-3 mb-6">
                  <input
                    type="checkbox"
                    id={`anställd-${anställd.id}`}
                    checked={valdaAnställda.includes(anställd.id)}
                    onChange={(e) => handleAnställdChange(anställd.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label
                    htmlFor={`anställd-${anställd.id}`}
                    className="text-gray-300 cursor-pointer select-none"
                  >
                    {anställd.förnamn} {anställd.efternamn}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
