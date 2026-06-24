import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const useDB = prisma !== null;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock_client_secret",
      // Skip if no real keys provided
      ...((!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id") 
        ? { authorization: { params: { prompt: "select_account" } } } 
        : {}),
    }),
    CredentialsProvider({
      id: "email-login",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        // If no DB, use a mock user for dev purposes
        if (!useDB) {
          if (credentials.password === "password123") {
            return {
              id: "mock-user-1",
              name: credentials.email.split("@")[0],
              email: credentials.email,
              image: null,
            };
          }
          throw new Error("Wrong password. (Dev mode: use 'password123')");
        }

        const user = await (prisma as any).user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return user;
      },
    }),
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone Number", type: "text", placeholder: "+91XXXXXXXXXX" },
        otp: { label: "OTP Code", type: "text", placeholder: "123456" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error("Missing phone or OTP");
        }

        // Dev: accept "123456" as valid OTP for any number
        if (credentials.otp !== "123456") {
          throw new Error("Invalid OTP. (Dev mode: use '123456')");
        }

        if (!useDB) {
          return {
            id: `phone-${credentials.phone}`,
            name: `User (${credentials.phone})`,
            email: null,
            image: null,
          };
        }

        let user = await (prisma as any).user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) {
          user = await (prisma as any).user.create({
            data: { phone: credentials.phone, name: `User (${credentials.phone})` },
          });
        }

        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "dev_secret_aether_audio_12345",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
