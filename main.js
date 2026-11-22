// Proceso principal de Electron: ventana, almacenamiento local, respaldos, Word e IA.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { generarDocxPlaneacion, generarDocxMalla, generarDocxPlanArea, generarDocxPlanPeriodo, generarDocxPlanAula, generarDocxProgramacion } = require('./exportar-word');
const { sugerirConIA } = require('./ia');

const DATA_DIR = () => app.getPath('userData');
const DATA_FILE = () => path.join(DATA_DIR(), 'datos.json');
const BACKUP_DIR = () => path.join(DATA_DIR(), 'respaldos-automaticos');
const MAX_RESPALDOS_AUTO = 15;

if (process.env.PLANEADOR_DATA_DIR) app.setPath('userData', process.env.PLANEADOR_DATA_DIR);

let ventana;
let ultimoEstado = null; // último estado recibido, para respaldo al cerrar

function escribirSeguro(archivo, contenido) {
  const tmp = archivo + '.tmp';
  fs.writeFileSync(tmp, contenido, 'utf8');
  fs.renameSync(tmp, archivo);
}

function fechaArchivo() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

function respaldoAutomatico() {
  try {
    if (!fs.existsSync(DATA_FILE())) return;
    fs.mkdirSync(BACKUP_DIR(), { recursive: true });
    fs.copyFileSync(DATA_FILE(), path.join(BACKUP_DIR(), `respaldo_${fechaArchivo()}.json`));
    const archivos = fs.readdirSync(BACKUP_DIR()).filter((f) => f.endsWith('.json')).sort();
    while (archivos.length > MAX_RESPALDOS_AUTO) fs.unlinkSync(path.join(BACKUP_DIR(), archivos.shift()));
  } catch (e) {
    console.error('Error en respaldo automático', e);
  }
}

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    title: 'Planeador Docente',
    backgroundColor: '#f4f6fb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });
  ventana.webContents.session.setSpellCheckerLanguages(['es-ES']);
  ventana.loadFile(path.join(__dirname, 'src', 'index.html'));
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    { label: 'Archivo', submenu: [{ role: 'reload', label: 'Recargar' }, { type: 'separator' }, { role: 'quit', label: 'Salir' }] },
    { label: 'Editar', submenu: [
      { role: 'undo', label: 'Deshacer' }, { role: 'redo', label: 'Rehacer' }, { type: 'separator' },
      { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' }, { role: 'selectAll', label: 'Seleccionar todo' },
    ] },
    { label: 'Ver', submenu: [
      { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' }, { role: 'resetZoom', label: 'Tamaño normal' },
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' }, { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
    ] },
  ])
);

app.whenReady().then(() => {
  respaldoAutomatico();
  crearVentana();
});

app.on('before-quit', () => {
  if (ultimoEstado) {
    try { escribirSeguro(DATA_FILE(), ultimoEstado); } catch (e) { console.error(e); }
  }
});

app.on('window-all-closed', () => app.quit());

// ---------- Datos ----------
ipcMain.handle('datos:cargar', () => {
  try {
    if (!fs.existsSync(DATA_FILE())) return null;
    return JSON.parse(fs.readFileSync(DATA_FILE(), 'utf8'));
  } catch (e) {
    return { __error: 'No se pudo leer el archivo de datos: ' + e.message };
  }
});

ipcMain.handle('datos:guardar', (_e, estado) => {
  const texto = JSON.stringify(estado);
  ultimoEstado = texto;
  fs.mkdirSync(DATA_DIR(), { recursive: true });
  escribirSeguro(DATA_FILE(), texto);
  return true;
});

ipcMain.handle('datos:ubicacion', () => DATA_DIR());
ipcMain.handle('datos:abrirCarpeta', () => shell.openPath(DATA_DIR()));

// ---------- Respaldos ----------
ipcMain.handle('respaldo:exportar', async (_e, estado) => {
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Guardar respaldo',
    defaultPath: `respaldo-planeador-${fechaArchivo()}.json`,
    filters: [{ name: 'Respaldo del Planeador', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { ok: false };
  fs.writeFileSync(filePath, JSON.stringify(estado, null, 1), 'utf8');
  return { ok: true, ruta: filePath };
});

ipcMain.handle('respaldo:importar', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(ventana, {
    title: 'Restaurar respaldo',
    properties: ['openFile'],
    filters: [{ name: 'Respaldo del Planeador', extensions: ['json'] }],
  });
  if (canceled || !filePaths.length) return { ok: false };
  try {
    const datos = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
    if (!datos || typeof datos !== 'object' || !datos.config) throw new Error('El archivo no es un respaldo válido del Planeador.');
    respaldoAutomatico(); // guarda lo actual antes de reemplazar
    return { ok: true, datos };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('respaldo:listarAuto', () => {
  if (!fs.existsSync(BACKUP_DIR())) return [];
  return fs.readdirSync(BACKUP_DIR()).filter((f) => f.endsWith('.json')).sort().reverse();
});

ipcMain.handle('respaldo:restaurarAuto', (_e, nombre) => {
  const ruta = path.join(BACKUP_DIR(), path.basename(nombre));
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
});

// ---------- Exportaciones ----------
ipcMain.handle('word:planeacion', async (_e, payload) => {
  const nombre = (payload.nombreArchivo || 'planeacion').replace(/[\\/:*?"<>|]+/g, '-');
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Exportar planeación a Word',
    defaultPath: `${nombre}.docx`,
    filters: [{ name: 'Documento de Word', extensions: ['docx'] }],
  });
  if (canceled || !filePath) return { ok: false };
  try {
    const buffer = await generarDocxPlaneacion(payload);
    fs.writeFileSync(filePath, buffer);
    shell.openPath(filePath);
    return { ok: true, ruta: filePath };
  } catch (e) {
    return { ok: false, error: e.message.includes('EBUSY') ? 'El archivo está abierto en Word. Ciérralo e inténtalo de nuevo.' : e.message };
  }
});

const GENERADORES = { malla: generarDocxMalla, planArea: generarDocxPlanArea, planPeriodo: generarDocxPlanPeriodo, planAula: generarDocxPlanAula, programacion: generarDocxProgramacion };
ipcMain.handle('word:curricular', async (_e, { tipo, nombreArchivo, payload }) => {
  const nombre = (nombreArchivo || tipo).replace(/[\\/:*?"<>|]+/g, '-');
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Exportar a Word',
    defaultPath: `${nombre}.docx`,
    filters: [{ name: 'Documento de Word', extensions: ['docx'] }],
  });
  if (canceled || !filePath) return { ok: false };
  try {
    const buffer = await GENERADORES[tipo](payload);
    fs.writeFileSync(filePath, buffer);
    shell.openPath(filePath);
    return { ok: true, ruta: filePath };
  } catch (e) {
    return { ok: false, error: e.message.includes('EBUSY') ? 'El archivo está abierto en Word. Ciérralo e inténtalo de nuevo.' : e.message };
  }
});

ipcMain.handle('csv:guardar', async (_e, { nombre, contenido }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Exportar a Excel (CSV)',
    defaultPath: `${nombre.replace(/[\\/:*?"<>|]+/g, '-')}.csv`,
    filters: [{ name: 'CSV (Excel)', extensions: ['csv'] }],
  });
  if (canceled || !filePath) return { ok: false };
  fs.writeFileSync(filePath, '﻿' + contenido, 'utf8'); // BOM para que Excel lea tildes
  shell.openPath(filePath);
  return { ok: true, ruta: filePath };
});

// ---------- IA ----------
ipcMain.handle('ia:sugerir', async (_e, payload) => sugerirConIA(payload));
