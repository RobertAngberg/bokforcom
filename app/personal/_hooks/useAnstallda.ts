"use client";

import { useCallback, useEffect, useState } from "react";
import { usePersonalStore } from "../_stores/personalStore";
import {
  hämtaAllaAnställda,
  hämtaAnställd,
  taBortAnställd,
  sparaAnställd,
} from "../_actions/anstalldaActions";
import type { AnställdData, AnställdListItem, UtlaggBokföringsRad } from "../_types/types";
import { ColumnDefinition } from "../../_components/Tabell";

export function useAnstallda() {
  // ===========================================
  // STORE STATE - Hämta från personalStore
  // ===========================================
  const {
    anställda,
    valdAnställd,
    anställdaLoading,
    anställdLoading,
    anställdLoadingId,
    anställdaError,
    visaNyAnställdFormulär,
    nyAnställdFormulär,
    setAnställda,
    setValdAnställd,
    setAnställdaLoading,
    setAnställdLoading,
    setAnställdLoadingId,
    setAnställdaError,
    addAnställd,
    removeAnställd,
    updateAnställd,
    setVisaNyAnställdFormulär,
    utläggBokföringModal,
    closeUtläggBokföringModal,
    utlägg,
    utläggLoading,
    showToast,
  } = usePersonalStore();

  // ===========================================
  // PERSONALINFORMATION - Lokal edit-state i hook
  // ===========================================

  type PersonalEditData = {
    förnamn: string;
    efternamn: string;
    personnummer: string;
    jobbtitel: string;
    clearingnummer: string;
    bankkonto: string;
    mail: string;
    adress: string;
    postnummer: string;
    ort: string;
  };

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
        showToast("Personalinformation sparad", "success");
      } else {
        setPersonalErrorMessage(result?.error || "Kunde inte spara");
        showToast(result?.error || "Kunde inte spara", "error");
      }
    } catch (e) {
      setPersonalErrorMessage("Ett fel uppstod vid sparande");
      showToast("Ett fel uppstod vid sparande", "error");
    }
  }, [valdAnställd, personalHasChanges, personalEditData, setValdAnställd, showToast]);

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
          showToast("Anställd borttagen", "success");
          setAnställdaError(null);
        } else {
          setAnställdaError(result.error || "Ett fel uppstod vid borttagning");
          showToast(result.error || "Kunde inte ta bort anställd", "error");
        }
      } catch (error) {
        console.error("Fel vid borttagning:", error);
        setAnställdaError("Ett fel uppstod vid borttagning");
        showToast("Ett fel uppstod vid borttagning", "error");
      }
    },
    [removeAnställd, valdAnställd, setValdAnställd, setAnställdaError, showToast]
  );

  // Hantera klick på anställd (ladda full data och sätt som vald)
  const hanteraAnställdKlick = useCallback(
    async (anställdId: number) => {
      await laddaAnställd(anställdId);
    },
    [laddaAnställd]
  );

  // Wrapper för taBortAnställd som matchar AnställdaLista interface
  const taBortAnställdFrånLista = useCallback(
    (id: number) => {
      const anställd = anställda.find((a) => a.id === id);
      if (anställd) {
        taBortAnställdMedKonfirmation(id, anställd.namn);
      }
    },
    [anställda, taBortAnställdMedKonfirmation]
  );

  // Hantera anställd vald med parent callback
  const hanteraAnställdValdMedCallback = useCallback(
    async (anställdId: number, onAnställdVald?: (anställd: any) => void) => {
      await hanteraAnställdKlick(anställdId);
      if (valdAnställd && onAnställdVald) {
        onAnställdVald(valdAnställd);
      }
    },
    [hanteraAnställdKlick, valdAnställd]
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
    showToast("Ny anställd sparad!", "success");
  }, [laddaAnställda, setVisaNyAnställdFormulär, showToast]);

  // Spara ny anställd från formuläret
  const sparaNyAnställd = useCallback(async () => {
    try {
      setAnställdLoading(true);

      // Konvertera datum till ISO format
      const data = {
        ...nyAnställdFormulär,
        startdatum: nyAnställdFormulär.startdatum?.toISOString().split("T")[0] || "",
        slutdatum: nyAnställdFormulär.slutdatum?.toISOString().split("T")[0] || "",
      };

      const result = await sparaAnställd(data);

      if (result.success) {
        showToast("Anställd sparad framgångsrikt! 🎉", "success");
        await hanteraNyAnställdSparad();
      } else {
        showToast(result.error || "Ett fel uppstod vid sparande", "error");
      }
    } catch (error) {
      showToast("Ett fel uppstod vid sparande", "error");
    } finally {
      setAnställdLoading(false);
    }
  }, [nyAnställdFormulär, showToast, hanteraNyAnställdSparad, setAnställdLoading]);

  // ===========================================
  // ANSTÄLLD RAD - För AnställdaRad.tsx
  // ===========================================

  // Hantera borttagning med konfirmation
  const hanteraTaBortMedKonfirmation = useCallback(
    (anställdId: number, anställdNamn: string) => {
      if (window.confirm(`Är du säker på att du vill ta bort ${anställdNamn}?`)) {
        taBortAnställdMedKonfirmation(anställdId, anställdNamn);
      }
    },
    [taBortAnställdMedKonfirmation]
  );

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
        hanteraTaBortMedKonfirmation(anställd.id, anställd.namn);
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
    [anställdLoadingId, hanteraTaBortMedKonfirmation, hanteraRadKlick]
  );

  // ===========================================
  // UTLÄGG FLIK - För UtlaggFlik.tsx
  // ===========================================

  const utlaggFlikData = useCallback(() => {
    const columns = [
      {
        key: "datum",
        label: "Datum",
        render: (value: string) => (value ? new Date(value).toLocaleDateString("sv-SE") : ""),
      },
      {
        key: "belopp",
        label: "Belopp",
        render: (value: number) => `${value} kr`,
      },
      { key: "beskrivning", label: "Beskrivning" },
      { key: "status", label: "Status" },
      {
        key: "åtgärd",
        label: "Åtgärd",
        render: (_: any, row: any) => (row.status === "Väntande" ? null : null), // Placeholder för nu
      },
    ];

    return {
      columns,
      utlägg,
      loading: utläggLoading,
    };
  }, [utlägg, utläggLoading]);

  // ===========================================
  // UTLÄGG BOKFÖRING MODAL - För UtlaggBokforModal.tsx
  // ===========================================

  // Modal data för bokföring
  const utlaggModalData = useCallback(() => {
    const columns: ColumnDefinition<UtlaggBokföringsRad>[] = [
      { key: "kontonummer", label: "Konto" },
      { key: "beskrivning", label: "Beskrivning" },
      { key: "debet", label: "Debet", render: (v) => (v ? v + " kr" : "") },
      { key: "kredit", label: "Kredit", render: (v) => (v ? v + " kr" : "") },
    ];

    return {
      isOpen: utläggBokföringModal.isOpen && !!utläggBokföringModal.utlägg,
      utlägg: utläggBokföringModal.utlägg,
      previewRows: utläggBokföringModal.previewRows || [],
      columns,
      onClose: closeUtläggBokföringModal,
    };
  }, [utläggBokföringModal, closeUtläggBokföringModal]);

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
      sparaNyAnställd,
    },

    // Handlers
    handlers: {
      hanteraAnställdKlick,
      taBortAnställd: taBortAnställdMedKonfirmation,
      taBortAnställdFrånLista,
      visaNyAnställd,
      döljNyAnställd,
      hanteraNyAnställdSparad,
      // För AnställdaRad komponenter
      hanteraTaBortMedKonfirmation,
      hanteraRadKlick,

      // Personalinformation handlers
      personalOnEdit,
      personalOnChange,
      personalOnSave,
      personalOnCancel,
    },

    // Specialized hooks
    useAnställdRad,
    utlaggModalData,
    utlaggFlikData,
  };
}
