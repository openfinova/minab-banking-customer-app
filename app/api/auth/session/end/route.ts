import { NextResponse } from "next/server";
import { resolvePublicOrigin } from "@/lib/auth/server/public-origin";
import { getBffSessionForResponse, unbindTokens } from "@/lib/auth/server/session";

/**
 * Ends the BFF session after idle timeout without RP-initiated IdP logout.
 *
 * A full {@code /api/auth/logout} (Keycloak end-session) can race with the next OAuth login and
 * leave the user stuck on the IdP login page. Interactive sign-out from the menu still uses
 * {@code /api/auth/logout} for end-to-end IdP logout.
 */
export async function GET(request: Request) {
  const publicOrigin = resolvePublicOrigin(request.headers);
  const response = NextResponse.redirect(new URL("/login?reason=session-expired", publicOrigin));
  const session = await getBffSessionForResponse(request, response);
  unbindTokens(session.sid);
  await session.destroy();
  return response;
}
