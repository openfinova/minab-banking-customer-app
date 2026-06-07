import { NextResponse } from "next/server";
import { getBffSessionForResponse } from "@/lib/auth/server/session";
import { createPkceAuthorizeUrl } from "@/lib/auth/server/oidc-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/dashboard";
  // Force a fresh authentication at the IdP by default. The customer and staff portals share the
  // Authorization Server session cookie (same host, different ports), so silent SSO would let one
  // channel's session bleed into the other. Mid-session continuity is preserved by server-side
  // token refresh, not by re-using the IdP login session.
  const promptParam = url.searchParams.get("prompt");
  const prompt = promptParam === "none" ? "none" : "login";

  const pkce = await createPkceAuthorizeUrl({
    returnTo,
    prompt,
    acrValues: url.searchParams.get("acr_values") ?? undefined,
  });

  const response = NextResponse.redirect(pkce.url);
  const session = await getBffSessionForResponse(request, response);
  session.pkce = {
    codeVerifier: pkce.codeVerifier,
    state: pkce.state,
    nonce: pkce.nonce,
  };
  session.returnTo = returnTo;
  await session.save();

  return response;
}
