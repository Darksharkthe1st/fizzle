// app.jsx — Root. Wraps the canvas in shared Fizz state and renders the
// global new-task modal once at the body level via portal.

const ARTBOARD_W = 1120;
const ARTBOARD_H = 720;

function App() {
  return (
    <FizzProvider>
      <DesignCanvas>
        <DCSection
          id="fizzle-avenues"
          title="Fizzle · five design avenues"
          subtitle="One shared task list. Click ✂ Cut to defuse · click any task name to reveal notes · + Light one to add."
        >
          <DCArtboard id="fuze" label="01 · Boom × Terminal — chosen direction (functional)"
            width={ARTBOARD_W} height={ARTBOARD_H}>
            <AvenueFuze />
          </DCArtboard>

          <DCArtboard id="terminal" label="02 · Terminal — abstract dark"
            width={ARTBOARD_W} height={ARTBOARD_H}>
            <AvenueTerminal />
          </DCArtboard>

          <DCArtboard id="blueprint" label="03 · Blueprint — schematic"
            width={ARTBOARD_W} height={ARTBOARD_H}>
            <AvenueBlueprint />
          </DCArtboard>

          <DCArtboard id="foolscap" label="04 · Foolscap — cozy paper"
            width={ARTBOARD_W} height={ARTBOARD_H}>
            <AvenueFoolscap />
          </DCArtboard>

          <DCArtboard id="boom" label="05 · Boom! — full cartoon"
            width={ARTBOARD_W} height={ARTBOARD_H}>
            <AvenueBoom />
          </DCArtboard>

          <DCPostIt top={-40} right={60} rotate={3} width={240}>
            Click any name → notes panel · click ✂ Cut → defuse animation · click + Light one → add modal.
            The 4 comparison avenues stay as reference.
          </DCPostIt>
        </DCSection>
      </DesignCanvas>
      <NewTaskModal />
      <SettingsModal />
    </FizzProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
