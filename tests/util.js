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
  const app = await _electron.launch({ executablePath: ELECTRON, args: [RAIZ, '--no-sandbox'], env: { ...process.env, PLANEADOR_DATA_DIR: dir } });
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
const datos = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'datos.json'), 'utf8'));
const nuevaCarpeta = () => fs.mkdtempSync(path.join(os.tmpdir(), 'planeador-prueba-'));

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

module.exports = { fs, os, path, assert, RAIZ, abrir, esperarGuardado, datos, nuevaCarpeta, prueba, sembrar, terminar };
