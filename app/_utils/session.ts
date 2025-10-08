import { auth } from "../_lib/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserId } from "../_types/common";

export type BetterAuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt?: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

export async function ensureSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    redirect("/login");
  }

  return {
    session: session as BetterAuthSession,
    userId: session.user.id as UserId,
  };
}
