import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { query, initDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Initialize database on startup
initDb();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock_client_secret",
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

        try {
          const users = await query('SELECT * FROM users WHERE email = ?', [credentials.email]) as any[];
          const user = users && users.length > 0 ? users[0] : null;

          if (!user || !user.password) {
            throw new Error("No account found with this email");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) throw new Error("Invalid password");

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: null,
          };
        } catch (error: any) {
          throw new Error(error.message || "Login failed");
        }
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

        try {
          const users = await query('SELECT * FROM users WHERE phone = ?', [credentials.phone]) as any[];
          let user = users && users.length > 0 ? users[0] : null;

          if (!user) {
            const id = crypto.randomUUID();
            const name = `User (${credentials.phone})`;
            await query('INSERT INTO users (id, name, phone, orders_placed) VALUES (?, ?, ?, 0)', [id, name, credentials.phone]);
            user = { id, name, phone: credentials.phone };
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email || null,
            image: null,
          };
        } catch (error: any) {
          throw new Error(error.message || "Login failed");
        }
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
