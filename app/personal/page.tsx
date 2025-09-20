"use client";

import { useRouter } from "next/navigation";
import MainLayout from "../_components/MainLayout";
import Knapp from "../_components/Knapp";
import AnimeradFlik from "../_components/AnimeradFlik";
import AnställdaRad from "./components/Anstallda/AnstalldaRad";
import NyAnställd from "./components/Anstallda/NyAnstalld/NyAnstalld";
import Personalinformation from "./components/Anstallda/Personalinformation";
import UtlaggFlik from "./components/Anstallda/UtlaggFlik";
import Kontrakt from "./components/Anstallda/Kontrakt/Kontrakt";
import Lonespecar from "./components/Anstallda/Lonespecar/Lonespecar";
import Semester from "./components/Anstallda/Semester/Semester";
import { useAnstallda } from "./hooks/useAnstallda";

export default function PersonalPage() {
  const router = useRouter();
  const { state, handlers, utlaggFlikData } = useAnstallda();
  const { valdAnställd } = state;

  return (
    <MainLayout>
      <div className="">
        <h1 className="text-3xl text-white mb-8 text-center">Personal</h1>

        {/* Anställda sektion */}
        <div className="mb-8">
          <div className="bg-slate-700 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-semibold flex items-center gap-2">
                Anställda
              </h2>
              <Knapp text="+ Lägg till anställd" onClick={handlers.visaNyAnställd} />
            </div>

            {state.anställdaError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong className="font-bold">Fel: </strong>
                <span className="block sm:inline">{state.anställdaError}</span>
              </div>
            )}

            {!state.visaNyAnställdFormulär ? (
              <>
                {state.anställdaLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    <span className="ml-3 text-white">Laddar anställda...</span>
                  </div>
                ) : !state.harAnställda ? (
                  <p className="text-gray-400">Inga anställda sparade än.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="w-10"></th>
                          <th className="text-left text-gray-400">Namn</th>
                          <th className="text-left text-gray-400">E-post</th>
                          <th className="text-left text-gray-400">Roll</th>
                          <th className="text-left text-gray-400"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.anställda.map((anställd: any) => (
                          <AnställdaRad key={anställd.id} anställd={anställd} handlers={handlers} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <NyAnställd />
            )}
          </div>
        </div>

        {/* Anställd detaljer - visas när någon är vald */}
        {valdAnställd && (
          <div className="mb-8">
            <h2 className="text-xl text-white font-semibold mb-4">
              Detaljer för {valdAnställd.förnamn} {valdAnställd.efternamn}
            </h2>
            <div className="space-y-4">
              <AnimeradFlik title="Personalinformation" icon="📋">
                <Personalinformation state={state} handlers={handlers} />
              </AnimeradFlik>
              <AnimeradFlik title="Utlägg" icon="💳">
                <UtlaggFlik state={state} handlers={handlers} utlaggFlikData={utlaggFlikData} />
              </AnimeradFlik>
              <AnimeradFlik title="Kontrakt" icon="📄">
                <Kontrakt anställd={valdAnställd} />
              </AnimeradFlik>
              <AnimeradFlik title="Lönespecar" icon="💰">
                <Lonespecar anställd={valdAnställd} />
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
          </div>
        )}

        {/* Lönekörning sektion - längst ner */}
        <div className="bg-slate-700 p-6 rounded-lg">
          <a
            href="/personal/Lonekorning"
            className="block hover:bg-slate-600 transition p-4 rounded-lg"
          >
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>💰</span>
              Lönekörning
            </h2>
            <p className="text-sm italic text-gray-400 mt-1">
              Hantera utbetalning och bokföring av löner.
            </p>
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
