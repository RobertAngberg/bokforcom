import HuvudbokFull from "./HuvudbokFull";
import { fetchHuvudbokMedAllaTransaktioner, fetchFöretagsprofil } from "./actions";
import MainLayout from "../../_components/MainLayout";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";

export default async function Page() {
  const sessionPromise = auth();
  const huvudbokPromise = fetchHuvudbokMedAllaTransaktioner();

  const session = await sessionPromise;
  const userId = session?.user?.id;
  const profilPromise = userId ? fetchFöretagsprofil(Number(userId)) : Promise.resolve(null);

  // Vänta på all data parallellt
  const [result, profil] = await Promise.all([huvudbokPromise, profilPromise]);

  return (
    <HuvudbokFull
      huvudboksdata={result}
      företagsnamn={profil?.företagsnamn ?? ""}
      organisationsnummer={profil?.organisationsnummer ?? ""}
    />
  );
}
