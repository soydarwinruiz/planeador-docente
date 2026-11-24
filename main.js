// Proceso principal de Electron: ventana, almacenamiento local, respaldos, Word e IA.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { generarDocxInforme, generarDocxTabla, generarDocxComunicados, generarDocxPrueba, generarDocxPlaneacion, generarDocxMalla, generarDocxPlanArea, generarDocxPlanPeriodo, generarDocxPlanAula, generarDocxProgramacion, generarDocxApoyo, generarDocxPiar } = require('./exportar-word');
const { sugerirConIA, transcribirAudio } = require('./ia');
const { iniciarActualizaciones } = require('./actualizaciones');
const { iniciarAplicacionMovil, detenerAplicacionMovil } = require('./servidor-aula');

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
    icon: path.join(__dirname, 'build', 'icon.png'),
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
    if (/^(https?:|mailto:|whatsapp:)/i.test(url)) shell.openExternal(url);
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
  iniciarActualizaciones(ventana);
  iniciarAplicacionMovil(ventana);
});

app.on('before-quit', () => {
  if (ultimoEstado) {
    try { escribirSeguro(DATA_FILE(), ultimoEstado); } catch (e) { console.error(e); }
  }
});

app.on('window-all-closed', () => { detenerAplicacionMovil(); app.quit(); });

// ---------- Datos ----------
ipcMain.handle('datos:cargar', () => {
  try {
    if (!fs.existsSync(DATA_FILE())) return null;
    return JSON.parse(fs.readFileSync(DATA_FILE(), 'utf8'));
  } catch (e) {
    return { __error: 'No se pudo leer el archivo de datos: ' + e.message };
  }
});

ipcMain.on('datos:guardarSync', (e, estado) => {
  try {
    ultimoEstado = JSON.stringify(estado);
    fs.mkdirSync(DATA_DIR(), { recursive: true });
    escribirSeguro(DATA_FILE(), ultimoEstado);
    e.returnValue = true;
  } catch (err) { e.returnValue = false; }
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

const GENERADORES = { informe: generarDocxInforme, tabla: generarDocxTabla, comunicados: generarDocxComunicados, prueba: generarDocxPrueba, malla: generarDocxMalla, planArea: generarDocxPlanArea, planPeriodo: generarDocxPlanPeriodo, planAula: generarDocxPlanAula, programacion: generarDocxProgramacion, apoyo: generarDocxApoyo, piar: generarDocxPiar };
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

ipcMain.handle('excel:guardar', async (_e, { nombre, filas, institucion, docente, color }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Exportar a Excel',
    defaultPath: `${nombre.replace(/[\\/:*?"<>|]+/g, '-').trim()}.xlsx`,
    filters: [{ name: 'Libro de Excel', extensions: ['xlsx'] }],
  });
  if (canceled || !filePath) return { ok: false };
  try {
    const ExcelJS = require('exceljs');
    const libro = new ExcelJS.Workbook();
    libro.creator = docente || 'Planeador Docente';
    const hoja = libro.addWorksheet(nombre.slice(0, 31).replace(/[\\/?*[\]:]/g, '-'), { views: [{ state: 'frozen', ySplit: 4 }] });
    const nCol = Math.max(1, ...filas.map((f) => f.length));
    const hex = 'FF' + String(color || '#1f4e79').replace('#', '').toUpperCase();
    hoja.addRow([institucion || 'Planeador Docente']).font = { bold: true, size: 13, color: { argb: hex } };
    hoja.addRow([nombre]).font = { bold: true, size: 11 };
    hoja.addRow([`${docente ? 'Docente: ' + docente + ' · ' : ''}Generado el ${new Date().toLocaleDateString('es-CO')}`]).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
    [1, 2, 3].forEach((r) => hoja.mergeCells(r, 1, r, nCol));
    filas.forEach((f, i) => {
      const fila = hoja.addRow(f.map((v) => (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()) && v.trim().length < 12 ? Number(v) : v)));
      fila.eachCell({ includeEmpty: true }, (celda) => {
        celda.border = { top: { style: 'thin', color: { argb: 'FFBFCBDC' } }, bottom: { style: 'thin', color: { argb: 'FFBFCBDC' } }, left: { style: 'thin', color: { argb: 'FFBFCBDC' } }, right: { style: 'thin', color: { argb: 'FFBFCBDC' } } };
        celda.alignment = { vertical: 'top', wrapText: true };
      });
      if (i === 0) fila.eachCell({ includeEmpty: true }, (celda) => { celda.font = { bold: true, color: { argb: 'FFFFFFFF' } }; celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex } }; });
    });
    for (let c = 1; c <= nCol; c++) {
      const largo = Math.max(...filas.map((f) => String(f[c - 1] ?? '').split('\n')[0].length), 4);
      hoja.getColumn(c).width = Math.min(60, Math.max(6, largo + 2));
    }
    hoja.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: nCol } };
    await libro.xlsx.writeFile(filePath);
    shell.openPath(filePath);
    return { ok: true, ruta: filePath };
  } catch (e) {
    return { ok: false, error: e.message.includes('EBUSY') ? 'El archivo está abierto en Excel. Ciérralo e inténtalo de nuevo.' : e.message };
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

// ---------- Respaldo en carpeta sincronizada (OneDrive, Google Drive, USB…) ----------
let carpetaNube = '';
function respaldarEnCarpeta(contenido) {
  if (!carpetaNube || !contenido) return { ok: false };
  try {
    if (!fs.existsSync(carpetaNube)) return { ok: false, error: 'La carpeta no existe o no está disponible.' };
    const dir = path.join(carpetaNube, 'Respaldos Planeador Docente');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'planeador-ultimo.json'), contenido, 'utf8');
    const dia = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(path.join(dir, `planeador-${dia}.json`), contenido, 'utf8');
    const viejos = fs.readdirSync(dir).filter((f) => /^planeador-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    while (viejos.length > 14) fs.unlinkSync(path.join(dir, viejos.shift()));
    return { ok: true, ruta: dir };
  } catch (e) { return { ok: false, error: e.message }; }
}
ipcMain.handle('nube:elegir', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(ventana, { title: 'Carpeta para respaldos (OneDrive, Google Drive, USB…)', properties: ['openDirectory', 'createDirectory'] });
  return canceled ? null : filePaths[0];
});
ipcMain.handle('nube:configurar', (_e, carpeta) => { carpetaNube = carpeta || ''; return true; });
ipcMain.handle('nube:respaldar', () => respaldarEnCarpeta(ultimoEstado));
setInterval(() => respaldarEnCarpeta(ultimoEstado), 20 * 60 * 1000);
app.on('before-quit', () => respaldarEnCarpeta(ultimoEstado));

