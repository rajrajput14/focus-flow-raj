import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineIndicator } from './OfflineIndicator';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <OfflineIndicator />
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-white/20 bg-white/50 px-6 backdrop-blur-xl">
            <SidebarTrigger />
          </header>
          <div className="p-6 pb-24 md:pb-6">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </SidebarProvider>
  );
}