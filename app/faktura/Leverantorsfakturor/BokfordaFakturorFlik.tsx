"use client";

import { useState, useEffect } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";
import BokfordaFakturor from "../_components/BokfordaFakturor";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { hamtaBokfordaFakturor } from "../actions";

export default function BokfordaFakturorFlik() {
  const [fakturorAntal, setFakturorAntal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadFakturorAntal = async () => {
    try {
      const result = await hamtaBokfordaFakturor();
      if (result.success && result.fakturor) {
        setFakturorAntal(result.fakturor.length);
      }
    } catch (error) {
      console.error("Fel vid hämtning av fakturor:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFakturorAntal();
  }, []);

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
