import { APP_ROLES, type AppRole, type AppUser } from "@/lib/types/app";

export const hasRole = (user: AppUser, role: AppRole): boolean => user.roles.includes(role);

export const hasAnyRole = (user: AppUser, roles: AppRole[]): boolean =>
  roles.some((role) => user.roles.includes(role));

export const normalizeRoles = (roles: string[]): AppRole[] => {
  const mapped = roles
    .map((role) => APP_ROLES.find((allowedRole) => allowedRole.toLowerCase() === role.toLowerCase()))
    .filter((role): role is AppRole => Boolean(role));

  return mapped.length ? Array.from(new Set(mapped)) : ["UsuarioFinal"];
};

export const canAccessSede = (user: AppUser, sedeId: string): boolean => {
  if (user.sedeIds.includes("*")) return true;
  return user.sedeIds.includes(sedeId);
};

export const scopeBySede = <T extends { sedeId: string }>(items: T[], user: AppUser): T[] => {
  if (user.sedeIds.includes("*")) return items;
  const allowed = new Set(user.sedeIds);
  return items.filter((item) => allowed.has(item.sedeId));
};
