"use client";
import Anställda from "./Anstallda";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import UtlaggFlik from "./UtlaggFlik";
import Personalinformation from "./Personalinformation";
import Kontrakt from "../Kontrakt/Kontrakt";
import Lonespecar from "../Lonespecar/Lonespecar";
import Semester from "../Semester/Semester";
import TillbakaPil from "../../_components/TillbakaPil";
import { useAnstallda } from "../_hooks/useAnstallda";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { AnställdData } from "../_types/types";

export default function AnställdaPage() {
  const router = useRouter();

  // Använd hook för valdAnställd state
  const { state, handlers, utlaggFlikData } = useAnstallda();
  const { valdAnställd } = state;

  return (
    <MainLayout>
      <div className="mb-4">
        <TillbakaPil onClick={() => router.push("/personal")}>Tillbaka till personal</TillbakaPil>
      </div>
      <h1 className="text-3xl text-white mb-6 text-center">Anställda</h1>
      <Anställda state={state} handlers={handlers} />
      {valdAnställd && (
        <div className="mt-8">
          <AnimeradFlik title="Personalinformation" icon="📋">
            <Personalinformation state={state} handlers={handlers} />
          </AnimeradFlik>
          <AnimeradFlik title="Kontrakt" icon="📄">
            <Kontrakt anställd={valdAnställd} />
          </AnimeradFlik>
          <AnimeradFlik title="Utlägg" icon="💳">
            <UtlaggFlik state={state} handlers={handlers} utlaggFlikData={utlaggFlikData} />
          </AnimeradFlik>
          <AnimeradFlik title="Lönespecar" icon="💰">
            <Lonespecar anställd={valdAnställd} />
          </AnimeradFlik>
          <AnimeradFlik title="Semester" icon="🏖️">
            <Semester
              anställd={{
                ...valdAnställd,
                id: valdAnställd.id || 0,
                kompensation: parseFloat(valdAnställd.kompensation) || 0,
                anställningsdatum: valdAnställd.anställningsdatum || valdAnställd.startdatum,
              }}
              userId={valdAnställd?.id || 0}
            />
          </AnimeradFlik>
        </div>
      )}
    </MainLayout>
  );
}
