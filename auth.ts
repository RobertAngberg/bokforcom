import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { Pool } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const { auth, handlers, signIn, signOut } = NextAuth(() => {
  return {
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
    session: {
      strategy: "jwt",
      maxAge: 24 * 60 * 60,
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
      async signIn({ user, account, profile }) {
        // Spara OAuth-användare i databasen
        if (account?.provider === "google" || account?.provider === "facebook") {
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });

          try {
            // Kolla om användaren redan finns
            const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [
              user.email,
            ]);

            if (existingUser.rows.length === 0) {
              // Skapa ny användare för OAuth
              const newUser = await pool.query(
                "INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id",
                [user.email, user.name, "oauth_user"] // Dummy password för OAuth
              );

              user.id = newUser.rows[0].id.toString();
              console.log(`✅ Ny ${account.provider} användare skapad:`, user.email);
            } else {
              user.id = existingUser.rows[0].id.toString();
              console.log(`✅ Befintlig användare inloggad via ${account.provider}:`, user.email);
            }

            // Spara account info (valfritt) - använd try/catch så det inte blockerar
            try {
              await pool.query(
                `INSERT INTO accounts (user_id, type, provider, "providerAccountId") 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (provider, "providerAccountId") DO NOTHING`,
                [user.id, account.type, account.provider, account.providerAccountId]
              );
              console.log(`✅ Account info sparad för ${account.provider}`);
            } catch (accountError) {
              console.warn(
                "⚠️ Kunde inte spara account info (men fortsätter):",
                (accountError as Error).message
              );
            }
          } catch (error) {
            console.error("Error saving OAuth user:", error);
            return false; // Blockera inloggning vid fel
          }
        }

        return true;
      },
      async jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        if (account) {
          token.provider = account.provider;
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
