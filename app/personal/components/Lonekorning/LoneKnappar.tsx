import Knapp from "../../../_components/Knapp";
import MailaLonespec from "../Anstallda/Lonespecar/MailaLonespec";
import { LöneKnapparProps, LöneBatchKnapparProps } from "../../types/types";

export default function LöneKnappar({
  lönespec,
  anställd,
  företagsprofil,
  extrarader,
  beräknadeVärden,
  onForhandsgranskning,
  onTaBortLönespec,
  taBortLoading,
}: LöneKnapparProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-700">
      <Knapp text="👁️ Förhandsgranska / PDF" onClick={() => onForhandsgranskning(lönespec.id)} />
      <Knapp
        text="🗑️ Ta bort lönespec"
        loading={taBortLoading}
        loadingText="⏳ Tar bort..."
        onClick={onTaBortLönespec}
      />
    </div>
  );
}

// Batch-knappar för hela listan
export function LöneBatchKnappar({
  lönespecar,
  anställda,
  företagsprofil,
  extrarader,
  beräknadeVärden,
  onMaila,
  onBankgiroClick,
  onBokförClick,
}: LöneBatchKnapparProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-700">
      <Knapp text="✉️ Maila lönespecar" onClick={onMaila} />
      <Knapp text="💳 Hämta Bankgirofil" onClick={onBankgiroClick} />
      <Knapp text="📊 Bokför" onClick={onBokförClick} />
    </div>
  );
}

export { LöneKnappar };
