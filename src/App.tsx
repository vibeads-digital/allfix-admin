import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { UIProvider } from '@/store/ui-store';
import { TopbarSearchProvider } from '@/store/topbar-search';
import AppShell from '@/components/layout/AppShell';
import { CategoriesPage } from '@/pages/Categories';
import { LanguagesPage } from '@/pages/Languages';
import { CastPage } from '@/pages/Cast';
import { RolesPage } from '@/pages/Roles';
import { CouponsPage } from '@/pages/Coupons';
import { DashboardPage } from '@/pages/Dashboard';
import { HomepagePage } from '@/pages/Homepage';
import { MoviesPage } from '@/pages/Movies';
import { PaymentsPage } from '@/pages/Payments';
import { CollectionsPage } from '@/pages/Collections';
import { PlansPage } from '@/pages/Plans';
import { GatewayConfigPage } from '@/pages/GatewayConfig';
import { SupportContactPage } from '@/pages/SupportContact';
import { InvoiceSettingsPage } from '@/pages/InvoiceSettings';
import { ProfilePage } from '@/pages/Profile';
import { SeriesPage } from '@/pages/Series';
import { SubscriptionsPage } from '@/pages/Subscriptions';
import { UsersPage } from '@/pages/Users';
import Auth from '@/pages/Auth';
import Otp from './pages/otp';
import ForgetPassword from './pages/forget-password';
import RequireAuth from '@/components/auth/RequireAuth';
import PublicOnly from '@/components/auth/PublicOnly';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <TopbarSearchProvider>
          <Routes>
            <Route element={<PublicOnly />}>
              <Route path="/login" element={<Auth />} />
              <Route path="/forget-password" element={<ForgetPassword />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/otp" element={<Otp />} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/movies" element={<MoviesPage />} />
                <Route path="/series" element={<SeriesPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/languages" element={<LanguagesPage />} />
                <Route path="/cast" element={<CastPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/homepage" element={<HomepagePage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route
                  path="/subscriptions"
                  element={<SubscriptionsPage />}
                />
                <Route
                  path="/collections"
                  element={<CollectionsPage />}
                />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/gateway-config" element={<GatewayConfigPage />} />
                <Route path="/support-contact" element={<SupportContactPage />} />
                <Route path="/invoice-settings" element={<InvoiceSettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
          <Toaster richColors theme="dark" position="top-right" />
        </TopbarSearchProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <a
          href="/dashboard"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
