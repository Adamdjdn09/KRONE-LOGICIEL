const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Chemin pour stocker les données
const userDataPath = app.getPath('userData');
const dataFilePath = path.join(userDataPath, 'krone_data.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    titleBarStyle: 'default',
    title: 'KRONE - Gestion Commerciale',
    backgroundColor: '#070d17',
  });

  // En développement, charger depuis le serveur Vite
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En production, charger le fichier HTML buildé
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers pour la gestion des fichiers

// Sauvegarder les données
ipcMain.handle('save-data', async (event, data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, path: dataFilePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Charger les données
ipcMain.handle('load-data', async () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Exporter vers un fichier
ipcMain.handle('export-file', async (event, { data, defaultName }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exporter les données',
      defaultPath: defaultName || 'krone_backup.json',
      filters: [
        { name: 'Fichiers JSON', extensions: ['json'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, data, 'utf8');
      return { success: true, path: result.filePath };
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Importer depuis un fichier
ipcMain.handle('import-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Importer les données',
      filters: [
        { name: 'Fichiers JSON', extensions: ['json'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const data = fs.readFileSync(result.filePaths[0], 'utf8');
      return { success: true, data };
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Choisir un dossier
ipcMain.handle('choose-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choisir un dossier de stockage',
      properties: ['openDirectory', 'createDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Ouvrir un dossier dans l'explorateur
ipcMain.handle('open-folder', async (event, folderPath) => {
  shell.openPath(folderPath);
  return { success: true };
});

// Obtenir le chemin des données utilisateur
ipcMain.handle('get-user-data-path', () => {
  return userDataPath;
});
