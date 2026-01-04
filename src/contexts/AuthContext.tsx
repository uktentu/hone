import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    linkWithPopup,
    unlink,
    sendPasswordResetEmail,
    updatePassword,
    sendEmailVerification,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    googleLogin: () => Promise<void>;
    linkGoogle: () => Promise<void>;
    unlinkProvider: (providerId: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserPassword: (password: string) => Promise<void>;
    verifyEmail: () => Promise<void>;
    sendLoginLink: (email: string) => Promise<void>;
    completeLoginWithLink: (email: string, href: string) => Promise<void>;
    reauthenticateUser: (password: string) => Promise<void>;
    sendOtp: (email: string) => Promise<void>;
    verifyOtp: (email: string, otp: string, password?: string) => Promise<{ success: boolean; isNewUser?: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    async function signup(email: string, password: string) {
        await createUserWithEmailAndPassword(auth, email, password);
    }

    async function login(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email, password);
    }

    async function logout() {
        await signOut(auth);
    }

    async function googleLogin() {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    }

    async function linkGoogle() {
        if (!currentUser) return;
        const provider = new GoogleAuthProvider();
        await linkWithPopup(currentUser, provider);
    }

    async function unlinkProvider(providerId: string) {
        if (!currentUser) return;
        await unlink(currentUser, providerId);
    }

    async function resetPassword(email: string) {
        await sendPasswordResetEmail(auth, email);
    }

    async function updateUserPassword(password: string) {
        if (!currentUser) throw new Error('No authenticated user found');
        await updatePassword(currentUser, password);
    }

    async function verifyEmail() {
        if (!currentUser) return;
        await sendEmailVerification(currentUser);
    }

    async function sendLoginLink(email: string) {
        const actionCodeSettings = {
            url: window.location.origin, // Redirect back to usage root
            handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
    }

    async function completeLoginWithLink(email: string, href: string) {
        if (isSignInWithEmailLink(auth, href)) {
            await signInWithEmailLink(auth, email, href);
            window.localStorage.removeItem('emailForSignIn');
        }
    }

    async function reauthenticateUser(password: string) {
        if (!currentUser || !currentUser.email) throw new Error('No user to reauthenticate');
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    async function sendOtp(email: string) {
        const res = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to send OTP');
        }
    }

    async function verifyOtp(email: string, otp: string, password?: string) {
        const res = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to verify OTP');
        }
        // Force refresh token to update emailVerified status
        if (currentUser) {
            await currentUser.reload();
            setCurrentUser({ ...auth.currentUser! }); // Trigger re-render
        }
        return data;
    }

    const value: AuthContextType = {
        currentUser,
        loading,
        signup,
        login,
        logout,
        googleLogin,
        linkGoogle,
        unlinkProvider,
        resetPassword,
        updateUserPassword,
        verifyEmail,
        sendLoginLink,
        completeLoginWithLink,
        reauthenticateUser,
        sendOtp,
        verifyOtp,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
