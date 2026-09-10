import { roleColors, RoleColor } from "@/lib/theme";

interface HeaderProps {
  role?: RoleColor;
  user?: { name?: string; email?: string } | null;
}

export function Header({ role = "farmer", user }: HeaderProps) {
  const colors = roleColors[role];

  return (
    <header className={`${colors.dark} text-white px-4 py-3 shadow-md flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold">AgroNexus AI</span>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${colors.text}`}>{user.name || user.email}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href="/auth/login" className="text-sm underline">Login</a>
            <a href="/auth/register" className="text-sm underline">Register</a>
          </div>
        )}
      </div>
    </header>
  );
}
