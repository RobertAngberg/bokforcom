"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Tabell, { ColumnDefinition } from "../../../_components/Tabell";
import Knapp from "../../../_components/Knapp";
import Toast from "../../../_components/Toast";
import UtlaggBokforModal from "./UtlaggBokforModal";
import { taBortUtlägg } from "../../actions/utlaggActions";

interface Utlägg {
  id: number;
  belopp: number;
  beskrivning: string;
  datum: string;
  kategori?: string;
  status: string;
  anställd_namn?: string;
  kvitto_fil?: string;
  kvitto_url?: string;
}

interface UtlaggFlikProps {
  state: any;
  handlers: any;
  utlaggFlikData: () => any;
}

export default function UtlaggFlik({ state, handlers, utlaggFlikData }: UtlaggFlikProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Använd den delade utlaggFlikData funktionen
  const { columns: basicColumns, utlägg, loading } = utlaggFlikData();

  const handleNyttUtlägg = async () => {
    router.push("/bokfor?utlagg=true");
  };

  const handleTaBortUtlägg = async (utläggId: number) => {
    if (!confirm("Är du säker på att du vill ta bort detta utlägg?")) {
      return;
    }

    try {
      await taBortUtlägg(utläggId);

      // Uppdatera listan genom att ladda om utlägg för vald anställd
      if (handlers.laddaUtläggFörAnställd && state.valdAnställd) {
        await handlers.laddaUtläggFörAnställd(state.valdAnställd.id);
      }

      setToast({ type: "success", message: "Utlägg borttaget!" });
    } catch (error) {
      console.error("Fel vid borttagning av utlägg:", error);
      setToast({ type: "error", message: "Kunde inte ta bort utlägg" });
    }
  };

  // Förbättrade kolumner med fler funktioner
  const enhancedColumns: ColumnDefinition<Utlägg>[] = [
    {
      key: "datum",
      label: "Datum",
      render: (value, row) => {
        return row?.datum ? new Date(row.datum).toLocaleDateString("sv-SE") : "-";
      },
    },
    {
      key: "beskrivning",
      label: "Beskrivning",
      render: (value, row) => {
        return row?.beskrivning || "-";
      },
    },
    {
      key: "belopp",
      label: "Belopp",
      render: (value, row) => {
        return row && row.belopp !== undefined && row.belopp !== null
          ? `${row.belopp.toLocaleString("sv-SE")} kr`
          : "-";
      },
    },
    {
      key: "kategori",
      label: "Kategori",
      render: (value, row) => {
        return row?.kategori || "-";
      },
    },
    {
      key: "status",
      label: "Status",
      className: "text-center",
      render: (value, row) => {
        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 rounded text-xs ${
                row?.status === "Inkluderat i lönespec"
                  ? "bg-green-900 text-green-300"
                  : row?.status === "Väntande"
                    ? "bg-yellow-900 text-yellow-300"
                    : "bg-gray-700 text-gray-300"
              }`}
            >
              {row?.status === "Inkluderat i lönespec" ? "Inkluderat" : row?.status || "Okänd"}
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
          <div className="text-center text-gray-400 py-8">Laddar utlägg...</div>
        ) : utlägg.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Inga utlägg hittades för {state.valdAnställd?.förnamn}.</p>
            <p className="text-sm mt-2">
              Klicka på "Nytt utlägg" för att skapa det första utlägget.
            </p>
          </div>
        ) : (
          <Tabell data={utlägg} columns={enhancedColumns} getRowId={(row: any) => row.id} />
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
          <p>• Klicka på "Nytt utlägg" för att registrera ett nytt utlägg via bokföring</p>
        </div>
      </div>

      <UtlaggBokforModal />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
