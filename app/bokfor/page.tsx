import MainLayout from "../_components/MainLayout";
import SökFörval from "./_components/SokForval";
import Steg2 from "./_components/Steg/Steg2";
import Steg2Levfakt from "./_components/Steg/Steg2Levfakt";
import Steg3 from "./_components/Steg/Steg3";
import Steg4 from "./_components/Steg/Steg4";
import StoreInit from "./_components/StoreInit";
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
      <StoreInit
        favoritFörval={favoritFörval}
        allaFörval={allaFörval}
        bokföringsmetod={bokföringsmetod}
        anställda={anställda}
      />
      <SökFörval />
      <Steg2 />
      <Steg2Levfakt />
      <Steg3 />
      <Steg4 />
    </MainLayout>
  );
}
