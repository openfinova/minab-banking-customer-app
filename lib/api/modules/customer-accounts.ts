import { api } from "@/lib/api/client";
import type { AccountResponse } from "@/lib/api/modules/accounts";

export type { AccountResponse, AccountProductType, AccountStatus } from "@/lib/api/modules/accounts";

export const customerAccountsApi = {
  /** Lists accounts for the authenticated customer (JWT subject). */
  listOwnAccounts: () => api.get<AccountResponse[]>("/api/v1/accounts/me"),
};
