import { useState } from "react";
import { taBortLönespec } from "../actions/lonespecarActions";
import { useLonespec } from "./useLonespecar";
import { showToast } from "../../_components/Toast";

export const useAnstalldalonespecList = (onLönespecUppdaterad?: () => void) => {
  const { lönespecar } = useLonespec();
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});

  const handleTaBortLönespec = async (lönespecId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) {
      return;
    }

    setTaBortLaddning((prev) => ({ ...prev, [lönespecId]: true }));
    try {
      const resultat = await taBortLönespec(parseInt(lönespecId));
      if (resultat.success) {
        showToast("Lönespecifikation borttagen!", "success");
        onLönespecUppdaterad?.(); // Uppdatera listan
      } else {
        showToast(`Kunde inte ta bort lönespec: ${resultat.message}`, "error");
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
      showToast("Kunde inte ta bort lönespec", "error");
    } finally {
      setTaBortLaddning((prev) => ({ ...prev, [lönespecId]: false }));
    }
  };

  const handleNavigateToLonekorning = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/personal/Lonekorning";
    }
  };

  return {
    // State
    lönespecar,
    taBortLaddning,
    // Functions
    handleTaBortLönespec,
    handleNavigateToLonekorning,
  };
};
