import { FakturaProvider } from "./context/FakturaContextProvider";
import FakturaNavigation from "./components/FakturaNavigation";
import MainLayout from "../_components/MainLayout";
import { hamtaForetagsprofil } from "./actions/foretagActions";
import { hamtaSparadeKunder } from "./actions/kundActions";
import { hamtaSparadeArtiklar } from "./actions/artikelActions";

export default async function FakturaPage() {
  const [foretagsprofil, kunder, artiklar] = await Promise.all([
    hamtaForetagsprofil(),
    hamtaSparadeKunder(),
    hamtaSparadeArtiklar(),
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
