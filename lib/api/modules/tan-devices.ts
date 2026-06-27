import { api, request } from "@/lib/api/client";

export type TanDeviceStatus = "PENDING_ENROLLMENT" | "ACTIVE" | "REVOKED";

export interface TanDevice {
  id: string;
  deviceName: string;
  status: TanDeviceStatus;
  enrolledAt?: string | null;
  lastUsedAt?: string | null;
}

export interface EnrollmentQrResponse {
  qrPayload: string;
  expiresAt: string;
}

export const tanDevicesApi = {
  list: () => api.get<TanDevice[]>("/api/v1/tan/devices"),

  createEnrollmentQr: () =>
    api.post<EnrollmentQrResponse>("/api/v1/tan/devices/enrollment-qr"),

  confirm: (deviceId: string, body: { confirmationCode: string }) =>
    api.post<void>(`/api/v1/tan/devices/${deviceId}/confirm`, body),

  revoke: (deviceId: string) =>
    request<void>(`/api/v1/tan/devices/${deviceId}`, { method: "DELETE" }),
};
