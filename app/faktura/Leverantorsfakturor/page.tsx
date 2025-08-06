"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../_components/MainLayout";
import TillbakaPil from "../../_components/TillbakaPil";
import Knapp from "../../_components/Knapp";
import LeverantorFlik from "../Leverantorer/LeverantorFlik";
import BokfordaFakturorFlik from "./BokfordaFakturorFlik";
import VäljLeverantörModal from "./VäljLeverantörModal";
import { getLeverantörer, type Leverantör } from "../actions";

export default function LeverantorsfakturorPage() {
  const router = useRouter();
  const [showLeverantörModal, setShowLeverantörModal] = useState(false);
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>([]);
  const [loading, setLoading] = useState(true);

  // Ladda leverantörer för att kontrollera om knappen ska vara disabled
  useEffect(() => {
    const loadLeverantörer = async () => {
      const result = await getLeverantörer();
      if (result.success) {
        setLeverantörer(result.leverantörer || []);
      }
      setLoading(false);
    };
    loadLeverantörer();
  }, []);

  const harLeverantörer = leverantörer.length > 0;
  const registreraKnappText = loading ? "⏳ Laddar..." : "📋 Registrera leverantörsfaktura";

  return (
    <MainLayout>
      <div className="relative mb-6">
        <TillbakaPil onClick={() => router.push("/faktura")} />
        <h1 className="text-3xl mb-6 text-center text-white">Leverantörsfakturor</h1>
      </div>

      {/* Registrera ny leverantörsfaktura knapp */}
      <div className="mb-8 text-center">
        <Knapp
          text={registreraKnappText}
          onClick={() => setShowLeverantörModal(true)}
          disabled={loading || !harLeverantörer}
          className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3"
        />
      </div>

      {/* Leverantörer flik */}
      <div className="mb-6">
        <LeverantorFlik />
      </div>

      {/* Bokförda leverantörsfakturor flik */}
      <div className="mb-8">
        <BokfordaFakturorFlik />
      </div>

      <VäljLeverantörModal
        isOpen={showLeverantörModal}
        onClose={() => setShowLeverantörModal(false)}
      />
    </MainLayout>
  );
}
