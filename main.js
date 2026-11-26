// Proceso principal de Electron: ventana, almacenamiento local, respaldos, Word e IA.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { generarDocxInforme, generarDocxTabla, generarDocxComunicados, generarDocxPrueba, generarDocxPlaneacion, generarDocxMalla, generarDocxPlanArea, generarDocxPlanPeriodo, generarDocxPlanAula, generarDocxProgramacion, generarDocxApoyo, generarDocxPiar } = require('./exportar-word');
const { sugerirConIA, transcribirAudio } = require('./ia');
const { iniciarActualizaciones } = require('./actualizaciones');
const { iniciarAplicacionMovil, detenerAplicacionMovil } = require('./servidor-aula');

// La carpeta de datos conserva su nombre de siempre ("Planeador Docente") aunque el programa ahora se llame Tiza
if (process.env.PLANEADOR_DATA_DIR) app.setPath('userData', process.env.PLANEADOR_DATA_DIR);
else app.setPath('userData', path.join(app.getPath('appData'), 'Planeador Docente'));
const almacen = require('./almacen');
const { DIR: DATA_DIR, DATOS: DATA_FILE, RESPALDOS: BACKUP_DIR, fechaArchivo, escribirSeguro, respaldoAutomatico } = almacen;
const { iniciarAcceso, estaBloqueado } = require('./acceso');
iniciarAcceso();
// Mientras el programa esté bloqueado con la clave, no se entregan datos a la interfaz
function exigirDesbloqueo() { if (estaBloqueado()) throw new Error('El programa está bloqueado.'); }

let ventana;
let version = 0; // aumenta con cada guardado (para saber si hay algo nuevo que respaldar en la nube)

function nombreSeguro(n, defecto) { return String(n || defecto).replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 150) || defecto; }
function errorArchivo(e, programa) {
  return /EBUSY|EPERM|EACCES/.test(e.code || e.message) ? `El archivo está abierto en ${programa} o no se tiene permiso. Ciérralo e inténtalo de nuevo.` : e.message;
}
// La interfaz envía las partes del estado que cambiaron ({ cambios: { clave: textoJSON }, quitar: [clave] });
// también se acepta el estado completo como texto (respaldos y pruebas)
function escribirEstado(dato) {
  if (typeof dato === 'string') { if (dato[0] !== '{') throw new Error('Estado no válido'); almacen.guardarEstado(dato); }
  else if (dato && typeof dato === 'object' && dato.cambios) almacen.guardarPartes(dato.cambios, dato.quitar || []);
  else throw new Error('Estado no válido');
  version++;
}
const estadoTexto = () => almacen.estadoTexto();

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    title: 'Tiza',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#f4f6fb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });
  const ses = ventana.webContents.session;
  const idiomas = ['es-419', 'es-ES', 'es'].filter((l) => ses.availableSpellCheckerLanguages.includes(l));
  if (idiomas.length) ses.setSpellCheckerLanguages(idiomas.slice(0, 1));
  // Menú del clic derecho: sugerencias de ortografía, agregar al diccionario y editar
  ventana.webContents.on('context-menu', (_e, p) => {
    const items = [];
    if (p.misspelledWord) {
      p.dictionarySuggestions.slice(0, 6).forEach((s) => items.push({ label: s, click: () => ventana.webContents.replaceMisspelling(s) }));
      if (!p.dictionarySuggestions.length) items.push({ label: 'Sin sugerencias', enabled: false });
      items.push({ label: `Agregar "${p.misspelledWord}" al diccionario`, click: () => ses.addWordToSpellCheckerDictionary(p.misspelledWord) }, { type: 'separator' });
    }
    if (p.isEditable) items.push({ role: 'undo', label: 'Deshacer' }, { type: 'separator' }, { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' }, { role: 'selectAll', label: 'Seleccionar todo' });
    else if (p.selectionText) items.push({ role: 'copy', label: 'Copiar' });
    if (items.length) Menu.buildFromTemplate(items).popup({ window: ventana });
  });
  ventana.loadFile(path.join(__dirname, 'src', 'index.html'));
  // Exportaciones de los tableros (PNG, SVG, JSON): preguntar siempre dónde guardar
  ventana.webContents.session.on('will-download', (_e, item) => {
    const ruta = dialog.showSaveDialogSync(ventana, { defaultPath: item.getFilename() });
    if (ruta) item.setSavePath(ruta); else item.cancel();
  });
  // La ventana nunca navega fuera de la aplicación (un enlace o archivo arrastrado no la reemplaza)
  ventana.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); if (/^(https?:|mailto:|whatsapp:)/i.test(url)) shell.openExternal(url); }
  });
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
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' },
      ...(app.isPackaged ? [] : [{ role: 'toggleDevTools', label: 'Herramientas de desarrollo' }]),
    ] },
    { label: 'Ayuda', submenu: [
      { label: 'Acerca de Tiza', click: () => ventana?.webContents.send('menu:acerca') },
      { label: 'Página de descargas y novedades', click: () => shell.openExternal('https://github.com/soydarwinruiz/planeador-docente/releases') },
    ] },
  ])
);

