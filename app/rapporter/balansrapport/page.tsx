import Balansrapport from "./Balansrapport";
import { fetchBalansData, fetchFöretagsprofil } from "./actions";
import { auth } from "@/auth";

export default async function Page() {
  // Starta ALLA asynkrona operationer samtidigt
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
  const sessionPromise = auth();
  const year = new Date().getFullYear().toString();
  const balansPromise = fetchBalansData(year);

  // Vänta på session för att få userId
  const session = await sessionPromise;
  const userId = session?.user?.id;
  const profilPromise = userId ? fetchFöretagsprofil(Number(userId)) : Promise.resolve(null);

  // Promise.all väntar på att alla blir klara (delay + data hämtas parallellt)
  const [, initialData, profil] = await Promise.all([delayPromise, balansPromise, profilPromise]);

  return (
    <Balansrapport
      initialData={initialData}
      företagsnamn={profil?.företagsnamn ?? ""}
      organisationsnummer={profil?.organisationsnummer ?? ""}
    />
  );
}
