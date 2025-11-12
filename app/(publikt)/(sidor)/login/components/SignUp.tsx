"use client";

import TextFalt from "../../../../_components/TextFalt";
import Knapp from "../../../../_components/Knapp";
import { useSignUp } from "../hooks/useSignUp";

export default function SignUp() {
  // Business logic från hook
  const { name, setName, email, setEmail, password, setPassword, loading, error, handleSignUp } =
    useSignUp();

  return (
    <div>
      <form onSubmit={handleSignUp} className="space-y-2">
        <div>
          <TextFalt
            label="Ditt namn"
            name="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt namn"
            autoComplete="name"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <TextFalt
            label="E-postadress"
            name="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-postadress"
            autoComplete="email"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <TextFalt
            label="Lösenord"
            name="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lösenord (minst 8 tecken)"
            autoComplete="new-password"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}

        <div className="flex items-start space-x-2" style={{ marginBottom: "20px" }}>
          <input
            name="acceptTerms"
            type="checkbox"
            id="acceptTerms"
            required
            className="mt-0.5 h-4 w-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2 accent-blue-600"
          />
          <label htmlFor="acceptTerms" className="text-slate-400 text-xs">
            Jag godkänner{" "}
            <a
              href="/anvandarvillkor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              användarvillkoren
            </a>
          </label>
        </div>

        {/* Hidden inputs för server action */}
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />

        <Knapp
          type="submit"
          text="Registrera konto"
          loading={loading}
          loadingText="Registrerar..."
          className="w-full"
        />

        <p className="text-center text-sm text-slate-400 mt-2">
          Kolla din mail efter en verifieringslänk.
        </p>
      </form>
    </div>
  );
}
