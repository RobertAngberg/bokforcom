"use client";

import MainLayout from "../../_components/MainLayout";
import TillbakaPil from "../../_components/TillbakaPil";
import LeverantorFlik from "../Leverantorer/LeverantorFlik";
import BokfordaFakturorFlik from "./BokfordaFakturorFlik";
import { useLeverantörer } from "../_hooks/useLeverantorer";
import { useLeverantorNavigation } from "../_hooks/useLeverantorer";

export default function LeverantorsfakturorPage() {
  const { refresh } = useLeverantörer();
  const { navigateToFaktura } = useLeverantorNavigation();

  const handleLeverantörUpdated = () => {
    refresh();
  };

  return (
    <MainLayout>
      <div className="relative mb-6">
        <TillbakaPil onClick={navigateToFaktura} />
        <h1 className="text-3xl mb-6 text-center text-white">Leverantörsfakturor</h1>
      </div>

      <div className="mb-6">
        <LeverantorFlik onLeverantörUpdated={handleLeverantörUpdated} />
      </div>

      <div className="mb-8">
        <BokfordaFakturorFlik />
      </div>
    </MainLayout>
  );
}
