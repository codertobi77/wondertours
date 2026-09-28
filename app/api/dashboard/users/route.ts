import { z } from "zod";
import { ok, created, parseBody, parseQuery, handleProtectedRoute } from "@/lib/api/utils";
import { listQuerySchema, boolQuery } from "@/lib/api/schemas";
import { listUsers, createUser } from "@/lib/services/users";
import { getAppUrl, sendEmailSafe } from "@/lib/services/mailer";
import { userWelcomeEmail } from "@/lib/services/mail-templates";

const listSchema = listQuerySchema.extend({
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  active: boolQuery,
});

export async function GET(request: Request) {
  return handleProtectedRoute(request, async (_session) => {
    const [query, errorResponse] = parseQuery(request, listSchema);
    if (errorResponse) return errorResponse;

    const result = await listUsers({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      role: query.role,
      active: query.active,
    });
    return ok(result);
  }, { roles: ["admin"] });
}

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
  isActive: z.coerce.boolean().default(true),
});

export async function POST(request: Request) {
  return handleProtectedRoute(request, async (_session) => {
    const [body, errorResponse] = await parseBody(request, createSchema);
    if (errorResponse) return errorResponse;

    const user = await createUser(body);

    // Email de bienvenue best effort (sendEmailSafe) — sans mot de passe
    // en clair : l'utilisateur le reçoit de l'admin ou passe par « mot de
    // passe oublié » pour en définir un nouveau.
    const appUrl = getAppUrl();
    await sendEmailSafe({
      to: user.email,
      ...userWelcomeEmail({
        name: user.firstName,
        email: user.email,
        role: user.role,
        dashboardUrl: `${appUrl}/dashboard`,
        forgotPasswordUrl: `${appUrl}/dashboard/forgot-password`,
      }),
    });

    return created(user);
  }, { roles: ["admin"] });
}
