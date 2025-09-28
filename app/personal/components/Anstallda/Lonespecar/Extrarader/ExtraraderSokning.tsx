import TextFalt from "../../../../../_components/TextFalt";
import type { ExtraraderSokningProps } from "../../../../types/types";

export default function ExtraraderSökning({ sökterm, setSökterm }: ExtraraderSokningProps) {
  return (
    <div className="mb-4">
      <TextFalt
        label=""
        name="extrarader-sok"
        type="text"
        placeholder="Sök extrarader... (t.ex. 'vård', 'övertid', 'bil')"
        value={sökterm}
        onChange={(e) => setSökterm(e.target.value)}
        required={false}
      />
      {sökterm && (
        <div className="mt-2 text-sm text-gray-400">
          Visar resultat för: &ldquo;{sökterm}&rdquo;
          <button onClick={() => setSökterm("")} className="ml-2 text-blue-400 hover:text-blue-300">
            Rensa
          </button>
        </div>
      )}
    </div>
  );
}
