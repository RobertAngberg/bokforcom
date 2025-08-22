"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
// Import användaravtal modal hook
import { useAnvändaravtalModal } from "./start/AnvändaravtalModal";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { openModal, AnvändaravtalModal } = useAnvändaravtalModal();
  const router = useRouter();

  const handleGetStarted = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/signup" });
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-2xl font-bold text-white">Bokför.com</span>
          </div>
          <div className="space-x-4">
            <button
              onClick={handleLogin}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Logga in
            </button>
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Laddar..." : "Kom igång"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <section className="text-center py-20">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Sveriges enklaste
              <span className="text-blue-400 block">bokföring</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI gör din bokföring snabbare och enklare. Molnbaserad plattform som automatiskt
              föreslår rätt konton och hanterar fakturor på några klick.
            </p>

            {/* Pricing */}
            <div className="mb-8">
              <div className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold mb-4">
                🎉 1 år gratis, sedan 129 kr/månad
              </div>
              <p className="text-slate-400 text-sm">Ingen bindningstid • Avsluta när du vill</p>
            </div>

            <div className="space-x-4">
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? "Startar..." : "🚀 Starta gratis"}
              </button>
              <button
                onClick={handleLogin}
                className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Se trailer
              </button>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Allt du behöver för din bokföring
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Bokföring</h3>
                <p className="text-slate-300">
                  Enkel bokföring med färdiga mallar och automatisk kontoplansvalidering.
                </p>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🧾</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Fakturering</h3>
                <p className="text-slate-300">
                  Skapa och skicka professionella fakturor direkt från plattformen.
                </p>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Personal</h3>
                <p className="text-slate-300">
                  Hantera anställda, kör löner och håll koll på semester och utlägg.
                </p>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Rapporter</h3>
                <p className="text-slate-300">
                  Få insikter med resultatrapporter, balansrapporter och SIE-export.
                </p>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">Varför välja Bokför.com?</h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Svenska regler</h3>
                      <p className="text-slate-300">
                        Byggd för svenska bokföringsregler och BAS-kontoplanen.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Enkel att använda</h3>
                      <p className="text-slate-300">
                        Intuitiv design som gör bokföring begripligt för alla.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Säker och trygg</h3>
                      <p className="text-slate-300">
                        Dina data är säkra med modern kryptering och säkerhetsrutiner.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Support när du behöver</h3>
                      <p className="text-slate-300">
                        Hjälp och feedback-funktion direkt i plattformen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                <h3 className="text-2xl font-bold text-white mb-4">Kom igång idag</h3>
                <p className="text-slate-300 mb-6">
                  Skapa ditt konto och börja bokföra på mindre än 5 minuter.
                </p>
                <button
                  onClick={handleGetStarted}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Startar..." : "Skapa gratis konto"}
                </button>
                <p className="text-slate-400 text-sm mt-3 text-center">
                  Inget kreditkort krävs • Kom igång direkt
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-white font-semibold">Bokför.com</span>
            </div>
            <div className="flex space-x-6 text-slate-400">
              <button onClick={openModal} className="hover:text-white transition-colors">
                Användaravtal
              </button>
              <a href="#" className="hover:text-white transition-colors">
                Integritet
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="text-center text-slate-400 text-sm mt-4">
            © 2025 Bokför.com. Svensk bokföring gjord enkelt.
          </div>
        </div>
      </footer>

      {/* Användaravtal Modal */}
      <AnvändaravtalModal />
    </div>
  );
}
