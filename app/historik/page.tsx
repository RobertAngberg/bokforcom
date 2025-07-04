import Historik from "./Historik";
import { fetchTransaktioner } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const delayPromise = new Promise((r) => setTimeout(r, 400));
  const dataPromise = fetchTransaktioner();

  const [, result] = await Promise.all([delayPromise, dataPromise]);

  const historyData =
    result.success && Array.isArray(result.data)
      ? result.data.map((item: any) => ({
          transaktions_id: item.id,
          transaktionsdatum: new Date(item.transaktionsdatum).toISOString().slice(0, 10),
          kontobeskrivning: item.kontobeskrivning || "",
          belopp: item.belopp ?? 0,
          kommentar: item.kommentar ?? "",
          fil: item.fil ?? "",
          blob_url: item.blob_url ?? "",
        }))
      : [];

  return <Historik initialData={historyData} />;
}
