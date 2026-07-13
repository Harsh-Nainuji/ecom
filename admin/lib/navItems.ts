import { LayoutDashboard, PackageSearch, ShoppingBag, Truck, Users } from 'lucide-react';

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
];
