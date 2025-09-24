"use client";

import Personalinformation from "./Personalinformation";
import Kompensation from "./Kompensation";
import Tjänsteställe from "./Tjanstestalle";
import Skatt from "./Skatt";
import Knapp from "../../../../_components/Knapp";
import { useNyAnstalld } from "../../../hooks/useNyAnstalld";
import { useAnstallda } from "../../../hooks/useAnstallda";

export default function NyAnställd() {
  const {
    state: { nyAnställdLoading },
    actions,
  } = useNyAnstalld();

  const { actions: anställdaActions } = useAnstallda();

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Ny anställd</h2>

      <Personalinformation />
      <Kompensation />
      <Tjänsteställe />
      <Skatt />

      <div className="flex gap-4 pt-4">
        <Knapp
          text={nyAnställdLoading ? "Sparar..." : "Spara"}
          onClick={() => actions.sparaNyAnställd(() => anställdaActions.laddaAnställda())}
          disabled={nyAnställdLoading}
        />
        <Knapp text="Avbryt" onClick={actions.döljNyAnställd} />
      </div>
    </div>
  );
}
