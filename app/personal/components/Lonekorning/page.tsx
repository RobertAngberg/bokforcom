"use client";
import MainLayout from "../../../_components/MainLayout";
import TillbakaPil from "../../../_components/TillbakaPil";
import Lonekorning from "./Lonekorning";
import { useRouter } from "next/navigation";

export default function LonekorningPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="mb-4">
        <TillbakaPil onClick={() => router.push("/personal")}>Tillbaka till personal</TillbakaPil>
      </div>
      <h1 className="text-3xl text-white mb-6 text-center">Lönekörning</h1>
      <Lonekorning />
    </MainLayout>
  );
}
