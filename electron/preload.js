const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Sauvegarde et chargement
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  
  // Export/Import fichiers
  exportFile: (data, defaultName) => ipcRenderer.invoke('export-file', { data, defaultName }),
  importFile: () => ipcRenderer.invoke('import-file'),
  
  // Gestion des dossiers
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // Vérifier si on est dans Electron
  isElectron: true,
});
