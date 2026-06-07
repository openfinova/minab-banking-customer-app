"use client";

import Link from "next/link";
import { CreditCard, Shield, Wallet } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-provider";
import { RouteGuard } from "@/components/rbac/route-guard";

const shortcuts: Array<{
  title: string;
  description: string;
  icon: typeof Wallet;
  href: string;
}> = [
  {
    title: "Accounts",
    description: "View your account list, balances, and account details.",
    icon: Wallet,
    href: "/accounts",
  },
  {
    title: "Transactions",
    description: "Review your recent activity and transfer history.",
    icon: CreditCard,
    href: "/transactions",
  },
  {
    title: "Security",
    description: "Manage your profile, password, and multi-factor authentication.",
    icon: Shield,
    href: "/account/security",
  },
];

export default function DashboardPage() {
  const { session } = useAuth();
  const greeting = session?.user.displayName ?? session?.user.username ?? "customer";

  return (
    <RouteGuard>
      <div className="space-y-6">
        <PageHeader
          title={`Welcome, ${greeting}`}
          description="Access your accounts, transaction activity, and security settings."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {shortcuts.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </RouteGuard>
  );
}
