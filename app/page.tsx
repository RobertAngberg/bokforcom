import Startsida from "./start/Startsida";
import { fetchDataFromYear } from "./start/actions";

export default async function Page() {
  // Starta ALLA asynkrona operationer samtidigt
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
  const dataPromise = fetchDataFromYear("2025");

  // Promise.all väntar på att alla blir klara (delay + data hämtas parallellt)
  const [, initialData] = await Promise.all([delayPromise, dataPromise]);

  return <Startsida initialData={initialData} />;
}
