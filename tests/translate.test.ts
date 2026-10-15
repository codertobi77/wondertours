import { beforeAll, describe, expect, test } from "bun:test";
import { POST } from "@/app/api/dashboard/translate/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

// Même convention que tests/auth.test.ts : le secret est résolu
// paresseusement par lib/auth.ts ; fallback pour les runs sans .env.
beforeAll(() => {
  process.env.AUTH_SECRET ??= "secret-de-test-wondertours";
  // Les tests ne doivent jamais appeler l'API DeepL réelle : on teste
  // uniquement les gardes (401/403/400 et 503 « non configuré »).
  delete process.env.DEEPL_API_KEY;
});

const URL = "http://localhost/api/dashboard/translate";

async function authedRequest(
  body: unknown,
  role: "admin" | "editor" | "viewer" = "admin"
): Promise<Request> {
  const token = await createSessionToken({
    sub: "00000000-0000-0000-0000-000000000001",
    email: "test@wondertoursandservices.com",
    role,
    name: "Test",
  });
  return new Request(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/dashboard/translate", () => {
  test("sans session → 401", async () => {
    const response = await POST(
      new Request(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: { title: "Bonjour" },
          targetLocale: "en",
        }),
      })
    );
    expect(response.status).toBe(401);
  });

  test("viewer (rôle insuffisant) → 403", async () => {
    const response = await POST(
      await authedRequest(
        { texts: { title: "Bonjour" }, targetLocale: "en" },
        "viewer"
      )
    );
    expect(response.status).toBe(403);
  });

  test("corps invalide (texts vide) → 400", async () => {
    const response = await POST(
      await authedRequest({ texts: {}, targetLocale: "en" })
    );
    expect(response.status).toBe(400);
  });

  test("targetLocale inconnu → 400", async () => {
    const response = await POST(
      await authedRequest({ texts: { title: "Bonjour" }, targetLocale: "de" })
    );
    expect(response.status).toBe(400);
  });

  test("admin sans DEEPL_API_KEY → 503 avec message", async () => {
    const response = await POST(
      await authedRequest({ texts: { title: "Bonjour" }, targetLocale: "en" })
    );
    expect(response.status).toBe(503);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toContain("DeepL");
  });

  test("editor (rôle autorisé) : même garde 503 sans clé", async () => {
    const response = await POST(
      await authedRequest(
        { texts: { text: "Salut le monde" }, targetLocale: "en" },
        "editor"
      )
    );
    expect(response.status).toBe(503);
  });
});
