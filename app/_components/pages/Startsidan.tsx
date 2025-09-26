"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";

// Custom hook för scroll animationer
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log("Intersection observed:", entry.isIntersecting, "for element:", entry.target);
        if (entry.isIntersecting) {
          console.log("Element became visible - triggering animation");
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1, // Trigger när 10% av elementet är synligt
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return { ref, isVisible };
}

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const animation1 = useScrollAnimation();
  const animation4 = useScrollAnimation();
  const animation7 = useScrollAnimation();
  const animation10 = useScrollAnimation();

  const handleGetStarted = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/signup" });
  };

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
      {/* Animated Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(75)].map((_, i) => {
          const directions = [
            "float-up-right",
            "float-up-left",
            "float-down-right",
            "float-down-left",
            "float-up",
            "float-down",
            "float-left",
            "float-right",
          ];
          const randomDirection = directions[Math.floor(Math.random() * directions.length)];
          const starSize = 1 + Math.random() * 2; // Size between 1px and 3px

          return (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-0"
              style={{
                width: `${starSize}px`,
                height: `${starSize}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `fade-in 2s ease-out forwards, twinkle ${2 + Math.random() * 3}s ease-in-out infinite alternate, ${randomDirection} ${8 + Math.random() * 12}s linear infinite, pulse ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.4;
          }
        }
        @keyframes twinkle {
          0% {
            opacity: 0.2;
            transform: scale(0.5);
          }
          100% {
            opacity: 0.8;
            transform: scale(1.3);
          }
        }
        @keyframes float-up-right {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(-24px) translateX(20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-48px) translateX(40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(-72px) translateX(60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(-96px) translateX(80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120px) translateX(100px);
            opacity: 0;
          }
        }
        @keyframes float-up-left {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(-24px) translateX(-20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-48px) translateX(-40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(-72px) translateX(-60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(-96px) translateX(-80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120px) translateX(-100px);
            opacity: 0;
          }
        }
        @keyframes float-down-right {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(24px) translateX(20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(48px) translateX(40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(72px) translateX(60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(96px) translateX(80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(120px) translateX(100px);
            opacity: 0;
          }
        }
        @keyframes float-down-left {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(24px) translateX(-20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(48px) translateX(-40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(72px) translateX(-60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(96px) translateX(-80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(120px) translateX(-100px);
            opacity: 0;
          }
        }
        @keyframes float-up {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(-24px) translateX(0px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-48px) translateX(0px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(-72px) translateX(0px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(-96px) translateX(0px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120px) translateX(0px);
            opacity: 0;
          }
        }
        @keyframes float-down {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(24px) translateX(0px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(48px) translateX(0px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(72px) translateX(0px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(96px) translateX(0px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(120px) translateX(0px);
            opacity: 0;
          }
        }
        @keyframes float-left {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(0px) translateX(-20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(0px) translateX(-40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(0px) translateX(-60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(0px) translateX(-80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(0px) translateX(-100px);
            opacity: 0;
          }
        }
        @keyframes float-right {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(0px) translateX(20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(0px) translateX(40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(0px) translateX(60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(0px) translateX(80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(0px) translateX(100px);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          50% {
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-2xl font-bold text-white">Bokföringsapp</span>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => signIn()}
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
          <section className="text-center py-24">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 mt-8">
              <span className="text-blue-400 block">Gratis, automatisk bokföring</span>
            </h1>
            <p className="text-3xl font-bold text-slate-200 mb-8">
              Bokföring, fakturering & lön - gratis för alltid!
            </p>
            {/* <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl text-xl font-bold mb-8 inline-block shadow-lg">
              <span style={{ textShadow: "0px 1px 1px rgba(0,0,0,0.2)" }}>
                Ta en tur och kolla in funktionerna
              </span>
            </div> */}
            <div className="space-x-4">
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? "Startar..." : "🚀 Starta gratis"}
              </button>
              <button
                onClick={() => signIn()}
                className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Har redan konto
              </button>
            </div>
          </section>

          {/* Features Grid */}
          {/* <section className="py-20">
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
          </section> */}

          {/* Animated Images Section */}
          <section className="py-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-white text-center mb-16">
                Bokföring med förval
              </h2>
              <div className="flex justify-center">
                {/* Enda animerade div */}
                <div
                  ref={animation1.ref}
                  className={`transform transition-all duration-[900ms] ease-out max-w-4xl w-full ${
                    animation1.isVisible ? "translate-x-0 opacity-100" : "translate-x-24 opacity-0"
                  }`}
                  style={{ transitionDelay: "0ms" }}
                >
                  <div className="relative rounded-xl border-4 border-blue-500 shadow-2xl h-[600px] overflow-hidden">
                    <Image
                      src="/BoxGratisBokf%C3%B6ring1.jpg"
                      alt="Gratis bokföring demo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Text under första korten */}
              <div className="text-center mt-12">
                <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                  Stort bibliotek med förval som gör att du slipper hålla koll på konton och debet
                  och kredit. Systemet hittar rätt konton automatiskt!
                </p>
              </div>
            </div>
          </section>

          {/* Second Card Section */}
          <section className="py-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-white text-center mb-16">
                Automatisk fakturhantering
              </h2>
              <div className="flex justify-center">
                {/* Enda nya kort */}
                <div
                  ref={animation4.ref}
                  className={`transform transition-all duration-[900ms] ease-out max-w-4xl w-full ${
                    animation4.isVisible ? "translate-x-0 opacity-100" : "-translate-x-24 opacity-0"
                  }`}
                  style={{ transitionDelay: "0ms" }}
                >
                  <div className="relative rounded-xl border-4 border-purple-500 shadow-2xl h-[600px] overflow-hidden">
                    <Image
                      src="/BoxGratisBokf%C3%B6ring2.jpg"
                      alt="Fakturahantering demo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Text under andra korten */}
              <div className="text-center mt-12">
                <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                  AI-avläsning fyller i datum och belopp automatiskt från kvittot
                </p>
              </div>
            </div>
          </section>

          {/* Third Card Section */}
          <section className="py-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-white text-center mb-16">
                Avancerade rapporter
              </h2>
              <div className="flex justify-center">
                {/* Enda rapport kort */}
                <div
                  ref={animation7.ref}
                  className={`transform transition-all duration-[900ms] ease-out max-w-4xl w-full ${
                    animation7.isVisible ? "translate-x-0 opacity-100" : "translate-x-24 opacity-0"
                  }`}
                  style={{ transitionDelay: "0ms" }}
                >
                  <div className="relative rounded-xl border-4 border-indigo-500 shadow-2xl h-[600px] overflow-hidden">
                    <Image
                      src="/BoxGratisBokföring3.jpg"
                      alt="Avancerade rapporter demo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Text under tredje korten */}
              <div className="text-center mt-12">
                <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                  Få full koll med rapporter
                </p>
              </div>
            </div>
          </section>

          {/* Fourth Card Section */}
          <section className="py-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-white text-center mb-16">
                Komplett personalhantering
              </h2>
              <div className="flex justify-center">
                {/* Enda personal kort */}
                <div
                  ref={animation10.ref}
                  className={`transform transition-all duration-[900ms] ease-out max-w-4xl w-full ${
                    animation10.isVisible
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-24 opacity-0"
                  }`}
                  style={{ transitionDelay: "0ms" }}
                >
                  <div className="relative rounded-xl border-4 border-violet-500 shadow-2xl h-[600px] overflow-hidden">
                    <Image
                      src="/BoxGratisBokföring4.jpg"
                      alt="Komplett personalhantering demo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Text under fjärde korten */}
              <div className="text-center mt-12">
                <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                  Skapa lönespecar, hantera anställda, sköt utlägg och kör lönekörning
                </p>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">Varför välja Bokföringsapp?</h2>
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
              <span className="text-white font-semibold">Bokföringsapp</span>
            </div>
            <div className="flex space-x-6 text-slate-400">
              <a href="/signup" className="hover:text-white transition-colors">
                Användaravtal
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Integritet
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="text-center text-slate-400 text-sm mt-4">
            © 2025 Bokföringsapp. Svensk bokföring gjord enkelt.
          </div>
        </div>
      </footer>
    </div>
  );
}
