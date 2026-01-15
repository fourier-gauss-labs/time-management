import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Settings, CalendarCheck, Target, Home } from 'lucide-react';
import type { User } from '../../services/auth';
import { Button } from '../ui/button';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Drivers', href: '/drivers', icon: Target },
    { name: 'Weekly Review', href: '/review', icon: CalendarCheck },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-16 items-center px-4 gap-4">
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="lg:hidden p-2 hover:bg-accent rounded-md"
          >
            {isNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-semibold">Time Management</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Navigation Panel */}
        <aside
          className={`
            fixed inset-y-0 left-0 top-16 z-40 w-64 border-r bg-card transform transition-transform duration-200 ease-in-out
            lg:translate-x-0 lg:static lg:inset-auto
            ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <nav className="flex flex-col gap-1 p-4">
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsNavOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive(item.href)
                        ? 'bg-secondary text-secondary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Overlay for mobile nav */}
      {isNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsNavOpen(false)}
        />
      )}
    </div>
  );
}
