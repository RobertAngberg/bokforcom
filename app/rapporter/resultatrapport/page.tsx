import Resultatrapport from "./Resultatrapport";
import { hamtaResultatrapport, fetchFöretagsprofil } from "./actions";
import MainLayout from "../../_components/MainLayout";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";

export default async function Page() {
  // Dessa startar samtidigt (parallellt):
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
  const session = await auth();
  const userId = session?.user?.id;

  const profilPromise = userId ? fetchFöretagsprofil(Number(userId)) : Promise.resolve(null);
  const dataPromise = hamtaResultatrapport();

  // Promise.all väntar på att alla blir klara
  const [, data, profil] = await Promise.all([delayPromise, dataPromise, profilPromise]);

  return (
    <Resultatrapport
      initialData={data}
      företagsnamn={profil?.företagsnamn ?? ""}
      organisationsnummer={profil?.organisationsnummer ?? ""}
    />
  );
}
