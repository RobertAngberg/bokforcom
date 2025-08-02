import Bokför from "./Bokfor";
import { fetchFavoritforval } from "./actions";

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function Page({ searchParams }: PageProps) {
  // Await searchParams för NextJS kompatibilitet
  const params = await searchParams;

  // Kolla om vi är i leverantörsfaktura-mode
  const isLevfaktMode = params.levfakt === "true";
  const leverantorId = params.leverantorId ? parseInt(params.leverantorId as string) : null;

  // Starta ALLA asynkrona operationer samtidigt
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
  const favoritFörvalenPromise = fetchFavoritforval();

  // Promise.all väntar på att alla blir klara (delay + data hämtas parallellt)
  const [, favoritFörvalen] = await Promise.all([delayPromise, favoritFörvalenPromise]);

  return (
    <Bokför
      favoritFörvalen={favoritFörvalen}
      levfaktMode={isLevfaktMode}
      leverantorId={leverantorId}
    />
  );
}
