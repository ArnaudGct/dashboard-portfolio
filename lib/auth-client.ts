import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  /**
   * Important: same-origin obligatoire ici pour que le cookie de session
   * soit bien emis sur le domaine actuel (ex: dashboard.arnaudgct.fr).
   */
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
