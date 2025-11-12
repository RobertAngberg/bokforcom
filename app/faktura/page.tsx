import { FakturaProvider } from "./context/providers/FakturaProvider";
import FakturaClient from "./components/FakturaClient";
import MainLayout from "../_components/MainLayout";
import { hamtaFakturaInitialData } from "./actions/initialDataActions";

export default async function FakturaPage() {
  const initialData = await hamtaFakturaInitialData();

  return (
    <MainLayout>
      <FakturaProvider initialData={initialData}>
        <FakturaClient />
      </FakturaProvider>
    </MainLayout>
  );
}
