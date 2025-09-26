"use client";

import Tabell, { ColumnDefinition } from "../../../../_components/Tabell";
import Knapp from "../../../../_components/Knapp";
import LoadingSpinner from "../../../../_components/LoadingSpinner";
import UtlaggBokforModal from "./UtlaggBokforModal";
import { useUtlagg } from "../../../hooks/useUtlagg";
import type { Utlägg, UtlaggFlikProps } from "../../../types/types";

export default function UtlaggFlik({ state }: Omit<UtlaggFlikProps, "utlaggFlikData">) {
  const {
    utlägg,
    loading,
    handleNyttUtlägg,
    handleTaBortUtlägg,
    formatDatum,
    formatBelopp,
    getStatusClass,
    getStatusText,
  } = useUtlagg({
    anställdId: state?.valdAnställd?.id,
    enableFlikMode: true,
  });

  // Enhanced columns with all formatting functions
  const enhancedColumns: ColumnDefinition<Utlägg>[] = [
    {
      key: "datum",
      label: "Datum",
      render: (value, row) => formatDatum(row),
    },
    {
      key: "beskrivning",
      label: "Beskrivning",
      render: (value, row) => row?.beskrivning || "-",
    },
    {
      key: "belopp",
      label: "Belopp",
      render: (value, row) => formatBelopp(row),
    },
    {
      key: "kategori",
      label: "Kategori",
      render: (value, row) => row?.kategori || "-",
    },
    {
      key: "status",
      label: "Status",
      className: "text-center",
      render: (value, row) => {
        return (
          <div className="flex justify-center">
            <span className={`px-2 py-1 rounded text-xs ${getStatusClass(row?.status || "")}`}>
              {getStatusText(row?.status || "")}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Åtgärder",
      render: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTaBortUtlägg(row.id);
          }}
          className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20"
          disabled={loading}
        >
          🗑️
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header med knapp för nytt utlägg */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">💳 Utlägg för {state.valdAnställd?.förnamn}</h3>
        <Knapp text="+ Nytt utlägg" onClick={handleNyttUtlägg} />
      </div>

      {/* Utläggstabell */}
      <div className="bg-slate-800 p-4 rounded-lg">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : utlägg.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Inga utlägg hittades för {state.valdAnställd?.förnamn}.</p>
            <p className="text-sm mt-2">
              Klicka på &quot;Nytt utlägg&quot; för att skapa det första utlägget.
            </p>
          </div>
        ) : (
          <Tabell data={utlägg} columns={enhancedColumns} getRowId={(row: Utlägg) => row.id} />
        )}
      </div>

      {/* Info om utlägg */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-white mb-2">ℹ️ Om utlägg</h4>
        <div className="text-gray-300 text-sm space-y-1">
          <p>
            • <strong>Väntande:</strong> Utlägget är registrerat men inte inkluderat i någon
            lönespec ännu
          </p>
          <p>
            • <strong>Inkluderat:</strong> Utlägget är kopplat till en lönespecifikation
          </p>
          <p>
            • Klicka på &quot;Nytt utlägg&quot; för att registrera ett nytt utlägg via bokföring
          </p>
        </div>
      </div>

      <UtlaggBokforModal />
    </div>
  );
}
