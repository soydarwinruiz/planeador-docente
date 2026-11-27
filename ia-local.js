// IA local: el motor llama.cpp (licencia MIT) y un modelo Qwen3 (Apache 2.0) se descargan una sola vez a la carpeta
// de datos y desde entonces la IA funciona sin internet. El motor solo escucha en este equipo (127.0.0.1), se enciende
// cuando se usa la IA y se apaga al cerrar Tiza o tras un rato sin uso.
//
// Las descargas se verifican con su huella SHA-256 (fijada aquí, de la versión exacta) y se reanudan si se cortan.
// También se puede instalar desde una carpeta (por ejemplo, una USB con los archivos que otro docente ya descargó).
const { app, net } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const VERSION_MOTOR = 'b12815';
const MOTORES = {
  win32: { archivo: 'llama-b12815-bin-win-cpu-x64.zip', tam: 25351642, sha256: '8167d30d05420295ade9b9db3e73d0325aca75b72ced25c030d5dd3d7b0fde5a', ejecutable: 'llama-server.exe' },
  linux: { archivo: 'llama-b12815-bin-ubuntu-x64.tar.gz', tam: 23491803, sha256: '026ecc42e2b8ba93c5d0508a9715f0921aea89a88df6d75eb17831af0ef250e1', ejecutable: path.join('llama-b12815', 'llama-server') },
};
const MODELOS = {
  ligero: { nombre: 'Qwen3 4B', descripcion: 'Para equipos con 8 GB de memoria (RAM)', archivo: 'Qwen3-4B-Q4_K_M.gguf', repo: 'Qwen/Qwen3-4B-GGUF', rev: 'bc640142c66e1fdd12af0bd68f40445458f3869b', tam: 2497280256, sha256: '7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5', ram: 8 },
  completo: { nombre: 'Qwen3 8B', descripcion: 'Mejores respuestas; para equipos con 16 GB de RAM o más', archivo: 'Qwen3-8B-Q4_K_M.gguf', repo: 'Qwen/Qwen3-8B-GGUF', rev: '7c41481f57cb95916b40956ab2f0b139b296d974', tam: 5027783488, sha256: 'd98cdcbd03e17ce47681435b5150e34c1417f50b5c0019dd560e4882c5745785', ram: 16 },
  // Solo para las pruebas automáticas (pequeño): no se ofrece a los docentes
  prueba: { nombre: 'Qwen3 0.6B', descripcion: 'Solo para pruebas', archivo: 'Qwen3-0.6B-Q8_0.gguf', repo: 'Qwen/Qwen3-0.6B-GGUF', rev: '23749fefcc72300e3a2ad315e1317431b06b590a', tam: 639446688, sha256: '9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031', ram: 2, oculto: true },
};
const urlMotor = (m) => `https://github.com/ggml-org/llama.cpp/releases/download/${VERSION_MOTOR}/${m.archivo}`;
const urlModelo = (m) => `https://huggingface.co/${m.repo}/resolve/${m.rev}/${m.archivo}`;

const BASE = () => path.join(app.getPath('userData'), 'ia-local');
const ARCHIVOS = () => path.join(BASE(), 'archivos'); // lo descargado (se puede copiar a una USB para otro equipo)
const MOTOR_DIR = () => path.join(BASE(), `motor-${VERSION_MOTOR}`);
const ESTADO = () => path.join(BASE(), 'estado.json');
const motorPlataforma = () => MOTORES[process.platform] || null;

function leerEstado() { try { return JSON.parse(fs.readFileSync(ESTADO(), 'utf8')); } catch { return null; } }
// Espacio libre en el disco de la carpeta de datos (sin crear carpetas: se mide en la carpeta existente más cercana)
function libreEnDisco(dir) {
  try { let d = dir; while (!fs.existsSync(d) && path.dirname(d) !== d) d = path.dirname(d); const s = fs.statfsSync(d); return s.bavail * s.bsize; } catch { return null; }
}
function rutaEjecutable() { const m = motorPlataforma(); return m ? path.join(MOTOR_DIR(), m.ejecutable) : null; }

