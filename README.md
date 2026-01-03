# Hone - Habit Tracker

A beautiful, modern habit tracking calendar application built with React, TypeScript, and Tailwind CSS. Track your daily habits with an intuitive interface featuring month and year views.

## Features

- 📅 **Calendar Views**: Switch between month and year views to track your habits
- 🎨 **Customizable Habits**: Create habits with custom names, emojis, and colors
- �️ **Drag & Drop**: Reorder habits and calendars with ease
- ☁️ **Cloud Sync**: Real-time data synchronization with Firebase
- 🌙 **Dark Theme**: Beautiful dark theme with glassmorphism design
- 📱 **Responsive**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast & Smooth**: Built with Vite for lightning-fast performance
- 🖼️ **Splash Screen**: Elegant startup animation with version display

## Getting Started

### Prerequisites

- Node.js 18+ and npm

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

## Usage

1. **Create a Habit**: Click the "+" button in the sidebar to add a new habit
2. **Select a Habit**: Click on a habit in the sidebar to view its tracking calendar
3. **Mark Complete**: Click on any day in the calendar to mark a habit as complete
4. **Reorder**: Drag and drop habits or calendars to customize their order
5. **Edit/Delete**: Use the edit and delete buttons that appear when hovering over a habit
6. **Switch Views**: Toggle between Month and Year views using the buttons in the header

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Firebase** - Backend & Database
- **@dnd-kit** - Drag & Drop interactions
- **date-fns** - Date utilities
- **lucide-react** - Icons

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── types.ts       # TypeScript type definitions
├── App.tsx        # Main app component
└── main.tsx       # Entry point
```

## License

MIT
