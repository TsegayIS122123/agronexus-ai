import { ROLE_COLORS, type RoleKey } from "@/lib/theme";

interface SidebarProps {
  role?: RoleKey;
  currentPath?: string;
}

const farmerLinks = [
  { href: "/farmer/dashboard", label: "Dashboard" },
  { href: "/farmer/chat", label: "Chat" },
  { href: "/farmer/disease", label: "Disease Scan" },
  { href: "/farmer/prices", label: "Market Prices" },
];

const processorLinks = [
  { href: "/processor/dashboard", label: "Dashboard" },
  { href: "/processor/equipment", label: "Equipment" },
  { href: "/processor/feasibility", label: "Feasibility" },
  { href: "/processor/quality", label: "Quality" },
];

const consumerLinks = [
  { href: "/consumer/dashboard", label: "Dashboard" },
];

const marketplaceLinks = [
  { href: "/marketplace", label: "Browse" },
  { href: "/marketplace/listings/new", label: "New Listing" },
  { href: "/marketplace/orders", label: "Orders" },
];

export function Sidebar({ role = "farmer", currentPath = "" }: SidebarProps) {
  const colors = ROLE_COLORS[role];
  const darkColor = colors[900];
  const lightBg = colors[50];

  const links =
    role === "farmer"
      ? farmerLinks
      : role === "processor"
      ? processorLinks
      : role === "consumer"
      ? consumerLinks
      : marketplaceLinks;

  return (
    <aside className={`${darkColor} text-white w-56 min-h-screen`}>
      <nav className="mt-6">
        <ul className="space-y-2 px-3">
          {links.map((link) => {
            const active = currentPath.startsWith(link.href);
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`block rounded px-3 py-2 text-sm transition ${
                    active ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
