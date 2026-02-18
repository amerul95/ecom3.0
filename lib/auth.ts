import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
// @ts-ignore - PrismaAdapter types may not be available but package is installed
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Auth: Missing email or password");
          return null;
        }

        try {
          const validated = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email: validated.email },
          });

          if (!user) {
            console.log(`❌ Auth: User not found: ${validated.email}`);
            return null;
          }

          if (!user.password) {
            console.log(`❌ Auth: User has no password set: ${validated.email}`);
            return null;
          }

          const isValid = await bcrypt.compare(validated.password, user.password);
          if (!isValid) {
            console.log(`❌ Auth: Invalid password for: ${validated.email}`);
            return null;
          }

          console.log(`✅ Auth: Successful login for ${validated.email} (${user.role})`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          } as any;
        } catch (error) {
          console.error("❌ Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          token.role = dbUser?.role || "BUYER";
        } else {
          token.role = (user as any).role || "BUYER";
        }
      }

      const isEdge = process.env.NEXT_RUNTIME === "edge";
      if (!isEdge && token.id && token.email) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, role: true, email: true },
          });

          if (!dbUser && token.email) {
            dbUser = await prisma.user.findUnique({
              where: { email: token.email as string },
              select: { id: true, role: true, email: true },
            });

            if (dbUser) {
              token.id = dbUser.id;
            }
          }

          if (dbUser) {
            token.role = dbUser.role;
          } else {
            console.warn("User not found in database, invalidating token");
            const tokenAny = token as any;
            tokenAny.id = undefined;
            tokenAny.email = undefined;
            tokenAny.role = undefined;
          }
        } catch (error) {
          console.error("Error refreshing user role in JWT:", error);
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as "BUYER" | "ADMIN";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
