import { useState, ReactNode } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  ChevronRight,
  LayoutDashboard,
  Briefcase,
  Users,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: ReactNode;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Boshqaruv paneli",
    subtitle: "ATS umumiy statistikasi va nomzodlar tahlili",
  },
  "/vacancies": {
    title: "Vakansiyalar",
    subtitle: "Universitet bo'yicha e'lon qilingan ish o'rinlari",
  },
  "/subscriptions": {
    title: "Nomzodlar va arizalar",
    subtitle: "Nomzodlar tomonidan yuborilgan arizalar va rezyumelar bazasi",
  },
  "/admins": {
    title: "Administratorlar",
    subtitle: "Tizim ma'murlari va huquqlar boshqaruvi",
  },
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, logout } = useAuth();

  const currentInfo = pageTitles[location.pathname] || {
    title: "Kokand University ATS & Career Portal",
    subtitle: "Nomzodlar va karyera boshqaruv portali",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
    <div className="min-h-screen bg-background">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64">
        <Sidebar className="h-full" />
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 glass-header px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Sidebar Trigger Sheet */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden h-9 w-9 shrink-0 rounded-lg"
                  aria-label="Menyuni ochish"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r border-border/80">
                <SheetTitle className="sr-only">Navigatsiya menyusi</SheetTitle>
                <Sidebar onNavigate={() => setMobileOpen(false)} className="h-full border-r-0" />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-sm min-w-0">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-flex items-center gap-1 font-medium text-xs shrink-0"
              >
                ATS Portal
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 hidden sm:inline-block shrink-0" />
              <span className="font-semibold text-foreground text-xs sm:text-sm truncate">
                {currentInfo.title}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-accent/80 rounded-lg"
                >
                  <Avatar className="h-8 w-8 border border-primary/30">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold leading-tight text-foreground truncate max-w-[120px]">
                      {user?.name || user?.email?.split("@")[0] || "Admin"}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {isSuperAdmin ? "Super Admin" : "Admin"}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-border/80">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-foreground">
                      {user?.name || "Administrator"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email || "admin@kokanduni.uz"}
                    </p>
                    <div className="pt-1">
                      {isSuperAdmin ? (
                        <Badge className="bg-primary hover:bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0">
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer flex items-center gap-2 text-xs">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Boshqaruv paneli
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/vacancies" className="cursor-pointer flex items-center gap-2 text-xs">
                    <Briefcase className="h-3.5 w-3.5" />
                    Vakansiyalar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/subscriptions" className="cursor-pointer flex items-center gap-2 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    Nomzodlar va arizalar
                  </Link>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admins" className="cursor-pointer flex items-center gap-2 text-xs">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Adminlar boshqaruvi
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer flex items-center gap-2 text-xs text-destructive focus:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Chiqish (Logout)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/60 py-4 px-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Kokand University. Barcha huquqlar himoyalangan.</p>
        </footer>
      </div>
    </div>
  );
}
