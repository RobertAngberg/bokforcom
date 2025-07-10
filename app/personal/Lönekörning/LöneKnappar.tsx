import Knapp from "../../_components/Knapp";
import MailaLönespec from "../Lönespecar/MailaLönespec";

interface LöneKnapparProps {
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden: any;
  onFörhandsgranskning: (id: string) => void;
  onTaBortLönespec: () => void;
  taBortLoading: boolean;
  onBankgiroClick: () => void;
  onBokförClick: () => void;
}

export default function LöneKnappar({
  lönespec,
  anställd,
  företagsprofil,
  extrarader,
  beräknadeVärden,
  onFörhandsgranskning,
  onTaBortLönespec,
  taBortLoading,
  onBankgiroClick,
  onBokförClick,
}: LöneKnapparProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-700">
      <Knapp text="👁️ Förhandsgranska / PDF" onClick={() => onFörhandsgranskning(lönespec.id)} />
      <MailaLönespec
        lönespec={lönespec}
        anställd={anställd}
        företagsprofil={företagsprofil}
        extrarader={extrarader}
        beräknadeVärden={beräknadeVärden}
      />
      <Knapp text="💳 Hämta Bankgirofil" onClick={onBankgiroClick} />
      <Knapp text="📊 Bokför" onClick={onBokförClick} />
      <Knapp
        text="🗑️ Ta bort lönespec"
        loading={taBortLoading}
        loadingText="⏳ Tar bort..."
        onClick={onTaBortLönespec}
      />
    </div>
  );
}
