import { auth } from "./auth";
import { cookies, headers } from "next/headers";

async function buildAuthHeaders(): Promise<Headers> {
  const incomingHeaders = await headers();
  const cookieStore = await cookies();

  // Construction minimale et deterministe: cookie + host/proto utiles.
  const authHeaders = new Headers();

  const cookieHeaderFromStore = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const cookieHeader = cookieHeaderFromStore || incomingHeaders.get("cookie");

  if (cookieHeader) {
    authHeaders.set("cookie", cookieHeader);
  }

  const host =
    incomingHeaders.get("x-forwarded-host") || incomingHeaders.get("host");
  if (host) {
    authHeaders.set("host", host);
  }

  const proto = incomingHeaders.get("x-forwarded-proto") || "https";
  authHeaders.set("x-forwarded-proto", proto);

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
