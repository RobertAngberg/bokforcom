import { useState, FormEvent } from "react";
import { signUp } from "../../../../_lib/auth-client";
import { trackRegistrationConversion } from "../../../../_utils/googleAds";

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
      const { error } = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/",
      });

      if (error) {
        setError(error.message || "Registrering misslyckades");
      } else {
        // Track successful registration in Google Ads
        trackRegistrationConversion();
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
