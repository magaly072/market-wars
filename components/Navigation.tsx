
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, User, LayoutDashboard, ListOrdered, ShoppingBag, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Feed', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Battle', icon: TrendingUp, href: '/tournaments' },
  { label: 'Prop', icon: Target, href: '/challenges' },
  { label: 'Shop', icon: ShoppingBag, href: '/shop' },
  { label: 'Hall', icon: ListOrdered, href: '/leaderboard' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function Navigation() {
  const pathname = usePathname();

  // Don't show on landing, login, signup, forgot-password
  if (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all",
                isActive && "bg-primary/10 trading-glow-primary"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
