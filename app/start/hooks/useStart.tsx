import { useState, useCallback } from "react";
import { fetchRawYearData } from "../actions/actions";
import { processYearData } from "../../_utils/format";
import type { YearSummary } from "../types/types";

interface UseStartProps {
  initialData: YearSummary;
  initialYear: string;
  initialShowWelcome: boolean;
}

export function useStart({ initialData, initialYear, initialShowWelcome }: UseStartProps) {
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<YearSummary>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(initialShowWelcome);

  const handleYearChange = useCallback(async (newYear: string) => {
    setYear(newYear);
    setIsLoading(true);

    try {
      const rawData = await fetchRawYearData(newYear);
      const processedData = processYearData(rawData);
      setData(processedData);
    } catch (error) {
      console.error("Error fetching year data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleWelcomeClose = useCallback(() => {
    setShowWelcome(false);
  }, []);

  return {
    year,
    data,
    isLoading,
    showWelcome,
    handleYearChange,
    handleWelcomeClose,
  };
}
