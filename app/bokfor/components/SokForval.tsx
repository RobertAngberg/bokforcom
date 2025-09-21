"use client";

import FörvalKort from "./ForvalKort";
import TextFalt from "../../_components/TextFalt";
import { useBokforContext } from "./BokforProvider";

export default function SokForval() {
  const { state, handlers } = useBokforContext();

  // Visa bara på steg 1
  if (state.currentStep !== 1) return null;
  return (
    <div className="w-full">
      <h1 className="mb-8 text-3xl text-center text-white">{handlers.getTitle()}</h1>

      <div onKeyDown={handlers.handleKeyDown}>
        <TextFalt
          label=""
          name="forval-search"
          type="text"
          value={state.searchText}
          onChange={handlers.handleSearchChange}
          placeholder="Sök förval..."
          required={false}
          autoFocus
        />

        {state.loading && (
          <div className="text-center text-white">
            <span>Söker...</span>
          </div>
        )}

        {state.results.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {state.results.map((förval, index) => (
              <FörvalKort
                key={förval.id}
                förval={förval}
                isHighlighted={index === state.highlightedIndex}
                onClick={() => handlers.väljFörval(förval)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
