import { Suspense } from "react";
import Historik from "./components/Historik";

export default async function HistorikPage() {
  // Server component - ren server component enligt Next.js best practices
  // All client-side logik finns nu i components/Historik.tsx

  return (
    <Suspense
      fallback={
        <div className="text-center">
          <h1 className="text-3xl mb-8">Historik</h1>
          <div>Laddar...</div>
        </div>
      }
    >
      <Historik />
    </Suspense>
  );
}
