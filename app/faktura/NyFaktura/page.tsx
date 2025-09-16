import { hämtaFöretagsprofil, hämtaSparadeKunder, hämtaSparadeArtiklar } from "../_lib/data";
import { FakturaProvider } from "../_components/FakturaProvider";
import NyFakturaClient from "./NyFakturaClient";

export default async function NyFakturaPage() {
  // Server-side data fetching
  const [foretagsprofil, kunder, artiklar] = await Promise.all([
    hämtaFöretagsprofil(),
    hämtaSparadeKunder(),
    hämtaSparadeArtiklar(),
  ]);

  const initialData = {
    foretagsprofil,
    kunder: kunder || [],
    artiklar: artiklar || [],
  };

  return (
    <FakturaProvider>
      <NyFakturaClient initialData={initialData} />
    </FakturaProvider>
  );
}
