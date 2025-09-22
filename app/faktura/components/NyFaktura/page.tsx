import {
  hämtaFöretagsprofil,
  hämtaSparadeKunder,
  hämtaSparadeArtiklar,
} from "../../actions/fakturaActions";
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
