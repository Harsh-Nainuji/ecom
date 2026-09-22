import { LayoutDashboard, PackageSearch, Tag, ShoppingBag, Truck, Users, Coins, Image, Settings } from 'lucide-react';

export const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Buyers',
    href: '/buyers',
    icon: Users,
  },
  {
    label: 'Sellers',
    href: '/sellers',
    icon: ShoppingBag,
  },
  {
    label: 'Categories',
    href: '/categories',
    icon: Tag,
  },
  {
    label: 'Products',
    href: '/products',
    icon: PackageSearch,
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: Truck,
  },

  {
    label: 'Deliveries',
    href: '/deliveries',
    icon: Truck,
  },
  {
    label: 'Revenue',
    href: '/revenue',
    icon: Coins,
  },
  {
    label: 'Banners',
    href: '/banners',
    icon: Image,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

