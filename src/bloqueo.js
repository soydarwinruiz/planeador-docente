// ================= Clave de acceso: pantalla de bloqueo y configuración =================
// La clave la verifica el proceso principal (acceso.js); mientras está bloqueado no entrega los datos.

const BLOQUEO = { activa: false, minutos: 10, ultimaActividad: Date.now(), visible: false };
const MINUTOS_BLOQUEO = [[0, 'Nunca (solo al abrir el programa)'], [5, '5 minutos'], [10, '10 minutos'], [15, '15 minutos'], [30, '30 minutos'], [60, '1 hora']];

async function refrescarEstadoAcceso() {
  const e = await api.accesoEstado();
  BLOQUEO.activa = e.activa; BLOQUEO.minutos = e.minutos;
  const b = document.getElementById('boton-bloquear');
  if (b) b.hidden = !e.activa;
  return e;
}

// Muestra la pantalla de bloqueo. Al desbloquear se llama a "alDesbloquear" (al abrir el programa: cargar los datos).
function mostrarBloqueo(alDesbloquear) {
  BLOQUEO.visible = true;
  let capa = document.getElementById('bloqueo');
  if (!capa) { capa = document.createElement('div'); capa.id = 'bloqueo'; document.body.appendChild(capa); }
  BLOQUEO.alDesbloquear = alDesbloquear;
  capa.innerHTML = `<div class="bloqueo-caja">
    <img src="icono.svg" alt="" style="width:64px;height:64px">
    <h1>Planeador Docente</h1>
    <p class="ayuda">El programa está bloqueado. Escribe tu clave para continuar.</p>
    <form onsubmit="event.preventDefault();desbloquear()">
      <input type="password" id="bloqueo-clave" placeholder="Clave" autocomplete="current-password" autofocus>
      <div id="bloqueo-error" class="bloqueo-error"></div>
      <button class="btn primario" id="bloqueo-entrar" style="width:100%">Entrar</button>
    </form>
    <a href="#" class="ayuda" onclick="formularioRecuperacion();return false">¿Olvidaste la clave?</a>
  </div>`;
  capa.hidden = false;
  setTimeout(() => document.getElementById('bloqueo-clave')?.focus(), 50);
}
function ocultarBloqueo() {
  BLOQUEO.visible = false; BLOQUEO.ultimaActividad = Date.now();
  const capa = document.getElementById('bloqueo');
  if (capa) { capa.hidden = true; capa.innerHTML = ''; }
  const fn = BLOQUEO.alDesbloquear; BLOQUEO.alDesbloquear = null;
  if (fn) fn();
}
function errorBloqueo(r) {
  const el = document.getElementById('bloqueo-error');
  if (el) el.textContent = r.error + (r.espera ? ` Espera ${r.espera} segundos.` : '');
}
async function desbloquear() {
  const i = document.getElementById('bloqueo-clave');
  const r = await api.accesoDesbloquear(i.value);
  if (r.ok) ocultarBloqueo(); else { errorBloqueo(r); i.select(); }
}
function formularioRecuperacion() {
  document.querySelector('#bloqueo .bloqueo-caja').innerHTML = `<h1>Recuperar el acceso</h1>
    <p class="ayuda">Escribe el código de recuperación que guardaste al crear la clave (por ejemplo ABCD-EFGH-JKLM) y una clave nueva.</p>
    <form onsubmit="event.preventDefault();recuperarAcceso()">
      <input id="rec-codigo" placeholder="Código de recuperación" autocomplete="off" style="text-transform:uppercase">
      <input type="password" id="rec-nueva" placeholder="Clave nueva (mínimo 4 caracteres)" autocomplete="new-password">
      <input type="password" id="rec-nueva2" placeholder="Repite la clave nueva" autocomplete="new-password">
      <div id="bloqueo-error" class="bloqueo-error"></div>
      <button class="btn primario" style="width:100%">Cambiar la clave y entrar</button>
    </form>
    <a href="#" class="ayuda" onclick="mostrarBloqueo(BLOQUEO.alDesbloquear);return false">← Volver</a>`;
  document.getElementById('rec-codigo').focus();
}
async function recuperarAcceso() {
  const v = (id) => document.getElementById(id).value;
  if (v('rec-nueva') !== v('rec-nueva2')) return errorBloqueo({ error: 'Las claves no coinciden.' });
  const r = await api.accesoRecuperar(v('rec-codigo'), v('rec-nueva'));
  if (!r.ok) return errorBloqueo(r);
  ocultarBloqueo();
  mostrarCodigoRecuperacion(r.codigo, 'Tu clave se cambió. El código de recuperación anterior ya no sirve: guarda este nuevo.');
}

