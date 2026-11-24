// Clave de acceso al programa: se guarda solo un resumen (scrypt con sal), nunca la clave.
// Mientras el programa está bloqueado el proceso principal no entrega los datos a la interfaz.
const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { escribirSeguro } = require('./almacen');

const ARCHIVO = () => path.join(app.getPath('userData'), 'acceso.json');
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let bloqueado = null; // null = aún no se sabe (se calcula al primer uso)
let fallos = 0, esperarHasta = 0;

function leer() { try { return JSON.parse(fs.readFileSync(ARCHIVO(), 'utf8')); } catch { return null; } }
function activa() { const a = leer(); return !!(a && a.hash && a.sal); }
function estaBloqueado() { if (bloqueado === null) bloqueado = activa(); return bloqueado && activa(); }
function resumen(texto, sal) { return crypto.scryptSync(String(texto).normalize('NFC'), Buffer.from(sal, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex'); }
function igual(a, b) { const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex'); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function nuevoCodigo() { return Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => LETRAS[crypto.randomInt(LETRAS.length)]).join('')).join('-'); }
function normalizarCodigo(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function guardarAcceso(clave, codigo, minutos) {
  const sal = crypto.randomBytes(16).toString('hex'), salRec = crypto.randomBytes(16).toString('hex');
  escribirSeguro(ARCHIVO(), JSON.stringify({ version: 1, sal, hash: resumen(clave, sal), salRec, hashRec: resumen(normalizarCodigo(codigo), salRec), minutos: minutos ?? 10, creada: new Date().toISOString() }));
}
function validarNueva(clave) {
  if (typeof clave !== 'string' || clave.length < 4) throw new Error('La clave debe tener al menos 4 caracteres.');
  if (clave.length > 200) throw new Error('La clave es demasiado larga.');
}
// Freno a los intentos: tras 5 fallos seguidos hay que esperar (30 s, luego el doble, hasta 5 min)
function frenar() {
  if (Date.now() < esperarHasta) return { ok: false, espera: Math.ceil((esperarHasta - Date.now()) / 1000), error: 'Demasiados intentos.' };
  return null;
}
function fallo(msg) {
  fallos++;
  if (fallos >= 5) esperarHasta = Date.now() + Math.min(300, 30 * 2 ** (fallos - 5)) * 1000;
  return { ok: false, error: msg, espera: Date.now() < esperarHasta ? Math.ceil((esperarHasta - Date.now()) / 1000) : 0 };
}
function comprobarClave(clave) { const a = leer(); return !!a && igual(resumen(clave, a.sal), a.hash); }

function iniciarAcceso() {
  ipcMain.handle('acceso:estado', () => { const a = leer(); return { activa: activa(), bloqueado: estaBloqueado(), minutos: a?.minutos ?? 10 }; });
  ipcMain.handle('acceso:desbloquear', (_e, clave) => {
    const f = frenar(); if (f) return f;
    if (!activa()) { bloqueado = false; return { ok: true }; }
    if (!comprobarClave(clave)) return fallo('Clave incorrecta.');
    fallos = 0; bloqueado = false;
    return { ok: true };
  });
  ipcMain.handle('acceso:bloquear', () => { if (activa()) bloqueado = true; return { ok: true, bloqueado: estaBloqueado() }; });
  ipcMain.handle('acceso:activar', (_e, { clave, minutos }) => {
    try {
      if (estaBloqueado()) throw new Error('El programa está bloqueado.');
      if (activa()) throw new Error('Ya hay una clave. Usa "Cambiar clave".');
      validarNueva(clave);
      const codigo = nuevoCodigo();
      guardarAcceso(clave, codigo, minutos);
      bloqueado = false;
      return { ok: true, codigo };
    } catch (e) { return { ok: false, error: e.message }; }
  });
  ipcMain.handle('acceso:cambiar', (_e, { actual, nueva }) => {
    const f = frenar(); if (f) return f;
    try {
      if (!comprobarClave(actual)) return fallo('La clave actual no es correcta.');
      validarNueva(nueva);
      fallos = 0;
      const codigo = nuevoCodigo();
      guardarAcceso(nueva, codigo, leer()?.minutos);
      return { ok: true, codigo };
    } catch (e) { return { ok: false, error: e.message }; }
  });
  ipcMain.handle('acceso:desactivar', (_e, actual) => {
    const f = frenar(); if (f) return f;
    if (!comprobarClave(actual)) return fallo('La clave no es correcta.');
    fallos = 0; fs.rmSync(ARCHIVO(), { force: true }); bloqueado = false;
    return { ok: true };
  });
  // Con el código de recuperación se pone una clave nueva (y se entrega un código nuevo)
  ipcMain.handle('acceso:recuperar', (_e, { codigo, nueva }) => {
    const f = frenar(); if (f) return f;
    try {
      const a = leer();
      if (!a) return { ok: false, error: 'No hay clave configurada.' };
      if (!igual(resumen(normalizarCodigo(codigo), a.salRec), a.hashRec)) return fallo('El código de recuperación no es correcto.');
      validarNueva(nueva);
      fallos = 0;
      const nuevo = nuevoCodigo();
      guardarAcceso(nueva, nuevo, a.minutos);
      bloqueado = false;
      return { ok: true, codigo: nuevo };
    } catch (e) { return { ok: false, error: e.message }; }
  });
  ipcMain.handle('acceso:minutos', (_e, minutos) => {
    const a = leer();
    if (!a || estaBloqueado()) return { ok: false };
    a.minutos = Math.max(0, Math.min(240, +minutos || 0));
    escribirSeguro(ARCHIVO(), JSON.stringify(a));
    return { ok: true };
  });
}

module.exports = { iniciarAcceso, estaBloqueado };
