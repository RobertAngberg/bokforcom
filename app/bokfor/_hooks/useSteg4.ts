"use client";

export function useSteg4() {
  const handleNewBokforing = () => {
    window.location.reload();
  };

  return {
    handleNewBokforing,
  };
}
