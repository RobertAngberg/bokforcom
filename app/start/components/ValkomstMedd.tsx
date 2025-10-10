"use client";

import type { ValkomstMeddProps } from "../types/types";

export default function ValkomstMedd({ onClose }: ValkomstMeddProps) {
  return (
    <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-600">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white mb-3">
            🎉 Välkommen till Bokföringsapp!
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Grattis! Du har nu skapat ditt konto och kan börja bokföra. Du får mer än gärna använda
            Hjälp/Feedback nere till höger närhelst du behöver hjälp eller har frågor!
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-slate-400 hover:text-white transition-colors"
          title="Stäng välkomstmeddelande"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
