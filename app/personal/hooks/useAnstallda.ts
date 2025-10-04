"use client";

import { useCallback, useEffect, useState, useActionState } from "react";
import {
  hämtaAllaAnställda,
  hämtaAnställd,
  taBortAnställd,
  sparaAnställd,
  sparaNyAnställdFormAction,
} from "../actions/anstalldaActions";
import { taBortLönespec } from "../actions/lonespecarActions";
import { useLonespec } from "./useLonespecar";
import { showToast } from "../../_components/Toast";
import type {
  AnställdData,
  AnställdListItem,
  PersonalEditData,
  UseAnstalldaProps,
} from "../types/types";

// Ny Anställd formulär initial data - flyttad från useNyAnstalld.ts
const initialNyAnställdFormulär = {
  // Personal information
  förnamn: "",
  efternamn: "",
  personnummer: "",
  jobbtitel: "",
  clearingnummer: "",
  bankkonto: "",
  mail: "",
  adress: "",
  postnummer: "",
  ort: "",

  // Dates
  startdatum: new Date(),
  slutdatum: (() => {
    const datum = new Date();
    datum.setFullYear(datum.getFullYear() + 1);
    return datum;
  })(),

  // Employment details
  anställningstyp: "",
  löneperiod: "",
  ersättningPer: "",
  kompensation: "",
  arbetsvecka: "",
  arbetsbelastning: "",
  deltidProcent: "",

  // Workplace
  tjänsteställeAdress: "",
  tjänsteställeOrt: "",

  // Tax information
  skattetabell: "",
  skattekolumn: "",
  växaStöd: false,
};

const initialActionResult = {
  success: false,
  message: "",
};

