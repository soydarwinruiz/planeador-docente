// Servidor local para aplicar pruebas en los celulares de los estudiantes (red WiFi del salón, sin internet)
const http = require('http');
const os = require('os');
const crypto = require('crypto');
const { ipcMain, powerSaveBlocker, shell } = require('electron');
const QRCode = require('qrcode');
const { paginaMovil } = require('./pagina-movil');

let servidor = null, puerto = 0, sesion = null, ventana = null, bloqueo = null;

function ipsLocales() {
  const r = [];
  for (const [nombre, lista] of Object.entries(os.networkInterfaces())) {
    for (const x of lista || []) {
      if (x.family !== 'IPv4' || x.internal || x.address.startsWith('169.254.')) continue;
      const privada = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(x.address);
      r.push({ ip: x.address, nombre, privada });
    }
  }
  // primero las redes privadas típicas de WiFi / punto de acceso
  return r.sort((a, b) => (b.privada - a.privada) || (/wi-?fi|wlan|inal/i.test(b.nombre) - /wi-?fi|wlan|inal/i.test(a.nombre)));
}
function aleatorio(semilla) { let s = semilla >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }
function mezclar(arr, rnd) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Orden de preguntas y opciones propio de cada estudiante (las preguntas con el mismo contexto quedan juntas)
function ordenPara(alumnoId) {
  const rnd = aleatorio(parseInt(crypto.createHash('md5').update(sesion.codigo + alumnoId).digest('hex').slice(0, 8), 16));
  const qs = sesion.prueba.preguntas;
  const bloques = [];
  qs.forEach((q, i) => { const ant = bloques[bloques.length - 1]; if (ant && q.contexto && qs[i - 1].contexto === q.contexto) ant.push(q); else bloques.push([q]); });
  const orden = (sesion.barajar ? mezclar(bloques, rnd) : bloques).flat().map((q) => q.id);
  const perm = {};
  for (const q of qs) if (q.tipo !== 'abierta') { const idx = q.opciones.map((_, i) => i); perm[q.id] = sesion.barajar ? mezclar(idx, rnd) : idx; }
  return { orden, perm };
}
function resumenAlumno(id) {
  const e = sesion.estados[id];
  const cerradas = sesion.prueba.preguntas.filter((q) => q.tipo !== 'abierta');
  return { alumnoId: id, ingreso: !!e, respondidas: e ? Object.keys(e.respuestas).length : 0, total: sesion.prueba.preguntas.length, salidas: e?.salidas || 0, fuera: !!e?.fuera,
    entregado: !!e?.entregado, ultimo: e?.ultimo || 0,
    letras: e ? cerradas.map((q) => e.respuestas[q.id] || '-').join('').replace(/-+$/, '') : '',
    textos: e ? Object.fromEntries(sesion.prueba.preguntas.filter((q) => q.tipo === 'abierta' && e.respuestas[q.id]).map((q) => [q.id, e.respuestas[q.id]])) : {} };
}
function avisar(tipo, alumnoId) {
  if (ventana && !ventana.isDestroyed()) ventana.webContents.send('qr:evento', { tipo, ...(alumnoId ? resumenAlumno(alumnoId) : {}), abierta: sesion?.abierta });
}
function preguntasPara(e) {
  const porId = Object.fromEntries(sesion.prueba.preguntas.map((q) => [q.id, q]));
  return e.orden.map((id) => {
    const q = porId[id];
    return { id, tipo: q.tipo, contexto: q.contexto || '', enunciado: q.enunciado, opciones: q.tipo === 'abierta' ? [] : e.perm[id].map((i) => q.opciones[i]) };
  });
}
// La respuesta se guarda con la letra ORIGINAL de la prueba; al celular se le muestra su orden barajado
function aOriginal(e, qid, letraMostrada) { const i = LETRAS.indexOf(letraMostrada); return i < 0 ? '' : LETRAS[e.perm[qid][i]]; }
function aMostrada(e, qid, letraOriginal) { const i = LETRAS.indexOf(letraOriginal); return i < 0 ? '' : LETRAS[e.perm[qid].indexOf(i)]; }

function leerCuerpo(req) {
  return new Promise((res, rej) => {
    let d = '';
    req.on('data', (c) => { d += c; if (d.length > 100000) { req.destroy(); rej(new Error('demasiado grande')); } });
    req.on('end', () => { try { res(d ? JSON.parse(d) : {}); } catch (e) { rej(e); } });
  });
}
function json(res, codigo, datos) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(datos));
}
function porToken(t) { return Object.entries(sesion?.estados || {}).find(([, e]) => e.token === t); }
function cerradaPorTiempo() { return sesion.fin && Date.now() > sesion.fin + 15000; }

