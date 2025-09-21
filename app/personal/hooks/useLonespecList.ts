import { useState } from "react";
import { taBortLönespec } from "../actions/lonespecarActions";
import { useLonespec } from "./useLonespecar";

export const useLonespecList = (onLönespecUppdaterad?: () => void) => {
  const { lönespecar } = useLonespec();
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  const handleTaBortLönespec = async (lönespecId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) {
      return;
    }

    setTaBortLaddning((prev) => ({ ...prev, [lönespecId]: true }));
    try {
      const resultat = await taBortLönespec(parseInt(lönespecId));
      if (resultat.success) {
        setToast({
          message: "Lönespecifikation borttagen!",
          type: "success",
          isVisible: true,
        });
        onLönespecUppdaterad?.(); // Uppdatera listan
      } else {
        setToast({
          message: `Kunde inte ta bort lönespec: ${resultat.message}`,
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
      setToast({
        message: "Kunde inte ta bort lönespec",
        type: "error",
        isVisible: true,
      });
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
    toast,
    setToast,
    // Functions
    handleTaBortLönespec,
    handleNavigateToLonekorning,
  };
};
