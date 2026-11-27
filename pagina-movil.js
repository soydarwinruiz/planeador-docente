// Página que abren los estudiantes en el celular (se sirve desde el computador del docente)
function paginaMovil() {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>Prueba</title>
<style>
*{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:#f2f5fa;color:#16202c;font-size:17px;-webkit-tap-highlight-color:transparent}
header{background:#1f4e79;color:#fff;padding:12px 16px;position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:10px}
header b{font-size:16px} #reloj{font-variant-numeric:tabular-nums;font-weight:700;background:rgba(255,255,255,.15);padding:4px 10px;border-radius:8px}
#reloj.poco{background:#e53935}
main{max-width:640px;margin:0 auto;padding:16px}
.tarjeta{background:#fff;border-radius:14px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:14px}
h1{font-size:22px;margin:4px 0 12px;color:#1f4e79} .ayuda{color:#5f6b7d;font-size:14px}
input,textarea{width:100%;font-size:18px;padding:12px;border:2px solid #c9d3e0;border-radius:10px;font-family:inherit}
input:focus,textarea:focus{outline:none;border-color:#2e75b6}
button{font-family:inherit;font-size:17px;border:none;border-radius:12px;padding:14px 18px;cursor:pointer}
.primario{background:#2e75b6;color:#fff;width:100%;font-weight:700} .primario:disabled{background:#9fb6cc}
.sec{background:#e3eaf3;color:#1f4e79}
.lista button{display:block;width:100%;text-align:left;background:#fff;border:2px solid #e1e7ef;margin-bottom:8px;font-size:16px}
.lista button.ok{color:#8a96a6} .lista button.elegido{border-color:#2e75b6;background:#e8f0fb;font-weight:700}
.contexto{background:#eef3fb;border-left:4px solid #2e75b6;padding:12px 14px;border-radius:8px;margin-bottom:14px;white-space:pre-wrap;line-height:1.45}
.enunciado{font-size:19px;font-weight:600;margin-bottom:14px;line-height:1.4;white-space:pre-wrap}
.op{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;background:#fff;border:2px solid #d8e0ea;margin-bottom:10px;padding:14px;line-height:1.35}
.op .l{flex:none;width:34px;height:34px;border-radius:50%;background:#e3eaf3;color:#1f4e79;display:flex;align-items:center;justify-content:center;font-weight:800}
.op.sel{border-color:#2e75b6;background:#e8f0fb} .op.sel .l{background:#2e75b6;color:#fff}
.nav{display:flex;gap:10px;margin-top:6px} .nav button{flex:1}
.puntos{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px} .puntos button{width:38px;height:38px;padding:0;font-size:14px;background:#e3eaf3;color:#1f4e79}
.puntos button.r{background:#43a047;color:#fff} .puntos button.act{outline:3px solid #1f4e79}
.aviso{position:fixed;left:12px;right:12px;bottom:12px;background:#333;color:#fff;padding:12px 14px;border-radius:10px;font-size:15px;z-index:10;display:none}
.error{color:#c62828;font-size:15px;margin-top:8px} .grande{font-size:56px;text-align:center}
@media (prefers-color-scheme:dark){body{background:#11161d;color:#e6ebf2}.tarjeta,.lista button,.op{background:#19202a;border-color:#2a3442;color:#e6ebf2}.contexto{background:#1d3350}.sec,.puntos button{background:#253246;color:#cfe0f5}input,textarea{background:#11161d;color:#e6ebf2;border-color:#2a3442}h1{color:#8fc1ff}}
</style></head><body>
<header><b id="titulo">Prueba</b><span id="reloj" hidden></span></header>
<main id="app"><div class="tarjeta">Cargando…</div></main>
<div class="aviso" id="aviso"></div>
<script>
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let codigo = (new URLSearchParams(location.search).get('c') || '').toUpperCase();
let info = null, datos = null, actual = 0, alumnoId = '', desfase = 0, pendientes = {}, entregando = false;
const LETRAS = ['A','B','C','D','E','F'];
function aviso(t, ms = 3000) { const a = $('#aviso'); a.textContent = t; a.style.display = 'block'; clearTimeout(aviso.t); if (ms) aviso.t = setTimeout(() => { a.style.display = 'none'; }, ms); }
async function api(ruta, cuerpo) {
  const r = await fetch(ruta, cuerpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) } : {});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'Error de conexión'), { codigo: r.status });
  return d;
}
function guardarLocal() { try { localStorage.setItem('prueba-' + codigo, JSON.stringify({ alumnoId, pin: window._pin || '' })); } catch (e) {} }
function leerLocal() { try { return JSON.parse(localStorage.getItem('prueba-' + codigo) || 'null'); } catch (e) { return null; } }

async function inicio() {
  if (!codigo) return pantallaCodigo();
  try { info = await api('/api/info?c=' + encodeURIComponent(codigo)); }
  catch (e) { return pantallaCodigo(e.message); }
  $('#titulo').textContent = info.titulo || 'Prueba';
  const prev = leerLocal();
  if (prev && prev.alumnoId) { alumnoId = prev.alumnoId; window._pin = prev.pin; return ingresar(true); }
  pantallaNombre();
}
function pantallaCodigo(error = '') {
  $('#app').innerHTML = '<div class="tarjeta"><h1>Ingresa el código</h1><p class="ayuda">Es el código de 4 letras que aparece en el tablero.</p>' +
    '<input id="cod" maxlength="6" autocapitalize="characters" style="text-transform:uppercase;letter-spacing:6px;text-align:center;font-size:28px" value="' + esc(codigo) + '">' +
    (error ? '<div class="error">' + esc(error) + '</div>' : '') + '<p></p><button class="primario" onclick="codigo=$(\\'#cod\\').value.trim().toUpperCase();inicio()">Continuar</button></div>';
}
function pantallaNombre(error = '') {
  if (!info.abierta) { $('#app').innerHTML = '<div class="tarjeta"><div class="grande">⏳</div><h1 style="text-align:center">La prueba aún no está abierta</h1></div>'; return; }
  $('#app').innerHTML = '<div class="tarjeta"><h1>¿Quién eres?</h1><input id="buscar" placeholder="Escribe tu nombre para buscar" oninput="filtrar()"><p></p><div class="lista" id="lista"></div>' +
    (info.requierePin ? '<p class="ayuda">Tu PIN es el número de 4 cifras que te dio tu docente.</p><input id="pin" inputmode="numeric" maxlength="6" placeholder="PIN" style="text-align:center;letter-spacing:8px;font-size:24px">' : '') +
    '<div class="error" id="err">' + esc(error) + '</div><p></p><button class="primario" id="entrar" onclick="entrar()" disabled>Entrar</button></div>';
  filtrar();
}
function filtrar() {
  const q = (($('#buscar') && $('#buscar').value) || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  $('#lista').innerHTML = info.alumnos.filter((a) => a.nombre.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').includes(q))
    .map((a) => '<button class="' + (a.entregado ? 'ok ' : '') + (a.id === alumnoId ? 'elegido' : '') + '" ' + (a.entregado ? 'disabled' : '') + ' onclick="alumnoId=\\'' + a.id + '\\';filtrar();$(\\'#entrar\\').disabled=false;$(\\'#pin\\')&&$(\\'#pin\\').focus()">' + esc(a.nombre) + (a.entregado ? ' ✔ entregó' : '') + '</button>').join('') || '<p class="ayuda">No se encontró. Revisa cómo escribiste tu nombre.</p>';
}
async function entrar() { window._pin = $('#pin') ? $('#pin').value.trim() : ''; ingresar(false); }
async function ingresar(silencioso) {
  try {
    datos = await api('/api/ingresar', { c: codigo, alumnoId, pin: window._pin || '' });
    desfase = datos.ahora - Date.now();
    guardarLocal();
    $('#titulo').textContent = datos.titulo || 'Prueba';
    actual = 0;
    if (Object.keys(datos.respuestas).length) { actual = datos.preguntas.findIndex((q) => !datos.respuestas[q.id]); if (actual < 0) actual = datos.preguntas.length - 1; pintar(); }
    else pantallaInstrucciones();
    setInterval(revisarEstado, 5000); setInterval(reloj, 500); setInterval(reenviar, 4000);
  } catch (e) {
    if (e.codigo === 409) { try { localStorage.removeItem('prueba-' + codigo); } catch (x) {} $('#app').innerHTML = '<div class="tarjeta"><div class="grande">✅</div><h1 style="text-align:center">Ya entregaste esta prueba</h1></div>'; return; }
    if (silencioso) { try { localStorage.removeItem('prueba-' + codigo); } catch (x) {} alumnoId = ''; return pantallaNombre(); }
    pantallaNombre(e.message);
  }
}
function pantallaInstrucciones() {
  $('#app').innerHTML = '<div class="tarjeta"><h1>Hola, ' + esc(datos.nombre.split(' ')[0]) + ' 👋</h1>' + (datos.instrucciones ? '<p style="white-space:pre-wrap">' + esc(datos.instrucciones) + '</p>' : '') +
    '<p class="ayuda">' + datos.preguntas.length + ' pregunta(s). Tus respuestas se guardan solas. No salgas de esta página durante la prueba.</p><button class="primario" onclick="pintar()">Comenzar</button></div>';
}
function respondidas() { return datos.preguntas.filter((q) => datos.respuestas[q.id]).length; }
function pintar() {
  const q = datos.preguntas[actual];
  const r = datos.respuestas[q.id] || '';
  $('#app').innerHTML = '<div class="tarjeta"><div class="ayuda" style="margin-bottom:8px">Pregunta ' + (actual + 1) + ' de ' + datos.preguntas.length + ' · respondidas ' + respondidas() + '</div>' +
    (q.contexto ? '<div class="contexto">' + esc(q.contexto) + '</div>' : '') + '<div class="enunciado">' + esc(q.enunciado) + '</div>' +
    (q.tipo === 'abierta' ? '<textarea id="txt" rows="6" placeholder="Escribe tu respuesta" oninput="escribir(this.value)">' + esc(r) + '</textarea>'
      : q.opciones.map((o, i) => '<button class="op ' + (r === LETRAS[i] ? 'sel' : '') + '" onclick="elegir(\\'' + LETRAS[i] + '\\')"><span class="l">' + LETRAS[i] + '</span><span>' + esc(o) + '</span></button>').join('')) +
    '<div class="nav"><button class="sec" ' + (actual ? '' : 'disabled') + ' onclick="ir(actual-1)">← Anterior</button>' +
    (actual < datos.preguntas.length - 1 ? '<button class="primario" onclick="ir(actual+1)">Siguiente →</button>' : '<button class="primario" onclick="revisar()">Revisar y entregar</button>') + '</div>' +
    '<div class="puntos">' + datos.preguntas.map((x, i) => '<button class="' + (datos.respuestas[x.id] ? 'r ' : '') + (i === actual ? 'act' : '') + '" onclick="ir(' + i + ')">' + (i + 1) + '</button>').join('') + '</div></div>';
  window.scrollTo(0, 0);
}
function ir(i) { if (i >= 0 && i < datos.preguntas.length) { actual = i; pintar(); } }
function enviar(qid, valor) {
  pendientes[qid] = valor;
  api('/api/responder', { token: datos.token, qid, valor }).then(() => { if (pendientes[qid] === valor) delete pendientes[qid]; $('#aviso').style.display = 'none'; })
    .catch((e) => { if (e.codigo === 403) cerrada(); else if (e.codigo === 401) aviso(e.message, 0); else aviso('Sin conexión: tu respuesta se enviará cuando vuelva la señal…', 0); });
}
function reenviar() { for (const [qid, v] of Object.entries(pendientes)) enviar(qid, v); }
function elegir(l) {
  const q = datos.preguntas[actual];
  const v = datos.respuestas[q.id] === l ? '' : l;
  if (v) datos.respuestas[q.id] = v; else delete datos.respuestas[q.id];
  enviar(q.id, v); pintar();
  if (v && actual < datos.preguntas.length - 1) setTimeout(() => ir(actual + 1), 350);
}
let tEsc = null;
function escribir(v) {
  const q = datos.preguntas[actual];
  if (v.trim()) datos.respuestas[q.id] = v; else delete datos.respuestas[q.id];
  clearTimeout(tEsc); tEsc = setTimeout(() => enviar(q.id, v), 700);
}
function revisar() {
  const faltan = datos.preguntas.map((q, i) => (datos.respuestas[q.id] ? null : i + 1)).filter(Boolean);
  $('#app').innerHTML = '<div class="tarjeta"><h1>¿Entregar la prueba?</h1>' +
    (faltan.length ? '<p>⚠️ Te faltan ' + faltan.length + ' pregunta(s): <b>' + faltan.join(', ') + '</b></p>' : '<p>✅ Respondiste todas las preguntas.</p>') +
    '<p class="ayuda">Después de entregar ya no podrás cambiar tus respuestas.</p><button class="primario" onclick="entregar()">Entregar</button><p></p><button class="sec" style="width:100%" onclick="ir(' + (faltan.length ? faltan[0] - 1 : 0) + ')">Volver a revisar</button></div>';
}
async function entregar(automatico) {
  if (entregando) return; entregando = true;
  clearTimeout(tEsc);
  const q = datos.preguntas[actual];
  if (q && q.tipo === 'abierta' && $('#txt')) pendientes[q.id] = $('#txt').value;
  for (const [qid, v] of Object.entries(pendientes)) { try { await api('/api/responder', { token: datos.token, qid, valor: v }); delete pendientes[qid]; } catch (e) {} }
  try {
    const r = await api('/api/entregar', { token: datos.token });
    try { localStorage.removeItem('prueba-' + codigo); } catch (e) {}
    const res = r.resultado;
    $('#reloj').hidden = true;
    $('#app').innerHTML = '<div class="tarjeta"><div class="grande">🎉</div><h1 style="text-align:center">¡Prueba entregada!</h1>' + (automatico ? '<p class="ayuda" style="text-align:center">' + esc(automatico) + '</p>' : '') +
      (res ? '<p style="text-align:center;font-size:20px">Respondiste bien <b>' + res.correctas + '</b> de <b>' + res.total + '</b> preguntas de selección.</p>' + (res.abiertas ? '<p class="ayuda" style="text-align:center">Las preguntas abiertas las revisará tu docente.</p>' : '') : '<p style="text-align:center">Tu docente te dará los resultados.</p>') +
      '<p class="ayuda" style="text-align:center">Ya puedes cerrar esta página.</p></div>';
  } catch (e) {
    entregando = false;
    if (e.codigo === 409) { entregando = true; try { localStorage.removeItem('prueba-' + codigo); } catch (x) {} $('#reloj').hidden = true; $('#app').innerHTML = '<div class="tarjeta"><div class="grande">✅</div><h1 style="text-align:center">Prueba entregada</h1><p class="ayuda" style="text-align:center">Ya puedes cerrar esta página.</p></div>'; return; }
    aviso('No se pudo entregar: ' + e.message + '. Intenta de nuevo.', 5000);
  }
}
function cerrada() { if (!entregando) entregar('El docente cerró la prueba: se enviaron las respuestas que tenías.'); }
async function revisarEstado() {
  if (!datos || entregando) return;
  try { const e = await api('/api/estado', { token: datos.token }); datos.fin = e.fin; desfase = e.ahora - Date.now(); if (e.entregado) return entregar('Ya estaba entregada.'); if (!e.abierta) cerrada(); }
  catch (e) { if (e.codigo === 401) aviso(e.message, 0); }
}
function reloj() {
  if (!datos || !datos.fin || entregando) return;
  const s = Math.max(0, Math.round((datos.fin - (Date.now() + desfase)) / 1000));
  const r = $('#reloj'); r.hidden = false; r.textContent = '⏱ ' + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  r.className = s <= 60 ? 'poco' : '';
  if (s <= 0) entregar('Se acabó el tiempo: se enviaron tus respuestas.');
}
document.addEventListener('visibilitychange', () => { if (datos && !entregando) api('/api/evento', { token: datos.token, tipo: document.hidden ? 'salio' : 'volvio' }).catch(() => {}); });
inicio();
</script></body></html>`;
}
module.exports = { paginaMovil };
