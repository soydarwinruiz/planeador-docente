// ================= Dictado por voz =================
// Botón 🎤 junto al campo de texto activo. Graba, convierte a WAV y lo transcribe con OpenAI, Gemini o un servicio compatible.

const voz = { campo: null, grabando: false, rec: null, trozos: [], stream: null, inicio: 0, timer: null };
function vozActiva() { return S?.config?.voz?.activo !== false; }
function proveedorVoz() {
  const ia = S.config.ia || {}, v = S.config.voz || {};
  if (v.proveedor && v.proveedor !== 'auto') return v.proveedor;
  return ia.claves?.openai ? 'openai' : ia.claves?.gemini ? 'gemini' : (ia.proveedor === 'compatible' && ia.url) ? 'compatible' : '';
}
function campoDictable(el) {
  if (!el || el.disabled || el.readOnly) return false;
  if (el.tagName === 'TEXTAREA') return true;
  return el.tagName === 'INPUT' && (!el.type || el.type === 'text' || el.type === 'search') && !el.closest('.buscador') && el.id !== 'bus-q';
}
function botonVoz() {
  let b = document.getElementById('boton-voz');
  if (!b) {
    b = document.createElement('button');
    b.id = 'boton-voz'; b.type = 'button'; b.title = 'Dictar por voz (Ctrl + Shift + D)';
    b.addEventListener('mousedown', (e) => e.preventDefault()); // no quitar el foco del campo
    b.addEventListener('click', alternarDictado);
    document.documentElement.appendChild(b); // fuera del <body> para no heredar el zoom de la letra
  }
  return b;
}
function ubicarBotonVoz() {
  const b = botonVoz(), el = voz.campo;
  if (!el || !document.body.contains(el) || !vozActiva()) { if (!voz.grabando) b.style.display = 'none'; return; }
  const r = el.getBoundingClientRect();
  b.style.display = 'flex';
  b.style.top = `${r.top + 4}px`;
  b.style.left = `${r.right - 34}px`;
  b.className = voz.grabando ? 'grabando' : voz.procesando ? 'procesando' : '';
  b.innerHTML = voz.grabando ? `⏹ <span>${Math.floor((Date.now() - voz.inicio) / 1000)} s</span>` : voz.procesando ? '<span class="cargando"></span>' : '🎤';
}
document.addEventListener('focusin', (e) => {
  if (campoDictable(e.target)) { if (!voz.grabando) voz.campo = e.target; ubicarBotonVoz(); }
});
document.addEventListener('focusout', () => setTimeout(() => { if (!voz.grabando && !voz.procesando && !campoDictable(document.activeElement)) { voz.campo = null; ubicarBotonVoz(); } }, 150));
document.addEventListener('scroll', () => ubicarBotonVoz(), true);
window.addEventListener('resize', () => ubicarBotonVoz());
document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd' && (voz.grabando || campoDictable(document.activeElement))) { e.preventDefault(); alternarDictado(); } });

