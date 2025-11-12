import { useEffect } from "react";
import { useBokforContext } from "../context/BokforContextProvider";
import type { BokforInitialData } from "../types/types";

/**
 * Hook för att initiera Bokfor context med server data
 */
export function useBokforInit(initialData: BokforInitialData) {
  const { actions } = useBokforContext();
  const { setFavoritFörvalen, setAllaFörval, setBokföringsmetod, setAnställda } = actions;

  useEffect(() => {
    // Initialisera med server data
    setFavoritFörvalen(initialData.favoritFörval);
    setAllaFörval(initialData.allaFörval);
    setBokföringsmetod(initialData.bokföringsmetod);
    setAnställda(initialData.anställda);
  }, [initialData, setFavoritFörvalen, setAllaFörval, setBokföringsmetod, setAnställda]);
}
