// ALLA EXAKTA TYPES FRÅN ALLA FILER I BOKFOR/ MAPPEN
// KOPIERADE EXAKT FRÅN KÄLLFILERNA - INGA GISSNINGAR

// ===== AnstalldDropdown.tsx =====
export interface Anstalld {
  id: number;
  förnamn: string;
  efternamn: string;
}

export interface AnstalldDropdownProps {
  anstallda: Anstalld[];
  value: string;
  onChange: (id: string) => void;
}

// ===== Bokfor.tsx =====
export interface BokforKontoRad {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
}

export interface BokforExtrafält {
  namn: string;
  label: string;
  konto: string;
  debet: boolean;
  kredit: boolean;
}

export interface BokforForval {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: BokforKontoRad[];
  sökord: string[];
  extrafält?: BokforExtrafält[];
  användningar?: number;
  senast_använd?: string;
}

export interface BokforProps {
  favoritFörvalen: BokforForval[];
  utlaggMode?: boolean;
  levfaktMode?: boolean;
  leverantorId?: number | null;
}

// ===== Forhandsgranskning.tsx =====
export interface ForhandsgranskningProps {
  fil?: File | null;
  pdfUrl?: string | null;
}

// ===== ForvalKort.tsx =====
export interface ForvalKortKontoRad {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
}

export interface ForvalKortForval {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: ForvalKortKontoRad[];
  sökord: string[];
}

export interface ForvalKortProps {
  förval: ForvalKortForval;
  isHighlighted: boolean;
  onClick: () => void;
}

// ===== Information.tsx =====
export interface InformationProps {
  belopp: number;
  setBelopp: (value: number) => void;
  transaktionsdatum: string | null;
  setTransaktionsdatum: (value: string) => void;
  visaFakturadatum?: boolean;
  fakturadatum?: string | null;
  setFakturadatum?: (value: string) => void;
}

// ===== Kommentar.tsx =====
export interface CommentProps {
  kommentar: string;
  setKommentar: (value: string) => void;
}

// ===== LaddaUppFil.tsx =====
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

// ===== LaddaUppFilLevfakt.tsx =====
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

// ===== page.tsx =====
export interface PageKontoRad {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
}

export interface PageExtrafält {
  namn: string;
  label: string;
  konto: string;
  debet: boolean;
  kredit: boolean;
}

export interface PageForval {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: PageKontoRad[];
  sökord: string[];
  extrafält?: PageExtrafält[];
}

export interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ===== SokForval.tsx =====
export interface SokForvalKontoRad {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
}

export interface SokForvalExtrafält {
  namn: string;
  label: string;
  konto: string;
  debet: boolean;
  kredit: boolean;
}

export interface SokForvalForval {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: SokForvalKontoRad[];
  sökord: string[];
  extrafält?: SokForvalExtrafält[];
  användningar?: number;
  senast_använd?: string;
}

export interface SokForvalProps {
  favoritFörvalen: SokForvalForval[];
  setCurrentStep: (val: number) => void;
  setvaltFörval: (val: SokForvalForval) => void;
  setKontonummer: (val: string) => void;
  setKontobeskrivning: (val: string) => void;
  levfaktMode?: boolean;
}

// ===== Steg2.tsx =====
export interface Steg2KontoRad {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
}

export interface Steg2Förval {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: Steg2KontoRad[];
  sökord: string[];
  specialtyp?: string | null;
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
  valtFörval: Steg2Förval | null;
  extrafält: Record<string, { label: string; debet: number; kredit: number }>;
  setExtrafält: (fält: Record<string, { label: string; debet: number; kredit: number }>) => void;
  utlaggMode?: boolean;
  bokförSomFaktura?: boolean;
  setBokförSomFaktura?: (value: boolean) => void;
  kundfakturadatum?: string | null;
  setKundfakturadatum?: (value: string | null) => void;
}

// ===== steg2Levfakt.tsx =====
export interface Steg2LevfaktKontoRad {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
}

export interface Steg2LevfaktFörval {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: Steg2LevfaktKontoRad[];
  sökord: string[];
  specialtyp?: string | null;
}

