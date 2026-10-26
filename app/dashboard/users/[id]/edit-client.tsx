"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api-client";
import { UserForm } from "@/components/dashboard/forms/user-form";
import { ErrorBlock, LoadingBlock, MissingBlock } from "@/components/dashboard/api-state";
import type { ApiUser } from "@/lib/api-types";

/**
 * Édition d'un compte utilisateur : admin uniquement. La garde client du
 * layout dashboard redirige déjà les non-admins hors de /dashboard/users*,
 * et l'API PHP répond 403 aux rôles non autorisés.
 */
export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: user,
    error,
    loading,
    status,
  } = useApiData<ApiUser>(`/api/dashboard/users/${id}`);

  if (loading) return <LoadingBlock />;
  if (error) {
    if (status === 404) return <MissingBlock label="Utilisateur" />;
    return <ErrorBlock message={error} />;
  }
  if (!user) return <LoadingBlock />;

  return (
    <UserForm
      initial={{
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        role: user.role,
        isActive: user.isActive,
      }}
    />
  );
}
