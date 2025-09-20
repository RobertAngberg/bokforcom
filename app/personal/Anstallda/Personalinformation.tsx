"use client";

import TextFalt from "../../_components/TextFalt";
import Knapp from "../../_components/Knapp";
import { useAnstallda } from "../_hooks/useAnstallda";

export default function Personalinformation() {
  const {
    state: { valdAnställd: visningsAnställd, ...state },
    handlers,
  } = useAnstallda();

  if (!visningsAnställd) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-white">Personalinformation</h2>
        <div className="flex gap-2">
          {!state.personalIsEditing ? (
            <Knapp text="Redigera" onClick={handlers.personalOnEdit} />
          ) : (
            <>
              <div className={!state.personalHasChanges ? "opacity-50 cursor-not-allowed" : ""}>
                <Knapp
                  text="Spara"
                  onClick={state.personalHasChanges ? handlers.personalOnSave : undefined}
                />
              </div>
              <Knapp text="Avbryt" onClick={handlers.personalOnCancel} />
            </>
          )}
        </div>
      </div>

      {state.personalErrorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Fel: </strong>
          <span className="block sm:inline">{state.personalErrorMessage}</span>
        </div>
      )}

      {!state.personalIsEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(
            [
              ["Förnamn", (visningsAnställd as any).förnamn],
              ["Efternamn", (visningsAnställd as any).efternamn],
              ["Personnummer", (visningsAnställd as any).personnummer],
              ["Jobbtitel", (visningsAnställd as any).jobbtitel],
              ["Clearingnummer", (visningsAnställd as any).clearingnummer],
              ["Bankkonto", (visningsAnställd as any).bankkonto],
              ["Mail", (visningsAnställd as any).mail],
              ["Adress", (visningsAnställd as any).adress],
              ["Postnummer", (visningsAnställd as any).postnummer],
              ["Ort", (visningsAnställd as any).ort],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="bg-slate-800 p-6 rounded-lg">
              <span className="text-gray-400">{label}:</span>
              <div className="text-white">{value || "Ej angiven"}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TextFalt
            label="Förnamn"
            name="förnamn"
            value={state.personalEditData.förnamn}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Efternamn"
            name="efternamn"
            value={state.personalEditData.efternamn}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Personnummer"
            name="personnummer"
            type="number"
            value={state.personalEditData.personnummer}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Jobbtitel"
            name="jobbtitel"
            value={state.personalEditData.jobbtitel}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Clearingnummer"
            name="clearingnummer"
            value={state.personalEditData.clearingnummer}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Bankkonto"
            name="bankkonto"
            value={state.personalEditData.bankkonto}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Mail"
            name="mail"
            type="email"
            value={state.personalEditData.mail}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Adress"
            name="adress"
            value={state.personalEditData.adress}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Postnummer"
            name="postnummer"
            value={state.personalEditData.postnummer}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
          <TextFalt
            label="Ort"
            name="ort"
            value={state.personalEditData.ort}
            onChange={(e) => handlers.personalOnChange(e.target.name, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