// Lo que necesita la interfaz: si está instalada, qué modelo, cuánta memoria y espacio hay, y qué se recomienda
function estado() {
  const e = leerEstado();
  const ramGB = Math.round(os.totalmem() / 1024 ** 3);
  const instalado = !!(e && MODELOS[e.modelo] && fs.existsSync(path.join(ARCHIVOS(), MODELOS[e.modelo].archivo)) && fs.existsSync(rutaEjecutable() || ''));
  return {
    disponible: !!motorPlataforma(),
    instalado, modelo: instalado ? e.modelo : null, nombre: instalado ? MODELOS[e.modelo].nombre : '',
    ramGB, libre: libreEnDisco(BASE()), carpeta: BASE(), descargando: !!tarea,
    recomendado: ramGB >= 15 ? 'completo' : 'ligero',
    modelos: Object.fromEntries(Object.entries(MODELOS).filter(([k, m]) => !m.oculto || process.env.TIZA_PRUEBAS).map(([k, m]) => [k, { nombre: m.nombre, descripcion: m.descripcion, tam: m.tam + (motorPlataforma()?.tam || 0), ram: m.ram }])),
    encendida: !!(servidor && !servidor.terminado),
  };
}

// ---------- Descarga verificada y reanudable ----------
let tarea = null; // { cancelar: AbortController }
async function hashDe(ruta, hash) {
  await new Promise((ok, mal) => fs.createReadStream(ruta).on('data', (d) => hash.update(d)).on('end', ok).on('error', mal));
}
// Busca el archivo en las carpetas de origen (USB elegida por el docente o caché de pruebas) antes de descargarlo
function enOrigen(nombre, tam, origenes) {
  for (const dir of origenes.filter(Boolean)) {
    for (const r of [path.join(dir, nombre), path.join(dir, 'archivos', nombre), path.join(dir, 'ia-local', 'archivos', nombre)]) {
      try { if (fs.statSync(r).size === tam) return r; } catch { /* no está */ }
    }
  }
  return null;
}
async function obtener({ url, nombre, tam, sha256 }, { origenes, progreso, senal }) {
  fs.mkdirSync(ARCHIVOS(), { recursive: true });
  const destino = path.join(ARCHIVOS(), nombre);
  if (fs.existsSync(destino) && fs.statSync(destino).size === tam) { progreso(tam); return destino; } // ya verificado al instalarse
  const parcial = `${destino}.parcial`;
  let hash = crypto.createHash('sha256');
  const local = enOrigen(nombre, tam, origenes);
  if (local) {
    // Copia desde la carpeta de origen, verificando la huella
    await new Promise((ok, mal) => {
      let hechos = 0;
      const out = fs.createWriteStream(parcial);
      const inp = fs.createReadStream(local);
      senal.addEventListener('abort', () => { inp.destroy(new Error('Cancelado')); });
      inp.on('data', (d) => { hash.update(d); hechos += d.length; progreso(hechos); }).on('error', mal).pipe(out).on('finish', ok).on('error', mal);
    });
  } else {
    let inicio = 0;
    try { inicio = fs.statSync(parcial).size; } catch { /* nuevo */ }
    if (inicio > tam) { fs.rmSync(parcial, { force: true }); inicio = 0; }
    if (inicio) await hashDe(parcial, hash); // se reanuda: la huella incluye lo ya descargado
    if (inicio < tam) {
      let r;
      try { r = await net.fetch(url, { headers: inicio ? { Range: `bytes=${inicio}-` } : {}, signal: senal }); } catch (e) {
        if (senal.aborted) throw new Error('Cancelado');
        throw new Error('No hay conexión a internet o no se pudo contactar el servidor de descarga (' + (e.message || e) + '). Lo descargado se conserva: vuelve a intentarlo y continuará donde quedó.');
      }
      if (inicio && r.status !== 206) { inicio = 0; hash = crypto.createHash('sha256'); } // el servidor no permite continuar: desde cero
      if (!r.ok) throw new Error(`El servidor de descarga respondió ${r.status}. Inténtalo más tarde.`);
      const out = fs.createWriteStream(parcial, { flags: inicio ? 'a' : 'w' });
      let hechos = inicio;
      try {
        const lector = r.body.getReader();
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          hash.update(value);
          if (!out.write(Buffer.from(value))) await new Promise((ok) => out.once('drain', ok));
          hechos += value.length;
          progreso(hechos);
        }
      } catch (e) {
        await new Promise((ok) => out.end(ok));
        if (senal.aborted) throw new Error('Cancelado');
        throw new Error('La descarga se interrumpió (' + (e.message || e) + '). Lo descargado se conserva: vuelve a intentarlo y continuará donde quedó.');
      }
      await new Promise((ok) => out.end(ok));
    }
  }
  const real = fs.statSync(parcial).size, huella = hash.digest('hex');
  if (real !== tam || huella !== sha256) {
    fs.rmSync(parcial, { force: true });
    throw new Error(`El archivo ${nombre} no coincide con el original (tamaño o huella distintos) y se borró por seguridad. Vuelve a intentarlo.`);
  }
  fs.renameSync(parcial, destino);
  return destino;
}
// Descomprime el motor con la herramienta "tar" que trae Windows 10/11 (también abre .zip) o Linux
function descomprimir(archivo, dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  execFileSync(tar, archivo.endsWith('.zip') ? ['-xf', archivo, '-C', dir] : ['-xzf', archivo, '-C', dir], { windowsHide: true, stdio: 'ignore' });
  if (process.platform !== 'win32') { try { fs.chmodSync(rutaEjecutable(), 0o755); } catch { /* */ } }
  // Windows: las bibliotecas de Visual C++ que necesita el motor van junto a él (vienen en el instalador de Tiza),
  // por si el equipo no tiene instalado el "Microsoft Visual C++ Redistributable"
  if (process.platform === 'win32' && process.resourcesPath) {
    const vc = path.join(process.resourcesPath, 'vcrt');
    try { for (const f of fs.readdirSync(vc)) if (/\.dll$/i.test(f)) fs.copyFileSync(path.join(vc, f), path.join(path.dirname(rutaEjecutable()), f)); } catch { /* en desarrollo no están */ }
  }
}

