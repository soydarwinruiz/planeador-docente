// Almacenamiento local seguro: escritura atómica con fsync, recuperación automática ante archivos dañados,
// respaldos automáticos (recientes + uno por día), claves de IA cifradas e imágenes de los tableros en archivos aparte.
const { app, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const bd = require('./basedatos');

const DIR = () => app.getPath('userData');
const DATOS = () => path.join(DIR(), 'datos.json');
const RESPALDOS = () => path.join(DIR(), 'respaldos-automaticos');
const TABLEROS = () => path.join(DIR(), 'tableros');
const CLAVES = () => path.join(DIR(), 'claves.dat');
const ANIOS = () => path.join(DIR(), 'anios-anteriores');
const REGISTRO = () => path.join(DIR(), 'registro-notas.jsonl');
const REGISTRO_MAX = 200000;
const MAX_RECIENTES = 15; // respaldo_AAAA-MM-DD_HHMM.db
const MAX_DIARIOS = 30; // diario_AAAA-MM-DD.db
const ANTES_2 = () => path.join(DIR(), 'antes-de-2.0'); // copia de los archivos de la versión 1.x tras la migración

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
  const t = fs.readFileSync(ruta, 'utf8').replace(/^\uFEFF/, '');
  const d = JSON.parse(t);
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('contenido no válido');
  return d;
}

// ---------- Respaldos automáticos ----------
// Copias consistentes de tiza.db (cifradas como la base de datos): al abrir y cada hora si hubo cambios
// (15 recientes) y una por día durante 30 días. Se listan también los respaldos .json de la versión 1.x.
function listarRespaldos() {
  if (!fs.existsSync(RESPALDOS())) return [];
  return fs.readdirSync(RESPALDOS()).filter((f) => /^(respaldo|diario)_.*\.(db|json)$/.test(f))
    .sort((a, b) => fs.statSync(path.join(RESPALDOS(), b)).mtimeMs - fs.statSync(path.join(RESPALDOS(), a)).mtimeMs);
}
let hayCambios = true; // desde el último respaldo
function marcarCambios() { hayCambios = true; }
function respaldoAutomatico({ forzar = false } = {}) {
  try {
    if (!bd.existe() || (!forzar && !hayCambios) || !bd.llave()) return;
    fs.mkdirSync(RESPALDOS(), { recursive: true });
    const reciente = path.join(RESPALDOS(), `respaldo_${fechaArchivo()}.db`);
    bd.copiarA(reciente);
    fs.copyFileSync(reciente, path.join(RESPALDOS(), `diario_${fechaArchivo().slice(0, 10)}.db`)); // el último del día queda como respaldo de ese día
    hayCambios = false;
    const podar = (prefijo, max) => {
      const l = fs.readdirSync(RESPALDOS()).filter((f) => f.startsWith(prefijo) && /\.(db|json)$/.test(f)).sort();
      while (l.length > max) fs.rmSync(path.join(RESPALDOS(), l.shift()), { force: true });
    };
    podar('respaldo_', MAX_RECIENTES);
    podar('diario_', MAX_DIARIOS);
  } catch (e) { console.error('Error en respaldo automático', e); }
}
function leerRespaldoAuto(nombre) {
  const ruta = path.join(RESPALDOS(), path.basename(String(nombre)));
  return ruta.endsWith('.db') ? bd.leerEstadoDeArchivo(ruta) : leerJSON(ruta);
}

