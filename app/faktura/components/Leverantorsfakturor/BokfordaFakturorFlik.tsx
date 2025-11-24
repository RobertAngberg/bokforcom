"use client";

import BokfordaFakturor from "./BokfordaFakturor";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import { useBokfordaFakturorFlik } from "../../hooks/useLeverantorer/useBokfordaFakturor";

export default function BokfordaFakturorFlik() {
  const { loading } = useBokfordaFakturorFlik();

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
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
