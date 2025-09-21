"use client";

import InfoTooltip from "../../../../_components/InfoTooltip";
import Knapp from "../../../../_components/Knapp";
import Tabell from "../../../../_components/Tabell";
import Toast from "../../../../_components/Toast";
import { ColumnDefinition } from "../../../../_components/TabellRad";
import BokforModal from "./BokforModal";
import { useSemester } from "../../../hooks/useSemester";
import type { ModernSemesterProps } from "../../../types/types";

export default function ModernSemester({ anställd, userId }: ModernSemesterProps) {
  const semesterHook = useSemester({
    anställdId: anställd.id,
    anställdKompensation: anställd.kompensation,
    userId,
  });

  const {
    showBokforKnapp,
    summary,
    editingField,
    editValue,
    loading,
    bokforModalOpen,
    bokforRows,
    toast,
    handleEditField,
    handleSaveEdit,
    handleCancelEdit,
    handleOpenBokforModal,
    handleConfirmBokfor,
    setEditValue,
    setBokforModalOpen,
    clearToast,
  } = semesterHook;

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
      {toast && <Toast type={toast.type} message={toast.message} onClose={clearToast} />}
    </div>
  );
}
