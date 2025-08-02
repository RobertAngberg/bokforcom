"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "../../_components/MainLayout";
import TillbakaPil from "../../_components/TillbakaPil";
import LeverantörFlik from "../Leverantorer/LeverantorFlik";
import BokfordaFakturorFlik from "./BokfordaFakturorFlik";

export default function LeverantorsfakturorPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="relative mb-6">
        <TillbakaPil onClick={() => router.push("/faktura")} />
        <h1 className="text-3xl mb-6 text-center text-white">Leverantörsfakturor</h1>
      </div>

      {/* Registrera ny leverantörsfaktura knapp */}
      <div className="mb-8 text-center">
        <Link
          href="/bokfor?levfakt=true"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
        >
          <span>📋</span>
          Registrera leverantörsfaktura
        </Link>
      </div>

      {/* Leverantörer flik */}
      <div className="mb-6">
        <LeverantörFlik />
      </div>

      {/* Bokförda leverantörsfakturor flik */}
      <div className="mb-8">
        <BokfordaFakturorFlik />
      </div>
    </MainLayout>
  );
}
