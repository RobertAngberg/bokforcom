//#region Imports
"use client";

import Knapp from "../../../_components/Knapp";
import { useLonespec } from "../../hooks/useLonespecar";
import { useLonekorning } from "../../hooks/useLonekorning";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import NyLonekorningModal from "./SkapaNy/NyLonekorningModal";
import LonekorningLista from "./Listor/LonekorningLista";
import LonespecLista from "./Listor/LonespecLista";

//#endregion

//#region Types
interface LonekorningProps {
  anställda?: any[];
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

  const {
    // State
    nySpecModalOpen,
    setNySpecModalOpen,
    nyLonekorningModalOpen,
    setNyLonekorningModalOpen,
    nySpecDatum,
    setNySpecDatum,
    valdLonekorning,
    setValdLonekorning,
    refreshTrigger,
    setRefreshTrigger,
    lönekörningSpecar,
    taBortLoading,
    loading,
    utbetalningsdatum,
    batchMailModalOpen,
    setBatchMailModalOpen,
    bokforModalOpen,
    setBokforModalOpen,
    valdaSpecar,
    bankgiroModalOpen,
    setBankgiroModalOpen,
    skatteModalOpen,
    setSkatteModalOpen,
    skatteDatum,
    setSkatteDatum,
    skatteBokförPågår,
    skatteToast,
    setSkatteToast,
    // Computed
    anstallda,
    anställdaLoading,
    skatteData,
    utlaggMap,
    // Functions
    hanteraTaBortSpec,
    loadLönekörningSpecar,
    handleTaBortLönekörning,
    refreshData,
    handleMailaSpecar,
    handleBokför,
    handleGenereraAGI,
    handleBokförSkatter,
    handleRefreshData,
    hanteraBokförSkatter,
    hanteraAGI,
  } = useLonekorning({
    anställda: propsAnställda,
    anställdaLoading: propsAnställdaLoading,
    onAnställdaRefresh,
    extrarader,
    beräknadeVärden,
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header med knappar */}
      <div className="flex justify-end items-center">
        <div className="flex gap-3">
          {!valdLonekorning && ( // Visa bara när ingen lönekörning är vald
            <Knapp text="Ny lönekörning" onClick={() => setNyLonekorningModalOpen(true)} />
          )}
          {valdLonekorning && ( // Visa bara när en lönekörning är vald
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
          {/* Tillbaka till lista */}
          <button
            onClick={() => setValdLonekorning(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Tillbaka till lönekörningar
          </button>

          {/* Lönekörning header */}
          <h2 className="text-xl font-semibold">Lönekörning: {valdLonekorning.period}</h2>

          {/* Lönespecar lista */}
          <LonespecLista
            valdaSpecar={lönekörningSpecar}
            anstallda={anstallda}
            utlaggMap={utlaggMap}
            lönekörning={valdLonekorning}
            onTaBortSpec={hanteraTaBortSpec}
            onHämtaBankgiro={() => setBankgiroModalOpen(true)}
            onMailaSpecar={() => setBatchMailModalOpen(true)}
            onBokför={() => setBokforModalOpen(true)}
            onGenereraAGI={hanteraAGI}
            onBokförSkatter={() => setSkatteModalOpen(true)}
            onRefreshData={refreshData}
            period={valdLonekorning?.period}
          />

          {/* Workflow knappar */}
          <div className="flex gap-3 justify-center mt-6">
            <Knapp
              text="📧 Maila alla"
              onClick={() => setBatchMailModalOpen(true)}
              disabled={lönekörningSpecar.length === 0}
            />
            <Knapp
              text="📊 Bokför löner"
              onClick={() => setBokforModalOpen(true)}
              disabled={lönekörningSpecar.length === 0}
            />
            <Knapp
              text="🏦 Bankgiro export"
              onClick={() => setBankgiroModalOpen(true)}
              disabled={lönekörningSpecar.length === 0}
            />
            <Knapp
              text="📋 AGI-export"
              onClick={hanteraAGI}
              disabled={lönekörningSpecar.length === 0}
            />
            <Knapp
              text="💰 Bokför skatter"
              onClick={() => setSkatteModalOpen(true)}
              disabled={lönekörningSpecar.length === 0}
            />
          </div>
        </div>
      )}

      {/* Modaler */}
      {/* TODO: Fix modal props to match component interfaces */}
      {nySpecModalOpen && <div>TODO: NySpecModal</div>}

      {nyLonekorningModalOpen && (
        <NyLonekorningModal
          isOpen={nyLonekorningModalOpen}
          onClose={() => setNyLonekorningModalOpen(false)}
          onLonekorningCreated={(lonekorning) => {
            setValdLonekorning(lonekorning);
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}

      {batchMailModalOpen && <div>TODO: MailaLonespec</div>}

      {bokforModalOpen && <div>TODO: BokforLoner</div>}

      {bankgiroModalOpen && <div>TODO: BankgiroExport</div>}

      {skatteModalOpen && <div>TODO: SkatteBokforingModal</div>}
    </div>
  );
}
//#endregion
