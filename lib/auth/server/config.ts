import "server-only";

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

/** Server-only OIDC and session configuration for the customer BFF. */
export const serverAuthConfig = {
  publicAppUrl: optional("APP_PUBLIC_URL", "http://localhost:3001").replace(/\/$/, ""),
  apiBaseUrl: optional("API_BASE_URL", "http://localhost:8080"),
  oidc: {
    authority: optional("OIDC_AUTHORITY", "http://localhost:8081/realms/openfinova").replace(/\/$/, ""),
    tokenAuthority: optional(
      "OIDC_TOKEN_AUTHORITY",
      optional("OIDC_AUTHORITY", "http://localhost:8081/realms/openfinova"),
    ).replace(/\/$/, ""),
    clientId: optional("OIDC_CLIENT_ID", "customer-portal"),
    clientSecret: optional("OIDC_CLIENT_SECRET", "customer-portal-secret"),
    redirectUri: optional("OIDC_REDIRECT_URI", "http://localhost:3001/api/auth/callback"),
    postLogoutRedirectUri: optional(
      "OIDC_POST_LOGOUT_REDIRECT_URI",
      "http://localhost:3001/login",
    ),
    scopes: optional("OIDC_SCOPES", "openid profile email offline_access banking.customer"),
  },
  session: {
    idleMs: Number(optional("SESSION_IDLE_MS", "900000")),
    absoluteMs: Number(optional("SESSION_ABSOLUTE_MS", "28800000")),
    allowRefresh: optional("SESSION_ALLOW_REFRESH", "true") === "true",
  },
} as const;
