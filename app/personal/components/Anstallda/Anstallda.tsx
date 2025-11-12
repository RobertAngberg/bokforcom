"use client";

import { useEffect } from "react";
import AnimeradFlik from "../../../_components/AnimeradFlik";
import Knapp from "../../../_components/Knapp";
import Information from "./Information/Information";
import UtlaggFlik from "./Utlagg/UtlaggFlik";
import Kontrakt from "./Kontrakt/Kontrakt";
import Lonespecar from "./Lonespecar/Lonespecar";
import Semester from "./Semester/Semester";
import { useAnstallda } from "../../hooks/useAnstallda";
import type { AnställdFlikProps } from "../../types/types";

export default function AnställdFlik({ anställd, onTaBort }: AnställdFlikProps) {
  // skipDataFetch = true eftersom vi INTE vill att varje anställd-komponent
  // ska försöka hämta data. Data hämtas redan av Personal.tsx!
  const { state, handlers, actions } = useAnstallda({ skipDataFetch: true });

  // Sätt valdAnställd när komponenten mountar
  useEffect(() => {
    if (anställd && (!state.valdAnställd || state.valdAnställd.id !== anställd.id)) {
      actions.setValdAnställd(anställd);
    }
  }, [anställd, state.valdAnställd, actions]);

  const anställdNamn = `${anställd.förnamn} ${anställd.efternamn}`;
  const anställdInfo = `${anställdNamn}${anställd.jobbtitel ? " - " + anställd.jobbtitel : ""}`;

  return (
    <div className="mb-4">
      <AnimeradFlik title={anställdInfo} icon="👤">
        <div className="space-y-4">
          <AnimeradFlik title="Personalinformation" icon="📋">
            <Information
              state={{
                ...state,
                valdAnställd: anställd,
              }}
              handlers={handlers}
            />
          </AnimeradFlik>

          <AnimeradFlik title="Utlägg" icon="💳">
            <UtlaggFlik
              state={{
                valdAnställd: anställd,
              }}
            />
          </AnimeradFlik>

          <AnimeradFlik title="Kontrakt" icon="📄">
            <Kontrakt
              anställd={{
                ...anställd,
                id: anställd.id || 0,
                namn: anställdNamn,
                epost: anställd.mail,
              }}
            />
          </AnimeradFlik>

          <AnimeradFlik title="Lönespecar" icon="💰">
            <Lonespecar
              anställd={{
                id: anställd.id || 0,
                namn: anställdNamn,
                epost: anställd.mail,
                skattetabell: anställd.skattetabell,
                skattekolumn: anställd.skattekolumn,
                sparade_dagar: anställd.sparade_dagar,
                använda_förskott: anställd.använda_förskott,
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
