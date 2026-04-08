'use client';

import { useState } from 'react';
import { AuthProvider } from '@/providers/auth-provider';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-surface">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10">
              <AppSidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-[240px]'
        )}>
          <Header onMenuToggle={() => setMobileMenuOpen(true)} />
          <main className="p-4 lg:p-6 pb-24 lg:pb-6 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </AuthProvider>
  );
}
