import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  variant?: "ghost" | "outline";
  className?: string;
}

export function ThemeToggle({ variant = "outline", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={`relative h-9 w-9 rounded-lg border-border/80 transition-colors hover:border-primary/50 ${className || ""}`}
          title="Mavzuni o'zgartirish"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
          <span className="sr-only">Mavzuni tanlash</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-border/80">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`cursor-pointer ${theme === "light" ? "text-primary font-semibold" : ""}`}
        >
          <Sun className="mr-2 h-4 w-4 text-amber-500" />
          Yorug' (Light)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`cursor-pointer ${theme === "dark" ? "text-primary font-semibold" : ""}`}
        >
          <Moon className="mr-2 h-4 w-4 text-primary" />
          Qorong'i (Dark)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`cursor-pointer ${theme === "system" ? "text-primary font-semibold" : ""}`}
        >
          <span className="mr-2 text-xs font-mono">💻</span>
          Tizim (System)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
