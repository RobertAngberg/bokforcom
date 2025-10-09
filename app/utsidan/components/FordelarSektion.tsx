import { FordelarSektionProps } from "../types/types";

export default function BenefitsSection({ isLoading, onGetStarted }: FordelarSektionProps) {
  const benefits = [
    {
      title: "Svenska regler",
      description: "Byggd för svenska bokföringsregler och BAS-kontoplanen.",
    },
    {
      title: "Enkel att använda",
      description: "Intuitiv design som gör bokföring begripligt för alla.",
    },
    {
      title: "Säker och trygg",
      description: "Dina data är säkra med modern kryptering och säkerhetsrutiner.",
    },
    {
      title: "Support när du behöver",
      description: "Hjälp och feedback-funktion direkt i plattformen.",
    },
  ];

  return (
    <section className="py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-bold text-white mb-6">Varför välja Bokföringsapp?</h2>
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
                  <p className="text-slate-300">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-4">Kom igång idag</h3>
          <p className="text-slate-300 mb-6">
            Skapa ditt konto och börja bokföra på mindre än 5 minuter.
          </p>
          <button
            onClick={onGetStarted}
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
  );
}
