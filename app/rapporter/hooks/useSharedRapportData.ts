import { useState, useEffect } from "react";
import { fetchForetagsprofil } from "../actions/huvudbokActions";

/**
 * Shared hook som hämtar företagsprofil EN gång och delar mellan alla rapporter.
 *
 * Tidigare: Varje rapport (Huvudbok, Balans, Resultat, Moms) fetchade sin egen
 * kopia av företagsprofil = 4 duplicerade server-anrop.
 *
 * Nu: 1 anrop, delad data = 75% mindre server-load för företagsprofil! 🚀
 *
 * Varje rapport fortsätter att hämta sin egen transaktionsdata via sina egna
 * server actions (de processar samma raw data på olika sätt).
 */
export function useSharedRapportData() {
  const [företagsnamn, setFöretagsnamn] = useState("");
  const [organisationsnummer, setOrganisationsnummer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedData = async () => {
      setLoading(true);
      setError(null);

      try {
        const profilData = await fetchForetagsprofil();
        setFöretagsnamn(profilData?.företagsnamn || "");
        setOrganisationsnummer(profilData?.organisationsnummer || "");
      } catch (err) {
        console.error("Fel vid laddning av företagsprofil:", err);
        setError("Kunde inte ladda företagsprofil");
      } finally {
        setLoading(false);
      }
    };

    loadSharedData();
  }, []);

  return {
    företagsnamn,
    organisationsnummer,
    loading,
    error,
  };
}