// Una sola ventana del programa: dos copias abiertas a la vez se pisarían los datos
if (!app.requestSingleInstanceLock()) app.quit();
else app.on('second-instance', () => { if (ventana) { if (ventana.isMinimized()) ventana.restore(); ventana.focus(); } });

app.whenReady().then(() => {
  respaldoAutomatico();
  almacen.podarRegistro();
  setInterval(() => respaldoAutomatico(), 60 * 60 * 1000); // cada hora, solo si hubo cambios
  crearVentana();
  iniciarActualizaciones(ventana);
  iniciarAplicacionMovil(ventana);
});

app.on('before-quit', () => {
  respaldarEnCarpeta();
});

app.on('window-all-closed', () => { detenerAplicacionMovil(); app.quit(); });
app.on('will-quit', () => { try { require('./basedatos').cerrar(); } catch (e) { console.error(e); } });

// ---------- Datos ----------
ipcMain.handle('datos:cargar', () => {
  if (estaBloqueado()) return { __bloqueado: true };
  const d = almacen.cargarDatos();
  if (d && !d.__error) {
    // Claves de IA: se guardan cifradas aparte. Las que vengan de versiones anteriores dentro de datos.json se pasan al archivo cifrado.
    const ia = (d.config ||= {}).ia ||= {};
    const previas = ia.claves && typeof ia.claves === 'object' ? ia.claves : {};
    const cifradas = almacen.leerClaves();
    ia.claves = { ...previas, ...cifradas };
    if (Object.keys(previas).some((k) => previas[k] && !cifradas[k])) { try { almacen.guardarClaves(ia.claves); } catch (e) { console.error(e); } }
  }
  return d;
});

ipcMain.on('datos:guardarSync', (e, texto) => {
  try { escribirEstado(texto); e.returnValue = true; } catch (err) { console.error(err); e.returnValue = false; }
});

