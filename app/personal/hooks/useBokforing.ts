"use client";

import { useState } from "react";

export function useBokforing() {
  const [bokföringRegler, setBokföringRegler] = useState<any[]>([]);
  const [bokföringTransaktioner, setBokföringTransaktioner] = useState<any[]>([]);
  const [bokföringLoading, setBokföringLoading] = useState(false);

  return {
    bokföringRegler,
    bokföringTransaktioner,
    bokföringLoading,
    setBokföringRegler,
    setBokföringTransaktioner,
    setBokföringLoading,
  };
}
