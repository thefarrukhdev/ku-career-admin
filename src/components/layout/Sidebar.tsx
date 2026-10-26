import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const location = useLocation();
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onNavigate) onNavigate();
    navigate("/login");
  };

  const navItems = [
    {
      name: "Boshqaruv paneli",
      href: "/",
      icon: LayoutDashboard,
      description: "Umumiy ko'rinish va statistika",
    },
    {
      name: "Vakansiyalar",
      href: "/vacancies",
      icon: Briefcase,
      description: "Ish o'rinlari va talablar",
    },
    {
      name: "Nomzodlar va arizalar",
      href: "/subscriptions",
      icon: Users,
      description: "Nomzodlar va rezyumelar",
    },
    ...(isSuperAdmin
      ? [
          {
            name: "Adminlar",
            href: "/admins",
            icon: ShieldCheck,
            description: "Tizim administratorlari",
          },
        ]
      : []),
  ];

  const userInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "KU";

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between border-r border-border/80 bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Top Branding Section */}
      <div>
        <div className="flex h-16 items-center gap-3 border-b border-border/80 px-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 overflow-hidden">
            <img
              src="/ku-white.png"
              alt="Kokand University"
              className="hidden dark:block h-7 w-7 object-contain"
            />
            <img
              src="/ku-black.png"
              alt="Kokand University"
              className="block dark:hidden h-7 w-7 object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight text-foreground truncate">
              Kokand University
            </span>
            <span className="text-xs font-semibold text-primary tracking-wider">
              ATS & Career Portal
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 p-3.5">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Asosiy Menyu
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-primary-foreground/70 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Section */}
      <div className="border-t border-border/80 p-3.5 space-y-2">
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0 border border-primary/30">
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-foreground truncate">
                  {user?.name || user?.email?.split("@")[0] || "Foydalanuvchi"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate" title={user?.email}>
                {user?.email || "admin@kokanduni.uz"}
              </p>
              <div className="mt-1">
                {isSuperAdmin ? (
                  <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-0 h-4 border-0">
                    Super Admin
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-medium px-2 py-0 h-4 border"
                  >
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive" />
          Chiqish (Logout)
        </Button>
      </div>
    </div>
  );
}
