import { api } from "@/lib/api/client";

export interface CustomerTransaction {
  id: string;
  bookingDate: string;
  description: string;
  amount: number;
  currency: string;
  direction: "DEBIT" | "CREDIT";
  status: string;
}

export const customerTransactionsApi = {
  listOwnTransactions: () => api.get<CustomerTransaction[]>("/api/v1/customer/transactions"),
};
