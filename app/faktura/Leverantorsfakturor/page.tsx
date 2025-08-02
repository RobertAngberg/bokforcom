"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "../../_components/MainLayout";
import BokfordaFakturor from "../BokfordaFakturor";
import TillbakaPil from "../../_components/TillbakaPil";

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

      {/* Bokförda leverantörsfakturor lista */}
      <div className="mb-8">
        <BokfordaFakturor />
      </div>
    </MainLayout>
  );
}
