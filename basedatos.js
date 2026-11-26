// Base de datos de Tiza (2.0): SQLite (incluido en Electron/Node, sin componentes adicionales) con cada fila cifrada.
//
// - Un solo archivo: tiza.db. El estado del programa se guarda por partes: cada elemento de una lista (un grupo,
//   un estudiante, una planeación…), cada entrada de un mapa (las notas de una actividad, la asistencia de un día…)
//   y cada valor suelto (la configuración) es una fila. En cada guardado solo se escriben las filas que cambiaron,
//   dentro de una transacción: o se guarda todo el cambio o nada (a prueba de apagones).
// - Cifrado: el contenido de cada fila va cifrado con AES-256-GCM y una "llave de datos" aleatoria. Esa llave se
//   guarda en llave.dat protegida por Windows (DPAPI, ligada al usuario) o, si el docente activa la clave de acceso,
//   encerrada con su clave y con su código de recuperación (sin la clave no se pueden leer los datos).
const { app, safeStorage } = require('electron');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DIR = () => app.getPath('userData');
const BD = () => path.join(DIR(), 'tiza.db');
const LLAVE_ARCHIVO = () => path.join(DIR(), 'llave.dat');
const ESQUEMA = 1;

// ---------- Llave de datos ----------
let LLAVE = null; // Buffer de 32 bytes, solo en memoria
function windowsDisponible() { try { return !process.env.TIZA_LLAVE_PLANA && safeStorage.isEncryptionAvailable(); } catch { return false; } }
function leerArchivoLlave() { try { return JSON.parse(fs.readFileSync(LLAVE_ARCHIVO(), 'utf8')); } catch { return null; } }
function escribirArchivoLlave(obj) {
  const { escribirSeguro } = require('./almacen');
  escribirSeguro(LLAVE_ARCHIVO(), JSON.stringify(obj));
}
function derivar(secreto, salHex) { return crypto.scryptSync(String(secreto).normalize('NFC'), Buffer.from(salHex, 'hex'), 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }); }
function encerrar(llave, secreto) {
  const sal = crypto.randomBytes(16).toString('hex'), iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', derivar(secreto, sal), iv);
  const ct = Buffer.concat([c.update(llave), c.final()]);
  return { sal, iv: iv.toString('hex'), tag: c.getAuthTag().toString('hex'), ct: ct.toString('hex') };
}
function abrirEncerrada(env, secreto) {
  const d = crypto.createDecipheriv('aes-256-gcm', derivar(secreto, env.sal), Buffer.from(env.iv, 'hex'));
  d.setAuthTag(Buffer.from(env.tag, 'hex'));
  return Buffer.concat([d.update(Buffer.from(env.ct, 'hex')), d.final()]);
}
function guardarLlaveSinClave(llave) {
  escribirArchivoLlave(windowsDisponible()
    ? { v: 1, modo: 'windows', windows: safeStorage.encryptString(llave.toString('hex')).toString('base64') }
    : { v: 1, modo: 'plano', plano: llave.toString('hex') });
}
// Devuelve la llave en memoria (la crea la primera vez). null si está protegida con la clave y aún no se abrió.
function llave() {
  if (LLAVE) return LLAVE;
  const a = leerArchivoLlave();
  if (!a) { LLAVE = crypto.randomBytes(32); guardarLlaveSinClave(LLAVE); return LLAVE; }
  if (a.modo === 'windows') LLAVE = Buffer.from(safeStorage.decryptString(Buffer.from(a.windows, 'base64')), 'hex');
  else if (a.modo === 'plano') LLAVE = Buffer.from(a.plano, 'hex');
  return LLAVE;
}
function llaveConClave() { return leerArchivoLlave()?.modo === 'clave'; }
// Las llama acceso.js: abrir la llave con la clave o el código, y protegerla al activar, cambiar o quitar la clave
function abrirLlaveConClave(clave) { const a = leerArchivoLlave(); if (a?.modo !== 'clave') return true; try { LLAVE = abrirEncerrada(a.clave, clave); return true; } catch { return false; } }
function abrirLlaveConCodigo(codigo) { const a = leerArchivoLlave(); if (a?.modo !== 'clave') return true; try { LLAVE = abrirEncerrada(a.recuperacion, codigo); return true; } catch { return false; } }
function protegerLlaveConClave(clave, codigo) {
  const k = llave();
  if (!k) throw new Error('La llave de datos no está abierta.');
  escribirArchivoLlave({ v: 1, modo: 'clave', clave: encerrar(k, clave), recuperacion: encerrar(k, codigo) });
}
function protegerLlaveSinClave() { const k = llave(); if (k) guardarLlaveSinClave(k); }

