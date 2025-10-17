import type { Leverantör } from "../../faktura/types/types";
import type { ReactNode } from "react";

// ========================================
// INITIAL DATA & INTERFACES
// ========================================

export interface InitialData {
  favoritFörvalen: Förval[];
  currentStep: number;
  isLevfaktMode: boolean;
  isUtlaggMode: boolean;
  leverantör: Leverantör | null;
}

// ========================================
// CORE BUSINESS INTERFACES
// ========================================
export interface StandardLayoutProps {
  title?: string;
  onSubmit?: () => void;
  belopp?: number | null;
  setBelopp?: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum?: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil?: File | null;
  setFil?: (f: File | null) => void;
  pdfUrl?: string | null;
  setPdfUrl?: (u: string) => void;
  extrafält?: Record<string, { label: string; debet: number; kredit: number }>;
  setExtrafält?: (f: Record<string, { label: string; debet: number; kredit: number }>) => void;
  formRef?: React.RefObject<HTMLFormElement>;
  handleSubmit?: (fd: FormData) => void;
  isValid?: boolean;
  leverantör?: Leverantör | null;
  setLeverantör?: (val: Leverantör | null) => void;
  fakturanummer?: string;
  setFakturanummer?: (val: string) => void;
  fakturadatum?: string;
  setFakturadatum?: (val: string) => void;
  förfallodatum?: string;
  setFörfallodatum?: (val: string) => void;
  betaldatum?: string;
  setBetaldatum?: (val: string) => void;
  mode?: string;
  renderMode?: string;
  valtFörval?: Förval;
  kontonummer?: string;
  kontobeskrivning?: string;
}

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
  leverantör?: Leverantör | null;
  setLeverantör?: (val: Leverantör | null) => void;
  fakturanummer?: string;
  setFakturanummer?: (val: string) => void;
  fakturadatum?: string;
  setFakturadatum?: (val: string) => void;
  förfallodatum?: string;
  setFörfallodatum?: (val: string) => void;
}

export interface Steg3Props {
  kontonummer?: string;
  kontobeskrivning?: string;
  belopp?: number;
  transaktionsdatum?: string;
  kommentar?: string;
  valtFörval?: Förval;
  setCurrentStep?: (step: number) => void;
  extrafält?: Record<string, { label: string; debet: number; kredit: number }>;
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
  belopp?: number;
  setBelopp?: (value: number) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum?: (value: string) => void;
  visaFakturadatum?: boolean;
  fakturadatum?: string | null;
  setFakturadatum?: (value: string) => void;
}

export interface CommentProps {
  kommentar?: string;
  setKommentar?: (value: string) => void;
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
  // Optional leverantörsfaktura props
  setLeverantör?: (leverantör: Leverantör | null) => void;
  setFakturadatum?: (datum: string | null) => void;
  setFörfallodatum?: (datum: string | null) => void;
  setFakturanummer?: (nummer: string) => void;
}

export interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface Step2Props {
  setCurrentStep?: (step: number) => void;
  fil?: File | null;
  setFil?: (file: File | null) => void;
  pdfUrl?: string | null;
  setPdfUrl?: (url: string | null) => void;
  belopp?: number | null;
  setBelopp?: (amount: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum?: (date: string | null) => void;
  kommentar?: string | null;
  setKommentar?: (comment: string | null) => void;
  valtFörval?: Förval | null;
  extrafält?: Record<string, { label: string; debet: number; kredit: number }>;
  setExtrafält?: (fält: Record<string, { label: string; debet: number; kredit: number }>) => void;
  utlaggMode?: boolean;
  bokförSomFaktura?: boolean;
  setBokförSomFaktura?: (value: boolean) => void;
  kundfakturadatum?: string | null;
  setKundfakturadatum?: (value: string | null) => void;
}

export interface Step2LevfaktProps {
  favoritFörvalen?: Förval[]; // Nu valfri - kan hämtas från annan plats
  setCurrentStep?: (step: number) => void;
  exitLevfaktMode?: () => void; // Ny: för att lämna levfakt-läge och visa checkbox igen
  setKontonummer?: (konto: string) => void;
  setKontobeskrivning?: (beskrivning: string) => void;
  setFil?: (fil: File | null) => void;
  setPdfUrl?: (url: string | null) => void;
  setBelopp?: (belopp: number | null) => void;
  setTransaktionsdatum?: (datum: string | null) => void;
  setKommentar?: (kommentar: string | null) => void;
  setValtFörval?: (förval: Förval | null) => void;
  setExtrafält?: (
    extrafält: Record<string, { label: string; debet: number; kredit: number }>
  ) => void;
  utlaggMode?: boolean;
  // Aktuella states behövs för visning (alla nu valfria - kommer från store)
  fil?: File | null;
  pdfUrl?: string | null;
  belopp?: number | null;
  transaktionsdatum?: string | null;
  kommentar?: string | null;
  valtFörval?: Förval | null;
  extrafält?: Record<string, { label: string; debet: number; kredit: number }>;
  // Leverantörsfaktura-specifika props (behåller dessa som required för nu)
  leverantör?: Leverantör | null;
  setLeverantör?: (leverantör: Leverantör | null) => void;
  fakturanummer?: string | null;
  setFakturanummer?: (nummer: string | null) => void;
  fakturadatum?: string | null;
  setFakturadatum?: (datum: string | null) => void;
  förfallodatum?: string | null;
  setFörfallodatum?: (datum: string | null) => void;
  betaldatum?: string | null;
  setBetaldatum?: (datum: string | null) => void;
}

export interface Step3Props {
  kontonummer?: string;
  kontobeskrivning?: string;
  fil?: File | null;
  belopp?: number;
  transaktionsdatum?: string;
  kommentar?: string;
  valtFörval?: Förval | null;
  setCurrentStep?: (step: number) => void;
  extrafält?: Record<string, ExtrafältRad>;
  utlaggMode?: boolean;
  levfaktMode?: boolean;
  leverantör?: Leverantör | null;
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
export type AmorteringBanklanProps = BaseSpecialProps;
export type AvgifterAvrakningsnotaMomsProps = BaseSpecialProps;
export type AvrakningsnotaUtanMomsProps = BaseSpecialProps;
export type BanklanProps = BaseSpecialProps;
export type BilleasingProps = BaseSpecialProps;
export type DirektpensionProps = BaseSpecialProps;
export type DrojsmalsrantaLevFaktProps = BaseSpecialProps;
export type EgetUttagProps = BaseSpecialProps;
export type HyrbilProps = BaseSpecialProps;
export type ImportmomsProps = BaseSpecialProps;
export type InkopTjansterSverigeOmvandProps = BaseSpecialProps;
export type InkopTjanstEUProps = BaseSpecialProps;
export type InkopTjanstUtanfEUProps = BaseSpecialProps;
export type InkopVarorEU25Props = BaseSpecialProps;
export type InkopVarorUtanfEUProps = BaseSpecialProps;
export type ITtjansterEUProps = BaseSpecialProps;
export type ITtjansterUtanfEUProps = BaseSpecialProps;
export type MilersattningEnskildFirmaProps = BaseSpecialProps;
export type PensionsforsakringProps = BaseSpecialProps;
export type RantekostnaderProps = BaseSpecialProps;
export type RepresentationProps = BaseSpecialProps;
export type UberAvgiftProps = BaseSpecialProps;

// ===== LAYOUT PROPS =====

export interface LevfaktLayoutProps {
  title: string;
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
  setFil: (val: File | null) => void;
  pdfUrl: string | null;
  setPdfUrl: (val: string) => void;
  onSubmit: () => void;
  isValid: boolean;
  // Leverantörsfaktura-specifika props
  leverantör?: Leverantör | null;
  setLeverantör?: (val: Leverantör | null) => void;
  fakturanummer?: string;
  setFakturanummer?: (val: string) => void;
  fakturadatum?: string;
  setFakturadatum?: (val: string) => void;
  förfallodatum?: string;
  setFörfallodatum?: (val: string) => void;
  children?: React.ReactNode;
}

// ===== UTILITY TYPES =====
export interface TransaktionspostResult {
  success: boolean;
  data?: Array<{
    kontonummer: string;
    debet: number;
    kredit: number;
  }>;
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

// ===== HOOK PROPS TYPES =====

// useAnstalldDropdown
export interface UseAnstalldDropdownProps {
  anstallda: Anstalld[];
  value: string;
  onChange: (value: string) => void;
}

// useForvalKort
export interface UseForvalKortProps {
  förval: Förval;
  isHighlighted: boolean;
  onClick: () => void;
}

// useForhandsgranskning
export interface UseForhandsgranskningProps {
  fil: File | null | undefined;
  pdfUrl: string | null | undefined;
}

// useLaddaUppFil
export interface UseLaddaUppFilProps {
  setFil: (file: File | null) => void;
  setPdfUrl: (url: string) => void;
  setTransaktionsdatum: (datum: string) => void;
  setBelopp: (belopp: number) => void;
  fil: File | null;
  onOcrTextChange?: (text: string) => void;
  skipBasicAI?: boolean;
  onReprocessTrigger?: (reprocessFn: () => Promise<void>) => void;
  // Optional leverantörsfaktura props
  setLeverantör?: (leverantör: Leverantör | null) => void;
  setFakturadatum?: (datum: string | null) => void;
  setFörfallodatum?: (datum: string | null) => void;
  setFakturanummer?: (nummer: string) => void;
}

// ========================================
// COMPONENT PROPS INTERFACES
// ========================================

// BokforClient
export interface BokforClientProps {
  initialData: {
    favoritFörval: Förval[];
    allaFörval: Förval[];
    bokföringsmetod: string;
    anställda: UtlaggAnställd[];
  };
}

// ========================================
// CONTEXT & PROVIDER INTERFACES
// ========================================

// BokforProvider
export interface BokforProviderProps {
  children: ReactNode;
}

// ========================================
// CONTEXT TYPES
// ========================================

export interface BokforContextType {
  state: {
    currentStep: number;
    favoritFörval: Förval[];
    allaFörval: Förval[];
    anställda: UtlaggAnställd[];
    bokföringsmetod: string;
    levfaktMode: boolean;
    utlaggMode: boolean;
    kontonummer: string;
    kontobeskrivning: string | null;
    belopp: number | null;
    kommentar: string | null;
    fil: File | null;
    pdfUrl: string | null;
    transaktionsdatum: string | null;
    valtFörval: Förval | null;
    extrafält: Record<string, ExtrafältRad>;
    leverantör: Leverantör | null;
    fakturanummer: string | null;
    fakturadatum: string | null;
    förfallodatum: string | null;
    betaldatum: string | null;
    bokförSomFaktura: boolean;
    kundfakturadatum: string | null;
    ocrText: string;
    anstallda: Anstalld[];
    anstalldId: string;
    loadingSteg3: boolean;
    konto2890Beskrivning: string;
    safeBelopp: number;
    safeKommentar: string;
    safeTransaktionsdatum: string;
    momsSats: number;
    moms: number;
    beloppUtanMoms: number;
    ärFörsäljning: boolean | undefined;
    fallbackRows: Array<{
      key: number;
      konto: string;
      debet: number;
      kredit: number;
    }>;
    searchText: string;
    results: Förval[];
    highlightedIndex: number;
    loading: boolean;
  };
  actions: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  handlers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useSteg2LevfaktHelper: () => any;
  };
  getCardClassName: (isHighlighted: boolean) => string;
  formatKontoValue: (value: number | boolean | null | undefined) => string;
}

// ========================================
// TYPE UNIONS & LITERALS
// ========================================

export type RepresentationsTypLocal = "maltid_alkohol" | "enklare_fortaring";
