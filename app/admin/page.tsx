import MainLayout from "../_components/MainLayout";
import Admin from "./components/Admin";
import { hämtaAnvändarInfo, hämtaFöretagsprofil } from "./actions/data";

export default async function AdminPage() {
  const [användarInfo, företagsInfo] = await Promise.all([
    hämtaAnvändarInfo(),
    hämtaFöretagsprofil(),
  ]);

  return (
    <MainLayout>
      <Admin användarInfo={användarInfo} företagsInfo={företagsInfo} />
    </MainLayout>
  );
}
