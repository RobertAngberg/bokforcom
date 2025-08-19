import { getMomsrapport, fetchFöretagsprofil } from "./actions";
import Momsrapport from "./Momsrapport";
import MainLayout from "../../_components/MainLayout";
import { auth } from "../../../auth";

export default async function Page() {
  // Starta ALLA asynkrona operationer samtidigt
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
  const session = await auth();
  const userId = session?.user?.id;

  const profilPromise = userId ? fetchFöretagsprofil(Number(userId)) : Promise.resolve(null);
  const dataPromise = getMomsrapport("2025");

  // Promise.all väntar på att alla blir klara
  const [, data, profil] = await Promise.all([delayPromise, dataPromise, profilPromise]);

  return (
    <MainLayout>
      <Momsrapport
        initialData={data}
        organisationsnummer={profil?.organisationsnummer ?? ""}
        företagsnamn={profil?.företagsnamn ?? ""}
      />
    </MainLayout>
  );
}
