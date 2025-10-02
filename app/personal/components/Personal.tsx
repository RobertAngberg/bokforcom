"use client";

import Knapp from "../../_components/Knapp";
import AnimeradFlik from "../../_components/AnimeradFlik";
import LoadingSpinner from "../../_components/LoadingSpinner";
import Modal from "../../_components/Modal";
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
          <div className="flex justify-center py-8">
            <LoadingSpinner />
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

        {/* Modal för att bekräfta borttagning av anställd */}
        <Modal
          isOpen={state.showDeleteAnställdModal}
          onClose={() => handlers.setShowDeleteAnställdModal(false)}
          title="Bekräfta borttagning"
          maxWidth="md"
        >
          <div className="text-center">
            <p className="text-gray-300 mb-6">
              Är du säker på att du vill ta bort denna anställd? Detta kan inte ångras.
            </p>
            <div className="flex gap-3 justify-center">
              <Knapp text="Avbryt" onClick={() => handlers.setShowDeleteAnställdModal(false)} />
              <Knapp text="❌ Ta bort" onClick={handlers.confirmDeleteAnställd} />
            </div>
          </div>
        </Modal>
      </div>

      {/* Subtil HR mellan anställda och lönekörning */}
      <hr className="border-slate-600/30 my-8" />

      {/* Lönekörning sektion - återaktiverad med mock data */}
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
