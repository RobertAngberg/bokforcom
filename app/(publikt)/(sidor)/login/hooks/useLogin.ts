import { useState, FormEvent } from "react";
import { signIn, sendVerificationEmail } from "../../../../_lib/auth-client";

/**
 * Hook för login business logic
 * Hanterar inloggning, error handling och resend verification
 */
export function useLogin() {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Loading/Error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);

  /**
   * Hanterar login form submission
   * @param rememberMe - Om användaren ska kommas ihåg
   */
  const handleSignIn = async (e: FormEvent, rememberMe: boolean) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowResendVerification(false);

    try {
      const { data, error } = await signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: "/",
      });

      if (error) {
        if (error.status === 403) {
          // Email inte verifierad
          setError(
            "Din email är inte verifierad än. Kontrollera din inkorg och klicka på verifieringslänken."
          );
          setShowResendVerification(true);
        } else if (error.status === 429) {
          setError("För många försök. Vänta en stund innan du försöker igen.");
        } else {
          setError("Fel e-post eller lösenord");
        }
      } else if (data) {
        // Lyckad inloggning - Better Auth hanterar redirect
        window.location.href = "/";
      }
    } catch {
      setError("Något gick fel. Prova igen.");
    }
    setLoading(false);
  };

  /**
   * Skickar om verifieringsmail till användaren
   */
  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await sendVerificationEmail({
        email,
        callbackURL: "/",
      });

      if (error) {
        setError(error.message || "Kunde inte skicka verifieringsmail");
      } else {
        setError("Ett nytt verifieringsmail har skickats till din email!");
        setShowResendVerification(false);
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
    setPassword("");
    setError("");
    setShowResendVerification(false);
  };

  return {
    // Form state
    email,
    setEmail,
    password,
    setPassword,

    // Loading/Error state
    loading,
    error,
    showResendVerification,

    // Actions
    handleSignIn,
    handleResendVerification,
    resetForm,
  };
}
