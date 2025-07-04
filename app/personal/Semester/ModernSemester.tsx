/**
 * Modern semesterkomponent som använder befintlig semester-tabell
 * Fullt integrerad med din databasstruktur
 */

"use client";

import { useState, useEffect } from "react";
import TextFält from "../../_components/TextFält";
import InfoTooltip from "../../_components/InfoTooltip";
import Knapp from "../../_components/Knapp";
import Tabell from "../../_components/Tabell";
import { ColumnDefinition } from "../../_components/TabellRad";
import {
  hämtaSemesterSammanställning,
  registreraSemesteruttag,
  hämtaSemesterHistorik,
  beräknaSemesterpenning,
  SemesterSummary,
  SemesterRecord,
} from "./semesterDatabase";

interface ModernSemesterProps {
  anställd: {
    id: number;
    förnamn: string;
    efternamn: string;
    kompensation: number;
    anställningsdatum: string;
    tjänstegrad?: number;
  };
  userId: number;
}

export default function ModernSemester({ anställd, userId }: ModernSemesterProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SemesterSummary | null>(null);
  const [historik, setHistorik] = useState<SemesterRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"översikt" | "uttag" | "historik">("översikt");

  const [semesteruttag, setSemesteruttag] = useState({
    startDatum: "",
    slutDatum: "",
    antal: "",
    beskrivning: "",
  });

  // Hämta data vid laddning
  useEffect(() => {
    hämtaData();
  }, [anställd.id]);

  const hämtaData = async () => {
    setLoading(true);
    try {
      const [summaryData, historikData] = await Promise.all([
        hämtaSemesterSammanställning(anställd.id),
        hämtaSemesterHistorik(anställd.id),
      ]);

      setSummary(summaryData);
      setHistorik(historikData);
    } catch (error) {
      console.error("Fel vid hämtning av semesterdata:", error);
      alert("❌ Kunde inte hämta semesterdata");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistreraUttag = async () => {
    if (!semesteruttag.startDatum || !semesteruttag.antal) {
      alert("Fyll i startdatum och antal dagar");
      return;
    }

    setLoading(true);
    try {
      const result = await registreraSemesteruttag(
        anställd.id,
        semesteruttag.startDatum,
        semesteruttag.slutDatum || semesteruttag.startDatum,
        parseFloat(semesteruttag.antal),
        semesteruttag.beskrivning || `Semesteruttag ${anställd.förnamn} ${anställd.efternamn}`,
        null, // lönespecifikation_id
        userId
      );

      if (result.success) {
        alert(`✅ ${result.message}`);
        setSemesteruttag({
          startDatum: "",
          slutDatum: "",
          antal: "",
          beskrivning: "",
        });
        await hämtaData(); // Uppdatera data
      }
    } catch (error) {
      console.error("Fel vid registrering av semesteruttag:", error);
      alert("❌ Kunde inte registrera semesteruttag");
    } finally {
      setLoading(false);
    }
  };

  // Beräkna penning för uttag
  const beräknadPenning = semesteruttag.antal
    ? beräknaSemesterpenning(anställd.kompensation, parseFloat(semesteruttag.antal))
    : null;

  // Kolumndefinitioner för historik
  const kolumner: ColumnDefinition<any>[] = [
    { key: "datum", label: "Datum" },
    { key: "typ", label: "Typ" },
    { key: "antal", label: "Antal dagar" },
    { key: "från_datum", label: "Från" },
    { key: "till_datum", label: "Till" },
    { key: "beskrivning", label: "Beskrivning" },
    { key: "bokfört", label: "Status" },
  ];

  // Formatera data för tabell
  const historikData = historik.map((post) => ({
    id: post.id,
    datum: new Date(post.datum).toLocaleDateString("sv-SE"),
    typ: post.typ,
    antal: post.antal.toFixed(2),
    från_datum: post.från_datum ? new Date(post.från_datum).toLocaleDateString("sv-SE") : "-",
    till_datum: post.till_datum ? new Date(post.till_datum).toLocaleDateString("sv-SE") : "-",
    beskrivning: post.beskrivning || "-",
    bokfört: post.bokfört ? "✅ Bokförd" : "⏳ Ej bokförd",
  }));

  if (loading) {
    return <div className="text-white">Laddar semesterdata...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex gap-2">
          {["översikt", "uttag", "historik"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Översikt */}
      {activeTab === "översikt" && summary && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">
            Semesteröversikt - {anställd.förnamn} {anställd.efternamn}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-green-900 p-4 rounded">
              <div className="text-sm text-green-300">Intjänat totalt</div>
              <div className="text-2xl font-bold text-white">{summary.intjänat.toFixed(1)}</div>
              <div className="text-xs text-green-400">dagar</div>
            </div>

            <div className="bg-blue-900 p-4 rounded">
              <div className="text-sm text-blue-300">Kvarvarande</div>
              <div className="text-2xl font-bold text-white">{summary.kvarvarande.toFixed(1)}</div>
              <div className="text-xs text-blue-400">dagar</div>
            </div>

            <div className="bg-purple-900 p-4 rounded">
              <div className="text-sm text-purple-300">Sparade</div>
              <div className="text-2xl font-bold text-white">{summary.sparade.toFixed(1)}</div>
              <div className="text-xs text-purple-400">dagar</div>
            </div>

            <div className="bg-yellow-900 p-4 rounded">
              <div className="text-sm text-yellow-300">Förskott</div>
              <div className="text-2xl font-bold text-white">{summary.förskott.toFixed(1)}</div>
              <div className="text-xs text-yellow-400">dagar</div>
            </div>

            <div className="bg-red-900 p-4 rounded">
              <div className="text-sm text-red-300">Uttagna</div>
              <div className="text-2xl font-bold text-white">{summary.betalda.toFixed(1)}</div>
              <div className="text-xs text-red-400">dagar</div>
            </div>

            <div className="bg-emerald-900 p-4 rounded">
              <div className="text-sm text-emerald-300">Tillgängligt</div>
              <div className="text-2xl font-bold text-white">{summary.tillgängligt.toFixed(1)}</div>
              <div className="text-xs text-emerald-400">dagar</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-700 rounded">
            <h4 className="font-semibold text-white mb-2">Information</h4>
            <div className="text-sm text-slate-300 space-y-1">
              <p>
                • <strong>Månadslön:</strong> {anställd.kompensation.toLocaleString("sv-SE")} kr
              </p>
              <p>
                • <strong>Anställd sedan:</strong>{" "}
                {new Date(anställd.anställningsdatum).toLocaleDateString("sv-SE")}
              </p>
              <p>
                • <strong>Tjänstegrad:</strong> {anställd.tjänstegrad || 100}%
              </p>
              <p>
                • <strong>Intjäning per månad:</strong> ~2,08 dagar (baserat på 25 dagar/år)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Semesteruttag */}
      {activeTab === "uttag" && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">Registrera semesteruttag</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <TextFält
              label="Startdatum"
              name="startDatum"
              type="date"
              value={semesteruttag.startDatum}
              onChange={(e) =>
                setSemesteruttag((prev) => ({ ...prev, startDatum: e.target.value }))
              }
            />

            <TextFält
              label="Slutdatum (valfritt)"
              name="slutDatum"
              type="date"
              value={semesteruttag.slutDatum}
              onChange={(e) => setSemesteruttag((prev) => ({ ...prev, slutDatum: e.target.value }))}
            />

            <TextFält
              label="Antal dagar"
              name="antal"
              type="number"
              value={semesteruttag.antal}
              onChange={(e) => setSemesteruttag((prev) => ({ ...prev, antal: e.target.value }))}
            />

            <TextFält
              label="Beskrivning"
              name="beskrivning"
              value={semesteruttag.beskrivning}
              onChange={(e) =>
                setSemesteruttag((prev) => ({ ...prev, beskrivning: e.target.value }))
              }
            />
          </div>

          {/* Beräkningar */}
          {beräknadPenning && (
            <div className="bg-slate-700 p-4 rounded mb-4">
              <h4 className="font-semibold text-white mb-2">Beräknad semesterpenning</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-slate-300">Semesterlön (0,43%)</div>
                  <div className="font-bold text-white">
                    {beräknadPenning.semesterlön.toLocaleString("sv-SE")} kr
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Semesterersättning (12%)</div>
                  <div className="font-bold text-white">
                    {beräknadPenning.semesterersättning.toLocaleString("sv-SE")} kr
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Totalt belopp</div>
                  <div className="font-bold text-green-400">
                    {beräknadPenning.totalt.toLocaleString("sv-SE")} kr
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validering */}
          {summary && semesteruttag.antal && (
            <div className="mb-4">
              {parseFloat(semesteruttag.antal) <= summary.tillgängligt ? (
                <div className="p-3 bg-green-900 text-green-300 rounded">
                  ✅ Semesteruttag kan genomföras med tillgängliga dagar
                </div>
              ) : (
                <div className="p-3 bg-yellow-900 text-yellow-300 rounded">
                  ⚠️ Uttaget överskrider tillgängliga dagar ({summary.tillgängligt.toFixed(1)}).
                  {parseFloat(semesteruttag.antal) - summary.tillgängligt > 0 && (
                    <>
                      {" "}
                      Förskott:{" "}
                      {(parseFloat(semesteruttag.antal) - summary.tillgängligt).toFixed(1)} dagar
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <Knapp
            text="Registrera semesteruttag"
            onClick={handleRegistreraUttag}
            disabled={loading || !semesteruttag.startDatum || !semesteruttag.antal}
          />
        </div>
      )}

      {/* Historik */}
      {activeTab === "historik" && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">Semesterhistorik</h3>

          <Tabell data={historikData} columns={kolumner} getRowId={(item) => item.id || 0} />

          {historikData.length === 0 && (
            <div className="text-center text-slate-400 py-8">
              Ingen semesterhistorik registrerad
            </div>
          )}
        </div>
      )}
    </div>
  );
}
