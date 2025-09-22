//#region Huvud
"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useFaktura } from "../../hooks/useFaktura";
import { BetalningProps } from "../../types/types";
//#endregion

export default function Betalning({}: BetalningProps) {
  const {
    formData,
    fakturadatumDate,
    forfalloDate,
    hanteraÄndraDatum,
    hanteraÄndradText,
    hanteraÄndradDropdown,
  } = useFaktura();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Fakturadatum</label>
          <DatePicker
            selected={fakturadatumDate}
            onChange={hanteraÄndraDatum("fakturadatum")}
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-mm-dd"
            locale="sv"
            isClearable
            className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Förfallodatum</label>
          <DatePicker
            selected={forfalloDate}
            onChange={hanteraÄndraDatum("forfallodatum")}
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-mm-dd"
            locale="sv"
            isClearable
            className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Betalningsvillkor (dagar)
          </label>
          <input
            type="text"
            name="betalningsvillkor"
            value={formData.betalningsvillkor ?? ""}
            onChange={hanteraÄndradText}
            autoComplete="off"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Dröjsmålsränta (%)</label>
          <input
            type="text"
            name="drojsmalsranta"
            value={formData.drojsmalsranta ?? ""}
            onChange={hanteraÄndradText}
            autoComplete="off"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Välj betalningsmetod</label>
          <select
            name="betalningsmetod"
            value={formData.betalningsmetod ?? ""}
            onChange={hanteraÄndradDropdown}
            autoComplete="off"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700"
          >
            <option value="">Välj betalningsmetod</option>
            <option value="Bankgiro">Bankgiro</option>
            <option value="Plusgiro">Plusgiro</option>
            <option value="Bankkonto">Bankkonto</option>
            <option value="Swish">Swish</option>
            <option value="PayPal">PayPal</option>
            <option value="IBAN">IBAN</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Nummer</label>
          <input
            type="text"
            name="nummer"
            value={formData.nummer ?? ""}
            onChange={hanteraÄndradText}
            autoComplete="off"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700"
          />
        </div>
      </div>
    </div>
  );
}
