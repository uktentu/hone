import { randomInt } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Helper to safely get Firebase Admin instance
function getFirebase() {
    if (getApps().length) return getFirestore();

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
    }

    try {
        const credentials = JSON.parse(serviceAccountJson);
        initializeApp({
            credential: cert(credentials),
        });
        return getFirestore();
    } catch (e) {
        throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ' + (e as Error).message);
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers for local dev if needed (Vercel dev handles this usually, but good to be safe)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!process.env.SMTP_EMAIL) throw new Error('Missing SMTP_EMAIL env var');
        if (!process.env.SMTP_PASSWORD) throw new Error('Missing SMTP_PASSWORD env var');

        const db = getFirebase(); // Init here to catch errors safely

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Rate Limiting (Max 1 request per 60s)
        const otpRef = db.collection('_otps').doc(email);
        const existingDoc = await otpRef.get();

        if (existingDoc.exists) {
            const data = existingDoc.data();
            const lastSent = data?.createdAt?.toDate().getTime() || 0;
            if (Date.now() - lastSent < 60000) { // 60 seconds
                return res.status(429).json({ error: 'Please wait 1 minute before requesting another code.' });
            }
        }

        // 2. Secure RNG (6 digits)
        const otp = randomInt(100000, 1000000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP and Send Email in parallel for speed
        await Promise.all([
            otpRef.set({
                otp,
                expiresAt,
                createdAt: FieldValue.serverTimestamp(),
                attempts: 0, // Reset attempts on new code
            }),
            transporter.sendMail({
                from: `"Hone App" <hone@usehone.qzz.io>`,
                replyTo: 'hone@usehone.qzz.io',
                to: email,
                subject: 'Your Verification Code',
                text: `Your verification code is: ${otp}\n\nIt expires in 10 minutes.`,
                html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
                    <div style="max-width: 450px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; text-align: center; border: 1px solid #e4e4e7;">
                        <h2 style="color: #18181b; margin-bottom: 20px;">Hone Verification</h2>
                        <p style="color: #52525b; font-size: 16px; margin-bottom: 30px;">
                            Here is your code to complete signup:
                        </p>
                        <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; display: inline-block; letter-spacing: 5px; font-size: 24px; font-weight: bold; color: #18181b;">
                            ${otp}
                        </div>
                        <p style="color: #a1a1aa; font-size: 12px; margin-top: 30px;">
                            Expires in 10 minutes. Ignore if you didn't request this.
                        </p>
                    </div>
                </body>
                </html>
            `,
            })
        ]);

        return res.status(200).json({ success: true, message: 'OTP sent' });

    } catch (error: unknown) {
        console.error('Send OTP Error:', error);
        const err = error as Error;
        return res.status(500).json({
            error: 'Failed to send OTP',
            details: err.message,
            stack: err.stack
        });
    }
}
