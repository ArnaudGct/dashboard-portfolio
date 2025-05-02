import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { resend } from "./resend";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql", // or "mysql", "postgresql", ...etc
  }),
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
