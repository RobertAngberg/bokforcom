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
  beräknaSemesterpenningFörAnställd,
  justeraSemesterManuellt,
  SemesterSummary,
  SemesterRecord,
} from "../actions";

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
  const [beräknadPenning, setBeräknadPenning] = useState<number>(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

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

  // Hantera ESC-tangent för att avbryta redigering
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingField) {
        setEditingField(null);
        setEditValue("");
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [editingField]);

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
      const uttag = {
        anställd_id: anställd.id,
        datum: new Date().toISOString().split("T")[0],
        typ: "Betalda" as const,
        antal: parseFloat(semesteruttag.antal),
        från_datum: semesteruttag.startDatum,
        till_datum: semesteruttag.slutDatum || semesteruttag.startDatum,
        beskrivning:
          semesteruttag.beskrivning || `Semesteruttag ${anställd.förnamn} ${anställd.efternamn}`,
        lönespecifikation_id: undefined,
        bokfört: false,
      };

      const result = await registreraSemesteruttag(anställd.id, uttag);

      if (result.success) {
        // Visa framgångsmeddelande utan alert - mer subtilt
        console.log(`✅ ${result.message}`);
        setSemesteruttag({
          startDatum: "",
          slutDatum: "",
          antal: "",
          beskrivning: "",
        });

        // Uppdatera lokalt istället för att hämta all data igen
        if (summary) {
          setSummary((prev) =>
            prev
              ? {
                  ...prev,
                  betalda: prev.betalda + parseFloat(semesteruttag.antal),
                }
              : null
          );
        }

        // Lägg till i historik lokalt
        const nyttUttag: SemesterRecord = {
          id: Date.now(), // Temporärt ID
          anställd_id: anställd.id,
          datum: new Date().toISOString().split("T")[0],
          typ: "Betalda",
          antal: parseFloat(semesteruttag.antal),
          från_datum: semesteruttag.startDatum,
          till_datum: semesteruttag.slutDatum || semesteruttag.startDatum,
          beskrivning:
            semesteruttag.beskrivning || `Semesteruttag ${anställd.förnamn} ${anställd.efternamn}`,
          lönespecifikation_id: undefined,
          bokfört: false,
          skapad_av: userId,
        };

        setHistorik((prev) => [nyttUttag, ...prev]);
      }
    } catch (error) {
      console.error("Fel vid registrering av semesteruttag:", error);
      alert("❌ Kunde inte registrera semesteruttag");
    } finally {
      setLoading(false);
    }
  };

  // Beräkna penning för uttag när antal ändras
  useEffect(() => {
    if (semesteruttag.antal) {
      beräknaSemesterpenningFörAnställd(anställd.id, parseFloat(semesteruttag.antal))
        .then(setBeräknadPenning)
        .catch(() => setBeräknadPenning(0));
    } else {
      setBeräknadPenning(0);
    }
  }, [semesteruttag.antal, anställd.id]);

  // Hantera manuell redigering av semesterbox
  const handleEditField = (fieldName: string, currentValue: number) => {
    setEditingField(fieldName);
    setEditValue(currentValue.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingField || !editValue || !summary) return;

    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) {
      alert("Ogiltigt nummer");
      return;
    }

    const currentValue = summary[editingField as keyof SemesterSummary] as number;
    const difference = newValue - currentValue;

    if (difference === 0) {
      setEditingField(null);
      setEditValue("");
      return;
    }

    setLoading(true);
    try {
      // Mappa fältnamn till semestertyper
      const typeMapping: Record<
        string,
        "Intjänat" | "Betalda" | "Sparade" | "Skuld" | "Obetald" | "Ersättning"
      > = {
        intjänat: "Intjänat",
        betalda: "Betalda",
        sparade: "Sparade",
        skuld: "Skuld",
        obetald: "Obetald",
        ersättning: "Ersättning",
      };

      const semesterTyp = typeMapping[editingField];
      if (!semesterTyp) {
        throw new Error("Okänd semestertyp");
      }

      const result = await justeraSemesterManuellt(
        anställd.id,
        semesterTyp,
        difference,
        `Manuell redigering: ändrade från ${currentValue} till ${newValue}`
      );

      if (result.success) {
        // Uppdatera lokalt istället för att hämta all data igen
        setSummary((prev) =>
          prev
            ? {
                ...prev,
                [editingField]: newValue,
              }
            : null
        );

        // Visa framgångsmeddelande utan alert
        console.log(`✅ ${result.message}`);
      } else {
        alert(result.message);
      }

      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error("Fel vid sparande:", error);
      alert("❌ Kunde inte spara ändringen");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

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
    antal: Number(post.antal || 0).toFixed(2),
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
          <h3 className="text-xl font-semibold text-white mb-2">
            Semestersaldo - {anställd.förnamn} {anställd.efternamn}
          </h3>

          <p className="text-blue-300 mb-6">
            💡 <strong>Klicka på boxarna</strong> för att manuellt justera värden
          </p>

          <div className="grid grid-cols-6 gap-4">
            {/* Betalda dagar (tidigare "Uttagna") */}
            <div
              className="bg-red-900 p-4 rounded cursor-pointer hover:bg-red-800 transition-colors"
              onClick={() => handleEditField("betalda", summary.betalda)}
            >
              <div className="text-sm text-red-300">Betalda</div>
              {editingField === "betalda" ? (
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    className="w-16 px-1 py-0.5 text-sm bg-red-700 text-white rounded mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      className="text-green-400 text-3xl hover:text-green-300 cursor-pointer select-none"
                    >
                      ✓
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="text-red-400 text-3xl hover:text-red-300 cursor-pointer select-none"
                    >
                      ✕
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{summary.betalda.toFixed(1)}</div>
                  <div className="text-xs text-red-400">dagar</div>
                </>
              )}
            </div>

            {/* Sparade */}
            <div
              className="bg-purple-900 p-4 rounded cursor-pointer hover:bg-purple-800 transition-colors"
              onClick={() => handleEditField("sparade", summary.sparade)}
            >
              <div className="text-sm text-purple-300">Sparade</div>
              {editingField === "sparade" ? (
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    className="w-16 px-1 py-0.5 text-sm bg-purple-700 text-white rounded mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      className="text-green-400 text-3xl hover:text-green-300 cursor-pointer select-none"
                    >
                      ✓
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="text-red-400 text-3xl hover:text-red-300 cursor-pointer select-none"
                    >
                      ✕
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{summary.sparade.toFixed(1)}</div>
                  <div className="text-xs text-purple-400">dagar</div>
                </>
              )}
            </div>

            {/* Skuld (tidigare "Förskott") */}
            <div
              className="bg-yellow-900 p-4 rounded cursor-pointer hover:bg-yellow-800 transition-colors"
              onClick={() => handleEditField("skuld", summary.förskott)}
            >
              <div className="text-sm text-yellow-300">Skuld</div>
              {editingField === "skuld" ? (
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    className="w-16 px-1 py-0.5 text-sm bg-yellow-700 text-white rounded mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      className="text-green-400 text-3xl hover:text-green-300 cursor-pointer select-none"
                    >
                      ✓
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="text-red-400 text-3xl hover:text-red-300 cursor-pointer select-none"
                    >
                      ✕
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{summary.förskott.toFixed(1)}</div>
                  <div className="text-xs text-yellow-400">dagar</div>
                </>
              )}
            </div>

            {/* Obetald */}
            <div
              className="bg-orange-900 p-4 rounded cursor-pointer hover:bg-orange-800 transition-colors"
              onClick={() => handleEditField("obetald", summary.obetald)}
            >
              <div className="text-sm text-orange-300">Obetalda</div>
              {editingField === "obetald" ? (
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    className="w-16 px-1 py-0.5 text-sm bg-orange-700 text-white rounded mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      className="text-green-400 text-3xl hover:text-green-300 cursor-pointer select-none"
                    >
                      ✓
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="text-red-400 text-3xl hover:text-red-300 cursor-pointer select-none"
                    >
                      ✕
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{summary.obetald.toFixed(1)}</div>
                  <div className="text-xs text-orange-400">dagar</div>
                </>
              )}
            </div>

            {/* Ersättning */}
            <div
              className="bg-emerald-900 p-4 rounded cursor-pointer hover:bg-emerald-800 transition-colors"
              onClick={() => handleEditField("ersättning", summary.ersättning)}
            >
              <div className="text-sm text-emerald-300">Kompdagar</div>
              {editingField === "ersättning" ? (
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    className="w-16 px-1 py-0.5 text-sm bg-emerald-700 text-white rounded mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      className="text-green-400 text-3xl hover:text-green-300 cursor-pointer select-none"
                    >
                      ✓
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="text-red-400 text-3xl hover:text-red-300 cursor-pointer select-none"
                    >
                      ✕
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(summary.ersättning).toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-400">kr</div>
                </>
              )}
            </div>

            {/* Intjänade (flyttad sist) */}
            <div
              className="bg-green-900 p-4 rounded cursor-pointer hover:bg-green-800 transition-colors"
              onClick={() => handleEditField("intjänat", summary.intjänat)}
            >
              <div className="text-sm text-green-300">Intjänade</div>
              {editingField === "intjänat" ? (
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    className="w-16 px-1 py-0.5 text-sm bg-green-700 text-white rounded mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      className="text-green-400 text-3xl hover:text-green-300 cursor-pointer select-none"
                    >
                      ✓
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="text-red-400 text-3xl hover:text-red-300 cursor-pointer select-none"
                    >
                      ✕
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{summary.intjänat.toFixed(1)}</div>
                  <div className="text-xs text-green-400">dagar</div>
                </>
              )}
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
          {beräknadPenning > 0 && (
            <div className="bg-slate-700 p-4 rounded mb-4">
              <h4 className="font-semibold text-white mb-2">Beräknad semesterpenning</h4>
              <div className="text-center">
                <div className="text-sm text-slate-300">
                  Totalt belopp (inkl. semesterersättning)
                </div>
                <div className="font-bold text-green-400 text-xl">
                  {beräknadPenning.toLocaleString("sv-SE")} kr
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
