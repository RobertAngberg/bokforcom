import MainLayout from "../_components/MainLayout";
import Anvandarprofil from "./_components/Anvandarprofil";
import Foretagsprofil from "./_components/Foretagsprofil";
import Farozon from "./_components/Farozon";
import SieExportKnapp from "./_components/SieExportKnapp";
import AdminInitializer from "./_components/StoreInit";
import { hämtaAnvändarInfo, hämtaFöretagsprofil } from "./_lib/data";

export default async function AdminPage() {
  const [användarInfo, företagsInfo] = await Promise.all([
    hämtaAnvändarInfo(),
    hämtaFöretagsprofil(),
  ]);

  return (
    <MainLayout>
      <AdminInitializer anvandarInfo={användarInfo} foretagsInfo={företagsInfo} />
      <div className="max-w-4xl mx-auto px-6 pt-2">
        <h1 className="text-3xl mb-8 text-center">Administration</h1>
        <Anvandarprofil />
        <Foretagsprofil />
        <Farozon />
        <SieExportKnapp />
      </div>
    </MainLayout>
  );
}
