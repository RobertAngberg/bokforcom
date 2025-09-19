import MainLayout from "../_components/MainLayout";
import { BokforProvider } from "./_components/BokforProvider";
import BokforClient from "./_components/BokforClient";
import {
  hämtaFavoritförval,
  hämtaAllaFörval,
  hämtaBokföringsmetod,
  hämtaAnställda,
} from "./_actions/data";

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
        <BokforClient
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
