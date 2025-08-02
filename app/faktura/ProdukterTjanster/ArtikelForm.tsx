import TextFalt from "../../_components/TextFalt";

interface ArtikelFormProps {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "vara" | "tjänst";
  onChangeBeskrivning: (v: string) => void;
  onChangeAntal: (v: number) => void;
  onChangePrisPerEnhet: (v: number) => void;
  onChangeMoms: (v: number) => void;
  onChangeValuta: (v: string) => void;
  onChangeTyp: (v: "vara" | "tjänst") => void;
}

export default function ArtikelForm({
  beskrivning,
  antal,
  prisPerEnhet,
  moms,
  valuta,
  typ,
  onChangeBeskrivning,
  onChangeAntal,
  onChangePrisPerEnhet,
  onChangeMoms,
  onChangeValuta,
  onChangeTyp,
}: ArtikelFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TextFalt
        label="Beskrivning"
        name="beskrivning"
        value={beskrivning}
        onChange={(e) => onChangeBeskrivning(e.target.value)}
      />
      <TextFalt
        label="Antal"
        name="antal"
        value={antal.toString()}
        onChange={(e) => onChangeAntal(parseFloat(e.target.value))}
      />
      <TextFalt
        label="Pris per enhet"
        name="prisPerEnhet"
        value={prisPerEnhet.toString()}
        onChange={(e) => onChangePrisPerEnhet(parseFloat(e.target.value))}
      />
      <TextFalt
        label="Moms (%)"
        name="moms"
        value={moms.toString()}
        onChange={(e) => onChangeMoms(parseFloat(e.target.value))}
      />
      <div>
        <label htmlFor="valuta" className="block text-sm font-medium text-white mb-2">
          Valuta
        </label>
        <select
          id="valuta"
          value={valuta}
          onChange={(e) => onChangeValuta(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
        >
          <option value="SEK">SEK</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div>
        <label htmlFor="typ" className="block text-sm font-medium text-white mb-2">
          Typ
        </label>
        <select
          id="typ"
          value={typ}
          onChange={(e) => onChangeTyp(e.target.value as "vara" | "tjänst")}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
        >
          <option value="vara">Vara</option>
          <option value="tjänst">Tjänst</option>
        </select>
      </div>
    </div>
  );
}
