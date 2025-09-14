"use client";

import FörvalKort from "./ForvalKort";
import TextFalt from "../../_components/TextFalt";
import { useSokForval } from "../_hooks/useSokForval";

export default function SokForval() {
  const {
    searchText,
    results,
    highlightedIndex,
    loading,
    handleKeyDown,
    handleSearchChange,
    väljFörval,
    getTitle,
  } = useSokForval();

  return (
    <div className="w-full">
      <h1 className="mb-8 text-3xl text-center text-white">{getTitle()}</h1>

      <div onKeyDown={handleKeyDown}>
        <TextFalt
          label=""
          name="forval-search"
          type="text"
          value={searchText}
          onChange={(e) => handleSearchChange(e as React.ChangeEvent<HTMLInputElement>)}
          placeholder="Sök förval..."
          required={false}
          autoFocus
        />

        {loading && (
          <div className="text-center text-white">
            <span>Söker...</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((förval, index) => (
              <FörvalKort
                key={förval.id}
                förval={förval}
                isHighlighted={index === highlightedIndex}
                onClick={() => väljFörval(förval)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
