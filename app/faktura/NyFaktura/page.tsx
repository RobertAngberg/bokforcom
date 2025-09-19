import { hämtaFöretagsprofil } from "../_actions/foretagActions";
import { hämtaSparadeKunder } from "../_actions/kundActions";
import { hämtaSparadeArtiklar } from "../_actions/artikelActions";
import NyFakturaClient from "./NyFakturaClient";

export default async function NyFakturaPage() {
  const [foretagsprofil, kunder, artiklar] = await Promise.all([
    hämtaFöretagsprofil(),
    hämtaSparadeKunder(),
    hämtaSparadeArtiklar(),
  ]);

  const initialData = {
    foretagsprofil,
    kunder: kunder || [],
    artiklar: artiklar || [],
  };

  return <NyFakturaClient initialData={initialData} />;
}
