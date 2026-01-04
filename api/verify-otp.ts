import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Helper to safely get Firebase Admin instance
function getFirebase() {
    if (getApps().length) return { db: getFirestore(), auth: getAuth() };

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
    }

    try {
        const credentials = JSON.parse(serviceAccountJson);
        initializeApp({
            credential: cert(credentials),
        });
        return { db: getFirestore(), auth: getAuth() };
    } catch (e) {
        throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ' + (e as Error).message);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, otp, password } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const { db, auth } = getFirebase();

        const otpDoc = await db.collection('_otps').doc(email).get();

        if (!otpDoc.exists) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const data = otpDoc.data() as { otp: string; expiresAt: number; attempts?: number } | undefined;

        if (!data) {
            return res.status(500).json({ error: 'Internal Server Error: Failed to retrieve data' });
        }

        // 1. Check for Max Attempts (Brute Force Protection)
        if ((data.attempts || 0) >= 3) {
            await db.collection('_otps').doc(email).delete();
            return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
        }

        if (Date.now() > data.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // 2. Validate OTP
        if (!data || data.otp !== otp) {
            // Increment attempts
            await db.collection('_otps').doc(email).update({
                attempts: (data?.attempts || 0) + 1
            });
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP is valid.
        if (password) {
            // FLOW A: Create New User (Verified)
            try {
                const userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    emailVerified: true,
                });

                // Initialize Default Data (Calendar & Habits)
                const defaultCalendar = await db.collection('calendars').add({
                    userId: userRecord.uid,
                    name: 'My Calendar',
                    order: 0,
                    createdAt: new Date(),
                });

                const defaultHabits = [
                    { name: 'Work', emoji: '💼', color: '#667eea' },
                    { name: 'Exercise', emoji: '💪', color: '#f5576c' },
                    { name: 'Reading', emoji: '📚', color: '#4facfe' },
                    { name: 'Code', emoji: '💻', color: '#00f2fe' },
                ];

                const batch = db.batch();

                // 1. Create Default Habits
                defaultHabits.forEach((habit, index) => {
                    const habitRef = db.collection('habits').doc();
                    batch.set(habitRef, {
                        userId: userRecord.uid,
                        calendarId: defaultCalendar.id,
                        name: habit.name,
                        emoji: habit.emoji,
                        color: habit.color,
                        order: index,
                        createdAt: new Date(),
                    });
                });

                // 2. Cleanup Used OTP (Atomic with creation)
                batch.delete(db.collection('_otps').doc(email));

                await batch.commit();

            } catch (createError: unknown) {
                const firebaseError = createError as { code?: string };
                if (firebaseError.code === 'auth/email-already-exists') {
                    return res.status(400).json({ error: 'Email already currently in use' });
                }
                throw createError;
            }
        } else {
            // FLOW B: Verify Existing User (Legacy/Link flow fallback)
            const userRecord = await auth.getUserByEmail(email);

            // Parallelize update and delete
            await Promise.all([
                auth.updateUser(userRecord.uid, { emailVerified: true }),
                db.collection('_otps').doc(email).delete()
            ]);
        }

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            isNewUser: !!password // true if password provided (Flow A), false otherwise
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        return res.status(500).json({ error: 'Verification failed' });
    }
}
