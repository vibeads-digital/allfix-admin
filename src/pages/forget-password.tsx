import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendForgotPasswordOtp, resetPassword } from '@/lib/api/auth';

export default function ForgetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const sendOtp = useMutation({
    mutationFn: () => sendForgotPasswordOtp(email),
    onSuccess: () => {
      toast.success('OTP sent to your email');
      setStep('reset');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reset = useMutation({
    mutationFn: () => resetPassword(email, otp, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully — please sign in');
      navigate('/login');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    sendOtp.mutate();
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    reset.mutate();
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
            {/* Lock icon illustration */}
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h1
              className="text-3xl font-extrabold text-white leading-tight mb-3"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
            >
              Forgot your
              <br />
              password?
            </h1>
            <p className="text-sky-100/90 text-sm leading-relaxed max-w-xs">
              No worries — it happens to the best of us. Enter your email and
              we'll send you a reset link right away.
            </p>

            {/* Steps */}
            <div className="mt-8 space-y-4">
              {[
                { num: '1', label: 'Enter your email address' },
                { num: '2', label: 'Check your inbox for the link' },
                { num: '3', label: 'Set a new password' },
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-sky-900 flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.90)' }}
                  >
                    {step.num}
                  </div>
                  <p className="text-sky-100/90 text-sm">{step.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom note */}
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
              "Reset links expire after{' '}
              <span className="font-bold text-white">15 minutes</span> for your
              security. Didn't get the email? Check your spam folder."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-sky-300"
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
              <p className="text-sky-200/80 text-xs">
                Your account stays secure throughout this process
              </p>
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
              Reset password
            </h2>
            <p className="text-sm text-slate-500 mb-7 leading-relaxed">
              {step === 'email' ? (
                "We'll email you a 6-digit code to reset your password."
              ) : (
                <>
                  Enter the code sent to{' '}
                  <span className="font-semibold text-slate-700">{email}</span>{' '}
                  and choose a new password.
                </>
              )}
            </p>

            {step === 'email' ? (
              <form onSubmit={handleSendOtp}>
                {/* Email */}
                <div className="mb-5">
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sendOtp.isPending}
                  className="w-full text-white text-sm font-bold rounded-2xl py-3.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: '#ef4444',
                    boxShadow:
                      '0 2px 4px rgba(239,68,68,0.25), 0 6px 20px rgba(239,68,68,0.40), 0 12px 40px rgba(239,68,68,0.20), inset 0 1px 0 rgba(255,255,255,0.18)',
                  }}
                >
                  {sendOtp.isPending ? 'Sending…' : 'Send reset code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleReset}>
                {/* OTP */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                    style={{
                      boxShadow:
                        '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  />
                </div>

                {/* New password */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                    style={{
                      boxShadow:
                        '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={reset.isPending}
                  className="w-full text-white text-sm font-bold rounded-2xl py-3.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: '#ef4444',
                    boxShadow:
                      '0 2px 4px rgba(239,68,68,0.25), 0 6px 20px rgba(239,68,68,0.40), 0 12px 40px rgba(239,68,68,0.20), inset 0 1px 0 rgba(255,255,255,0.18)',
                  }}
                >
                  {reset.isPending ? 'Resetting…' : 'Reset password'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="mt-3 w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Use a different email
                </button>
              </form>
            )}

            {/* Back to login */}
            <Link
              to="/login"
              className="mt-5 w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors duration-200"
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
              Back to sign in
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
