//#region Imports
"use client";

import { useMemo, useState } from "react";
import Knapp from "../../../_components/Knapp";
import Modal from "../../../_components/Modal";
import TillbakaPil from "../../../_components/TillbakaPil";
import { useLonekorning } from "../../hooks/useLonekorning";
import { useAnstallda } from "../../hooks/useAnstallda";
import type { LonekorningProps, Lönespec } from "../../types/types";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import NyLonekorningModal from "./SkapaNy/NyLonekorningModal";
import LonekorningLista from "./Listor/LonekorningLista";
import LonespecLista from "./Listor/LonespecLista";
import MailaLonespec from "./Wizard/MailaLonespec";
import BokforLoner from "./Wizard/BokforLoner";
import SkatteBokforingModal from "./Wizard/SkatteBokforingModal";
import BankgiroExport from "./Wizard/BankgiroExport";

//#endregion

export default function Lonekorning({
  anställda: propsAnställda,
  anställdaLoading: propsAnställdaLoading,
  onAnställdaRefresh,
}: LonekorningProps = {}) {
  // Local state för mail modal
  const [mailModalOpen, setMailModalOpen] = useState(false);

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
    bokforModalOpen,
    setBokforModalOpen,
    bankgiroModalOpen,
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
    utbetalningsdatum,
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
    specListHandleHämtaBankgiro,
  } = useLonekorning({
    anställda: combinedAnstallda,
    anställdaLoading: propsAnställdaLoading,
    onAnställdaRefresh,
    enableListMode: true, // Aktivera lista mode så vi får lönekörning-data
  });

  const bankgiroUtbetalningsdatum = useMemo(() => {
    if (typeof utbetalningsdatum === "string" && utbetalningsdatum.length > 0) {
      const parsed = new Date(`${utbetalningsdatum}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const datumKälla = lönekörningSpecar.find((spec) => spec.utbetalningsdatum)?.utbetalningsdatum;
    if (!datumKälla) {
      return null;
    }
    if (datumKälla instanceof Date) {
      return datumKälla;
    }
    const parsed = new Date(`${datumKälla}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [utbetalningsdatum, lönekörningSpecar]);

  const bankgiroLönespecar = useMemo(() => {
    return lönekörningSpecar.reduce<Record<string | number, Lönespec>>((acc, spec) => {
      const anställdId = Number(spec.anställd_id);
      if (!Number.isNaN(anställdId)) {
        acc[anställdId] = { ...spec } as Lönespec;
      }
      return acc;
    }, {});
  }, [lönekörningSpecar]);

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
              onHämtaBankgiro={specListHandleHämtaBankgiro}
              onMailaSpecar={() => setMailModalOpen(true)}
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

        {/* Mail modal - lista lönespecar att välja från */}
        {mailModalOpen && batchData.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full p-6 relative border border-slate-700">
              <button
                className="absolute top-2 right-2 text-2xl text-slate-300 hover:text-white"
                onClick={() => setMailModalOpen(false)}
                aria-label="Stäng"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4 text-white">Välj lönespec att maila</h2>
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {batchData.map((item, index) => {
                  const anställdNamn =
                    item.anställd?.namn ||
                    `${item.anställd?.förnamn || ""} ${item.anställd?.efternamn || ""}`.trim() ||
                    "Okänd anställd";
                  const email =
                    item.anställd?.mail ||
                    item.anställd?.epost ||
                    item.anställd?.email ||
                    "Ingen e-post";

                  return (
                    <div key={index} className="bg-slate-700 p-3 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-white font-semibold">{anställdNamn}</div>
                          <div className="text-slate-300 text-sm">{email}</div>
                        </div>
                        <MailaLonespec
                          lönespec={item.lönespec}
                          anställd={item.anställd}
                          företagsprofil={item.företagsprofil || undefined}
                          extrarader={item.extrarader || []}
                          beräknadeVärden={item.beräknadeVärden}
                          onMailComplete={() => {
                            setMailModalOpen(false);
                            refreshData();
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors mt-4"
                onClick={() => setMailModalOpen(false)}
              >
                Stäng
              </button>
            </div>
          </div>
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
            onHämtaBankgiro={specListHandleHämtaBankgiro}
          />
        )}

        {bankgiroModalOpen && (
          <BankgiroExport
            anställda={anstallda || []}
            utbetalningsdatum={bankgiroUtbetalningsdatum}
            lönespecar={bankgiroLönespecar}
            open={bankgiroModalOpen}
            onClose={() => setBankgiroModalOpen(false)}
            onExportComplete={() => {
              void refreshData();
              setBankgiroModalOpen(false);
            }}
            showButton={false}
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