async function bloquearAhora() {
  if (!BLOQUEO.activa || BLOQUEO.visible) return;
  cerrarModal();
  await api.accesoBloquear();
  mostrarBloqueo(null);
}
// Bloqueo por inactividad. Lo que se hace dentro de un tablero también cuenta como actividad.
['pointerdown', 'keydown', 'wheel', 'mousemove', 'touchstart'].forEach((ev) => document.addEventListener(ev, () => { BLOQUEO.ultimaActividad = Date.now(); }, { passive: true, capture: true }));
window.addEventListener('message', () => { BLOQUEO.ultimaActividad = Date.now(); });
setInterval(() => {
  if (BLOQUEO.activa && BLOQUEO.minutos > 0 && !BLOQUEO.visible && typeof S !== 'undefined' && S && Date.now() - BLOQUEO.ultimaActividad > BLOQUEO.minutos * 60000) bloquearAhora();
}, 20000);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'l' && BLOQUEO.activa) { e.preventDefault(); bloquearAhora(); }
});

// ---------- Configuración ----------
function tarjetaAcceso() {
  setTimeout(async () => {
    const e = await refrescarEstadoAcceso();
    const el = document.getElementById('tarjeta-acceso-cuerpo');
    if (!el) return;
    el.innerHTML = e.activa ? `<p>✅ El programa pide la clave al abrirse.</p>
      <div class="rejilla r3" style="align-items:end">
        <div class="campo"><label>Bloquear después de estar sin usarse</label><select onchange="cambiarMinutosBloqueo(this.value)">${MINUTOS_BLOQUEO.map(([m, t]) => `<option value="${m}" ${e.minutos === m ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="fila"><button class="btn" onclick="bloquearAhora()">🔒 Bloquear ahora</button><button class="btn" onclick="dialogoCambiarClave()">Cambiar clave</button><button class="btn peligro" onclick="dialogoQuitarClave()">Quitar clave</button></div>
      </div>
      <p class="ayuda">Atajo para bloquear: <b>Ctrl + L</b> o el botón 🔒 del menú.</p>`
      : `<p class="ayuda">Si compartes el computador (sala de profesores, equipo del colegio), activa una clave para que nadie más vea las notas, los PIAR ni los datos de los acudientes.</p>
      <button class="btn primario" onclick="dialogoActivarClave()">🔒 Activar clave de acceso</button>`;
  }, 0);
  return `<div class="tarjeta" id="tarjeta-acceso"><h2>🔒 Clave de acceso</h2><div id="tarjeta-acceso-cuerpo"><p class="ayuda">Cargando…</p></div>
    <p class="ayuda">La clave impide abrir el programa y lo bloquea cuando no lo usas. Los archivos de datos del disco no quedan cifrados: para eso, usa también una contraseña en tu usuario de Windows.</p></div>`;
}
async function cambiarMinutosBloqueo(m) { await api.accesoMinutos(+m); BLOQUEO.minutos = +m; aviso('Guardado', 'ok'); }
function dialogoActivarClave() {
  abrirModal(`<h2>🔒 Activar clave de acceso</h2>
    <div class="campo"><label>Clave (mínimo 4 caracteres)</label><input type="password" id="ac-clave" autocomplete="new-password"></div>
    <div class="campo"><label>Repite la clave</label><input type="password" id="ac-clave2" autocomplete="new-password"></div>
    <div class="campo"><label>Bloquear después de estar sin usarse</label><select id="ac-min">${MINUTOS_BLOQUEO.map(([m, t]) => `<option value="${m}" ${m === 10 ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <p class="ayuda">Al activarla recibirás un <b>código de recuperación</b>. Guárdalo en un lugar seguro: es la única forma de entrar si olvidas la clave.</p>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="activarClave()">Activar</button></div>`);
}
async function activarClave() {
  const v = (id) => document.getElementById(id).value;
  if (v('ac-clave') !== v('ac-clave2')) return aviso('Las claves no coinciden', 'error');
  const r = await api.accesoActivar(v('ac-clave'), +v('ac-min'));
  if (!r.ok) return aviso(r.error, 'error');
  await refrescarEstadoAcceso();
  mostrarCodigoRecuperacion(r.codigo, 'La clave quedó activada.');
  render();
}
function mostrarCodigoRecuperacion(codigo, titulo) {
  abrirModal(`<h2>🔑 Código de recuperación</h2>
    <p>${esc(titulo)} Si olvidas la clave, este código te deja entrar y poner una nueva:</p>
    <div style="font-size:30px;font-weight:800;letter-spacing:3px;text-align:center;padding:16px;border:2px dashed var(--borde);border-radius:10px;font-family:monospace">${esc(codigo)}</div>
    <p class="ayuda">Anótalo en papel o guárdalo en tu correo. <b>No se vuelve a mostrar.</b> Sin la clave ni este código no se puede abrir el programa (tus respaldos sí se pueden restaurar en otro equipo).</p>
    <div class="botones"><button class="btn" onclick="navigator.clipboard.writeText('${esc(codigo)}');aviso('Copiado','ok')">📋 Copiar</button><button class="btn primario" onclick="cerrarModal()">Ya lo guardé</button></div>`);
}
function dialogoCambiarClave() {
  abrirModal(`<h2>Cambiar clave</h2>
    <div class="campo"><label>Clave actual</label><input type="password" id="cc-actual" autocomplete="current-password"></div>
    <div class="campo"><label>Clave nueva</label><input type="password" id="cc-nueva" autocomplete="new-password"></div>
    <div class="campo"><label>Repite la clave nueva</label><input type="password" id="cc-nueva2" autocomplete="new-password"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="cambiarClave()">Cambiar</button></div>`);
}
async function cambiarClave() {
  const v = (id) => document.getElementById(id).value;
  if (v('cc-nueva') !== v('cc-nueva2')) return aviso('Las claves nuevas no coinciden', 'error');
  const r = await api.accesoCambiar(v('cc-actual'), v('cc-nueva'));
  if (!r.ok) return aviso(r.error + (r.espera ? ` Espera ${r.espera} s.` : ''), 'error');
  mostrarCodigoRecuperacion(r.codigo, 'La clave se cambió. El código de recuperación anterior ya no sirve.');
}
function dialogoQuitarClave() {
  abrirModal(`<h2>Quitar clave</h2><p>El programa se abrirá sin pedir clave.</p>
    <div class="campo"><label>Clave actual</label><input type="password" id="qc-actual" autocomplete="current-password"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn peligro" onclick="quitarClave()">Quitar clave</button></div>`);
}
async function quitarClave() {
  const r = await api.accesoDesactivar(document.getElementById('qc-actual').value);
  if (!r.ok) return aviso(r.error + (r.espera ? ` Espera ${r.espera} s.` : ''), 'error');
  await refrescarEstadoAcceso();
  cerrarModal(); render(); aviso('Clave quitada', 'ok');
}
