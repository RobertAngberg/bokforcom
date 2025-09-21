import { useState, useEffect } from "react";
import { hämtaBetaldaSemesterdagar } from "../actions/semesterActions";
import type { ExtraraderField } from "../types/types";

interface UseExtraraderModalParams {
  open: boolean;
  title?: string;
  anstalldId?: number;
  fields: ExtraraderField[];
}

export const useExtraraderModal = ({
  open,
  title,
  anstalldId,
  fields,
}: UseExtraraderModalParams) => {
  const [betaldaDagar, setBetaldaDagar] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [semesterDagar, setSemesterDagar] = useState<number>(0);

  // Beräkna antal arbetsdagar mellan två datum (exklusive helger) - INKLUSIVT start och slut
  const beräknaArbetsdagar = (start: Date, end: Date): number => {
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Inte söndag (0) eller lördag (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  // Hantera uppdatering av antal semesterdagar
  const updateSemesterDagar = (newSemesterDagar: number) => {
    setSemesterDagar(newSemesterDagar);

    // Uppdatera det motsvarande fältet automatiskt
    const antalField = fields.find((field) => field.name === "kolumn2");
    if (antalField) {
      antalField.onChange({
        target: { value: newSemesterDagar.toString() },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Hantera startdatum-ändringar
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  // Hantera slutdatum-ändringar
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  // Skapa synthetic event för dropdown-ändringar
  const createSyntheticEvent = (value: string) =>
    ({
      target: { value },
    }) as React.ChangeEvent<HTMLSelectElement>;

  // Uppdatera antal semesterdagar när datum ändras
  useEffect(() => {
    if (startDate && endDate && title === "Betald semester") {
      const dagar = beräknaArbetsdagar(startDate, endDate);
      updateSemesterDagar(dagar);
    }
  }, [startDate, endDate, title, fields]);

  // Hantera modal öppning och stängning
  useEffect(() => {
    if (open && title === "Betald semester" && anstalldId) {
      hämtaBetaldaSemesterdagar(anstalldId).then(setBetaldaDagar);
    }

    // Rensa state när modalen stängs
    if (!open) {
      setStartDate(null);
      setEndDate(null);
      setSemesterDagar(0);
    }
  }, [open, title, anstalldId]);

  // Filtrera fält baserat på typ
  const getFilteredFields = (includeKolumn2: boolean = true) => {
    return fields.filter((field) => {
      if (field.hidden) return false;
      if (!includeKolumn2 && field.name === "kolumn2") return false;
      return true;
    });
  };

  // Kontrollera om det är betald semester
  const isBetaldSemester = title === "Betald semester";

  return {
    // State
    betaldaDagar,
    startDate,
    endDate,
    semesterDagar,

    // Handlers
    handleStartDateChange,
    handleEndDateChange,
    createSyntheticEvent,

    // Utilities
    getFilteredFields,
    isBetaldSemester,

    // Business logic
    beräknaArbetsdagar,
  };
};
