import Bokför from "./Bokfor";
import { fetchFavoritforval } from "./actions";

export default async function Page() {
  // Starta ALLA asynkrona operationer samtidigt
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
  const favoritFörvalenPromise = fetchFavoritforval();

  // Promise.all väntar på att alla blir klara (delay + data hämtas parallellt)
  const [, favoritFörvalen] = await Promise.all([delayPromise, favoritFörvalenPromise]);

  return <Bokför favoritFörvalen={favoritFörvalen} />;
}
