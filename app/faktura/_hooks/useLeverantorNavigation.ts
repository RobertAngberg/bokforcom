"use client";

import { useRouter } from "next/navigation";
import { NavigationParams } from "../_types/types";

export function useLeverantorNavigation() {
  const router = useRouter();

  const navigateToLeverantorsfakturor = () => {
    router.push("/faktura/Leverantorsfakturor");
  };

  const navigateToBokforing = ({ leverantorId, levfakt = true }: NavigationParams) => {
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
