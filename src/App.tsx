import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { Calendar } from './components/Calendar';
import { SplashScreen } from './components/SplashScreen';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useHabits } from './hooks/useHabits';

import { OnboardingTour } from './components/OnboardingTour';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { currentUser } = useAuth();
  const {
    habitData,
    calendarData,
    selection,
    actions
  } = useHabits();

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!currentUser) {
    return <AuthPage />;
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
      />
      <Calendar
        habits={habitData.habits}
        selectedHabitIds={selection.selectedHabitIds}
        selectedHabitStats={selection.selectedHabitStats}
        onToggleHabit={actions.toggleHabitForDate}
        onToggleHabits={actions.toggleHabitsForDate}
        isHabitCompleted={actions.isHabitCompleted}
        logs={habitData.logs}
      />
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
