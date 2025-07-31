"use client";

import Link from "next/link";
import MainLayout from "../../_components/MainLayout";

export default function LeverantorsfakturorPage() {
  return (
    <MainLayout>
      <div className="relative mb-8 flex items-center justify-center">
        <div className="absolute left-0 top-1">
          <Link
            href="/faktura"
            className="flex items-center gap-2 text-white font-bold px-3 py-2 rounded hover:bg-gray-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Tillbaka
          </Link>
        </div>
        <h1 className="text-2xl text-center w-full">Leverantörsfakturor</h1>
      </div>

      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-xl text-white mb-4">Under utveckling</h2>
        <p className="text-gray-400">
          Funktionen för leverantörsfakturor kommer snart! Här kommer du kunna hantera inkommande
          fakturor från dina leverantörer.
        </p>
      </div>
    </MainLayout>
  );
}