ipcMain.handle('datos:guardar', (_e, texto) => { escribirEstado(texto); return true; });
ipcMain.handle('claves:guardar', (_e, claves) => almacen.guardarClaves(claves));
ipcMain.handle('claves:info', () => ({ cifradas: almacen.cifradoDisponible() }));
ipcMain.handle('tablero:leerRecursos', (_e, id) => { exigirDesbloqueo(); return almacen.leerRecursosTablero(id); });
// Años anteriores
ipcMain.handle('anios:listar', () => { exigirDesbloqueo(); return almacen.listarAnios(); });
ipcMain.handle('anios:leer', (_e, id) => { exigirDesbloqueo(); return almacen.leerAnio(id); });
ipcMain.handle('anios:archivar', (_e, texto) => {
  try { exigirDesbloqueo(); respaldoAutomatico({ forzar: true }); return { ok: true, meta: almacen.guardarAnio(texto, undefined, { conRegistroActual: true }) }; } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('anios:eliminar', (_e, id) => { exigirDesbloqueo(); return almacen.eliminarAnio(id); });
// Importar un año desde un respaldo (por ejemplo, el que se guardó al iniciar el año con una versión anterior)
ipcMain.handle('anios:importar', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(ventana, { title: 'Elegir el respaldo del año que quieres archivar', properties: ['openFile'], filters: [{ name: 'Respaldo del Planeador', extensions: ['json'] }] });
  if (canceled || !filePaths.length) return { ok: false };
  try {
    exigirDesbloqueo();
    const datos = validarRespaldo(almacen.leerJSON(filePaths[0]));
    return { ok: true, meta: almacen.guardarAnio(datos) };
  } catch (e) { return { ok: false, error: e instanceof SyntaxError ? 'El archivo está dañado o no es un respaldo del Planeador.' : e.message }; }
});
ipcMain.handle('tablero:guardarRecursos', (_e, { id, assets }) => almacen.guardarRecursosTablero(id, assets));
ipcMain.handle('registro:leer', () => { exigirDesbloqueo(); return almacen.leerRegistro(); });
ipcMain.handle('registro:agregar', (_e, lista) => almacen.agregarRegistro(lista));
ipcMain.on('registro:agregarSync', (e, lista) => { try { almacen.agregarRegistro(lista); e.returnValue = true; } catch (err) { console.error(err); e.returnValue = false; } });
ipcMain.handle('registro:reemplazar', (_e, lista) => { exigirDesbloqueo(); return almacen.reemplazarRegistro(lista); });
ipcMain.handle('tablero:limpiar', (_e, ids) => almacen.limpiarRecursosTableros(ids));

ipcMain.handle('datos:ubicacion', () => DATA_DIR());
ipcMain.handle('almacen:info', () => almacen.infoAlmacen());
ipcMain.handle('almacen:borrarAntes2', () => { exigirDesbloqueo(); return almacen.borrarAntes2(); });
ipcMain.handle('ortografia:activar', (_e, activo) => { ventana?.webContents.session.setSpellCheckerEnabled(!!activo); return true; });
ipcMain.handle('datos:abrirCarpeta', () => shell.openPath(DATA_DIR()));

// ---------- Respaldos ----------
// El respaldo manual es completo (incluye las imágenes de los tableros) y no lleva las claves de IA
ipcMain.handle('respaldo:exportar', async (_e, texto) => {
  if (estaBloqueado()) return { ok: false, error: 'El programa está bloqueado.' };
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Guardar respaldo',
    defaultPath: `respaldo-planeador-${fechaArchivo()}.json`,
    filters: [{ name: 'Respaldo del Planeador', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { ok: false };
  try {
    escribirSeguro(filePath, almacen.textoRespaldoCompleto(typeof texto === 'string' ? texto : JSON.stringify(texto), 1));
    return { ok: true, ruta: filePath };
  } catch (e) { return { ok: false, error: errorArchivo(e, 'otro programa') }; }
});

function validarRespaldo(datos) {
  if (!datos || typeof datos !== 'object' || !datos.config || !Array.isArray(datos.grupos || [])) throw new Error('El archivo no es un respaldo válido del Planeador.');
  delete datos.__recuperado;
  almacen.restaurarAniosDeRespaldo(datos);
  return datos;
}
ipcMain.handle('respaldo:importar', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(ventana, {
    title: 'Restaurar respaldo',
    properties: ['openFile'],
    filters: [{ name: 'Respaldo del Planeador', extensions: ['json'] }],
  });
  if (canceled || !filePaths.length) return { ok: false };
  try {
    const datos = validarRespaldo(almacen.leerJSON(filePaths[0]));
    respaldoAutomatico({ forzar: true }); // guarda lo actual antes de reemplazar
    return { ok: true, datos };
  } catch (e) {
    return { ok: false, error: e instanceof SyntaxError ? 'El archivo está dañado o no es un respaldo del Planeador.' : e.message };
  }
});

ipcMain.handle('respaldo:listarAuto', () => almacen.listarRespaldos());

ipcMain.handle('respaldo:restaurarAuto', (_e, nombre) => {
  try {
    exigirDesbloqueo();
    const datos = validarRespaldo(almacen.leerRespaldoAuto(nombre));
    respaldoAutomatico({ forzar: true });
    return { ok: true, datos };
  } catch (e) { return { ok: false, error: 'No se pudo leer ese respaldo: ' + e.message }; }
});

// ---------- Exportaciones ----------
ipcMain.handle('word:planeacion', async (_e, payload) => {
  const nombre = nombreSeguro(payload.nombreArchivo, 'planeacion');
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
    return { ok: false, error: errorArchivo(e, 'Word') };
  }
});

const GENERADORES = { informe: generarDocxInforme, tabla: generarDocxTabla, comunicados: generarDocxComunicados, prueba: generarDocxPrueba, malla: generarDocxMalla, planArea: generarDocxPlanArea, planPeriodo: generarDocxPlanPeriodo, planAula: generarDocxPlanAula, programacion: generarDocxProgramacion, apoyo: generarDocxApoyo, piar: generarDocxPiar };
ipcMain.handle('word:curricular', async (_e, { tipo, nombreArchivo, payload }) => {
  if (!Object.hasOwn(GENERADORES, tipo)) return { ok: false, error: `Tipo de documento desconocido: ${tipo}` };
  const nombre = nombreSeguro(nombreArchivo, tipo);
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
    return { ok: false, error: errorArchivo(e, 'Word') };
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
    libro.creator = docente || 'Tiza';
    const hoja = libro.addWorksheet(nombre.slice(0, 31).replace(/[\\/?*[\]:]/g, '-'), { views: [{ state: 'frozen', ySplit: 4 }] });
    const nCol = Math.max(1, ...filas.map((f) => f.length));
    const hex = 'FF' + String(color || '#1f4e79').replace('#', '').toUpperCase();
    hoja.addRow([institucion || 'Tiza']).font = { bold: true, size: 13, color: { argb: hex } };
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
    return { ok: false, error: errorArchivo(e, 'Excel') };
  }
});

