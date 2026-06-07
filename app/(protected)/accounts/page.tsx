"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { RouteGuard } from "@/components/rbac/route-guard";
import { Permissions } from "@/lib/rbac/permissions";
import { customerAccountsApi } from "@/lib/api/modules/customer-accounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AccountsOverviewPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["customer", "accounts"],
    queryFn: customerAccountsApi.listOwnAccounts,
  });

  return (
    <RouteGuard permissions={[Permissions.AccountRead]} mode="any">
      <div className="space-y-6">
        <PageHeader
          title="My Accounts"
          description="Overview of your accounts and available balances."
        />
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="pt-6 text-sm text-destructive">
              Failed to load your accounts. Please try again.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data?.length ? (
              data.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{account.displayName}</CardTitle>
                    <CardDescription>{account.accountNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Available balance</span>
                      <span className="font-semibold">
                        {account.currency} {account.availableBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline">{account.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No accounts are currently available for your profile.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
