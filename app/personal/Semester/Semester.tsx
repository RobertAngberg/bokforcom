"use client";

import { useState, useEffect } from "react";
import InfoTooltip from "../../_components/InfoTooltip";
import Knapp from "../../_components/Knapp";
import Tabell from "../../_components/Tabell";
import { ColumnDefinition } from "../../_components/TabellRad";
import {
  hämtaSemesterTransaktioner,
  sparaSemesterTransaktion,
  uppdateraSemesterdata,
} from "../actions";
import BokforModal from "./BokforModal";

type SemesterBoxField = "betalda_dagar" | "sparade_dagar" | "skuld" | "komp_dagar";

type SemesterBoxSummary = {
  betalda_dagar: number;
  sparade_dagar: number;
  skuld: number;
  komp_dagar: number;
};

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
  // State för att styra om knappen ska visas
  const [showBokforKnapp, setShowBokforKnapp] = useState(false);
  const [summary, setSummary] = useState<SemesterBoxSummary>({
    betalda_dagar: 0,
    sparade_dagar: 0,
    skuld: 0,
    komp_dagar: 0,
  });
  const [editingField, setEditingField] = useState<SemesterBoxField | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  // Remove originalSummary, not needed
  const [loading, setLoading] = useState(false);
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
  const [bokforRows, setBokforRows] = useState<any[]>([]);

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
      const transaktioner = await hämtaSemesterTransaktioner(anställd.id);
      // Summera kolumner direkt
      // Förväntar oss EN rad per anställd
      const t = transaktioner[0] || {};
      setSummary({
        betalda_dagar: Number(t.betalda_dagar) || 0,
        sparade_dagar: Number(t.sparade_dagar) || 0,
        skuld: Number(t.skuld) || 0,
        komp_dagar: Number(t.komp_dagar) || 0,
      });
      setShowBokforKnapp(t.bokförd === false);
    } catch (error) {
      console.error("Fel vid hämtning av semesterdata:", error);
      alert("❌ Kunde inte hämta semesterdata");
    } finally {
      setLoading(false);
    }
  };

  // Hantera manuell redigering av semesterbox
  const handleEditField = (fieldName: SemesterBoxField, currentValue: number) => {
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
    setLoading(true);
    try {
      // Skicka kolumnnamn och nytt värde direkt
      if (newValue !== summary[editingField]) {
        await sparaSemesterTransaktion({
          anställdId: anställd.id,
          kolumn: editingField, // "betalda_dagar", "sparade_dagar", "skuld", "komp_dagar"
          nyttVärde: newValue,
        });
      }
      setEditingField(null);
      setEditValue("");
      await hämtaData(); // Hämta om data från servern
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

  // Funktion för att räkna ut och visa bokföringsrader enligt Bokio
  const handleOpenBokforModal = () => {
    let rows;
    if (summary.komp_dagar > 0) {
      // Bokför komp_dagar som kronor
      const kompBelopp = summary.komp_dagar;
      const socialaAvgifter = kompBelopp * 0.314;
      rows = [
        {
          konto: "2920",
          namn: "Upplupna semesterlöner",
          debet: 0,
          kredit: kompBelopp,
        },
        {
          konto: "2940",
          namn: "Upplupna lagstadgade sociala och andra avgifter",
          debet: 0,
          kredit: socialaAvgifter,
        },
        {
          konto: "7290",
          namn: "Förändring av semesterlöneskuld",
          debet: kompBelopp,
          kredit: 0,
        },
        {
          konto: "7519",
          namn: "Sociala avgifter för semester- och löneskulder",
          debet: socialaAvgifter,
          kredit: 0,
        },
      ];
    } else {
      // Standard: betalda + sparade dagar
      const dagar = summary.betalda_dagar + summary.sparade_dagar;
      const dagslön = anställd.kompensation / 21;
      const semesterlönPerDag = dagslön * 1.0545;
      const semesterlön = dagar * semesterlönPerDag;
      const socialaAvgifter = semesterlön * 0.314;
      rows = [
        {
          konto: "2920",
          namn: "Upplupna semesterlöner",
          debet: 0,
          kredit: semesterlön,
        },
        {
          konto: "2940",
          namn: "Upplupna lagstadgade sociala och andra avgifter",
          debet: 0,
          kredit: socialaAvgifter,
        },
        {
          konto: "7290",
          namn: "Förändring av semesterlöneskuld",
          debet: semesterlön,
          kredit: 0,
        },
        {
          konto: "7519",
          namn: "Sociala avgifter för semester- och löneskulder",
          debet: socialaAvgifter,
          kredit: 0,
        },
      ];
    }
    setBokforRows(rows);
    setBokforModalOpen(true);
  };

  const handleConfirmBokfor = async (kommentar: string) => {
    setLoading(true);
    try {
      // Mappa om bokforRows till rätt format för bokförSemester
      const rader = bokforRows.map((row) => ({
        kontobeskrivning: `${row.konto} ${row.namn}`,
        belopp: row.debet !== 0 ? row.debet : -row.kredit, // Debet positivt, Kredit negativt
      }));
      const res = await (
        await import("../actions")
      ).bokförSemester({
        userId,
        rader,
        kommentar,
        datum: new Date().toISOString(),
      });
      setBokforModalOpen(false);
      if (res?.success) {
        alert("Bokföring sparad!");
        await hämtaData();
      } else {
        alert("Fel vid bokföring: " + (res?.error || "Okänt fel"));
      }
    } catch (error) {
      alert("Fel vid bokföring: " + (error instanceof Error ? error.message : error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Laddar semesterdata...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-2">
          Semestersaldo - {anställd.förnamn} {anställd.efternamn}
        </h3>
        <p className="text-blue-300 mb-6">
          💡 <strong>Klicka på boxarna</strong> för att manuellt justera värden
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Betalda dagar */}
          <div
            className="bg-red-900 p-4 rounded cursor-pointer hover:bg-red-800 transition-colors relative"
            onClick={() => handleEditField("betalda_dagar", summary.betalda_dagar)}
          >
            <div className="absolute top-2 right-2 z-10">
              <InfoTooltip text="Tillgängliga betalda semesterdagar" />
            </div>
            <div className="text-sm text-red-300">Betalda</div>
            {editingField === "betalda_dagar" ? (
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
                  className="w-full text-center text-2xl font-bold text-white bg-red-700 rounded px-2 py-2 mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Knapp
                    text="💾 Spara"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleSaveEdit();
                    }}
                    className="text-sm px-2 py-0.5 min-w-0"
                  />
                  <Knapp
                    text="❌ Avbryt"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="text-sm px-2 py-0.5 min-w-0"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {summary.betalda_dagar.toFixed(1)}
                </div>
                <div className="text-xs text-red-400">dagar</div>
              </>
            )}
          </div>
          {/* Sparade dagar */}
          <div
            className="bg-purple-900 p-4 rounded cursor-pointer hover:bg-purple-800 transition-colors relative"
            onClick={() => handleEditField("sparade_dagar", summary.sparade_dagar)}
          >
            <div className="absolute top-2 right-2 z-10">
              <InfoTooltip text="Sparade och oanvända betalda semesterdagar från föregående år" />
            </div>
            <div className="text-sm text-purple-300">Sparade</div>
            {editingField === "sparade_dagar" ? (
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
                  className="w-full text-center text-2xl font-bold text-white bg-purple-700 rounded px-2 py-2 mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Knapp
                    text="💾 Spara"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleSaveEdit();
                    }}
                    className="text-sm px-2 py-0.5 min-w-0"
                  />
                  <Knapp
                    text="❌ Avbryt"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="text-sm px-2 py-0.5 min-w-0"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {summary.sparade_dagar.toFixed(1)}
                </div>
                <div className="text-xs text-purple-400">dagar</div>
              </>
            )}
          </div>
          {/* Skuld */}
          <div
            className="bg-yellow-900 p-4 rounded cursor-pointer hover:bg-yellow-800 transition-colors relative"
            onClick={() => handleEditField("skuld", summary.skuld)}
          >
            <div className="absolute top-2 right-2 z-10">
              <InfoTooltip text="Betalda semesterdagar som givits i förskott" />
            </div>
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
                  className="w-full text-center text-2xl font-bold text-white bg-yellow-700 rounded px-2 py-2 mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Knapp
                    text="💾 Spara"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleSaveEdit();
                    }}
                    className="text-sm px-2 py-0.5 min-w-0"
                  />
                  <Knapp
                    text="❌ Avbryt"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="text-sm px-2 py-0.5 min-w-0"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{summary.skuld.toFixed(1)}</div>
                <div className="text-xs text-yellow-400">dagar</div>
              </>
            )}
          </div>
          {/* Komp */}
          <div
            className="bg-emerald-900 p-4 rounded cursor-pointer hover:bg-emerald-800 transition-colors relative"
            onClick={() => handleEditField("komp_dagar", summary.komp_dagar)}
          >
            <div className="absolute top-2 right-2 z-10">
              <InfoTooltip text="Kompensation i kronor för outnyttjad semester/tid" />
            </div>
            <div className="text-sm text-emerald-300">Komp</div>
            {editingField === "komp_dagar" ? (
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
                  className="w-full text-center text-2xl font-bold text-white bg-emerald-700 rounded px-2 py-2 mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Knapp
                    text="💾 Spara"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleSaveEdit();
                    }}
                    className="text-sm px-2 py-0.5 min-w-0"
                  />
                  <Knapp
                    text="❌ Avbryt"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="text-sm px-2 py-0.5 min-w-0"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{summary.komp_dagar.toFixed(2)}</div>
                <div className="text-xs text-emerald-400">kr</div>
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
        {showBokforKnapp && (
          <div className="mt-6 flex justify-end">
            <Knapp text="Bokför transaktioner" onClick={handleOpenBokforModal} />
          </div>
        )}
        <BokforModal
          open={bokforModalOpen}
          onClose={() => setBokforModalOpen(false)}
          rows={bokforRows}
          onConfirm={handleConfirmBokfor}
        />
      </div>
    </div>
  );
}
