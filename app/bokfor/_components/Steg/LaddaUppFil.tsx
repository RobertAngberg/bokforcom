"use client";

import Toast from "../../../_components/Toast";
import { FileUploadProps } from "../../_types/types";
import { useLaddaUppFil } from "../../_hooks/useLaddaUppFil";

export default function LaddaUppFil(props: FileUploadProps) {
  const { isLoading, timeoutTriggered, toast, setToast, handleFileChange } = useLaddaUppFil(props);

  // Determine if this is leverantörsfaktura mode
  const isLevfaktMode = !!(
    props.setLeverantör &&
    props.setFakturadatum &&
    props.setFörfallodatum &&
    props.setFakturanummer
  );

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <input
        type="file"
        id="fileUpload"
        accept="application/pdf,image/png,image/jpeg"
        onChange={handleFileChange}
        required
        style={{ display: "none" }}
        autoFocus
      />
      <label
        htmlFor="fileUpload"
        className="flex items-center justify-center px-4 py-2 mb-6 font-bold text-white rounded cursor-pointer bg-cyan-600 hover:bg-cyan-700"
      >
        {props.fil
          ? `📎 ${props.fil.name}`
          : isLevfaktMode
            ? "Ladda upp leverantörsfaktura"
            : "Ladda upp underlag"}
      </label>

      {isLoading && (
        <div className="flex flex-col items-center justify-center mb-6 text-white">
          <div className="w-6 h-6 mb-2 border-4 rounded-full border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-sm text-cyan-200">
            {isLevfaktMode ? "Läser och tolkar faktura..." : "Läser och tolkar dokument..."}
          </span>
        </div>
      )}

      {timeoutTriggered && (
        <div className="mb-6 text-sm text-center text-yellow-300">
          ⏱️ Tolkningen tog för lång tid – fyll i uppgifterna manuellt.
        </div>
      )}
    </>
  );
}
