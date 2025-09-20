"use client";

import { useState, useEffect, useMemo } from "react";
import type { EditData, AnställdData } from "../_types/types";
import { sparaAnställd } from "../_actions/anstalldaActions";

const initialEditData: EditData = {
  anställningstyp: "",
  startdatum: new Date(),
  slutdatum: new Date(),
  månadslön: "",
  betalningssätt: "",
  kompensation: "",
  ersättningPer: "",
  arbetsbelastning: "",
  arbetsveckaTimmar: "",
  deltidProcent: "",
  skattetabell: "",
  skattekolumn: "",
  jobbtitel: "",
  semesterdagarPerÅr: "",
  tjänsteställeAdress: "",
  tjänsteställeOrt: "",
};

export function useKontrakt(initial?: Partial<AnställdData> | any) {
  // Egen state istället för PersonalContext
  const [valdAnställd, setValdAnställd] = useState<AnställdData | null>(null);
  const [kontraktIsEditing, setKontraktIsEditing] = useState(false);
  const [kontraktEditData, setKontraktEditData] = useState<EditData>(initialEditData);
  const [kontraktHasChanges, setKontraktHasChanges] = useState(false);
  const [kontraktError, setKontraktError] = useState<string | null>(null);

  const updateKontraktEditData = (field: string, value: any) => {
    setKontraktEditData((prev) => ({ ...prev, [field]: value }));
  };

  const resetKontraktEditData = () => {
    setKontraktEditData(initialEditData);
  };

  // Local state för originalData
  const [originalData, setOriginalData] = useState<EditData>({
    anställningstyp: "",
    startdatum: new Date(),
    slutdatum: new Date(),
    månadslön: "",
    betalningssätt: "",
    kompensation: "",
    ersättningPer: "",
    arbetsbelastning: "",
    arbetsveckaTimmar: "",
    deltidProcent: "",
    skattetabell: "",
    skattekolumn: "",
    jobbtitel: "",
    semesterdagarPerÅr: "",
    tjänsteställeAdress: "",
    tjänsteställeOrt: "",
  });

  const anställningstypOptions = [
    { value: "", label: "Välj anställningstyp" },
    { value: "Tillsvidare", label: "Tillsvidare" },
    { value: "Visstid", label: "Visstid" },
    { value: "Provanställning", label: "Provanställning" },
    { value: "Säsongsanställning", label: "Säsongsanställning" },
    { value: "Månadslön", label: "Månadslön" },
  ];

  const arbetsbelastningOptions = [
    { value: "", label: "Välj arbetsbelastning" },
    { value: "Heltidsanställd", label: "Heltidsanställd" },
    { value: "Deltidsanställd", label: "Deltidsanställd" },
  ];

  const lonOptions = {
    ersättningPer: [
      { value: "", label: "Välj period" },
      { value: "Månad", label: "Månad" },
      { value: "Timme", label: "Timme" },
      { value: "Dag", label: "Dag" },
      { value: "Vecka", label: "Vecka" },
      { value: "År", label: "År" },
    ],
  };

  const skattOptions = {
    skattetabell: [
      { value: "", label: "Välj skattetabell" },
      ...Array.from({ length: 14 }, (_, i) => ({
        value: (29 + i).toString(),
        label: `Tabell ${29 + i}`,
      })),
    ],
    skattekolumn: [
      { value: "", label: "Välj skattekolumn" },
      ...Array.from({ length: 6 }, (_, i) => ({
        value: (1 + i).toString(),
        label: `Kolumn ${1 + i}`,
      })),
    ],
  };

  // Bygg EditData från en vald anställd
  const buildEditData = (a: Partial<AnställdData> | any): EditData => ({
    anställningstyp: a?.anställningstyp || "",
    startdatum: a?.startdatum ? new Date(a.startdatum) : new Date(),
    slutdatum: a?.slutdatum ? new Date(a.slutdatum) : new Date(),
    månadslön: a?.månadslön?.toString?.() || "",
    betalningssätt: a?.betalningssätt || "",
    kompensation: a?.kompensation?.toString?.() || "",
    ersättningPer: a?.ersättningPer || a?.ersättning_per || "",
    arbetsbelastning: a?.arbetsbelastning || "",
    arbetsveckaTimmar: a?.arbetsvecka?.toString?.() || a?.arbetsvecka_timmar?.toString?.() || "",
    deltidProcent: a?.deltidProcent?.toString?.() || a?.deltid_procent?.toString?.() || "",
    skattetabell: a?.skattetabell?.toString?.() || "",
    skattekolumn: a?.skattekolumn?.toString?.() || "",
    jobbtitel: a?.jobbtitel || "",
    semesterdagarPerÅr:
      a?.semesterdagarPerÅr?.toString?.() || a?.semesterdagar_per_år?.toString?.() || "",
    tjänsteställeAdress: a?.tjänsteställeAdress || a?.tjänsteställe_adress || "",
    tjänsteställeOrt: a?.tjänsteställeOrt || a?.tjänsteställe_ort || "",
  });

  // Visnings-anställd: store valdAnställd i första hand, annars initial prop
  const visningsAnställd = useMemo(() => valdAnställd ?? initial ?? null, [valdAnställd, initial]);
  // Hämta state från context
  const {
    isEditing,
    editData,
    error: errorMessage,
  } = {
    isEditing: kontraktIsEditing,
    editData: kontraktEditData,
    error: kontraktError,
  };

  // Initiera formulärdata när vi får källa och inte redigerar
  useEffect(() => {
    const källa = visningsAnställd;
    if (!källa || isEditing) return;
    const data = buildEditData(källa);
    setKontraktEditData(data);
    setOriginalData(data);
    setKontraktHasChanges(false);
    setKontraktError(null);
  }, [visningsAnställd, isEditing, setKontraktEditData, setKontraktError]);

  const onInit = (source?: Partial<AnställdData> | any) => {
    if (!source || isEditing) return;
    const data = buildEditData(source);
    setKontraktEditData(data);
    setOriginalData(data);
    setKontraktHasChanges(false);
    setKontraktError(null);
  };

  const onEdit = () => {
    if (!visningsAnställd) return;
    setKontraktIsEditing(true);
    const data = buildEditData(visningsAnställd);
    setKontraktEditData(data);
    setOriginalData(data);
    setKontraktHasChanges(false);
    setKontraktError(null);
  };

  const onChange = (name: keyof EditData | string, value: any) => {
    const next = { ...editData, [name]: value } as EditData;
    if (name === "arbetsbelastning" && value !== "Deltidsanställd") {
      next.deltidProcent = "";
    }
    setKontraktEditData(next);
    setKontraktHasChanges(JSON.stringify(next) !== JSON.stringify(originalData));
    if (errorMessage) setKontraktError(null);
  };

  const onSave = async () => {
    if (!visningsAnställd || !kontraktHasChanges) return;
    try {
      const payload: AnställdData = {
        ...visningsAnställd,
        anställningstyp: editData.anställningstyp,
        startdatum: editData.startdatum.toISOString().split("T")[0],
        slutdatum: editData.slutdatum.toISOString().split("T")[0],
        jobbtitel: editData.jobbtitel,
        ersättningPer: editData.ersättningPer,
        kompensation: editData.kompensation,
        arbetsbelastning: editData.arbetsbelastning,
        arbetsvecka: editData.arbetsveckaTimmar,
        deltidProcent: editData.deltidProcent,
        skattetabell: editData.skattetabell,
        skattekolumn: editData.skattekolumn,
        tjänsteställeAdress: editData.tjänsteställeAdress,
        tjänsteställeOrt: editData.tjänsteställeOrt,
      } as AnställdData;

      const result = await sparaAnställd(payload, visningsAnställd.id);
      if (result?.success) {
        // Uppdatera store med sparade värden
        setValdAnställd({
          ...(valdAnställd ?? visningsAnställd),
          anställningstyp: editData.anställningstyp,
          startdatum: payload.startdatum,
          slutdatum: payload.slutdatum,
          jobbtitel: editData.jobbtitel,
          ersättningPer: editData.ersättningPer,
          kompensation: editData.kompensation,
          arbetsbelastning: editData.arbetsbelastning,
          arbetsvecka: editData.arbetsveckaTimmar,
          deltidProcent: editData.deltidProcent,
          skattetabell: editData.skattetabell,
          skattekolumn: editData.skattekolumn,
          tjänsteställeAdress: editData.tjänsteställeAdress,
          tjänsteställeOrt: editData.tjänsteställeOrt,
        });

        setOriginalData(editData);
        setKontraktHasChanges(false);
        setKontraktIsEditing(false);
        setKontraktError(null);
      } else {
        setKontraktError(result?.error || "Kunde inte spara");
      }
    } catch (e) {
      setKontraktError("Ett fel uppstod vid sparande");
    }
  };

  const onCancel = () => {
    setKontraktEditData(originalData);
    setKontraktIsEditing(false);
    setKontraktHasChanges(false);
    setKontraktError(null);
  };

  return {
    state: {
      valdAnställd,
      visningsAnställd,
      isEditing,
      editData,
      hasChanges: kontraktHasChanges,
      errorMessage,
      originalData,
      anställningstypOptions,
      arbetsbelastningOptions,
      lonOptions,
      skattOptions,
      // Derived display for view mode (to keep components UI-only)
      arbetsbelastningDisplay: (() => {
        const bel = (visningsAnställd as any)?.arbetsbelastning;
        const deltid = (visningsAnställd as any)?.deltidProcent;
        const arbetsvecka = (visningsAnställd as any)?.arbetsvecka;
        const arbetsbelastningText =
          bel === "Deltidsanställd" && deltid ? `${bel} (${deltid}%)` : bel || "";
        const arbetsveckaText = arbetsvecka ? `${arbetsvecka} timmar` : "";
        return { arbetsbelastningText, arbetsveckaText };
      })(),
    },
    handlers: {
      setIsEditing: setKontraktIsEditing,
      setEditData: setKontraktEditData,
      setHasChanges: setKontraktHasChanges,
      setError: setKontraktError,
      setOriginalData,
      onInit,
      onEdit,
      onChange,
      onSave,
      onCancel,
    },
  };
}

// Context to be avoided per project conventions (Zustand + hook + props)
