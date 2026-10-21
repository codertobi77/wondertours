import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UserForm } from "@/components/dashboard/forms/user-form";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  // Gestion des comptes : admin uniquement, comme la page de liste
  // (proxy.ts est la première ligne de défense).
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  return <UserForm />;
}
