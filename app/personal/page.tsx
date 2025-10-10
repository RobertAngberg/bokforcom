import MainLayout from "../_components/MainLayout";
import Personal from "./components/Personal";
import { hamtaPersonalInitialData } from "./actions/data";

export default async function PersonalPage() {
  const initialData = await hamtaPersonalInitialData();

  return (
    <MainLayout>
      <Personal initialAnställda={initialData.data.anställda} />
    </MainLayout>
  );
}
