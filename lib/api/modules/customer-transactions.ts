import { api } from "@/lib/api/client";
import { withPaging, type PageRequest, type PageResponse } from "@/lib/api/query";
import type {
  AccountTransactionResponse,
  AccountTransactionType,
} from "@/lib/api/modules/accounts";

export type { AccountTransactionResponse, AccountTransactionType };

export interface CustomerTransactionFilters {
  fromDate: string;
  toDate: string;
  accountId?: string;
  transactionType?: AccountTransactionType;
  status?: string;
  search?: string;
}

export const customerTransactionsApi = {
  /** Searches transactions across all accounts owned by the authenticated customer. */
  searchOwn: (filters: CustomerTransactionFilters, page: PageRequest = {}) =>
    api.get<PageResponse<AccountTransactionResponse>>("/api/v1/accounts/me/transactions", {
      query: withPaging(
        {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          accountId: filters.accountId,
          transactionType: filters.transactionType,
          status: filters.status,
          search: filters.search,
        },
        { page: page.page, size: page.size ?? 20, sort: page.sort ?? "transactionDate,desc" },
      ),
    }),
};
