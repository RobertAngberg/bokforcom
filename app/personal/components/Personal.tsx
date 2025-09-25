"use client";

import Knapp from "../../_components/Knapp";
import AnimeradFlik from "../../_components/AnimeradFlik";
import AnställdFlik from "./Anstallda/AnstalldFlik";
import NyAnstalldModal from "./Anstallda/NyAnstalld/NyAnstalldModal";
import Lonekorning from "./Lonekorning/Lonekorning";
import { useAnstallda } from "../hooks/useAnstallda";
import type { PersonalContentProps } from "../types/types";

export default function Personal({ initialAnställda }: PersonalContentProps) {
  const { state, actions, handlers } = useAnstallda();

  // Vi använder alltid initialAnställda som har full data
  const harAnställda = initialAnställda.length > 0;

  return (
    <div className="">
      <h1 className="text-3xl text-white mb-8 text-center">Personal</h1>

      {/* Anställda sektion */}
      <div className="mb-8">
        <div className="flex justify-end items-center mb-6">
          <Knapp text="+ Lägg till anställd" onClick={handlers.visaNyAnställd} />
        </div>

        {state.anställdaError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Fel: </strong>
            <span className="block sm:inline">{state.anställdaError}</span>
          </div>
        )}

        {state.anställdaLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <span className="ml-3 text-white">Laddar anställda...</span>
          </div>
        ) : !harAnställda ? (
          <p className="text-gray-400">Inga anställda sparade än.</p>
        ) : (
          <div className="space-y-4">
            {initialAnställda.map((anställd) => (
              <AnställdFlik
                key={anställd.id}
                anställd={anställd}
                onTaBort={handlers.taBortAnställd}
              />
            ))}
          </div>
        )}

        {/* Modal för ny anställd */}
        <NyAnstalldModal
          isOpen={state.visaNyAnställdFormulär}
          onClose={handlers.döljNyAnställd}
          handlers={handlers}
        />
      </div>

      {/* Lönekörning sektion - alltid tillgänglig */}
      <div className="mb-8">
        <AnimeradFlik title="Lönekörning" icon="💰">
          <Lonekorning
            anställdaLoading={state.anställdaLoading}
            onAnställdaRefresh={actions.laddaAnställda}
          />
        </AnimeradFlik>
      </div>
    </div>
  );
}
