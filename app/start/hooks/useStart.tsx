import { useEffect, useState, useCallback } from "react";
import { fetchRawYearData, checkWelcomeStatus, markWelcomeAsShown } from "../actions/actions";
import { processYearData } from "../../_utils/format";
import type { YearSummary } from "../types/types";

export function useStart() {
  const [year, setYear] = useState("2025");
  const [showWelcome, setShowWelcome] = useState(false);
  const { data, isLoading } = useFetchYearSummary(year);

  useEffect(() => {
    let cancelled = false;

    async function loadWelcomeState() {
      try {
        const shouldShow = await checkWelcomeStatus();

        if (!cancelled && shouldShow) {
          setShowWelcome(true);
          await markWelcomeAsShown();
        }
      } catch (error) {
        console.error("checkWelcomeStatus failed", error);
      }
    }

    loadWelcomeState();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleWelcomeClose = useCallback(() => {
    setShowWelcome(false);
  }, []);

  return {
    year,
    setYear,
    data,
    isLoading,
    showWelcome,
    handleWelcomeClose,
  };
}

function useFetchYearSummary(year: string) {
  const [data, setData] = useState<YearSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const rawData = await fetchRawYearData(year);
        if (!cancelled) {
          const processedData = processYearData(rawData);
          setData(processedData);
          setIsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching year data:", error);
          setData(null);
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [year]);

  return { data, isLoading };
}
