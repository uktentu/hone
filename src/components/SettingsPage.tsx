import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Link as LinkIcon, AlertCircle, CheckCircle, Shield, ArrowLeft, LogOut } from 'lucide-react';
import clsx from 'clsx';

interface SettingsPageProps {
    onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
    const { currentUser, linkGoogle, unlinkProvider, resetPassword, updateUserPassword, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);

    // Password Update State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const providers = currentUser?.providerData || [];
    const isGoogleLinked = providers.some(p => p.providerId === 'google.com');
    const isEmailLinked = providers.some(p => p.providerId === 'password');
    const canUnlink = providers.length > 1;

    const handleLinkGoogle = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            await linkGoogle();
            setMessage({ type: 'success', text: 'Google account linked successfully!' });
        } catch (error: unknown) {
            const err = error as Error;
            setMessage({ type: 'error', text: 'Failed to link Google account. ' + err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlink = async (providerId: string) => {
        setIsLoading(true);
        setMessage(null);
        try {
            await unlinkProvider(providerId);
            setMessage({ type: 'success', text: 'Account unlinked successfully.' });
            setConfirmUnlink(null);
        } catch (error: unknown) {
            const err = error as Error;
            setMessage({ type: 'error', text: 'Failed to unlink account. ' + err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!currentUser?.email) return;
        setIsLoading(true);
        setMessage(null);
        try {
            await resetPassword(currentUser.email);
            setMessage({ type: 'success', text: 'Password reset email sent!' });
        } catch (error: unknown) {
            const err = error as Error;
            setMessage({ type: 'error', text: 'Failed to send reset email. ' + err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);
        try {
            await updateUserPassword(newPassword);
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            setMessage({ type: 'error', text: 'Failed to update password. You may need to re-login first.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-zinc-950 p-4 md:p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 hover:bg-zinc-900 rounded-full text-zinc-400 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
                        <p className="text-sm text-zinc-400">Manage your account and preferences</p>
                    </div>
                </div>

                {message && (
                    <div className={clsx(
                        "p-4 rounded-lg flex items-center gap-3 text-sm",
                        message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                    )}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {message.text}
                    </div>
                )}

                {/* Profile Section */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Profile</h2>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                            <span className="text-xl font-bold">{currentUser?.email?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{currentUser?.email}</p>
                            <p className="text-xs text-zinc-500">Account ID: {currentUser?.uid}</p>
                        </div>
                    </div>
                </section>

                {/* Connected Accounts */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Connected Accounts</h2>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
                        {/* Google */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-lg">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Google</p>
                                    <p className="text-xs text-zinc-500">{isGoogleLinked ? 'Connected' : 'Not connected'}</p>
                                </div>
                            </div>
                            {isGoogleLinked ? (
                                canUnlink && (
                                    confirmUnlink === 'google.com' ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setConfirmUnlink(null)}
                                                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUnlink('google.com')}
                                                disabled={isLoading}
                                                className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50 rounded text-xs transition-colors"
                                            >
                                                Confirm Unlink
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmUnlink('google.com')}
                                            className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                                            title="Unlink Google"
                                        >
                                            <LinkIcon size={16} className="rotate-45" />
                                        </button>
                                    )
                                )
                            ) : (
                                <button
                                    onClick={handleLinkGoogle}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded transition-colors"
                                >
                                    Connect
                                </button>
                            )}
                        </div>

                        {/* Email */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Email & Password</p>
                                    <p className="text-xs text-zinc-500">{isEmailLinked ? 'Enabled' : 'Not set'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Security</h2>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
                        {isEmailLinked && (
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                    <Lock size={16} /> Update Password
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-white outline-none transition-all"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-white outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !newPassword}
                                    className="px-4 py-2 bg-white text-black text-sm font-bold rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Update Password
                                </button>
                            </form>
                        )}

                        <div className="border-t border-zinc-800 pt-6">
                            <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                <Shield size={16} /> Account Actions
                            </h3>
                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                disabled={isLoading}
                                className="block w-full text-left text-sm text-zinc-400 hover:text-white underline decoration-zinc-700 underline-offset-4 transition-colors p-0 mb-4"
                            >
                                Send Password Reset Email
                            </button>

                            <button
                                type="button"
                                onClick={logout}
                                className="flex items-center gap-2 w-full px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50 rounded font-medium text-sm transition-colors"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
