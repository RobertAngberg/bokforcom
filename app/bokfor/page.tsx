import MainLayout from "../_components/MainLayout";
import { BokforProvider } from "./context/BokforContextProvider";
import Bokfor from "./components/Bokfor";
import { hamtaBokforInitialData } from "./actions/initialData";

export default async function BokforPage() {
  const initialData = await hamtaBokforInitialData();

  return (
    <MainLayout>
      <BokforProvider>
        <Bokfor
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
