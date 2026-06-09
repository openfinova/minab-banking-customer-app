"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Receipt } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { CopyableUuid } from "@/components/data/copyable-uuid";
import { StatusBadge } from "@/components/data/status-badge";
import { Pagination } from "@/components/data/pagination";
import {
  customerAccountsApi,
  type AccountProductType,
  type AccountResponse,
  type AccountStatus,
} from "@/lib/api/modules/customer-accounts";
import {
  filterAccounts,
  type AccountSortOption,
} from "@/lib/accounts/filter-accounts";

const PRODUCT_TYPES: Array<AccountProductType | ""> = [
  "",
  "CHECKING",
  "SAVINGS",
  "MONEY_MARKET",
  "CERTIFICATE_OF_DEPOSIT",
  "CREDIT_LINE",
  "INVESTMENT",
];

const STATUSES: Array<AccountStatus | ""> = [
  "",
  "ACTIVE",
  "SUSPENDED",
  "FROZEN",
  "CLOSED",
  "DORMANT",
];

const SORT_OPTIONS: { label: string; value: AccountSortOption }[] = [
  { label: "Newest first", value: "createdAt,desc" },
  { label: "Oldest first", value: "createdAt,asc" },
  { label: "Account number A→Z", value: "accountNumber,asc" },
  { label: "Account number Z→A", value: "accountNumber,desc" },
];

function formatMoney(v: string | number | undefined, currency: string): string {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}

function formatProductType(productType: AccountProductType): string {
  return productType.replace(/_/g, " ");
}

export function CustomerAccountsList() {
  const [searchText, setSearchText] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [productType, setProductType] = React.useState<AccountProductType | "">("");
  const [status, setStatus] = React.useState<AccountStatus | "">("");
  const [sort, setSort] = React.useState<AccountSortOption>("createdAt,desc");
  const [page, setPage] = React.useState(0);
  const size = 20;

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchText.trim()), 320);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["customer", "accounts"],
    queryFn: () => customerAccountsApi.listOwnAccounts(),
  });

  const filtered = React.useMemo(
    () =>
      filterAccounts(data ?? [], {
        search: debouncedSearch,
        productType,
        status,
        sort,
        page,
        size,
      }),
    [data, debouncedSearch, productType, status, sort, page, size],
  );

  const hasFilters = Boolean(debouncedSearch) || Boolean(productType) || Boolean(status);

  const onClearFilters = () => {
    setSearchText("");
    setDebouncedSearch("");
    setProductType("");
    setStatus("");
    setSort("createdAt,desc");
    setPage(0);
  };

  const empty = !isLoading && !isError && (data?.length ?? 0) === 0;
  const noMatches = !isLoading && !isError && (data?.length ?? 0) > 0 && filtered.totalElements === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Accounts"
        description="View and search your deposit accounts, balances, and status."
      />

      <div className="grid max-w-3xl gap-1.5">
        <Label htmlFor="account-search">Search</Label>
        <Input
          id="account-search"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(0);
          }}
          placeholder="Account number, display name, or IBAN…"
          autoComplete="off"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div>
            <CardTitle>Your accounts</CardTitle>
            <CardDescription>
              Filter by product type or status. Search matches account number, name, and IBAN.
            </CardDescription>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="product-type-filter">Product type</Label>
              <Select
                value={productType || "__all__"}
                onValueChange={(v) => {
                  setPage(0);
                  setProductType(v === "__all__" ? "" : (v as AccountProductType));
                }}
              >
                <SelectTrigger id="product-type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  {PRODUCT_TYPES.filter(Boolean).map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatProductType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={status || "__all__"}
                onValueChange={(v) => {
                  setPage(0);
                  setStatus(v === "__all__" ? "" : (v as AccountStatus));
                }}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  {STATUSES.filter(Boolean).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sort-filter">Sort</Label>
              <Select
                value={sort}
                onValueChange={(v) => {
                  setPage(0);
                  setSort(v as AccountSortOption);
                }}
              >
                <SelectTrigger id="sort-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={!hasFilters && sort === "createdAt,desc"}
                onClick={onClearFilters}
              >
                Clear filters
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                aria-label="Refresh"
              >
                <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Failed to load accounts"
              description="We could not retrieve your accounts. Please try again."
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : empty ? (
            <EmptyState
              title="No accounts"
              description="No accounts are currently linked to your profile."
            />
          ) : noMatches ? (
            <EmptyState
              title="No matching accounts"
              description="Try adjusting your search or filters."
              action={
                <Button type="button" variant="outline" onClick={onClearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <AccountsTable rows={filtered.content} />
              <Pagination
                page={filtered.page}
                totalPages={filtered.totalPages}
                totalElements={filtered.totalElements}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccountsTable({ rows }: { rows: AccountResponse[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>UUID</TableHead>
          <TableHead>Display name</TableHead>
          <TableHead>Account number</TableHead>
          <TableHead>Product type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Available balance</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead className="w-[7rem]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((account) => (
          <TableRow key={account.id}>
            <TableCell>
              <CopyableUuid value={account.id} />
            </TableCell>
            <TableCell>{account.displayName ?? "—"}</TableCell>
            <TableCell className="font-mono text-xs">{account.accountNumber}</TableCell>
            <TableCell>{formatProductType(account.productType)}</TableCell>
            <TableCell>
              <StatusBadge status={account.status} />
            </TableCell>
            <TableCell className="text-right">
              {formatMoney(account.availableBalance, account.currency)}
            </TableCell>
            <TableCell>{account.currency}</TableCell>
            <TableCell>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href={`/transactions?accountId=${account.id}`}>
                  <Receipt className="mr-1 h-3.5 w-3.5" />
                  Transactions
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
