import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { resend } from "./resend";

function normalizeOrigin(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

const configuredBaseURL =
  process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

const isProduction = process.env.NODE_ENV === "production";

const trustedOrigins = Array.from(
  new Set(
    [
      configuredBaseURL,
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      process.env.SITE_URL,
      "http://localhost:3000",
      "http://localhost:3001",
    ]
      .map(normalizeOrigin)
      .filter((origin): origin is string => Boolean(origin)),
  ),
);

export const auth = betterAuth({
  baseURL: configuredBaseURL,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  advanced: {
    // ✅ useSecureCookies seulement en prod — en local (HTTP) ça bloque tout
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data) {
      try {
        await resend.emails.send({
          from: "contact@arnaudgct.fr",
          to: data.user.email,
          subject: "Password Reset",
          text: `Reset your password: ${data.url}`,
        });
      } catch (error) {
        console.error("Error sending reset password email:", error);
        throw error;
      }
    },
  },
  // ✅ nextCookies() supprimé — il ne sert à rien dans le middleware
  //    et peut interférer avec le naming des cookies
  plugins: [],
});
