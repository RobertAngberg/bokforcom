"use client";
import MainLayout from "../../_components/MainLayout";
import Lonekorning from "./Lonekorning";

export default function LonekorningPage() {
  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Lönekörning</h1>
      <Lonekorning />
    </MainLayout>
  );
}
