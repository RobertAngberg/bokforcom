//#region Huvud
import LönespecCard from "./LönespecView";

interface LönespecListProps {
  lönespecar: any[];
  anställd: any;
  utlägg: any[];
  onFörhandsgranskning: (id: string) => void;
  onBeräkningarUppdaterade: (lönespecId: string, beräkningar: any) => void;
  beräknadeVärden: any;
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  extrarader: any[];
  setExtrarader: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function LönespecList({
  lönespecar,
  anställd,
  utlägg,
  onFörhandsgranskning,
  onBeräkningarUppdaterade,
  beräknadeVärden,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
}: LönespecListProps) {
  //#endregion

  //#region Render
  if (lönespecar.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Inga lönespecifikationer hittades för {anställd.förnamn} {anställd.efternamn}.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {lönespecar.map((lönespec) => (
        <LönespecCard
          key={lönespec.id}
          lönespec={lönespec}
          anställd={anställd}
          utlägg={utlägg}
          onFörhandsgranskning={onFörhandsgranskning}
          onBeräkningarUppdaterade={onBeräkningarUppdaterade}
          beräknadeVärden={beräknadeVärden}
          ingenAnimering={ingenAnimering}
          onTaBortLönespec={onTaBortLönespec}
          taBortLoading={taBortLoading}
        />
      ))}
    </div>
  );
  //#endregion
}
