import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { Input, Button, Card } from '../components/UI';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Simulated password
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotMsg, setShowForgotMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const success = await login(email);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleDemoLogin = async () => {
    const success = await login('demo@fintrack.app');
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-2xl shadow-xl shadow-emerald-600/10 mx-auto">
          F
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome to FinTrack
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Professional Wealth & Expense Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <Card className="shadow-xl shadow-slate-200/50 dark:shadow-slate-950/40 p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 text-center">
              {error}
            </div>
          )}

          {showForgotMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-400 text-center">
              A simulation reset link was requested. For Local Storage build, try logging in with the demo account!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. you@example.com"
              icon={<Mail className="h-4.5 w-4.5" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-4.5 w-4.5" />}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotMsg(true);
                  setTimeout(() => setShowForgotMsg(false), 5000);
                }}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline outline-none"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Button */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-3xs font-semibold text-slate-400 uppercase tracking-widest">
              or test-drive instantly
            </span>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-semibold text-xs transition-all outline-none"
          >
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
            Explore with Demo Account
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
