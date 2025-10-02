import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../_lib/auth-client";

type TabType = "login" | "signup" | "forgot-password";

/**
 * Hook för LoginPage state management
 * Hanterar tabs, session check och URL query parameters
 */
export function useLoginPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("login");

  // Verification message state
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    // Redirect om användaren redan är inloggad
    if (session?.user) {
      router.push("/");
    }

    // Kolla för verified query parameter
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("verified") === "true") {
      setVerificationMessage("✅ Din email har verifierats! Du kan nu logga in.");
      // Ta bort query parameter från URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    // Kolla för reset success parameter
    if (urlParams.get("reset") === "success") {
      setVerificationMessage(
        "✅ Ditt lösenord har uppdaterats! Du kan nu logga in med ditt nya lösenord."
      );
      // Ta bort query parameter från URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [session, router]);

  /**
   * Bestämmer om sidan ska visa loading/redirect state
   */
  const shouldRedirect = isPending || !!session?.user;

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Message state
    verificationMessage,

    // Session state
    isPending,
    shouldRedirect,
  };
}
