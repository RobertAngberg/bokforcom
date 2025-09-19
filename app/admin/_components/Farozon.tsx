"use client";

import Knapp from "../../_components/Knapp";
import Modal from "../../_components/Modal";
import type { FarozonProps } from "../_types/types";

export default function Farozon({ dangerZone }: FarozonProps) {
  const { showDeleteConfirm, isDeleting } = dangerZone.state;
  const { onDeleteCompany, onConfirm, onCancel } = dangerZone.handlers;

  return (
    <>
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
        <h2 className="text-xl text-red-400 mb-4 flex items-center gap-2">⚠️ Farlig zon</h2>
        <p className="text-gray-300 mb-4">
          Genom att radera företaget kommer all data att tas bort permanent.{" "}
          <strong className="text-red-400"> Detta kan inte ångras!</strong>
        </p>
        <Knapp
          text={isDeleting ? "Raderar..." : "Radera företag"}
          onClick={onConfirm}
          disabled={isDeleting}
          loading={isDeleting}
          loadingText="Raderar..."
          className="bg-red-600 hover:bg-red-700"
        />
      </div>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={onCancel}
        title="⚠️ Bekräfta radering"
        maxWidth="md"
        showCloseButton={!isDeleting}
        containerClassName="border border-red-500/30"
      >
        <div className="text-gray-300">
          <p className="mb-4">
            Är du säker på att du vill radera hela företagsprofilen? Detta kommer att:
          </p>
          <ul className="list-disc pl-5 text-gray-300 mb-4 space-y-1">
            <li>Radera alla fakturor och transaktioner</li>
            <li>Radera alla anställda och lönespecifikationer</li>
            <li>Radera alla utlägg och förval</li>
            <li>Radera företagsprofilen</li>
            <li>Radera ditt användarkonto</li>
            <li>Logga ut dig automatiskt</li>
          </ul>
          <p className="text-red-400 font-semibold mb-6">Detta kan inte ångras!</p>
          <div className="flex gap-3">
            <Knapp
              text="Avbryt"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-gray-200"
            />
            <Knapp
              text={isDeleting ? "Raderar..." : "Ja, radera allt"}
              onClick={onDeleteCompany}
              disabled={isDeleting}
              loading={isDeleting}
              loadingText="Raderar..."
              className="flex-1 bg-red-600 hover:bg-red-700"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
