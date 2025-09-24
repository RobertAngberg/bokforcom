import { FakturaProvider } from "./context/FakturaContext";
import FakturaNavigation from "./components/FakturaNavigation";
import MainLayout from "../_components/MainLayout";
import { hämtaFöretagsprofil } from "./actions/foretagActions";
import { hämtaSparadeKunder } from "./actions/kundActions";
import { hämtaSparadeArtiklar } from "./actions/artikelActions";
import { hämtaSparadeFakturor } from "./actions/fakturaActions";

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
    <MainLayout>
      <FakturaProvider initialData={initialData}>
        <FakturaNavigation />
      </FakturaProvider>
    </MainLayout>
  );
}
