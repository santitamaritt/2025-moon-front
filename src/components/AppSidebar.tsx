import type React from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useStore } from "@/zustand/store";
import { UserRoles } from "@/zustand/session/session.types";
import type { UserRole } from "@/zustand/session/session.types";
import {
  Home,
  Calendar,
  Wrench,
  User,
  Moon,
  Sun,
  Plus,
  Car,
  Hammer,
  Cog,
  Menu,
  Bell,
  BarChart,
  Check,
  Mail,
  Star,
  Goal,
  Gauge,
} from "lucide-react";

import {
  getNotifications,
  markNotificationAsRead,
} from "@/services/notifications";
import { useQuery } from "react-query";
import type { Notification } from "@/types/notifications.types";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { UpdateVehicleKmsModal } from "@/components/UpdateVehicleKmsModal";

export const AppSidebar = ({ children }: { children?: React.ReactNode }) => {
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openUpdateKms, setOpenUpdateKms] = useState(false);
  const location = useLocation();
  const user = useStore((state) => state.user);
  const themeMode = useStore((state) => state.themeMode);
  const navigate = useNavigate();
  const { data: notifications, refetch } = useQuery(
    "notifications",
    () => getNotifications(),
    {
      initialData: [],
    }
  );
  const toggleTheme = useStore((state) => state.toggleTheme);

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const isRealRole = (
    role: UserRole
  ): role is Exclude<UserRole, typeof UserRoles.NULL> =>
    role !== UserRoles.NULL;

  type NavItem = {
    path: string;
    label: string;
    userRole: UserRole[];
    icon: React.ReactNode;
  };

  const navPaths: NavItem[] = [
    {
      path: "/home",
      label: "Inicio",
      userRole: [UserRoles.USER, UserRoles.MECHANIC],
      icon: <Home className="size-4" />,
    },
    {
      path: "/appointments",
      label: "Mis turnos",
      userRole: [UserRoles.USER],
      icon: <Calendar className="size-4" />,
    },
    {
      path: "/vehicles",
      label: "Mis vehiculos",
      userRole: [UserRoles.USER],
      icon: <Car className="size-4" />,
    },
    {
      path: "/shifts",
      label: "Turnos",
      userRole: [UserRoles.MECHANIC],
      icon: <Wrench className="size-4" />,
    },
    {
      path: "/user-dashboard",
      label: "Dashboard",
      userRole: [UserRoles.USER],
      icon: <BarChart className="size-4" />,
    },
    {
      path: "/mechanic-dashboard",
      label: "Dashboard",
      userRole: [UserRoles.MECHANIC],
      icon: <BarChart className="size-4" />,
    },
    {
      path: "/reserve",
      label: "Reservar",
      userRole: [UserRoles.USER],
      icon: <Plus className="size-4" />,
    },
    {
      path: "/spare-parts",
      label: "Repuestos",
      userRole: [UserRoles.MECHANIC],
      icon: <Cog className="size-4" />,
    },
    {
      path: "/services",
      label: "Servicios",
      userRole: [UserRoles.MECHANIC],
      icon: <Hammer className="size-4" />,
    },
    {
      path: "/review-mechanic",
      label: "Evaluar mecánico",
      userRole: [UserRoles.USER],
      icon: <Star className="size-4" />,
    },
    {
      path: "/goals",
      label: "Metas",
      userRole: [UserRoles.MECHANIC],
      icon: <Goal className="size-4" />,
    },
    {
      path: "/reminders",
      label: "Recordatorios",
      userRole: [UserRoles.USER],
      icon: <Bell className="size-4" />,
    },
  ] as const;

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n: Notification) => !n.isRead);
    for (const n of unread) {
      await markNotificationAsRead(n.id);
    }
    refetch();
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2 relative">
            <img src="/estaller-logo.png" alt="ESTALLER" className="h-8 w-8" />
            <span className="text-sm font-semibold transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
              ESTALLER
            </span>
          </div>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {navPaths.map((nav) => {
                  const allowed =
                    isRealRole(user.userRole) &&
                    nav.userRole.includes(user.userRole);
                  if (!allowed) return null;
                  const isActive = location.pathname === nav.path;
                  return (
                    <SidebarMenuItem key={nav.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={nav.label}
                      >
                        <Link to={nav.path} className="flex items-center gap-2">
                          {nav.icon}
                          <span>{nav.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu className="gap-2">
            {user.userRole === UserRoles.USER ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                  tooltip="Actualiza tus kms"
                  onClick={() => setOpenUpdateKms(true)}
                >
                  <Gauge className="size-4" />
                  <span>Actualiza tus kms</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null}
            <SidebarMenuItem>
              <SidebarMenuButton
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                tooltip="Notificaciones"
                onClick={() => setOpenNotifications(!openNotifications)}
              >
                <div className="relative">
                  <Bell className="size-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full px-1 py-0.5 min-w-[14px] text-center">
                      {notifications.length}
                    </span>
                  )}
                </div>
                <span>Notificaciones</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                tooltip="Cambiar tema"
                onClick={toggleTheme}
              >
                {isDark ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                <span>Cambiar tema</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/profile"}
                tooltip="Perfil"
              >
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="size-4" />
                  <span>Perfil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      {children ? (
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden text-foreground">
            <SidebarTrigger className="flex items-center gap-2">
              <Menu className="size-5" />
              <span className="sr-only">Abrir menú</span>
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <img
                src="/estaller-logo.png"
                alt="ESTALLER"
                className="h-6 w-6"
              />
              <span className="text-sm font-semibold">ESTALLER</span>
            </div>
          </header>
          {children}
        </SidebarInset>
      ) : null}
      <Dialog open={openNotifications} onOpenChange={setOpenNotifications}>
        <DialogContent className="max-w-md max-h-[75vh] overflow-y-auto text-foreground">
          <DialogHeader className="flex flex-row items-center justify-between p-3">
            <DialogTitle>Notificaciones</DialogTitle>
            {notifications.some((n: Notification) => !n.isRead) && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleMarkAllAsRead}
              >
                <Check className="size-4 mr-1" />
                Marcar todas como leídas
              </Button>
            )}
          </DialogHeader>
          <ul className="space-y-3 mt-4">
            {notifications?.length ? (
              notifications.map((notification: Notification) => (
                <li
                  key={notification.id}
                  className={`border rounded-md p-4 flex flex-col gap-2 transition ${
                    notification.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm flex items-center gap-2">
                      <Mail
                        className={`size-4 ${
                          notification.isRead
                            ? "text-muted-foreground"
                            : "text-primary"
                        }`}
                      />
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-primary hover:text-primary/80"
                        onClick={async () => {
                          await markNotificationAsRead(notification.id);
                          refetch();
                        }}
                      >
                        <Check className="size-3 mr-1" />
                        Marcar como leída
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={async () => {
                        const redirectTo =
                          user.userRole === UserRoles.USER
                            ? "/appointments"
                            : "/shifts";
                        navigate(redirectTo);
                        setOpenNotifications(false);
                        await markNotificationAsRead(notification.id);
                        refetch();
                      }}
                    >
                      Ver detalle
                    </Button>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground p-2">
                No hay notificaciones nuevas.
              </p>
            )}
          </ul>
        </DialogContent>
      </Dialog>
      <UpdateVehicleKmsModal open={openUpdateKms} onOpenChange={setOpenUpdateKms} />
    </SidebarProvider>
  );
};

export default AppSidebar;