async function atender(req, res) {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(paginaMovil());
    }
    if (!sesion) return json(res, 503, { error: 'No hay ninguna prueba abierta en este momento.' });
    if (url.pathname === '/api/info') {
      if ((url.searchParams.get('c') || '').toUpperCase() !== sesion.codigo) return json(res, 404, { error: 'Código incorrecto. Revisa el código que aparece en el tablero.' });
      return json(res, 200, { titulo: sesion.prueba.titulo, grupo: sesion.grupo, abierta: sesion.abierta, requierePin: sesion.requierePin,
        alumnos: sesion.alumnos.map((a) => ({ id: a.id, nombre: a.nombre, entregado: !!sesion.estados[a.id]?.entregado })) });
    }
    if (req.method !== 'POST') return json(res, 404, { error: 'No encontrado' });
    const b = await leerCuerpo(req);
    if (url.pathname === '/api/ingresar') {
      if (String(b.c || '').toUpperCase() !== sesion.codigo) return json(res, 404, { error: 'Código incorrecto.' });
      if (!sesion.abierta) return json(res, 403, { error: 'La prueba está cerrada.' });
      const al = sesion.alumnos.find((a) => a.id === b.alumnoId);
      if (!al) return json(res, 404, { error: 'Elige tu nombre de la lista.' });
      const intentos = (sesion.intentos[al.id] ||= { n: 0, hasta: 0 });
      if (intentos.hasta > Date.now()) return json(res, 429, { error: 'Demasiados intentos. Espera un minuto o pide ayuda al docente.' });
      if (sesion.requierePin && String(b.pin || '').trim() !== String(al.pin)) {
        if (++intentos.n >= 5) { intentos.hasta = Date.now() + 60000; intentos.n = 0; }
        return json(res, 401, { error: 'PIN incorrecto.' });
      }
      intentos.n = 0;
      let e = sesion.estados[al.id];
      if (e?.entregado) return json(res, 409, { error: 'Ya entregaste esta prueba.' });
      if (!e) e = sesion.estados[al.id] = { token: crypto.randomBytes(16).toString('hex'), respuestas: {}, salidas: 0, inicio: Date.now(), ...ordenPara(al.id) };
      else e.token = crypto.randomBytes(16).toString('hex'); // otro celular: el anterior deja de funcionar
      e.ultimo = Date.now(); e.fuera = false;
      avisar('ingreso', al.id);
      const mostradas = Object.fromEntries(Object.entries(e.respuestas).map(([qid, v]) => [qid, sesion.prueba.preguntas.find((q) => q.id === qid)?.tipo === 'abierta' ? v : aMostrada(e, qid, v)]));
      return json(res, 200, { token: e.token, nombre: al.nombre, titulo: sesion.prueba.titulo, instrucciones: sesion.prueba.instrucciones, preguntas: preguntasPara(e), respuestas: mostradas, fin: sesion.fin, ahora: Date.now() });
    }
    const par = porToken(b.token);
    if (!par) return json(res, 401, { error: 'Tu sesión terminó. Vuelve a ingresar con tu nombre y PIN.' });
    const [alumnoId, e] = par;
    e.ultimo = Date.now();
    if (url.pathname === '/api/estado') return json(res, 200, { abierta: sesion.abierta && !cerradaPorTiempo(), fin: sesion.fin, ahora: Date.now(), entregado: !!e.entregado });
    if (url.pathname === '/api/evento') {
      if (b.tipo === 'salio' && !e.fuera) { e.salidas++; e.fuera = true; }
      if (b.tipo === 'volvio') e.fuera = false;
      avisar(b.tipo, alumnoId);
      return json(res, 200, { ok: true });
    }
    if (e.entregado) return json(res, 409, { error: 'Ya entregaste esta prueba.' });
    if (url.pathname === '/api/responder') {
      if (!sesion.abierta || cerradaPorTiempo()) return json(res, 403, { error: 'La prueba está cerrada.' });
      const q = sesion.prueba.preguntas.find((x) => x.id === b.qid);
      if (!q) return json(res, 404, { error: 'Pregunta no encontrada' });
      const v = q.tipo === 'abierta' ? String(b.valor || '').slice(0, 3000) : aOriginal(e, q.id, String(b.valor || ''));
      if (v) e.respuestas[q.id] = v; else delete e.respuestas[q.id];
      avisar('respuesta', alumnoId);
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/entregar') {
      e.entregado = Date.now();
      avisar('entrego', alumnoId);
      let resultado = null;
      if (sesion.mostrarNota) {
        const cerradas = sesion.prueba.preguntas.filter((q) => q.tipo !== 'abierta');
        const correctas = cerradas.filter((q) => e.respuestas[q.id] && e.respuestas[q.id] === sesion.clave[q.id]).length;
        resultado = { correctas, total: cerradas.length, abiertas: sesion.prueba.preguntas.length - cerradas.length };
      }
      return json(res, 200, { ok: true, resultado });
    }
    return json(res, 404, { error: 'No encontrado' });
  } catch (err) {
    return json(res, 400, { error: 'Solicitud no válida' });
  }
}

