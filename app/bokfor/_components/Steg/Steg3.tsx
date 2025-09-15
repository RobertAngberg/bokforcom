"use client";

import React from "react";
import AnstalldDropdown from "../AnstalldDropdown";
import Knapp from "../../../_components/Knapp";
import TillbakaPil from "../../../_components/TillbakaPil";
import Toast from "../../../_components/Toast";
import Tabell from "../../../_components/Tabell";
import { formatCurrency } from "../../../_utils/format";
import { dateTillÅÅÅÅMMDD, ÅÅÅÅMMDDTillDate } from "../../../_utils/trueDatum";
import { useSteg3 } from "../../_hooks/useSteg3";

export default function Steg3() {
  // Hämta ALL data från useSteg3 hook
  const {
    currentStep,
    belopp,
    kommentar,
    kontonummer,
    kontobeskrivning,
    fil,
    transaktionsdatum,
    valtFörval,
    extrafält,
    leverantör,
    fakturanummer,
    fakturadatum,
    förfallodatum,
    betaldatum,
    bokförSomFaktura,
    kundfakturadatum,
    levfaktMode,
    utlaggMode,
    setCurrentStep,
    anstallda,
    anstalldId,
    setAnstalldId,
    loading,
    toast,
    hideToast,
    momsSats,
    moms,
    beloppUtanMoms,
    ärFörsäljning,
    handleButtonClick,
    fallbackRows,
    totalDebet,
    totalKredit,
  } = useSteg3();

  // Visa bara på steg 3
  if (currentStep !== 3) return null;

  return (
    <div className="relative">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <TillbakaPil onClick={() => setCurrentStep?.(2)} />

      <h1 className="text-3xl mb-4 text-center">
        {utlaggMode
          ? "Steg 3: Kontrollera och slutför utlägg"
          : levfaktMode
            ? ärFörsäljning
              ? "Steg 3: Kundfaktura - Kontrollera och slutför"
              : "Steg 3: Leverantörsfaktura - Kontrollera och slutför"
            : "Steg 3: Kontrollera och slutför"}
      </h1>
      <p className="text-center font-bold text-xl mb-1">{valtFörval ? valtFörval.namn : ""}</p>
      <p className="text-center text-gray-300 mb-6">
        {transaktionsdatum ? dateTillÅÅÅÅMMDD(ÅÅÅÅMMDDTillDate(transaktionsdatum)) : ""}
      </p>
      {levfaktMode && leverantör && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center bg-slate-800 border border-slate-600 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm mr-2">Leverantör:</span>
            <span className="text-white font-medium">{leverantör.namn}</span>
            {leverantör.organisationsnummer && (
              <span className="text-gray-400 text-sm ml-2">({leverantör.organisationsnummer})</span>
            )}
          </div>
        </div>
      )}
      {levfaktMode && ärFörsäljning && (
        <div className="mb-6 flex items-center px-4 py-3 bg-green-900 text-green-100 rounded-lg text-base">
          <span className="mr-3 flex items-center justify-center w-7 h-7 rounded-full bg-green-700 text-white text-lg font-bold">
            💰
          </span>
          <div className="flex-1 text-center">
            <strong>Kundfaktura bokförs som fordran (1510).</strong>
            <br />
            När kunden betalar fakturan kommer fordran att kvittas mot ditt företagskonto.
          </div>
        </div>
      )}

      <form id="bokforingForm" className="space-y-6">
        {/* Display tabell med transaktioner */}
        <Tabell
          data={fallbackRows}
          columns={[
            {
              key: "konto",
              label: "Konto",
              render: (value, row) => row.konto,
            },
            {
              key: "debet",
              label: "Debet",
              className: "text-right",
              render: (value, row) => (row.debet > 0 ? formatCurrency(row.debet) : ""),
            },
            {
              key: "kredit",
              label: "Kredit",
              className: "text-right",
              render: (value, row) => (row.kredit > 0 ? formatCurrency(row.kredit) : ""),
            },
          ]}
          getRowId={(row) => row.key}
        />

        {/* Utlägg: Visa anställd-dropdown */}
        {utlaggMode && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Anställd för utlägg</h3>
            <AnstalldDropdown anstallda={anstallda} value={anstalldId} onChange={setAnstalldId} />
          </div>
        )}

        {/* Knapp för att slutföra */}
        <div className="flex justify-center">
          <Knapp
            text={
              loading
                ? "Bokför..."
                : utlaggMode
                  ? "Slutför utlägg"
                  : levfaktMode
                    ? ärFörsäljning
                      ? "Slutför kundfaktura"
                      : "Slutför leverantörsfaktura"
                    : "Bokför"
            }
            onClick={handleButtonClick}
            disabled={loading}
            className="px-8 py-4 text-xl"
          />
        </div>
      </form>
    </div>
  );
}
