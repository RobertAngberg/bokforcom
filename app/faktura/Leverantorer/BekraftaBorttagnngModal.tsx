"use client";

import Modal from "../../_components/Modal";
import Knapp from "../../_components/Knapp";

interface BekraftaBorttagnngModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leverantorNamn: string;
  loading?: boolean;
}

export default function BekraftaBorttagnngModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  leverantorNamn,
  loading = false 
}: BekraftaBorttagnngModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bekräfta borttagning" maxWidth="md">
      <div className="p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-white mb-2">
            Är du säker på att du vill ta bort leverantören?
          </h3>
          <p className="text-gray-300 mb-6">
            <strong>{leverantorNamn}</strong> kommer att tas bort permanent. 
            Denna åtgärd kan inte ångras.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Knapp
            text="Avbryt"
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700"
          />
          <Knapp
            text={loading ? "Tar bort..." : "Ta bort leverantör"}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          />
        </div>
      </div>
    </Modal>
  );
}
