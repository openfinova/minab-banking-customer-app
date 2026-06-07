import { NextResponse } from "next/server";
import { serverAuthConfig } from "@/lib/auth/server/config";
import {
  bindTokens,
  clearBffSession,
  getBffSession,
  getBoundTokens,
  hasAuthenticatedSession,
  isSessionAbsoluteExpired,
  isSessionIdleExpired,
} from "@/lib/auth/server/session";
import { refreshTokens, tokenResponseToBffFields } from "@/lib/auth/server/oidc-server";
import { toPublicSession } from "@/lib/auth/server/session-api";

/**
 * Extends the BFF session via server-side refresh (customer portal only).
 *
 * Tokens are held server-side in the token store keyed by the session id; they are never present on
 * the iron-session cookie. A successful refresh rotates the stored tokens (the AS issues a new
 * refresh token on each use) and bumps the activity timestamp.
 */
export async function POST() {
  if (!serverAuthConfig.session.allowRefresh) {
    return NextResponse.json({ error: "Refresh not enabled" }, { status: 400 });
  }

  const session = await getBffSession();
  if (!hasAuthenticatedSession(session)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  if (isSessionIdleExpired(session) || isSessionAbsoluteExpired(session)) {
    await clearBffSession();
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const stored = getBoundTokens(session.sid);
  if (!stored?.refreshToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const token = await refreshTokens(stored.refreshToken);
    const fields = tokenResponseToBffFields(token);
    if (session.sid) {
      bindTokens(session.sid, {
        accessToken: fields.accessToken,
        refreshToken: fields.refreshToken ?? stored.refreshToken,
        idToken: fields.idToken ?? stored.idToken,
      });
    }
    session.expiresAt = fields.expiresAt;
    session.user = fields.user;
    session.lastActivityAt = Date.now();
    await session.save();

    const publicSession = toPublicSession(session);
    return NextResponse.json({
      authenticated: true,
      expiresAt: publicSession?.expiresAt,
      user: publicSession?.user,
      forcePasswordChange: publicSession?.user.forcePasswordChange,
    });
  } catch {
    await clearBffSession();
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
