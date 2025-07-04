import { getMomsrapport } from "./actions";
import Momsrapport from "./Momsrapport";
import MainLayout from "../../_components/MainLayout";

export default async function Page() {
  // Starta ALLA asynkrona operationer samtidigt
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
  const dataPromise = getMomsrapport("2025");

  // Promise.all väntar på att alla blir klara
  const [, data] = await Promise.all([delayPromise, dataPromise]);

  return (
    <MainLayout>
      <Momsrapport initialData={data} />
    </MainLayout>
  );
}
