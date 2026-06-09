"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { CopyableUuid } from "@/components/data/copyable-uuid";
import { StatusBadge } from "@/components/data/status-badge";
import { Pagination } from "@/components/data/pagination";
import { RouteGuard } from "@/components/rbac/route-guard";
import { describeApiError } from "@/lib/api/errors";
import { customerAccountsApi } from "@/lib/api/modules/customer-accounts";
import {
  customerTransactionsApi,
  type AccountTransactionType,
} from "@/lib/api/modules/customer-transactions";
import { Permissions } from "@/lib/rbac/permissions";

const TRANSACTION_TYPES: AccountTransactionType[] = [
  "DEPOSIT",
  "WITHDRAWAL",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "FEE",
  "INTEREST_CREDIT",
  "INTEREST_CHARGE",
  "ADJUSTMENT",
];

const STATUSES = ["PENDING", "POSTED"] as const;

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isoStartOfDay(yyyyMmDd: string): string {
  return `${yyyyMmDd}T00:00:00`;
}

function isoEndOfDay(yyyyMmDd: string): string {
  return `${yyyyMmDd}T23:59:59`;
}

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(v: string | number | undefined, currency: string): string {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}

function formatTransactionType(type: string): string {
  return type.replace(/_/g, " ");
}

export function CustomerTransactionsPage() {
  return (
    <RouteGuard permissions={[Permissions.AccountReadOwn]}>
      <CustomerTransactionsContent />
    </RouteGuard>
  );
}

function CustomerTransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialAccountId = React.useMemo(() => {
    const raw = searchParams.get("accountId") ?? "";
    return UUID_RX.test(raw) ? raw : "";
  }, [searchParams]);

  const [fromDate, setFromDate] = React.useState(defaultFromDate());
  const [toDate, setToDate] = React.useState(defaultToDate());
  const [accountId, setAccountId] = React.useState(initialAccountId);
  const [transactionType, setTransactionType] = React.useState<AccountTransactionType | "">("");
  const [status, setStatus] = React.useState<string>("");
  const [searchText, setSearchText] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(0);

  React.useEffect(() => {
    setAccountId(initialAccountId);
  }, [initialAccountId]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchText.trim()), 320);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const accountsQuery = useQuery({
    queryKey: ["customer", "accounts"],
    queryFn: () => customerAccountsApi.listOwnAccounts(),
  });

  const listQuery = useQuery({
    queryKey: [
      "customer",
      "transactions",
      fromDate,
      toDate,
      accountId,
      transactionType,
      status,
      debouncedSearch,
      page,
    ],
    queryFn: () =>
      customerTransactionsApi.searchOwn(
        {
          fromDate: isoStartOfDay(fromDate),
          toDate: isoEndOfDay(toDate),
          accountId: accountId || undefined,
          transactionType: transactionType || undefined,
          status: status || undefined,
          search: debouncedSearch || undefined,
        },
        { page, size: 20 },
      ),
    enabled: Boolean(fromDate) && Boolean(toDate),
  });

  const syncAccountIdToUrl = React.useCallback(
    (nextAccountId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextAccountId) {
        params.set("accountId", nextAccountId);
      } else {
        params.delete("accountId");
      }
      const qs = params.toString();
      router.replace(qs ? `/transactions?${qs}` : "/transactions", { scroll: false });
    },
    [router, searchParams],
  );

  const onAccountFilterChange = (value: string) => {
    const next = value === "__all__" ? "" : value;
    setPage(0);
    setAccountId(next);
    syncAccountIdToUrl(next);
  };

  const onClearFilters = () => {
    setFromDate(defaultFromDate());
    setToDate(defaultToDate());
    setSearchText("");
    setDebouncedSearch("");
    setTransactionType("");
    setStatus("");
    setPage(0);
    setAccountId("");
    syncAccountIdToUrl("");
  };

  const hasFilters =
    Boolean(accountId) ||
    Boolean(transactionType) ||
    Boolean(status) ||
    Boolean(debouncedSearch) ||
    fromDate !== defaultFromDate() ||
    toDate !== defaultToDate();

  const rows = listQuery.data?.content ?? [];
  const totalPages = listQuery.data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="All transactions"
        description="Search and filter account activity across your products."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Date range is required. Narrow by account, type, status, or description/reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateRangeFilter
            startDate={fromDate}
            endDate={toDate}
            startLabel="From"
            endLabel="To"
            onChange={({ startDate, endDate }) => {
              setPage(0);
              setFromDate(startDate);
              setToDate(endDate);
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="tx-account-filter">Account</Label>
              <Select
                value={accountId || "__all__"}
                onValueChange={onAccountFilterChange}
                disabled={accountsQuery.isLoading}
              >
                <SelectTrigger id="tx-account-filter">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All accounts</SelectItem>
                  {(accountsQuery.data ?? []).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.displayName ?? account.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tx-type-filter">Type</Label>
              <Select
                value={transactionType || "__all__"}
                onValueChange={(v) => {
                  setPage(0);
                  setTransactionType(v === "__all__" ? "" : (v as AccountTransactionType));
                }}
              >
                <SelectTrigger id="tx-type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatTransactionType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tx-status-filter">Status</Label>
              <Select
                value={status || "__all__"}
                onValueChange={(v) => {
                  setPage(0);
                  setStatus(v === "__all__" ? "" : v);
                }}
              >
                <SelectTrigger id="tx-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tx-search">Search</Label>
              <Input
                id="tx-search"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(0);
                }}
                placeholder="Description or reference…"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" disabled={!hasFilters} onClick={onClearFilters}>
              Clear filters
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => listQuery.refetch()}
              aria-label="Refresh"
            >
              <RefreshCw className={listQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Sorted by transaction date, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : listQuery.isError ? (
            <EmptyState
              title="Failed to load transactions"
              description={describeApiError(listQuery.error)}
              action={
                <Button type="button" variant="outline" onClick={() => listQuery.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description="Try adjusting the date range or filters."
              action={
                hasFilters ? (
                  <Button type="button" variant="outline" onClick={onClearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UUID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <CopyableUuid value={tx.id} />
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {tx.transactionDate
                          ? tx.transactionDate.replace("T", " ").slice(0, 19)
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.accountNumber ?? tx.accountId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate text-xs">
                        {tx.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatTransactionType(tx.transactionType)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatMoney(tx.amount, tx.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.direction === "CREDIT" ? "success" : "outline"}>
                          {tx.direction ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tx.status ?? "—"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={listQuery.data?.number ?? page}
                totalPages={totalPages}
                totalElements={listQuery.data?.totalElements}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
