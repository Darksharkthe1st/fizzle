function RootView() {
  const { view } = useFizz();
  if (view === 'habits') return <AvenueHabits />;
  return <AvenueFuze />;
}

function App() {
  return (
    <FizzProvider>
      <RootView />
      <NewTaskModal />
      <NewHabitModal />
      <SettingsModal />
    </FizzProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
