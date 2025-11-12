import MainLayout from "../_components/MainLayout";
import { BokforProvider } from "./context/BokforContextProvider";
import BokforClient from "./components/BokforClient";
import { hamtaBokforInitialData } from "./actions/initialData";

export default async function BokforPage() {
  const initialData = await hamtaBokforInitialData();

  return (
    <MainLayout>
      <BokforProvider>
        <BokforClient
          initialData={{
            favoritFörval: initialData.favoritFörval,
            allaFörval: initialData.allaFörval,
            bokföringsmetod: initialData.bokföringsmetod,
            anställda: initialData.anställda,
          }}
        />
      </BokforProvider>
    </MainLayout>
  );
}
