const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { createHash, randomUUID } = require('crypto');

let mainWindow = null;
let allowImmediateClose = false;
let closeAutoSaveInProgress = false;
let quitRequested = false;

function parseIncomingBytes(payload) {
  if (!payload) return null;
  if (Buffer.isBuffer(payload)) return payload;
  if (payload instanceof Uint8Array) return Buffer.from(payload);
  if (payload instanceof ArrayBuffer) return Buffer.from(new Uint8Array(payload));
  if (ArrayBuffer.isView(payload)) {
    return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  }
  if (Array.isArray(payload)) return Buffer.from(payload);
  if (payload.type === 'Buffer' && Array.isArray(payload.data)) {
    return Buffer.from(payload.data);
  }
  return null;
}

function runRendererAutoSaveBeforeClose(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return Promise.resolve(null);
  const script = `
    (async () => {
      try {
        if (typeof window.__cgAutoSaveBeforeClose === 'function') {
          return await window.__cgAutoSaveBeforeClose();
        }
        return { ok: true, skipped: true, reason: 'missing-handler' };
      } catch (error) {
        return { ok: false, error: String(error && (error.stack || error.message || error)) };
      }
    })();
  `;
  return targetWindow.webContents.executeJavaScript(script, true);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('close', (event) => {
    if (allowImmediateClose) return;
    if (!mainWindow || mainWindow.isDestroyed()) return;

    event.preventDefault();
    if (closeAutoSaveInProgress) return;
    closeAutoSaveInProgress = true;
    let finalized = false;
    const finalizeClose = () => {
      if (finalized) return;
      finalized = true;
      if (!mainWindow || mainWindow.isDestroyed()) return;
      allowImmediateClose = true;
      closeAutoSaveInProgress = false;
      mainWindow.close();
    };
    const fallbackTimer = setTimeout(finalizeClose, 2000);

    runRendererAutoSaveBeforeClose(mainWindow)
      .catch((error) => {
        console.error('Auto-save before close failed:', error);
      })
      .finally(() => {
        clearTimeout(fallbackTimer);
        finalizeClose();
      });
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
    closeAutoSaveInProgress = false;
    allowImmediateClose = false;
  });
}

function isExistingDirectory(inputPath) {
  if (!inputPath) return false;
  try {
    return fs.statSync(inputPath).isDirectory();
  } catch {
    return false;
  }
}

function getSessionPathForPdf(pdfPath) {
  const dir = path.dirname(pdfPath);
  const base = path.basename(pdfPath, path.extname(pdfPath));
  return path.join(dir, `${base}.cg.json`);
}

function getOpenDialogDefaultPath(preferredDir, currentPdfPath) {
  if (isExistingDirectory(preferredDir)) return preferredDir;
  if (currentPdfPath) {
    const currentDir = path.dirname(currentPdfPath);
    if (isExistingDirectory(currentDir)) return currentDir;
  }
  return app.getPath('documents');
}

function readSessionFileIfValid(sessionPath) {
  try {
    const raw = fs.readFileSync(sessionPath, 'utf8');
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') {
      return { sessionPath, data };
    }
  } catch {
    return null;
  }
  return null;
}

function findAssociatedSessionForPdf(pdfPath) {
  const preferred = getSessionPathForPdf(pdfPath);
  if (fs.existsSync(preferred)) {
    return readSessionFileIfValid(preferred);
  }
  const fallback = path.join(path.dirname(pdfPath), `${path.basename(pdfPath, path.extname(pdfPath))}.json`);
  if (fs.existsSync(fallback)) {
    return readSessionFileIfValid(fallback);
  }
  return null;
}

function workspaceSessionPath(pdfPath, classId) {
  const key = createHash('sha256').update(JSON.stringify([path.resolve(pdfPath), classId ?? null])).digest('hex');
  return path.join(app.getPath('userData'), 'document-sessions', key + '.json');
}

function describePdf(pdfPath, classId) {
  const stat = fs.statSync(pdfPath, { throwIfNoEntry: false });
  if (!stat?.isFile()) return null;
  return {
    pdfPath,
    pdfName: path.basename(pdfPath),
    pdfSize: stat.size,
    associatedSession: findAssociatedSessionForPdf(pdfPath),
    localSession: readSessionFileIfValid(workspaceSessionPath(pdfPath, classId)),
  };
}

