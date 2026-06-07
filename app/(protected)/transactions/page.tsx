"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { RouteGuard } from "@/components/rbac/route-guard";
import { Permissions } from "@/lib/rbac/permissions";
import { customerTransactionsApi } from "@/lib/api/modules/customer-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["customer", "transactions"],
    queryFn: customerTransactionsApi.listOwnTransactions,
  });

  return (
    <RouteGuard permissions={[Permissions.TransactionRead]}>
      <div className="space-y-6">
        <PageHeader
          title="Transactions"
          description="Recent account activity across your products."
        />
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="pt-6 text-sm text-destructive">
              Failed to load transactions. Please try again.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data?.length ? (
              data.map((tx) => (
                <Card key={tx.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tx.description}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p>{tx.bookingDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold">
                        {tx.currency} {tx.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Direction</p>
                      <Badge variant={tx.direction === "CREDIT" ? "success" : "outline"}>
                        {tx.direction}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="outline">{tx.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No transactions found for your account.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
