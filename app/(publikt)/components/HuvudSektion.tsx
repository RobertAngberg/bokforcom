"use client";

import StartaKnapp from "./StartaKnapp";

export default function HeroSection() {
  return (
    <section className="text-center py-16 md:py-24">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 mt-4 md:mt-8">
        <span className="text-blue-400 block">Gratis, automatisk bokföring</span>
      </h1>
      <p className="text-3xl font-bold text-slate-200 mb-10 md:mb-8">
        Bokföring, fakturering & lön - gratis för alltid!
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <StartaKnapp className="w-full max-w-[260px] sm:w-auto" />
        <button
          onClick={() => (window.location.href = "/login")}
          className="w-full max-w-[260px] sm:w-auto bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
        >
          Har redan konto
        </button>
      </div>
    </section>
  );
}
