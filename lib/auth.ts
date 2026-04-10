import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { resend } from "./resend";
import { nextCookies } from "better-auth/next-js";

function normalizeOrigin(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

const configuredBaseURL =
  process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

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
  // Important en production derriere un reverse proxy: URL canonique pour les cookies/session.
  baseURL: configuredBaseURL,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "mysql", // or "mysql", "postgresql", ...etc
  }),
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data) {
      console.log("Reset password data:", data);
      try {
        await resend.emails.send({
          from: "contact@arnaudgct.fr",
          to: data.user.email,
          subject: "Password Reset",
          text: `Reset your password by clicking this link: ${data.url}`,
        });
      } catch (error) {
        console.error("Error sending reset password email:", error);
        throw error;
      }
    },
  },
  plugins: [nextCookies()],
});
