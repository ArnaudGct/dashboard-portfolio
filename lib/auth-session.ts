import { auth } from "./auth";
import { cookies, headers } from "next/headers";

function isLocalHost(host: string): boolean {
  return host.includes("localhost") || host.startsWith("127.0.0.1");
}

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

  const forwardedHost = authHeaders.get("x-forwarded-host");
  const host = forwardedHost || authHeaders.get("host") || "";

  if (host) {
    authHeaders.set("host", host);
    authHeaders.set("x-forwarded-host", host);
  }

  const rawProtoHeader = authHeaders.get("x-forwarded-proto") || "";
  const rawProto = rawProtoHeader.split(",")[0]?.trim().toLowerCase();
  const fallbackProto = host && isLocalHost(host) ? "http" : "https";
  const normalizedProto =
    rawProto && !isLocalHost(host) && rawProto === "http"
      ? "https"
      : rawProto || fallbackProto;

  authHeaders.set("x-forwarded-proto", normalizedProto);

  if (host && !authHeaders.get("origin")) {
    authHeaders.set("origin", `${normalizedProto}://${host}`);
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
      const host = authHeaders.get("host") || "unknown";
      const forwardedHost = authHeaders.get("x-forwarded-host") || "none";
      const forwardedProto = authHeaders.get("x-forwarded-proto") || "none";
      const origin = authHeaders.get("origin") || "none";
      console.warn(
        `[getUser] No session found (cookie header present: ${hasCookieHeader}, host: ${host}, x-forwarded-host: ${forwardedHost}, x-forwarded-proto: ${forwardedProto}, origin: ${origin})`,
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
