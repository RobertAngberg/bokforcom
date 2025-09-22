import { FakturaProvider } from "./context/FakturaContext";
import FakturaNavigation from "./components/FakturaNavigation";
import {
  hämtaFöretagsprofil,
  hämtaSparadeKunder,
  hämtaSparadeArtiklar,
  hämtaSparadeFakturor,
} from "./actions/fakturaActions";

export default async function FakturaPage() {
  const [foretagsprofil, kunder, artiklar, sparadeFakturor] = await Promise.all([
    hämtaFöretagsprofil(),
    hämtaSparadeKunder(),
    hämtaSparadeArtiklar(),
    hämtaSparadeFakturor(),
  ]);

  const initialData = {
    foretagsprofil,
    kunder: kunder || [],
    artiklar: artiklar || [],
    sparadeFakturor: sparadeFakturor || [],
  };

  return (
    <FakturaProvider initialData={initialData}>
      <FakturaNavigation />
    </FakturaProvider>
  );
}
