import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { loginWithEmail, loginWithGoogle } from '@/lib/api/auth';
import { ADMIN_ME_KEY } from '@/hooks/useAdminAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

export default function Auth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const onLoginSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ADMIN_ME_KEY });
    navigate('/dashboard');
  };

  const emailLogin = useMutation({
    mutationFn: () => loginWithEmail(email, password),
    onSuccess: onLoginSuccess,
    onError: (err: Error) => toast.error(err.message),
  });

  const googleLogin = useMutation({
    mutationFn: (idToken: string) => loginWithGoogle(idToken),
    onSuccess: onLoginSuccess,
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (resp) => googleLogin.mutate(resp.credential),
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 343,
      });
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    emailLogin.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div
        className="flex w-full max-w-4xl rounded-3xl overflow-hidden"
        style={{
          boxShadow:
            '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.12), 0 48px 96px rgba(14,120,200,0.10)',
        }}
      >
        {/* ── Left Panel ── */}
        <div
          className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10 relative overflow-hidden"
          style={{
            background:
              'linear-gradient(145deg, #0ea5e9 0%, #0369a1 60%, #0c4a6e 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white/[0.08]" />
          <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-white/[0.06]" />
          <div
            className="absolute top-[45%] left-[30%] w-44 h-44 rounded-full"
            style={{
              background: 'rgba(239,68,68,0.15)',
              filter: 'blur(20px)',
            }}
          />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center"
              style={{
                boxShadow:
                  '0 2px 8px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              AllFLix
            </span>
          </div>

          {/* Center content */}
          <div className="relative z-10">
            <h1
              className="text-3xl font-extrabold text-white leading-tight mb-3"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
            >
              Welcome back.
              <br />
              Let's get you in.
            </h1>
            <p className="text-sky-100/90 text-sm leading-relaxed max-w-xs">
              Access your dashboard, track progress, and stay in control — all
              in one place.
            </p>

            {/* Stats */}
            <div className="mt-8 flex gap-5">
              <div>
                <p className="text-white font-extrabold text-xl">98%</p>
                <p className="text-sky-200/85 text-xs mt-0.5">Uptime</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-white font-extrabold text-xl">50K+</p>
                <p className="text-sky-200/85 text-xs mt-0.5">Users</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-white font-extrabold text-xl">4.9★</p>
                <p className="text-sky-200/85 text-xs mt-0.5">Rated</p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div
            className="relative z-10 rounded-2xl p-5 border border-white/20"
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              boxShadow:
                '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <p className="text-white/92 text-sm leading-relaxed">
              "AllFLix cut our workflow time in half. The dashboard is clean,
              fast, and just works."
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center text-white font-bold text-sm"
                style={{ boxShadow: '0 2px 8px rgba(248,113,113,0.5)' }}
              >
                S
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Sara K.</p>
                <p className="text-sky-200/75 text-xs">
                  Product Manager, Arkit
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div
          className="flex-1 bg-white flex items-center justify-center px-8 py-14"
          style={{ boxShadow: 'inset 4px 0 32px rgba(14,120,200,0.04)' }}
        >
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-gray-900">AllFLix</span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Sign in
            </h2>

            {/* Google button — rendered by Google Identity Services */}
            <div
              className="w-full flex justify-center mb-5"
              ref={googleBtnRef}
            />

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">
                or sign in with email
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                  style={{
                    boxShadow:
                      '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/forget-password"
                    className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                    style={{
                      boxShadow:
                        '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2 mb-5">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 accent-red-500 cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-slate-500 cursor-pointer"
                >
                  Keep me signed in for 30 days
                </label>
                {/* Info icon with tooltip */}
                <div className="relative flex items-center group">
                  <svg
                    className="w-4 h-4 text-slate-400 hover:text-sky-500 cursor-pointer transition-colors duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line
                      x1="12"
                      y1="8"
                      x2="12"
                      y2="8"
                      strokeLinecap="round"
                      strokeWidth={2.5}
                    />
                    <line
                      x1="12"
                      y1="12"
                      x2="12"
                      y2="16"
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Tooltip */}
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-56 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 group-hover:-translate-y-0.5 translate-y-0"
                    style={{ zIndex: 50 }}
                  >
                    <div
                      className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2.5 leading-relaxed text-center"
                      style={{
                        boxShadow:
                          '0 4px 16px rgba(0,0,0,0.20), 0 8px 32px rgba(0,0,0,0.12)',
                      }}
                    >
                      <span className="font-semibold text-sky-300">
                        Not checked?
                      </span>{' '}
                      You'll be automatically logged out after{' '}
                      <span className="font-semibold text-white">3 hours</span>{' '}
                      of inactivity.
                      {/* Arrow */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                        style={{
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid #1e293b',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={emailLogin.isPending}
                className="w-full text-white text-sm font-bold rounded-2xl py-3.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: '#ef4444',
                  boxShadow:
                    '0 2px 4px rgba(239,68,68,0.25), 0 6px 20px rgba(239,68,68,0.40), 0 12px 40px rgba(239,68,68,0.20), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.boxShadow =
                    '0 4px 8px rgba(239,68,68,0.30), 0 10px 32px rgba(239,68,68,0.50), 0 20px 60px rgba(239,68,68,0.20), inset 0 1px 0 rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.boxShadow =
                    '0 2px 4px rgba(239,68,68,0.25), 0 6px 20px rgba(239,68,68,0.40), 0 12px 40px rgba(239,68,68,0.20), inset 0 1px 0 rgba(255,255,255,0.18)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                  e.currentTarget.style.boxShadow =
                    '0 2px 8px rgba(239,68,68,0.3)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
              >
                {emailLogin.isPending ? 'Signing in…' : 'Sign in to AllFLix'}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
              By signing in you agree to our{' '}
              <a
                href="#"
                className="underline hover:text-slate-600 transition-colors"
              >
                Terms
              </a>{' '}
              and{' '}
              <a
                href="#"
                className="underline hover:text-slate-600 transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
