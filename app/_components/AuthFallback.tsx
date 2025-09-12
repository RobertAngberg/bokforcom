import MainLayout from "./MainLayout";
import Link from "next/link";

export function authFallback() {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 text-white">
          <p>{"Du måste vara inloggad för att se denna sida."}</p>
          <Link
            href="/login"
            className="text-cyan-400 underline underline-offset-4 hover:text-cyan-300"
          >
            Gå till inloggning
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
