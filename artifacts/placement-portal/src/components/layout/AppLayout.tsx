import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { Bell, Briefcase, Building, GraduationCap, LayoutDashboard, LogOut, Search, Users } from "lucide-react";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const getLinks = () => {
    switch (user.role) {
      case 'company':
        return [
          { href: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ];
      case 'student':
        return [
          { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/student/postings', label: 'Browse Roles', icon: Search },
          { href: '/student/applications', label: 'My Applications', icon: Briefcase },
        ];
      case 'admin':
        return [
          { href: '/admin/dashboard', label: 'Analytics', icon: LayoutDashboard },
          { href: '/admin/postings', label: 'Postings', icon: Briefcase },
          { href: '/admin/companies', label: 'Companies', icon: Building },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
            U
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">University Placement</h1>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => {
            const isActive = location === link.href || location.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start mt-2 text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-end px-6">
           <NotificationBell />
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function NotificationBell() {
  const { data: notifications } = useListNotifications({ query: { queryKey: ['notifications'] } });
  const markRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-lg rounded-xl overflow-hidden z-50">
          <div className="p-4 border-b border-border font-medium flex items-center justify-between">
            Notifications
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-border last:border-0 text-sm ${!n.read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    if (!n.read) markRead.mutate({ id: n.id });
                  }}
                >
                  <p className="text-foreground mb-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
