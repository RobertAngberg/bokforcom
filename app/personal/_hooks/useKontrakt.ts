"use client";

import { useState, useEffect, useMemo } from "react";
import { usePersonalStore } from "../_stores/personalStore";
import type { EditData, AnställdData } from "../_types/types";
import { sparaAnställd } from "../_actions/anstalldaActions";

export function useKontrakt(initial?: Partial<AnställdData> | any) {
  const { valdAnställd, setValdAnställd } = usePersonalStore();

  // Local editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditData>({
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
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  // Initiera formulärdata när vi får källa och inte redigerar
  useEffect(() => {
    const källa = visningsAnställd;
    if (!källa || isEditing) return;
    const data = buildEditData(källa);
    setEditData(data);
    setOriginalData(data);
    setHasChanges(false);
    setErrorMessage(null);
  }, [visningsAnställd, isEditing]);

  const onInit = (source?: Partial<AnställdData> | any) => {
    if (!source || isEditing) return;
    const data = buildEditData(source);
    setEditData(data);
    setOriginalData(data);
    setHasChanges(false);
    setErrorMessage(null);
  };

  const onEdit = () => {
    if (!visningsAnställd) return;
    setIsEditing(true);
    const data = buildEditData(visningsAnställd);
    setEditData(data);
    setOriginalData(data);
    setHasChanges(false);
    setErrorMessage(null);
  };

  const onChange = (name: keyof EditData | string, value: any) => {
    const next = { ...editData, [name]: value } as EditData;
    if (name === "arbetsbelastning" && value !== "Deltidsanställd") {
      next.deltidProcent = "";
    }
    setEditData(next);
    setHasChanges(JSON.stringify(next) !== JSON.stringify(originalData));
    if (errorMessage) setErrorMessage(null);
  };

  const onSave = async () => {
    if (!visningsAnställd || !hasChanges) return;
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
        setHasChanges(false);
        setIsEditing(false);
        setErrorMessage(null);
      } else {
        setErrorMessage(result?.error || "Kunde inte spara");
      }
    } catch (e) {
      setErrorMessage("Ett fel uppstod vid sparande");
    }
  };

  const onCancel = () => {
    setEditData(originalData);
    setIsEditing(false);
    setHasChanges(false);
    setErrorMessage(null);
  };

  return {
    state: {
      valdAnställd,
      visningsAnställd,
      isEditing,
      editData,
      hasChanges,
      errorMessage,
      originalData,
      anställningstypOptions,
      arbetsbelastningOptions,
    },
    handlers: {
      setIsEditing,
      setEditData,
      setHasChanges,
      setErrorMessage,
      setOriginalData,
      onInit,
      onEdit,
      onChange,
      onSave,
      onCancel,
    },
  };
}
