// #region Huvud
"use client";

import { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Dropdown from "../../_components/Dropdown";
import InfoTooltip from "../../_components/InfoTooltip";
import { hämtaSemesterTransaktioner } from "../actions";

interface TransaktionerProps {
  anställd?: any;
}

interface Transaktion {
  id: string;
  datum: string;
  typ: string;
  antal: number;
  från_datum?: string;
  till_datum?: string;
  beskrivning?: string;
  lönespec_månad?: number;
  lönespec_år?: number;
  bokfört: boolean;
}
// #endregion

export default function Transaktioner({ anställd }: TransaktionerProps) {
  // #region State
  const [startdatum, setStartdatum] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6); // 6 månader tillbaka som default
    return date;
  });
  const [slutdatum, setSlutdatum] = useState(new Date());
  const [filterTyp, setFilterTyp] = useState("Alla");
  const [inkluderaBokfört, setInkluderaBokfört] = useState(false);
  const [transaktioner, setTransaktioner] = useState<Transaktion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // #endregion

  // #region Load Data
  const loadTransaktioner = useCallback(async () => {
    if (!anställd?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await hämtaSemesterTransaktioner(
        anställd.id,
        startdatum.toISOString().split("T")[0],
        slutdatum.toISOString().split("T")[0],
        filterTyp === "Alla" ? undefined : filterTyp,
        inkluderaBokfört ? true : undefined
      );

      setTransaktioner(data);
    } catch (err) {
      console.error("Fel vid hämtning av transaktioner:", err);
      setError("Kunde inte hämta transaktioner");
    } finally {
      setLoading(false);
    }
  }, [anställd?.id, startdatum, slutdatum, filterTyp, inkluderaBokfört]);

  useEffect(() => {
    loadTransaktioner();
  }, [loadTransaktioner]);
  // #endregion

  // #region Dropdown Options
  const typOptions = [
    { value: "Alla", label: "Alla" },
    { value: "Förskott", label: "Förskott" },
    { value: "Sparade", label: "Sparade" },
    { value: "Obetald", label: "Obetald" },
    { value: "Betalda", label: "Betalda" },
    { value: "Intjänat", label: "Intjänat" },
  ];
  // #endregion

  // #region Helper Functions
  const formatAntal = (antal: number) => {
    return antal > 0 ? antal.toString() : `−${Math.abs(antal)}`;
  };

  const getLönespecText = (transaktion: Transaktion) => {
    if (transaktion.lönespec_månad && transaktion.lönespec_år) {
      return `${transaktion.lönespec_år}-${transaktion.lönespec_månad.toString().padStart(2, "0")}`;
    }
    return "";
  };

  const getTypColor = (typ: string) => {
    switch (typ) {
      case "Intjänat":
        return "text-green-400";
      case "Förskott":
        return "text-orange-400";
      case "Betalda":
        return "text-blue-400";
      case "Sparade":
        return "text-purple-400";
      case "Obetald":
        return "text-red-400";
      default:
        return "text-white";
    }
  };

  const getTypInfo = (typ: string) => {
    switch (typ) {
      case "Intjänat":
        return "Semesterdagar som anställd tjänat in genom arbete. Beräknas automatiskt baserat på arbetstid (ca 2,08 dagar/månad).";
      case "Förskott":
        return "Semesterdagar som tagits i förskott innan de intjänats. Negativa värden = uttag, positiva = återbetalning.";
      case "Betalda":
        return "Semesterdagar som tagits ut som ledighet och betalats ut som lön enligt 12% regeln.";
      case "Sparade":
        return "Semesterdagar som överförts från tidigare år. Max 5 dagar enligt lag får sparas.";
      case "Obetald":
        return "Semesterdagar som tagits som obetald ledighet utan löneutbetalning.";
      default:
        return "Semestertransaktion";
    }
  };
  // #endregion

  if (!anställd) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <p className="text-gray-400">Välj en anställd för att visa transaktioner.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg space-y-6">
      {/* Header med info */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-white">Semestertransaktioner</h3>
        <InfoTooltip
          text="Här visas alla semesterrelaterade transaktioner för anställd. Filtrera efter datum, typ eller bokföringsstatus."
          position="right"
        />
      </div>

      {/* Filter sektion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-white">Startdatum</label>
            <InfoTooltip text="Välj startdatum för att filtrera transaktioner. Standard är 6 månader tillbaka." />
          </div>
          <DatePicker
            selected={startdatum}
            onChange={(date) => date && setStartdatum(date)}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-white">Slutdatum</label>
            <InfoTooltip text="Välj slutdatum för att filtrera transaktioner. Standard är dagens datum." />
          </div>
          <DatePicker
            selected={slutdatum}
            onChange={(date) => date && setSlutdatum(date)}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-white">Typ</label>
            <InfoTooltip text="Filtrera transaktioner efter typ. Välj 'Alla' för att visa alla typer." />
          </div>
          <Dropdown label="" value={filterTyp} onChange={setFilterTyp} options={typOptions} />
        </div>

        <div className="flex items-end">
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={inkluderaBokfört}
              onChange={(e) => setInkluderaBokfört(e.target.checked)}
              className="mr-2 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="flex items-center gap-2">
              Endast bokfört
              <InfoTooltip text="Visa endast transaktioner som är bokförda i redovisningen." />
            </span>
          </label>
        </div>
      </div>

      {/* Error meddelande */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      )}

      {/* Transaktioner tabell */}
      {!loading && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Transaktioner ({transaktioner.length})
          </h3>

          {transaktioner.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Inga transaktioner hittades för valda filter.</p>
              <p className="text-sm mt-2">Prova att ändra datumintervall eller typ-filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-white font-medium py-2">
                      <div className="flex items-center gap-2">
                        Datum
                        <InfoTooltip text="Datum när transaktionen skedde eller registrerades." />
                      </div>
                    </th>
                    <th className="text-left text-white font-medium py-2">
                      <div className="flex items-center gap-2">
                        Typ
                        <InfoTooltip text="Typ av semestertransaktion. Hovra över varje typ för mer detaljer." />
                      </div>
                    </th>
                    <th className="text-left text-white font-medium py-2">
                      <div className="flex items-center gap-2">
                        Antal
                        <InfoTooltip text="Antal semesterdagar. Positiva värden = tillgodo, negativa = uttag." />
                      </div>
                    </th>
                    <th className="text-left text-white font-medium py-2">
                      <div className="flex items-center gap-2">
                        Från
                        <InfoTooltip text="Startdatum för semesterperiod (om tillämpligt)." />
                      </div>
                    </th>
                    <th className="text-left text-white font-medium py-2">
                      <div className="flex items-center gap-2">
                        Till
                        <InfoTooltip text="Slutdatum för semesterperiod (om tillämpligt)." />
                      </div>
                    </th>
                    <th className="text-left text-white font-medium py-2">
                      <div className="flex items-center gap-2">
                        Beskrivning
                        <InfoTooltip text="Fritext beskrivning av transaktionen." />
                      </div>
                    </th>
                    <th className="text-left text-white font-medium py-2">
                      <div className="flex items-center gap-2">
                        Lönespec
                        <InfoTooltip text="Kopplad lönespecifikation i format YYYY-MM." />
                      </div>
                    </th>
                    <th className="text-left text-white font-medium py-2">
                      <div className="flex items-center gap-2">
                        Bokfört
                        <InfoTooltip text="Visar om transaktionen är bokförd i redovisningen. ✓ = Ja, ○ = Nej" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transaktioner.map((transaktion) => (
                    <tr
                      key={transaktion.id}
                      className="border-b border-slate-700 hover:bg-slate-750"
                    >
                      <td className="text-white py-2">{transaktion.datum}</td>
                      <td className={`py-2 font-medium ${getTypColor(transaktion.typ)}`}>
                        <div className="flex items-center gap-2">
                          {transaktion.typ}
                          <InfoTooltip text={getTypInfo(transaktion.typ)} position="right" />
                        </div>
                      </td>
                      <td className="text-white py-2 font-mono">
                        {formatAntal(transaktion.antal)}
                      </td>
                      <td className="text-white py-2">{transaktion.från_datum || ""}</td>
                      <td className="text-white py-2">{transaktion.till_datum || ""}</td>
                      <td className="text-white py-2">{transaktion.beskrivning || ""}</td>
                      <td className="text-white py-2">{getLönespecText(transaktion)}</td>
                      <td className="py-2">
                        {transaktion.bokfört ? (
                          <span className="text-green-400 text-lg">✓</span>
                        ) : (
                          <span className="text-gray-500 text-lg">○</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
