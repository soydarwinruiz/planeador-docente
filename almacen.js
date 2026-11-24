// Almacenamiento local seguro: escritura atómica con fsync, recuperación automática ante archivos dañados,
// respaldos automáticos (recientes + uno por día), claves de IA cifradas e imágenes de los tableros en archivos aparte.
const { app, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

const DIR = () => app.getPath('userData');
const DATOS = () => path.join(DIR(), 'datos.json');
const RESPALDOS = () => path.join(DIR(), 'respaldos-automaticos');
const TABLEROS = () => path.join(DIR(), 'tableros');
const CLAVES = () => path.join(DIR(), 'claves.dat');
const MAX_RECIENTES = 15; // respaldo_AAAA-MM-DD_HHMM.json
const MAX_DIARIOS = 30; // diario_AAAA-MM-DD.json

function fechaArchivo(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}
function esperar(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

// Escribe en un temporal, lo fuerza a disco y lo renombra. En Windows el antivirus, OneDrive o el indexador
// pueden bloquear el archivo un instante (EPERM/EBUSY/EACCES): se reintenta y, como último recurso, se copia.
function escribirSeguro(archivo, contenido) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  const tmp = `${archivo}.${process.pid}.tmp`;
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, contenido, null, typeof contenido === 'string' ? 'utf8' : undefined);
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  for (let i = 0; ; i++) {
    try { fs.renameSync(tmp, archivo); return; } catch (e) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) { fs.rmSync(tmp, { force: true }); throw e; }
      if (i >= 8) {
        try { fs.copyFileSync(tmp, archivo); fs.rmSync(tmp, { force: true }); return; } catch (e2) { fs.rmSync(tmp, { force: true }); throw e2; }
      }
      esperar(40 * (i + 1));
    }
  }
}

function leerJSON(ruta) {
  const t = fs.readFileSync(ruta, 'utf8').replace(/^﻿/, '');
  const d = JSON.parse(t);
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('contenido no válido');
  return d;
}

// ---------- Respaldos automáticos ----------
function listarRespaldos() {
  if (!fs.existsSync(RESPALDOS())) return [];
  return fs.readdirSync(RESPALDOS()).filter((f) => /^(respaldo|diario)_.*\.json$/.test(f))
    .sort((a, b) => fs.statSync(path.join(RESPALDOS(), b)).mtimeMs - fs.statSync(path.join(RESPALDOS(), a)).mtimeMs);
}
let ultimoRespaldado = 0; // mtime de datos.json la última vez que se respaldó
function respaldoAutomatico({ forzar = false } = {}) {
  try {
    if (!fs.existsSync(DATOS())) return;
    const mtime = fs.statSync(DATOS()).mtimeMs;
    if (!forzar && mtime === ultimoRespaldado) return; // sin cambios desde el último respaldo
    leerJSON(DATOS()); // nunca respaldar un archivo dañado
    fs.mkdirSync(RESPALDOS(), { recursive: true });
    fs.copyFileSync(DATOS(), path.join(RESPALDOS(), `respaldo_${fechaArchivo()}.json`));
    const diario = path.join(RESPALDOS(), `diario_${fechaArchivo().slice(0, 10)}.json`);
    fs.copyFileSync(DATOS(), diario); // el último del día queda como respaldo de ese día
    ultimoRespaldado = mtime;
    const podar = (prefijo, max) => {
      const l = fs.readdirSync(RESPALDOS()).filter((f) => f.startsWith(prefijo) && f.endsWith('.json')).sort();
      while (l.length > max) fs.rmSync(path.join(RESPALDOS(), l.shift()), { force: true });
    };
    podar('respaldo_', MAX_RECIENTES);
    podar('diario_', MAX_DIARIOS);
  } catch (e) { console.error('Error en respaldo automático', e); }
}

// ---------- Carga con recuperación ----------
// Si datos.json está dañado (corte de luz, disco lleno…), se conserva una copia y se cargan
// automáticamente los datos del respaldo válido más reciente.
function cargarDatos() {
  if (!fs.existsSync(DATOS())) return null;
  try { return leerJSON(DATOS()); } catch (error) {
    const danado = path.join(DIR(), `datos-danado_${fechaArchivo()}.json`);
    try { fs.copyFileSync(DATOS(), danado); } catch { /* sin copia */ }
    for (const f of listarRespaldos()) {
      try {
        const d = leerJSON(path.join(RESPALDOS(), f));
        d.__recuperado = { desde: f, danado: path.basename(danado) };
        return d;
      } catch { /* probar el siguiente */ }
    }
    return { __error: `No se pudo leer el archivo de datos (${error.message}) y no hay respaldos automáticos válidos. Se guardó una copia en ${path.basename(danado)}.` };
  }
}

