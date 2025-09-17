"use client";

import Personalinformation from "./Personalinformation";
import Kompensation from "./Kompensation";
import Tjänsteställe from "./Tjanstestalle";
import Skatt from "./Skatt";
import Knapp from "../../../_components/Knapp";
import Toast from "../../../_components/Toast";
import { usePersonalStore } from "../../_stores/personalStore";
import { useAnstallda } from "../../_hooks/useAnstallda";

export default function NyAnställd() {
  const { toast, hideToast, anställdLoading } = usePersonalStore();
  const { actions, handlers } = useAnstallda();

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Ny anställd</h2>

      <Personalinformation />

      <Kompensation />

      <Tjänsteställe />

      <Skatt />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <div className="flex gap-4 pt-4">
        <Knapp
          text={anställdLoading ? "Sparar..." : "Spara"}
          onClick={actions.sparaNyAnställd}
          disabled={anställdLoading}
        />
        <Knapp text="Avbryt" onClick={handlers.döljNyAnställd} />
      </div>
    </div>
  );
}