ipcMain.handle('csv:guardar', async (_e, { nombre, contenido }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Exportar a Excel (CSV)',
    defaultPath: `${nombre.replace(/[\\/:*?"<>|]+/g, '-')}.csv`,
    filters: [{ name: 'CSV (Excel)', extensions: ['csv'] }],
  });
  if (canceled || !filePath) return { ok: false };
  try { fs.writeFileSync(filePath, '\uFEFF' + contenido, 'utf8'); } catch (e) { return { ok: false, error: errorArchivo(e, 'Excel') }; } // BOM para que Excel lea tildes
  shell.openPath(filePath);
  return { ok: true, ruta: filePath };
});

// ---------- Respaldo en carpeta sincronizada (OneDrive, Google Drive, USB…) ----------
let carpetaNube = '';
let ultimoEnNube = null;
function respaldarEnCarpeta({ forzar = false } = {}) {
  if (!carpetaNube || !estadoTexto()) return { ok: false };
  if (!forzar && version === ultimoEnNube) return { ok: true, sinCambios: true };
  try {
    if (!fs.existsSync(carpetaNube)) return { ok: false, error: 'La carpeta no existe o no está disponible.' };
    const dir = path.join(carpetaNube, 'Respaldos Planeador Docente');
    const contenido = almacen.textoRespaldoCompleto(estadoTexto());
    escribirSeguro(path.join(dir, 'planeador-ultimo.json'), contenido);
    escribirSeguro(path.join(dir, `planeador-${fechaArchivo().slice(0, 10)}.json`), contenido);
    const viejos = fs.readdirSync(dir).filter((f) => /^planeador-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    while (viejos.length > 14) fs.rmSync(path.join(dir, viejos.shift()), { force: true });
    ultimoEnNube = version;
    return { ok: true, ruta: dir };
  } catch (e) { return { ok: false, error: e.message }; }
}
ipcMain.handle('nube:elegir', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(ventana, { title: 'Carpeta para respaldos (OneDrive, Google Drive, USB…)', properties: ['openDirectory', 'createDirectory'] });
  return canceled ? null : filePaths[0];
});
ipcMain.handle('nube:configurar', (_e, carpeta) => { carpetaNube = carpeta || ''; ultimoEnNube = null; return true; });
ipcMain.handle('nube:respaldar', () => respaldarEnCarpeta({ forzar: true }));
setInterval(() => respaldarEnCarpeta(), 20 * 60 * 1000);

// ---------- Paquetes para compartir con otros docentes ----------
ipcMain.handle('paquete:exportar', async (_e, { nombre, contenido }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(ventana, {
    title: 'Guardar paquete para compartir', defaultPath: `${nombreSeguro(nombre, 'paquete')}.planeador`,
    filters: [{ name: 'Paquete del Planeador Docente', extensions: ['planeador'] }],
  });
  if (canceled || !filePath) return { ok: false };
  try { escribirSeguro(filePath, JSON.stringify(contenido)); } catch (e) { return { ok: false, error: errorArchivo(e, 'otro programa') }; }
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
ipcMain.handle('pdf:html', async (_e, { nombre, html, horizontal }) => {
  const r = await dialog.showSaveDialog(ventana, { title: 'Guardar PDF', defaultPath: `${String(nombre || 'documento').replace(/[\\/:*?"<>|]+/g, '-')}.pdf`, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  const filePath = r.filePath;
  try {
    fs.writeFileSync(filePath, await htmlAPdf(html, { horizontal }));
    shell.openPath(filePath);
    return { ok: true, ruta: filePath };
  } catch (e) { return { ok: false, error: e.message }; }
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
  texto = texto.replace(/^\uFEFF/, '');
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
