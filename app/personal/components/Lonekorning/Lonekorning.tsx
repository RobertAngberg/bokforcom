//#region Imports
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Knapp from "../../../_components/Knapp";
import { useLonespec } from "../../hooks/useLonespecar";
import { useLonekorning } from "../../hooks/useLonekorning";
import { useAnstallda } from "../../hooks/useAnstallda";
import type { AnställdData, ExtraradData } from "../../types/types";
import { hämtaFöretagsprofil } from "../../actions/anstalldaActions";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import NyLonekorningModal from "./SkapaNy/NyLonekorningModal";
import LonekorningLista from "./Listor/LonekorningLista";
import LonespecLista from "./Listor/LonespecLista";
import MailaLonespec from "./Wizard/MailaLonespec";

//#endregion

//#region Types
interface LonekorningProps {
  anställda?: AnställdData[];
  anställdaLoading?: boolean;
  onAnställdaRefresh?: () => void;
}
//#endregion

//#region Component
export default function Lonekorning({
  anställda: propsAnställda,
  anställdaLoading: propsAnställdaLoading,
  onAnställdaRefresh,
}: LonekorningProps = {}) {
  const { extrarader, beräknadeVärden } = useLonespec();

  const { data: session } = useSession();
  const [företagsprofil, setFöretagsprofil] = useState<any>(null);

  // Get all employees to ensure we have complete data
  const { state: anstalldaState } = useAnstallda();

  useEffect(() => {
    const loadFöretagsprofil = async () => {
      try {
        const profile = await hämtaFöretagsprofil(session?.user?.id || "");
        setFöretagsprofil(profile);
      } catch (error) {
        console.error("Kunde inte ladda företagsprofil:", error);
      }
    };
    if (session?.user?.id) {
      loadFöretagsprofil();
    }
  }, [session?.user?.id]);

  const {
    // State
    nyLonekorningModalOpen,
    setNyLonekorningModalOpen,
    valdLonekorning,
    setValdLonekorning,
    refreshTrigger,
    setRefreshTrigger,
    lönekörningSpecar,
    taBortLoading,
    loading,
    batchMailModalOpen,
    setBatchMailModalOpen,
    setBokforModalOpen,
    setBankgiroModalOpen,
    setSkatteModalOpen,
    // Computed
    anstallda,
    utlaggMap,
    // Functions
    hanteraTaBortSpec,
    handleTaBortLönekörning,
    refreshData,
    hanteraAGI,
  } = useLonekorning({
    anställda: propsAnställda,
    anställdaLoading: propsAnställdaLoading,
    onAnställdaRefresh,
    extrarader,
    beräknadeVärden,
  });

  const allAnstallda = anstalldaState.anställda || anstallda;

  // Prepare batch data for mailing
  interface BatchDataItem {
    lönespec: any;
    anställd: AnställdData | any; // Using any for now due to mixed types in codebase
    företagsprofil: any;
    extrarader: ExtraradData[];
    beräknadeVärden: any;
  }

  const batchData: BatchDataItem[] = lönekörningSpecar
    .map((spec) => {
      const anställd = allAnstallda.find((a) => a.id === spec.anställd_id);
      if (!anställd) {
        console.warn(
          `Anställd med id ${spec.anställd_id} hittades inte för lönespec ${spec.id}. Tillgängliga anställda:`,
          allAnstallda.map((a) => a.id)
        );
        return null; // Skip specs without valid employee
      }
      return {
        lönespec: spec,
        anställd,
        företagsprofil,
        extrarader: extrarader[spec.id] || [],
        beräknadeVärden: beräknadeVärden[spec.id] || {},
      };
    })
    .filter((item): item is BatchDataItem => item !== null); // Remove null entries with type guard

  console.log("Batch data prepared:", batchData.length, "items");

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header med knappar */}
      <div className="flex justify-end items-center">
        <div className="flex gap-3">
          {!valdLonekorning && (
            <Knapp text="Ny lönekörning" onClick={() => setNyLonekorningModalOpen(true)} />
          )}
          {valdLonekorning && (
            <Knapp
              text={taBortLoading ? "🗑️ Tar bort..." : "🗑️ Ta bort lönekörning"}
              onClick={handleTaBortLönekörning}
              disabled={taBortLoading}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      {!valdLonekorning ? (
        <LonekorningLista
          onValjLonekorning={setValdLonekorning}
          valdLonekorning={valdLonekorning}
          refreshTrigger={refreshTrigger}
        />
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setValdLonekorning(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Tillbaka till lönekörningar
          </button>

          <h2 className="text-xl font-semibold">Lönekörning: {valdLonekorning.period}</h2>

          <LonespecLista
            valdaSpecar={lönekörningSpecar}
            anstallda={allAnstallda}
            utlaggMap={utlaggMap}
            lönekörning={valdLonekorning}
            onTaBortSpec={hanteraTaBortSpec}
            onHämtaBankgiro={() => setBankgiroModalOpen(true)}
            onMailaSpecar={() => setBatchMailModalOpen(true)}
            onBokför={() => setBokforModalOpen(true)}
            onGenereraAGI={hanteraAGI}
            onBokförSkatter={() => setSkatteModalOpen(true)}
          />
        </div>
      )}

      {/* Modaler */}
      {nyLonekorningModalOpen && (
        <NyLonekorningModal
          isOpen={nyLonekorningModalOpen}
          onClose={() => setNyLonekorningModalOpen(false)}
          onLonekorningCreated={(lonekorning) => {
            setValdLonekorning(lonekorning);
            setRefreshTrigger((prev: number) => prev + 1);
          }}
        />
      )}

      {batchMailModalOpen && batchData.length > 0 && (
        <MailaLonespec
          batchMode={true}
          batch={batchData}
          open={batchMailModalOpen}
          onClose={() => setBatchMailModalOpen(false)}
          onMailComplete={() => {
            setBatchMailModalOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
//#endregion
