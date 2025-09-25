"use client";

import AnimeradFlik from "../../../_components/AnimeradFlik";
import Knapp from "../../../_components/Knapp";
import Information from "./Information/Information";
import UtlaggFlik from "./Utlagg/UtlaggFlik";
import Kontrakt from "./Kontrakt/Kontrakt";
import Lonespecar from "./Lonespecar/Lonespecar";
import Semester from "./Semester/Semester";
import { useUtlagg } from "../../hooks/useUtlagg";
import type { AnställdData } from "../../types/types";

interface AnställdFlikProps {
  anställd: AnställdData;
  onTaBort: (id: number, namn: string) => void;
}

export default function AnställdFlik({ anställd, onTaBort }: AnställdFlikProps) {
  const { laddaUtläggFörAnställd } = useUtlagg(anställd.id);

  const anställdNamn = `${anställd.förnamn} ${anställd.efternamn}`;
  const anställdInfo = `${anställdNamn}${anställd.jobbtitel ? " - " + anställd.jobbtitel : ""}`;

  return (
    <div className="mb-4">
      <AnimeradFlik title={anställdInfo} icon="👤">
        <div className="space-y-4">
          {/* Anställd detaljer som nested animerade flikar */}
          <AnimeradFlik title="Personalinformation" icon="📋">
            <Information
              state={{
                valdAnställd: anställd,
                personalIsEditing: false,
                personalHasChanges: false,
                personalErrorMessage: null,
                personalEditData: {
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
                },
              }}
              handlers={{
                personalOnEdit: () => console.log("Edit clicked"),
                personalOnSave: () => console.log("Save clicked"),
                personalOnCancel: () => console.log("Cancel clicked"),
                personalOnChange: (name: string, value: string) =>
                  console.log("Change:", name, value),
              }}
            />
          </AnimeradFlik>

          <AnimeradFlik title="Utlägg" icon="💳">
            <UtlaggFlik
              state={{
                valdAnställd: anställd,
                // Utlägg state laddas via useUtlagg hook
              }}
              handlers={{
                laddaUtläggFörAnställd,
              }}
            />
          </AnimeradFlik>

          <AnimeradFlik title="Kontrakt" icon="📄">
            <Kontrakt anställd={anställd} />
          </AnimeradFlik>

          <AnimeradFlik title="Lönespecar" icon="💰">
            <Lonespecar
              anställd={{
                id: anställd.id || 0,
                namn: anställdNamn,
                epost: anställd.mail,
              }}
            />
          </AnimeradFlik>

          <AnimeradFlik title="Semester" icon="🏖️">
            <Semester
              anställd={{
                ...anställd,
                id: anställd.id || 0,
                kompensation: parseFloat(anställd.kompensation || "0") || 0,
                anställningsdatum: anställd.anställningsdatum || anställd.startdatum,
              }}
              userId={anställd?.id || 0}
            />
          </AnimeradFlik>

          {/* Ta bort anställd - längst ner */}
          <div className="flex justify-end mt-6">
            <Knapp
              text="❌ Ta bort anställd"
              onClick={() => onTaBort(anställd.id || 0, anställdNamn)}
              type="button"
            />
          </div>
        </div>
      </AnimeradFlik>
    </div>
  );
}
