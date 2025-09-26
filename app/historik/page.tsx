import MainLayout from "../_components/MainLayout";
import Historik from "./components/Historik";
import { hämtaHistorikData } from "./actions/data";

export default async function HistorikPage() {
  const historikData = await hämtaHistorikData();

  return (
    <MainLayout>
      <Historik initialData={historikData} />
    </MainLayout>
  );
}
