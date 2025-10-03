//#region
import InfoTooltip from "../../../../_components/InfoTooltip";
import type { SammanfattningProps } from "../../../types/types";

export default function Sammanfattning({
  utbetalningsDatum,
  nettolön,
  lönespec,
  anställd,
  bruttolön,
  skatt,
  onVisaBeräkningar,
}: SammanfattningProps) {
  //#endregion

  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="text-lg font-bold text-white">Sammanfattning</h4>
        {onVisaBeräkningar && (
          <div onClick={onVisaBeräkningar} className="cursor-pointer">
            <InfoTooltip text="Klicka för att visa hur beräkningarna görs" position="top" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-800 p-4 rounded">
            <div className="text-sm text-gray-400 mb-1">
              Utbetalas: {utbetalningsDatum.toLocaleDateString("sv-SE")}
            </div>
            <div className="text-xl font-bold text-green-400">
              Nettolön: {Math.round(nettolön).toLocaleString("sv-SE")} kr
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-2">Semesterdagar</h5>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Betalda</span>
                <div className="text-white font-medium">
                  {parseFloat(String(lönespec.semester_uttag || 0))}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Sparade</span>
                <div className="text-white font-medium">{anställd.sparade_dagar || 0}</div>
              </div>
              <div>
                <span className="text-gray-400">Förskott</span>
                <div className="text-white font-medium">{anställd.använda_förskott || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h5 className="text-white font-semibold mb-2">Skatt beräknad på</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Skattetabell</span>
                <div className="text-white font-medium">{anställd.skattetabell}</div>
              </div>
              <div>
                <span className="text-gray-400">Skattekolumn</span>
                <div className="text-white font-medium">{anställd.skattekolumn}</div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-2">Totalt detta år</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Brutto</span>
                <span className="text-white">
                  {Math.round(bruttolön).toLocaleString("sv-SE")} kr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Förmåner</span>
                <span className="text-white">0 kr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Skatt</span>
                <span className="text-white">{Math.round(skatt).toLocaleString("sv-SE")} kr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
