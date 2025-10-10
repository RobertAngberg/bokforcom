import MainLayout from "../_components/MainLayout";
import { BokforProvider } from "./context/BokforContextProvider";
import Bokfor from "./components/Bokfor";
import {
  hamtaFavoritforval,
  hamtaAllaForval,
  hamtaBokforingsmetod,
  hamtaAnstallda,
} from "./actions/data";

export default async function BokforPage() {
  // Hämta initial data på server-sidan
  const [favoritFörval, allaFörval, bokföringsmetod, anställda] = await Promise.all([
    hamtaFavoritforval(),
    hamtaAllaForval(),
    hamtaBokforingsmetod(),
    hamtaAnstallda(),
  ]);

  return (
    <MainLayout>
      <BokforProvider>
        <Bokfor
          initialData={{
            favoritFörval,
            allaFörval,
            bokföringsmetod,
            anställda,
          }}
        />
      </BokforProvider>
    </MainLayout>
  );
}
