"use client";

/**
 * useNavigation.ts
 *
 * Navigation hooks för leverantör-relaterade sidor
 */

import { useRouter } from "next/navigation";

/**
 * Hook för navigation mellan leverantör-relaterade sidor
 */
export function useLeverantorNavigation() {
  const router = useRouter();

  const navigateToLeverantorsfakturor = () => {
    router.push("/faktura/Leverantorsfakturor");
  };

  const navigateToBokforing = ({
    leverantorId,
    levfakt = true,
  }: {
    leverantorId: number;
    levfakt?: boolean;
  }) => {
    if (!leverantorId) {
      console.error("leverantorId is required for navigation");
      return;
    }

    const url = `/bokfor?levfakt=${levfakt}&leverantorId=${leverantorId}`;
    router.push(url);
  };

  const navigateToFaktura = () => {
    router.push("/faktura");
  };

  return {
    navigateToLeverantorsfakturor,
    navigateToBokforing,
    navigateToFaktura,
  };
}
