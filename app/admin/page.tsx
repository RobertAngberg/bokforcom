import MainLayout from "../_components/MainLayout";
import Anvandarprofil from "./_components/Anvandarprofil";
import Foretagsprofil from "./_components/Foretagsprofil";
import Farozon from "./_components/Farozon";
import SieExportKnapp from "./_components/SieExportKnapp";
import AdminInitializer from "./_components/StoreInit";
import { getAnvandarInfo, getForetagsprofil } from "./_lib/data";

export default async function AdminPage() {
  const [anvandarInfo, foretagsInfo] = await Promise.all([getAnvandarInfo(), getForetagsprofil()]);

  return (
    <MainLayout>
      <AdminInitializer anvandarInfo={anvandarInfo} foretagsInfo={foretagsInfo} />
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
