"use client";

interface SkatteManagerProps {
  valdaSpecar: any[];
  beräknadeVärden: any;
  skatteDatum: Date | null;
  setSkatteBokförPågår: (loading: boolean) => void;
  setSkatteModalOpen: (open: boolean) => void;
  bokförLöneskatter: (data: any) => Promise<any>;
}

export default function SkatteManager({
  valdaSpecar,
  beräknadeVärden,
  skatteDatum,
  setSkatteBokförPågår,
  setSkatteModalOpen,
  bokförLöneskatter,
}: SkatteManagerProps) {
  const beräknaSkatteData = () => {
    if (!valdaSpecar || valdaSpecar.length === 0) {
      return {
        socialaAvgifter: 0,
        personalskatt: 0,
        totaltSkatter: 0,
      };
    }

    // Summera alla sociala avgifter och skatter från valda lönespecar
    let totalSocialaAvgifter = 0;
    let totalPersonalskatt = 0;

    valdaSpecar.forEach((spec) => {
      const beräkningar = beräknadeVärden[spec.id];
      const socialaAvgifter = beräkningar?.socialaAvgifter || spec.sociala_avgifter || 0;
      const skatt = beräkningar?.skatt || spec.skatt || 0;

      totalSocialaAvgifter += socialaAvgifter;
      totalPersonalskatt += skatt;
    });

    return {
      socialaAvgifter: Math.round(totalSocialaAvgifter * 100) / 100,
      personalskatt: Math.round(totalPersonalskatt * 100) / 100,
      totaltSkatter: Math.round((totalSocialaAvgifter + totalPersonalskatt) * 100) / 100,
    };
  };

  const hanteraBokförSkatter = async () => {
    const skatteData = beräknaSkatteData();

    if (skatteData.socialaAvgifter === 0 && skatteData.personalskatt === 0) {
      alert("Inga skatter att bokföra!");
      return;
    }

    setSkatteBokförPågår(true);
    try {
      const datum = skatteDatum?.toISOString() || new Date().toISOString();
      const result = await bokförLöneskatter({
        socialaAvgifter: skatteData.socialaAvgifter,
        personalskatt: skatteData.personalskatt,
        datum,
        kommentar: "Löneskatter från lönekörning",
      });

      if (result.success) {
        alert("✅ Löneskatter bokförda!");
        setSkatteModalOpen(false);
      } else {
        alert("❌ Fel vid bokföring: " + (result.error || "Okänt fel"));
      }
    } catch (error: any) {
      console.error("❌ Fel vid bokföring av skatter:", error);
      alert("❌ Fel vid bokföring: " + (error?.message || error));
    } finally {
      setSkatteBokförPågår(false);
    }
  };

  return {
    beräknaSkatteData,
    hanteraBokförSkatter,
  };
}
