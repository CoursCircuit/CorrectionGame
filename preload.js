const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openPdf: (options = {}) => ipcRenderer.invoke('open-pdf', options),
  reopenLastClassPdf: (options = {}) => ipcRenderer.invoke('reopen-last-class-pdf', options),
  readFileBytes: (filePath) => ipcRenderer.invoke('read-file-bytes', { filePath }),
  writeFileBytes: (filePath, bytes) => ipcRenderer.invoke('write-file-bytes', { filePath, bytes }),
  pickClassFolder: (options = {}) => ipcRenderer.invoke('pick-class-folder', options),
  saveSession: (payload, options = {}) => ipcRenderer.invoke('save-session', { payload, ...options }),
  loadSession: (options = {}) => ipcRenderer.invoke('load-session', options),
});
