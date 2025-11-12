import MainLayout from "../_components/MainLayout";
import RapporterClient from "./components/RapporterClient";
import { getAllTransaktionsdata } from "./data/rapportData";
import { getForetagsprofil } from "./data/foretagData";

export default async function Page() {
  const [data, profil] = await Promise.all([getAllTransaktionsdata("2025"), getForetagsprofil()]);

  return (
    <MainLayout>
      <RapporterClient
        initialData={data}
        foretagsprofil={{
          företagsnamn: profil?.företagsnamn ?? "",
          organisationsnummer: profil?.organisationsnummer ?? "",
        }}
      />
    </MainLayout>
  );
}
