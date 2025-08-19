import LoginForm from "./LoginForm.tsx";

// SÄKERHETSVALIDERING: Secure login component
export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-lg shadow-xl">
        <h1 className="mb-6 text-3xl font-bold text-center">Säker Inloggning</h1>

        {/* SÄKERHET: Säker Google OAuth - nu med client-side approach */}
        <LoginForm />

        {/* SÄKERHET: Säkerhetsinformation */}
        <div className="mt-6 text-sm text-gray-400 text-center">
          <p>🔐 Säker OAuth 2.0 autentisering</p>
          <p>🛡️ Dina uppgifter skyddas med bankstandard</p>
        </div>
      </div>
    </div>
  );
}
