import { useState, FormEvent } from "react";
import { authClient } from "../../_lib/auth-client";

/**
 * Hook för signup/registrering business logic
 * Hanterar form state, validation och API calls
 */
export function useSignUp() {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Loading/Error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Hanterar signup form submission
   */
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/",
      });

      if (error) {
        setError(error.message || "Registrering misslyckades");
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
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  return {
    // Form state
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,

    // Loading/Error state
    loading,
    error,

    // Actions
    handleSignUp,
    resetForm,
  };
}
