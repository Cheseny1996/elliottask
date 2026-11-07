export const adminRoles = [
  "editorial",
  "hr",
  "matching",
  "project_manager",
  "operations",
  "finance",
  "support",
] as const;

export type AdminRole = "super_admin" | (typeof adminRoles)[number];
export type AdminPermission =
  | "articles_read"
  | "articles_write"
  | "articles_publish"
  | "articles_delete"
  | "opportunities_read"
  | "opportunities_write"
  | "opportunities_publish"
  | "opportunities_delete"
  | "inquiries_read"
  | "inquiries_manage"
  | "staff_manage"
  | "matches_read"
  | "matches_manage"
  | "matches_invite"
  | "analytics_read";

export const adminRoleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  editorial: "Editorial",
  hr: "Human Resources",
  matching: "Talent Matching",
  project_manager: "Project Manager",
  operations: "Operations",
  finance: "Finance",
  support: "Support",
};

const rolePermissions: Record<Exclude<AdminRole, "super_admin">, readonly AdminPermission[]> = {
  editorial: ["articles_read", "articles_write"],
  hr: ["opportunities_read", "opportunities_write"],
  matching: ["opportunities_read", "matches_read", "matches_manage"],
  project_manager: ["opportunities_read", "matches_read", "matches_invite"],
  operations: ["inquiries_read", "inquiries_manage", "opportunities_read"],
  finance: [],
  support: ["inquiries_read", "inquiries_manage"],
};

export function hasAdminPermission(role: AdminRole, permission: AdminPermission) {
  if (role === "super_admin") return true;
  return rolePermissions[role].includes(permission);
}

export function permissionsForAdminRole(role: AdminRole): AdminPermission[] {
  if (role === "super_admin") {
    return [
      "articles_read",
      "articles_write",
      "articles_publish",
      "articles_delete",
      "opportunities_read",
      "opportunities_write",
      "opportunities_publish",
      "opportunities_delete",
      "inquiries_read",
      "inquiries_manage",
      "staff_manage",
      "matches_read",
      "matches_manage",
      "matches_invite",
      "analytics_read",
    ];
  }
  return [...rolePermissions[role]];
}
