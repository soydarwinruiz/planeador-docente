// Robot de rastreo (npm run test:robot, tarda varios minutos): activa cada botón, lista y casilla de cada pantalla
// con un año completo de datos, genera todas las exportaciones y falla si aparece algún error de programa.
const { abrir, sembrar, nuevaCarpeta } = require('./util');
const { sembrarAnio } = require('./e2e-completo');
const fs = require('fs');
const os = require('os');

const EXCLUIR = /nuevoAnio|ejecutarNuevoAnio|vaciarPapelera|bloquearAhora|abrirAsistente|api\.instalarActualizacion|quitarClave|desautorizarCelular|location|window\.close/;

(async () => {
  const { app, w } = await abrir(nuevaCarpeta());
  const dir = fs.mkdtempSync(require('path').join(os.tmpdir(), 'tiza-robot-'));
  await app.evaluate(({ dialog, shell, ipcMain }, dir) => {
    let n = 0;
    dialog.showSaveDialog = async (_w, o) => ({ canceled: false, filePath: `${dir}/${++n}-${String((o || _w)?.defaultPath || 'x').replace(/[\\/]/g, '_')}` }); dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] });
    dialog.showSaveDialogSync = () => undefined; shell.openPath = async () => ''; shell.openExternal = async () => {}; shell.showItemInFolder = () => {};
    ipcMain.removeHandler('ia:sugerir'); ipcMain.handle('ia:sugerir', () => ({ ok: false, error: 'IA simulada' }));
  }, dir);
  await sembrar(w);
  await sembrarAnio(w);
  await w.evaluate(() => {
    window.__errs = []; window.__actual = '';
    window.addEventListener('error', (e) => window.__errs.push(`${window.__actual} → ${e.message}`));
    window.addEventListener('unhandledrejection', (e) => window.__errs.push(`${window.__actual} → (promesa) ${e.reason?.message || e.reason}`));
    window.print = () => {};
    window.__avisos = [];
    const avisoOrig = aviso; aviso = (t, tipo) => { if (tipo === 'error') window.__avisos.push(`${window.__actual} → ${t}`); return avisoOrig(t, tipo); };
    window.open = () => null;
  });
  const objetivos = await w.evaluate(() => {
    const per = (periodoDeFecha(hoyISO()) || S.config.periodos[0]).id;
    const o = [];
    for (const v of Object.keys(RENDERS).filter((k) => !k.endsWith('_despues') && !['editor', 'piarEditor', 'pruebaEditor', 'alumnos', 'perfil', 'pizarra'].includes(k))) o.push({ v, setup: '' });
    for (const p of ['programacion', 'planilla', 'entregas', 'anual', 'apoyo', 'riesgo', 'observaciones', 'rubricas', 'registro']) o.push({ v: 'calificaciones', setup: `ui.cal={grupoId:'g1',areaId:'a1',periodoId:'${per}',pestana:'${p}'}` });
    for (const p of ['area', 'malla', 'periodo', 'aula', 'cobertura', 'referentes']) o.push({ v: 'curricular', setup: `ui.cur={pestana:'${p}',areaId:'a1',grado:7,periodoId:'${per}',grupoId:'g1'}` });
    for (const p of ['estudiantes', 'equipos', 'tablero', 'historial']) o.push({ v: 'gamificacion', setup: `ui.gam={grupoId:'g1',pestana:'${p}',sel:{}}` });
    o.push({ v: 'seguimiento', setup: `ui.seg={grupoId:'g1',alumnoId:S.alumnos[0].id,areaId:'a1',periodoId:'${per}'}` });
    o.push({ v: 'editor', params: { id: 'pl-1' } }, { v: 'piarEditor', params: { alumnoId: 'al0' } }, { v: 'pruebaEditor', params: { id: 'pr-1' } }, { v: 'alumnos', params: { grupoId: 'g1' } }, { v: 'perfil', params: { grupoId: 'g1' } });
    return o;
  });
  let total = 0;
  for (const ob of objetivos) {
    const n = await w.evaluate(({ v, setup, params }) => { cerrarModal(); if (setup) eval(setup); ir(v, params || {}); return document.querySelectorAll('#contenido [onclick], #contenido [onchange], #contenido [oninput], #contenido select').length; }, ob);
    for (let i = 0; i < n; i++) {
      const r = await w.evaluate(async ({ v, setup, params, i, excl }) => {
        const EXCLUIR = new RegExp(excl);
        try { cerrarModal(); document.getElementById('aula')?.remove?.(); cerrarProyeccion?.(); } catch (e) { /* */ }
        if (setup) eval(setup);
        ir(v, params || {});
        const el = document.querySelectorAll('#contenido [onclick], #contenido [onchange], #contenido [oninput], #contenido select')[i];
        if (!el) return 'falta';
        const cod = (el.getAttribute('onclick') || '') + (el.getAttribute('onchange') || '') + (el.getAttribute('oninput') || '');
        if (EXCLUIR.test(cod)) return 'excluido';
        window.__actual = `${v}${setup ? '[' + (setup.match(/pestana:'(\w+)'/)?.[1] || '') + ']' : ''} · ${el.tagName.toLowerCase()} "${(el.textContent || el.title || el.placeholder || el.name || '').trim().slice(0, 40)}" ${cod.slice(0, 80)}`;
        try {
          if (el.tagName === 'SELECT') { const op = el.options[Math.min(1, el.options.length - 1)]; if (op) { el.value = op.value; el.dispatchEvent(new Event('change', { bubbles: true })); } }
          else if (el.tagName === 'INPUT' && el.type === 'checkbox') { el.click(); }
          else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { el.value = el.type === 'number' ? '3.5' : el.type === 'date' ? hoyISO() : el.type === 'color' ? '#336699' : 'Prueba ñ "comillas" <b>x</b>'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
          else el.click();
        } catch (e) { window.__errs.push(`${window.__actual} → ${e.message}`); }
        await new Promise((r) => setTimeout(r, 40));
        // Si se abrió una ventana, se prueban también sus botones principales (sin borrar)
        const modal = document.getElementById('modal');
        if (!document.getElementById('modal-fondo').classList.contains('oculto')) {
          const btns = [...modal.querySelectorAll('button')].filter((b) => !/Cancelar|Cerrar|peligro|Eliminar|Restaurar|Vaciar/.test(b.textContent + b.className));
          for (const b of btns.slice(0, 3)) { const a = window.__actual; window.__actual = a + ' » modal: ' + b.textContent.trim().slice(0, 30); try { if (b.isConnected) b.click(); } catch (e) { window.__errs.push(`${window.__actual} → ${e.message}`); } await new Promise((r) => setTimeout(r, 30)); window.__actual = a; }
        }
        return 'ok';
      }, { ...ob, i, excl: EXCLUIR.source });
      if (r === 'ok') total++;
    }
  }
  await w.waitForTimeout(500);
  const errs = await w.evaluate(() => [...new Set(window.__errs)]);
  const avisos = await w.evaluate(() => [...new Set(window.__avisos)]);
  console.log('Avisos de error mostrados al usuario: ' + avisos.length);
  for (const a of avisos) console.log('  ◦ ' + a);
  console.log(`Acciones probadas: ${total}`);
  console.log(`Errores: ${errs.length}`);
  for (const e of errs) console.log('• ' + e);
  const archivos = fs.readdirSync(dir).map((f) => [f, fs.statSync(dir + '/' + f).size]);
  console.log('Archivos generados: ' + archivos.length);
  for (const [f, t] of archivos) console.log(`  ${t < 1500 ? '⚠' : '✓'} ${f} (${t} B)`);
  await app.close();
  // El único "error" esperado es el del robot escribiendo texto en las casillas de archivo (logos)
  const reales = errs.filter((e) => !/accepts a filename/.test(e));
  const vacios = archivos.filter(([, t]) => t < 1500);
  if (reales.length || vacios.length) { console.error('✗ El robot encontró problemas'); process.exit(1); }
  console.log('✓ Robot: sin errores');
})().catch((e) => { console.error(e); process.exit(1); });
