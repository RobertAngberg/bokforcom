"use client";

import TillbakaPil from "../../../_components/TillbakaPil";
import LeverantorFlik from "./Leverantorer/LeverantorFlik";
import BokfordaFakturorFlik from "./BokfordaFakturorFlik";
import { useLeverantörer } from "../../hooks/useLeverantorer";
import { useLeverantorNavigation } from "../../hooks/useLeverantorer";
import { FakturaProvider } from "../../context/FakturaContext";

interface LeverantorsfakturorPageProps {
  onBackToMenu?: () => void;
}

export default function LeverantorsfakturorPage({ onBackToMenu }: LeverantorsfakturorPageProps) {
  const { refresh } = useLeverantörer();
  const { navigateToFaktura } = useLeverantorNavigation();

  const handleLeverantörUpdated = () => {
    refresh();
  };

  return (
    <FakturaProvider>
      <>
        <div className="relative mb-6">
          <TillbakaPil onClick={onBackToMenu || navigateToFaktura} />
          <h1 className="text-3xl mb-6 text-center text-white">Leverantörsfakturor</h1>
        </div>

        <div className="mb-6">
          <LeverantorFlik onLeverantörUpdated={handleLeverantörUpdated} />
        </div>

        <div className="mb-8">
          <BokfordaFakturorFlik />
        </div>
      </>
    </FakturaProvider>
  );
}
