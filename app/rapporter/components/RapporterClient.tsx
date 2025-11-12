"use client";

import AnimeradFlik from "../../_components/AnimeradFlik";
import Huvudbok from "./Huvudbok/Huvudbok";
import Balansrapport from "./Balansrapport/Balansrapport";
import Resultatrapport from "./Resultatrapport/Resultatrapport";
import Momsrapport from "./Momsrapport/Momsrapport";
import type { RapporterClientProps } from "../types/types";

export default function RapporterClient({ initialData, foretagsprofil }: RapporterClientProps) {
  return (
    <>
      <h1 className="text-3xl mb-8 text-center text-white">Rapporter</h1>

      <AnimeradFlik title="Huvudbok" icon="📚" forcedOpen={false}>
        <Huvudbok data={initialData} foretagsprofil={foretagsprofil} />
      </AnimeradFlik>

      <div className="mt-6">
        <AnimeradFlik title="Balansrapport" icon="🏦" forcedOpen={false}>
          <Balansrapport data={initialData} foretagsprofil={foretagsprofil} />
        </AnimeradFlik>
      </div>

      <div className="mt-6">
        <AnimeradFlik title="Resultatrapport" icon="📈" forcedOpen={false}>
          <Resultatrapport transaktionsdata={initialData} foretagsprofil={foretagsprofil} />
        </AnimeradFlik>
      </div>

      <div className="mt-6">
        <AnimeradFlik title="Momsrapport" icon="📑" forcedOpen={false}>
          <Momsrapport transaktionsdata={initialData} foretagsprofil={foretagsprofil} />
        </AnimeradFlik>
      </div>
    </>
  );
}
