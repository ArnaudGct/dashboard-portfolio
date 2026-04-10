import { createAuthClient } from "better-auth/react";

const portfolioUrl =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.BETTER_AUTH_URL ||
  undefined;

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: portfolioUrl,
});

export const { signIn, signUp, signOut, useSession } = authClient;
