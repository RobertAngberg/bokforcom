interface Props {
  sökterm: string;
  setSökterm: (term: string) => void;
}

export default function ExtraraderSökning({ sökterm, setSökterm }: Props) {
  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Sök extrarader... (t.ex. 'vård', 'övertid', 'bil')"
        value={sökterm}
        onChange={(e) => setSökterm(e.target.value)}
        className="w-full px-3 py-2 bg-slate-600 text-white rounded-md border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
