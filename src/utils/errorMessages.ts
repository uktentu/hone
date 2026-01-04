export function getFirebaseErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code || '';
    const messages: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/too-many-requests': 'Too many attempts. Try again later',
        'auth/network-request-failed': 'Network error. Check your connection',
        'auth/operation-not-allowed': 'Email Link sign-in is not enabled in Firebase Console',
        'auth/unauthorized-continue-uri': 'Domain not authorized in Firebase Console',
        'auth/missing-android-pkg-name': 'Android package name missing',
        'auth/missing-continue-uri': 'Continue URL missing',
        'auth/missing-ios-bundle-id': 'iOS Bundle ID missing',
        'auth/invalid-continue-uri': 'Invalid Continue URL',
        'auth/unauthorized-domain': 'App domain not authorized in Firebase Console',
    };
    return messages[code] || 'Authentication failed. Please try again';
}
