import { auth } from "./auth";
import { cookies, headers } from "next/headers";

async function buildAuthHeaders(): Promise<Headers> {
  const incomingHeaders = await headers();
  const authHeaders = new Headers(incomingHeaders);

  // Sur certains flux RSC/proxy, le header cookie peut ne pas etre present ici.
  // On le reconstruit depuis le store cookies() de Next.
  if (!authHeaders.get("cookie")) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    if (cookieHeader) {
      authHeaders.set("cookie", cookieHeader);
    }
  }

  return authHeaders;
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
