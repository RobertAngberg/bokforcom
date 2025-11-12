import MainLayout from "../_components/MainLayout";
import InstallningarClient from "./components/InstallningarClient";
import { hamtaAnvandarInfo, hamtaForetagsprofil } from "./actions/data";

export default async function InstallningarPage() {
  const [användarInfo, företagsInfo] = await Promise.all([
    hamtaAnvandarInfo(),
    hamtaForetagsprofil(),
  ]);

  return (
    <MainLayout>
      <InstallningarClient användarInfo={användarInfo} företagsInfo={företagsInfo} />
    </MainLayout>
  );
}
