import { notFound, redirect } from "next/navigation";
import { getUserById } from "@/lib/services/users";
import { getSession } from "@/lib/session";
import { UserForm } from "@/components/dashboard/forms/user-form";

export const dynamic = "force-dynamic";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

/** Édition d'un compte utilisateur : admin uniquement (double contrôle serveur). */
export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  return (
    <UserForm
      initial={{
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      }}
    />
  );
}
