function App() {
  return (
    <FizzProvider>
      <AvenueFuze />
      <NewTaskModal />
      <SettingsModal />
    </FizzProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
