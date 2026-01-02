import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';
import { AlertCircle, Mail, Lock, Sparkles } from 'lucide-react';
import { getFirebaseErrorMessage } from '../utils/errorMessages';

export function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, login } = useAuth();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (!email || !password) {
            return setError('Please fill in all fields');
        }

        if (password.length < 6) {
            return setError('Password should be at least 6 characters');
        }

        if (!isLogin && password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
        } catch (err: unknown) {
            setError(getFirebaseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="flex flex-col items-center mb-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-150 animate-pulse" />
                        <img
                            src="./favicon.png"
                            alt="Hone"
                            className="w-16 h-16 relative z-10 drop-shadow-2xl"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">HONE</h1>
                    <p className="text-xs text-zinc-500 mt-1 tracking-wider uppercase">Sharpen your habits</p>
                </div>

                {/* Auth Form */}
                <div className="surface p-6 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="flex gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(true);
                                setError('');
                                setConfirmPassword('');
                            }}
                            className={clsx(
                                "flex-1 py-2 px-4 rounded font-medium transition-all text-sm uppercase tracking-wide",
                                isLogin
                                    ? "bg-white text-zinc-950"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            )}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(false);
                                setError('');
                            }}
                            className={clsx(
                                "flex-1 py-2 px-4 rounded font-medium transition-all text-sm uppercase tracking-wide",
                                !isLogin
                                    ? "bg-white text-zinc-950"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            )}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50"
                                    placeholder="••••••••"
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={clsx(
                                "w-full py-3 px-4 bg-white text-zinc-950 font-bold rounded uppercase tracking-wide text-sm mt-6",
                                "hover:bg-zinc-200 active:scale-[0.98] transition-all",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100",
                                "flex items-center justify-center gap-2"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Sparkles className="w-4 h-4 animate-spin" />
                                    <span>Please wait...</span>
                                </>
                            ) : (
                                <span>{isLogin ? 'Login' : 'Create Account'}</span>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-600 text-xs mt-6">
                    Your data is securely stored with Firebase
                </p>
            </div>
        </div>
    );
}
