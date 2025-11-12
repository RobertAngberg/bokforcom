import MainLayout from "../_components/MainLayout";
import HistorikClient from "./components/HistorikClient";
import { hamtaHistorikData } from "./actions/data";

export default async function HistorikPage() {
  const historikData = await hamtaHistorikData();

  return (
    <MainLayout>
      <HistorikClient initialData={historikData} />
    </MainLayout>
  );
}
