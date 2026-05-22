const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.sendSync('fizzle:load'),
  saveData: (data) => ipcRenderer.send('fizzle:save', data),
})