async function alternarDictado() {
  if (voz.procesando) return;
  if (voz.grabando) return detenerDictado();
  if (!proveedorVoz()) return ayudaDictado();
  try {
    voz.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) { return aviso('No se pudo usar el micrófono: ' + e.message, 'error'); }
  voz.trozos = [];
  voz.rec = new MediaRecorder(voz.stream);
  voz.rec.ondataavailable = (e) => { if (e.data.size) voz.trozos.push(e.data); };
  voz.rec.onstop = procesarDictado;
  voz.rec.start();
  voz.grabando = true; voz.inicio = Date.now();
  voz.timer = setInterval(() => { ubicarBotonVoz(); if (Date.now() - voz.inicio > 180000) detenerDictado(); }, 500);
  ubicarBotonVoz();
}
function detenerDictado() {
  clearInterval(voz.timer);
  voz.grabando = false; voz.procesando = true;
  voz.rec?.stop(); voz.stream?.getTracks().forEach((t) => t.stop());
  ubicarBotonVoz();
}
// WAV mono de 16 kHz: lo aceptan todos los servicios de transcripción
async function aWav(blob) {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const audio = await ctx.decodeAudioData(buf);
  ctx.close();
  const off = new OfflineAudioContext(1, Math.ceil(audio.duration * 16000), 16000);
  const src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start();
  const r = await off.startRendering();
  const datos = r.getChannelData(0);
  const wav = new DataView(new ArrayBuffer(44 + datos.length * 2));
  const txt = (o, t) => { for (let i = 0; i < t.length; i++) wav.setUint8(o + i, t.charCodeAt(i)); };
  txt(0, 'RIFF'); wav.setUint32(4, 36 + datos.length * 2, true); txt(8, 'WAVE'); txt(12, 'fmt ');
  wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true); wav.setUint32(24, 16000, true); wav.setUint32(28, 32000, true); wav.setUint16(32, 2, true); wav.setUint16(34, 16, true);
  txt(36, 'data'); wav.setUint32(40, datos.length * 2, true);
  for (let i = 0; i < datos.length; i++) wav.setInt16(44 + i * 2, Math.max(-1, Math.min(1, datos[i])) * 0x7fff, true);
  const bytes = new Uint8Array(wav.buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function procesarDictado() {
  try {
    const blob = new Blob(voz.trozos, { type: voz.rec.mimeType || 'audio/webm' });
    if (Date.now() - voz.inicio < 700 || blob.size < 1500) { aviso('Grabación muy corta. Pulsa 🎤, habla y vuelve a pulsar para terminar.'); return; }
    const audio = await aWav(blob);
    const r = await api.transcribir({ ia: S.config.ia, voz: { ...(S.config.voz || {}), proveedor: proveedorVoz() }, audio });
    if (!r.ok) return aviso('No se pudo transcribir: ' + r.error, 'error');
    if (!r.texto) return aviso('No se entendió el audio. Intenta de nuevo, más cerca del micrófono.');
    insertarDictado(r.texto);
  } catch (e) { aviso('Error en el dictado: ' + e.message, 'error'); }
  finally { voz.procesando = false; ubicarBotonVoz(); }
}
function insertarDictado(texto) {
  const el = voz.campo;
  if (!el || !document.body.contains(el)) { copiarTexto(texto); return aviso('El campo ya no está abierto: el texto dictado se copió al portapapeles.'); }
  const ini = el.selectionStart ?? el.value.length, fin = el.selectionEnd ?? ini;
  const antes = el.value.slice(0, ini), despues = el.value.slice(fin);
  const sep = antes && !/[\s\n]$/.test(antes) ? ' ' : '';
  el.value = antes + sep + texto + (despues && !/^[\s\n]/.test(despues) ? ' ' : '') + despues;
  const pos = (antes + sep + texto).length;
  el.focus(); el.setSelectionRange?.(pos, pos);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
function ayudaDictado() {
  abrirModal(`<h2>🎤 Dictado por voz</h2>
    <p>Para dictar desde la app se necesita una clave de <b>OpenAI</b> o de <b>Gemini</b> (o un servicio compatible como Groq) en <b>Configuración → Inteligencia artificial</b>. El costo por minuto de dictado es muy bajo.</p>
    <div class="alerta info"><b>Opción gratuita de Windows:</b> pon el cursor en cualquier campo y pulsa <b>tecla Windows + H</b>. Se abre el dictado de Windows (en Windows 11 funciona en español; la primera vez puede pedir activarlo en Configuración → Privacidad → Voz).</div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn primario" onclick="cerrarModal();irAConfig('ia','tarjeta-voz')">Configurar</button></div>`);
}
function tarjetaVoz() {
  const v = S.config.voz || {};
  const p = proveedorVoz();
  return `<div class="tarjeta" id="tarjeta-voz"><h2>🎤 Dictado por voz</h2>
    <p class="ayuda">Al escribir en cualquier campo aparece el botón 🎤: púlsalo, habla y vuelve a pulsarlo. También con <b>Ctrl + Shift + D</b>. El audio se envía al servicio elegido solo para transcribirlo.</p>
    <div class="rejilla r3" style="align-items:end">
      <div class="campo"><label><input type="checkbox" ${v.activo !== false ? 'checked' : ''} onchange="S.config.voz={...(S.config.voz||{}),activo:this.checked};guardar()"> Mostrar el botón 🎤</label></div>
      <div class="campo"><label>Servicio de transcripción</label><select onchange="S.config.voz={...(S.config.voz||{}),proveedor:this.value};guardar();render()">
        ${[['auto', 'Automático (según tus claves)'], ['openai', 'OpenAI'], ['gemini', 'Gemini (Google)'], ['compatible', 'Servicio compatible (p. ej. Groq)']].map(([k, t]) => `<option value="${k}" ${(v.proveedor || 'auto') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="campo"><label>Modelo (opcional)</label><input value="${esc(v.modelo || '')}" placeholder="${p === 'gemini' ? 'gemini-flash-latest' : p === 'compatible' ? 'whisper-large-v3' : 'gpt-4o-mini-transcribe'}" onchange="S.config.voz={...(S.config.voz||{}),modelo:this.value.trim()};guardar()"></div>
    </div>
    <p class="ayuda">${p ? `✔ Se usará <b>${{ openai: 'OpenAI', gemini: 'Gemini', compatible: 'el servicio compatible' }[p]}</b>.` : '⚠ No hay una clave de OpenAI ni de Gemini. Agrégala en la tarjeta de Inteligencia artificial (puedes tener varias claves y usar otra para las sugerencias).'}
    Alternativa gratuita: <b>Windows + H</b> (dictado de Windows).</p></div>`;
}
