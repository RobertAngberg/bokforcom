export type BokföringsmetodType = "Kontantmetoden" | "Fakturametoden";
export type MomsperiodType = "Årsvis" | "Kvartalsvis" | "Månadsvis";

export interface OnboardingData {
  organisationsnummer: string;
  företagsnamn: string;
  bokföringsmetod: BokföringsmetodType;
  momsperiod: MomsperiodType;
}
