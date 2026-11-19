"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { ADMIN_NAV } from "@/config/admin-navigation";
import { ADMIN_ROUTES } from "@/config/routes";
import { useCurrentAdmin, usePermissions } from "../hooks/use-admin-session";

/** The console's landing page: who is signed in and what they can open. */
export function AdminDashboard() {
  const { data } = useCurrentAdmin();
  const permissions = usePermissions();
  if (!data) return null;

  const { admin } = data;
  const firstName = admin.fullName.split(" ")[0] ?? admin.fullName;
  const sections = ADMIN_NAV.filter(
    (item) =>
      item.href !== ADMIN_ROUTES.home &&
      (!item.anyOf || permissions.canAny(item.anyOf)),
  );

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="This is the Adviserz admin console."
      />

      <Card className="flex flex-col gap-5">
        <CardTitle>Your access</CardTitle>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-subtle">
            {admin.isSuperAdmin ? "Account" : "Roles"}
          </p>
          <div className="flex flex-wrap gap-2">
            {admin.isSuperAdmin ? (
              <Badge tone="brand">Super admin</Badge>
            ) : admin.roles.length > 0 ? (
              admin.roles.map((role) => (
                <Badge key={role.id} tone="brand">
                  {role.name}
                </Badge>
              ))
            ) : (
              <Badge>No role yet</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-subtle">Sections</p>
          {sections.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sections.map((item) => (
                <Badge key={item.label}>{item.label}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-base text-muted-foreground">
              You have not been given access to any section yet. Ask the person
              who created your account to assign you a role.
            </p>
          )}
        </div>
      </Card>
    </>
  );
}
