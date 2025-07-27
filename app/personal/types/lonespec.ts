// TypeScript interfaces för lönespec-relaterade typer

export interface ExtraradData {
  lönespecifikation_id: number;
  typ: string;
  kolumn1?: string | null;  // Behåller flexibla kolumnnamn
  kolumn2?: string | null;  // men med proper typing
  kolumn3?: string | null;
  kolumn4?: string | null;
}

export interface UtläggData {
  id: number;
  anställd_id: number;
  user_id: number;
  status: 'Väntande' | 'Inkluderat i lönespec';
  beskrivning: string;
  belopp: number;
  datum: string;
  kommentar?: string;
  skapad: Date;
  uppdaterad?: Date;
}

export interface LönespecData {
  id: number;
  anställd_id: number;
  månad: string;
  år: number;
  grundlön: number;
  // ... andra lönespec-fält
}

export interface SparaExtraradResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface UppdateraUtläggStatusResult {
  success: boolean;
  error?: string;
}

// Utility type för utlägg som ska bli extrarad
export interface UtläggTillExtrarad {
  lönespecifikation_id: number;
  utlägg: UtläggData;
}
