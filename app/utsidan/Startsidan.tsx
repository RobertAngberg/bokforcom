import AnimeradeStjarnor from "./components/AnimeradeStjarnor";
import Header from "./components/Header";
import HuvudSektion from "./components/HuvudSektion";
import FunktionsKort from "./components/FunktionsKort";
import PrisSektion from "./components/PrisSektion";
import FordelarSektion from "./components/FordelarSektion";
import Footer from "./components/Footer";

export default function Startsidan() {
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

      {/* Hero Section */}
      <main className="px-6">
        <div className="max-w-7xl mx-auto">
          <HuvudSektion />

          <FunktionsKort
            title="Bokföring med förval"
            description="Stort bibliotek med förval som gör att du slipper hålla koll på konton och debet och kredit. Systemet hittar rätt konton automatiskt!"
            imageSrc="/BoxGratisBokf%C3%B6ring1.jpg"
            imageAlt="Gratis bokföring demo"
            borderColor="border-blue-500"
            animationDirection="right"
          />

          <FunktionsKort
            title="Automatisk fakturhantering"
            description="AI-avläsning fyller i datum och belopp automatiskt från kvittot"
            imageSrc="/BoxGratisBokf%C3%B6ring2.jpg"
            imageAlt="Fakturahantering demo"
            borderColor="border-purple-500"
            animationDirection="left"
          />

          <FunktionsKort
            title="Avancerade rapporter"
            description="Få full koll med rapporter"
            imageSrc="/BoxGratisBokföring3.jpg"
            imageAlt="Avancerade rapporter demo"
            borderColor="border-indigo-500"
            animationDirection="right"
          />

          <FunktionsKort
            title="Komplett personalhantering"
            description="Skapa lönespecar, hantera anställda, sköt utlägg och kör lönekörning"
            imageSrc="/BoxGratisBokföring4.jpg"
            imageAlt="Komplett personalhantering demo"
            borderColor="border-violet-500"
            animationDirection="left"
          />

          <PrisSektion />

          <FordelarSektion />
        </div>
      </main>

      <Footer />
    </div>
  );
}
