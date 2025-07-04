import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import NeonAdapter from "@auth/neon-adapter";
import { Pool } from "@neondatabase/serverless";

export const { auth, handlers, signIn, signOut } = NextAuth(() => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  return {
    adapter: NeonAdapter(pool),
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
      Resend({
        from: process.env.RESEND_FROM_EMAIL!,
      }),
    ],
    session: { strategy: "database" },
    callbacks: {
      session: async ({ session, user }) => {
        if (session.user) {
          session.user.id = user.id; // ← DETTA FIXAR ALLT!
        }
        return session;
      },
    },
  };
});
