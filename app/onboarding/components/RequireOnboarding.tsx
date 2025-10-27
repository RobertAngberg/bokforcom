"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkOnboardingStatus } from "../actions/onboardingActions";
import LoadingSpinner from "../../_components/LoadingSpinner";

/**
 * Hook för att säkerställa att användaren har slutfört onboarding
 * Redirectar till /onboarding om inte slutfört
 */
export function useRequireOnboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Tillåt vissa paths utan onboarding-check
    const allowedPaths = ["/onboarding", "/login", "/api"];
    if (allowedPaths.some((path) => pathname.startsWith(path))) {
      setIsChecking(false);
      setIsComplete(true);
      return;
    }

    async function checkStatus() {
      const result = await checkOnboardingStatus();

      if (result.needsOnboarding) {
        router.push("/onboarding");
      } else {
        setIsComplete(true);
      }
      setIsChecking(false);
    }

    checkStatus();
  }, [pathname, router]);

  return { isChecking, isComplete };
}

/**
 * Component wrapper för att kräva onboarding
 */
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { isChecking, isComplete } = useRequireOnboarding();

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isComplete) {
    return null;
  }

  return <>{children}</>;
}
