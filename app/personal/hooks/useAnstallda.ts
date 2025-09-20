"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hämtaAllaAnställda,
  hämtaAnställd,
  taBortAnställd,
  sparaAnställd,
} from "../actions/anstalldaActions";
import type { AnställdData, AnställdListItem, PersonalEditData } from "../types/types";
import { useNyAnstalld } from "./useNyAnstalld";

export function useAnstallda() {
  const [anställda, setAnställda] = useState<AnställdListItem[]>([]);
  const [valdAnställd, setValdAnställd] = useState<AnställdData | null>(null);
  const [anställdaLoading, setAnställdaLoading] = useState(false);
  const [anställdLoading, setAnställdLoading] = useState(false);
  const [anställdLoadingId, setAnställdLoadingId] = useState<number | null>(null);
  const [anställdaError, setAnställdaError] = useState<string | null>(null);
  const [visaNyAnställdFormulär, setVisaNyAnställdFormulär] = useState(false);

  const nyAnstalldHook = useNyAnstalld();

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  const addAnställd = useCallback(
    (anställd: AnställdListItem) => {
      setAnställda([...anställda, anställd]);
    },
    [anställda, setAnställda]
  );

  const removeAnställd = useCallback(
    (id: number) => {
      setAnställda(anställda.filter((a) => a.id !== id));
    },
    [anställda, setAnställda]
  );

  const updateAnställd = useCallback(
    (id: number, updatedData: Partial<AnställdListItem>) => {
      setAnställda(anställda.map((a) => (a.id === id ? { ...a, ...updatedData } : a)));
    },
    [anställda, setAnställda]
  );

  // ===========================================
  // PERSONALINFORMATION - Lokal edit-state i hook
  // ===========================================

  const buildPersonalEditData = (a: Partial<AnställdData> | any): PersonalEditData => ({
    förnamn: a?.förnamn || "",
    efternamn: a?.efternamn || "",
    personnummer: a?.personnummer?.toString?.() || "",
    jobbtitel: a?.jobbtitel || "",
    clearingnummer: a?.clearingnummer?.toString?.() || "",
    bankkonto: a?.bankkonto?.toString?.() || "",
    mail: a?.mail || "",
    adress: a?.adress || "",
    postnummer: a?.postnummer?.toString?.() || "",
    ort: a?.ort || "",
  });

  const [personalIsEditing, setPersonalIsEditing] = useState(false);
  const [personalEditData, setPersonalEditData] = useState<PersonalEditData>(
    buildPersonalEditData({})
  );
  const [personalOriginalData, setPersonalOriginalData] = useState<PersonalEditData>(
    buildPersonalEditData({})
  );
  const [personalHasChanges, setPersonalHasChanges] = useState(false);
  const [personalErrorMessage, setPersonalErrorMessage] = useState<string | null>(null);

  // Initiera personalEditData från valdAnställd när inte i edit-läge
  useEffect(() => {
    if (!valdAnställd || personalIsEditing) return;
    const data = buildPersonalEditData(valdAnställd);
    setPersonalEditData(data);
    setPersonalOriginalData(data);
    setPersonalHasChanges(false);
    setPersonalErrorMessage(null);
  }, [valdAnställd, personalIsEditing]);

  const personalOnEdit = useCallback(() => {
    if (!valdAnställd) return;
    setPersonalIsEditing(true);
    const data = buildPersonalEditData(valdAnställd);
    setPersonalEditData(data);
    setPersonalOriginalData(data);
    setPersonalHasChanges(false);
    setPersonalErrorMessage(null);
  }, [valdAnställd]);

  const personalOnChange = useCallback(
    (name: keyof PersonalEditData | string, value: any) => {
      const next = { ...personalEditData, [name]: value } as PersonalEditData;
      setPersonalEditData(next);
      setPersonalHasChanges(JSON.stringify(next) !== JSON.stringify(personalOriginalData));
      if (personalErrorMessage) setPersonalErrorMessage(null);
    },
    [personalEditData, personalOriginalData, personalErrorMessage]
  );

  const personalOnSave = useCallback(async () => {
    if (!valdAnställd || !personalHasChanges) return;
    try {
      const payload: AnställdData = {
        ...valdAnställd,
        förnamn: personalEditData.förnamn,
        efternamn: personalEditData.efternamn,
        personnummer: personalEditData.personnummer,
        jobbtitel: personalEditData.jobbtitel,
        mail: personalEditData.mail,
        clearingnummer: personalEditData.clearingnummer,
        bankkonto: personalEditData.bankkonto,
        adress: personalEditData.adress,
        postnummer: personalEditData.postnummer,
        ort: personalEditData.ort,
      } as AnställdData;

      const result = await sparaAnställd(payload, (valdAnställd as any).id);
      if (result?.success) {
        setValdAnställd(payload);
        setPersonalOriginalData(personalEditData);
        setPersonalHasChanges(false);
        setPersonalIsEditing(false);
        setPersonalErrorMessage(null);
      } else {
        setPersonalErrorMessage(result?.error || "Kunde inte spara");
      }
    } catch (e) {
      setPersonalErrorMessage("Ett fel uppstod vid sparande");
    }
  }, [valdAnställd, personalHasChanges, personalEditData, setValdAnställd]);

  const personalOnCancel = useCallback(() => {
    setPersonalEditData(personalOriginalData);
    setPersonalIsEditing(false);
    setPersonalHasChanges(false);
    setPersonalErrorMessage(null);
  }, [personalOriginalData]);

  // ===========================================
  // ANSTÄLLDA LISTA - För Anstallda.tsx & AnstalldaLista.tsx
  // ===========================================

  // Ladda alla anställda
  const laddaAnställda = useCallback(async () => {
    setAnställdaLoading(true);
    setAnställdaError(null);
    try {
      const anställdaData = await hämtaAllaAnställda();
      // Konvertera till AnställdListItem format
      const anställdaLista: AnställdListItem[] = anställdaData.map((a: any) => ({
        id: a.id,
        namn: `${a.förnamn} ${a.efternamn}`,
        epost: a.mail || "",
        roll: a.jobbtitel || "",
      }));
      setAnställda(anställdaLista);
    } catch (error) {
      console.error("Fel vid laddning av anställda:", error);
      setAnställdaError("Kunde inte ladda anställda");
    } finally {
      setAnställdaLoading(false);
    }
  }, [setAnställda, setAnställdaLoading, setAnställdaError]);

  // Auto-ladda anställda när hooken används första gången
  useEffect(() => {
    if (anställda.length === 0 && !anställdaLoading) {
      laddaAnställda();
    }
  }, [anställda.length, anställdaLoading, laddaAnställda]);

  // ===========================================
  // ANSTÄLLD DETALJER - För page.tsx (vald anställd)
  // ===========================================

  // Ladda en specifik anställd med full data
  const laddaAnställd = useCallback(
    async (anställdId: number) => {
      setAnställdLoadingId(anställdId);
      setAnställdLoading(true);
      try {
        const fullData = await hämtaAnställd(anställdId);
        setValdAnställd(fullData);
        return fullData;
      } catch (error) {
        console.error("Fel vid laddning av anställd:", error);
        // Fallback till grundläggande data från listan
        const anställdFrånLista = anställda.find((a) => a.id === anställdId);
        if (anställdFrånLista) {
          // Skapa en minimal AnställdData från AnställdListItem
          const fallbackData: Partial<AnställdData> = {
            förnamn: anställdFrånLista.namn.split(" ")[0] || "",
            efternamn: anställdFrånLista.namn.split(" ").slice(1).join(" ") || "",
            mail: anställdFrånLista.epost,
            jobbtitel: anställdFrånLista.roll || "",
          };
          setValdAnställd(fallbackData as AnställdData);
          return fallbackData;
        }
      } finally {
        setAnställdLoadingId(null);
        setAnställdLoading(false);
      }
    },
    [anställda, setValdAnställd, setAnställdLoading, setAnställdLoadingId]
  );

  // ===========================================
  // ANSTÄLLDA RAD - För AnstalldaRad.tsx
  // ===========================================

  // Ta bort anställd
  const taBortAnställdMedKonfirmation = useCallback(
    async (id: number, namn: string) => {
      if (!confirm(`Är du säker på att du vill ta bort ${namn}?`)) {
        return;
      }

      try {
        const result = await taBortAnställd(id);
        if (result.success) {
          removeAnställd(id);
          // Om den borttagna anställda var vald, rensa valet
          if (valdAnställd && "id" in valdAnställd && (valdAnställd as any).id === id) {
            setValdAnställd(null);
          }

          setAnställdaError(null);
        } else {
          setAnställdaError(result.error || "Ett fel uppstod vid borttagning");
        }
      } catch (error) {
        console.error("Fel vid borttagning:", error);
        setAnställdaError("Ett fel uppstod vid borttagning");
      }
    },
    [removeAnställd, valdAnställd, setValdAnställd, setAnställdaError]
  );

  // Hantera klick på anställd (ladda full data och sätt som vald)
  const hanteraAnställdKlick = useCallback(
    async (anställdId: number) => {
      await laddaAnställd(anställdId);
    },
    [laddaAnställd]
  );

  // ===========================================
  // NY ANSTÄLLD - För NyAnstalld.tsx
  // ===========================================

  // Visa/dölj ny anställd formulär
  const visaNyAnställd = useCallback(() => {
    setVisaNyAnställdFormulär(true);
  }, [setVisaNyAnställdFormulär]);

  const döljNyAnställd = useCallback(() => {
    setVisaNyAnställdFormulär(false);
  }, [setVisaNyAnställdFormulär]);

  // När en ny anställd sparats
  const hanteraNyAnställdSparad = useCallback(async () => {
    await laddaAnställda();
    setVisaNyAnställdFormulär(false);
  }, [laddaAnställda, setVisaNyAnställdFormulär]);

  // ===========================================
  // ANSTÄLLD RAD - För AnställdaRad.tsx
  // ===========================================

  // Hantera radklick (undvik klick på knappar)
  const hanteraRadKlick = useCallback(
    (e: React.MouseEvent, anställdId: number) => {
      // Hindra klick om användaren klickar på Ta bort-knappen
      if ((e.target as HTMLElement).closest("button")) {
        return;
      }
      if (anställdLoadingId !== anställdId) {
        hanteraAnställdKlick(anställdId);
      }
    },
    [anställdLoadingId, hanteraAnställdKlick]
  );

  // Hook för specifik anställd rad
  const useAnställdRad = useCallback(
    (anställd: AnställdListItem) => {
      const loading = anställdLoadingId === anställd.id;

      const handleTaBort = () => {
        taBortAnställdMedKonfirmation(anställd.id, anställd.namn);
      };

      const handleRadKlick = (e: React.MouseEvent) => {
        hanteraRadKlick(e, anställd.id);
      };

      return {
        loading,
        handleTaBort,
        handleRadKlick,
      };
    },
    [anställdLoadingId, taBortAnställdMedKonfirmation, hanteraRadKlick]
  );

  // ===========================================
  // ALLMÄNNA FUNKTIONER
  // ===========================================

  // Rensa fel meddelanden
  const rensaFel = useCallback(() => {
    setAnställdaError(null);
  }, [setAnställdaError]);

  // ===========================================
  // RETURN - Grupperat per användningsområde
  // ===========================================

  return {
    // State
    state: {
      anställda,
      valdAnställd,
      anställdaLoading,
      anställdLoading,
      anställdLoadingId,
      anställdaError,
      visaNyAnställdFormulär,
      harAnställda: anställda.length > 0,

      // Personalinformation edit state
      personalIsEditing,
      personalEditData,
      personalOriginalData,
      personalHasChanges,
      personalErrorMessage,
    },

    // Actions
    actions: {
      laddaAnställda,
      laddaAnställd,
      setValdAnställd,
      addAnställd,
      removeAnställd,
      updateAnställd,
      rensaFel,
    },

    // Handlers
    handlers: {
      hanteraAnställdKlick,
      taBortAnställd: taBortAnställdMedKonfirmation,
      visaNyAnställd,
      döljNyAnställd,
      hanteraNyAnställdSparad,
      // För AnställdaRad komponenter
      hanteraRadKlick,

      // Personalinformation handlers
      personalOnEdit,
      personalOnChange,
      personalOnSave,
      personalOnCancel,
    },

    // Specialized hooks
    useAnställdRad,
  };
}
