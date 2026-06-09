"use client";

import { RouteGuard } from "@/components/rbac/route-guard";
import { CustomerAccountsList } from "@/components/accounts/customer-accounts-list";
import { Permissions } from "@/lib/rbac/permissions";

export default function AccountsOverviewPage() {
  return (
    <RouteGuard permissions={[Permissions.AccountReadOwn]}>
      <CustomerAccountsList />
    </RouteGuard>
  );
}
