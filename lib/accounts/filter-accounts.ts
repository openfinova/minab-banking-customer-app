import type {
  AccountProductType,
  AccountResponse,
  AccountStatus,
} from "@/lib/api/modules/accounts";

export type AccountSortOption =
  | "createdAt,desc"
  | "createdAt,asc"
  | "accountNumber,asc"
  | "accountNumber,desc";

export interface AccountFilterCriteria {
  search?: string;
  productType?: AccountProductType | "";
  status?: AccountStatus | "";
  sort?: AccountSortOption;
  page?: number;
  size?: number;
}

export interface FilteredAccountsResult {
  content: AccountResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

function matchesSearch(account: AccountResponse, query: string): boolean {
  const q = query.toLowerCase();
  const fields = [
    account.accountNumber,
    account.displayName,
    account.iban,
  ].filter(Boolean);

  return fields.some((field) => field!.toLowerCase().includes(q));
}

function compareAccounts(a: AccountResponse, b: AccountResponse, sort: AccountSortOption): number {
  switch (sort) {
    case "createdAt,asc": {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return aTime - bTime;
    }
    case "accountNumber,asc":
      return a.accountNumber.localeCompare(b.accountNumber);
    case "accountNumber,desc":
      return b.accountNumber.localeCompare(a.accountNumber);
    case "createdAt,desc":
    default: {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    }
  }
}

/**
 * Applies client-side search, filter, sort, and pagination to a full account list
 * returned by the own-accounts API (no server-side paging on that endpoint).
 */
export function filterAccounts(
  accounts: AccountResponse[],
  criteria: AccountFilterCriteria,
): FilteredAccountsResult {
  const size = criteria.size ?? 20;
  const page = criteria.page ?? 0;
  const sort = criteria.sort ?? "createdAt,desc";
  const search = criteria.search?.trim().toLowerCase() ?? "";

  let filtered = accounts;

  if (search) {
    filtered = filtered.filter((account) => matchesSearch(account, search));
  }

  if (criteria.productType) {
    filtered = filtered.filter((account) => account.productType === criteria.productType);
  }

  if (criteria.status) {
    filtered = filtered.filter((account) => account.status === criteria.status);
  }

  const sorted = [...filtered].sort((a, b) => compareAccounts(a, b, sort));
  const totalElements = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const start = safePage * size;
  const content = sorted.slice(start, start + size);

  return {
    content,
    totalElements,
    totalPages,
    page: safePage,
    size,
  };
}
