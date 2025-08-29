"use client";

import { useState, useEffect } from "react";
import MainLayout from "../../_components/MainLayout";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";
import { hämtaAllaAnställda, hämtaUtlägg, taBortUtlägg } from "../actions";
import { fetchFavoritforval } from "../../bokfor/actions";
import BokforPage from "../../bokfor/page";

interface Utlägg {
  id: number;
  belopp: number;
  beskrivning: string;
  datum: string;
  kategori?: string;
  status: string;
  anställd_namn?: string;
  kvitto_fil?: string;
}

export default function UtlaggPage() {
  const [utlägg, setUtlägg] = useState<Utlägg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNyttUtlägg, setShowNyttUtlägg] = useState(false);
  const [favoritFörvalen, setFavoritFörvalen] = useState<any[] | null>(null);

  useEffect(() => {
    hämtaAllaUtlägg();
  }, []);

  const hämtaAllaUtlägg = async () => {
    try {
      setLoading(true);

      // Hämta alla anställda först
      const anställda = await hämtaAllaAnställda();
      console.log("🧑‍💼 Alla anställda:", anställda);

      // Samla alla utlägg från alla anställda
      const allaUtlägg: Utlägg[] = [];

      for (const anställd of anställda) {
        try {
          const anställdUtlägg = await hämtaUtlägg(anställd.id);
          console.log(`Utlägg för ${anställd.förnamn}:`, anställdUtlägg);

          if (anställdUtlägg.length > 0) {
            console.log("🔍 Första utlägg structure:", anställdUtlägg[0]);
          }

          const mappedUtlägg = anställdUtlägg
            .filter((u: any) => u && typeof u === "object" && u.id) // Filtrera bort tomma objekt och se till att id finns
            .map((u: any) => {
              const mapped = {
                id: u.id,
                belopp: u.belopp || 0,
                beskrivning: u.beskrivning || "Utlägg",
                datum: u.datum || new Date().toISOString().split("T")[0],
                kategori: u.kategori || "",
                status: u.status || "Väntande",
                kvitto_fil: u.kvitto_fil || null,
                anställd_namn: `${anställd.förnamn} ${anställd.efternamn}`,
              };
              console.log("🗂️ Mapped utlägg:", mapped);
              return mapped;
            });

          console.log(`📋 Alla mappade utlägg för ${anställd.förnamn}:`, mappedUtlägg);
          allaUtlägg.push(...mappedUtlägg);
        } catch (error) {
          console.error(`Fel vid hämtning av utlägg för ${anställd.förnamn}:`, error);
        }
      }

      setUtlägg(allaUtlägg);
      console.log("🎯 Final allaUtlägg:", allaUtlägg);
    } catch (error) {
      console.error("Fel vid hämtning av utlägg:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNyttUtlägg = async () => {
    if (!favoritFörvalen) {
      const res = await fetchFavoritforval();
      setFavoritFörvalen(res);
    }
    setShowNyttUtlägg(true);
  };

  const handleTaBortUtlägg = async (utläggId: number) => {
    if (!confirm("Är du säker på att du vill ta bort detta utlägg?")) {
      return;
    }

    try {
      setLoading(true);
      await taBortUtlägg(utläggId);

      // Uppdatera listan
      await hämtaAllaUtlägg();
      alert("Utlägg borttaget!");
    } catch (error) {
      console.error("Fel vid borttagning av utlägg:", error);
      alert("❌ Kunde inte ta bort utlägg");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDefinition<Utlägg>[] = [
    {
      key: "datum",
      label: "Datum",
      render: (value, row) => {
        console.log("📅 Datum render - value:", value, "row:", row);
        return row?.datum ? new Date(row.datum).toLocaleDateString("sv-SE") : "-";
      },
    },
    {
      key: "beskrivning",
      label: "Beskrivning",
      render: (value, row) => {
        console.log("📝 Beskrivning render - value:", value, "row:", row);
        return row?.beskrivning || "-";
      },
    },
    {
      key: "anställd_namn",
      label: "Anställd",
      render: (value, row) => {
        console.log("👤 Anställd render - value:", value, "row:", row);
        return row?.anställd_namn || "-";
      },
    },
    {
      key: "belopp",
      label: "Belopp",
      render: (value, row) => {
        console.log("💰 Belopp render - value:", value, "row:", row);
        return row && row.belopp !== undefined && row.belopp !== null
          ? `${row.belopp.toLocaleString("sv-SE")} kr`
          : "-";
      },
    },
    {
      key: "status",
      label: "Status",
      className: "text-center",
      render: (value, row) => {
        console.log("🚦 Status render - value:", value, "row:", row);
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

  if (showNyttUtlägg && favoritFörvalen) {
    return <BokforPage searchParams={Promise.resolve({})} />;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">🧾 Utlägg</h1>
          <Knapp text="+ Nytt utlägg" onClick={handleNyttUtlägg} />
        </div>

        <div className="bg-slate-700 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Alla utlägg</h2>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Laddar utlägg...</div>
          ) : utlägg.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>Inga utlägg hittades.</p>
              <p className="text-sm mt-2">
                Klicka på "Nytt utlägg" för att skapa ditt första utlägg.
              </p>
            </div>
          ) : (
            <Tabell
              data={utlägg}
              columns={columns}
              getRowId={(row) => {
                console.log("🆔 getRowId called with:", row);
                return row.id;
              }}
            />
          )}
        </div>

        <div className="bg-slate-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">ℹ️ Om utlägg</h3>
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
      </div>
    </MainLayout>
  );
}
