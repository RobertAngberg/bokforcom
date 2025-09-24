export interface HistoryItem {
  transaktions_id: number;
  transaktionsdatum: string;
  kontobeskrivning: string;
  belopp: number;
  kommentar?: string;
  fil?: string;
  blob_url?: string;
}

export interface TransactionDetail {
  transaktionspost_id: number;
  kontonummer: string;
  beskrivning: string;
  debet: number;
  kredit: number;
}

export interface UnbalancedVerification {
  transaktions_id: number;
  transaktionsdatum: string;
  kontobeskrivning: string;
  kommentar?: string;
  totalDebet: number;
  totalKredit: number;
  skillnad: number;
}

export interface UnbalancedResult {
  item: HistoryItem;
  totalDebet: number;
  totalKredit: number;
  skillnad: number;
}
