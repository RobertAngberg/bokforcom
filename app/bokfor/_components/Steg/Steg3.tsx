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
  const { state, actions, handlers } = useSteg3();

  // Visa bara på steg 3
  if (state.currentStep !== 3) return null;

  return (
    <div className="relative">
      <Toast
        message={state.toast.message}
        type={state.toast.type}
        isVisible={state.toast.isVisible}
        onClose={handlers.hideToast}
      />

      <TillbakaPil onClick={() => actions.setCurrentStep?.(2)} />

      <h1 className="text-3xl mb-4 text-center">
        {state.utlaggMode
          ? "Steg 3: Kontrollera och slutför utlägg"
          : state.levfaktMode
            ? state.ärFörsäljning
              ? "Steg 3: Kundfaktura - Kontrollera och slutför"
              : "Steg 3: Leverantörsfaktura - Kontrollera och slutför"
            : "Steg 3: Kontrollera och slutför"}
      </h1>
      <p className="text-center font-bold text-xl mb-1">
        {state.valtFörval ? state.valtFörval.namn : ""}
      </p>
      <p className="text-center text-gray-300 mb-6">
        {state.transaktionsdatum ? dateTillÅÅÅÅMMDD(ÅÅÅÅMMDDTillDate(state.transaktionsdatum)) : ""}
      </p>
      {state.levfaktMode && state.leverantör && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center bg-slate-800 border border-slate-600 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm mr-2">Leverantör:</span>
            <span className="text-white font-medium">{state.leverantör.namn}</span>
            {state.leverantör.organisationsnummer && (
              <span className="text-gray-400 text-sm ml-2">
                ({state.leverantör.organisationsnummer})
              </span>
            )}
          </div>
        </div>
      )}
      {state.levfaktMode && state.ärFörsäljning && (
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
          data={state.fallbackRows}
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
          getRowId={(row) => `${row.konto}-${row.debet}-${row.kredit}`}
        />

        {/* Utlägg: Visa anställd-dropdown */}
        {state.utlaggMode && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Anställd för utlägg</h3>
            <AnstalldDropdown
              anstallda={state.anstallda}
              value={state.anstalldId}
              onChange={actions.setAnstalldId}
            />
          </div>
        )}

        {/* Knapp för att slutföra */}
        <div className="flex justify-center">
          <Knapp
            text={
              state.loading
                ? "Bokför..."
                : state.utlaggMode
                  ? "Slutför utlägg"
                  : state.levfaktMode
                    ? state.ärFörsäljning
                      ? "Slutför kundfaktura"
                      : "Slutför leverantörsfaktura"
                    : "Bokför"
            }
            onClick={handlers.handleButtonClick}
            disabled={state.loading}
            className="px-8 py-4 text-xl"
          />
        </div>
      </form>
    </div>
  );
}
