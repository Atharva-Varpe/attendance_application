import * as React from "react"
import { GalleryVerticalEnd, LayoutDashboard, Calendar, Users, FileText, DollarSign, User } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar"

// Attendance application navigation data
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: "LayoutDashboard",
      isActive: true,
    },
    {
      title: "Attendance",
      url: "/attendance",
      icon: "Calendar",
    },
    {
      title: "Employees",
      url: "/employees",
      icon: "Users",
    },
    {
      title: "Payslips",
      url: "/payslips",
      icon: "FileText",
    },
    {
      title: "Salary",
      url: "/salary",
      icon: "DollarSign",
    },
    {
      title: "Profile",
      url: "/profile",
      icon: "User",
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  const location = useLocation();

  const getIcon = (iconName) => {
    const icons = {
      LayoutDashboard,
      Calendar,
      Users,
      FileText,
      DollarSign,
      User,
    };
    return icons[iconName] || GalleryVerticalEnd;
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">AttendanceHub</span>
                  <span className="text-xs">HR Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => {
              const Icon = getIcon(item.icon);
              const isActive = location.pathname === item.url;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link to={item.url} className="font-medium">
                      <Icon className="size-4" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
