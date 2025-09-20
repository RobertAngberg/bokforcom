"use client";
import Anställda from "./Anstallda";
import MainLayout from "../../../_components/MainLayout";
import TillbakaPil from "../../../_components/TillbakaPil";
import { useRouter } from "next/navigation";

export default function AnställdaPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="mb-4">
        <TillbakaPil onClick={() => router.push("/personal")}>Tillbaka till personal</TillbakaPil>
      </div>
      <h1 className="text-3xl text-white mb-6 text-center">Anställda</h1>
      <Anställda />
    </MainLayout>
  );
}
