import { ApiError } from "@/lib/api/errors";
import { appConfig } from "@/lib/config";

/**
 * Redirects the browser through a step-up OIDC flow (prompt=login, gold acr).
 * Use before high-risk staff actions (user admin, GL approvals).
 */
export function startStepUp(returnTo?: string): void {
  const url = new URL(appConfig.oidc.stepUpPath, window.location.origin);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  else if (typeof window !== "undefined") {
    url.searchParams.set("returnTo", window.location.pathname + window.location.search);
  }
  window.location.assign(url.toString());
}

export function isStepUpRequired(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;

  if (
    error.status === 403 &&
    (error.message.includes("Step-up") || error.message.includes("acr="))
  ) {
    return true;
  }

  if (error.status === 409) {
    const detail = error.payload.detail ?? error.message;
    return detail.includes("Gold ACR");
  }

  return false;
}

export function handleStepUpOnError(error: unknown): boolean {
  if (!isStepUpRequired(error)) return false;
  startStepUp();
  return true;
}
