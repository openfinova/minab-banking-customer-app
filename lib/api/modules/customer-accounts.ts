import { api } from "@/lib/api/client";

export interface CustomerAccountSummary {
  id: string;
  accountNumber: string;
  displayName: string;
  currency: string;
  availableBalance: number;
  status: string;
}

export const customerAccountsApi = {
  listOwnAccounts: () => api.get<CustomerAccountSummary[]>("/api/v1/customer/accounts"),
};
