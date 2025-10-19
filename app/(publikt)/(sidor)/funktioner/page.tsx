import AnimeradeStjarnor from "../../components/AnimeradeStjarnor";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

export default function FunktionerPage() {
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
            Våra <span className="text-blue-400">Funktioner</span>
          </h1>

          <div className="text-slate-300 text-lg space-y-8">
            <p className="text-xl text-slate-200 leading-relaxed">
              Bokföringsappen är byggd från grunden för att göra bokföring enkelt, snabbt och
              automatiskt. Vi kombinerar smart AI-teknik med svenska bokföringsregler för att ge dig
              en komplett lösning.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              {/* Bokföring med förval */}
              <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/30">
                <div className="text-3xl mb-3">📚</div>
                <h3 className="text-xl font-bold text-white mb-2">Bokföring med förval</h3>
                <p className="text-slate-300">
                  Stort bibliotek med färdiga förval för vanliga transaktioner. Slipp hålla koll på
                  konton, debet och kredit - systemet hittar rätt automatiskt enligt
                  BAS-kontoplanen.
                </p>
              </div>

              {/* AI-driven OCR */}
              <div className="bg-slate-800/50 p-6 rounded-xl border border-purple-500/30">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="text-xl font-bold text-white mb-2">AI-driven kvittoavläsning</h3>
                <p className="text-slate-300">
                  Ladda upp ett kvitto eller en faktura - vår AI läser automatiskt av datum, belopp,
                  leverantör och fakturanummer. Sparar massor av tid!
                </p>
              </div>

              {/* Fakturering */}
              <div className="bg-slate-800/50 p-6 rounded-xl border border-indigo-500/30">
                <div className="text-3xl mb-3">🧾</div>
                <h3 className="text-xl font-bold text-white mb-2">Komplett fakturering</h3>
                <p className="text-slate-300">
                  Skapa och skicka professionella fakturor, hantera kundfakturor och
                  leverantörsfakturor. Bokför betalningar enkelt med automatisk kontering.
                </p>
              </div>

              {/* Personal & Lön */}
              <div className="bg-slate-800/50 p-6 rounded-xl border border-violet-500/30">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="text-xl font-bold text-white mb-2">Personalhantering & Lön</h3>
                <p className="text-slate-300">
                  Hantera anställda, skapa lönespecar, kör lönekörningar och generera AGI-filer för
                  deklaration. Allt på ett ställe med automatisk bokföring.
                </p>
              </div>

              {/* Rapporter */}
              <div className="bg-slate-800/50 p-6 rounded-xl border border-green-500/30">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Kraftfulla rapporter</h3>
                <p className="text-slate-300">
                  Resultaträkning, balansräkning, verifikationslista och kontoutdrag. Exportera till
                  Excel eller generera SIE-filer för revisorn.
                </p>
              </div>

              {/* Bokslut */}
              <div className="bg-slate-800/50 p-6 rounded-xl border border-cyan-500/30">
                <div className="text-3xl mb-3">📅</div>
                <h3 className="text-xl font-bold text-white mb-2">Automatiskt bokslut</h3>
                <p className="text-slate-300">
                  Guided bokslutswizard som hjälper dig stänga räkenskapsåret enligt K2-reglerna.
                  Genererar automatiskt alla nödvändiga verifikationer.
                </p>
              </div>
            </div>

            <div className="mt-12 p-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">🇸🇪 Byggd för svenska företag</h3>
              <p className="text-slate-300 leading-relaxed">
                Vår app följer svenska bokföringsregler, använder BAS-kontoplanen och stödjer K2
                samt K3-regelverken. Vi hanterar moms, ROT/RUT-avdrag, AGI-rapporter och allt annat
                som svenska företag behöver.
              </p>
            </div>

            <div className="mt-12 text-center">
              <p className="text-2xl font-semibold text-white mb-6">
                Redo att förenkla din bokföring?
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

      <Footer />
    </div>
  );
}