// ---------- Paquetes para compartir con otros docentes ----------
ipcMain.handle('paquete:exportar', async (_e, { nombre, contenido }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Guardar paquete para compartir', defaultPath: `${nombre.replace(/[\\/:*?"<>|]+/g, '-')}.planeador`,
    filters: [{ name: 'Paquete del Planeador Docente', extensions: ['planeador'] }],
  });
  if (canceled || !filePath) return { ok: false };
  fs.writeFileSync(filePath, JSON.stringify(contenido), 'utf8');
  shell.showItemInFolder(filePath);
  return { ok: true, ruta: filePath };
});
ipcMain.handle('paquete:abrir', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(ventana, { title: 'Abrir paquete compartido', properties: ['openFile'], filters: [{ name: 'Paquete del Planeador Docente', extensions: ['planeador', 'json'] }] });
  if (canceled || !filePaths.length) return { ok: false };
  try {
    const d = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
    if (d?.formato !== 'paquete-planeador') throw new Error('El archivo no es un paquete del Planeador Docente.');
    return { ok: true, datos: d };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ---------- PDF desde HTML (fichas, hojas de respuestas para cámara) ----------
async function htmlAPdf(html, { horizontal = false } = {}) {
  const tmp = path.join(app.getPath('temp'), `planeador-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  const w = new BrowserWindow({ show: false, webPreferences: { javascript: false, offscreen: false } });
  try {
    await w.loadFile(tmp);
    return await w.webContents.printToPDF({ pageSize: 'Letter', landscape: horizontal, printBackground: true, margins: { marginType: 'none' } });
  } finally { w.destroy(); fs.rmSync(tmp, { force: true }); }
}
ipcMain.handle('pdf:html', async (_e, { nombre, html, horizontal, ruta }) => {
  let filePath = ruta;
  if (!filePath) {
    const r = await dialog.showSaveDialog(ventana, { title: 'Guardar PDF', defaultPath: `${String(nombre || 'documento').replace(/[\\/:*?"<>|]+/g, '-')}.pdf`, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (r.canceled || !r.filePath) return { ok: false };
    filePath = r.filePath;
  }
  try {
    fs.writeFileSync(filePath, await htmlAPdf(html, { horizontal }));
    if (!ruta) shell.openPath(filePath);
    return { ok: true, ruta: filePath };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ---------- Imagen PNG desde HTML (tableros) ----------
ipcMain.handle('png:html', async (_e, { nombre, html, ancho, alto, ruta }) => {
  let filePath = ruta;
  if (!filePath) {
    const r = await dialog.showSaveDialog(ventana, { title: 'Guardar imagen', defaultPath: `${String(nombre || 'tablero').replace(/[\\/:*?"<>|]+/g, '-')}.png`, filters: [{ name: 'Imagen PNG', extensions: ['png'] }] });
    if (r.canceled || !r.filePath) return { ok: false };
    filePath = r.filePath;
  }
  const tmp = path.join(app.getPath('temp'), `planeador-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  const w = new BrowserWindow({ show: false, width: Math.max(50, Math.round(ancho)), height: Math.max(50, Math.round(alto)), useContentSize: true, enableLargerThanScreen: true, frame: false, webPreferences: { javascript: false } });
  try {
    await w.loadFile(tmp);
    await new Promise((res) => setTimeout(res, 350));
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: Math.round(ancho), height: Math.round(alto) });
    fs.writeFileSync(filePath, img.toPNG());
    if (!ruta) shell.openPath(filePath);
    return { ok: true, ruta: filePath };
  } catch (e) { return { ok: false, error: e.message }; } finally { w.destroy(); fs.rmSync(tmp, { force: true }); }
});

// ---------- Leer tablas (Excel o CSV) para importar notas ----------
function valorCelda(v) {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((t) => t.text).join('');
    if ('result' in v) return valorCelda(v.result);
    if (v.text != null) return String(v.text);
    if (v.hyperlink) return String(v.hyperlink);
    return '';
  }
  return String(v);
}
function leerCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const primera = texto.split(/\r?\n/)[0] || '';
  const sep = [';', ',', '\t'].map((d) => [d, primera.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const filas = []; let fila = [], campo = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else comillas = false; } else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) { fila.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && texto[i + 1] === '\n') i++; fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else campo += ch;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}
async function leerTabla(ruta) {
  if (/\.xlsx$/i.test(ruta)) {
    const ExcelJS = require('exceljs');
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.readFile(ruta);
    const hoja = libro.worksheets.find((h) => h.rowCount > 0) || libro.worksheets[0];
    const filas = [];
    hoja.eachRow({ includeEmpty: true }, (row, n) => { const f = []; row.eachCell({ includeEmpty: true }, (cell, col) => { f[col - 1] = valorCelda(cell.value).trim(); }); filas[n - 1] = Array.from(f, (x) => x || ''); });
    return Array.from(filas, (f) => f || []);
  }
  let buf = fs.readFileSync(ruta);
  let texto = buf.toString('utf8');
  if (texto.includes('�')) texto = buf.toString('latin1'); // CSV guardado desde Excel en Windows
  return leerCSV(texto).map((f) => f.map((x) => x.trim()));
}
ipcMain.handle('tabla:abrir', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(ventana, { title: 'Abrir archivo con notas', properties: ['openFile'],
    filters: [{ name: 'Excel o CSV', extensions: ['xlsx', 'csv', 'txt'] }] });
  if (canceled || !filePaths.length) return { ok: false };
  try {
    const filas = (await leerTabla(filePaths[0])).filter((f) => f.some((x) => x !== ''));
    if (!filas.length) return { ok: false, error: 'El archivo está vacío.' };
    return { ok: true, nombre: path.basename(filePaths[0]), filas };
  } catch (e) { return { ok: false, error: 'No se pudo leer el archivo: ' + e.message + ' (si es .xls antiguo, guárdalo como .xlsx o .csv).' }; }
});

// ---------- IA ----------
ipcMain.handle('ia:sugerir', async (_e, payload) => sugerirConIA(payload));
ipcMain.handle('ia:transcribir', async (_e, payload) => transcribirAudio(payload));
