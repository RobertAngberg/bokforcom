"use client";

interface AGIDebugModalProps {
  visaDebug: boolean;
  setVisaDebug: (show: boolean) => void;
  agiDebugData: any;
}

export default function AGIDebugModal({
  visaDebug,
  setVisaDebug,
  agiDebugData,
}: AGIDebugModalProps) {
  if (!visaDebug || !agiDebugData) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-white font-bold">🔍 AGI Debug Information</h2>
          <button
            onClick={() => setVisaDebug(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* XML Sektion - ÖVERST för snabb åtkomst */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-4">📋 Genererad AGI XML</h3>
            <div className="bg-slate-900 p-4 rounded border border-slate-600 max-h-64 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap text-green-400">
                {(agiDebugData as any)?.generatedXML || "XML inte tillgänglig"}
              </pre>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText((agiDebugData as any)?.generatedXML || "");
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
              >
                📋 Kopiera XML
              </button>
              <button
                onClick={() => {
                  const debugData = JSON.stringify(
                    {
                      företagsdata: agiDebugData.företagsdata,
                      anställdaData: agiDebugData.anställdaData,
                      lönespecData: agiDebugData.lönespecData,
                      finalAgiData: agiDebugData.finalAgiData,
                      generatedXML: (agiDebugData as any)?.generatedXML,
                    },
                    null,
                    2
                  );
                  navigator.clipboard.writeText(debugData);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-semibold"
              >
                📋 Kopiera Debug-data
              </button>
              <button
                onClick={() => setVisaDebug(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
              >
                Stäng Debug
              </button>
            </div>
          </div>

          {/* Företagsdata */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-3">🏢 Företagsdata</h3>
            <div className="bg-slate-600 rounded p-3">
              <div className="text-white text-sm space-y-1">
                <div>
                  <strong>Företagsnamn:</strong>{" "}
                  {agiDebugData.företagsdata?.företagsnamn || "❌ SAKNAS"}
                </div>
                <div>
                  <strong>Organisationsnummer:</strong>{" "}
                  {agiDebugData.företagsdata?.organisationsnummer || "❌ SAKNAS"}
                </div>
                <div>
                  <strong>Telefon:</strong>{" "}
                  {agiDebugData.företagsdata?.telefonnummer || "❌ SAKNAS"}
                </div>
                <div>
                  <strong>E-post:</strong> {agiDebugData.företagsdata?.epost || "❌ SAKNAS"}
                </div>
                <div>
                  <strong>Adress:</strong> {agiDebugData.företagsdata?.adress || "❌ SAKNAS"}
                </div>
                <div className="mt-2 text-yellow-300">
                  {!agiDebugData.företagsdata
                    ? "⚠️ Ingen företagsprofil hittades - använder fallback-värden"
                    : "✅ Företagsprofil hämtad från databas"}
                </div>
              </div>
            </div>
          </div>

          {/* Anställd Data */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-3">👤 Anställd Data</h3>
            {agiDebugData.anställdaData.map((anst: any, idx: number) => (
              <div key={idx} className="bg-slate-600 rounded p-3 mb-3">
                <div className="text-white text-sm space-y-1">
                  <div>
                    <strong>Namn:</strong> {anst.namn}
                  </div>
                  <div>
                    <strong>Personnummer:</strong> {anst.personnummer || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Adress:</strong> {anst.adress || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Postnummer:</strong> {anst.postnummer || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Ort:</strong> {anst.ort || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Tjänsteställe adress:</strong>{" "}
                    {anst.tjänsteställe_adress || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Tjänsteställe ort:</strong> {anst.tjänsteställe_ort || "❌ SAKNAS"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lönespec Data */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-3">💰 Lönespec Data</h3>
            {agiDebugData.lönespecData.map((spec: any, idx: number) => (
              <div key={idx} className="bg-slate-600 rounded p-3 mb-3">
                <div className="text-white text-sm space-y-1">
                  <div>
                    <strong>ID:</strong> {spec.id}
                  </div>
                  <div>
                    <strong>Grundlön:</strong> {spec.grundlön || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Bruttolön:</strong> {spec.bruttolön || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Spec Skatt:</strong> {spec.specSkatt || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Beräknad Skatt:</strong> {spec.beräknadSkatt}
                  </div>
                  <div>
                    <strong>Sociala Avgifter:</strong> {spec.socialaAvgifter}
                  </div>
                  <div>
                    <strong>Beräknad Bruttolön:</strong> {spec.beräknadBruttolön}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final AGI Data */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-3">📊 Final AGI Data</h3>
            <div className="bg-slate-600 rounded p-3">
              <div className="text-white text-sm space-y-1">
                <div>
                  <strong>Organisationsnummer:</strong>{" "}
                  {agiDebugData.finalAgiData.organisationsnummer}
                </div>
                <div>
                  <strong>Redovisningsperiod:</strong>{" "}
                  {agiDebugData.finalAgiData.redovisningsperiod}
                </div>
                <div>
                  <strong>Antal individuppgifter:</strong>{" "}
                  {agiDebugData.finalAgiData.individuppgifter.length}
                </div>
                <div>
                  <strong>Summa Arbetsgivaravgifter:</strong>{" "}
                  {agiDebugData.finalAgiData.summaArbAvgSlf}
                </div>
                <div>
                  <strong>Summa Skatteavdrag:</strong> {agiDebugData.finalAgiData.summaSkatteavdr}
                </div>
              </div>
            </div>
          </div>

          {/* Individuppgifter Details */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-3">
              👥 Individuppgifter (som skickas till XML)
            </h3>
            {agiDebugData.finalAgiData.individuppgifter.map((iu: any, idx: number) => (
              <div key={idx} className="bg-slate-600 rounded p-3 mb-3">
                <div className="text-white text-sm space-y-1">
                  <div>
                    <strong>Spec Nr:</strong> {iu.specifikationsnummer}
                  </div>
                  <div>
                    <strong>Betalningsmottagare ID:</strong> {iu.betalningsmottagareId}
                  </div>
                  <div>
                    <strong>Namn:</strong> {iu.fornamn} {iu.efternamn}
                  </div>
                  <div>
                    <strong>Adress:</strong> {iu.gatuadress || "❌ SAKNAS"}
                  </div>
                  <div>
                    <strong>Postnummer/Ort:</strong> {iu.postnummer || "❌"} {iu.postort || "❌"}
                  </div>
                  <div>
                    <strong>Arbetsplats:</strong> {iu.arbetsplatsensGatuadress || "❌"},{" "}
                    {iu.arbetsplatsensOrt || "❌"}
                  </div>
                  <div>
                    <strong>Kontant ersättning (011):</strong> {iu.kontantErsattningUlagAG}
                  </div>
                  <div>
                    <strong>Skatteavdrag:</strong> {iu.avdrPrelSkatt}
                  </div>
                  <div>
                    <strong>Traktamente:</strong> {iu.traktamente || 0}
                  </div>
                  <div>
                    <strong>Bilersättning:</strong> {iu.bilersattning || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
