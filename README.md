# Hone - Habit Tracker

A beautiful, modern habit tracking calendar application built with React, TypeScript, and Tailwind CSS. Track your daily habits with an intuitive interface featuring granular heatmaps and year views.

## Features

- 📅 **Calendar Views**: Switch between granular heatmaps (Graph) and daily tracking (Year) views.
- 🎨 **Customizable Habits**: Create habits with custom names, emojis, and colors.
- 🔐 **Secure Authentication**: Custom OTP-based email authentication (powered by Firebase & Nodemailer).
- 👋 **Onboarding Experience**: Interactive tour and welcome flow for new users.
- 🔄 **Cloud Sync**: Real-time data synchronization with Firebase Firestore.
- ⚡ **Optimized Performance**: Built with Vite and React 19 for lightning-fast interactions.
- 📱 **Mobile Responsive**: Fully optimized for mobile devices with touch-friendly interactions.
- 🌙 **Dark UI**: Sleek, dark-themed interface designed for focus.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend**: Firebase Auth, Firestore
- **Serverless**: Vercel Serverless Functions (Node.js) for OTP handling
- **State Management**: React Hooks & Context API
- **Utilities**: `date-fns` (Time), `clsx`/`tailwind-merge` (Styling), `@dnd-kit` (Drag & Drop)
- **Analytics**: Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration (Client)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# SMTP Configuration (Serverless)
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password

# Firebase Service Account (Serverless - JSON String)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Key Workflows

- **Authentication**: Usage of a custom API endpoint `/api/send-otp` to send verification codes via SMTP, bypassing standard Firebase Magic Links for reliability.
- **Onboarding**: New users are guided through a `react-joyride` tour and greeted with a Welcome animation that seeds default habits.
- **Data Model**: Habits are stored in a `habits` collection, and completions are stored in a `habit_logs` collection in Firestore.

## License

MIT
