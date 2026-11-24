import { prisma, Prisma, type User } from "@/lib/db";
import bcrypt from "bcryptjs";

/** User sans le hash de mot de passe — ne jamais exposer passwordHash. */
export type PublicUser = Omit<User, "passwordHash">;

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
} satisfies Prisma.UserSelect;

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export interface UserListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: User["role"];
  active?: boolean;
}

export async function listUsers(
  filters: UserListFilters = {}
): Promise<{ items: PublicUser[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.UserWhereInput = {
    ...(filters.role && { role: filters.role }),
    ...(filters.active !== undefined && { isActive: filters.active }),
    ...(filters.q && {
      OR: [
        { email: { contains: filters.q } },
        { firstName: { contains: filters.q } },
        { lastName: { contains: filters.q } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toPublicUser(user) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: User["role"];
  isActive?: boolean;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? "editor",
      isActive: input.isActive ?? true,
    },
  });
  return toPublicUser(user);
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: User["role"];
  isActive?: boolean;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<PublicUser> {
  const { password, ...rest } = input;
  const data: Prisma.UserUpdateInput = { ...rest };
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  const user = await prisma.user.update({ where: { id }, data });
  return toPublicUser(user);
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

/** Marque la dernière connexion (appelé par /api/auth/login). */
export async function markUserLoggedIn(id: string): Promise<void> {
  await prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

/** Vérifie un mot de passe pour un email donné (utilisé par /api/auth/login). */
export async function verifyUserPassword(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.isActive) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return toPublicUser(user);
}
