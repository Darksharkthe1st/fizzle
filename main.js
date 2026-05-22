const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

function dataPath() {
  return path.join(app.getPath('userData'), 'fizzle-data.json')
}

ipcMain.on('fizzle:load', (event) => {
  try {
    event.returnValue = JSON.parse(fs.readFileSync(dataPath(), 'utf8'))
  } catch {
    event.returnValue = null
  }
})

ipcMain.on('fizzle:save', (_, data) => {
  try {
    fs.writeFileSync(dataPath(), JSON.stringify(data, null, 2), 'utf8')
  } catch (e) {
    console.error('fizzle: save failed', e)
  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Fizzle',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
