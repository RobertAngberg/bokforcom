"use client";

import { useState, useEffect, useMemo } from "react";
import { dateToYyyyMmDd } from "../../_utils/datum";
import type { EditData, AnställdData, AnställdListItem } from "../types/types";
import { sparaAnstalld } from "../actions/anstalldaActions";

const initialEditData: EditData = {
  anställningstyp: "",
  startdatum: new Date(),
  slutdatum: new Date(),
  månadslön: "",
  betalningssätt: "",
  kompensation: "",
  ersättningPer: "",
  arbetsbelastning: "",
  arbetsvecka_timmar: "",
  deltidProcent: "",
  skattetabell: "",
  skattekolumn: "",
  jobbtitel: "",
  semesterdagarPerÅr: "",
  tjänsteställeAdress: "",
  tjänsteställeOrt: "",
};

export function useKontrakt(initial?: AnställdListItem) {
  // Egen state istället för PersonalContext
  const [valdAnställd, setValdAnställd] = useState<AnställdData | null>(null);
  const [kontraktIsEditing, setKontraktIsEditing] = useState(false);
  const [kontraktEditData, setKontraktEditData] = useState<EditData>(initialEditData);
  const [kontraktHasChanges, setKontraktHasChanges] = useState(false);
  const [kontraktError, setKontraktError] = useState<string | null>(null);

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
    arbetsvecka_timmar: "",
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
  const buildEditData = (a: AnställdListItem | AnställdData): EditData => {
    // Helper to safely get string value
    const getString = (key: string): string => {
      const val = a[key as keyof typeof a];
      return val != null ? String(val) : "";
    };

    // Helper to safely get date
    const getDate = (key: string): Date => {
      const val = a[key as keyof typeof a];
      return val ? new Date(String(val)) : new Date();
    };

    return {
      anställningstyp: getString("anställningstyp"),
      startdatum: getDate("startdatum"),
      slutdatum: getDate("slutdatum"),
      månadslön: getString("månadslön"),
      betalningssätt: getString("betalningssätt"),
      kompensation: getString("kompensation"),
      ersättningPer: getString("ersättningPer") || getString("ersättning_per"),
      arbetsbelastning: getString("arbetsbelastning"),
      arbetsvecka_timmar: getString("arbetsvecka_timmar"),
      deltidProcent: getString("deltidProcent") || getString("deltid_procent"),
      skattetabell: getString("skattetabell"),
      skattekolumn: getString("skattekolumn"),
      jobbtitel: getString("jobbtitel"),
      semesterdagarPerÅr: getString("semesterdagarPerÅr") || getString("semesterdagar_per_år"),
      tjänsteställeAdress: getString("tjänsteställeAdress") || getString("tjänsteställe_adress"),
      tjänsteställeOrt: getString("tjänsteställeOrt") || getString("tjänsteställe_ort"),
    };
  };

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

  const onInit = (source?: AnställdListItem | AnställdData) => {
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

  const onChange = (name: keyof EditData | string, value: string | number | Date) => {
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
        startdatum: dateToYyyyMmDd(editData.startdatum),
        slutdatum: dateToYyyyMmDd(editData.slutdatum),
        jobbtitel: editData.jobbtitel,
        ersättningPer: editData.ersättningPer,
        kompensation: editData.kompensation,
        arbetsbelastning: editData.arbetsbelastning,
        arbetsvecka_timmar: editData.arbetsvecka_timmar,
        deltidProcent: editData.deltidProcent,
        skattetabell: parseInt(editData.skattetabell, 10) || 0,
        skattekolumn: parseInt(editData.skattekolumn, 10) || 0,
        tjänsteställeAdress: editData.tjänsteställeAdress,
        tjänsteställeOrt: editData.tjänsteställeOrt,
      } as AnställdData;

      const result = await sparaAnstalld(payload, visningsAnställd.id as number);
      if (result?.success && valdAnställd) {
        // Uppdatera store med sparade värden
        setValdAnställd({
          ...valdAnställd,
          anställningstyp: editData.anställningstyp,
          startdatum: payload.startdatum,
          slutdatum: payload.slutdatum,
          jobbtitel: editData.jobbtitel,
          ersättningPer: editData.ersättningPer,
          kompensation: editData.kompensation,
          arbetsbelastning: editData.arbetsbelastning,
          arbetsvecka_timmar: editData.arbetsvecka_timmar,
          deltidProcent: editData.deltidProcent,
          skattetabell: parseInt(editData.skattetabell, 10) || 0,
          skattekolumn: parseInt(editData.skattekolumn, 10) || 0,
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
    } catch {
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
        const bel = visningsAnställd?.arbetsbelastning as string | undefined;
        const deltid = visningsAnställd?.deltidProcent;
        const arbetsvecka = visningsAnställd?.arbetsvecka_timmar;
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
