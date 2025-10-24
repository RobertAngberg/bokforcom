import AnimeradeStjarnor from "../../components/AnimeradeStjarnor";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import PrisSektion from "../../components/PrisSektion";
import Link from "next/link";

export default function PriserPage() {
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
            Våra <span className="text-blue-400">Priser</span>
          </h1>

          <div className="text-slate-300 text-lg space-y-4">
            <p>
              Vi har de mest generösa priserna på marknaden för att göra det enkelt för alla att få
              tillgång till våra tjänster. Frågor på det?{" "}
              <Link
                href="/kontakt"
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Kontakta oss
              </Link>{" "}
              gärna!
            </p>
          </div>

          <PrisSektion />
        </div>
      </main>

      <Footer />
    </div>
  );
}
