import { beforeAll, describe, expect, test } from "bun:test";
import { SignJWT } from "jose";
import {
  createSessionToken,
  getSessionTokenFromRequest,
  isSessionPayload,
  SESSION_COOKIE_NAME,
  setSessionCookie,
  toSession,
  unsetSessionCookie,
  verifySessionToken,
} from "@/lib/auth";

// Le secret est résolu paresseusement par lib/auth.ts (au premier sign/
// verify) : Bun charge .env automatiquement, ce fallback couvre les
// exécutions sans .env.
beforeAll(() => {
  process.env.AUTH_SECRET ??= "secret-de-test-wondertours";
});

const PAYLOAD = {
  sub: "00000000-0000-0000-0000-000000000001",
  email: "admin@wondertoursandservices.com",
  role: "admin",
  name: "Admin Wonder Tours",
};

describe("auth", () => {
  test("aller-retour createSessionToken → verifySessionToken → toSession", async () => {
    const token = await createSessionToken(PAYLOAD);
    expect(typeof token).toBe("string");

    const payload = await verifySessionToken(token);
    expect(payload?.sub).toBe(PAYLOAD.sub);
    expect(payload?.email).toBe(PAYLOAD.email);
    expect(payload?.role).toBe("admin");
    expect(payload?.name).toBe(PAYLOAD.name);

    const session = toSession(payload);
    expect(session).toEqual({
      sub: PAYLOAD.sub,
      email: PAYLOAD.email,
      role: "admin",
      name: PAYLOAD.name,
    });
  });

  test("token signé avec un autre secret → refusé", async () => {
    const forged = await new SignJWT(PAYLOAD)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode("autre-secret"));
    expect(await verifySessionToken(forged)).toBeNull();
  });

  test("token expiré → refusé", async () => {
    const expired = await new SignJWT(PAYLOAD)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
    expect(await verifySessionToken(expired)).toBeNull();
  });

  test("token trafiqué → refusé", async () => {
    const token = await createSessionToken(PAYLOAD);
    expect(await verifySessionToken(`${token}x`)).toBeNull();
  });

  test("toSession : validation stricte du payload (rôles connus uniquement)", () => {
    expect(toSession(null)).toBeNull();
    expect(toSession({})).toBeNull();
    // sub manquant
    expect(toSession({ email: "a@b.cd", role: "admin" })).toBeNull();
    // email manquant
    expect(toSession({ sub: "uuid", role: "admin" })).toBeNull();
    // rôle inconnu
    expect(toSession({ sub: "uuid", email: "a@b.cd", role: "superadmin" })).toBeNull();

    const session = toSession({ sub: "uuid", email: "a@b.cd", role: "editor" });
    expect(session).toEqual({ sub: "uuid", email: "a@b.cd", role: "editor" });

    expect(isSessionPayload({ sub: "uuid", email: "a@b.cd", role: "viewer" })).toBe(true);
    expect(isSessionPayload({ sub: "uuid", email: "a@b.cd", role: "nope" })).toBe(false);
    expect(isSessionPayload(null)).toBe(false);
  });

  test("cookies de session : pose (httpOnly, 7 jours) et suppression", () => {
    const token = "abc.def.ghi";
    const headers = new Headers();
    setSessionCookie(headers, token);
    const cookie = headers.get("set-cookie");
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=${token}`);
    expect(cookie).toContain("httpOnly");
    expect(cookie).toContain("path=/");
    expect(cookie).toContain("maxAge=604800");

    const cleared = new Headers();
    unsetSessionCookie(cleared);
    const deletion = cleared.get("set-cookie");
    expect(deletion).toContain(`${SESSION_COOKIE_NAME}=deleted`);
    expect(deletion).toContain("Max-Age=0");
  });

  test("getSessionTokenFromRequest : extraction depuis l'en-tête cookie", () => {
    const request = new Request("http://localhost/api/x", {
      headers: { cookie: "autre=valeur; wt_session=tok.ken; fin=1" },
    });
    expect(getSessionTokenFromRequest(request)).toBe("tok.ken");
    expect(getSessionTokenFromRequest(new Request("http://localhost/"))).toBeNull();
  });
});
