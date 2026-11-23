// Actualizaciones automáticas desde las versiones publicadas en GitHub (solo la versión instalada).
const { app, ipcMain, shell } = require('electron');

const PAGINA = 'https://github.com/soydarwinruiz/planeador-docente/releases/latest';
const API = 'https://api.github.com/repos/soydarwinruiz/planeador-docente/releases/latest';

function esPortable() { return !!process.env.PORTABLE_EXECUTABLE_DIR; }
function mayor(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}

function iniciarActualizaciones(ventana) {
  const enviar = (estado) => { if (ventana && !ventana.isDestroyed()) ventana.webContents.send('act:estado', estado); };
  let autoUpdater = null;
  if (app.isPackaged && !esPortable()) {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('download-progress', (p) => enviar({ fase: 'descargando', porcentaje: Math.round(p.percent) }));
    autoUpdater.on('update-downloaded', (i) => enviar({ fase: 'lista', version: i.version }));
    autoUpdater.on('error', (e) => enviar({ fase: 'error', error: String(e.message || e).slice(0, 300) }));
  }

  ipcMain.handle('act:info', () => ({ version: app.getVersion(), instalada: app.isPackaged && !esPortable(), portable: esPortable() }));

  ipcMain.handle('act:buscar', async () => {
    try {
      if (autoUpdater) {
        const r = await autoUpdater.checkForUpdates();
        const v = r?.updateInfo?.version;
        if (v && mayor(v, app.getVersion())) return { ok: true, hay: true, version: v, notas: r.updateInfo.releaseNotes || '' };
        return { ok: true, hay: false, version: app.getVersion() };
      }
      // Portable o modo desarrollo: solo se consulta la última versión publicada
      const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) return { ok: false, error: `No se pudo consultar GitHub (código ${res.status}). Revisa la conexión a internet e inténtalo más tarde.` };
      const d = await res.json();
      const v = String(d.tag_name || '').replace(/^v/, '');
      return { ok: true, hay: !!v && mayor(v, app.getVersion()), version: v, soloAviso: true, pagina: d.html_url || PAGINA };
    } catch (e) {
      return { ok: false, error: 'Sin conexión a internet o no se pudo contactar GitHub.' };
    }
  });
  ipcMain.handle('act:descargar', async () => {
    if (!autoUpdater) { shell.openExternal(PAGINA); return { ok: true, abierta: true }; }
    try { await autoUpdater.downloadUpdate(); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; }
  });
  ipcMain.handle('act:instalar', () => { if (autoUpdater) autoUpdater.quitAndInstall(false, true); });
  ipcMain.handle('act:pagina', () => shell.openExternal(PAGINA));
}

module.exports = { iniciarActualizaciones };
