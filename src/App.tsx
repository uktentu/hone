import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { Calendar } from './components/Calendar';
import { SplashScreen } from './components/SplashScreen';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useHabits } from './hooks/useHabits';
import { useState } from 'react';

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
      <Sidebar
        habits={habitData.habits}
        calendars={calendarData.calendars}
        selectedCalendarId={calendarData.selectedCalendarId}
        onSelectCalendar={calendarData.selectCalendar}
        onAddCalendar={calendarData.addCalendar}
        onEditCalendar={calendarData.editCalendar}
        onDeleteCalendar={calendarData.deleteCalendar}
        onAddHabit={actions.addHabit}
        onEditHabit={actions.editHabit}
        onDeleteHabit={actions.deleteHabit}
        onSelectHabit={selection.toggleHabitSelection}
        selectedHabitId={selection.selectedHabitId}
      />
      <Calendar
        habits={habitData.habits}
        selectedHabitId={selection.selectedHabitId}
        selectedHabitStats={selection.selectedHabitStats}
        onToggleHabit={actions.toggleHabitForDate}
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
    </AuthProvider>
  );
}

export default App;
