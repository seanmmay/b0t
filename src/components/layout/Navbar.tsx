'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Twitter, Youtube, Instagram, Settings, Cat, FlaskConical, BarChart3 } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Test Replies', href: '/dashboard/test-replies', icon: FlaskConical },
  { name: 'Limits', href: '/dashboard/limits', icon: BarChart3 },
  { name: 'Twitter', href: '/twitter', icon: Twitter },
  { name: 'YouTube', href: '/youtube', icon: Youtube },
  { name: 'Instagram', href: '/instagram', icon: Instagram },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-background">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <Cat className="h-3.5 w-3.5" />
          <span className="font-black text-xs tracking-tight">SOCIAL CAT</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs
                  transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-surface text-text-primary'
                      : 'text-text-muted hover:bg-surface hover:text-text-primary'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
