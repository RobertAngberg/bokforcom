import MainLayout from "../_components/MainLayout";
import Personal from "./components/Personal";
import { hämtaPersonalInitialData } from "./actions/data";

export default async function PersonalPage() {
  const initialData = await hämtaPersonalInitialData();

  return (
    <MainLayout>
      <Personal initialAnställda={initialData.data.anställda} />
    </MainLayout>
  );
}
