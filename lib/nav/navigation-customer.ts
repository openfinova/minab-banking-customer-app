import {
  CircleUser,
  CreditCard,
  LayoutDashboard,
  Shield,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Permissions } from "@/lib/rbac/permissions";

export interface NavItem {
  label: string;
  title?: string;
  href: string;
  icon?: LucideIcon;
  permissions?: ReadonlyArray<string>;
  permissionMode?: "all" | "any";
}

export interface NavSection {
  id: string;
  label: string;
  title?: string;
  icon?: LucideIcon;
  items: NavItem[];
  permissions?: ReadonlyArray<string>;
}

export const navSections: NavSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    id: "banking",
    label: "Banking",
    icon: Wallet,
    permissions: [Permissions.AccountRead, Permissions.TransactionRead],
    items: [
      {
        label: "Accounts",
        href: "/accounts",
        icon: Wallet,
        permissions: [Permissions.AccountRead],
      },
      {
        label: "Transactions",
        href: "/transactions",
        icon: CreditCard,
        permissions: [Permissions.TransactionRead],
      },
    ],
  },
  {
    id: "my-account",
    label: "My Account",
    icon: CircleUser,
    permissions: [Permissions.ProfileReadOwn, Permissions.PasswordChangeOwn, Permissions.MfaManageOwn],
    items: [
      {
        label: "Profile",
        href: "/account/profile",
        icon: CircleUser,
        permissions: [Permissions.ProfileReadOwn],
      },
      {
        label: "Security",
        href: "/account/security",
        icon: Shield,
        permissions: [Permissions.PasswordChangeOwn, Permissions.MfaManageOwn],
        permissionMode: "any",
      },
    ],
  },
];
