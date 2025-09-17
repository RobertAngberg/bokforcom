// #region Huvud
"use client";

import Knapp from "../../_components/Knapp";
import Anställningstyp from "./Anstallningstyp";
import KontraktPeriod from "./KontraktPeriod";
import Lön from "./Lon";
import Arbetsbelastning from "./Arbetsbelastning";
import Skatt from "./Skatt";
import Jobbtitel from "./Jobbtitel";
import Semester from "./Semester";
import Tjänsteställe from "./Tjanstestalle";
import type { KontraktProps } from "./_types/types";
import { useKontrakt } from "../_hooks/useKontrakt";
// #endregion

export default function Kontrakt({ anställd }: KontraktProps) {
  const { state, handlers } = useKontrakt(anställd);
  const anstalld = state.visningsAnställd;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          Kontrakt för {anstalld?.förnamn} {anstalld?.efternamn}
        </h2>
        <div className="flex gap-2">
          {!state.isEditing ? (
            <Knapp text="Redigera" onClick={handlers.onEdit} />
          ) : (
            <>
              <div className={!state.hasChanges ? "opacity-50 cursor-not-allowed" : ""}>
                <Knapp text="Spara" onClick={state.hasChanges ? handlers.onSave : undefined} />
              </div>
              <Knapp text="Avbryt" onClick={handlers.onCancel} />
            </>
          )}
        </div>
      </div>

      {state.errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Fel: </strong>
          <span className="block sm:inline">{state.errorMessage}</span>
        </div>
      )}

      {state.isEditing ? (
        <div className="space-y-8">
          <Anställningstyp />
          <KontraktPeriod editData={state.editData} handleChange={handlers.onChange} />
          <Lön editData={state.editData} handleChange={handlers.onChange} />
          <Arbetsbelastning />
          <Skatt editData={state.editData} handleChange={handlers.onChange} />
          <Jobbtitel editData={state.editData} handleChange={handlers.onChange} />
          <Semester editData={state.editData} handleChange={handlers.onChange} />
          <Tjänsteställe editData={state.editData} handleChange={handlers.onChange} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vänster kolumn */}
          <div className="space-y-6">
            <KontraktPeriod anställd={anstalld} viewMode />
            <Lön anställd={anstalld} viewMode />
            <Arbetsbelastning viewMode />
          </div>

          {/* Höger kolumn */}
          <div className="space-y-6">
            <Skatt anställd={anstalld} viewMode />
            <Jobbtitel anställd={anstalld} viewMode />
            <Semester anställd={anstalld} viewMode />
            <Tjänsteställe anställd={anstalld} viewMode />
          </div>
        </div>
      )}
    </div>
  );
}
