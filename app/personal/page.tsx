// #region Huvud
"use client";

import { useState } from "react";
import MainLayout from "../_components/MainLayout";
import AnimeradFlik from "../_components/AnimeradFlik";
import Anställda from "./Anstallda/Anstallda";
import Personalinformation from "./Anstallda/NyAnställd/Personalinformation";
import Kontrakt from "./Kontrakt/Kontrakt";
import Lonespecar from "./Lonespecar/Lonespecar";
import ModernSemester from "./Semester/ModernSemester";
import Lonekorning from "./Lonekorning/Lonekorning";
import BokförLönTest from "./Lonespecar/BokförLönTest";

export default function PersonalPage() {
  // #endregion

  // #region State
  const [valdAnställd, setValdAnställd] = useState<any>(null);
  const [visaAnställdFormulär, setVisaAnställdFormulär] = useState(false);
  // #endregion

  // #region Handlers
  const handleAnställdVald = (anställd: any) => {
    setValdAnställd(anställd);
    setVisaAnställdFormulär(false);
  };

  const handleLäggTillAnställd = () => {
    setValdAnställd(null);
    setVisaAnställdFormulär(true);
  };

  const handleRedigeraAnställd = () => {
    setVisaAnställdFormulär(true);
  };

  const handleAvbrytFormulär = () => {
    setVisaAnställdFormulär(false);
    setValdAnställd(null); // Dölj även andra komponenter
  };
  // #endregion

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-8">Personal</h1>
        <AnimeradFlik title="Anställda" icon="👥" forcedOpen={true}>
          <Anställda
            onAnställdVald={handleAnställdVald}
            onLäggTillAnställd={handleLäggTillAnställd}
            visaFormulär={visaAnställdFormulär}
            onAvbryt={handleAvbrytFormulär}
          />
        </AnimeradFlik>
        <AnimeradFlik title="Lonekorning" icon="💰" forcedOpen={false}>
          <Lonekorning />
        </AnimeradFlik>
        {valdAnställd && !visaAnställdFormulär && (
          <>
            <AnimeradFlik title="Personalinformation" icon="📋">
              <Personalinformation anställd={valdAnställd} onRedigera={handleRedigeraAnställd} />
            </AnimeradFlik>
            <AnimeradFlik title="Kontrakt" icon="📄">
              <Kontrakt anställd={valdAnställd} onRedigera={handleRedigeraAnställd} />
            </AnimeradFlik>
            <AnimeradFlik title="Lonespecar" icon="💰">
              <Lonespecar anställd={valdAnställd} />
            </AnimeradFlik>
            <AnimeradFlik title="Semester" icon="🏖️">
              <ModernSemester
                anställd={{
                  ...valdAnställd,
                  anställningsdatum: valdAnställd.startdatum,
                }}
                userId={valdAnställd.user_id}
              />
            </AnimeradFlik>
          </>
        )}
      </div>
    </MainLayout>
  );
}
