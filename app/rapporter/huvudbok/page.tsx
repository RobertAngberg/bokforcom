import Huvudbok from "./Huvudbok";
import { fetchHuvudbok, fetchFöretagsprofil } from "./actions";
import MainLayout from "../../_components/MainLayout";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";

export default async function Page() {
  const sessionPromise = auth();
  const huvudbokPromise = fetchHuvudbok();

  const session = await sessionPromise;
  const userId = session?.user?.id;
  const profilPromise = userId ? fetchFöretagsprofil(Number(userId)) : Promise.resolve(null);

  // Vänta på all data parallellt
  const [result, profil] = await Promise.all([huvudbokPromise, profilPromise]);

  return (
    <Huvudbok
      huvudboksdata={result}
      företagsnamn={profil?.företagsnamn ?? ""}
      organisationsnummer={profil?.organisationsnummer ?? ""}
    />
  );
}
