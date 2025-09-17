"use client";

import { useState, useEffect } from "react";
import { formatSEK } from "../../_utils/format";
import { stringTillDate } from "../../_utils/datum";
import {
  hamtaBokfordaFakturor,
  hamtaTransaktionsposter,
  betalaOchBokförLeverantörsfaktura,
  taBortLeverantörsfaktura,
} from "../actions";
import { ColumnDefinition } from "../../_components/Tabell";
import { BokfordFaktura } from "../_types/types";
import { useFakturaClient } from "./useFakturaClient";

export function useBokfordaFakturor() {
  const { toastState, setToast, clearToast } = useFakturaClient();

  // State management
  const [fakturor, setFakturor] = useState<BokfordFaktura[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifikatModal, setVerifikatModal] = useState<{
    isOpen: boolean;
    transaktionId: number;
    fakturanummer?: string;
    leverantör?: string;
  }>({
    isOpen: false,
    transaktionId: 0,
  });
  const [bekraftelseModal, setBekraftelseModal] = useState<{
    isOpen: boolean;
    faktura: BokfordFaktura | null;
    transaktionsposter: any[];
    loadingPoster: boolean;
  }>({
    isOpen: false,
    faktura: null,
    transaktionsposter: [],
    loadingPoster: false,
  });

  // Hjälpfunktion för att säkert formatera datum
  const formateraDatum = (datum: string | Date): string => {
    if (typeof datum === "string") {
      const dateObj = stringTillDate(datum);
      return dateObj ? dateObj.toLocaleDateString("sv-SE") : datum;
    }
    return datum.toLocaleDateString("sv-SE");
  };

  // Kolumndefinitioner för transaktionsposter tabellen
  const transaktionskolumner: ColumnDefinition<any>[] = [
    {
      key: "konto",
      label: "Konto",
      render: (_, post) => (
        <div>
          <div className="font-medium text-white">{post.kontonummer}</div>
          <div className="text-sm text-gray-400">{post.kontobeskrivning}</div>
        </div>
      ),
    },
    {
      key: "debet",
      label: "Debet",
      render: (_, post) => (
        <div className="text-right text-white">{post.debet > 0 ? formatSEK(post.debet) : "—"}</div>
      ),
      className: "text-right",
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (_, post) => (
        <div className="text-right text-white">
          {post.kredit > 0 ? formatSEK(post.kredit) : "—"}
        </div>
      ),
      className: "text-right",
    },
  ];

  // Data fetching effect
  useEffect(() => {
    async function hamtaFakturor() {
      try {
        const result = await hamtaBokfordaFakturor();
        if (result.success && result.fakturor) {
          setFakturor(result.fakturor);
        }
      } catch (error) {
        console.error("Fel vid hämtning av bokförda fakturor:", error);
      } finally {
        setLoading(false);
      }
    }

    hamtaFakturor();
  }, []);

  // Event handlers
  const öppnaVerifikat = (faktura: BokfordFaktura) => {
    setVerifikatModal({
      isOpen: true,
      transaktionId: faktura.transaktionId || faktura.id,
      fakturanummer: faktura.fakturanummer,
      leverantör: faktura.leverantör,
    });
  };

  const stängVerifikat = () => {
    setVerifikatModal({
      isOpen: false,
      transaktionId: 0,
    });
  };

  const handleBetalaOchBokför = async (faktura: BokfordFaktura) => {
    setBekraftelseModal({
      isOpen: true,
      faktura: faktura,
      transaktionsposter: [],
      loadingPoster: true,
    });

    // Hämta transaktionsposter för att visa debet/kredit
    if (faktura.transaktionId) {
      try {
        const poster = await hamtaTransaktionsposter(faktura.transaktionId);
        setBekraftelseModal((prev) => ({
          ...prev,
          transaktionsposter: Array.isArray(poster) ? poster : [],
          loadingPoster: false,
        }));
      } catch (error) {
        console.error("Fel vid hämtning av transaktionsposter:", error);
        setBekraftelseModal((prev) => ({
          ...prev,
          loadingPoster: false,
        }));
      }
    } else {
      setBekraftelseModal((prev) => ({
        ...prev,
        loadingPoster: false,
      }));
    }
  };

  const stängBekraftelseModal = () => {
    setBekraftelseModal({
      isOpen: false,
      faktura: null,
      transaktionsposter: [],
      loadingPoster: false,
    });
  };

  const taBortFaktura = async (fakturaId: number) => {
    if (confirm("Är du säker på att du vill ta bort denna leverantörsfaktura?")) {
      try {
        const result = await taBortLeverantörsfaktura(fakturaId);

        if (result.success) {
          // Ta bort från listan lokalt
          setFakturor((prev) => prev.filter((f) => f.id !== fakturaId));

          setToast({
            message: "Leverantörsfaktura borttagen!",
            type: "success",
          });
        } else {
          setToast({
            message: `Fel vid borttagning: ${result.error}`,
            type: "error",
          });
        }
      } catch (error) {
        console.error("Fel vid borttagning av faktura:", error);
        setToast({
          message: "Fel vid borttagning av faktura",
          type: "error",
        });
      }
    }
  };

  const utförBokföring = async (faktura: BokfordFaktura) => {
    try {
      const result = await betalaOchBokförLeverantörsfaktura(faktura.id, faktura.belopp);

      if (result.success) {
        setToast({
          message: "Leverantörsfaktura bokförd!",
          type: "success",
        });
        // Ladda om data för att visa uppdaterad status
        const updatedData = await hamtaBokfordaFakturor();
        if (updatedData.success) {
          setFakturor(updatedData.fakturor || []);
        }
      } else {
        setToast({
          message: `Fel vid bokföring: ${result.error}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Fel vid bokföring:", error);
      setToast({
        message: "Ett fel uppstod vid bokföring",
        type: "error",
      });
    }
    // Stäng modalen
    stängBekraftelseModal();
  };

  const closeToast = () => {
    clearToast();
  };

  return {
    // State
    fakturor,
    loading,
    verifikatModal,
    toast: toastState,
    bekraftelseModal,

    // Computed data
    transaktionskolumner,

    // Actions
    formateraDatum,
    öppnaVerifikat,
    stängVerifikat,
    handleBetalaOchBokför,
    stängBekraftelseModal,
    taBortFaktura,
    utförBokföring,
    closeToast,
  };
}
