"use client";

import React from "react";
import LönespecView from "../../Anstallda/Lonespecar/LonespecView";
import Knapp from "../../../../_components/Knapp";
import { LonespecListaProps } from "../../../types/types";
import { useLonekorningSpecLista } from "../../../hooks/useLonekorningSpecLista";

export default function LonespecLista({
  valdaSpecar,
  anstallda,
  utlaggMap,
  lönekörning,
  onTaBortSpec,
  onHämtaBankgiro,
  onMailaSpecar,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
  onRefreshData,
  period,
}: LonespecListaProps) {
  const {
    taBortLaddning,
    hasIncompleteSpecs,
    workflowSteps,
    lönekörningKomplett,
    handleTaBortLönespec,
  } = useLonekorningSpecLista({
    valdaSpecar,
    lönekörning,
    onTaBortSpec,
    onHämtaBankgiro,
    onMailaSpecar,
    onBokför,
    onGenereraAGI,
    onBokförSkatter,
  });

  if (valdaSpecar.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Workflow validation warning */}
      {hasIncompleteSpecs && (
        <div className="bg-yellow-600 p-3 rounded text-white text-center mb-4">
          ⚠️ Kontrollera att alla lönespecar är kompletta innan du startar lönekörningen!
        </div>
      )}

      {/* Lönespecar */}
      <>
        {valdaSpecar.map((spec) => {
          const anstalld = anstallda.find((a) => a.id === spec.anställd_id);
          const utlagg = anstalld ? utlaggMap[anstalld.id] || [] : [];

          return (
            <LönespecView
              key={spec.id}
              lönespec={spec}
              anställd={anstalld}
              utlägg={utlagg}
              ingenAnimering={false}
              taBortLoading={taBortLaddning[spec.id] || false}
              visaExtraRader={true}
              onTaBortLönespec={() => handleTaBortLönespec(spec)}
            />
          );
        })}
      </>

      {/* Extra spacing */}
      <div className="h-4"></div>

      {/* Lönekörnings-workflow */}
      <div className="bg-slate-700 rounded-lg p-6">
        {/* Progress Steps - Integrerad med knappar */}
        <div className="space-y-4 mb-6">
          {workflowSteps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center justify-between bg-slate-600 rounded-lg p-4"
            >
              {/* Vänster sida: Status och info */}
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 min-w-[2rem] rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                    step.completed ? "bg-green-600 text-white" : "bg-slate-500 text-gray-300"
                  }`}
                >
                  {step.completed ? "✓" : index + 1}
                </div>
                <div>
                  <div
                    className={`text-sm font-medium ${
                      step.completed ? "text-green-400" : "text-white"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    {step.description}
                    {step.id === "agi" && (
                      <a
                        href="https://www.skatteverket.se/foretagochorganisationer/arbetsgivare/nyttlamnaarbetsgivardeklarationpaindividniva.4.41f1c61d16193087d7fcaeb.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline ml-2"
                      >
                        Länk till Skatteverket
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Höger sida: Knapp */}
              <div>
                <Knapp
                  text={step.buttonText}
                  onClick={step.onClick}
                  className={
                    step.enabled
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-500 cursor-not-allowed"
                  }
                  disabled={!step.enabled}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion status */}
      {lönekörningKomplett && (
        <div className="mt-6 p-6 bg-slate-600 rounded-lg text-center shadow-lg">
          <div className="text-white text-xl font-bold mb-2">🎉 Lönekörning avslutad</div>
          <div className="text-gray-300 text-sm">
            Alla steg har genomförts framgångsrikt. Lönekörningen är nu komplett.
          </div>
        </div>
      )}
    </div>
  );
}