// Instala (descarga o copia de una carpeta) el motor y el modelo elegido. progreso({ fase, hechos, total })
async function instalar({ modelo, carpeta } = {}, progreso = () => {}) {
  if (tarea) throw new Error('Ya hay una instalación en curso.');
  const m = MODELOS[modelo];
  const motor = motorPlataforma();
  if (!m || (m.oculto && !process.env.TIZA_PRUEBAS)) throw new Error('Modelo no válido.');
  if (!motor) throw new Error('La IA local solo está disponible para Windows de 64 bits.');
  const origenes = [carpeta, process.env.TIZA_IA_LOCAL_CACHE];
  const yaMotor = fs.existsSync(path.join(ARCHIVOS(), motor.archivo)), yaModelo = fs.existsSync(path.join(ARCHIVOS(), m.archivo));
  const falta = (yaMotor ? 0 : motor.tam) + (yaModelo ? 0 : m.tam);
  const libre = libreEnDisco(BASE());
  if (libre != null && libre < falta + 300 * 1024 ** 2) throw new Error(`No hay espacio suficiente en el disco: se necesitan ${(falta / 1024 ** 3).toFixed(1)} GB y hay ${(libre / 1024 ** 3).toFixed(1)} GB libres.`);
  const ctl = new AbortController();
  tarea = { cancelar: ctl };
  try {
    const total = motor.tam + m.tam;
    const zip = await obtener({ url: urlMotor(motor), nombre: motor.archivo, tam: motor.tam, sha256: motor.sha256 }, { origenes, senal: ctl.signal, progreso: (h) => progreso({ fase: 'motor', hechos: h, total }) });
    await obtener({ url: urlModelo(m), nombre: m.archivo, tam: m.tam, sha256: m.sha256 }, { origenes, senal: ctl.signal, progreso: (h) => progreso({ fase: 'modelo', hechos: motor.tam + h, total }) });
    progreso({ fase: 'preparando', hechos: total, total });
    if (!fs.existsSync(rutaEjecutable())) descomprimir(zip, MOTOR_DIR());
    if (!fs.existsSync(rutaEjecutable())) throw new Error('No se pudo preparar el motor de la IA local.');
    // Otros modelos ya no se usan: se borran para liberar espacio (con el motor apagado)
    await detener();
    for (const [k, o] of Object.entries(MODELOS)) if (k !== modelo) borrar(path.join(ARCHIVOS(), o.archivo));
    require('./almacen').escribirSeguro(ESTADO(), JSON.stringify({ modelo, motor: VERSION_MOTOR, instalado: new Date().toISOString() }));
    return estado();
  } finally { tarea = null; }
}
function cancelar() { if (tarea) tarea.cancelar.abort(); return true; }
async function quitar() {
  cancelar();
  await detener();
  borrar(BASE(), { recursive: true });
  return estado();
}

