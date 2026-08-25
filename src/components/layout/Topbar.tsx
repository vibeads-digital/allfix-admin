import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logout } from "@/lib/api/auth";
import { useAdminAuth, ADMIN_ME_KEY } from "@/hooks/useAdminAuth";
import {
  Search,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { useTopbarSearchSlot } from '@/store/topbar-search';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/store/ui-store';
import { ALL_NAV_ITEMS } from '@/data/nav';

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, i) => {
    const to = '/' + segments.slice(0, i + 1).join('/');
    const match = ALL_NAV_ITEMS.find((n) => n.to === to);
    return { label: match?.title ?? seg.replace(/-/g, ' '), to };
  });
}

export function Topbar() {
  const { theme, toggleTheme } = useUIStore();
  const crumbs = useBreadcrumbs();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin } = useAdminAuth();
  const { config: searchConfig } = useTopbarSearchSlot();

  const initials = (admin?.fullname ?? admin?.email ?? "A")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // cookie may already be invalid — proceed to clear local state regardless
    }
    queryClient.removeQueries({ queryKey: ADMIN_ME_KEY });
    toast.success("Signed out");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full px-4 lg:px-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:gap-6">
        <div className="min-w-0 flex items-center gap-3">
          <MobileSidebar />
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center text-sm min-w-0"
          >
            {crumbs.length === 0 ? (
              <span className="text-muted-foreground">Home</span>
            ) : (
              crumbs.map((c, i) => (
                <span key={c.to} className="flex items-center min-w-0">
                  {i > 0 && (
                    <span className="mx-2 text-muted-foreground/50">/</span>
                  )}
                  <span
                    className={
                      i === crumbs.length - 1
                        ? 'font-semibold text-foreground capitalize truncate'
                        : 'text-muted-foreground capitalize truncate'
                    }
                  >
                    {c.label}
                  </span>
                </span>
              ))
            )}
          </nav>

          <div className="relative flex-1 max-w-md ml-auto md:ml-6">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchConfig?.value ?? ""}
              onChange={(e) => searchConfig?.onChange(e.target.value)}
              disabled={!searchConfig}
              placeholder={searchConfig?.placeholder ?? "No search on this page"}
              className="pl-9 h-9 bg-muted/40 border-border/60 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-accent transition-colors"
                aria-label="User menu"
              >
                <Avatar className="size-8">
                  {admin?.avatar && <AvatarImage src={admin.avatar} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-semibold leading-tight">
                    {admin?.fullname ?? admin?.email ?? "Admin"}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {admin?.email}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserIcon className="size-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="size-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

