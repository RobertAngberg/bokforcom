"use client";

import TillbakaPil from "../../_components/TillbakaPil";
import LeverantorFlik from "./Leverantorsfakturor/Leverantorer/LeverantorFlik";
import BokfordaFakturorFlik from "./Leverantorsfakturor/BokfordaFakturorFlik";
import { useLeverantörer } from "../hooks/useLeverantorer";

interface LeverantorsfakturorInlineProps {
  onBackToMenu: () => void;
}

export default function LeverantorsfakturorInline({
  onBackToMenu,
}: LeverantorsfakturorInlineProps) {
  const { refresh } = useLeverantörer();

  const handleLeverantörUpdated = () => {
    refresh();
  };

  return (
    <>
      <div className="relative mb-6">
        <TillbakaPil onClick={onBackToMenu} />
        <h1 className="text-3xl mb-6 text-center text-white">Leverantörsfakturor</h1>
      </div>

      <div className="mb-6">
        <LeverantorFlik onLeverantörUpdated={handleLeverantörUpdated} />
      </div>

      <div className="mb-8">
        <BokfordaFakturorFlik />
      </div>
    </>
  );
}
