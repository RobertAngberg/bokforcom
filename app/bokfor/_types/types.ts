// ===== GEMENSAMMA BASTYPER =====
export interface KontoRad {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
}

export interface Extrafält {
  namn: string;
  label: string;
  konto: string;
  debet: boolean;
  kredit: boolean;
}

export interface ExtrafältRad {
  label?: string;
  debet: number;
  kredit: number;
}

export interface Förval {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: KontoRad[];
  sökord: string[];
  extrafält?: Extrafält[];
  användningar?: number;
  senast_använd?: string;
  momssats?: number;
  specialtyp?: string | null;
}

export interface Anstalld {
  id: number;
  förnamn: string;
  efternamn: string;
}

// ===== GEMENSAM PROPS BASE FÖR ALLA SPECIALFÖRVAL =====
export interface BaseSpecialProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil: File | null;
  setFil: (f: File | null) => void;
  pdfUrl: string | null;
  setPdfUrl: (u: string) => void;
  extrafält: Record<string, { label: string; debet: number; kredit: number }>;
  setExtrafält?: (f: Record<string, { label: string; debet: number; kredit: number }>) => void;
  formRef?: React.RefObject<HTMLFormElement>;
  handleSubmit?: (fd: FormData) => void;
  // Levfakt-specifika props (optional)
  leverantör?: string | any;
  setLeverantör?: (val: string | any | null) => void;
  fakturanummer?: string;
  setFakturanummer?: (val: string) => void;
  fakturadatum?: string;
  setFakturadatum?: (val: string) => void;
  förfallodatum?: string;
  setFörfallodatum?: (val: string) => void;
}

// ===== SPECIFIKA COMPONENT PROPS =====
export interface AnstalldDropdownProps {
  anstallda: Anstalld[];
  value: string;
  onChange: (id: string) => void;
}

export interface BokforProps {
  favoritFörvalen: Förval[];
  utlaggMode?: boolean;
  levfaktMode?: boolean;
  leverantorId?: number | null;
}

export interface ForhandsgranskningProps {
  fil?: File | null;
  pdfUrl?: string | null;
}

export interface ForvalKortProps {
  förval: Förval;
  isHighlighted: boolean;
  onClick: () => void;
}

export interface InformationProps {
  belopp: number;
  setBelopp: (value: number) => void;
  transaktionsdatum: string | null;
  setTransaktionsdatum: (value: string) => void;
  visaFakturadatum?: boolean;
  fakturadatum?: string | null;
  setFakturadatum?: (value: string) => void;
}

export interface CommentProps {
  kommentar: string;
  setKommentar: (value: string) => void;
}

export interface FileUploadProps {
  setFil: (file: File | null) => void;
  setPdfUrl: (url: string) => void;
  setTransaktionsdatum: (datum: string) => void;
  setBelopp: (belopp: number) => void;
  fil: File | null;
  onOcrTextChange?: (text: string) => void;
  skipBasicAI?: boolean;
  onReprocessTrigger?: (reprocessFn: () => Promise<void>) => void;
}

export interface FileUploadLevfaktProps {
  setFil: (file: File | null) => void;
  setPdfUrl: (url: string) => void;
  setTransaktionsdatum: (datum: string) => void;
  setBelopp: (belopp: number) => void;
  fil: File | null;
  setLeverantör: (leverantör: any | null) => void;
  setFakturadatum: (datum: string | null) => void;
  setFörfallodatum: (datum: string | null) => void;
  setFakturanummer: (nummer: string) => void;
}

export interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface SokForvalProps {
  favoritFörvalen: Förval[];
  setCurrentStep: (val: number) => void;
  setvaltFörval: (val: Förval) => void;
  setKontonummer: (val: string) => void;
  setKontobeskrivning: (val: string) => void;
  levfaktMode?: boolean;
  utlaggMode?: boolean;
}

export interface Step2Props {
  setCurrentStep: (step: number) => void;
  fil: File | null;
  setFil: (file: File | null) => void;
  pdfUrl: string | null;
  setPdfUrl: (url: string | null) => void;
  belopp: number | null;
  setBelopp: (amount: number | null) => void;
  transaktionsdatum: string | null;
  setTransaktionsdatum: (date: string | null) => void;
  kommentar: string | null;
  setKommentar: (comment: string | null) => void;
  valtFörval: Förval | null;
  extrafält: Record<string, { label: string; debet: number; kredit: number }>;
  setExtrafält: (fält: Record<string, { label: string; debet: number; kredit: number }>) => void;
  utlaggMode?: boolean;
  bokförSomFaktura?: boolean;
  setBokförSomFaktura?: (value: boolean) => void;
  kundfakturadatum?: string | null;
  setKundfakturadatum?: (value: string | null) => void;
}

