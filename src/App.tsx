import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { Calendar } from './components/Calendar';
import { SettingsPage } from './components/SettingsPage';
import { SplashScreen } from './components/SplashScreen';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isSignInWithEmailLink, getAuth } from 'firebase/auth';
import { useHabits } from './hooks/useHabits';

import { OnboardingTour } from './components/OnboardingTour';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<'calendar' | 'settings'>('calendar');
  const [completingSignup, setCompletingSignup] = useState(() => {
    return isSignInWithEmailLink(getAuth(), window.location.href);
  });

  const {
    habitData,
    calendarData,
    selection,
    actions
  } = useHabits();

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!currentUser || completingSignup) {
    return <AuthPage onComplete={() => {
      // Clear sensitive URL parameters (oobCode, apiKey, etc.) from the address bar
      window.history.replaceState(null, '', window.location.pathname);
      setCompletingSignup(false);
    }} />;
  }

  return (
    <Layout>
      <OnboardingTour />
      <Sidebar
        habits={habitData.habits}
        calendars={calendarData.calendars}
        selectedCalendarId={calendarData.selectedCalendarId}
        onSelectCalendar={calendarData.selectCalendar}
        onAddCalendar={calendarData.addCalendar}
        onEditCalendar={calendarData.editCalendar}
        onDeleteCalendar={calendarData.deleteCalendar}
        onReorderCalendars={calendarData.reorderCalendars}
        onAddHabit={actions.addHabit}
        onEditHabit={actions.editHabit}
        onDeleteHabit={actions.deleteHabit}
        onReorderHabits={actions.reorderHabits}
        onSelectHabit={selection.toggleHabitSelection}
        selectedHabitIds={selection.selectedHabitIds}
        currentView={currentView}
        onNavigate={setCurrentView}
      />
      {currentView === 'settings' ? (
        <SettingsPage onBack={() => setCurrentView('calendar')} />
      ) : (
        <Calendar
          habits={habitData.habits}
          selectedHabitIds={selection.selectedHabitIds}
          selectedHabitStats={selection.selectedHabitStats}
          onToggleHabit={actions.toggleHabitForDate}
          onToggleHabits={actions.toggleHabitsForDate}
          isHabitCompleted={actions.isHabitCompleted}
          logs={habitData.logs}
        />
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Analytics />
    </AuthProvider>
  );
}

export default App;
