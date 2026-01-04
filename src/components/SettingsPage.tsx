import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Link as LinkIcon, AlertCircle, CheckCircle, Shield, ArrowLeft, LogOut, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface SettingsPageProps {
    onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
    const { currentUser, linkGoogle, unlinkProvider, resetPassword, updateUserPassword, logout, reauthenticateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);

    // Password Update State
    const [showUpdatePassword, setShowUpdatePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const providers = currentUser?.providerData || [];
    const isGoogleLinked = providers.some(p => p.providerId === 'google.com');
    const isEmailLinked = providers.some(p => p.providerId === 'password');
    const canUnlink = providers.length > 1;

    // ... (Link/Unlink handlers remain same)

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
        setMessage(null);

        if (!currentPassword) {
            setMessage({ type: 'error', text: 'Please enter your current password.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
            return;
        }

        setIsLoading(true);
        try {
            // Verify current password first
            await reauthenticateUser(currentPassword);

            // If verification successful, update to new password
            await updateUserPassword(newPassword);
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowUpdatePassword(false);
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Update password error:', err);
            const msg = err.message.includes('auth/invalid-credential')
                ? 'Incorrect current password.'
                : 'Failed to update password. ' + err.message;
            setMessage({ type: 'error', text: msg });
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
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">

                        {isEmailLinked && (
                            <div className="border-b border-zinc-800">
                                <button
                                    onClick={() => setShowUpdatePassword(!showUpdatePassword)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                                            <Lock size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-white">Password</p>
                                            <p className="text-xs text-zinc-500">Change your account password</p>
                                        </div>
                                    </div>
                                    <ChevronRight className={clsx("w-5 h-5 text-zinc-600 transition-transform", showUpdatePassword && "rotate-90")} />
                                </button>

                                {showUpdatePassword && (
                                    <form onSubmit={handleUpdatePassword} className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                                            <input
                                                type="password"
                                                placeholder="Current Password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-white outline-none transition-all"
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    type="password"
                                                    placeholder="New Password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-white outline-none transition-all"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="Confirm Password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-white outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading || !newPassword || !currentPassword}
                                                    className="px-4 py-2 bg-white text-black text-sm font-bold rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Reset Password Email Option */}
                        <div className="border-b border-zinc-800">
                            <button
                                onClick={handlePasswordReset}
                                disabled={isLoading}
                                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                                        <Shield size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-white">Reset Password</p>
                                        <p className="text-xs text-zinc-500">Send a password reset email</p>
                                    </div>
                                </div>
                            </button>
                        </div>


                        {/* Sign Out */}
                        <div className="p-1">
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium text-sm"
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
