import { FakturaProvider } from "./context/FakturaProvider";
import FakturaNavigation from "./components/FakturaNavigation";
import MainLayout from "../_components/MainLayout";
import { hamtaFakturaInitialData } from "./actions/initialDataActions";

export default async function FakturaPage() {
  const initialData = await hamtaFakturaInitialData();

  return (
    <MainLayout>
      <FakturaProvider initialData={initialData}>
        <FakturaNavigation />
      </FakturaProvider>
    </MainLayout>
  );
}
