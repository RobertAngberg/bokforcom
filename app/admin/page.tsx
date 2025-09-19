import MainLayout from "../_components/MainLayout";
import AdminContent from "./_components/AdminContent";
import { hämtaAnvändarInfo, hämtaFöretagsprofil } from "./_actions/data";

export default async function AdminPage() {
  const [användarInfo, företagsInfo] = await Promise.all([
    hämtaAnvändarInfo(),
    hämtaFöretagsprofil(),
  ]);

  return (
    <MainLayout>
      <AdminContent användarInfo={användarInfo} företagsInfo={företagsInfo} />
    </MainLayout>
  );
}