function preserveOtherClassSessions(payload, previous) {
  if (!payload.pdf?.fingerprint || previous?.pdf?.fingerprint !== payload.pdf.fingerprint) return payload;
  const views = new Map();
  if (Array.isArray(previous.documentViews)) {
    for (const view of previous.documentViews) {
      if (view?.snapshot?.pdf?.fingerprint === payload.pdf.fingerprint) views.set(view.classId ?? null, view.snapshot);
    }
  }
  const { documentViews, classes, ...snapshot } = previous;
  views.set(classes?.selectedClassId ?? null, snapshot);
  views.delete(payload.classes?.selectedClassId ?? null);
  if (!views.size) return payload;
  return { ...payload, documentViews: Array.from(views, ([classId, snapshot]) => ({ classId, snapshot })) };
}

function writeSessionFile(sessionPath, payload) {
  const tempPath = sessionPath + '.' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    fs.renameSync(tempPath, sessionPath);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

app.on('before-quit', () => {
  quitRequested = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || quitRequested) app.quit();
});
app.on('activate', () => {
  quitRequested = false;
  if (mainWindow === null) createWindow();
});
process.on('uncaughtException', (err) => {
  dialog.showErrorBox('Erreur non gérée', String(err?.stack || err));
});
app.whenReady().then(createWindow);

ipcMain.handle('open-pdf', async (_event, options = {}) => {
  const defaultPath = getOpenDialogDefaultPath(options.defaultDir, options.currentPdfPath);
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Ouvrir un PDF',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    defaultPath,
  });
  if (canceled || !filePaths?.length) return null;
  const [first, ...others] = filePaths;
  const selection = describePdf(first, options.classId);
  return selection && { ...selection, additionalPaths: others };
});

ipcMain.handle('reopen-last-class-pdf', async (_event, options = {}) => {
  const { lastPdfPath, classId } = options;
  return lastPdfPath ? describePdf(lastPdfPath, classId) : null;
});

ipcMain.handle('read-file-bytes', async (_event, { filePath } = {}) => {
  if (!filePath) return null;
  const buffer = fs.readFileSync(filePath);
  return Uint8Array.from(buffer);
});

ipcMain.handle('write-file-bytes', async (_event, { filePath, bytes } = {}) => {
  if (!filePath) return { ok: false, reason: 'missing-path' };
  const buffer = parseIncomingBytes(bytes);
  if (!buffer) return { ok: false, reason: 'invalid-bytes' };
  fs.writeFileSync(filePath, buffer);
  const stat = fs.statSync(filePath);
  return { ok: true, filePath, size: stat.size };
});

ipcMain.handle('pick-class-folder', async (_event, options = {}) => {
  const defaultPath = getOpenDialogDefaultPath(options.defaultDir, options.currentPdfPath);
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Choisir le dossier de la classe',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath,
  });
  if (canceled || !filePaths?.[0]) return null;
  return { folderPath: filePaths[0] };
});

ipcMain.handle('save-session', async (_event, { payload, pdfPath, classDir, forcePrompt = false } = {}) => {
  let targetPath = null;

  if (!forcePrompt && pdfPath) {
    targetPath = getSessionPathForPdf(pdfPath);
  } else {
    const defaultBase = pdfPath
      ? path.basename(pdfPath, path.extname(pdfPath))
      : 'session-correction';
    const defaultDir = getOpenDialogDefaultPath(classDir);
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Enregistrer la session',
      defaultPath: path.join(defaultDir, `${defaultBase}.cg.json`),
      filters: [{ name: 'Session CorrectionGame', extensions: ['json'] }],
    });
    if (canceled || !filePath) return null;
    targetPath = filePath;
  }

  try {
    const previous = pdfPath ? findAssociatedSessionForPdf(pdfPath)?.data : null;
    writeSessionFile(targetPath, preserveOtherClassSessions(payload, previous));
    return { sessionPath: targetPath };
  } catch (error) {
    if (!pdfPath) throw error;
    const localPath = workspaceSessionPath(pdfPath, payload.classes?.selectedClassId);
    fs.mkdirSync(path.dirname(localPath), { recursive: true, mode: 0o700 });
    writeSessionFile(localPath, payload);
    return { sessionPath: localPath, localBackup: true };
  }
});

ipcMain.handle('load-session', async (_event, options = {}) => {
  const defaultPath = options.currentPdfPath ? getSessionPathForPdf(options.currentPdfPath) : getOpenDialogDefaultPath(options.defaultDir);
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Charger une session',
    properties: ['openFile'],
    defaultPath,
    filters: [{ name: 'Session CorrectionGame', extensions: ['json'] }],
  });
  if (canceled || !filePaths?.[0]) return null;
  const sessionPath = filePaths[0];
  const data = readSessionFileIfValid(sessionPath);
  if (!data) return { sessionPath, invalid: true };
  return data;
});
