# Fizzle

A deadline tracker where every task is a bomb with a burning fuse. The closer to due, the faster it burns.

![Fizzle logo](fizzle%20logo.png)

## Download

**[→ Download the latest release](https://github.com/Darksharkthe1st/fizzle/releases/latest)**

| Platform | File |
|----------|------|
| Windows  | `Fizzle Setup x.x.x.exe` |
| macOS    | `Fizzle-x.x.x.dmg` |
| Linux    | `Fizzle-x.x.x.AppImage` |

## Features

- Each task has a fuse bar that shrinks as the deadline approaches — color shifts from green to red based on days remaining
- Spark particle emitter at the burn tip animates in real time
- **✂ Cut** to defuse a task with a scissor snip animation and confetti
- Overdue tasks detonate with a BOOM
- Burning / Defused / Detonated views
- Dark, light, and mono color palettes
- Sound effects (toggle in settings)
- Data saved locally to your app data folder

## Developing locally

```bash
git clone https://github.com/Darksharkthe1st/fizzle.git
cd fizzle
npm install
npm start
```

## Releasing a new version

Bump the version in `package.json`, commit, then:

```bash
git tag v1.x.x
git push origin v1.x.x
```

GitHub Actions builds the installers for all three platforms and publishes them to the releases page automatically.
