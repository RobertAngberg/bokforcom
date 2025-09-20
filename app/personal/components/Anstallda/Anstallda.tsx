"use client";

import Knapp from "../../_components/Knapp";
import NyAnställd from "./NyAnstalld/NyAnstalld";
import AnställdaLista from "./AnstalldaLista";

interface AnställdaProps {
  state: any;
  handlers: any;
}

export default function Anstallda({ state, handlers }: AnställdaProps) {
  return (
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
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="ml-3 text-white">Laddar anställda...</span>
            </div>
          ) : !state.harAnställda ? (
            <p className="text-gray-400">Inga anställda sparade än.</p>
          ) : (
            <AnställdaLista state={state} handlers={handlers} />
          )}
        </div>
      ) : (
        <NyAnställd />
      )}
    </div>
  );
}
