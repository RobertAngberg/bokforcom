//#region Huvud
import { FakturaProvider } from "./FakturaProvider";
import Fakturor from "./Fakturor";
import { hämtaSparadeKunder, hämtaSparadeFakturor, hämtaSparadeArtiklar } from "./actions";
//#endregion

export default async function Page() {
  // Starta alla asynkrona operationer samtidigt
  // _ = det här värdet används inte
  const [_, kunder, fakturor, artiklar] = await Promise.all([
    new Promise((r) => setTimeout(r, 400)),
    hämtaSparadeKunder(),
    hämtaSparadeFakturor(),
    hämtaSparadeArtiklar(),
  ]);

  return (
    <FakturaProvider>
      <Fakturor kunder={kunder} fakturor={fakturor} artiklar={artiklar} />
    </FakturaProvider>
  );
}
