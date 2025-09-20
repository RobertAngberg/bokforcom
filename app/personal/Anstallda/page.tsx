"use client";
import Anställda from "./Anstallda";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import UtlaggFlik from "./UtlaggFlik";
import Personalinformation from "./Personalinformation";
import Kontrakt from "../Kontrakt/Kontrakt";
import Lonespecar from "../Lonespecar/Lonespecar";
import Semester from "../Semester/Semester";
import { usePersonalStore } from "../_stores/personalStore";
import { KontraktProvider } from "../_context/KontraktContext";

export default function AnställdaPage() {
  const { valdAnställd } = usePersonalStore();

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Anställda</h1>
      <Anställda />
      {valdAnställd && (
        <div className="mt-8">
          <AnimeradFlik title="Personalinformation" icon="📋">
            <Personalinformation />
          </AnimeradFlik>
          <AnimeradFlik title="Kontrakt" icon="📄">
            <KontraktProvider>
              <Kontrakt />
            </KontraktProvider>
          </AnimeradFlik>
          <AnimeradFlik title="Utlägg" icon="💳">
            <UtlaggFlik />
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
