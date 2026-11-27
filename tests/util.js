// Utilidades compartidas por las pruebas de punta a punta
const { _electron } = require('playwright-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const RAIZ = path.join(__dirname, '..');
const ELECTRON = require(path.join(RAIZ, 'node_modules', 'electron'));
const estado = { fallas: 0 };

async function abrir(dir) {
  const app = await _electron.launch({ executablePath: ELECTRON, args: [RAIZ, '--no-sandbox'], env: { ...process.env, PLANEADOR_DATA_DIR: dir, TIZA_LLAVE_PLANA: '1' } });
  const w = await app.firstWindow();
  const errores = [];
  w.on('pageerror', (e) => errores.push(e.message));
  w.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await w.waitForFunction(() => typeof S !== 'undefined' && S && typeof render === 'function');
  return { app, w, errores };
}
// Espera a que termine el guardado diferido
async function esperarGuardado(w) {
  await w.waitForFunction(() => !temporizadorGuardado);
  await w.evaluate(() => cadenaGuardado);
}
// Lee la base de datos cifrada de una carpeta de pruebas (en pruebas la llave queda en llave.dat sin proteger)
function leerBD(dir) {
  const { DatabaseSync } = require('node:sqlite');
  const crypto = require('crypto');
  const llave = Buffer.from(JSON.parse(fs.readFileSync(path.join(dir, 'llave.dat'), 'utf8')).plano, 'hex');
  const descifrar = (blob) => { const b = Buffer.from(blob); const d = crypto.createDecipheriv('aes-256-gcm', llave, b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')); };
  const db = new DatabaseSync(path.join(dir, 'tiza.db'), { readOnly: true });
  try {
    const estado = {};
    for (const { coleccion, tipo } of db.prepare('SELECT coleccion, tipo FROM colecciones').all()) {
      const filas = db.prepare('SELECT clave, datos FROM filas WHERE coleccion = ? ORDER BY orden').all(coleccion).map((f) => ({ clave: f.clave, v: descifrar(f.datos) }));
      if (tipo === 'lista') estado[coleccion] = filas.map((f) => f.v);
      else if (tipo === 'valor') estado[coleccion] = filas[0]?.v ?? null;
      else if (tipo === 'mapa') estado[coleccion] = Object.fromEntries(filas.map((f) => [f.clave, f.v]));
      else { const o = {}; for (const f of filas) { const i = f.clave.lastIndexOf('#'); const k = f.clave.slice(0, i), fecha = f.clave.slice(i + 1); o[k] ||= {}; if (fecha) o[k][fecha] = f.v; } estado[coleccion] = o; }
    }
    const registro = db.prepare('SELECT datos FROM registro ORDER BY n').all().map((f) => descifrar(f.datos));
    return { estado, registro };
  } finally { db.close(); }
}
const datos = (dir) => leerBD(dir).estado;
const registroDe = (dir) => leerBD(dir).registro;
// Con tildes, ñ y espacios, como la carpeta de un usuario de Windows llamado "José Muñoz"
const nuevaCarpeta = () => fs.mkdtempSync(path.join(os.tmpdir(), 'Tiza prueba José Muñoz-'));

async function prueba(nombre, fn) {
  const t0 = Date.now();
  try { await Promise.race([fn(), new Promise((_, mal) => setTimeout(() => mal(new Error('La prueba tardó más de 120 s')), 120000))]); console.log(`✓ ${nombre} (${Date.now() - t0} ms)`); } catch (e) { estado.fallas++; console.error(`✗ ${nombre}\n  ${e.stack || e}`); }
}

async function sembrar(w) {
  await w.evaluate(() => {
    cerrarModal();
    Object.assign(S.config, { institucion: 'IE Prueba', docente: 'Ana Pérez', configurado: true });
    S.areas.push({ id: 'a1', nombre: 'Matemáticas' });
    S.grupos.push({ id: 'g1', grado: 7, nombre: 'A', areas: [{ areaId: 'a1', horas: 4 }] });
    for (let i = 0; i < 25; i++) S.alumnos.push({ id: 'al' + i, grupoId: 'g1', nombres: 'Nombre' + i, apellidos: 'Apellido' + i, activo: true });
    guardar();
  });
  await esperarGuardado(w);
}

function terminar() {
  if (estado.fallas) { console.error(`\n${estado.fallas} prueba(s) fallaron`); process.exit(1); }
  console.log('\nTodas las pruebas pasaron');
}

module.exports = { fs, os, path, assert, RAIZ, abrir, esperarGuardado, datos, registroDe, leerBD, nuevaCarpeta, prueba, sembrar, terminar };
