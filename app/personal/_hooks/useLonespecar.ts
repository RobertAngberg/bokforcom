"use client";

import { usePersonalContext } from "../_context/PersonalContext";

export function useLonespecar() {
  const {
    state: { lönespecar, sparar, taBort, förhandsgranskaId },
    setLönespecar,
    setSparar,
    setTaBort,
    setFörhandsgranskaId,
  } = usePersonalContext();

  return {
    lönespecar,
    sparar,
    taBort,
    förhandsgranskaId,
    setLönespecar,
    setSparar,
    setTaBort,
    setFörhandsgranskaId,
  };
}
