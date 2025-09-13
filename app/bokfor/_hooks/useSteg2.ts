"use client";

import { useState, useEffect, useCallback } from "react";
import { hämtaBokföringsmetod } from "../_actions/actions";
import { extractDataFromOCRKundfaktura } from "../_actions/ocrActions";
import { Step2Props } from "../_types/types";

export function useSteg2({
  belopp,
  setBelopp,
  transaktionsdatum,
  setTransaktionsdatum,
  kommentar,
  setKommentar,
  valtFörval,
  extrafält,
  setExtrafält,
  utlaggMode,
  bokförSomFaktura: initialBokförSomFaktura = false,
  setBokförSomFaktura: externalSetBokförSomFaktura,
  kundfakturadatum: initialKundfakturadatum = null,
  setKundfakturadatum: externalSetKundfakturadatum,
}: Partial<Step2Props>) {
  // State för fakturametod-funktionalitet
  const [bokföringsmetod, setBokföringsmetod] = useState<string>("");
  const [bokförSomFaktura, setBokförSomFaktura] = useState<boolean>(initialBokförSomFaktura);
  const [fakturadatum, setFakturadatum] = useState<string | null>(initialKundfakturadatum);
  const [ocrText, setOcrText] = useState<string>("");
  const [reprocessFile, setReprocessFile] = useState<(() => Promise<void>) | null>(null);
  const [visaLeverantorModal, setVisaLeverantorModal] = useState(false);

  // Heuristik: detektera kostnads- vs intäktskonton i valt förval
  const harIntaktskonto = valtFörval?.konton?.some((k) => k.kontonummer?.startsWith("3")) || false;
  const harKostnadskonto =
    valtFörval?.konton?.some((k) => /^(4|5|6|7|8)/.test(k.kontonummer ?? "")) || false;
  // Föreslå leverantörsfaktura om användaren kör fakturametoden, vi hittat kostnadskonto och inga intäktskonton
  const foreslaLevfakt =
    bokföringsmetod === "Fakturametoden" && harKostnadskonto && !harIntaktskonto;

  // DEBUG: Logga heuristik-data (utan att påverka logiken)
  useEffect(() => {
    try {
      const kontonData = (valtFörval?.konton || []).map((k) => ({
        kontonummer: k.kontonummer,
        debet: k.debet,
        kredit: k.kredit,
        klass: k.kontonummer ? k.kontonummer[0] : undefined,
      }));

      const extrafaltData = Object.fromEntries(
        Object.entries(extrafält || {}).map(([k, v]) => [k, v])
      );

      // Använd groupCollapsed för att inte spamma konsolen
      console.groupCollapsed("🧪 Heuristik Steg2 | foreslaLevfakt=" + foreslaLevfakt);
      console.log("bokföringsmetod:", bokföringsmetod);
      console.log("harIntaktskonto:", harIntaktskonto);
      console.log("harKostnadskonto:", harKostnadskonto);
      console.log("utlaggMode:", utlaggMode);
      if (valtFörval) {
        console.log("valtFörval.id:", (valtFörval as any).id);
        console.log("valtFörval.namn:", (valtFörval as any).namn);
      } else {
        console.log("valtFörval: none");
      }
      console.log("Extrafält:", extrafaltData);
      if (kontonData.length) {
        console.table(kontonData);
        const klasser = Array.from(new Set(kontonData.map((k) => k.klass))).filter(Boolean);
        console.log("Kontoklasser i valtFörval:", klasser.join(", "));
      } else {
        console.log("Inga konton i valtFörval ännu.");
      }
      console.groupEnd();
    } catch (err) {
      console.warn("Heuristik debug misslyckades:", err);
    }
  }, [
    bokföringsmetod,
    valtFörval,
    harIntaktskonto,
    harKostnadskonto,
    foreslaLevfakt,
    extrafält,
    utlaggMode,
  ]);

  // Sync med external state när det finns
  useEffect(() => {
    if (externalSetBokförSomFaktura) {
      externalSetBokförSomFaktura(bokförSomFaktura);
    }
  }, [bokförSomFaktura, externalSetBokförSomFaktura]);

  useEffect(() => {
    if (externalSetKundfakturadatum) {
      externalSetKundfakturadatum(fakturadatum);
    }
  }, [fakturadatum, externalSetKundfakturadatum]);

  // Hämta användarens bokföringsmetod
  useEffect(() => {
    const hämtaMetod = async () => {
      try {
        const metod = await hämtaBokföringsmetod();
        setBokföringsmetod(metod);
      } catch (error) {
        console.error("❌ Fel vid hämtning av bokföringsmetod:", error);
        setBokföringsmetod("Kontantmetoden");
      }
    };
    hämtaMetod();
  }, []);

  // Kör kundfaktura-AI när OCR-text finns och fakturamoden är aktiv
  useEffect(() => {
    if (bokförSomFaktura && ocrText && setBelopp && setFakturadatum) {
      const runKundfakturaAI = async () => {
        try {
          console.log("🧠 Kör AI-extraktion för kundfaktura (auto)...");
          const parsed = await extractDataFromOCRKundfaktura(ocrText);

          if (parsed?.fakturadatum) {
            setFakturadatum(parsed.fakturadatum);
          }
          if (parsed?.belopp && !isNaN(parsed.belopp)) {
            setBelopp(Number(parsed.belopp));
          }
        } catch (error) {
          console.error("❌ Fel vid AI-extraktion för kundfaktura (auto):", error);
        }
      };
      runKundfakturaAI();
    }
  }, [bokförSomFaktura, ocrText, setBelopp, setFakturadatum]);

  return {
    bokföringsmetod,
    setBokföringsmetod,
    bokförSomFaktura,
    setBokförSomFaktura,
    fakturadatum,
    setFakturadatum,
    ocrText,
    setOcrText,
    reprocessFile,
    setReprocessFile,
    visaLeverantorModal,
    setVisaLeverantorModal,
    harIntaktskonto,
    harKostnadskonto,
    foreslaLevfakt,
  };
}
