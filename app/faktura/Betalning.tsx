//#region Huvud
"use client";

import { useEffect } from "react";
import { useFakturaContext } from "./FakturaProvider";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { sv } from "date-fns/locale";
import { hämtaSenasteBetalningsmetod } from "./actions";
import { useSession } from "next-auth/react";
//#endregion

export default function Betalning() {
  const { formData, setFormData } = useFakturaContext();
  const { data: session } = useSession();

  registerLocale("sv", sv);

  function parseISODate(value: unknown): Date | null {
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === "string") {
      const d = new Date(value.trim());
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  function addDays(date: Date, days: number) {
    const out = new Date(date);
    out.setDate(out.getDate() + days);
    return out;
  }

  // Sätter standardvärden + hämtar senaste betalningsmetod
  useEffect(() => {
    const initializeDefaults = async () => {
      const todayISO = new Date().toISOString().slice(0, 10);

      // ✅ Hämta SENASTE betalningsmetod för denna användare
      let senasteBetalning = { betalningsmetod: null, nummer: null };

      if (session?.user?.id) {
        senasteBetalning = await hämtaSenasteBetalningsmetod(session.user.id);
      }

      setFormData((prev) => {
        const updated = { ...prev };
        let changed = false;

        // Standard datum/villkor
        if (!prev.fakturadatum) {
          updated.fakturadatum = todayISO;
          changed = true;
        }
        if (!prev.betalningsvillkor) {
          updated.betalningsvillkor = "30";
          changed = true;
        }
        if (!prev.drojsmalsranta) {
          updated.drojsmalsranta = "12";
          changed = true;
        }

        // ✅ Sätt senaste betalningsmetod om ingen är vald
        if (!prev.betalningsmetod && senasteBetalning.betalningsmetod) {
          updated.betalningsmetod = senasteBetalning.betalningsmetod;
          changed = true;
        }
        if (!prev.nummer && senasteBetalning.nummer) {
          updated.nummer = senasteBetalning.nummer;
          changed = true;
        }

        if (changed) {
          const fd = parseISODate(updated.fakturadatum);
          if (fd) {
            updated.forfallodatum = addDays(fd, parseInt(updated.betalningsvillkor, 10))
              .toISOString()
              .slice(0, 10);
          }
          return updated;
        }

        return prev;
      });
    };

    // ✅ Kör bara när session är laddad
    if (session?.user?.id) {
      initializeDefaults();
    }
  }, [setFormData, session?.user?.id]);

  const fakturadatumDate = parseISODate(formData.fakturadatum);
  const fallbackForfallo = fakturadatumDate
    ? addDays(fakturadatumDate, parseInt(formData.betalningsvillkor || "30", 10))
    : null;
  const forfalloDate = parseISODate(formData.forfallodatum) ?? fallbackForfallo;

  // Sätter förfallodatum automatiskt BARA om det är tomt (låter användaren ändra manuellt)
  useEffect(() => {
    if (!fakturadatumDate || formData.forfallodatum) return; // ✅ Kör bara om förfallodatum är tomt
    const days = parseInt(formData.betalningsvillkor || "30", 10);
    const calc = addDays(fakturadatumDate, isNaN(days) ? 30 : days)
      .toISOString()
      .slice(0, 10);
    setFormData((prev) => ({ ...prev, forfallodatum: calc }));
  }, [fakturadatumDate, formData.betalningsvillkor, formData.forfallodatum, setFormData]);

  //#region Hanterare
  function hanteraÄndraDatum(field: "fakturadatum" | "forfallodatum") {
    return (d: Date | null) =>
      setFormData((p) => ({
        ...p,
        [field]: d ? d.toISOString().slice(0, 10) : "",
      }));
  }

  function hanteraÄndradText(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;

    // Blockera farliga tecken för nummer-fältet
    if (name === "nummer") {
      const sanitizedValue = value.replace(/[<>'"&]/g, "");
      setFormData((p) => ({ ...p, [name]: sanitizedValue }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  }

  function hanteraÄndradDropdown(e: React.ChangeEvent<HTMLSelectElement>) {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  }
  //#endregion

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
