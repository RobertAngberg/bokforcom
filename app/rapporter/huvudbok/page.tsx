import Huvudbok from "./Huvudbok";
import { fetchHuvudbok, fetchFöretagsprofil } from "./actions";
import { auth } from "@/auth";

export default async function Page() {
  const wait = new Promise((r) => setTimeout(r, 400));

  const sessionPromise = auth();
  const huvudbokPromise = fetchHuvudbok();

  const session = await sessionPromise;
  const userId = session?.user?.id;
  const profilPromise = userId ? fetchFöretagsprofil(Number(userId)) : Promise.resolve(null);

  // Vänta på både 400ms och all data parallellt
  const [result, profil] = await Promise.all([huvudbokPromise, profilPromise, wait]);

  return (
    <Huvudbok
      initialData={result.transaktioner}
      ingaendeBalanser={result.ingaendeBalanser}
      företagsnamn={profil?.företagsnamn ?? ""}
      organisationsnummer={profil?.organisationsnummer ?? ""}
    />
  );
}
