import { HuvudsektionProps } from "../types/types";

export default function HeroSection({ isLoading, onGetStarted }: HuvudsektionProps) {
  return (
    <section className="text-center py-24">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 mt-8">
        <span className="text-blue-400 block">Gratis, automatisk bokföring</span>
      </h1>
      <p className="text-3xl font-bold text-slate-200 mb-8">
        Bokföring, fakturering & lön - gratis för alltid!
      </p>
      <div className="space-x-4">
        <button
          onClick={onGetStarted}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50"
        >
          {isLoading ? "Startar..." : "🚀 Starta gratis"}
        </button>
        <button
          onClick={() => (window.location.href = "/login")}
          className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
        >
          Har redan konto
        </button>
      </div>
    </section>
  );
}
