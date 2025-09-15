"use client";

import { useState, useEffect, useCallback } from "react";
import { hämtaBokföringsmetod } from "../_actions/actions";
import { extractDataFromOCRKundfaktura } from "../_actions/ocrActions";
import { useBokforStore } from "../_stores/bokforStore";

export function useSteg2() {
  // Hämta ALL data från Zustand store
  const {
    belopp,
    setBelopp,
    transaktionsdatum,
    setTransaktionsdatum,
    kommentar,
    setKommentar,
    valtFörval,
    extrafält,
    setExtrafält,
    currentStep,
    levfaktMode,
    utlaggMode,
    bokförSomFaktura,
    setBokförSomFaktura,
    fil,
    setFil,
    pdfUrl,
    setPdfUrl,
    leverantör,
    setLeverantör,
    setCurrentStep,
  } = useBokforStore();

  // Lokal state bara för denna komponent
  const [bokföringsmetod, setBokföringsmetod] = useState<string>("");
  const [fakturadatum, setFakturadatum] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [reprocessFile, setReprocessFile] = useState<(() => Promise<void>) | null>(null);
  const [visaLeverantorModal, setVisaLeverantorModal] = useState(false);

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

      // Debug information removed for production
    } catch (err) {
      console.warn("Heuristik debug misslyckades:", err);
    }
  }, [bokföringsmetod, valtFörval, extrafält, utlaggMode]);

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

  // Callback functions som komponenten behöver
  const handleOcrTextChange = useCallback((text: string) => {
    setOcrText(text);
  }, []);

  const handleReprocessTrigger = useCallback((reprocessFn: () => Promise<void>) => {
    setReprocessFile(() => reprocessFn);
  }, []);

  const handleCheckboxChange = useCallback(
    async (checked: boolean) => {
      setBokförSomFaktura(checked);

      if (checked && reprocessFile) {
        await reprocessFile();
      }
    },
    [reprocessFile, setBokförSomFaktura]
  );

  const handleLeverantorCheckboxChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        setVisaLeverantorModal(true);
      } else {
        setVisaLeverantorModal(false);
        setLeverantör(null);
      }
    },
    [setVisaLeverantorModal, setLeverantör]
  );

  const handleLeverantorRemove = useCallback(() => {
    setLeverantör(null);
    setVisaLeverantorModal(false);
  }, [setLeverantör, setVisaLeverantorModal]);

  const handleLeverantorSelected = useCallback(
    (leverantörData: any) => {
      setLeverantör(leverantörData);
      setVisaLeverantorModal(false);
    },
    [setLeverantör, setVisaLeverantorModal]
  );

  const handleLeverantorModalClose = useCallback(() => {
    setVisaLeverantorModal(false);
  }, [setVisaLeverantorModal]);

  return {
    state: {
      currentStep,
      belopp,
      transaktionsdatum,
      kommentar,
      valtFörval,
      extrafält,
      levfaktMode,
      utlaggMode,
      bokförSomFaktura,
      fil,
      pdfUrl,
      leverantör,
      bokföringsmetod,
      fakturadatum,
      visaLeverantorModal,
    },
    actions: {
      setBelopp,
      setTransaktionsdatum,
      setKommentar,
      setExtrafält,
      setFil,
      setPdfUrl,
      setLeverantör,
      setCurrentStep,
      setFakturadatum,
      setVisaLeverantorModal,
    },
    handlers: {
      handleOcrTextChange,
      handleReprocessTrigger,
      handleCheckboxChange,
      handleLeverantorCheckboxChange,
      handleLeverantorRemove,
      handleLeverantorSelected,
      handleLeverantorModalClose,
    },
  };
}
