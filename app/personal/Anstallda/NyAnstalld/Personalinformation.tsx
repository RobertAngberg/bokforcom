// #region Imports och Types
"use client";

import { useState, useEffect } from "react";
import TextFalt from "../../../_components/TextFalt";
import Knapp from "../../../_components/Knapp";
import { sparaAnställd } from "../../actions";

interface PersonalinformationProps {
  anställd?: any;
  personalData?: {
    förnamn: string;
    efternamn: string;
    personnummer: string;
    jobbtitel: string;
    clearingnummer: string;
    bankkonto: string;
    mail: string;
    adress: string;
    postnummer: string;
    ort: string;
  };
  handleChange?: (e: any) => void;
  onRedigera?: () => void;
}
// #endregion

export default function Personalinformation({
  anställd,
  personalData,
  handleChange,
}: PersonalinformationProps) {
  // #region State för editable mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
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
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({
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
  // #endregion

  // #region Initialize edit data when anställd changes - FLYTTA UTANFÖR CONDITIONAL
  useEffect(() => {
    if (anställd && !isEditing) {
      const data = {
        förnamn: anställd.förnamn || "",
        efternamn: anställd.efternamn || "",
        personnummer: anställd.personnummer || "",
        jobbtitel: anställd.jobbtitel || "",
        clearingnummer: anställd.clearingnummer || "",
        bankkonto: anställd.bankkonto || "",
        mail: anställd.mail || "",
        adress: anställd.adress || "",
        postnummer: anställd.postnummer || "",
        ort: anställd.ort || "",
      };
      setEditData(data);
      setOriginalData(data);
      setHasChanges(false);
    }
  }, [anställd, isEditing]);
  // #endregion

  // #region Edit handlers
  const handleEditChange = (e: any) => {
    const { name, value } = e.target;
    const newData = { ...editData, [name]: value };
    setEditData(newData);

    // Check if there are changes
    const hasChangesNow = JSON.stringify(newData) !== JSON.stringify(originalData);
    setHasChanges(hasChangesNow);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!hasChanges) return; // Förhindra sparning om inga ändringar

    try {
      const result = await sparaAnställd(
        {
          förnamn: editData.förnamn,
          efternamn: editData.efternamn,
          personnummer: editData.personnummer,
          jobbtitel: editData.jobbtitel,
          mail: editData.mail,
          clearingnummer: editData.clearingnummer,
          bankkonto: editData.bankkonto,
          adress: editData.adress,
          postnummer: editData.postnummer,
          ort: editData.ort,
          startdatum: anställd.startdatum || new Date().toISOString().split("T")[0],
          slutdatum: anställd.förnya_kontrakt || new Date().toISOString().split("T")[0],
          anställningstyp: anställd.anställningstyp || "",
          löneperiod: anställd.löneperiod || "",
          ersättningPer: anställd.ersättning_per || "",
          kompensation: anställd.kompensation?.toString() || "",
          arbetsvecka: anställd.arbetsvecka_timmar?.toString() || "",
          arbetsbelastning: anställd.arbetsbelastning || "",
          deltidProcent: anställd.deltid_procent?.toString() || "",
          tjänsteställeAdress: anställd.tjänsteställe_adress || "",
          tjänsteställeOrt: anställd.tjänsteställe_ort || "",
          skattetabell: anställd.skattetabell?.toString() || "",
          skattekolumn: anställd.skattekolumn?.toString() || "",
        },
        anställd.id
      );

      if (result.success) {
        alert("Personalinformation uppdaterad!");
        setIsEditing(false);
        setHasChanges(false);
        setOriginalData(editData);
        // Uppdatera anställd objektet lokalt
        Object.assign(anställd, editData);
      } else {
        alert("Fel: " + result.error);
      }
    } catch (error) {
      console.error("Sparfel:", error);
      alert("Ett fel uppstod vid sparande");
    }
  };

  const handleCancelEdit = () => {
    setEditData(originalData);
    setIsEditing(false);
    setHasChanges(false);
  };
  // #endregion

  // FORMULÄR-LÄGE (om personalData och handleChange finns)
  if (personalData && handleChange) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl text-white">Personalinformation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TextFalt
            label="Förnamn"
            name="förnamn"
            value={personalData.förnamn || ""}
            onChange={handleChange}
          />

          <TextFalt
            label="Efternamn"
            name="efternamn"
            value={personalData.efternamn || ""}
            onChange={handleChange}
          />

          <TextFalt
            label="Personnummer"
            name="personnummer"
            type="number"
            value={personalData.personnummer || ""}
            onChange={handleChange}
          />

          <TextFalt
            label="Jobbtitel"
            name="jobbtitel"
            value={personalData.jobbtitel || ""}
            onChange={handleChange}
          />

          <TextFalt
            label="Clearingnummer"
            name="clearingnummer"
            value={personalData.clearingnummer || ""}
            onChange={handleChange}
          />

          <TextFalt
            label="Bankkonto"
            name="bankkonto"
            value={personalData.bankkonto || ""}
            onChange={handleChange}
          />

          <TextFalt
            label="Mail"
            name="mail"
            type="email"
            value={personalData.mail || ""}
            onChange={handleChange}
          />

          <TextFalt
            label="Adress"
            name="adress"
            value={personalData.adress || ""}
            onChange={handleChange}
          />

          <TextFalt
            label="Postnummer"
            name="postnummer"
            value={personalData.postnummer || ""}
            onChange={handleChange}
          />

          <TextFalt label="Ort" name="ort" value={personalData.ort || ""} onChange={handleChange} />
        </div>
      </div>
    );
  }

  // VISNINGS-LÄGE (om anställd finns)
  if (anställd) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl text-white">
            Personalinformation för {anställd.förnamn} {anställd.efternamn}
          </h2>
          <div className="flex gap-2">
            {!isEditing ? (
              <Knapp text="Redigera" onClick={handleStartEdit} />
            ) : (
              <>
                <div
                  className={`${!hasChanges ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Knapp text="Spara" onClick={hasChanges ? handleSaveEdit : undefined} />
                </div>
                <Knapp text="Avbryt" onClick={handleCancelEdit} />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isEditing ? (
            // Edit mode
            <>
              <TextFalt
                label="Förnamn"
                name="förnamn"
                value={editData.förnamn}
                onChange={handleEditChange}
              />
              <TextFalt
                label="Efternamn"
                name="efternamn"
                value={editData.efternamn}
                onChange={handleEditChange}
              />
              <TextFalt
                label="Personnummer"
                name="personnummer"
                value={editData.personnummer}
                onChange={handleEditChange}
              />
              <TextFalt
                label="Jobbtitel"
                name="jobbtitel"
                value={editData.jobbtitel}
                onChange={handleEditChange}
              />
              <TextFalt
                label="E-post"
                name="mail"
                type="email"
                value={editData.mail}
                onChange={handleEditChange}
              />
              <TextFalt
                label="Clearingnummer"
                name="clearingnummer"
                value={editData.clearingnummer}
                onChange={handleEditChange}
              />
              <TextFalt
                label="Bankkonto"
                name="bankkonto"
                value={editData.bankkonto}
                onChange={handleEditChange}
              />
              <TextFalt
                label="Adress"
                name="adress"
                value={editData.adress}
                onChange={handleEditChange}
              />
              <TextFalt
                label="Postnummer"
                name="postnummer"
                value={editData.postnummer}
                onChange={handleEditChange}
              />
              <TextFalt label="Ort" name="ort" value={editData.ort} onChange={handleEditChange} />
            </>
          ) : (
            // View mode
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Förnamn</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.förnamn || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Efternamn</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.efternamn || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Personnummer</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.personnummer || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Jobbtitel</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.jobbtitel || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">E-post</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.mail || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Clearingnummer</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.clearingnummer || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Bankkonto</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.bankkonto || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Adress</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.adress || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Postnummer</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.postnummer || "Ej angiven"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Ort</label>
                <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                  {anställd.ort || "Ej angiven"}
                </div>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="mt-6 p-4 bg-slate-800 rounded">
            <h4 className="text-white font-medium mb-2">Registreringsinfo</h4>
            <p className="text-gray-400 text-sm">
              Registrerad: {new Date(anställd.skapad).toLocaleDateString()} kl.{" "}
              {new Date(anställd.skapad).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT - ingen data
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl text-white font-semibold">Personalinformation</h3>
        <p className="text-gray-400">Välj en anställd för att visa information.</p>
      </div>
    </div>
  );
}
