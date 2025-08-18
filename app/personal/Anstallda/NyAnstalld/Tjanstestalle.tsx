// #region Imports och Types
"use client";

import TextFalt from "../../../_components/TextFalt";

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

interface TjänsteställeProps {
  tjänsteställeAdress: string;
  setTjänsteställeAdress: (value: string) => void;
  tjänsteställeOrt: string;
  setTjänsteställeOrt: (value: string) => void;
}
// #endregion

export default function Tjänsteställe({
  tjänsteställeAdress,
  setTjänsteställeAdress,
  tjänsteställeOrt,
  setTjänsteställeOrt,
}: TjänsteställeProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl text-white">Tjänsteställe</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TextFalt
          label="Tjänsteställe adress"
          name="tjänsteställeAdress"
          value={tjänsteställeAdress}
          onChange={(e) => setTjänsteställeAdress(sanitizeHRInput(e.target.value))}
        />

        <TextFalt
          label="Tjänsteställe ort"
          name="tjänsteställeOrt"
          value={tjänsteställeOrt}
          onChange={(e) => setTjänsteställeOrt(sanitizeHRInput(e.target.value))}
        />
      </div>
    </div>
  );
}
