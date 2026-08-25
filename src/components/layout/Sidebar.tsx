import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, PlayCircle } from 'lucide-react';
import { NAV_GROUPS } from '@/data/nav';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export function SidebarNavContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.to || pathname.startsWith(item.to + '/');
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.title : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          active && 'text-primary',
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                      {active && !collapsed && (
                        <span className="ml-auto size-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

export function SidebarBrand({
  collapsed = false,
  toggle,
}: {
  collapsed?: boolean;
  toggle?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
      <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_15)] grid place-items-center shrink-0 shadow-lg shadow-primary/20">
        <PlayCircle className="size-5 text-primary-foreground" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight truncate">
            AllFLix
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Admin Console
          </div>
        </div>
      )}
      {toggle && (
        <button
          onClick={toggle}
          aria-label="Toggle sidebar"
          className="ml-auto size-7 grid place-items-center rounded-md hover:bg-sidebar-accent text-muted-foreground"
        >
          <ChevronLeft
            className={cn(
              'size-4 transition-transform',
              collapsed && 'rotate-180',
            )}
          />
        </button>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar: toggle } = useUIStore();

  return (
    <aside
      className={cn(
        'hidden lg:flex h-dvh sticky top-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      <SidebarBrand collapsed={collapsed} toggle={toggle} />
      <SidebarNavContent collapsed={collapsed} />
    </aside>
  );
}
