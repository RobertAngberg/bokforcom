"use client";

import { useState, useEffect, useCallback } from "react";
import {
  hämtaSemesterTransaktioner,
  sparaSemesterTransaktion,
  bokförSemester,
} from "../actions/semesterActions";
import { beräknaSemesterpenning } from "../utils/semesterBerakningar";
import type {
  SemesterBoxField,
  SemesterBoxSummary,
  BokföringsRad,
  UseSemesterProps,
  UseSemesterReturn,
} from "../types/types";
import { showToast } from "../../_components/Toast";

export function useSemester({
  anställdId,
  anställdKompensation,
  userId,
}: UseSemesterProps): UseSemesterReturn {
  // State
  const [showBokforKnapp, setShowBokforKnapp] = useState(false);
  const [summary, setSummary] = useState<SemesterBoxSummary>({
    betalda_dagar: 0,
    sparade_dagar: 0,
    skuld: 0,
    komp_dagar: 0,
  });
  const [prevSummary, setPrevSummary] = useState<SemesterBoxSummary | null>(null);
  const [editingField, setEditingField] = useState<SemesterBoxField | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
  const [bokforRows, setBokforRows] = useState<BokföringsRad[]>([]);

  // Hämta data vid laddning
  const hämtaData = useCallback(async () => {
    setLoading(true);
    try {
      const transaktioner = await hämtaSemesterTransaktioner(anställdId);
      // Förväntar oss EN rad per anställd
      const t = transaktioner[0] || {};
      const newSummary = {
        betalda_dagar: Number(t.betalda_dagar) || 0,
        sparade_dagar: Number(t.sparade_dagar) || 0,
        skuld: Number(t.skuld) || 0,
        komp_dagar: Number(t.komp_dagar) || 0,
      };
      setPrevSummary(summary); // Spara tidigare värde
      setSummary(newSummary);
      setShowBokforKnapp(t.bokförd === false);
    } catch (error) {
      console.error("Fel vid hämtning av semesterdata:", error);
      showToast("Kunde inte hämta semesterdata", "error");
    } finally {
      setLoading(false);
    }
  }, [anställdId, summary]);

  // Ladda data vid ändring av anställdId
  useEffect(() => {
    hämtaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anställdId]);

  // Hantera manuell redigering av semesterbox
  const handleEditField = useCallback((fieldName: SemesterBoxField, currentValue: number) => {
    setEditingField(fieldName);
    setEditValue(currentValue.toString());
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingField || !editValue || !summary) return;
    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) {
      showToast("Ogiltigt nummer", "error");
      return;
    }
    setLoading(true);
    try {
      // Skicka kolumnnamn och nytt värde direkt
      if (newValue !== summary[editingField]) {
        await sparaSemesterTransaktion({
          anställdId,
          kolumn: editingField, // "betalda_dagar", "sparade_dagar", "skuld", "komp_dagar"
          nyttVärde: newValue,
        });
        setPrevSummary(summary);
        setSummary((prev) => ({
          ...prev,
          [editingField]: newValue,
        }));
        setShowBokforKnapp(true);
      }
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error("Fel vid sparande:", error);
      showToast("Kunde inte spara ändringen", "error");
    } finally {
      setLoading(false);
    }
  }, [editingField, editValue, summary, anställdId]);

  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  // Hantera ESC-tangent för att avbryta redigering
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingField) {
        handleCancelEdit();
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [editingField, handleCancelEdit]);

  // Bokföringsberäkningar enligt Bokio
  const calculateBokföringRows = useCallback(
    (deltaDagar: number): BokföringsRad[] => {
      if (deltaDagar === 0) {
        return [
          {
            konto: "2920",
            kontoNamn: "Upplupna semesterlöner",
            debet: 0,
            kredit: 0,
            beskrivning: "Semesterjustering",
          },
          {
            konto: "2940",
            kontoNamn: "Upplupna lagstadgade sociala och andra avgifter",
            debet: 0,
            kredit: 0,
            beskrivning: "Semesterjustering",
          },
          {
            konto: "7290",
            kontoNamn: "Förändring av semesterlöneskuld",
            debet: 0,
            kredit: 0,
            beskrivning: "Semesterjustering",
          },
          {
            konto: "7519",
            kontoNamn: "Sociala avgifter för semester- och löneskulder",
            debet: 0,
            kredit: 0,
            beskrivning: "Semesterjustering",
          },
        ];
      }

      // Beräkna belopp baserat på delta med korrekt sammalöneregeln
      // Använd centraliserad beräkning: månadslön × 0.0043 × antal dagar
      const { totaltBelopp: semesterlön } = beräknaSemesterpenning(
        anställdKompensation,
        Math.abs(deltaDagar),
        true // Inkludera 12% semesterersättning
      );

      // Sociala avgifter: 31.42% av semesterlön
      const socialaAvgifter = semesterlön * 0.3142;

      // Justera tecken baserat på om det är ökning eller minskning
      const adjustedSemesterlön = deltaDagar > 0 ? semesterlön : -semesterlön;
      const adjustedSocialaAvgifter = deltaDagar > 0 ? socialaAvgifter : -socialaAvgifter;

      // Skapa bokföringsrader med korrekt debet/kredit
      return [
        {
          konto: "2920",
          kontoNamn: "Upplupna semesterlöner",
          debet: adjustedSemesterlön > 0 ? Math.round(adjustedSemesterlön) : 0,
          kredit: adjustedSemesterlön < 0 ? Math.abs(Math.round(adjustedSemesterlön)) : 0,
          beskrivning: "Semesterjustering",
        },
        {
          konto: "2940",
          kontoNamn: "Upplupna lagstadgade sociala och andra avgifter",
          debet: adjustedSocialaAvgifter > 0 ? Math.round(adjustedSocialaAvgifter) : 0,
          kredit: adjustedSocialaAvgifter < 0 ? Math.abs(Math.round(adjustedSocialaAvgifter)) : 0,
          beskrivning: "Semesterjustering",
        },
        {
          konto: "7290",
          kontoNamn: "Förändring av semesterlöneskuld",
          debet: adjustedSemesterlön < 0 ? Math.abs(Math.round(adjustedSemesterlön)) : 0,
          kredit: adjustedSemesterlön > 0 ? Math.round(adjustedSemesterlön) : 0,
          beskrivning: "Semesterjustering",
        },
        {
          konto: "7519",
          kontoNamn: "Sociala avgifter för semester- och löneskulder",
          debet: adjustedSocialaAvgifter < 0 ? Math.abs(Math.round(adjustedSocialaAvgifter)) : 0,
          kredit: adjustedSocialaAvgifter > 0 ? Math.round(adjustedSocialaAvgifter) : 0,
          beskrivning: "Semesterjustering",
        },
      ];
    },
    [anställdKompensation]
  );

  // Funktion för att räkna ut och visa bokföringsrader enligt Bokio
  const handleOpenBokforModal = useCallback(() => {
    // Räkna ut delta (förändring) i dagar
    const prevDagar = prevSummary ? prevSummary.betalda_dagar + prevSummary.sparade_dagar : 0;
    const currDagar = summary.betalda_dagar + summary.sparade_dagar;
    const deltaDagar = currDagar - prevDagar;

    const rows = calculateBokföringRows(deltaDagar);
    setBokforRows(rows);
    setBokforModalOpen(true);
  }, [prevSummary, summary, calculateBokföringRows]);

  const handleConfirmBokfor = useCallback(
    async (kommentar: string) => {
      setLoading(true);
      try {
        // Mappa om bokforRows till rätt format för bokförSemester
        const rader = bokforRows.map((row) => ({
          kontobeskrivning: `${row.konto} ${row.kontoNamn}`,
          belopp: row.debet !== 0 ? row.debet : -row.kredit, // Debet positivt, Kredit negativt
        }));

        const res = await bokförSemester({
          userId,
          rader,
          kommentar,
          datum: new Date().toISOString(),
        });

        setBokforModalOpen(false);
        if (res?.success) {
          showToast("Bokföring sparad!", "success");
          setShowBokforKnapp(false);
        } else {
          showToast(`Fel vid bokföring: ${res?.error || "Okänt fel"}`, "error");
        }
      } catch (error) {
        showToast(`Fel vid bokföring: ${error instanceof Error ? error.message : error}`, "error");
      } finally {
        setLoading(false);
      }
    },
    [bokforRows, userId]
  );

  const clearToast = useCallback(() => {
    // Toast clearing not needed with global showToast
  }, []);

  return {
    // State
    showBokforKnapp,
    summary,
    prevSummary,
    editingField,
    editValue,
    loading,
    bokforModalOpen,
    bokforRows,

    // Actions
    hämtaData,
    handleEditField,
    handleSaveEdit,
    handleCancelEdit,
    handleOpenBokforModal,
    handleConfirmBokfor,
    setEditValue,
    setBokforModalOpen,
    clearToast,
  };
}
