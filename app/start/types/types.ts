export type YearSummary = {
  totalInkomst: number;
  totalUtgift: number;
  totalResultat: number;
  yearData: YearDataPoint[];
};

export type YearDataPoint = {
  month: string;
  inkomst: number;
  utgift: number;
};

export interface FrontCardProps {
  title: string;
  data: number;
}

export interface ValkomstMeddProps {
  onClose: () => void;
}

export type ChartRow = {
  month: string;
  inkomst: number;
  utgift: number;
};

export type ChartProps = {
  year: string;
  onYearChange: (year: string) => void;
  chartData: ChartRow[];
};

export type ProcessedChartData = {
  labels: string[];
  inkomstData: number[];
  utgiftData: number[];
  resultData: number[];
};

export interface AnvandaravtalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface Transaktionspost {
  konto_id: number;
  kontobeskrivning: string | null;
  debet: number;
  kredit: number;
}

export interface Förval {
  id: number;
  namn: string;
  beskrivning: string | null;
  typ: string;
  kategori: string | null;
  konton: KontoMapping[] | string;
  sökord: string[];
  momssats: number | null;
  specialtyp: string | null;
  användningar?: number;
  senast_använd?: Date | null;
}

export interface KontoMapping {
  kontonummer?: string;
  kontonamn?: string;
  debet?: number;
  kredit?: number;
}

export interface RawYearDataRow {
  transaktionsdatum: Date;
  debet: number;
  kredit: number;
  kontoklass: string;
  kontonummer: string;
}

export interface Transaktion {
  id: number;
  transaktionsdatum: Date;
  kontobeskrivning: string;
  kontoklass: string;
  belopp: number;
  fil: string | null;
  kommentar: string | null;
  user_id: string;
}

export interface Faktura {
  id: number;
  fakturanamn: string;
  kundnamn: string;
  totalbelopp: number;
  status: string;
  utfardandedatum: Date;
  user_id: string;
}

export interface FörvalFilter {
  sök?: string;
  kategori?: string;
  typ?: string;
}

export interface SaveInvoiceData {
  fakturanummer: string;
  kundnamn: string;
  total: number;
}

export interface UploadResult {
  success: boolean;
  blob?: {
    url: string;
    pathname: string;
    contentType: string;
    contentDisposition: string;
  };
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  message: string;
}

export type FelaktigtFörval = Förval;
