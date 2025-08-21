import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import NeonAdapter from "@auth/neon-adapter";
import { Pool } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const { auth, handlers, signIn, signOut } = NextAuth(() => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  return {
    adapter: NeonAdapter(pool),
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
      Facebook({
        clientId: process.env.AUTH_FACEBOOK_ID!,
        clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
      }),
      Credentials({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Lösenord", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const pool = new Pool({ connectionString: process.env.DATABASE_URL });

          try {
            const result = await pool.query("SELECT * FROM users WHERE email = $1", [
              credentials.email,
            ]);

            const user = result.rows[0];

            if (user && (await bcrypt.compare(credentials.password as string, user.password))) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
              };
            }

            return null;
          } catch (error) {
            console.error("Auth error:", error);
            return null;
          }
        },
      }),
    ],
    session: { strategy: "database" },
    callbacks: {
      session: async ({ session, user }) => {
        if (session.user) {
          session.user.id = user.id;
        }
        return session;
      },
    },
  };
});
