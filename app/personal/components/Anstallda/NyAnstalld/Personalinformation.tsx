// #region Imports och Types
"use client";

import TextFalt from "../../../../_components/TextFalt";
import { useNyAnstalld } from "../../../hooks/useNyAnstalld";

export default function Personalinformation() {
  const {
    state: { nyAnställdFormulär },
    actions: { handleSanitizedChange },
  } = useNyAnstalld();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl text-white">Personalinformation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TextFalt
          label="Förnamn"
          name="förnamn"
          value={nyAnställdFormulär.förnamn || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Efternamn"
          name="efternamn"
          value={nyAnställdFormulär.efternamn || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Personnummer"
          name="personnummer"
          type="number"
          value={nyAnställdFormulär.personnummer || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Jobbtitel"
          name="jobbtitel"
          value={nyAnställdFormulär.jobbtitel || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Clearingnummer"
          name="clearingnummer"
          value={nyAnställdFormulär.clearingnummer || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Bankkonto"
          name="bankkonto"
          value={nyAnställdFormulär.bankkonto || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Mail"
          name="mail"
          type="email"
          value={nyAnställdFormulär.mail || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Adress"
          name="adress"
          value={nyAnställdFormulär.adress || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Postnummer"
          name="postnummer"
          value={nyAnställdFormulär.postnummer || ""}
          onChange={handleSanitizedChange}
        />

        <TextFalt
          label="Ort"
          name="ort"
          value={nyAnställdFormulär.ort || ""}
          onChange={handleSanitizedChange}
        />
      </div>
    </div>
  );
}
