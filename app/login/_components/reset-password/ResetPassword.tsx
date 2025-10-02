"use client";

import TextFalt from "../../../_components/TextFalt";
import { useResetPassword } from "../../_hooks/useResetPassword";
import { ResetPasswordProps } from "../../_types/types";

export default function ResetPassword({ token, onSuccess }: ResetPasswordProps) {
  // Business logic från hook
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    success,
    handleSubmit,
  } = useResetPassword();

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg">
          <h3 className="text-green-300 font-semibold mb-2">✅ Lösenord uppdaterat!</h3>
          <p className="text-green-200 text-sm">
            Ditt lösenord har uppdaterats. Du omdirigeras till login-sidan om 3 sekunder.
          </p>
        </div>
        <button
          onClick={onSuccess}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
        >
          Gå till login nu
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Skapa nytt lösenord</h2>
        <p className="text-slate-300 text-sm">Ange ditt nya lösenord nedan.</p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, token, onSuccess)} className="space-y-4">
        <div>
          <TextFalt
            label="Nytt lösenord"
            name="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nytt lösenord (minst 8 tecken)"
            autoComplete="new-password"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <TextFalt
            label="Bekräfta lösenord"
            name="reset-confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Bekräfta nytt lösenord"
            autoComplete="new-password"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Lösenordskrav */}
        <div className="text-xs text-slate-400">
          <p className="font-medium mb-1">Lösenordskrav:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Minst 8 tecken långt</li>
            <li>Minst en versal (A-Z)</li>
            <li>Minst en gemen (a-z)</li>
            <li>Minst en siffra (0-9)</li>
          </ul>
        </div>

        {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
        >
          {loading ? "Uppdaterar..." : "Uppdatera lösenord"}
        </button>
      </form>
    </div>
  );
}
