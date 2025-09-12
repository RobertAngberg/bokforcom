"use client";

import Anvandarprofil from "./Anvandarprofil";
import Foretagsprofil from "./Foretagsprofil";
import Farozon from "./Farozon";
import { useAdminAnvandarhantering } from "../_hooks/useAnvandarhantering";
import { useAdminForetagshantering } from "../_hooks/useForetagshantering";
import { useFarozon } from "../_hooks/useFarozon";
import type { AdminSektionProps } from "../_types/types";

export default function Admin({ initialUser, initialForetag, session }: AdminSektionProps) {
  const user = useAdminAnvandarhantering(initialUser);
  const foretag = useAdminForetagshantering(initialForetag);
  const farozon = useFarozon();

  if (!session) {
    return <div className="text-white">Du måste vara inloggad för att se denna sida.</div>;
  }

  return (
    <>
      <Anvandarprofil {...user} session={session} />
      <Foretagsprofil {...foretag} />
      <Farozon {...farozon} />
    </>
  );
}
