import { auth } from "./auth";
import { cookies, headers } from "next/headers";

async function buildAuthHeaders(): Promise<Headers> {
  const incomingHeaders = await headers();
  const cookieStore = await cookies();

  // Conserver les headers d'origine pour garder le contexte proxy/origin.
  const authHeaders = new Headers(incomingHeaders);

  // Si le header cookie est absent, le reconstruire depuis next/headers().cookies().
  if (!authHeaders.get("cookie")) {
    const cookieHeaderFromStore = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    if (cookieHeaderFromStore) {
      authHeaders.set("cookie", cookieHeaderFromStore);
    }
  }

  return authHeaders;
}

export class AuthRequiredError extends Error {
  constructor(message = "Session expirée. Merci de vous reconnecter.") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export const getUser = async () => {
  try {
    const authHeaders = await buildAuthHeaders();

    const session = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!session) {
      const hasCookieHeader = Boolean(authHeaders.get("cookie"));
      console.warn(
        `[getUser] No session found (cookie header present: ${hasCookieHeader})`,
      );
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

export const requireUser = async () => {
  const user = await getUser();

  if (!user) {
    throw new AuthRequiredError();
  }

  return user;
};