export function useAnstallda(props?: UseAnstalldaProps) {
  const enableLonespecMode = props?.enableLonespecMode || false;
  const onLönespecUppdaterad = props?.onLönespecUppdaterad;
  const enableNyAnstalldMode = props?.enableNyAnstalldMode || false;
  const onNyAnstalldSaved = props?.onNyAnstalldSaved;
  const onNyAnstalldCancel = props?.onNyAnstalldCancel;

  const [anställda, setAnställda] = useState<AnställdListItem[]>([]);
  const [valdAnställd, setValdAnställd] = useState<AnställdData | null>(null);
  const [anställdaLoading, setAnställdaLoading] = useState(false);
  const [anställdLoading, setAnställdLoading] = useState(false);
  const [anställdLoadingId, setAnställdLoadingId] = useState<number | null>(null);
  const [anställdaError, setAnställdaError] = useState<string | null>(null);
  const [visaNyAnställdFormulär, setVisaNyAnställdFormulär] = useState(false);

  // Delete modal states
  const [showDeleteAnställdModal, setShowDeleteAnställdModal] = useState(false);
  const [deleteAnställdId, setDeleteAnställdId] = useState<number | null>(null);
  const [showDeleteLönespecModal, setShowDeleteLönespecModal] = useState(false);
  const [deleteLönespecId, setDeleteLönespecId] = useState<number | null>(null);

  // NY ANSTÄLLD state - only when enableNyAnstalldMode is true
  const [nyAnställdFormulär, setNyAnställdFormulär] = useState(initialNyAnställdFormulär);

  // NY ANSTÄLLD form action - always call hook, use result conditionally
  const [actionState, formAction, isPending] = useActionState(
    sparaNyAnställdFormAction,
    initialActionResult
  );

  // Use isPending from useActionState for loading state
  const nyAnställdLoading = isPending;

  // Lönespec state - only when enableLonespecMode is true
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});

  // Lönespec data - always call hook, use result conditionally
  const lonespecData = useLonespec();
  const lönespecar = enableLonespecMode ? lonespecData.lönespecar : [];

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

  const buildPersonalEditData = (a: Partial<AnställdData>): PersonalEditData => ({
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

  const personalOnEdit = () => {
    if (!valdAnställd) return;
    setPersonalIsEditing(true);
    // Initiera edit data från vald anställd
    const data = buildPersonalEditData(valdAnställd);
    setPersonalEditData(data);
    setPersonalOriginalData(data);
    setPersonalHasChanges(false);
    setPersonalErrorMessage(null);
  };

  const personalOnChange = useCallback(
    (name: keyof PersonalEditData | string, value: string | number | boolean) => {
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

      const result = await sparaAnställd(payload, valdAnställd.id);
      if (result?.success) {
        setValdAnställd(payload);
        setPersonalOriginalData(personalEditData);
        setPersonalHasChanges(false);
        setPersonalIsEditing(false);
        setPersonalErrorMessage(null);
      } else {
        setPersonalErrorMessage(result?.error || "Kunde inte spara");
      }
    } catch {
      setPersonalErrorMessage("Ett fel uppstod vid sparande");
    }
  }, [valdAnställd, personalHasChanges, personalEditData]);

  const personalOnCancel = () => {
    setPersonalEditData(personalOriginalData);
    setPersonalIsEditing(false);
    setPersonalHasChanges(false);
    setPersonalErrorMessage(null);
  };

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
      const anställdaLista: AnställdListItem[] = anställdaData
        .filter((a: AnställdData) => a.id !== undefined)
        .map((a: AnställdData) => ({
          id: a.id!,
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

  // Hämta alla anställda vid mount
  useEffect(() => {
    laddaAnställda();
  }, [laddaAnställda]);

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
  const taBortAnställdMedKonfirmation = useCallback(async (id: number) => {
    setDeleteAnställdId(id);
    setShowDeleteAnställdModal(true);
  }, []);

  const confirmDeleteAnställd = useCallback(async () => {
    if (!deleteAnställdId) return;

    setShowDeleteAnställdModal(false);

    try {
      const result = await taBortAnställd(deleteAnställdId);
      if (result.success) {
        removeAnställd(deleteAnställdId);
        // Om den borttagna anställda var vald, rensa valet
        if (valdAnställd && "id" in valdAnställd && valdAnställd.id === deleteAnställdId) {
          setValdAnställd(null);
        }

        setAnställdaError(null);
      } else {
        setAnställdaError(result.error || "Ett fel uppstod vid borttagning");
      }
    } catch (error) {
      console.error("Fel vid borttagning:", error);
      setAnställdaError("Ett fel uppstod vid borttagning");
    } finally {
      setDeleteAnställdId(null);
    }
  }, [removeAnställd, valdAnställd, setValdAnställd, setAnställdaError, deleteAnställdId]);

  // Hantera klick på anställd (ladda full data och sätt som vald)
  const hanteraAnställdKlick = useCallback(
    async (anställdId: number) => {
      await laddaAnställd(anställdId);
    },
    [laddaAnställd]
  );

  // ===========================================
  // LÖNESPEC LISTA - För LonespecList.tsx (flyttad från useAnstalldalonespecList)
  // ===========================================

  const handleTaBortLönespec = useCallback(
    async (lönespecId: string) => {
      if (!enableLonespecMode) return;

      setDeleteLönespecId(parseInt(lönespecId));
      setShowDeleteLönespecModal(true);
    },
    [enableLonespecMode]
  );

  const confirmDeleteLönespec = useCallback(async () => {
    if (!deleteLönespecId) return;

    setShowDeleteLönespecModal(false);

    setTaBortLaddning((prev) => ({ ...prev, [deleteLönespecId]: true }));
    try {
      const resultat = await taBortLönespec(deleteLönespecId);
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
      setTaBortLaddning((prev) => ({ ...prev, [deleteLönespecId]: false }));
    }
  }, [deleteLönespecId, onLönespecUppdaterad]);

  const handleNavigateToLonekorning = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/personal/Lonekorning";
    }
  }, []);

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

  // NY ANSTÄLLD FORMULÄR FUNKTIONER - flyttade från useNyAnstalld.ts

  // Update formulär with partial data
  const updateNyAnställdFormulär = useCallback(
    (updates: Partial<typeof nyAnställdFormulär>) => {
      if (!enableNyAnstalldMode) return;
      setNyAnställdFormulär((prev) => {
        const newState = { ...prev, ...updates };
        return newState;
      });
    },
    [enableNyAnstalldMode]
  );

  // Handle input changes
  const handleSanitizedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      if (!enableNyAnstalldMode) return;
      const { name, value } = e.target;

      updateNyAnställdFormulär({ [name]: value });
    },
    [enableNyAnstalldMode, updateNyAnställdFormulär]
  );

  // Reset formulär
  const rensaFormulär = useCallback(() => {
    if (!enableNyAnstalldMode) return;
    setNyAnställdFormulär(initialNyAnställdFormulär);
  }, [enableNyAnstalldMode]);

  const avbrytNyAnställd = useCallback(() => {
    if (!enableNyAnstalldMode) return;
    rensaFormulär();
    döljNyAnställd();
    onNyAnstalldCancel?.();
  }, [enableNyAnstalldMode, döljNyAnställd, onNyAnstalldCancel, rensaFormulär]);

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
        taBortAnställdMedKonfirmation(anställd.id);
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

  // NY ANSTÄLLD form action effect - flyttad från useNyAnstalld.ts
  useEffect(() => {
    if (!enableNyAnstalldMode || !actionState || typeof actionState !== "object") return;

    if (actionState.success) {
      showToast(actionState.message || "Anställd sparad!", "success");
      rensaFormulär();
      döljNyAnställd();
      onNyAnstalldSaved?.();
    } else if (actionState.message) {
      showToast(actionState.message, "error");
    }
  }, [enableNyAnstalldMode, actionState, döljNyAnställd, onNyAnstalldSaved, rensaFormulär]);

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

      // Lönespec state (når enableLonespecMode)
      lönespecar: enableLonespecMode ? lönespecar : [],
      taBortLaddning: enableLonespecMode ? taBortLaddning : {},

      // NY ANSTÄLLD state (när enableNyAnstalldMode)
      nyAnställdFormulär: enableNyAnstalldMode ? nyAnställdFormulär : initialNyAnställdFormulär,
      nyAnställdLoading: enableNyAnstalldMode ? nyAnställdLoading : false,

      // Modal states
      showDeleteAnställdModal,
      deleteAnställdId,
      showDeleteLönespecModal,
      deleteLönespecId,
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
      taBortAnställdFrånLista: taBortAnställdMedKonfirmation,
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

      // Lönespec handlers (när enableLonespecMode)
      handleTaBortLönespec: enableLonespecMode ? handleTaBortLönespec : () => {},
      handleNavigateToLonekorning: enableLonespecMode ? handleNavigateToLonekorning : () => {},

      // NY ANSTÄLLD handlers (när enableNyAnstalldMode)
      updateNyAnställdFormulär: enableNyAnstalldMode ? updateNyAnställdFormulär : () => {},
      handleSanitizedChange: enableNyAnstalldMode ? handleSanitizedChange : () => {},
      rensaFormulär: enableNyAnstalldMode ? rensaFormulär : () => {},
      avbrytNyAnställd: enableNyAnstalldMode ? avbrytNyAnställd : () => {},

      // Modal handlers
      confirmDeleteAnställd,
      confirmDeleteLönespec,
      setShowDeleteAnställdModal,
      setShowDeleteLönespecModal,
    },

    // Form actions (när enableNyAnstalldMode)
    form: enableNyAnstalldMode
      ? {
          actionState,
          formAction: formAction || (() => {}),
          isPending: isPending || false,
        }
      : {
          actionState: null,
          formAction: () => {},
          isPending: false,
        },

    // Specialized hooks
    useAnställdRad,
  };
}
