import {
  LayoutDashboard,
  Film,
  Tv,
  FolderTree,
  Users,
  CreditCard,
  Wallet,
  Home,
  TicketPercent,
  Sparkles,
  Languages,
  Drama,
  BadgeCheck,
  SlidersHorizontal,
  LifeBuoy,
  Receipt,
  LucideIcon,
} from 'lucide-react';

export const NAV_GROUPS: {
  label: string;
  items: { title: string; to: string; icon: LucideIcon }[];
}[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Content',
    items: [
      { title: 'Movies', to: '/movies', icon: Film },
      { title: 'Series', to: '/series', icon: Tv },
      { title: 'Categories', to: '/categories', icon: FolderTree },
      { title: 'Languages', to: '/languages', icon: Languages },
      { title: 'Cast & Crew', to: '/cast', icon: Users },
      { title: 'Roles', to: '/roles', icon: Drama },
    ],
  },
  {
    label: 'Audience',
    items: [
      { title: 'Users', to: '/users', icon: Users },
      { title: 'Plans', to: '/plans', icon: CreditCard },
      { title: 'Subscriptions', to: '/subscriptions', icon: BadgeCheck },
      { title: 'Payments', to: '/payments', icon: Wallet },
      { title: 'Payment Gateways', to: '/gateway-config', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Growth',
    items: [
      { title: 'Homepage', to: '/homepage', icon: Home },
      { title: 'Coupons & Promotions', to: '/coupons', icon: TicketPercent },
      { title: 'Collections', to: '/collections', icon: Sparkles },
    ],
  },
  {
    label: 'Settings',
    items: [
      { title: 'Support Contact', to: '/support-contact', icon: LifeBuoy },
      { title: 'Invoice Settings', to: '/invoice-settings', icon: Receipt },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
