import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';
import { AlertCircle, Mail, Lock, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { getFirebaseErrorMessage } from '../utils/errorMessages';
import { isSignInWithEmailLink, getAuth } from 'firebase/auth';

interface AuthPageProps {
    onComplete?: () => void;
    onSignupSuccess?: () => void;
}

export function AuthPage({ onComplete, onSignupSuccess }: AuthPageProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin, resetPassword, sendOtp, verifyOtp } = useAuth(); // Removed unused signup

    // Verification State
    const [otpSent, setOtpSent] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        if (isSignInWithEmailLink(auth, window.location.href)) {
            // Backward compatibility for existing links if any
        }
    }, []);

    async function handleSignup(e: FormEvent) {
        e.preventDefault();

        if (!email) return setError('Email is required');
        if (password.length < 6) return setError('Password should be at least 6 characters');
        if (password !== confirmPassword) return setError('Passwords do not match');

        try {
            setError('');
            setLoading(true);

            // 1. Send OTP first (Account NOT created yet)
            await sendOtp(email);

            setOtpSent(true);
            setSuccessMessage('Verification code sent');

        } catch (err: unknown) {
            console.error('Signup Error:', err);
            setError(getFirebaseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp(e: FormEvent) {
        e.preventDefault();
        if (otp.length !== 6) return setError('Please enter the 6-digit code');

        try {
            setError('');
            setLoading(true);

            // 2. Verify OTP -> Server creates user -> Returns Success
            const response = await verifyOtp(email, otp, password);

            // SPECIAL HANDLING FOR NEW USERS:
            // Trigger Welcome Page IMMEDIATELY to prevent "flash" of main app
            if (response.isNewUser && onSignupSuccess) {
                onSignupSuccess();
                // We still need to login to establish the session, but the UI is now covered by WelcomePage
                await login(email, password);
                return;
            }

            // 3. Normal Flow (Existing User / Login)
            await login(email, password);

            setSuccessMessage('Email verified successfully!');
            setTimeout(() => {
                if (onComplete) {
                    onComplete();
                }
            }, 500);

        } catch (err: unknown) {
            console.error('OTP Error:', err);
            setError(getFirebaseErrorMessage(err));
        } finally {
            // Only stop loading if we are NOT transitioning to Welcome Page (which unmounts this component)
            // This prevents "state update on unmounted component" warning
            setLoading(false);
        }
    }

    async function handleLogin(e: FormEvent) {
        e.preventDefault();
        if (!email || !password) return setError('Please enter email and password');
        try {
            setError('');
            setLoading(true);
            await login(email, password);
        } catch (err: unknown) {
            console.error('Login Error:', err);
            setError(getFirebaseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        try {
            setError('');
            setSuccessMessage('');
            setLoading(true);
            await googleLogin();
        } catch (err: unknown) {
            setError(getFirebaseErrorMessage(err));
            setLoading(false);
        }
    }

    async function handleForgotPassword() {
        if (!email) {
            return setError('Please enter your email address to reset password');
        }
        try {
            setError('');
            setLoading(true);
            await resetPassword(email);
            setSuccessMessage('Password reset email sent! Check your inbox.');
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
                            src="./favicon_header.png"
                            alt="Hone"
                            className="w-16 h-16 relative z-10 drop-shadow-2xl"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">
                        {otpSent ? 'VERIFY EMAIL' : 'HONE'}
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 tracking-wider uppercase">
                        {otpSent ? 'Code sent to your inbox' : 'Sharpen your habits'}
                    </p>
                </div>

                {/* Auth Form Container */}
                <div className="surface p-6 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">

                    {otpSent ? (
                        // OTP VERIFICATION VIEW
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center p-3 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
                                    <Mail className="w-6 h-6 text-zinc-400" />
                                </div>
                                <p className="text-zinc-400 text-sm">
                                    We sent a 6-digit code to <br />
                                    <span className="text-white font-medium">{email}</span>
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="otp" className="sr-only">Verification Code</label>
                                <input
                                    id="otp"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded text-white text-center text-3xl tracking-[0.5em] placeholder-zinc-800 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-mono shadow-inner"
                                    placeholder="••••••"
                                    autoFocus
                                    autoComplete="one-time-code"
                                />
                                <p className="text-center text-xs text-zinc-600 mt-2">
                                    Enter the 6-digit code from the email
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className={clsx(
                                    "w-full py-3 bg-white text-zinc-950 font-bold rounded uppercase tracking-wide text-sm flex items-center justify-center gap-2",
                                    "hover:bg-zinc-200 active:scale-[0.98] transition-all",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : 'Verify Email'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setOtpSent(false); setError(''); }}
                                className="w-full flex items-center justify-center gap-2 text-zinc-500 text-xs hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Change Email
                            </button>
                        </form>
                    ) : (
                        // LOGIN / SIGNUP VIEW
                        <>

                            <div className="flex gap-2 mb-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(true);
                                        setError('');
                                        setSuccessMessage('');
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
                                        setSuccessMessage('');
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

                            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {successMessage && !otpSent && (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Sparkles className="w-4 h-4 shrink-0" />
                                        <p>{successMessage}</p>
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
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="password" className="block text-sm font-medium text-zinc-400">
                                            Password
                                        </label>
                                        {isLogin && (
                                            <button
                                                type="button"
                                                onClick={handleForgotPassword}
                                                disabled={loading}
                                                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                                            >
                                                Forgot Password?
                                            </button>
                                        )}
                                    </div>
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

                                {!isLogin && (
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-400 mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={loading}
                                                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50"
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>
                                )}

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
                                        <span>
                                            {isLogin ? 'Login' : 'Sign Up'}
                                        </span>
                                    )}
                                </button>
                            </form>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-zinc-800"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors text-white text-sm font-medium"
                            >
                                {/* Google SVG */}
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                        </>
                    )}
                </div>

                <p className="text-center text-zinc-600 text-xs mt-6">
                    {otpSent ? 'Having trouble? Contact use.hone.app@gmail.com' : 'Your data is securely stored with Firebase'}
                </p>
            </div>
        </div>
    );
}
