import { useState, FormEvent } from "react";
import { resetPassword } from "../../_lib/auth-client";

/**
 * Hook för reset password business logic
 * Hanterar password reset med token validation
 */
export function useResetPassword() {
  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading/Error/Success state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /**
   * Hanterar password reset form submission
   * @param token - Reset token från email
   * @param onSuccess - Callback som körs vid lyckad reset
   */
  const handleSubmit = async (e: FormEvent, token: string, onSuccess: () => void) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validera att lösenorden matchar
      if (password !== confirmPassword) {
        setError("Lösenorden matchar inte");
        setLoading(false);
        return;
      }

      const { error } = await resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setError(error.message || "Något gick fel");
      } else {
        setSuccess(true);
        // Redirect efter 3 sekunder
        setTimeout(() => {
          onSuccess();
        }, 3000);
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
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  };

  return {
    // Form state
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,

    // Loading/Error/Success state
    loading,
    error,
    success,

    // Actions
    handleSubmit,
    resetForm,
  };
}
