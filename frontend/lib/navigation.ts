export type Role = 'farmer' | 'processor' | 'consumer';

export interface NavigationLink {
  href: string;
  /**
   * English text, kept so the list stays readable and usable in tests without a
   * locale context. Prefer `labelKey` for anything rendered.
   */
  label: string;
  /**
   * Key into the translation tables.
   *
   * Added so the sidebar can be translated without a second list of links. A
   * component that only reads `label` renders English strings on an Amharic page,
   * which is the exact defect the i18n work exists to remove. `i18n-parity.test.ts`
   * does not cover this link list, so the risk is a missing key rather than a
   * missing string: `t()` falls back to `label` when a key is absent.
   */
  labelKey?: string;
}

export const roleLinkGroups: Record<Role, NavigationLink[]> = {
  farmer: [
    { href: '/farmer/dashboard', label: 'Dashboard', labelKey: 'navDashboard' },
    { href: '/farmer/disease', label: 'Disease Scan', labelKey: 'navDiseaseScan' },
    { href: '/farmer/chat', label: 'AI Assistant', labelKey: 'navAiAssistant' },
    { href: '/farmer/prices', label: 'Market Prices', labelKey: 'navMarketPrices' },
    { href: '/marketplace', label: 'Marketplace', labelKey: 'navMarketplace' },
    { href: '/marketplace/listings/new', label: 'New Listing', labelKey: 'navNewListing' },
    { href: '/marketplace/orders', label: 'My Orders', labelKey: 'navMyOrders' },
  ],
  processor: [
    { href: '/processor/dashboard', label: 'Dashboard', labelKey: 'navDashboard' },
    { href: '/processor/feasibility', label: 'Factory Advisor', labelKey: 'navFactoryAdvisor' },
    { href: '/processor/quality', label: 'Quality Control', labelKey: 'navQualityControl' },
    { href: '/processor/equipment', label: 'Equipment', labelKey: 'navEquipment' },
    { href: '/marketplace', label: 'Marketplace', labelKey: 'navMarketplace' },
    { href: '/marketplace/listings/new', label: 'New Listing', labelKey: 'navNewListing' },
    { href: '/marketplace/orders', label: 'My Orders', labelKey: 'navMyOrders' },
  ],
  consumer: [
    { href: '/consumer/dashboard', label: 'Dashboard', labelKey: 'navDashboard' },
    { href: '/marketplace', label: 'Browse Products', labelKey: 'navBrowseProducts' },
    { href: '/marketplace/orders', label: 'My Orders', labelKey: 'navMyOrders' },
  ],
};

/**
 * The label a link should render in the current locale.
 *
 * Falls back to the English `label` so a missing key degrades to readable text
 * rather than rendering the raw key name at a person.
 */
export function linkText(
  link: NavigationLink,
  t: (key: string) => string,
): string {
  if (!link.labelKey) return link.label;
  const translated = t(link.labelKey);
  return translated === link.labelKey ? link.label : translated;
}