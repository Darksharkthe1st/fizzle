const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.sendSync('fizzle:load'),
  saveData: (data) => ipcRenderer.send('fizzle:save', data),
  getAutostart: () => ipcRenderer.sendSync('fizzle:get-autostart'),
  setAutostart: (enable) => ipcRenderer.send('fizzle:set-autostart', enable),
})
