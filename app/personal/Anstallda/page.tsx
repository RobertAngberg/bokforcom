"use client";
import Anställda from "./Anstallda";
import MainLayout from "../../_components/MainLayout";
import { useState } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Personalinformation from "./NyAnstalld/Personalinformation";
import Kontrakt from "../Kontrakt/Kontrakt";
import Lonespecar from "../Lonespecar/Lonespecar";
import Semester from "../Semester/Semester";

export default function AnställdaPage() {
  const [valdAnställd, setValdAnställd] = useState<any>(null);
  const [visaAnställdFormulär, setVisaAnställdFormulär] = useState(false);

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Anställda</h1>
      <Anställda
        onAnställdVald={setValdAnställd}
        onLäggTillAnställd={() => setVisaAnställdFormulär(true)}
        visaFormulär={visaAnställdFormulär}
        onAvbryt={() => setVisaAnställdFormulär(false)}
      />
      {valdAnställd && (
        <div className="mt-8">
          <AnimeradFlik title="Personalinformation" icon="📋">
            <Personalinformation anställd={valdAnställd} />
          </AnimeradFlik>
          <AnimeradFlik title="Kontrakt" icon="📄">
            <Kontrakt anställd={valdAnställd} />
          </AnimeradFlik>
          <AnimeradFlik title="Lönespecar" icon="💰">
            <Lonespecar anställd={valdAnställd} />
          </AnimeradFlik>
          <AnimeradFlik title="Semester" icon="🏖️">
            <Semester anställd={valdAnställd} userId={valdAnställd?.id || 0} />
          </AnimeradFlik>
        </div>
      )}
    </MainLayout>
  );
}
