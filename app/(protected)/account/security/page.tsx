import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { RouteGuard } from "@/components/rbac/route-guard";
import { Permissions } from "@/lib/rbac/permissions";

export default function AccountSecurityPage() {
  return (
    <RouteGuard permissions={[Permissions.PasswordChangeOwn, Permissions.MfaManageOwn]} mode="any">
      <div className="space-y-6">
        <PageHeader
          title="Security"
          description="Manage password and multi-factor authentication for your account."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/account/password">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                  Update your sign-in password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-primary">Open password settings</CardContent>
            </Card>
          </Link>
          <Link href="/account/mfa">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Multi-factor authentication</CardTitle>
                <CardDescription>
                  Configure authenticator app verification and recovery codes.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-primary">Open MFA settings</CardContent>
            </Card>
          </Link>
          <Link href="/account/trusted-devices">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Trusted devices</CardTitle>
                <CardDescription>
                  Enrol the Minab TAN app on your phone for payment authorization.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-primary">Manage trusted devices</CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </RouteGuard>
  );
}