export interface Step2LevfaktProps {
  favoritFörvalen: Förval[];
  setCurrentStep: (step: number) => void;
  exitLevfaktMode?: () => void; // Ny: för att lämna levfakt-läge och visa checkbox igen
  setKontonummer: (konto: string) => void;
  setKontobeskrivning: (beskrivning: string) => void;
  setFil: (fil: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setBelopp: (belopp: number | null) => void;
  setTransaktionsdatum: (datum: string | null) => void;
  setKommentar: (kommentar: string | null) => void;
  setValtFörval: (förval: Förval | null) => void;
  setExtrafält: (
    extrafält: Record<string, { label: string; debet: number; kredit: number }>
  ) => void;
  utlaggMode?: boolean;
  // Aktuella states behövs för visning
  fil?: File | null;
  pdfUrl?: string | null;
  belopp?: number | null;
  transaktionsdatum?: string | null;
  kommentar?: string | null;
  valtFörval?: Förval | null;
  extrafält?: Record<string, { label: string; debet: number; kredit: number }>;
  // Leverantörsfaktura-specifika props
  leverantör: any | null; // TODO: Use proper Leverantör type from faktura/actions
  setLeverantör: (leverantör: any | null) => void;
  fakturanummer: string | null;
  setFakturanummer: (nummer: string | null) => void;
  fakturadatum: string | null;
  setFakturadatum: (datum: string | null) => void;
  förfallodatum: string | null;
  setFörfallodatum: (datum: string | null) => void;
  betaldatum: string | null;
  setBetaldatum: (datum: string | null) => void;
}

export interface Step3Props {
  kontonummer?: string;
  kontobeskrivning?: string;
  fil?: File | null;
  belopp?: number;
  transaktionsdatum: string;
  kommentar?: string;
  valtFörval?: Förval | null;
  setCurrentStep?: (step: number) => void;
  extrafält?: Record<string, ExtrafältRad>;
  utlaggMode?: boolean;
  levfaktMode?: boolean;
  leverantör?: any | null;
  fakturanummer?: string | null;
  fakturadatum?: string | null;
  förfallodatum?: string | null;
  betaldatum?: string | null;
  bokförSomFaktura?: boolean;
  kundfakturadatum?: string | null;
}

export interface UtläggProps {
  onUtläggChange?: (isUtlägg: boolean, valdaAnställda?: number[]) => void;
  initialValue?: boolean;
}

export interface UtlaggAnställd {
  id: number;
  förnamn: string;
  efternamn: string;
}

// ===== ALLA SPECIALFÖRVAL USES SAMMA BASE =====
export interface AmorteringBanklanProps extends BaseSpecialProps {}
export interface AvgifterAvrakningsnotaMomsProps extends BaseSpecialProps {}
export interface AvrakningsnotaUtanMomsProps extends BaseSpecialProps {}
export interface BanklanProps extends BaseSpecialProps {}
export interface BilleasingProps extends BaseSpecialProps {}
export interface DirektpensionProps extends BaseSpecialProps {}
export interface DrojsmalsrantaLevFaktProps extends BaseSpecialProps {}
export interface EgetUttagProps extends BaseSpecialProps {}
export interface HyrbilProps extends BaseSpecialProps {}
export interface ImportmomsProps extends BaseSpecialProps {}
export interface InkopTjansterSverigeOmvandProps extends BaseSpecialProps {}
export interface InkopTjanstEUProps extends BaseSpecialProps {}
export interface InkopTjanstUtanfEUProps extends BaseSpecialProps {}
export interface InkopVarorEU25Props extends BaseSpecialProps {}
export interface InkopVarorUtanfEUProps extends BaseSpecialProps {}
export interface ITtjansterEUProps extends BaseSpecialProps {}
export interface ITtjansterUtanfEUProps extends BaseSpecialProps {}
export interface MilersattningEnskildFirmaProps extends BaseSpecialProps {}
export interface PensionsforsakringProps extends BaseSpecialProps {}
export interface RantekostnaderProps extends BaseSpecialProps {}
export interface RepresentationProps extends BaseSpecialProps {}
export interface UberAvgiftProps extends BaseSpecialProps {}

// ===== LAYOUT PROPS =====
export interface StandardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export interface LevfaktLayoutProps {
  children: React.ReactNode;
  title: string;
  mode: "steg2" | "steg3";
}

// ===== UTILITY TYPES =====
export interface TransaktionspostResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export interface FavoritforvalResult {
  success: boolean;
  förval?: Förval[];
}

export interface CacheInvalidationResult {
  success: boolean;
  message?: string;
  error?: string;
}
