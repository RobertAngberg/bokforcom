import Bokför from "../bokfor/Bokfor";
import { fetchFavoritforval } from "../bokfor/actions";

export default async function UtlaggPage() {
  const favoritFörvalen = await fetchFavoritforval();
  return <Bokför favoritFörvalen={favoritFörvalen} utlaggMode={true} />;
}
