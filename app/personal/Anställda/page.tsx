"use client";
import Anställda from "./Anställda";
import MainLayout from "../../_components/MainLayout";
import { useState } from "react";

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
    </MainLayout>
  );
}
