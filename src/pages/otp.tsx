import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendVerificationOtp, verifyOtp } from '@/lib/api/auth';
import { useAdminAuth, ADMIN_ME_KEY } from '@/hooks/useAdminAuth';

export default function Otp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin } = useAdminAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const sentOnMount = useRef(false);

  const sendOtp = useMutation({
    mutationFn: () => sendVerificationOtp('email'),
    onSuccess: () => toast.success('OTP sent to your email'),
    onError: (err: Error) => toast.error(err.message),
  });

  const verify = useMutation({
    mutationFn: (emailOtp: string) => verifyOtp({ emailOtp }),
    onSuccess: () => {
      toast.success('Email verified');
      queryClient.invalidateQueries({ queryKey: ADMIN_ME_KEY });
      navigate('/dashboard');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    if (sentOnMount.current) return;
    sentOnMount.current = true;
    sendOtp.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = () => {
    verify.mutate(otp.join(''));
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
      .split('');
    const next = [...otp];
    pasted.forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
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
          <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white/[0.08]" />
          <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-white/[0.06]" />
          <div
            className="absolute top-[45%] left-[30%] w-44 h-44 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', filter: 'blur(20px)' }}
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
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow:
                  '0 4px 16px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <h1
              className="text-3xl font-extrabold text-white leading-tight mb-3"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
            >
              One-time
              <br />
              verification
            </h1>
            <p className="text-sky-100/90 text-sm leading-relaxed max-w-xs">
              We sent a 6-digit code to your email. Enter it to verify your
              identity and continue.
            </p>

            <div className="mt-8 space-y-3">
              {[
                {
                  icon: (
                    <svg
                      className="w-4 h-4 text-sky-300 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                  text: 'Code expires in 15 minutes',
                },
                {
                  icon: (
                    <svg
                      className="w-4 h-4 text-sky-300 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  ),
                  text: 'Check your spam folder too',
                },
                {
                  icon: (
                    <svg
                      className="w-4 h-4 text-sky-300 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ),
                  text: 'You can request a new code after 60s',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.icon}
                  <p className="text-sky-100/90 text-sm">{item.text}</p>
                </div>
              ))}
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
            <p className="text-white/90 text-sm leading-relaxed">
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

            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '1px solid #fecaca',
              }}
            >
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
              Enter your code
            </h2>
            <p className="text-sm text-slate-500 mb-7 leading-relaxed">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-slate-700">
                {admin?.email ?? 'your email'}
              </span>
            </p>

            {/* OTP inputs — 6 fixed small boxes */}
            <div className="flex gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    width: '42px',
                    height: '42px',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#0f172a',
                    border: `1.5px solid ${digit ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    outline: 'none',
                    background: digit ? '#fff' : '#f8fafc',
                    boxShadow: digit
                      ? '0 0 0 3px rgba(239,68,68,0.12)'
                      : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#38bdf8';
                    e.currentTarget.style.boxShadow =
                      '0 0 0 3px rgba(14,165,233,0.15)';
                    e.currentTarget.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = digit
                      ? '#ef4444'
                      : '#e2e8f0';
                    e.currentTarget.style.boxShadow = digit
                      ? '0 0 0 3px rgba(239,68,68,0.12)'
                      : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 3px rgba(0,0,0,0.04)';
                    e.currentTarget.style.background = digit
                      ? '#fff'
                      : '#f8fafc';
                  }}
                />
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleVerify}
              disabled={verify.isPending || otp.join('').length !== 6}
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
              {verify.isPending ? 'Verifying…' : 'Verify & continue'}
            </button>

            {/* Resend */}
            <div className="mt-5 text-center">
              <p className="text-sm text-slate-500">
                Didn't receive it?{' '}
                <button
                  onClick={() => sendOtp.mutate()}
                  disabled={sendOtp.isPending}
                  className="font-semibold text-red-500 hover:text-red-600 transition-colors duration-200 disabled:opacity-60"
                >
                  Resend code
                </button>
              </p>
            </div>

            {/* Back to dashboard */}
            <Link
              to="/dashboard"
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to dashboard
            </Link>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
              By continuing you agree to our{' '}
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
