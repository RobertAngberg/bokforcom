"use client";

import AnimeradFlik from "../../_components/AnimeradFlik";
import BokfordaFakturor from "./BokfordaFakturor";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { useBokfordaFakturorFlik } from "../_hooks/useLeverantorer";

export default function BokfordaFakturorFlik() {
  const { fakturorAntal, loading } = useBokfordaFakturorFlik();

  return (
    <AnimeradFlik
      title="Leverantörsfakturor"
      icon="📊"
      visaSummaDirekt={loading ? "..." : `${fakturorAntal} st`}
      forcedOpen={true}
    >
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <BokfordaFakturor />
      )}
    </AnimeradFlik>
  );
}
