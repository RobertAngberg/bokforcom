"use client";

import Knapp from "../../../_components/Knapp";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import NyAnställd from "./NyAnstalld/NyAnstalld";
import AnställdaLista from "./AnstalldaLista/AnstalldaLista";
import AnimeradFlik from "../../../_components/AnimeradFlik";
import UtlaggFlik from "./Utlagg/UtlaggFlik";
import Information from "./Information/Information";
import Kontrakt from "./Kontrakt/Kontrakt";
import Lonespecar from "./Lonespecar/Lonespecar";
import Semester from "./Semester/Semester";
import { useAnstallda } from "../../hooks/useAnstallda";

export default function Anstallda() {
  const { state, handlers } = useAnstallda();
  const { valdAnställd } = state;

  return (
    <>
      <h1 className="text-3xl text-white mb-6 text-center">Anställda</h1>

      <div className="space-y-6">
        {!state.visaNyAnställdFormulär ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl text-white font-semibold">Sparade anställda</h3>
              <Knapp text="Lägg till anställd" onClick={handlers.visaNyAnställd} />
            </div>

            {state.anställdaError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong className="font-bold">Fel: </strong>
                <span className="block sm:inline">{state.anställdaError}</span>
              </div>
            )}

            {state.anställdaLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : !state.harAnställda ? (
              <p className="text-gray-400">Inga anställda sparade än.</p>
            ) : (
              <AnställdaLista state={state} handlers={handlers} />
            )}
          </div>
        ) : (
          <NyAnställd handlers={handlers} />
        )}
      </div>

      {valdAnställd && (
        <div className="mt-8">
          <AnimeradFlik title="Personalinformation" icon="📋">
            <Information state={state} handlers={handlers} />
          </AnimeradFlik>
          <AnimeradFlik title="Kontrakt" icon="📄">
            <Kontrakt
              anställd={{
                ...valdAnställd,
                id: valdAnställd.id || 0,
                namn: `${valdAnställd.förnamn} ${valdAnställd.efternamn}`,
                epost: valdAnställd.mail || "",
                sparade_dagar:
                  typeof valdAnställd.sparade_dagar === "string"
                    ? parseFloat(valdAnställd.sparade_dagar)
                    : valdAnställd.sparade_dagar,
                använda_förskott:
                  typeof valdAnställd.använda_förskott === "string"
                    ? parseFloat(valdAnställd.använda_förskott)
                    : valdAnställd.använda_förskott,
                skattekolumn:
                  typeof valdAnställd.skattekolumn === "string"
                    ? parseInt(valdAnställd.skattekolumn, 10)
                    : valdAnställd.skattekolumn,
              }}
            />
          </AnimeradFlik>
          <AnimeradFlik title="Utlägg" icon="💳">
            <UtlaggFlik state={state} />
          </AnimeradFlik>
          <AnimeradFlik title="Lönespecar" icon="💰">
            <Lonespecar
              anställd={{
                ...valdAnställd,
                id: valdAnställd.id || 0,
                namn: `${valdAnställd.förnamn} ${valdAnställd.efternamn}`,
                epost: valdAnställd.mail || "",
                sparade_dagar:
                  typeof valdAnställd.sparade_dagar === "string"
                    ? parseFloat(valdAnställd.sparade_dagar)
                    : valdAnställd.sparade_dagar,
                använda_förskott:
                  typeof valdAnställd.använda_förskott === "string"
                    ? parseFloat(valdAnställd.använda_förskott)
                    : valdAnställd.använda_förskott,
                skattekolumn:
                  typeof valdAnställd.skattekolumn === "string"
                    ? parseInt(valdAnställd.skattekolumn, 10)
                    : valdAnställd.skattekolumn,
              }}
            />
          </AnimeradFlik>
          <AnimeradFlik title="Semester" icon="🏖️">
            <Semester
              anställd={{
                ...valdAnställd,
                id: valdAnställd.id || 0,
                kompensation: parseFloat(valdAnställd.kompensation) || 0,
                anställningsdatum: valdAnställd.anställningsdatum || valdAnställd.startdatum,
              }}
              userId={valdAnställd?.id || 0}
            />
          </AnimeradFlik>
        </div>
      )}
    </>
  );
}
