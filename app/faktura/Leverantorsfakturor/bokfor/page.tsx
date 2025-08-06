"use client";

import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "../../../_components/MainLayout";
import TillbakaPil from "../../../_components/TillbakaPil";
import Knapp from "../../../_components/Knapp";

export default function BokforLeverantorsfakturaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leverantorId = searchParams.get("leverantorId");

  const handleContinueToBokforing = () => {
    if (leverantorId) {
      router.push(`/bokfor?levfakt=true&leverantorId=${leverantorId}`);
    }
  };

  return (
    <MainLayout>
      <div className="relative mb-6">
        <TillbakaPil onClick={() => router.push("/faktura/Leverantorsfakturor")} />
        <h1 className="text-3xl mb-6 text-center text-white">Registrera leverantörsfaktura</h1>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">� Leverantörsfaktura</h3>
        <div className="text-gray-300">
          <p className="mb-4">Du kommer nu att registrera en leverantörsfaktura. Här kan du:</p>
          <ul className="list-disc list-inside space-y-1 mb-6">
            <li>Välja förval för kostnadskonton (4xxx, 5xxx, 6xxx)</li>
            <li>Ladda upp faktura-PDF</li>
            <li>Ange belopp och datum</li>
            <li>Bokföra leverantörsfakturan</li>
          </ul>

          {leverantorId && (
            <p className="text-sm text-gray-400 mb-4">Leverantör ID: {leverantorId}</p>
          )}
        </div>

        <div className="flex justify-center">
          <Knapp
            text="📚 Fortsätt till bokföring"
            onClick={handleContinueToBokforing}
            disabled={!leverantorId}
            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3"
          />
        </div>
      </div>
    </MainLayout>
  );
}
