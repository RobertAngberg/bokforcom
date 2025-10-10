import MainLayout from "../_components/MainLayout";
import Historik from "./components/Historik";
import { hamtaHistorikData } from "./actions/data";

export default async function HistorikPage() {
  const historikData = await hamtaHistorikData();

  return (
    <MainLayout>
      <Historik initialData={historikData} />
    </MainLayout>
  );
}
