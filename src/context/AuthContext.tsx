import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

export interface AuthUser {
  email: string;
  name?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function checkIsSuperAdmin(user?: AuthUser | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin === true) return true;
  const role = (user.role || "").toLowerCase();
  if (role.includes("super") || role === "super_admin" || role === "superadmin") {
    return true;
  }
  const email = (user.email || "").toLowerCase();
  if (
    email.startsWith("super") ||
    email.includes("superadmin") ||
    email.includes("super_admin") ||
    email === "admin@kokanduni.uz"
  ) {
    return true;
  }
  return false;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    const storedUser = localStorage.getItem("admin_user");

    if (storedToken) {
      setToken(storedToken);

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser({
            ...parsed,
            isSuperAdmin: checkIsSuperAdmin(parsed),
          });
        } catch {
          // If JSON parse fails, attempt JWT decode
          const jwt = decodeJwt(storedToken);
          const email = (jwt?.email as string) || "admin@kokanduni.uz";
          const fallbackUser: AuthUser = {
            email,
            name: (jwt?.name as string) || email.split("@")[0],
            role: (jwt?.role as string) || "ADMIN",
            isSuperAdmin: checkIsSuperAdmin({ email, role: jwt?.role as string }),
          };
          setUser(fallbackUser);
          localStorage.setItem("admin_user", JSON.stringify(fallbackUser));
        }
      } else {
        const jwt = decodeJwt(storedToken);
        const email = (jwt?.email as string) || "admin@kokanduni.uz";
        const fallbackUser: AuthUser = {
          email,
          name: (jwt?.name as string) || email.split("@")[0],
          role: (jwt?.role as string) || "ADMIN",
          isSuperAdmin: checkIsSuperAdmin({ email, role: jwt?.role as string }),
        };
        setUser(fallbackUser);
        localStorage.setItem("admin_user", JSON.stringify(fallbackUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post("https://univer-production.up.railway.app/auth/login/admin", {
      email,
      password,
    });
    const { access_token, user: resUser } = response.data;

    localStorage.setItem("admin_token", access_token);
    setToken(access_token);

    const jwt = decodeJwt(access_token);
    const resolvedEmail = resUser?.email || (jwt?.email as string) || email;
    const resolvedName =
      resUser?.name ||
      resUser?.fullname ||
      (jwt?.name as string) ||
      (jwt?.fullname as string) ||
      resolvedEmail.split("@")[0];
    const rawRole = resUser?.role || (jwt?.role as string) || "";
    const isSuper = checkIsSuperAdmin({
      email: resolvedEmail,
      role: rawRole,
      isSuperAdmin: resUser?.isSuperAdmin || (jwt?.isSuperAdmin as boolean),
    });

    const resolvedUser: AuthUser = {
      email: resolvedEmail,
      name: resolvedName,
      role: isSuper ? "SUPER_ADMIN" : rawRole || "ADMIN",
      isSuperAdmin: isSuper,
    };

    localStorage.setItem("admin_user", JSON.stringify(resolvedUser));
    setUser(resolvedUser);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
  };

  const isSuperAdmin = checkIsSuperAdmin(user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isSuperAdmin,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