async function iniciarServidor() {
  if (servidor) return puerto;
  for (const p of [8765, 8766, 8767, 8768, 8780, 8790, 0]) {
    try {
      await new Promise((ok, mal) => {
        const s = http.createServer(atender);
        s.once('error', mal);
        s.listen(p, '0.0.0.0', () => { servidor = s; puerto = s.address().port; ok(); });
      });
      return puerto;
    } catch (e) { /* puerto ocupado: probar otro */ }
  }
  throw new Error('No se pudo abrir el servidor local.');
}
function detener() {
  if (bloqueo != null) { try { powerSaveBlocker.stop(bloqueo); } catch (e) { /* */ } bloqueo = null; }
  sesion = null;
  if (servidor) { servidor.close(); servidor.closeAllConnections?.(); servidor = null; }
}

function iniciarAplicacionMovil(v) {
  ventana = v;
  ipcMain.handle('qr:iniciar', async (_e, d) => {
    try {
      const p = await iniciarServidor();
      const codigo = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[crypto.randomInt(32)]).join('');
      sesion = {
        codigo, grupo: d.grupo, abierta: true, requierePin: !!d.requierePin, barajar: d.barajar !== false, mostrarNota: !!d.mostrarNota,
        prueba: { titulo: d.prueba.titulo, instrucciones: d.prueba.instrucciones, preguntas: d.prueba.preguntas.map((q) => ({ id: q.id, tipo: q.tipo, contexto: q.contexto, enunciado: q.enunciado, opciones: q.opciones || [] })) },
        clave: Object.fromEntries(d.prueba.preguntas.filter((q) => q.tipo !== 'abierta').map((q) => [q.id, q.correcta])),
        alumnos: d.alumnos, estados: {}, intentos: {}, fin: d.minutos ? Date.now() + d.minutos * 60000 : 0,
      };
      // Retomar respuestas que ya estaban guardadas (por ejemplo, si se reinició la app)
      for (const [id, r] of Object.entries(d.previas || {})) {
        sesion.estados[id] = { token: crypto.randomBytes(16).toString('hex'), respuestas: r.respuestas || {}, salidas: r.salidas || 0, entregado: r.entregado || 0, ...ordenPara(id) };
      }
      if (bloqueo == null) bloqueo = powerSaveBlocker.start('prevent-display-sleep');
      const ips = ipsLocales();
      const urls = ips.map((x) => `http://${x.ip}:${p}/?c=${codigo}`);
      const qr = urls[0] ? await QRCode.toString(urls[0], { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }) : '';
      return { ok: true, codigo, puerto: p, urls, ips, qr, fin: sesion.fin };
    } catch (e) { return { ok: false, error: e.message }; }
  });
  ipcMain.handle('qr:cerrar', () => { if (sesion) { sesion.abierta = false; avisar('cerrada'); } return true; });
  ipcMain.handle('qr:reabrir', (_e, minutosExtra) => { if (sesion) { sesion.abierta = true; if (minutosExtra) sesion.fin = Math.max(sesion.fin || Date.now(), Date.now()) + minutosExtra * 60000; avisar('reabierta'); } return { fin: sesion?.fin }; });
  ipcMain.handle('qr:detener', () => { detener(); return true; });
  ipcMain.handle('qr:estado', () => (sesion ? { activa: true, codigo: sesion.codigo, abierta: sesion.abierta, fin: sesion.fin, alumnos: sesion.alumnos.map((a) => resumenAlumno(a.id)) } : { activa: false }));
  ipcMain.handle('qr:abrirEnEquipo', (_e, url) => { if (/^http:\/\/[\d.]+:\d+\//.test(url)) shell.openExternal(url); });
}

module.exports = { iniciarAplicacionMovil, detenerAplicacionMovil: detener };
