/**
 * Förbättrad semesterkomponent med automatiska beräkningar
 * Integrerar med nya semesterberäkningar och bokföring
 */

"use client";

import { useState, useEffect } from "react";
import TextFält from "../../_components/TextFält";
import InfoTooltip from "../../_components/InfoTooltip";
import Knapp from "../../_components/Knapp";
import { 
  beräknaIntjänadeSemesterdagar, 
  beräknaSemesterpenning, 
  valideraSemesteruttag,
  SemesterIntjäning 
} from "./semesterBeräkningar";
import { bokförSemesteruttag } from "./semesterBokföring";

interface EnhancedSemesterProps {
  anställd: {
    id: number;
    förnamn: string;
    efternamn: string;
    kompensation: number;
    anställningsdatum: string;
    tjänstegrad: number;
    semesterdagar_per_år: number;
    kvarvarande_dagar: number;
    sparade_dagar: number;
    använda_förskott: number;
    kvarvarande_förskott: number;
    innestående_ersättning: number;
  };
}

export default function EnhancedSemester({ anställd }: EnhancedSemesterProps) {
  const [loading, setLoading] = useState(false);
  const [intjäning, setIntjäning] = useState<SemesterIntjäning[]>([]);
  const [semesteruttag, setSemesteruttag] = useState({
    dagar: "",
    startDatum: "",
    slutDatum: "",
    kommentar: ""
  });
  const [bokföringsPoster, setBokföringsPoster] = useState<any[]>([]);
  const [showBokföring, setShowBokföring] = useState(false);

  // Beräkna automatisk semesterintjäning
  useEffect(() => {
    const intjänadeSemester = beräknaIntjänadeSemesterdagar(
      anställd.kompensation,
      new Date(anställd.anställningsdatum),
      anställd.tjänstegrad
    );
    setIntjäning(intjänadeSemester);
  }, [anställd]);

  // Beräkna semesterpenning
  const beräknaSemesterpenningFörUttag = () => {
    const dagar = parseFloat(semesteruttag.dagar) || 0;
    if (dagar <= 0) return null;
    
    return beräknaSemesterpenning(anställd.kompensation, dagar, true);
  };

  // Validera semesteruttag
  const valideraSemester = () => {
    const begärdaDagar = parseFloat(semesteruttag.dagar) || 0;
    return valideraSemesteruttag(
      begärdaDagar,
      anställd.kvarvarande_dagar,
      anställd.sparade_dagar,
      true, // Förskott tillåtet
      anställd.kvarvarande_förskott
    );
  };

  // Generera bokföringsposter
  const genereraBokföringsposter = () => {
    const penning = beräknaSemesterpenningFörUttag();
    if (!penning) return [];

    return [
      {
        konto: "7210",
        kontoNamn: "Löner till tjänstemän",
        debet: penning.totaltBelopp,
        kredit: 0,
        beskrivning: `Semesteruttag ${anställd.förnamn} ${anställd.efternamn}`
      },
      {
        konto: "2920",
        kontoNamn: "Semesterskuld",
        debet: 0,
        kredit: penning.totaltBelopp,
        beskrivning: `Minskning semesterskuld ${anställd.förnamn} ${anställd.efternamn}`
      }
    ];
  };

  // Hantera bokföring
  const handleBokför = async () => {
    setLoading(true);
    
    try {
      const result = await bokförSemesteruttag({
        anställdId: anställd.id,
        anställdNamn: `${anställd.förnamn} ${anställd.efternamn}`,
        typ: "uttag",
        datum: semesteruttag.startDatum,
        dagar: parseFloat(semesteruttag.dagar),
        månadslön: anställd.kompensation,
        kommentar: semesteruttag.kommentar
      });

      if (result.success) {
        alert("✅ Semesteruttag bokfört!");
        // Återställ form
        setSemesteruttag({
          dagar: "",
          startDatum: "",
          slutDatum: "",
          kommentar: ""
        });
        setShowBokföring(false);
      }
    } catch (error) {
      console.error("Fel vid bokföring:", error);
      alert("❌ Fel vid bokföring av semesteruttag");
    } finally {
      setLoading(false);
    }
  };

  const semesterpenning = beräknaSemesterpenningFörUttag();
  const validering = valideraSemester();

  return (
    <div className="space-y-6">
      {/* Semesteröversikt */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">
          Semesteröversikt - {anställd.förnamn} {anställd.efternamn}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-700 p-4 rounded">
            <div className="text-sm text-slate-300">Kvarvarande dagar</div>
            <div className="text-2xl font-bold text-white">{anställd.kvarvarande_dagar}</div>
          </div>
          <div className="bg-slate-700 p-4 rounded">
            <div className="text-sm text-slate-300">Sparade dagar</div>
            <div className="text-2xl font-bold text-white">{anställd.sparade_dagar}</div>
          </div>
          <div className="bg-slate-700 p-4 rounded">
            <div className="text-sm text-slate-300">Använda förskott</div>
            <div className="text-2xl font-bold text-white">{anställd.använda_förskott}</div>
          </div>
          <div className="bg-slate-700 p-4 rounded">
            <div className="text-sm text-slate-300">Månadslön</div>
            <div className="text-2xl font-bold text-white">{anställd.kompensation.toLocaleString("sv-SE")} kr</div>
          </div>
        </div>
      </div>

      {/* Semesterintjäning */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Semesterintjäning</h3>
        
        {intjäning.map((period, index) => (
          <div key={index} className="bg-slate-700 p-4 rounded mb-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-white">Intjänandeår: {period.intjänandeår}</div>
                <div className="text-sm text-slate-300">
                  Intjänade dagar: {period.intjänadeDagar.toFixed(2)} | 
                  Intjänad ersättning: {period.intjänadPengaTillägg.toFixed(2)} kr
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">{period.återstående.toFixed(2)} dagar</div>
                <div className="text-sm text-slate-300">återstående</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Semesteruttag */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Registrera semesteruttag</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextFält
            label="Antal dagar"
            name="dagar"
            type="number"
            value={semesteruttag.dagar}
            onChange={(e) => setSemesteruttag(prev => ({ ...prev, dagar: e.target.value }))}
          />
          
          <TextFält
            label="Startdatum"
            name="startDatum"
            type="date"
            value={semesteruttag.startDatum}
            onChange={(e) => setSemesteruttag(prev => ({ ...prev, startDatum: e.target.value }))}
          />
          
          <TextFält
            label="Slutdatum"
            name="slutDatum"
            type="date"
            value={semesteruttag.slutDatum}
            onChange={(e) => setSemesteruttag(prev => ({ ...prev, slutDatum: e.target.value }))}
          />
          
          <TextFält
            label="Kommentar"
            name="kommentar"
            value={semesteruttag.kommentar}
            onChange={(e) => setSemesteruttag(prev => ({ ...prev, kommentar: e.target.value }))}
          />
        </div>

        {/* Beräkningar */}
        {semesterpenning && (
          <div className="bg-slate-700 p-4 rounded mb-4">
            <h4 className="font-semibold text-white mb-2">Beräknad semesterpenning</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-300">Semesterlön</div>
                <div className="font-bold text-white">{semesterpenning.semesterlön.toLocaleString("sv-SE")} kr</div>
              </div>
              <div>
                <div className="text-sm text-slate-300">Semesterersättning (12%)</div>
                <div className="font-bold text-white">{semesterpenning.semesterersättning.toLocaleString("sv-SE")} kr</div>
              </div>
              <div>
                <div className="text-sm text-slate-300">Totalt belopp</div>
                <div className="font-bold text-green-400">{semesterpenning.totaltBelopp.toLocaleString("sv-SE")} kr</div>
              </div>
            </div>
          </div>
        )}

        {/* Validering */}
        {semesteruttag.dagar && (
          <div className={`p-4 rounded mb-4 ${validering.godkänt ? 'bg-green-900' : 'bg-red-900'}`}>
            <div className={`font-medium ${validering.godkänt ? 'text-green-300' : 'text-red-300'}`}>
              {validering.godkänt ? '✅' : '❌'} {validering.meddelande}
            </div>
            {validering.förskottsDagar > 0 && (
              <div className="text-yellow-300 text-sm mt-1">
                Förskottsdagar: {validering.förskottsDagar}
              </div>
            )}
          </div>
        )}

        {/* Knappar */}
        <div className="flex gap-2">
          <Knapp
            text="Visa bokföringsposter"
            onClick={() => {
              setBokföringsPoster(genereraBokföringsposter());
              setShowBokföring(true);
            }}
            disabled={!validering.godkänt || !semesteruttag.dagar}
          />
          
          {showBokföring && (
            <Knapp
              text="Bokför semesteruttag"
              onClick={handleBokför}
              disabled={loading || !validering.godkänt}
            />
          )}
        </div>
      </div>

      {/* Bokföringsposter */}
      {showBokföring && bokföringsPoster.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">Bokföringsposter</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Konto</th>
                  <th className="text-right p-2">Debet</th>
                  <th className="text-right p-2">Kredit</th>
                  <th className="text-left p-2">Beskrivning</th>
                </tr>
              </thead>
              <tbody>
                {bokföringsPoster.map((post, index) => (
                  <tr key={index} className="border-b border-slate-700">
                    <td className="p-2">{post.konto} - {post.kontoNamn}</td>
                    <td className="text-right p-2">
                      {post.debet > 0 ? `${post.debet.toLocaleString("sv-SE")} kr` : '–'}
                    </td>
                    <td className="text-right p-2">
                      {post.kredit > 0 ? `${post.kredit.toLocaleString("sv-SE")} kr` : '–'}
                    </td>
                    <td className="p-2">{post.beskrivning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-slate-700 rounded">
            <div className="flex justify-between">
              <span className="font-medium text-white">Balansering:</span>
              <span className="text-green-400">
                Debet: {bokföringsPoster.reduce((sum, p) => sum + p.debet, 0).toLocaleString("sv-SE")} kr = 
                Kredit: {bokföringsPoster.reduce((sum, p) => sum + p.kredit, 0).toLocaleString("sv-SE")} kr
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