export interface Step2LevfaktProps {
  favoritFörvalen: Steg2LevfaktFörval[];
  setCurrentStep: (step: number) => void;
  setKontonummer: (konto: string) => void;
  setKontobeskrivning: (beskrivning: string) => void;
  setFil: (fil: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setBelopp: (belopp: number | null) => void;
  setTransaktionsdatum: (datum: string | null) => void;
  setKommentar: (kommentar: string | null) => void;
  setValtFörval: (förval: Steg2LevfaktFörval | null) => void;
  setExtrafält: (
    extrafält: Record<string, { label: string; debet: number; kredit: number }>
  ) => void;
  utlaggMode?: boolean;
  fil?: File | null;
  pdfUrl?: string | null;
  belopp?: number | null;
  transaktionsdatum?: string | null;
  kommentar?: string | null;
}

// ===== Steg3.tsx =====
export interface Steg3KontoRad {
  kontonummer?: string;
  beskrivning?: string;
  debet?: boolean;
  kredit?: boolean;
}

export interface Steg3ExtrafältRad {
  label?: string;
  debet: number;
  kredit: number;
}

export interface Steg3Förval {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: Steg3KontoRad[];
  momssats?: number;
  specialtyp?: string | null;
}

export interface Step3Props {
  kontonummer?: string;
  kontobeskrivning?: string;
  fil?: File | null;
  belopp?: number;
  transaktionsdatum: string;
  kommentar?: string;
  valtFörval?: Steg3Förval | null;
  setCurrentStep?: (step: number) => void;
  extrafält?: Record<string, Steg3ExtrafältRad>;
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

// ===== Utlagg.tsx =====
export interface UtlaggAnställd {
  id: number;
  förnamn: string;
  efternamn: string;
}

export interface UtläggProps {
  onUtläggChange?: (isUtlägg: boolean, valdaAnställda?: number[]) => void;
  initialValue?: boolean;
}

// ===== SpecialForval/Representation.tsx =====
export type RepresentationsTyp = "maltid_alkohol" | "enklare_fortaring";

// ===== ALLA SpecialForval Props interfaces =====
// De flesta har samma struktur men vissa har renderMode, vissa inte

export interface AmorteringBanklanProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil: File | null;
  setFil: (f: File | null) => void;
}

export interface AvgifterAvrakningsnotaMomsProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil: File | null;
  setFil: (f: File | null) => void;
}

export interface AvrakningsnotaUtanMomsProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil: File | null;
  setFil: (f: File | null) => void;
}

export interface BanklanProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil: File | null;
  setFil: (f: File | null) => void;
}

export interface BilleasingProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
}

export interface DirektpensionProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
  setFil: (val: File | null) => void;
}

export interface DrojsmalsrantaLevFaktProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
  setFil: (val: File | null) => void;
}

export interface EgetUttagProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil: File | null;
  setFil: (f: File | null) => void;
}

export interface HyrbilProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
}

export interface ImportmomsProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
}

export interface InkopTjansterSverigeOmvandProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (amount: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (date: string) => void;
  kommentar?: string | null;
  setKommentar?: (comment: string | null) => void;
  setCurrentStep?: (step: number) => void;
  fil: File | null;
}

export interface InkopTjanstEUProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (amount: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (date: string) => void;
  kommentar?: string | null;
  setKommentar?: (comment: string | null) => void;
  setCurrentStep?: (step: number) => void;
  fil: File | null;
}

export interface InkopTjanstUtanfEUProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (amount: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (date: string) => void;
  kommentar?: string | null;
  setKommentar?: (comment: string | null) => void;
  setCurrentStep?: (step: number) => void;
  fil: File | null;
}

export interface InkopVarorEU25Props {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
}

export interface InkopVarorUtanfEUProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
}

export interface ITtjansterEUProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
}

export interface ITtjansterUtanfEUProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
}

export interface MilersattningEnskildFirmaProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
  setFil: (val: File | null) => void;
}

export interface PensionsforsakringProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil: File | null;
  setFil: (f: File | null) => void;
}

export interface RantekostnaderProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
  setFil: (val: File | null) => void;
}

export interface RepresentationProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
}

export interface UberAvgiftProps {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
  setFil: (val: File | null) => void;
}

// ===== SpecialForval/_layouts/ =====
export interface StandardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export interface LevfaktLayoutProps {
  children: React.ReactNode;
  title: string;
  mode: "steg2" | "steg3";
}

// ===== hamtaTransaktionsposter.ts och invalidateBokförCache.ts =====
export interface TransaktionspostResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export interface FavoritforvalResult {
  success: boolean;
  förval?: PageForval[];
}

export interface CacheInvalidationResult {
  success: boolean;
  message?: string;
  error?: string;
}
