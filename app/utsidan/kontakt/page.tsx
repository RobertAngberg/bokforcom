import AnimeradeStjarnor from "../components/AnimeradeStjarnor";
import Header from "../components/Header";
import BokforComInfo from "../components/BokforComInfo";
import KontaktFormular from "../components/KontaktFormular";

export default function KontaktPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden"
      style={{
        backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px),
        radial-gradient(ellipse at top, #2a3a50, #0f172a)
      `,
        backgroundSize: "15px 15px, 15px 15px, 100% 100%",
      }}
    >
      <AnimeradeStjarnor />

      <Header />

      <main className="px-6 py-24">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
            <span className="text-blue-400">Kontakt</span>
          </h1>

          <div className="text-slate-300 text-lg space-y-8">
            <p className="text-xl text-slate-200 leading-relaxed">
              Vi finns här för att hjälpa dig! Har du frågor, förslag eller behöver support? Tveka
              inte att höra av dig.
            </p>

            {/* Kontaktformulär */}
            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-6">📧 Skicka ett meddelande</h2>
              <KontaktFormular />
            </div>

            <BokforComInfo />
          </div>
        </div>
      </main>
    </div>
  );
}
