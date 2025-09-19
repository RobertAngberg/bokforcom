"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { loggaFavoritförval } from "../_actions/actions";
import { extractDataFromOCRKundfaktura } from "../_actions/ocrActions";
import { hämtaAllaAnställda } from "../../personal/_actions/anstalldaActions";
import { saveTransaction } from "../_actions/transactionActions";
import { uploadReceiptImage } from "../../_utils/blobUpload";
import { dateTillÅÅÅÅMMDD, ÅÅÅÅMMDDTillDate, datePickerOnChange } from "../../_utils/datum";
import { formatCurrency, round } from "../../_utils/format";
import {
  KontoRad,
  Förval,
  Anstalld,
  UseAnstalldDropdownProps,
  UtlaggAnställd,
  UseForhandsgranskningProps,
} from "../_types/types";
import { useBokforStore, useBokforState, useBokforActions } from "../_stores/BokforStoreProvider";
import { normalize } from "../../_utils/textUtils";

export function useBokfor() {
  // ====================================================
  // ZUSTAND STATE & ACTIONS (med nya Context pattern)
  // ====================================================

  // Använd nya context-based hooks
  const state = useBokforState();
  const actions = useBokforActions();

  // ====================================================
  // SOKFORVAL LOGIK
  // ====================================================

  // Lokal state för sökning
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Förval[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sätt initiala results när favoritFörval laddas
  useEffect(() => {
    if (state.favoritFörval.length > 0) {
      setResults(state.favoritFörval);
    }
  }, [state.favoritFörval]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm) {
      setResults(state.favoritFörval);
      setHighlightedIndex(0);
      return;
    }

    setLoading(true);
    try {
      const normalizedSearch = normalize(searchTerm);
      const searchResults = state.allaFörval.filter(
        (f: Förval) =>
          normalize(f.namn).includes(normalizedSearch) ||
          f.konton.some(
            (k: KontoRad) =>
              k.kontonummer?.includes(normalizedSearch) ||
              normalize(k.beskrivning || "").includes(normalizedSearch)
          )
      );
      setResults(searchResults);
      setHighlightedIndex(0);
    } catch (error) {
      console.error("Sökfel:", error);
    } finally {
      setLoading(false);
    }
  };

  const väljFörval = (f: Förval) => {
    loggaFavoritförval(f.id);
    actions.setValtFörval(f);

    const huvudkonto = f.konton.find(
      (k: KontoRad) => k.kontonummer !== "1930" && (k.kredit || k.debet) && !!k.kontonummer
    );

    if (huvudkonto) {
      actions.setKontonummer(huvudkonto.kontonummer ?? "");
      actions.setKontobeskrivning(huvudkonto.beskrivning ?? "");
    } else {
      console.warn("⚠️ Hittade inget huvudkonto i förval:", f);
    }

    actions.setCurrentStep(2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter") {
      if (results[highlightedIndex]) {
        väljFörval(results[highlightedIndex]);
      }
    }
    if (e.key === "Escape") {
      setSearchText("");
      setResults(state.favoritFörval);
      setHighlightedIndex(0);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setSearchText(newValue);
    performSearch(newValue);
  };

  const getTitle = () => {
    if (state.utlaggMode) return "Steg 1: Välj förval för utlägg";
    if (state.levfaktMode) return "Steg 1: Välj förval för leverantörsfaktura";
    return "Steg 1: Sök förval";
  };

  // ====================================================
  // HELPER FUNCTIONS (simplified versions)
  // ====================================================

  // Återanvänd andra helper functions men med nya state/actions
  // (Du kan kopiera in resten av din logik här och uppdatera den för att använda state/actions)

  return {
    state: {
      // SokForval state
      searchText,
      results,
      highlightedIndex,
      loading,

      // Zustand state
      ...state,
    },
    handlers: {
      // SokForval handlers
      handleSearchChange,
      handleKeyDown,
      väljFörval,
      getTitle,

      // Zustand actions
      ...actions,
    },
  };
}
