"use client";

import BokfordaFakturor from "./BokfordaFakturor";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import { useBokfordaFakturorFlik } from "../../hooks/useLeverantorer";

export default function BokfordaFakturorFlik() {
  const { fakturorAntal, loading } = useBokfordaFakturorFlik();

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
        📊 Leverantörsfakturor{" "}
        <span className="text-sm font-normal text-gray-400">
          ({loading ? "..." : `${fakturorAntal} st`})
        </span>
      </h2>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <BokfordaFakturor />
      )}
    </div>
  );
}
