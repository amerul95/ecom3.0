import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  trustHost: true, // Trust localhost and other hosts in development
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
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
          
          // Authenticate against unified User table (all roles: BUYER, SELLER, ADMIN)
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
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        // Check if BUYER with this email exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user with Google account as BUYER
          // Sellers should use /seller/signup to get SELLER account
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
    async jwt({ token, user, account }) {
      // On sign-in, set user ID, email, and role
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // Get role from database for OAuth users
        if (account?.provider === "google") {
          // For Google OAuth, check if user exists, default to BUYER
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          token.role = dbUser?.role || "BUYER";
        } else {
          token.role = (user as any).role || "BUYER";
        }
      }
      
      // On subsequent requests, refresh role from database
      // This handles cases where user ID might be stale after DB reset
      if (token.id && token.email) {
        try {
          // Try to find user by ID first
          let dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, role: true, email: true },
          });
          
          // If user not found by ID (stale session after DB reset), try by email
          if (!dbUser && token.email) {
            dbUser = await prisma.user.findUnique({
              where: { email: token.email as string },
              select: { id: true, role: true, email: true },
            });
            
            // Update token ID to match database if found by email
            if (dbUser) {
              token.id = dbUser.id;
            }
          }
          
          // Update role from database
          if (dbUser) {
            token.role = dbUser.role;
          } else {
            // User not found - invalidate token by clearing it
            console.warn("User not found in database, invalidating token");
            token.id = undefined;
            token.email = undefined;
            token.role = undefined;
          }
        } catch (error) {
          console.error("Error refreshing user role in JWT:", error);
          // Keep existing token values on error
        }
      }
      
      return token;
    },
    async session({ session, token }) {
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
});

