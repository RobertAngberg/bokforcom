// #region Huvud
"use client";

import { useState, useEffect } from "react";
import Knapp from "../../_components/Knapp";
import { sparaAnställd } from "../_actions/anstalldaActions";

//#region Business Logic - Migrated from actions.ts
// Säker input-sanitering för HR-data (flyttad från actions.ts)
function sanitizeHRInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/[<>&"'{}()[\]]/g, "") // Ta bort XSS-farliga tecken
    .replace(/\s+/g, " ") // Normalisera whitespace
    .trim()
    .substring(0, 200); // Begränsa längd
}
//#endregion

import Anställningstyp from "./Anstallningstyp";
import KontraktPeriod from "./KontraktPeriod";
import Lön from "./Lon";
import Arbetsbelastning from "./Arbetsbelastning";
import Skatt from "./Skatt";
import Jobbtitel from "./Jobbtitel";
import Semester from "./Semester";
import Tjänsteställe from "./Tjanstestalle";

interface KontraktProps {
  anställd?: any;
  onRedigera?: () => void;
}

interface EditData {
  anställningstyp: string;
  startdatum: Date;
  slutdatum: Date;
  månadslön: string;
  betalningssätt: string;
  kompensation: string;
  ersättningPer: string;
  arbetsbelastning: string;
  arbetsveckaTimmar: string;
  deltidProcent: string;
  skattetabell: string;
  skattekolumn: string;
  jobbtitel: string;
  semesterdagarPerÅr: string;
  tjänsteställeAdress: string;
  tjänsteställeOrt: string;
}
// #endregion

