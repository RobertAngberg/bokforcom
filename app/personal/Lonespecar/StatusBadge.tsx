//#region Huvud
interface StatusBadgeProps {
  status: string;
  type: "lönespec" | "utlägg";
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  //#endregion

  //#region Helper Functions
  function getLönespecStatusBadge(status: string) {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      utkast: {
        label: "Utkast",
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      },
      klar: { label: "Klar", className: "bg-green-500/20 text-green-400 border-green-500/30" },
      skickad: { label: "Skickad", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      betald: { label: "Betald", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    };

    const statusInfo = statusMap[status] || statusMap.utkast;
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  }

  function getStatusBadge(status: string) {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      Väntande: {
        label: "Väntande",
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      },
      "Inkluderat i lönespec": {
        label: "Inkluderad",
        className: "bg-green-500/20 text-green-400 border-green-500/30",
      },
      väntande: {
        label: "Väntande",
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      },
      godkänd: {
        label: "Godkänd",
        className: "bg-green-500/20 text-green-400 border-green-500/30",
      },
      nekad: { label: "Nekad", className: "bg-red-500/20 text-red-400 border-red-500/30" },
      utbetald: { label: "Utbetald", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    };

    const statusInfo = statusMap[status] || statusMap.väntande;
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  }
  //#endregion

  if (type === "lönespec") {
    return getLönespecStatusBadge(status);
  } else {
    return getStatusBadge(status);
  }
}
