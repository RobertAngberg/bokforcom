import AnimeradeStjarnor from "../../_components/AnimeradeStjarnor";
import Header from "../../_components/Header";
import BokforComInfo from "../../_components/BokforComInfo";

export default function OmOssPage() {
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
            Om <span className="text-blue-400">oss</span>
          </h1>

          <div className="text-slate-300 text-lg space-y-8">
            <p className="text-xl text-slate-200 leading-relaxed">
              Vi tror att bokföring inte behöver vara komplicerat eller dyrt. Det är därför vi
              byggde Bokföringsapp - en helt gratis, modern bokföringslösning för svenska företag.
            </p>

            <div className="bg-slate-800/50 p-8 rounded-xl border border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">🎯 Vår mission</h2>
              <p className="text-slate-300 leading-relaxed">
                Traditionella bokföringsprogram är ofta krångliga, dyra och byggda för revisorer -
                inte för vanliga företagare. Vi ville skapa något annorlunda: Ett verktyg som är
                intuitivt, kraftfullt och tillgängligt för alla, oavsett ekonomisk bakgrund.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 p-6 rounded-xl border border-purple-500/30">
                <div className="text-3xl mb-3">🇸🇪</div>
                <h3 className="text-xl font-bold text-white mb-2">100% Svenskt</h3>
                <p className="text-slate-300">
                  Byggd från grunden för svenska regler och företag. BAS-kontoplanen,
                  K2/K3-regelverk, moms, ROT/RUT och AGI-rapporter - allt är anpassat för den
                  svenska marknaden.
                </p>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-xl border border-green-500/30">
                <div className="text-3xl mb-3">💚</div>
                <h3 className="text-xl font-bold text-white mb-2">Gratis för alltid</h3>
                <p className="text-slate-300">
                  Ingen friperiod som tar slut, inga dolda kostnader. Vi erbjuder en generös
                  gratisplan som fungerar för de flesta småföretag. För större behov finns rimliga
                  premiumplaner.
                </p>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-xl border border-indigo-500/30">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="text-xl font-bold text-white mb-2">AI-driven automation</h3>
                <p className="text-slate-300">
                  Vi använder modern AI-teknik för att läsa av kvitton och fakturor automatiskt. Det
                  som tidigare tog 5 minuter tar nu 30 sekunder. Smartare bokföring helt enkelt.
                </p>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-xl border border-cyan-500/30">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-xl font-bold text-white mb-2">Säkerhet först</h3>
                <p className="text-slate-300">
                  Din data är krypterad och säkrad enligt branschstandard. Vi tar säkerhet på
                  största allvar och följer GDPR. Dina siffror är bara dina.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-8 rounded-xl border border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">💡 Vår filosofi</h2>
              <div className="space-y-4 text-slate-300">
                <p>
                  <strong className="text-white">Enkelhet:</strong> Bokföring ska inte kräva en
                  ekonomiexamen. Vi gör det komplicerade enkelt med förval, automatik och
                  vägledning.
                </p>
                <p>
                  <strong className="text-white">Transparens:</strong> Inga konstiga avgifter eller
                  villkor med stövel. Du vet alltid vad du får och vad det kostar (ofta: ingenting).
                </p>
                <p>
                  <strong className="text-white">Innovation:</strong> Vi utvecklar ständigt nya
                  funktioner baserat på feedback från våra användare. Din röst räknas.
                </p>
              </div>
            </div>

            <BokforComInfo />

            <div className="text-center mt-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Redo att förenkla din bokföring?
              </h2>
              <p className="text-slate-300 mb-6 text-lg">
                Gå med i tusentals företagare som redan sparat tid och pengar med Bokföringsapp.
              </p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                🚀 Kom igång gratis
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
