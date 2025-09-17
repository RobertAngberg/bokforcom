// #region Imports och Types
"use client";

import TextFalt from "../../../_components/TextFalt";
import { usePersonalStore } from "../../_stores/personalStore";
import { sanitizeFormInput } from "../../../_utils/validationUtils";

export default function Tjänsteställe() {
  const { nyAnställdFormulär, updateNyAnställdFormulär } = usePersonalStore();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl text-white">Tjänsteställe</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TextFalt
          label="Tjänsteställe adress"
          name="tjänsteställeAdress"
          value={nyAnställdFormulär.tjänsteställeAdress || ""}
          onChange={(e) =>
            updateNyAnställdFormulär({ tjänsteställeAdress: sanitizeFormInput(e.target.value) })
          }
        />

        <TextFalt
          label="Tjänsteställe ort"
          name="tjänsteställeOrt"
          value={nyAnställdFormulär.tjänsteställeOrt || ""}
          onChange={(e) =>
            updateNyAnställdFormulär({ tjänsteställeOrt: sanitizeFormInput(e.target.value) })
          }
        />
      </div>
    </div>
  );
}
