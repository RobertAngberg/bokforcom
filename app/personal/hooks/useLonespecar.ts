"use client";

import { useState } from "react";

export function useLonespecar() {
  const [lönespecar, setLönespecar] = useState<Record<string, any>>({});
  const [sparar, setSparar] = useState<Record<string, boolean>>({});
  const [taBort, setTaBort] = useState<Record<string, boolean>>({});
  const [förhandsgranskaId, setFörhandsgranskaId] = useState<string | null>(null);

  const updateSparar = (id: string, sparar: boolean) => {
    setSparar((prev) => ({ ...prev, [id]: sparar }));
  };

  const updateTaBort = (id: string, taBort: boolean) => {
    setTaBort((prev) => ({ ...prev, [id]: taBort }));
  };

  return {
    lönespecar,
    sparar,
    taBort,
    förhandsgranskaId,
    setLönespecar,
    setSparar: updateSparar,
    setTaBort: updateTaBort,
    setFörhandsgranskaId,
  };
}
