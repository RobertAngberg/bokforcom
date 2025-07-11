import Knapp from "../../_components/Knapp";
import MailaLonespec from "../Lonespecar/MailaLonespec";

interface LöneKnapparProps {
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden: any;
  onForhandsgranskning: (id: string) => void;
  onTaBortLönespec: () => void;
  taBortLoading: boolean;
}

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
}: {
  lönespecar: any[];
  anställda: any[];
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden: any;
  onMaila: () => void;
  onBankgiroClick: () => void;
  onBokförClick: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-700">
      <Knapp text="✉️ Maila lönespecar" onClick={onMaila} />
      <Knapp text="💳 Hämta Bankgirofil" onClick={onBankgiroClick} />
      <Knapp text="📊 Bokför" onClick={onBokförClick} />
    </div>
  );
}

export { LöneKnappar };
