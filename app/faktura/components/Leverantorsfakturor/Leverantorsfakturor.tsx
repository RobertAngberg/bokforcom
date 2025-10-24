"use client";

import LeverantorFlik from "./Leverantorer/LeverantorFlik";
import BokfordaFakturorFlik from "./BokfordaFakturorFlik";
import { useLeverantörer } from "../../hooks/useLeverantorer";
import { FakturaProvider } from "../../context/providers/FakturaProvider";

interface LeverantorsfakturorPageProps {
  onBackToMenu?: () => void;
}

export default function LeverantorsfakturorPage({}: LeverantorsfakturorPageProps) {
  const { refresh } = useLeverantörer();

  const handleLeverantörUpdated = () => {
    refresh();
  };

  return (
    <FakturaProvider>
      <>
        <h1 className="text-3xl mb-6 text-center text-white">Leverantörsfakturor</h1>

        <div className="mb-6">
          <BokfordaFakturorFlik />
        </div>

        <div className="mb-8">
          <LeverantorFlik onLeverantörUpdated={handleLeverantörUpdated} />
        </div>
      </>
    </FakturaProvider>
  );
}
