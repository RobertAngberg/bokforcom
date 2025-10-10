import { useState, useEffect, useCallback } from "react";
import { hamtaSemesterTransaktioner } from "../actions/semesterActions";
import type { Transaktion } from "../types/types";

export const useTransaktioner = (anställdId?: number) => {
  // State
  const [startdatum, setStartdatum] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6); // 6 månader tillbaka som default
    return date;
  });
  const [slutdatum, setSlutdatum] = useState(new Date());
  const [filterTyp, setFilterTyp] = useState("Alla");
  const [inkluderaBokfört, setInkluderaBokfört] = useState(false);
  const [transaktioner, setTransaktioner] = useState<Transaktion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadTransaktioner = useCallback(async () => {
    if (!anställdId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await hamtaSemesterTransaktioner(anställdId);
      setTransaktioner(data);
    } catch (err) {
      console.error("Fel vid hämtning av transaktioner:", err);
      setError("Kunde inte hämta transaktioner");
    } finally {
      setLoading(false);
    }
  }, [anställdId, startdatum, slutdatum, filterTyp, inkluderaBokfört]);

  useEffect(() => {
    loadTransaktioner();
  }, [loadTransaktioner]);

  // Dropdown options
  const typOptions = [
    { value: "Alla", label: "Alla" },
    { value: "Förskott", label: "Förskott" },
    { value: "Sparade", label: "Sparade" },
    { value: "Obetald", label: "Obetald" },
    { value: "Betalda", label: "Betalda" },
    { value: "Intjänat", label: "Intjänat" },
  ];

  // Helper functions
  const formatAntal = (antal: number) => {
    return antal > 0 ? antal.toString() : `−${Math.abs(antal)}`;
  };

  const getLönespecText = (transaktion: Transaktion) => {
    if (transaktion.lönespec_månad && transaktion.lönespec_år) {
      return `${transaktion.lönespec_år}-${transaktion.lönespec_månad.toString().padStart(2, "0")}`;
    }
    return "";
  };

  const getTypColor = (typ: string) => {
    switch (typ) {
      case "Intjänat":
        return "text-green-400";
      case "Förskott":
        return "text-orange-400";
      case "Betalda":
        return "text-blue-400";
      case "Sparade":
        return "text-purple-400";
      case "Obetald":
        return "text-red-400";
      default:
        return "text-white";
    }
  };

  const getTypInfo = (typ: string) => {
    switch (typ) {
      case "Intjänat":
        return "Semesterdagar som anställd tjänat in genom arbete. Beräknas automatiskt baserat på arbetstid (ca 2,08 dagar/månad).";
      case "Förskott":
        return "Semesterdagar som tagits i förskott innan de intjänats. Negativa värden = uttag, positiva = återbetalning.";
      case "Betalda":
        return "Semesterdagar som tagits ut som ledighet och betalats ut som lön enligt 12% regeln.";
      case "Sparade":
        return "Semesterdagar som överförts från tidigare år. Max 5 dagar enligt lag får sparas.";
      case "Obetald":
        return "Semesterdagar som tagits som obetald ledighet utan löneutbetalning.";
      default:
        return "Semestertransaktion";
    }
  };

  return {
    // State
    startdatum,
    setStartdatum,
    slutdatum,
    setSlutdatum,
    filterTyp,
    setFilterTyp,
    inkluderaBokfört,
    setInkluderaBokfört,
    transaktioner,
    loading,
    error,
    // Options
    typOptions,
    // Functions
    loadTransaktioner,
    formatAntal,
    getLönespecText,
    getTypColor,
    getTypInfo,
  };
};
