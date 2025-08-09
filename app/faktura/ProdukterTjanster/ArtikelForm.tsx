import TextFalt from "../../_components/TextFalt";

interface ArtikelFormProps {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  typ: "vara" | "tjänst";
  rotRutMaterial?: boolean;
  onChangeBeskrivning: (v: string) => void;
  onChangeAntal: (v: number) => void;
  onChangePrisPerEnhet: (v: number) => void;
  onChangeMoms: (v: number) => void;
  onChangeTyp: (v: "vara" | "tjänst") => void;
  onChangeRotRutMaterial?: (v: boolean) => void;
  disabled?: boolean;
}

export default function ArtikelForm({
  beskrivning,
  antal,
  prisPerEnhet,
  moms,
  typ,
  rotRutMaterial = false,
  onChangeBeskrivning,
  onChangeAntal,
  onChangePrisPerEnhet,
  onChangeMoms,
  onChangeTyp,
  onChangeRotRutMaterial,
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
        label="Pris per enhet"
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

      {/* ROT/RUT Material checkbox */}
      {typ === "vara" && onChangeRotRutMaterial && (
        <div>
          <label className="flex items-center space-x-2 text-sm text-white mt-4">
            <input
              type="checkbox"
              checked={rotRutMaterial}
              onChange={(e) => onChangeRotRutMaterial(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
              disabled={disabled}
            />
            <span>ROT/RUT-material</span>
          </label>
          <p className="text-xs text-slate-400 mt-1">
            Material rapporteras till Skatteverket men får inget avdrag
          </p>
        </div>
      )}
    </div>
  );
}
