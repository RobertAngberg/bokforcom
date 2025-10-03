import { FakturaProvider } from "./context/FakturaContext";
import FakturaNavigation from "./components/FakturaNavigation";
import MainLayout from "../_components/MainLayout";
import { hämtaFöretagsprofil } from "./actions/foretagActions";
import { hämtaSparadeKunder } from "./actions/kundActions";
import { hämtaSparadeArtiklar } from "./actions/artikelActions";

export default async function FakturaPage() {
  const [foretagsprofil, kunder, artiklar] = await Promise.all([
    hämtaFöretagsprofil(),
    hämtaSparadeKunder(),
    hämtaSparadeArtiklar(),
  ]);

  const initialData = {
    foretagsprofil: foretagsprofil || undefined,
    kunder: kunder || [],
    artiklar: artiklar || [],
  };

  return (
    <MainLayout>
      <FakturaProvider initialData={initialData}>
        <FakturaNavigation />
      </FakturaProvider>
    </MainLayout>
  );
}