// ---------- Cifrado de cada fila ----------
function cifrar(texto) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', llave(), iv);
  const ct = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]);
}
function descifrar(blob, k = llave()) {
  const b = Buffer.from(blob);
  const d = crypto.createDecipheriv('aes-256-gcm', k, b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
}

// ---------- Conexión ----------
let db = null;
function crearEsquema(base) {
  base.exec(`PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA foreign_keys=OFF;
    CREATE TABLE IF NOT EXISTS colecciones (coleccion TEXT PRIMARY KEY, tipo TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS filas (n INTEGER PRIMARY KEY, coleccion TEXT NOT NULL, clave TEXT NOT NULL, orden INTEGER NOT NULL DEFAULT 0, datos BLOB NOT NULL, UNIQUE (coleccion, clave));
    CREATE TABLE IF NOT EXISTS registro (n INTEGER PRIMARY KEY AUTOINCREMENT, datos BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS anios (id TEXT PRIMARY KEY, meta TEXT NOT NULL, datos BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS info (k TEXT PRIMARY KEY, v TEXT);`);
  base.prepare('INSERT OR IGNORE INTO info (k, v) VALUES (?, ?)').run('esquema', String(ESQUEMA));
  base.prepare('INSERT OR IGNORE INTO info (k, v) VALUES (?, ?)').run('creada', new Date().toISOString());
}
function existe() { return fs.existsSync(BD()); }
function tieneDatos() { return existe() && abrir().prepare('SELECT COUNT(*) n FROM colecciones').get().n > 0; }
function abrir() {
  if (db) return db;
  fs.mkdirSync(DIR(), { recursive: true });
  const base = new DatabaseSync(BD());
  try { crearEsquema(base); } catch (e) { try { base.close(); } catch { /* */ } throw e; }
  db = base;
  return db;
}
function cerrar() { if (db) { try { db.close(); } catch { /* */ } db = null; } CACHE = null; }
function transaccion(base, fn) {
  base.exec('BEGIN IMMEDIATE');
  try { const r = fn(); base.exec('COMMIT'); return r; } catch (e) { try { base.exec('ROLLBACK'); } catch { /* */ } throw e; }
}

// ---------- Estado del programa ↔ filas ----------
const esObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
function tipoDe(clave, v) {
  if (Array.isArray(v) && v.length && v.every((x) => esObjeto(x) && (typeof x.id === 'string' || typeof x.id === 'number')) && new Set(v.map((x) => String(x.id))).size === v.length) return 'lista';
  if (clave === 'asistencia' && esObjeto(v)) return 'mapa2'; // grupo|área → fecha: una fila por día
  if (esObjeto(v) && clave !== 'config') return 'mapa';
  return 'valor';
}
// Separa grupo|área y fecha en la clave de cada fila de asistencia (los id y las fechas nunca llevan #)
const SEP = '#';
function filasDe(clave, v) {
  const tipo = tipoDe(clave, v), filas = new Map();
  if (tipo === 'lista') v.forEach((x, i) => filas.set(String(x.id), { orden: i, json: JSON.stringify(x) }));
  else if (tipo === 'mapa') Object.keys(v).forEach((k, i) => filas.set(k, { orden: i, json: JSON.stringify(v[k]) }));
  else if (tipo === 'mapa2') { let i = 0; for (const k of Object.keys(v)) { const sub = v[k]; if (esObjeto(sub) && Object.keys(sub).length) for (const f of Object.keys(sub)) filas.set(k + SEP + f, { orden: i++, json: JSON.stringify(sub[f]) }); else filas.set(k + SEP, { orden: i++, json: JSON.stringify(null) }); } }
  else filas.set('', { orden: 0, json: JSON.stringify(v === undefined ? null : v) });
  return { tipo, filas };
}
function armar(tipo, filas) {
  if (tipo === 'lista') return filas.map((f) => JSON.parse(f.json));
  if (tipo === 'valor') return filas.length ? JSON.parse(filas[0].json) : null;
  const o = {};
  if (tipo === 'mapa') for (const f of filas) o[f.clave] = JSON.parse(f.json);
  else for (const f of filas) { const i = f.clave.lastIndexOf(SEP); const k = f.clave.slice(0, i), fecha = f.clave.slice(i + 1); o[k] ||= {}; if (fecha) o[k][fecha] = JSON.parse(f.json); }
  return o;
}
let CACHE = null; // coleccion → { tipo, filas: Map(clave → { orden, json }) } tal como están en la base de datos
function leerDe(base, k) {
  const cache = new Map(), estado = {};
  const tipos = base.prepare('SELECT coleccion, tipo FROM colecciones').all();
  const sel = base.prepare('SELECT clave, orden, datos FROM filas WHERE coleccion = ? ORDER BY orden');
  for (const { coleccion, tipo } of tipos) {
    const filas = sel.all(coleccion).map((f) => ({ clave: f.clave, orden: f.orden, json: descifrar(f.datos, k) }));
    estado[coleccion] = armar(tipo, filas);
    cache.set(coleccion, { tipo, filas: new Map(filas.map((f) => [f.clave, { orden: f.orden, json: f.json }])) });
  }
  return { estado, cache };
}
function verificar(base) {
  const r = base.prepare('PRAGMA quick_check').get();
  const v = r && Object.values(r)[0];
  if (v !== 'ok') throw new Error('La base de datos está dañada (' + v + ').');
}
function leerEstado() {
  const base = abrir();
  verificar(base);
  if (!base.prepare('SELECT COUNT(*) n FROM colecciones').get().n) { CACHE = new Map(); return null; }
  const { estado, cache } = leerDe(base, llave());
  CACHE = cache;
  return estado;
}
// Lee un respaldo .db (con la llave de este equipo)
function leerEstadoDeArchivo(ruta) {
  const base = new DatabaseSync(ruta, { readOnly: true });
  try { verificar(base); return leerDe(base, llave()).estado; } finally { base.close(); }
}
// Guarda el estado: solo las filas que cambiaron, en una transacción
function escribirEstado(E, { parcial = false, quitar = [] } = {}) {
  const base = abrir();
  if (!CACHE) { try { leerEstado(); } catch { CACHE = new Map(); } }
  const nuevo = new Map();
  for (const k of Object.keys(E)) if (!k.startsWith('__')) nuevo.set(k, filasDe(k, E[k]));
  const ins = base.prepare('INSERT INTO filas (coleccion, clave, orden, datos) VALUES (?, ?, ?, ?) ON CONFLICT (coleccion, clave) DO UPDATE SET orden = excluded.orden, datos = excluded.datos');
  const ord = base.prepare('UPDATE filas SET orden = ? WHERE coleccion = ? AND clave = ?');
  const del = base.prepare('DELETE FROM filas WHERE coleccion = ? AND clave = ?');
  const delCol = base.prepare('DELETE FROM filas WHERE coleccion = ?');
  const tipoCol = base.prepare('INSERT INTO colecciones (coleccion, tipo) VALUES (?, ?) ON CONFLICT (coleccion) DO UPDATE SET tipo = excluded.tipo');
  const borrarCol = base.prepare('DELETE FROM colecciones WHERE coleccion = ?');
  let escritas = 0;
  const borrar = parcial ? quitar.filter((col) => CACHE.has(col) || nuevo.has(col) === false) : [...CACHE.keys()].filter((col) => !nuevo.has(col));
  transaccion(base, () => {
    for (const [col, { tipo, filas }] of nuevo) {
      let previo = CACHE.get(col);
      if (!previo || previo.tipo !== tipo) { delCol.run(col); tipoCol.run(col, tipo); previo = { tipo, filas: new Map() }; }
      for (const [clave, f] of filas) {
        const p = previo.filas.get(clave);
        if (!p || p.json !== f.json) { ins.run(col, clave, f.orden, cifrar(f.json)); escritas++; }
        else if (p.orden !== f.orden) ord.run(f.orden, col, clave);
      }
      for (const clave of previo.filas.keys()) if (!filas.has(clave)) { del.run(col, clave); escritas++; }
    }
    for (const col of borrar) { delCol.run(col); borrarCol.run(col); }
  });
  // La memoria de lo guardado solo se actualiza si la transacción se confirmó
  if (!parcial) CACHE.clear();
  for (const col of borrar) CACHE.delete(col);
  for (const [col, v] of nuevo) CACHE.set(col, v);
  return escritas;
}
// Copia consistente de la base de datos (para respaldos automáticos)
function copiarA(ruta) {
  const base = abrir();
  fs.rmSync(ruta, { force: true });
  base.exec(`VACUUM INTO '${ruta.replace(/'/g, "''")}'`);
}
// Empieza de cero (tras una recuperación): la base dañada ya se copió aparte
function reiniciar() {
  cerrar();
  for (const sufijo of ['', '-journal', '-wal', '-shm']) fs.rmSync(BD() + sufijo, { force: true });
  abrir();
  CACHE = new Map();
}

// ---------- Registro de cambios de notas ----------
function leerRegistro() { return abrir().prepare('SELECT datos FROM registro ORDER BY n').all().map((f) => { try { return JSON.parse(descifrar(f.datos)); } catch { return null; } }).filter(Boolean); }
function agregarRegistro(lista) {
  if (!Array.isArray(lista) || !lista.length) return true;
  const base = abrir(), ins = base.prepare('INSERT INTO registro (datos) VALUES (?)');
  transaccion(base, () => { for (const x of lista) ins.run(cifrar(JSON.stringify(x))); });
  return true;
}
function reemplazarRegistro(lista, max = 200000) {
  const base = abrir(), ins = base.prepare('INSERT INTO registro (datos) VALUES (?)');
  transaccion(base, () => { base.exec('DELETE FROM registro'); for (const x of (Array.isArray(lista) ? lista : []).slice(-max)) ins.run(cifrar(JSON.stringify(x))); });
  return true;
}
function podarRegistro(max = 200000) {
  const base = abrir(), n = base.prepare('SELECT COUNT(*) n FROM registro').get().n;
  if (n > max) base.prepare('DELETE FROM registro WHERE n IN (SELECT n FROM registro ORDER BY n LIMIT ?)').run(n - max);
}

// ---------- Años anteriores ----------
function guardarAnioBD(meta, datos) { abrir().prepare('INSERT INTO anios (id, meta, datos) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET meta = excluded.meta, datos = excluded.datos').run(meta.id, JSON.stringify(meta), cifrar(JSON.stringify(datos))); }
function listarAniosBD() { return abrir().prepare('SELECT meta FROM anios').all().map((f) => { try { return JSON.parse(f.meta); } catch { return null; } }).filter(Boolean); }
function leerAnioBD(id) { const f = abrir().prepare('SELECT datos FROM anios WHERE id = ?').get(id); if (!f) throw new Error('Ese año no existe.'); return JSON.parse(descifrar(f.datos)); }
function eliminarAnioBD(id) { abrir().prepare('DELETE FROM anios WHERE id = ?').run(id); return true; }

module.exports = {
  BD, LLAVE_ARCHIVO, existe, tieneDatos, abrir, cerrar, reiniciar, leerEstado, leerEstadoDeArchivo, escribirEstado, copiarA,
  llave, llaveConClave, abrirLlaveConClave, abrirLlaveConCodigo, protegerLlaveConClave, protegerLlaveSinClave,
  leerRegistro, agregarRegistro, reemplazarRegistro, podarRegistro, guardarAnioBD, listarAniosBD, leerAnioBD, eliminarAnioBD,
};
