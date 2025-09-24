"use client";

import MainLayout from "../_components/MainLayout";
import Knapp from "../_components/Knapp";
import AnimeradFlik from "../_components/AnimeradFlik";
import AnställdaRad from "./components/Anstallda/AnstalldaLista/AnstalldaRad";
import NyAnställd from "./components/Anstallda/NyAnstalld/NyAnstalld";
import Information from "./components/Anstallda/Information/Information";
import UtlaggFlik from "./components/Anstallda/Utlagg/UtlaggFlik";
import Kontrakt from "./components/Anstallda/Kontrakt/Kontrakt";
import Lonespecar from "./components/Anstallda/Lonespecar/Lonespecar";
import Semester from "./components/Anstallda/Semester/Semester";
import Lonekorning from "./components/Lonekorning/Lonekorning";
import { useAnstallda } from "./hooks/useAnstallda";
import { useUtlagg } from "./hooks/useUtlagg";

export default function PersonalPage() {
  const { state, actions, handlers } = useAnstallda();
  const { valdAnställd } = state;
  const { utlaggFlikData, laddaUtläggFörAnställd } = useUtlagg(valdAnställd?.id);

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
              <NyAnställd handlers={handlers} />
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
                <Information state={state} handlers={handlers} />
              </AnimeradFlik>
              <AnimeradFlik title="Utlägg" icon="💳">
                <UtlaggFlik
                  state={state}
                  handlers={{ ...handlers, laddaUtläggFörAnställd }}
                  utlaggFlikData={utlaggFlikData}
                />
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

        {/* Lönekörning sektion - alltid tillgänglig */}
        <div className="mb-8">
          <div className="bg-slate-700 p-6 rounded-lg">
            <AnimeradFlik title="Lönekörning" icon="💰">
              <Lonekorning
                anställda={state.anställda}
                anställdaLoading={state.anställdaLoading}
                onAnställdaRefresh={actions.laddaAnställda}
              />
            </AnimeradFlik>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
