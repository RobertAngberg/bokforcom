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
    // Publika routes som inte kräver inloggning eller onboarding
    const publicPaths = ["/", "/login", "/funktioner", "/kontakt", "/om-oss", "/priser", "/api"];

    // Om användaren är på en publik sida, tillåt direkt
    if (publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
      setIsChecking(false);
      setIsComplete(true);
      return;
    }

    // Om användaren är på onboarding-sidan, kolla att de är inloggade
    if (pathname.startsWith("/onboarding")) {
      async function checkLogin() {
        const result = await checkOnboardingStatus();
        if (result.notLoggedIn) {
          router.push("/login");
        } else {
          setIsComplete(true);
        }
        setIsChecking(false);
      }
      checkLogin();
      return;
    }

    // För alla andra sidor (skyddade), kolla både inloggning och onboarding
    async function checkStatus() {
      const result = await checkOnboardingStatus();

      // Om inte inloggad, redirecta till login
      if (result.notLoggedIn) {
        router.push("/login");
        return;
      }

      // Om inloggad men inte slutfört onboarding, redirecta till onboarding
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
