import { useState, FormEvent } from "react";
import { authClient } from "../../_lib/auth-client";

/**
 * Hook för forgot password business logic
 * Hanterar password reset request
 */
export function useForgotPassword() {
  // Form state
  const [email, setEmail] = useState("");

  // Loading/Error/Success state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /**
   * Hanterar password reset request
   */
  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/login/reset-password",
      });

      if (error) {
        setError(error.message || "Kunde inte skicka återställningsmall");
      } else {
        setSuccess(true);
        setMessage("Ett mail med återställningslänk har skickats till din email!");
      }
    } catch {
      setError("Något gick fel. Försök igen.");
    }

    setLoading(false);
  };

  /**
   * Återställer formuläret till default state
   */
  const resetForm = () => {
    setEmail("");
    setError("");
    setSuccess(false);
    setMessage("");
  };

  return {
    // Form state
    email,
    setEmail,

    // Loading/Error/Success state
    loading,
    error,
    success,
    message,

    // Actions
    handlePasswordReset,
    resetForm,
  };
}