export default function Kontrakt({ anställd }: KontraktProps) {
  // #region State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditData>({
    anställningstyp: "",
    startdatum: new Date(),
    slutdatum: new Date(),
    månadslön: "",
    betalningssätt: "",
    kompensation: "",
    ersättningPer: "",
    arbetsbelastning: "",
    arbetsveckaTimmar: "",
    deltidProcent: "",
    skattetabell: "",
    skattekolumn: "",
    jobbtitel: "",
    semesterdagarPerÅr: "",
    tjänsteställeAdress: "",
    tjänsteställeOrt: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<EditData>({
    anställningstyp: "",
    startdatum: new Date(),
    slutdatum: new Date(),
    månadslön: "",
    betalningssätt: "",
    kompensation: "",
    ersättningPer: "",
    arbetsbelastning: "",
    arbetsveckaTimmar: "",
    deltidProcent: "",
    skattetabell: "",
    skattekolumn: "",
    jobbtitel: "",
    semesterdagarPerÅr: "",
    tjänsteställeAdress: "",
    tjänsteställeOrt: "",
  });
  // #endregion

  // #region Initialize Form Data
  useEffect(() => {
    if (anställd && !isEditing) {
      const data: EditData = {
        anställningstyp: anställd.anställningstyp || "",
        startdatum: anställd.startdatum ? new Date(anställd.startdatum) : new Date(),
        slutdatum: anställd.slutdatum ? new Date(anställd.slutdatum) : new Date(),
        månadslön: anställd.månadslön?.toString() || "",
        betalningssätt: anställd.betalningssätt || "",
        kompensation: anställd.kompensation?.toString() || "",
        ersättningPer: anställd.ersättning_per || "",
        arbetsbelastning: anställd.arbetsbelastning || "",
        arbetsveckaTimmar: anställd.arbetsvecka_timmar?.toString() || "",
        deltidProcent: anställd.deltid_procent?.toString() || "",
        skattetabell: anställd.skattetabell?.toString() || "",
        skattekolumn: anställd.skattekolumn?.toString() || "",
        jobbtitel: anställd.jobbtitel || "",
        semesterdagarPerÅr: anställd.semesterdagar_per_år?.toString() || "",
        tjänsteställeAdress: anställd.tjänsteställe_adress || "",
        tjänsteställeOrt: anställd.tjänsteställe_ort || "",
      };
      setEditData(data);
      setOriginalData(data);
      setHasChanges(false);
    }
  }, [anställd, isEditing]);
  // #endregion

  // #region Handlers
  const handleChange = (name: string, value: any) => {
    // ← Ändra från keyof EditData till string
    const newData = { ...editData, [name]: value };
    setEditData(newData);
    setHasChanges(JSON.stringify(newData) !== JSON.stringify(originalData));

    // Rensa felmeddelanden när användaren börjar redigera
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      const result = await sparaAnställd(
        {
          ...anställd,
          anställningstyp: editData.anställningstyp,
          startdatum: editData.startdatum.toISOString().split("T")[0],
          slutdatum: editData.slutdatum.toISOString().split("T")[0],
          månadslön: editData.månadslön,
          betalningssätt: editData.betalningssätt,
          kompensation: editData.kompensation,
          ersättningPer: editData.ersättningPer,
          arbetsbelastning: editData.arbetsbelastning,
          arbetsvecka: editData.arbetsveckaTimmar,
          deltidProcent: editData.deltidProcent,
          skattetabell: editData.skattetabell,
          skattekolumn: editData.skattekolumn,
          jobbtitel: editData.jobbtitel,
          semesterdagarPerÅr: editData.semesterdagarPerÅr,
          tjänsteställeAdress: editData.tjänsteställeAdress,
          tjänsteställeOrt: editData.tjänsteställeOrt,
        },
        anställd.id
      );

      if (result.success) {
        setIsEditing(false);
        setHasChanges(false);
        setOriginalData(editData);
        setErrorMessage(null);
        Object.assign(anställd, {
          anställningstyp: editData.anställningstyp,
          startdatum: editData.startdatum.toISOString().split("T")[0],
          slutdatum: editData.slutdatum.toISOString().split("T")[0],
          månadslön: parseFloat(editData.månadslön) || 0,
          betalningssätt: editData.betalningssätt,
          kompensation: parseFloat(editData.kompensation) || 0,
          ersättning_per: editData.ersättningPer,
          arbetsbelastning: editData.arbetsbelastning,
          arbetsvecka_timmar: parseFloat(editData.arbetsveckaTimmar) || 0,
          deltid_procent: parseFloat(editData.deltidProcent) || 0,
          skattetabell: parseFloat(editData.skattetabell) || 0,
          skattekolumn: parseFloat(editData.skattekolumn) || 0,
          jobbtitel: editData.jobbtitel,
          semesterdagar_per_år: parseFloat(editData.semesterdagarPerÅr) || 0,
          tjänsteställe_adress: editData.tjänsteställeAdress,
          tjänsteställe_ort: editData.tjänsteställeOrt,
        });
      } else {
        setErrorMessage(result.error || "Ett fel uppstod vid sparande");
      }
    } catch (error) {
      setErrorMessage("Ett fel uppstod vid sparande");
    }
  };

  const handleCancel = () => {
    setEditData(originalData);
    setIsEditing(false);
    setHasChanges(false);
    setErrorMessage(null);
  };
  // #endregion

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          Kontrakt för {anställd.förnamn} {anställd.efternamn}
        </h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <Knapp text="Redigera" onClick={() => setIsEditing(true)} />
          ) : (
            <>
              <div className={!hasChanges ? "opacity-50 cursor-not-allowed" : ""}>
                <Knapp text="Spara" onClick={hasChanges ? handleSave : undefined} />
              </div>
              <Knapp text="Avbryt" onClick={handleCancel} />
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Fel: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-8">
          <Anställningstyp editData={editData} handleChange={handleChange} />
          <KontraktPeriod editData={editData} handleChange={handleChange} />
          <Lön editData={editData} handleChange={handleChange} />
          <Arbetsbelastning editData={editData} handleChange={handleChange} />
          <Skatt editData={editData} handleChange={handleChange} />
          <Jobbtitel editData={editData} handleChange={handleChange} />
          <Semester editData={editData} handleChange={handleChange} />
          <Tjänsteställe editData={editData} handleChange={handleChange} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vänster kolumn */}
          <div className="space-y-6">
            <KontraktPeriod anställd={anställd} viewMode />
            <Lön anställd={anställd} viewMode />
            <Arbetsbelastning anställd={anställd} viewMode />
          </div>

          {/* Höger kolumn */}
          <div className="space-y-6">
            <Skatt anställd={anställd} viewMode />
            <Jobbtitel anställd={anställd} viewMode />
            <Semester anställd={anställd} viewMode />
            <Tjänsteställe anställd={anställd} viewMode />
          </div>
        </div>
      )}
    </div>
  );
}
