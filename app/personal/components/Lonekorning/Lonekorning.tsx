//#region Imports
"use client";

import Knapp from "../../../_components/Knapp";
import TillbakaPil from "../../../_components/TillbakaPil";
import { useLonespec } from "../../hooks/useLonespecar";
import { useLonekorning } from "../../hooks/useLonekorning";
import { useAnstallda } from "../../hooks/useAnstallda";
import type { LonekorningProps, BatchDataItem } from "../../types/types";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import NyLonekorningModal from "./SkapaNy/NyLonekorningModal";
import LonekorningLista from "./Listor/LonekorningLista";
import LonespecLista from "./Listor/LonespecLista";
import MailaLonespec from "./Wizard/MailaLonespec";
import BokforLoner from "./Wizard/BokforLoner";
import SkatteBokforingModal from "./Wizard/SkatteBokforingModal";

//#endregion

//#region Component
export default function Lonekorning({
  anställda: propsAnställda,
  anställdaLoading: propsAnställdaLoading,
  onAnställdaRefresh,
}: LonekorningProps = {}) {
  const { extrarader, beräknadeVärden } = useLonespec();

  // Get all employees to ensure we have complete data
  const { state: anstalldaState } = useAnstallda();

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
    bokforModalOpen,
    setBokforModalOpen,
    setBankgiroModalOpen,
    skatteModalOpen,
    setSkatteModalOpen,
    skatteData,
    skatteDatum,
    setSkatteDatum,
    hanteraBokförSkatter,
    // Computed
    anstallda,
    utlaggMap,
    // Business logic
    prepareBatchData,
    // Lista mode data
    lonekorningar,
    hasLonekorningar,
    listLoading,
    formatPeriodName,
    getItemClassName,
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
    enableListMode: true, // Aktivera lista mode så vi får lönekörning-data
  });

  const allAnstallda = anstalldaState.anställda || anstallda;

  // Prepare batch data for mailing using hook
  const batchData: BatchDataItem[] = prepareBatchData(lönekörningSpecar, allAnstallda);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* Tillbaka-knapp när lönekörning är vald - allra högst upp */}
      {valdLonekorning && (
        <TillbakaPil
          onClick={() => setValdLonekorning(null)}
          ariaLabel="Tillbaka till lönekörningar"
          className="mb-4"
        >
          Tillbaka
        </TillbakaPil>
      )}

      <div className="space-y-6">
        {/* Header med knappar */}
        <div className="flex justify-end items-center">
          <div className="flex gap-3">
            {!valdLonekorning && (
              <Knapp text="+ Ny lönekörning" onClick={() => setNyLonekorningModalOpen(true)} />
            )}
          </div>
        </div>

        {/* Main Content */}
        {!valdLonekorning ? (
          <LonekorningLista
            onValjLonekorning={setValdLonekorning}
            valdLonekorning={valdLonekorning}
            refreshTrigger={refreshTrigger}
            lonekorningar={lonekorningar}
            hasLonekorningar={hasLonekorningar}
            listLoading={listLoading}
            formatPeriodName={formatPeriodName}
            getItemClassName={getItemClassName}
          />
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">
              Lönekörning: {valdLonekorning.period}
            </h2>

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
              onLönekörningUppdaterad={setValdLonekorning}
            />

            {/* Ta bort lönekörning knapp längst ner till höger */}
            <div className="flex justify-end mt-6">
              <Knapp
                text={taBortLoading ? "🗑️ Tar bort..." : "🗑️ Ta bort lönekörning"}
                onClick={handleTaBortLönekörning}
                disabled={taBortLoading}
              />
            </div>
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

        {bokforModalOpen &&
          batchData.length > 0 &&
          (() => {
            const item = batchData[0];
            const lönespec = item?.lönespec;

            // Mappa om data från lönespec till beräknadeVärden-format
            const beräknadeVärden =
              Object.keys(item?.beräknadeVärden || {}).length > 0
                ? item.beräknadeVärden
                : {
                    grundlön: parseFloat(lönespec?.grundlön || "0"),
                    bruttolön: parseFloat(lönespec?.bruttolön || "0"),
                    skatt: parseFloat(lönespec?.skatt || "0"),
                    nettolön: parseFloat(lönespec?.nettolön || "0"),
                    socialaAvgifter: parseFloat(lönespec?.sociala_avgifter || "0"),
                  };

            return (
              <BokforLoner
                lönespec={lönespec}
                extrarader={item?.extrarader || []}
                beräknadeVärden={beräknadeVärden}
                anställdNamn={item?.anställd?.namn || ""}
                isOpen={bokforModalOpen}
                onClose={() => setBokforModalOpen(false)}
                onBokfört={() => {
                  setBokforModalOpen(false);
                  refreshData();
                }}
              />
            );
          })()}

        {skatteModalOpen && (
          <SkatteBokforingModal
            skatteModalOpen={skatteModalOpen}
            setSkatteModalOpen={setSkatteModalOpen}
            valdaSpecar={lönekörningSpecar}
            skatteData={skatteData}
            utbetalningsdatum={null}
            skatteDatum={skatteDatum}
            setSkatteDatum={setSkatteDatum}
            hanteraBokförSkatter={hanteraBokförSkatter}
            skatteBokförPågår={false}
            onHämtaBankgiro={() => {}}
          />
        )}
      </div>
    </>
  );
}
//#endregion
