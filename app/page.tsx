import Startsidan from "./(publikt)/Startsidan";
import { auth } from "./_lib/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/start");
  }

  return <Startsidan />;
}
