import MainLayout from "../_components/MainLayout";
import { BokforProvider } from "./components/BokforProvider";
import Bokfor from "./components/Bokfor";
import {
  hämtaFavoritförval,
  hämtaAllaFörval,
  hämtaBokföringsmetod,
  hämtaAnställda,
} from "./actions/data";

export default async function BokforPage() {
  // Hämta initial data på server-sidan
  const [favoritFörval, allaFörval, bokföringsmetod, anställda] = await Promise.all([
    hämtaFavoritförval(),
    hämtaAllaFörval(),
    hämtaBokföringsmetod(),
    hämtaAnställda(),
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
