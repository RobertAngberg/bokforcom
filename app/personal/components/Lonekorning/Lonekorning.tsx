//#region Imports
"use client";

import Knapp from "../../../_components/Knapp";
import Modal from "../../../_components/Modal";
import TillbakaPil from "../../../_components/TillbakaPil";
import { useLonespec } from "../../hooks/useLonespecar";
import { useLonekorning } from "../../hooks/useLonekorning";
import { useAnstallda } from "../../hooks/useAnstallda";
import type { LonekorningProps } from "../../types/types";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import NyLonekorningModal from "./SkapaNy/NyLonekorningModal";
import LonekorningLista from "./Listor/LonekorningLista";
import LonespecLista from "./Listor/LonespecLista";
import MailaLonespec from "./Wizard/MailaLonespec";
import BokforLoner from "./Wizard/BokforLoner";
import SkatteBokforingModal from "./Wizard/SkatteBokforingModal";

//#endregion

export default function Lonekorning({
  anställda: propsAnställda,
  anställdaLoading: propsAnställdaLoading,
  onAnställdaRefresh,
}: LonekorningProps = {}) {
  const { extrarader, beräknadeVärden } = useLonespec();

  // Get all employees to ensure we have complete data
  const { state: anstalldaState } = useAnstallda();
  const combinedAnstallda = anstalldaState.anställda || propsAnställda;

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
    batchData,
    deletePeriodLabel,
    // Business logic
    // Lista mode data
    lonekorningar,
    hasLonekorningar,
    listLoading,
    formatPeriodName,
    // Functions
    hanteraTaBortSpec,
    handleTaBortLönekörning,
    handleTaBortLönekörningFrånLista,
    cancelDeleteLönekorning,
    refreshData,
    hanteraAGI,
    showDeleteLönekorningModal,
    confirmDeleteLönekorning,
  } = useLonekorning({
    anställda: combinedAnstallda,
    anställdaLoading: propsAnställdaLoading,
    onAnställdaRefresh,
    extrarader,
    beräknadeVärden,
    enableListMode: true, // Aktivera lista mode så vi får lönekörning-data
  });

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
            onTaBortLonekorning={handleTaBortLönekörningFrånLista}
            taBortLoading={taBortLoading}
          />
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">
              Lönekörning: {valdLonekorning.period}
            </h2>

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
              onLönekörningUppdaterad={setValdLonekorning}
            />

            {/* Ta bort lönekörning knapp längst ner till höger */}
            <div className="flex justify-end mt-6">
              <Knapp
                text="🗑️ Ta bort lönekörning"
                onClick={() => handleTaBortLönekörning()}
                disabled={taBortLoading}
                loading={taBortLoading}
                loadingText="Tar bort..."
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
                    grundlön: lönespec?.grundlön ?? 0,
                    bruttolön: lönespec?.bruttolön ?? 0,
                    skatt: lönespec?.skatt ?? 0,
                    nettolön: lönespec?.nettolön ?? 0,
                    socialaAvgifter: lönespec?.sociala_avgifter ?? 0,
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

        <Modal
          isOpen={showDeleteLönekorningModal}
          onClose={cancelDeleteLönekorning}
          title="Bekräfta borttagning"
          maxWidth="md"
        >
          <div className="space-y-6">
            <p className="text-gray-300 text-center">
              Är du säker på att du vill ta bort lönekörningen
              {deletePeriodLabel && (
                <span className="font-semibold text-white"> {deletePeriodLabel}</span>
              )}
              ? Detta går inte att ångra.
            </p>
            <div className="flex justify-center gap-3">
              <Knapp
                text="Avbryt"
                onClick={() => cancelDeleteLönekorning()}
                className="!bg-slate-600 hover:!bg-slate-500"
              />
              <Knapp
                text="🗑️ Ta bort"
                onClick={confirmDeleteLönekorning}
                loading={taBortLoading}
                loadingText="Tar bort..."
                className="!bg-red-700 hover:!bg-red-800"
              />
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
