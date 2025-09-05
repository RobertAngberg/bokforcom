import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { Pool } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const { auth, handlers, signIn, signOut } = NextAuth(() => {
  return {
    providers: [
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
            // 🔒 SÄKERHET: Hämta användare OCH kontrollera att de inte är OAuth-only
            const result = await pool.query(
              "SELECT id, email, name, password FROM users WHERE email = $1 AND password IS NOT NULL",
              [credentials.email]
            );

            const user = result.rows[0];

            if (!user) {
              console.warn(
                `❌ Login attempt for non-existent/OAuth-only user: ${credentials.email}`
              );
              return null;
            }

            // Kontrollera lösenord
            const validPassword = await bcrypt.compare(
              credentials.password as string,
              user.password
            );
            if (!validPassword) {
              console.warn(`❌ Fel lösenord för användare: ${credentials.email}`);
              return null;
            }

            // NOTE: Email-verifiering kontrolleras i check-verification API istället
            console.log(`✅ Credentials validated for user: ${credentials.email}`);
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
            };
          } catch (error) {
            console.error("Auth error:", error);
            return null;
          }
        },
      }),
    ],
    session: {
      strategy: "jwt",
      maxAge: 24 * 60 * 60, // 24 timmar
    },
    jwt: {
      maxAge: 24 * 60 * 60,
    },
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60,
        },
      },
    },
    pages: {
      signIn: "/login",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
        }
        return session;
      },
    },
  };
});