// ---------- Claves de IA cifradas (no van en datos.json ni en los respaldos) ----------
function cifradoDisponible() { try { return safeStorage.isEncryptionAvailable(); } catch { return false; } }
function leerClaves() {
  try {
    if (!fs.existsSync(CLAVES())) return {};
    const buf = fs.readFileSync(CLAVES());
    const texto = buf.subarray(0, 6).toString() === 'PLANO:' ? buf.subarray(6).toString('utf8') : safeStorage.decryptString(buf);
    const c = JSON.parse(texto);
    return c && typeof c === 'object' ? c : {};
  } catch (e) { console.error('No se pudieron leer las claves', e); return {}; }
}
function guardarClaves(claves) {
  const limpias = {};
  for (const [k, v] of Object.entries(claves || {})) if (typeof v === 'string' && v.trim()) limpias[k] = v.trim();
  if (!Object.keys(limpias).length) { fs.rmSync(CLAVES(), { force: true }); return true; }
  const texto = JSON.stringify(limpias);
  escribirSeguro(CLAVES(), cifradoDisponible() ? safeStorage.encryptString(texto) : Buffer.from('PLANO:' + texto, 'utf8'));
  return true;
}

// ---------- Imágenes de los tableros (una carpeta aparte, un archivo por tablero) ----------
const idValido = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
function rutaTablero(id) { if (!idValido(id)) throw new Error('Identificador de tablero no válido'); return path.join(TABLEROS(), `${id}.json`); }
function leerRecursosTablero(id) {
  try { const r = rutaTablero(id); return fs.existsSync(r) ? leerJSON(r) : {}; } catch (e) { console.error(e); return {}; }
}
function guardarRecursosTablero(id, assets) {
  const r = rutaTablero(id);
  if (!assets || !Object.keys(assets).length) { fs.rmSync(r, { force: true }); return true; }
  escribirSeguro(r, JSON.stringify(assets));
  return true;
}
// Borra los archivos de tableros que ya no existen (ni en los datos ni en la papelera) y llevan más de 60 días sin uso
function limpiarRecursosTableros(idsVivos) {
  if (!fs.existsSync(TABLEROS())) return 0;
  const vivos = new Set(idsVivos || []);
  const limite = Date.now() - 60 * 86400000;
  let n = 0;
  for (const f of fs.readdirSync(TABLEROS())) {
    const id = f.replace(/\.json$/, '');
    const r = path.join(TABLEROS(), f);
    if (f.endsWith('.tmp')) { fs.rmSync(r, { force: true }); continue; }
    if (!vivos.has(id) && fs.statSync(r).mtimeMs < limite) { fs.rmSync(r, { force: true }); n++; }
  }
  return n;
}
// Devuelve los datos con las imágenes de los tableros incluidas, para respaldos que se llevan a otro equipo
function incrustarRecursos(datos) {
  for (const t of datos?.pizarras || []) {
    if (t && !(t.assets && Object.keys(t.assets).length) && idValido(t.id)) {
      const a = leerRecursosTablero(t.id);
      if (Object.keys(a).length) t.assets = a;
    }
  }
  return datos;
}
function quitarClaves(datos) {
  if (datos?.config?.ia) datos.config.ia = { ...datos.config.ia, claves: {} };
  return datos;
}
// Respaldo completo y autocontenido (datos + imágenes de tableros, sin claves de IA)
function textoRespaldoCompleto(textoDatos, sangria) {
  const d = quitarClaves(incrustarRecursos(JSON.parse(textoDatos)));
  delete d.__recuperado;
  return JSON.stringify(d, null, sangria);
}

module.exports = {
  DIR, DATOS, RESPALDOS, fechaArchivo, escribirSeguro, leerJSON, respaldoAutomatico, listarRespaldos, cargarDatos,
  leerClaves, guardarClaves, cifradoDisponible, leerRecursosTablero, guardarRecursosTablero, limpiarRecursosTableros,
  textoRespaldoCompleto, quitarClaves,
};
