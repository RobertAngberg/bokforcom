import { fetchFavoritforval } from "../_actions/actions";
import { getLeverantörer } from "../../faktura/actions";
import { PageProps } from "../_types/types";

export async function useBokforServerData(searchParams: PageProps["searchParams"]) {
  // Hämta data server-side
  const params = await searchParams;
  const favoritFörvalen = await fetchFavoritforval();

  // Extrahera state från URL params
  const currentStep = params.step ? parseInt(params.step as string) : 1;
  const isLevfaktMode = params.levfakt === "true";
  const isUtlaggMode = params.utlagg === "true";
  const leverantorId = params.leverantorId ? parseInt(params.leverantorId as string) : null;

  // Hämta leverantör om leverantorId finns
  let leverantör = null;
  if (leverantorId) {
    const result = await getLeverantörer();
    if (result.success && result.leverantörer) {
      leverantör = result.leverantörer.find((l) => l.id === leverantorId) || null;
    }
  }

  return {
    initialData: {
      favoritFörvalen,
      currentStep,
      isLevfaktMode,
      isUtlaggMode,
      leverantör,
    },
  };
}
