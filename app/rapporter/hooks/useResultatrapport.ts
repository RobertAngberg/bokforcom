import { useState } from "react";

// Types
type Konto = {
  kontonummer: string;
  beskrivning: string;
  transaktioner?: Array<{
    id: string;
    datum: string;
    belopp: number;
    beskrivning: string;
    transaktion_id: number;
    verifikatNummer: string;
  }>;
  [year: string]: number | string | undefined | Array<any>;
};

type KontoRad = {
  namn: string;
  konton: Konto[];
  summering: { [year: string]: number };
};

type ResultatData = {
  intakter: KontoRad[];
  rorelsensKostnader: KontoRad[];
  finansiellaIntakter?: KontoRad[];
  finansiellaKostnader: KontoRad[];
  ar: string[];
};

export const useResultatrapport = () => {
  // Grundläggande state
  const [initialData, setInitialData] = useState<ResultatData | null>(null);
  const [företagsnamn, setFöretagsnamn] = useState<string>("");
  const [organisationsnummer, setOrganisationsnummer] = useState<string>("");
  const [loading, setLoading] = useState(true);

  return {
    initialData,
    setInitialData,
    företagsnamn,
    setFöretagsnamn,
    organisationsnummer,
    setOrganisationsnummer,
    loading,
    setLoading,
  };
};

export type { ResultatData, KontoRad, Konto };