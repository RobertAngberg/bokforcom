//#region Huvud
interface UtloggProps {
  lönespecUtlogg: any[];
  getStatusBadge: (status: string) => React.ReactElement;
}

export default function Utlogg({ lönespecUtlogg, getStatusBadge }: UtloggProps) {
  //#endregion

  if (lönespecUtlogg.length === 0) return null;

  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Utlogg</h4>
      <div className="space-y-3">
        {lönespecUtlogg.map((utläggItem) => (
          <div key={utläggItem.id} className="bg-slate-800 p-3 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="text-white font-medium">{utläggItem.beskrivning}</h5>
                <p className="text-gray-400 text-sm">
                  {new Date(utläggItem.datum).toLocaleDateString("sv-SE")}
                  {utläggItem.kategori && ` • ${utläggItem.kategori}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">
                  {parseFloat(utläggItem.belopp).toLocaleString("sv-SE")} kr
                </div>
                {getStatusBadge(utläggItem.status)}
              </div>
            </div>

            {utläggItem.kommentar && (
              <div className="text-gray-400 text-sm mb-2">{utläggItem.kommentar}</div>
            )}

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>ID: #{utläggItem.id}</span>
              <div className="flex gap-3">
                {utläggItem.kvitto_fil && <span>📎 Kvitto: {utläggItem.kvitto_fil}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
