import { UserForm } from "@/components/dashboard/forms/user-form";

/**
 * Gestion des comptes : admin uniquement. La garde client du layout
 * dashboard redirige déjà les non-admins hors de /dashboard/users*, et
 * l'API PHP répond 403 aux rôles non autorisés — pas de contrôle serveur
 * nécessaire (le build statique ne le permet pas de toute façon).
 */
export default function NewUserPage() {
  return <UserForm />;
}
