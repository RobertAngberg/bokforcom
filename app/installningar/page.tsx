import MainLayout from "../_components/MainLayout";
import Admin from "./components/Admin";
import { hamtaAnvandarInfo, hamtaForetagsprofil } from "./actions/data";

export default async function AdminPage() {
  const [användarInfo, företagsInfo] = await Promise.all([
    hamtaAnvandarInfo(),
    hamtaForetagsprofil(),
  ]);

  return (
    <MainLayout>
      <Admin användarInfo={användarInfo} företagsInfo={företagsInfo} />
    </MainLayout>
  );
}