// ---------- Servidor local (se enciende al usarse) ----------
let servidor = null; // { proc, url, listo: Promise, terminado, modelo, salida }
let apagarPorInactividad = null;
function puertoLibre() {
  return new Promise((ok, mal) => { const s = require('net').createServer(); s.unref(); s.on('error', mal); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(port)); }); });
}
// Apaga el motor y espera a que el proceso termine (en Windows sus archivos quedan bloqueados mientras corre)
function detener() {
  clearTimeout(apagarPorInactividad);
  const s = servidor;
  servidor = null;
  if (!s || s.terminado) return Promise.resolve();
  return new Promise((ok) => {
    const t = setTimeout(ok, 8000);
    s.proc.once('exit', () => { clearTimeout(t); ok(); });
    try { s.proc.kill(); } catch { clearTimeout(t); ok(); }
  });
}
// Borra con reintentos: en Windows el antivirus o un proceso que acaba de cerrarse pueden bloquear un archivo un instante
const borrar = (r, opciones = {}) => fs.rmSync(r, { force: true, maxRetries: 10, retryDelay: 300, ...opciones });
// Devuelve la dirección del motor encendido (lo enciende y espera a que cargue el modelo)
async function asegurar() {
  clearTimeout(apagarPorInactividad);
  apagarPorInactividad = setTimeout(() => { detener(); }, 20 * 60000); // libera la memoria si no se usa en 20 minutos
  const e = leerEstado();
  if (!estado().instalado) throw new Error('La IA local no está instalada. Instálala en Configuración → Inteligencia artificial.');
  if (servidor && !servidor.terminado && servidor.modelo === e.modelo) { await servidor.listo; return servidor.url; }
  await detener();
  const puerto = await puertoLibre();
  const exe = rutaEjecutable();
  const proc = spawn(exe, ['-m', path.join(ARCHIVOS(), MODELOS[e.modelo].archivo), '--host', '127.0.0.1', '--port', String(puerto), '-c', '8192', '--jinja', '--reasoning-budget', '0'],
    { cwd: path.dirname(exe), windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, LD_LIBRARY_PATH: path.dirname(exe) } });
  const s = { proc, url: `http://127.0.0.1:${puerto}/v1`, modelo: e.modelo, terminado: false, salida: '' };
  servidor = s;
  proc.stderr.on('data', (d) => { s.salida = (s.salida + d).slice(-3000); });
  proc.on('exit', (codigo) => {
    s.terminado = true;
    if (codigo === 3221225781 || codigo === -1073741515) s.salida += ' FALTA_DLL'; // 0xC0000135: falta una biblioteca de Windows
  });
  proc.on('error', (err) => { s.terminado = true; s.salida += String(err.message); });
  s.listo = (async () => {
    const limite = Date.now() + 240000; // cargar el modelo desde un disco lento puede tardar
    while (Date.now() < limite) {
      if (s.terminado) {
        if (/FALTA_DLL/.test(s.salida)) throw new Error('La IA local no pudo arrancar porque a Windows le falta "Microsoft Visual C++ Redistributable". Instálalo gratis desde aka.ms/vs/17/release/vc_redist.x64.exe y vuelve a intentarlo.');
        throw new Error('La IA local no pudo arrancar. ' + (/memory|alloc/i.test(s.salida) ? 'Parece que falta memoria: cierra otros programas o instala el modelo ligero.' : 'Detalle: ' + s.salida.slice(-300)));
      }
      try { const r = await net.fetch(`http://127.0.0.1:${puerto}/health`); if (r.ok) return; } catch { /* aún cargando */ }
      await new Promise((ok) => setTimeout(ok, 500));
    }
    await detener();
    throw new Error('La IA local tardó demasiado en arrancar.');
  })();
  try { await s.listo; } catch (err) { if (servidor === s) servidor = null; throw err; }
  return s.url;
}

app.on('will-quit', () => { if (servidor && !servidor.terminado) { try { servidor.proc.kill(); } catch { /* */ } } });

module.exports = { estado, instalar, cancelar, quitar, asegurar, detener, MODELOS };
