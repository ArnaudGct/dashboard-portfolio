import { auth } from "./auth";
import { headers } from "next/headers";

export const getUser = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.warn("[getUser] No session found");
      return undefined;
    }

    if (!session.user) {
      console.warn("[getUser] Session exists but no user");
      return undefined;
    }

    return session.user;
  } catch (error) {
    console.error("[getUser] Error fetching user session:", error);
    return undefined;
  }
};
