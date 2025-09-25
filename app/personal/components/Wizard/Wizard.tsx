import Knapp from "../../../_components/Knapp";
import type { WizardStep } from "../../hooks/useWizard";

interface WizardProps {
  steps: WizardStep[];
  isComplete: boolean;
  lönekörningId?: number;
  onMarkeraFärdig?: (lönekörningId: number) => void;
}

export default function Wizard({ steps, isComplete, lönekörningId, onMarkeraFärdig }: WizardProps) {
  return (
    <div className="space-y-4">
      {/* Completion message */}
      {isComplete && (
        <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4 text-center">
          <div className="text-white text-xl font-bold mb-2">🎉 Lönekörning komplett!</div>
          <div className="text-green-300 text-sm">Alla steg har genomförts framgångsrikt.</div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isDisabled = step.status === "disabled";

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between rounded-lg p-4 transition-all duration-200 ${
                isCompleted
                  ? "bg-green-900/30 border border-green-600/50"
                  : isDisabled
                    ? "bg-slate-800 border border-slate-600/50 opacity-50"
                    : "bg-slate-800 border border-slate-600/50"
              }`}
            >
              {/* Vänster sida */}
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center text-sm font-bold mr-4 transition-colors ${
                    isCompleted
                      ? "bg-green-600 text-white shadow-lg"
                      : isDisabled
                        ? "bg-gray-600 text-gray-400"
                        : "bg-teal-600 text-white shadow-lg"
                  }`}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`text-sm font-medium ${
                        isCompleted ? "text-green-400" : isDisabled ? "text-gray-400" : "text-white"
                      }`}
                    >
                      {step.title}
                    </div>

                    {/* Markera färdig-knapp */}
                    {!isCompleted && !isDisabled && (
                      <button
                        onClick={() => lönekörningId && onMarkeraFärdig?.(lönekörningId)}
                        disabled={!lönekörningId || !onMarkeraFärdig}
                        className="text-xs bg-cyan-700 text-white px-2 py-1 rounded hover:bg-cyan-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Markera färdig
                      </button>
                    )}

                    {/* Status badges - bara för completed */}
                    {isCompleted && (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                        ✅ Klar
                      </span>
                    )}
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
                  onClick={isDisabled ? undefined : step.onClick}
                  disabled={isDisabled}
                  className={
                    isCompleted
                      ? "bg-green-600 hover:bg-green-700"
                      : isDisabled
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
