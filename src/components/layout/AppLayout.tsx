import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useAuth } from '../../contexts/AuthContext';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border/50 bg-background/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate hidden sm:block">Welcome back, {user?.email}</h1>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate sm:hidden">MessFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsDropdown />
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
