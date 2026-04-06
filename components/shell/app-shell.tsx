"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Shield, Menu, ChevronRight, Building2 } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS, canAccessItem, NavModule } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/app/actions/auth";
import { getAvatarSrc, getRoleAvatarFallback, getUserInitials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type ProfileLike = {
  full_name: string;
  role: string;
  is_superadmin: boolean;
  company_name?: string;
  photo_url?: string | null;
};

const roleLabels: Record<string, string> = {
  employee: "Colaborador",
  safety_technician: "Técnico de Segurança",
  company_admin: "Admin da Empresa",
  administrator: "Administrador",
};

const moduleLabels: Record<NavModule, string> = {
  Superadmin: "Administração SaaS",
  Empresa: "Gestão da Empresa",
  Colaborador: "Minha Área",
};

function SidebarContent({
  profile,
  permissions,
  pathname,
  onNavigate,
}: {
  profile: ProfileLike;
  permissions: string[];
  pathname: string;
  onNavigate?: () => void;
}) {
  // Filtrar itens por módulo e acesso
  const accessibleItems = NAV_ITEMS.filter((item) =>
    canAccessItem(item, profile.is_superadmin, permissions, profile.role)
  );

  // Agrupar por módulo
  const groupedItems = accessibleItems.reduce(
    (acc, item) => {
      if (!acc[item.module]) {
        acc[item.module] = [];
      }
      acc[item.module].push(item);
      return acc;
    },
    {} as Record<NavModule, typeof accessibleItems>
  );

  const sections = Object.entries(groupedItems).map(([module, items]) => ({
    title: moduleLabels[module as NavModule],
    items,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-6 border-b shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight">Sistema SOS</span>
          <span className="text-xs text-muted-foreground">Segurança do Trabalho</span>
        </div>
      </div>

      <div className="px-4 py-4 shrink-0">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <UserAvatar
            className="h-10 w-10"
            src={getAvatarSrc(profile.photo_url, profile.role)}
            fallbackSrc={getRoleAvatarFallback(profile.role)}
            alt={profile.full_name}
            initials={getUserInitials(profile.full_name)}
            fallbackClassName="font-semibold"
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold">{profile.full_name}</p>
            <div className="flex flex-col gap-1 mt-1">
              <Badge variant="secondary" className="text-xs w-fit">
                {profile.is_superadmin ? "Superadmin" : roleLabels[profile.role] || profile.role}
              </Badge>
              {profile.company_name && !profile.is_superadmin && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {profile.company_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-3">
        <div className="space-y-6 pb-4">
          {sections.map((section) =>
            section.items.length ? (
              <div key={section.title} className="space-y-1">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 px-3",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                      )}
                      asChild
                      onClick={onNavigate}
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                        {isActive && (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            ) : null,
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t bg-card/50 p-3">
        <form action={signOut}>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  profile,
  permissions,
}: {
  children: React.ReactNode;
  profile: ProfileLike;
  permissions: string[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
          <SidebarContent
            profile={profile}
            permissions={permissions}
            pathname={pathname}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-8">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu de navegação</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col">
                  <SidebarContent
                    profile={profile}
                    permissions={permissions}
                    pathname={pathname}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumb / Logo for mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-semibold">SOS</span>
            </div>

            <div className="flex-1" />

            {/* Right side */}
            <div className="flex items-center gap-3">
              {profile.company_name && !profile.is_superadmin && (
                <Badge variant="outline" className="hidden md:flex gap-1">
                  <Building2 className="h-3 w-3" />
                  {profile.company_name}
                </Badge>
              )}
              <Badge variant="secondary" className="hidden sm:flex">
                {profile.is_superadmin ? "Superadmin" : roleLabels[profile.role] || profile.role}
              </Badge>
              <UserAvatar
                className="h-8 w-8 lg:hidden"
                src={getAvatarSrc(profile.photo_url, profile.role)}
                fallbackSrc={getRoleAvatarFallback(profile.role)}
                alt={profile.full_name}
                initials={getUserInitials(profile.full_name)}
                fallbackClassName="text-xs font-semibold"
              />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 px-4 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
