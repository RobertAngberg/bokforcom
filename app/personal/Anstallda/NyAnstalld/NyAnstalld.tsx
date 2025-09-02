"use client";

import { useState } from "react";
import Personalinformation from "./Personalinformation";
import Kompensation from "./Kompensation";
import Tjänsteställe from "./Tjanstestalle";
import Skatt from "./Skatt";
import Knapp from "../../../_components/Knapp";
import { sparaAnställd } from "../../actions";

export default function NyAnställd({
  onSparad,
  onAvbryt,
}: {
  onSparad?: () => void;
  onAvbryt?: () => void;
}) {
  // State för alla fält
  const [personalData, setPersonalData] = useState({
    förnamn: "",
    efternamn: "",
    personnummer: "",
    jobbtitel: "",
    clearingnummer: "",
    bankkonto: "",
    mail: "",
    adress: "",
    postnummer: "",
    ort: "",
  });

  const [startdatum, setStartdatum] = useState<Date>(new Date());
  const [slutdatum, setSlutdatum] = useState<Date>(() => {
    const datum = new Date();
    datum.setFullYear(datum.getFullYear() + 1);
    return datum;
  });

  const [anställningstyp, setAnställningstyp] = useState("");
  const [löneperiod, setLöneperiod] = useState("");
  const [ersättningPer, setErsättningPer] = useState("");
  const [kompensation, setKompensation] = useState("");
  const [arbetsvecka, setArbetsvecka] = useState("");
  const [arbetsbelastning, setArbetsbelastning] = useState("");
  const [deltidProcent, SetDeltidProcent] = useState("");

  const [tjänsteställeAdress, setTjänsteställeAdress] = useState("");
  const [tjänsteställeOrt, setTjänsteställeOrt] = useState("");

  const [skattetabell, setSkattetabell] = useState("");
  const [skattekolumn, setSkattekolumn] = useState("");
  const [växaStöd, setVäxaStöd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hantera ändring i personalData
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setPersonalData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Rensa fel- och success-meddelanden när användaren börjar redigera
    if (errorMessage) {
      setErrorMessage(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  // Spara ny anställd
  const handleSpara = async () => {
    setLoading(true);
    const data = {
      ...personalData,
      startdatum: startdatum.toISOString().split("T")[0],
      slutdatum: slutdatum.toISOString().split("T")[0],
      anställningstyp,
      löneperiod,
      ersättningPer,
      kompensation,
      arbetsvecka,
      arbetsbelastning,
      deltidProcent,
      tjänsteställeAdress,
      tjänsteställeOrt,
      skattetabell,
      skattekolumn,
      växaStöd,
    };
    try {
      const result = await sparaAnställd(data);
      if (result.success) {
        setErrorMessage(null);
        setSuccessMessage("Anställd sparad framgångsrikt! ✅");
        // Töm success meddelande efter 3 sekunder
        setTimeout(() => setSuccessMessage(null), 3000);
        if (onSparad) onSparad();
      } else {
        setSuccessMessage(null);
        setErrorMessage(result.error || "Ett fel uppstod vid sparande");
      }
    } catch (error) {
      setSuccessMessage(null);
      setErrorMessage("Ett fel uppstod vid sparande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Ny anställd</h2>

      <Personalinformation personalData={personalData} handleChange={handleChange} />

      <Kompensation
        startdatum={startdatum}
        setStartdatum={setStartdatum}
        slutdatum={slutdatum}
        setSlutdatum={setSlutdatum}
        anställningstyp={anställningstyp}
        setAnställningstyp={setAnställningstyp}
        löneperiod={löneperiod}
        setLöneperiod={setLöneperiod}
        ersättningPer={ersättningPer}
        setErsättningPer={setErsättningPer}
        kompensation={kompensation}
        setKompensation={setKompensation}
        arbetsvecka={arbetsvecka}
        setArbetsvecka={setArbetsvecka}
        arbetsbelastning={arbetsbelastning}
        setArbetsbelastning={setArbetsbelastning}
        deltidProcent={deltidProcent}
        SetDeltidProcent={SetDeltidProcent}
      />

      <Tjänsteställe
        tjänsteställeAdress={tjänsteställeAdress}
        setTjänsteställeAdress={setTjänsteställeAdress}
        tjänsteställeOrt={tjänsteställeOrt}
        setTjänsteställeOrt={setTjänsteställeOrt}
      />

      <Skatt
        skattetabell={skattetabell}
        setSkattetabell={setSkattetabell}
        skattekolumn={skattekolumn}
        setSkattekolumn={setSkattekolumn}
      />

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong className="font-bold">Klart! </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Fel: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Knapp text={loading ? "Sparar..." : "Spara"} onClick={handleSpara} disabled={loading} />
        <Knapp text="Avbryt" onClick={onAvbryt} />
      </div>
    </div>
  );
}