// ---------- Carga con migración y recuperación ----------
// La primera vez con la 2.0 se pasan a la base de datos los archivos de la versión 1.x (datos.json, registro de
// notas y años anteriores) y se guardan en la carpeta "antes-de-2.0". Si la base de datos está dañada se conserva
// una copia y se cargan automáticamente los datos del respaldo válido más reciente.
function migrarDesde1x() {
  if (!fs.existsSync(DATOS())) return false;
  if (bd.tieneDatos()) {
    // Si hay un datos.json más reciente que la base de datos, el docente volvió a trabajar con la 1.x:
    // se guarda una copia de la base de datos y se migra otra vez desde ese datos.json
    if (fs.statSync(DATOS()).mtimeMs <= fs.statSync(bd.BD()).mtimeMs) return false;
    try { leerJSON(DATOS()); } catch { return false; }
    fs.mkdirSync(RESPALDOS(), { recursive: true });
    bd.copiarA(path.join(RESPALDOS(), `respaldo_${fechaArchivo()}_antes-de-volver-a-2.0.db`));
    bd.reiniciar();
    fs.rmSync(path.join(ANTES_2(), 'datos.json'), { force: true });
  }
  let datos;
  try { datos = leerJSON(DATOS()); } catch { return false; } // dañado: lo resuelve la recuperación con respaldos .json
  bd.abrir();
  bd.escribirEstado(datos);
  if (fs.existsSync(REGISTRO())) {
    const lineas = fs.readFileSync(REGISTRO(), 'utf8').split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    bd.agregarRegistro(lineas);
  }
  if (fs.existsSync(ANIOS())) {
    for (const f of fs.readdirSync(ANIOS()).filter((x) => x.endsWith('.meta.json'))) {
      try { const meta = leerJSON(path.join(ANIOS(), f)); bd.guardarAnioBD(meta, leerJSON(path.join(ANIOS(), `${meta.id}.json`))); } catch (e) { console.error('Año no migrado', f, e); }
    }
  }
  // Verificación: lo que quedó en la base de datos se puede leer
  bd.cerrar(); bd.leerEstado();
  fs.mkdirSync(ANTES_2(), { recursive: true });
  const mover = (origen, nombre) => { if (fs.existsSync(origen)) fs.renameSync(origen, path.join(ANTES_2(), nombre)); };
  fs.rmSync(path.join(ANTES_2(), 'anios-anteriores'), { recursive: true, force: true });
  mover(DATOS(), 'datos.json'); mover(REGISTRO(), 'registro-notas.jsonl'); mover(ANIOS(), 'anios-anteriores');
  return true;
}
function cargarDatos() {
  try { migrarDesde1x(); } catch (e) { console.error('Error al migrar a la base de datos', e); bd.cerrar(); fs.rmSync(bd.BD(), { force: true }); }
  try {
    if (!bd.tieneDatos()) {
      if (!fs.existsSync(DATOS())) return null;
      try { return leerJSON(DATOS()); } catch (error) { return recuperar(error, DATOS()); }
    }
    const E = bd.leerEstado();
    PARTES.clear();
    if (E) { for (const k of Object.keys(E)) PARTES.set(k, JSON.stringify(E[k])); E.__enBD = true; } // la interfaz sabe que esto ya está en la base de datos
    return E;
  } catch (error) { bd.cerrar(); return recuperar(error, bd.BD()); }
}
function recuperar(error, archivo) {
  const ext = path.extname(archivo);
  const danado = path.join(DIR(), `datos-danado_${fechaArchivo()}${ext}`);
  try { fs.copyFileSync(archivo, danado); } catch { /* sin copia */ }
  for (const f of listarRespaldos()) {
    try {
      const d = leerRespaldoAuto(f);
      if (!d || !d.config) continue;
      if (ext === '.db') bd.reiniciar(); // la base de datos se vuelve a crear con los datos del respaldo al guardar
      d.__recuperado = { desde: f, danado: path.basename(danado) };
      return d;
    } catch { /* probar el siguiente */ }
  }
  return { __error: `No se pudieron leer los datos (${error.message}) y no hay respaldos automáticos válidos. Se guardó una copia en ${path.basename(danado)}.` };
}
// Guarda el estado que envía la interfaz. Se lleva en memoria el texto de cada parte (para los respaldos en la nube)
// y en la base de datos solo cambian las filas modificadas.
const PARTES = new Map();
function guardarEstado(texto) {
  const E = JSON.parse(texto);
  if (!E || typeof E !== 'object' || !E.config) throw new Error('Estado no válido');
  PARTES.clear();
  for (const k of Object.keys(E)) if (!k.startsWith('__')) PARTES.set(k, JSON.stringify(E[k]));
  if (bd.escribirEstado(E)) marcarCambios();
}
function guardarPartes(cambios, quitar) {
  const E = {};
  for (const [k, v] of Object.entries(cambios || {})) { if (typeof v !== 'string' || k.startsWith('__')) continue; E[k] = JSON.parse(v); }
  if (E.config === null || (Object.hasOwn(E, 'config') && typeof E.config !== 'object')) throw new Error('Estado no válido');
  const q = (quitar || []).filter((k) => typeof k === 'string' && k !== 'config');
  if (bd.escribirEstado(E, { parcial: true, quitar: q })) marcarCambios();
  for (const k of Object.keys(E)) PARTES.set(k, cambios[k]);
  for (const k of q) PARTES.delete(k);
}
// Información para la tarjeta "Almacenamiento" de Configuración
function infoAlmacen() {
  const tam = (r) => { try { return fs.statSync(r).size; } catch { return 0; } };
  const llave = (() => { try { return JSON.parse(fs.readFileSync(bd.LLAVE_ARCHIVO(), 'utf8')).modo; } catch { return ''; } })();
  const carpetaTam = (d) => { try { return fs.readdirSync(d, { withFileTypes: true }).reduce((s, f) => s + (f.isDirectory() ? carpetaTam(path.join(d, f.name)) : tam(path.join(d, f.name))), 0); } catch { return 0; } };
  return { bd: tam(bd.BD()), respaldos: carpetaTam(RESPALDOS()), proteccion: llave, antes2: fs.existsSync(ANTES_2()), registro: bd.existe() ? bd.abrir().prepare('SELECT COUNT(*) n FROM registro').get().n : 0 };
}
// Borra la copia sin cifrar de los archivos de la versión 1.x (y sus respaldos .json)
function borrarAntes2() {
  fs.rmSync(ANTES_2(), { recursive: true, force: true });
  if (fs.existsSync(RESPALDOS())) for (const f of fs.readdirSync(RESPALDOS())) if (f.endsWith('.json')) fs.rmSync(path.join(RESPALDOS(), f), { force: true });
  return true;
}
// El estado completo como texto JSON (para el respaldo en la nube)
function estadoTexto() {
  if (!PARTES.size) return '';
  return '{' + [...PARTES].map(([k, v]) => JSON.stringify(k) + ':' + v).join(',') + '}';
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
// ---------- Registro de cambios de notas (tabla "registro" de la base de datos, cifrada) ----------
function leerRegistro() { return bd.existe() ? bd.leerRegistro() : []; }
function agregarRegistro(lista) { bd.agregarRegistro(lista); marcarCambios(); return true; }
function reemplazarRegistro(lista) { bd.reemplazarRegistro(lista, REGISTRO_MAX); marcarCambios(); return true; }
function podarRegistro() { try { if (bd.existe() && bd.llave()) bd.podarRegistro(REGISTRO_MAX); } catch (e) { console.error(e); } }

// ---------- Años anteriores (tabla "anios" de la base de datos, cifrada) ----------
function metaAnio(id, d) {
  const activos = (d.alumnos || []).filter((a) => a && a.activo !== false);
  return { id, anio: d.config?.anio || '', institucion: d.config?.institucion || '', docente: d.config?.docente || '', archivado: new Date().toISOString(),
    grupos: (d.grupos || []).length, estudiantes: activos.length, planeaciones: (d.planeaciones || []).length };
}
function guardarAnio(datos, meta, { conRegistroActual = false } = {}) {
  const d = typeof datos === 'string' ? JSON.parse(datos) : datos;
  if (!d || typeof d !== 'object' || !d.config) throw new Error('Datos no válidos para archivar.');
  quitarClaves(d);
  delete d.papelera; delete d.__recuperado; delete d.aniosAnteriores;
  if (conRegistroActual) d.registroNotas = leerRegistro(); // al archivar el año en curso
  const id = meta?.id && idValido(meta.id) ? meta.id : `anio-${String(d.config.anio || 'sin-anio').replace(/[^\w-]/g, '')}-${Date.now().toString(36)}`;
  const m = { ...metaAnio(id, d), ...(meta || {}), id };
  bd.guardarAnioBD(m, d);
  marcarCambios();
  return m;
}
function listarAnios() {
  if (!bd.existe()) return [];
  return bd.listarAniosBD().sort((a, b) => String(b.anio).localeCompare(String(a.anio)) || String(b.archivado).localeCompare(String(a.archivado)));
}
function leerAnio(id) { if (!idValido(id)) throw new Error('Año no válido'); return bd.leerAnioBD(id); }
function eliminarAnio(id) { if (!idValido(id)) throw new Error('Año no válido'); bd.eliminarAnioBD(id); marcarCambios(); return true; }
// Los respaldos traen los años archivados: se recuperan los que no estén en este equipo
function restaurarAniosDeRespaldo(datos) {
  const lista = Array.isArray(datos?.aniosAnteriores) ? datos.aniosAnteriores : [];
  delete datos.aniosAnteriores;
  const existentes = new Set(listarAnios().map((m) => m.id));
  let n = 0;
  for (const a of lista) {
    if (!a?.meta?.id || !a.datos || existentes.has(a.meta.id) || !idValido(a.meta.id)) continue;
    try { guardarAnio(a.datos, a.meta); n++; } catch (e) { console.error(e); }
  }
  return n;
}

// Respaldo completo y autocontenido (datos + imágenes de tableros + años anteriores, sin claves de IA)
function textoRespaldoCompleto(textoDatos, sangria) {
  const d = quitarClaves(incrustarRecursos(JSON.parse(textoDatos)));
  delete d.__recuperado;
  if (!Array.isArray(d.registroNotas)) d.registroNotas = leerRegistro();
  const anios = listarAnios();
  if (anios.length) d.aniosAnteriores = anios.map((meta) => { try { return { meta, datos: leerAnio(meta.id) }; } catch { return null; } }).filter(Boolean);
  return JSON.stringify(d, null, sangria);
}

module.exports = {
  DIR, DATOS, RESPALDOS, fechaArchivo, escribirSeguro, leerJSON, respaldoAutomatico, listarRespaldos, cargarDatos, guardarEstado, guardarPartes, estadoTexto, leerRespaldoAuto, infoAlmacen, borrarAntes2,
  leerClaves, guardarClaves, cifradoDisponible, leerRecursosTablero, guardarRecursosTablero, limpiarRecursosTableros,
  textoRespaldoCompleto, quitarClaves, leerRegistro, agregarRegistro, reemplazarRegistro, podarRegistro, guardarAnio, listarAnios, leerAnio, eliminarAnio, restaurarAniosDeRespaldo,
};
