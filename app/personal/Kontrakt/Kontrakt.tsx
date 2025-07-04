// #region Huvud
"use client";

import { useState, useEffect } from "react";
import Knapp from "../../_components/Knapp";
import { sparaAnställd } from "../actions";
import Anställningstyp from "./Anställningstyp";
import KontraktPeriod from "./KontraktPeriod";
import Lön from "./Lön";
import Arbetsbelastning from "./Arbetsbelastning";
import Skatt from "./Skatt";
import Jobbtitel from "./Jobbtitel";
import Semester from "./Semester";
import Tjänsteställe from "./Tjänsteställe";

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
  växaStöd: boolean;
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
    växaStöd: false,
    tjänsteställeAdress: "",
    tjänsteställeOrt: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
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
    växaStöd: false,
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
        växaStöd: anställd.växa_stöd || false,
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
          växaStöd: editData.växaStöd,
          tjänsteställeAdress: editData.tjänsteställeAdress,
          tjänsteställeOrt: editData.tjänsteställeOrt,
        },
        anställd.id
      );

      if (result.success) {
        alert("Kontraktsinformation uppdaterad!");
        setIsEditing(false);
        setHasChanges(false);
        setOriginalData(editData);
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
          växa_stöd: editData.växaStöd,
          tjänsteställe_adress: editData.tjänsteställeAdress,
          tjänsteställe_ort: editData.tjänsteställeOrt,
        });
      } else {
        alert("Fel: " + result.error);
      }
    } catch (error) {
      alert("Ett fel uppstod vid sparande");
    }
  };

  const handleCancel = () => {
    setEditData(originalData);
    setIsEditing(false);
    setHasChanges(false);
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
