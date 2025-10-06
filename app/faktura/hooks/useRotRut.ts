"use client";

import { useCallback, useMemo, useState } from "react";
import { showToast } from "../../_components/Toast";
import { registreraRotRutBetalning, uppdateraRotRutStatus } from "../actions/alternativActions";
import type { RotRutStatusPayload, UseRotRutOptions } from "../types/types";

export function useRotRut({
  fakturaId,
  totalBelopp,
  bokföringsmetod,
  onSuccess,
  onClose,
}: UseRotRutOptions) {
  const [loading, setLoading] = useState(false);

  const rotRutBelopp = useMemo(() => Math.round(totalBelopp * 0.5 * 100) / 100, [totalBelopp]);

  const handleRegistrering = useCallback(async () => {
    setLoading(true);

    try {
      const result = await registreraRotRutBetalning(fakturaId);
      if (!result.success) {
        showToast(result.error || "Kunde inte registrera betalning", "error");
        return;
      }

      const statusResult = await uppdateraRotRutStatus(fakturaId, "godkänd");
      if (!statusResult.success) {
        showToast(statusResult.error || "Kunde inte uppdatera ROT/RUT-status", "error");
        return;
      }

      const payload: RotRutStatusPayload = {
        rot_rut_status: "godkänd",
        status_betalning: "Betald",
      };
      onSuccess(payload);
      onClose();

      setTimeout(() => {
        const ärKontantmetod = bokföringsmetod === "kontantmetoden";
        const meddelande = ärKontantmetod
          ? `ROT/RUT-utbetalning registrerad.\n\n${rotRutBelopp.toLocaleString("sv-SE")} kr bokförd från Skatteverket.\nKunden betalade sin del vid fakturering.`
          : `ROT/RUT-utbetalning registrerad.\n\n${rotRutBelopp.toLocaleString("sv-SE")} kr bokförd från Skatteverket.\nFakturan är nu avslutad och klar.`;

        showToast(meddelande, "success");
      }, 100);
    } catch (error) {
      console.error("Fel vid ROT/RUT-betalning:", error);
      showToast("Ett oväntat fel uppstod", "error");
    } finally {
      setLoading(false);
    }
  }, [bokföringsmetod, fakturaId, onClose, onSuccess, rotRutBelopp]);

  return { loading, rotRutBelopp, handleRegistrering } as const;
}
