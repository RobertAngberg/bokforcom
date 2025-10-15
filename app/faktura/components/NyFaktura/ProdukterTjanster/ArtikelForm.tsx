import TextFalt from "../../../../_components/TextFalt";
import type { ArtikelFormProps } from "../../../types/types";

export default function ArtikelForm({
  beskrivning,
  antal,
  prisPerEnhet,
  moms,
  typ,
  onChangeBeskrivning,
  onChangeAntal,
  onChangePrisPerEnhet,
  onChangeMoms,
  onChangeTyp,
  disabled = false,
}: ArtikelFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TextFalt
        label="Beskrivning"
        name="beskrivning"
        value={beskrivning}
        onChange={(e) => onChangeBeskrivning(e.target.value)}
        disabled={disabled}
      />
      <TextFalt
        label="Antal"
        name="antal"
        value={antal.toString()}
        onChange={(e) => onChangeAntal(parseFloat(e.target.value))}
        disabled={disabled}
      />
      <TextFalt
        label="Pris per enhet exkl. moms"
        name="prisPerEnhet"
        value={prisPerEnhet.toString()}
        onChange={(e) => onChangePrisPerEnhet(parseFloat(e.target.value))}
        disabled={disabled}
      />
      <TextFalt
        label="Moms (%)"
        name="moms"
        value={moms.toString()}
        onChange={(e) => onChangeMoms(parseFloat(e.target.value))}
        disabled={disabled}
      />
      <div>
        <label htmlFor="typ" className="block text-sm font-medium text-white mb-2">
          Typ
        </label>
        <select
          id="typ"
          value={typ}
          onChange={(e) => onChangeTyp(e.target.value as "vara" | "tjänst")}
          className={`w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={disabled}
        >
          <option value="vara">Vara</option>
          <option value="tjänst">Tjänst</option>
        </select>
      </div>
    </div>
  );
}
