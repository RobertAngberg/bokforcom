export interface CompanyProfile {
  företagsnamn?: string;
  adress?: string;
  postnummer?: string;
  stad?: string;
  organisationsnummer?: string;
  momsregistreringsnummer?: string;
  telefonnummer?: string;
  epost?: string;
  webbplats?: string;
}

export async function fetchCompanyProfile(_userId: string) {
  throw new Error("Not implemented");
}

export async function saveCompanyProfile(
  _userId: string,
  _data: Partial<CompanyProfile>
) {
  throw new Error("Not implemented");
}

export async function deleteCompanyProfile(_userId: string) {
  throw new Error("Not implemented");
}
