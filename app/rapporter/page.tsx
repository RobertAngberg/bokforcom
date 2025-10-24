"use client";

import dynamic from "next/dynamic";
import MainLayout from "../_components/MainLayout";
import LoadingSpinner from "../_components/LoadingSpinner";
import AnimeradFlik from "../_components/AnimeradFlik";

const Huvudbok = dynamic(() => import("./components/Huvudbok/Huvudbok"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const Balansrapport = dynamic(() => import("./components/Balansrapport/Balansrapport"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const Resultatrapport = dynamic(() => import("./components/Resultatrapport/Resultatrapport"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const Momsrapport = dynamic(() => import("./components/Momsrapport/Momsrapport"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

export default function Page() {
  return (
    <MainLayout>
      <h1 className="text-3xl mb-8 text-center text-white">Rapporter</h1>

      <AnimeradFlik title="Huvudbok" icon="📚" forcedOpen={false}>
        <Huvudbok />
      </AnimeradFlik>

      <div className="mt-6">
        <AnimeradFlik title="Balansrapport" icon="🏦" forcedOpen={false}>
          <Balansrapport />
        </AnimeradFlik>
      </div>

      <div className="mt-6">
        <AnimeradFlik title="Resultatrapport" icon="📈" forcedOpen={false}>
          <Resultatrapport />
        </AnimeradFlik>
      </div>

      <div className="mt-6">
        <AnimeradFlik title="Momsrapport" icon="📑" forcedOpen={false}>
          <Momsrapport />
        </AnimeradFlik>
      </div>
    </MainLayout>
  );
}
