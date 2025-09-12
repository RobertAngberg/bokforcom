"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../_components/MainLayout";
import TillbakaPil from "../../_components/TillbakaPil";
import LeverantorFlik from "../Leverantorer/LeverantorFlik";
import BokfordaFakturorFlik from "./BokfordaFakturorFlik";
import ValjLeverantorModal from "../../_components/ValjLeverantorModal"; // Behålls om modal fortfarande ska kunna användas på annat sätt
import { getLeverantörer, type Leverantör } from "../actions";

export default function LeverantorsfakturorPage() {
  const router = useRouter();
  // const [showLeverantörModal, setShowLeverantörModal] = useState(false); // borttagen knapp gör att state pausas
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>([]);
  const [loading, setLoading] = useState(true);

  // Ladda leverantörer för att kontrollera om knappen ska vara disabled
  const loadLeverantörer = async () => {
    setLoading(true);
    const result = await getLeverantörer();
    if (result.success) {
      setLeverantörer(result.leverantörer || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeverantörer();
  }, []);

  // Callback för att uppdatera leverantörslistan när en ny läggs till
  const handleLeverantörUpdated = () => {
    loadLeverantörer();
  };

  const harLeverantörer = leverantörer.length > 0; // ev. används längre ner
  // Registreringsknapp borttagen enligt önskemål

  return (
    <MainLayout>
      <div className="relative mb-6">
        <TillbakaPil onClick={() => router.push("/faktura")} />
        <h1 className="text-3xl mb-6 text-center text-white">Leverantörsfakturor</h1>
      </div>

      {/* (Knapp för att registrera leverantörsfaktura borttagen) */}

      {/* Leverantörer flik */}
      <div className="mb-6">
        <LeverantorFlik onLeverantörUpdated={handleLeverantörUpdated} />
      </div>

      {/* Bokförda leverantörsfakturor flik */}
      <div className="mb-8">
        <BokfordaFakturorFlik />
      </div>

      {/* Modal bortkopplad eftersom knappen togs bort */}
    </MainLayout>
  );
}
