//#region Huvud
"use client";

import Knapp from "../../../../_components/Knapp";
import Toast from "../../../../_components/Toast";
import ExporteraPDFKnapp from "./ExporteraPDFKnapp";
import SkickaEpost from "./SkickaEpost";
import BokforFakturaModal from "./BokforFakturaModal";
import RotRutBetalningModal from "./RotRutBetalningModal";
import { useAlternativ } from "../../hooks/useAlternativ";
import { AlternativProps } from "../types/types";

export default function Alternativ({ onReload, onPreview }: AlternativProps) {
  const {
    // State
    bokförModalOpen,
    rotRutModalOpen,
    sparaLoading,
    bokförLoading,
    bokföringsmetod,
    toast,
    formData,

    // Computed values
    kanSpara,
    ärFakturanBetald,
    doljBokförKnapp,
    sparaKnappText,
    bokförKnappText,
    återställKnappText,
    granskKnappText,
    pdfKnappText,
    ärROTRUTFaktura,
    husFilKnappText,
    harPersonnummer,
    fakturaStatus,

    // Actions
    setBokförModalOpen,
    setRotRutModalOpen,
    setToast,
    hanteraSpara,
    hanteraBokför,
    hanteraHUSFil,
    hanteraRotRutStatusChange,
    hanteraRotRutBetalning,
    hanteraRotRutSuccess,
    getDisabledReason,
  } = useAlternativ();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <Knapp
          onClick={() => {
            console.log("🔍 Spara-knapp klickad!", {
              kanSpara,
              sparaLoading,
              disabled: !kanSpara || sparaLoading,
            });
            hanteraSpara();
          }}
          text={sparaKnappText}
          disabled={!kanSpara || sparaLoading}
          className="flex-1 min-w-40"
        />
        <Knapp
          onClick={onPreview}
          text={granskKnappText}
          disabled={!kanSpara}
          className="flex-1 min-w-40"
        />
        <div className="flex-1 min-w-40">
          <ExporteraPDFKnapp disabled={!kanSpara} text={pdfKnappText} className="w-full" />
        </div>
        <Knapp
          onClick={onReload}
          text={återställKnappText}
          disabled={ärFakturanBetald}
          className="flex-1 min-w-40"
        />
        {!doljBokförKnapp && (
          <Knapp
            onClick={hanteraBokför}
            text={bokförKnappText}
            disabled={ärFakturanBetald || !kanSpara || bokförLoading}
            className="flex-1 min-w-40"
          />
        )}
      </div>

      {/* Hjälptext när knappar är disabled - flytta nedanför */}
      {!kanSpara && (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
          <p className="text-slate-300 text-sm font-medium">⚠️ {getDisabledReason()}</p>
        </div>
      )}

      {/* HUS-fil knapp på egen rad */}
      {ärROTRUTFaktura && (
        <div className="flex flex-col items-center gap-2">
          {/* Hjälptext för HUS-fil när disabled */}
          {(!kanSpara || !harPersonnummer || !formData.fakturanummer) && (
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-2">
              <p className="text-slate-300 text-sm">
                ⚠️{" "}
                {!kanSpara
                  ? getDisabledReason()
                  : !harPersonnummer
                    ? "Personnummer saknas för HUS-fil"
                    : "Spara fakturan först"}
              </p>
            </div>
          )}

          <div className="flex justify-center items-center gap-4">
            <Knapp
              onClick={hanteraHUSFil}
              text={husFilKnappText}
              disabled={!kanSpara || !harPersonnummer || !formData.fakturanummer}
              className=""
            />
            {formData.id && (
              <div className="flex flex-row gap-3 items-center">
                <select
                  value={fakturaStatus.rot_rut_status || ""}
                  onChange={hanteraRotRutStatusChange}
                  className="px-3 py-2 rounded text-sm font-medium bg-slate-700 text-white border border-slate-600 hover:bg-slate-600 transition-colors"
                >
                  <option value="" disabled>
                    ROT/RUT-status
                  </option>
                  <option value="ej_inskickad">📄 Ej inskickad till SKV</option>
                  <option value="väntar">⏳ Väntar på SKV</option>
                  <option value="godkänd">✅ Godkänd av SKV</option>
                </select>

                {(fakturaStatus.rot_rut_status === "väntar" ||
                  fakturaStatus.status_betalning === "Delvis betald") && (
                  <button
                    onClick={hanteraRotRutBetalning}
                    className="px-3 py-2 rounded text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                  >
                    💰 Registrera utbetalning från SKV
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <SkickaEpost
        onSuccess={() => console.log("E-post skickad")}
        onError={(err) => console.error("E-postfel:", err)}
      />

      <BokforFakturaModal isOpen={bokförModalOpen} onClose={() => setBokförModalOpen(false)} />

      <RotRutBetalningModal
        isOpen={rotRutModalOpen}
        onClose={() => setRotRutModalOpen(false)}
        fakturaId={formData.id ? parseInt(formData.id) : 0}
        fakturanummer={formData.fakturanummer || ""}
        kundnamn={formData.kundnamn || ""}
        totalBelopp={
          formData.artiklar?.reduce(
            (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
            0
          ) || 0
        }
        bokföringsmetod={bokföringsmetod}
        onSuccess={hanteraRotRutSuccess}
      />

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}
    </div>
  );
}
