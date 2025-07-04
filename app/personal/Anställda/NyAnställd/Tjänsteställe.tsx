// #region Imports och Types
"use client";

import TextFält from "../../../_components/TextFält";

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
        <TextFält
          label="Tjänsteställe adress"
          name="tjänsteställeAdress"
          value={tjänsteställeAdress}
          onChange={(e) => setTjänsteställeAdress(e.target.value)}
        />

        <TextFält
          label="Tjänsteställe ort"
          name="tjänsteställeOrt"
          value={tjänsteställeOrt}
          onChange={(e) => setTjänsteställeOrt(e.target.value)}
        />
      </div>
    </div>
  );
}
