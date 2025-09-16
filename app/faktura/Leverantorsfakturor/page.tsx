"use client";
import { useRouter } from "next/navigation";
import MainLayout from "../../_components/MainLayout";
import TillbakaPil from "../../_components/TillbakaPil";
import LeverantorFlik from "../Leverantorer/LeverantorFlik";
import BokfordaFakturorFlik from "./BokfordaFakturorFlik";
import { useLeverantörer } from "../_hooks/useLeverantorer";

export default function LeverantorsfakturorPage() {
  const router = useRouter();
  const { refresh } = useLeverantörer();

  const handleLeverantörUpdated = () => {
    refresh();
  };

  return (
    <MainLayout>
      <div className="relative mb-6">
        <TillbakaPil onClick={() => router.push("/faktura")} />
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
