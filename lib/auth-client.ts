import { createAuthClient } from "better-auth/react";

const publicAuthBaseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

export const authClient = createAuthClient({
  /**
   * Important: same-origin obligatoire ici pour que le cookie de session
   * soit bien emis sur le domaine actuel (ex: dashboard.arnaudgct.fr).
   */
  ...(publicAuthBaseURL ? { baseURL: publicAuthBaseURL } : {}),
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
