export type Role = 'farmer' | 'processor' | 'consumer';

export interface NavigationLink {
  href: string;
  label: string;
}

export const roleLinkGroups: Record<Role, NavigationLink[]> = {
  farmer: [
    { href: '/farmer/dashboard', label: 'Dashboard' },
    { href: '/farmer/disease', label: 'Disease Scan' },
    { href: '/farmer/chat', label: 'AI Assistant' },
    { href: '/farmer/prices', label: 'Market Prices' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/marketplace/listings/new', label: 'New Listing' },
    { href: '/marketplace/orders', label: 'My Orders' },
  ],
  processor: [
    { href: '/processor/dashboard', label: 'Dashboard' },
    { href: '/processor/feasibility', label: 'Factory Advisor' },
    { href: '/processor/quality', label: 'Quality Control' },
    { href: '/processor/equipment', label: 'Equipment' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/marketplace/listings/new', label: 'New Listing' },
    { href: '/marketplace/orders', label: 'My Orders' },
  ],
  consumer: [
    { href: '/consumer/dashboard', label: 'Dashboard' },
    { href: '/marketplace', label: 'Browse Products' },
    { href: '/marketplace/orders', label: 'My Orders' },
  ],
};
