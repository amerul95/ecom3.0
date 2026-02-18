"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFolder,
  IconInnerShadowTop,
  IconCirclePlusFilled,
  IconShoppingCart,
  IconUserCircle,
  IconReceipt,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Helper function to get initial from name or email
function getInitial(name?: string | null, email?: string | null): string {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return 'A';
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const navMain = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Products",
      url: "/admin/products",
      icon: IconFolder,
    },
    {
      title: "Add New Product",
      url: "/admin/products/new",
      icon: IconCirclePlusFilled,
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: IconReceipt,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUserCircle,
    },
  ];

  const userData = {
    name: user?.name || "Admin User",
    email: user?.email || "admin@example.com",
    avatar: user?.image || `/avatars/${getInitial(user?.name, user?.email).toLowerCase()}.jpg`,
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Admin Panel</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
