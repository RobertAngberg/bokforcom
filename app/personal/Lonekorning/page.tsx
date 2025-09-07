"use client";
import MainLayout from "../../_components/MainLayout";
import Lonekorning from "./Lonekorning";

export default function LonekorningPage() {
  return (
    <MainLayout>
      <h1 className="text-3xl text-white mb-6 text-center">Lönekörning</h1>
      <Lonekorning />
    </MainLayout>
  );
}
