// ================= Frases rápidas (atajos de texto) =================
// El docente guarda frases que usa a menudo. En cualquier campo de texto, al escribir ";atajo" y un espacio
// (o Enter), el atajo se reemplaza por la frase. Ctrl + Espacio abre la lista para elegir una.

const FRASES_EJEMPLO = [
  { atajo: 'bien', texto: 'Demuestra buen desempeño en el periodo: participa activamente, cumple con sus compromisos y trabaja en equipo de forma respetuosa.' },
  { atajo: 'refuerzo', texto: 'Debe reforzar los temas vistos en el periodo, entregar las actividades pendientes y asistir a las asesorías programadas.' },
  { atajo: 'cita', texto: 'Respetado acudiente: lo invito a una reunión para dialogar sobre el proceso académico y de convivencia de su acudido(a).' },
];
function frases() { return (S.config.frases ||= FRASES_EJEMPLO.map((f) => ({ id: uid(), ...f }))); }
function buscarFrase(atajo) { const a = normalizar(atajo); return frases().find((f) => normalizar(f.atajo) === a); }
function campoDeTexto(el) {
  return el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|)$/i.test(el.type || ''))) && !el.readOnly && !el.disabled;
}
// Inserta texto en la posición del cursor y avisa al campo como si se hubiera escrito
function insertarEnCampo(el, desde, hasta, texto) {
  el.setRangeText(texto, desde, hasta, 'end');
  el.dataset.fraseSucia = '1';
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!S || !campoDeTexto(el) || e.inputType === undefined) return;
  const fin = el.selectionStart;
  if (fin == null || fin !== el.selectionEnd) return;
  const m = /(^|[\s(¿¡"])[;]([\p{L}\d_-]{1,30})([ \n])$/u.exec(el.value.slice(Math.max(0, fin - 40), fin));
  if (!m) return;
  const f = buscarFrase(m[2]);
  if (!f) return;
  const largo = m[2].length + 2; // ";" + atajo + separador
  insertarEnCampo(el, fin - largo, fin, f.texto + m[3]);
});
// Si una frase cambió el campo, al salir de él se confirma el cambio (para que se guarde)
document.addEventListener('blur', (e) => {
  const el = e.target;
  if (el?.dataset?.fraseSucia) { delete el.dataset.fraseSucia; el.dispatchEvent(new Event('change', { bubbles: true })); }
}, true);

// Ctrl + Espacio: elegir una frase de la lista
let campoFrase = null;
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey && e.code === 'Space') || !S || !campoDeTexto(document.activeElement)) return;
  e.preventDefault();
  const el = document.activeElement;
  campoFrase = { el, desde: el.selectionStart, hasta: el.selectionEnd };
  const caja = document.createElement('div');
  caja.id = 'selector-frases';
  const r = el.getBoundingClientRect();
  caja.style.cssText = `position:fixed;left:${Math.min(r.left, innerWidth - 380)}px;top:${Math.min(r.bottom + 4, innerHeight - 300)}px;z-index:70`;
  caja.innerHTML = `<input placeholder="Buscar frase…" oninput="filtrarSelectorFrases(this.value)" onkeydown="teclaSelectorFrases(event)"><div class="lista"></div>`;
  document.getElementById('selector-frases')?.remove();
  document.body.appendChild(caja);
  filtrarSelectorFrases('');
  caja.querySelector('input').focus();
});
function filtrarSelectorFrases(q) {
  const t = normalizar(q);
  const l = frases().filter((f) => !t || normalizar(f.atajo + ' ' + f.texto).includes(t));
  const caja = document.querySelector('#selector-frases .lista');
  caja.innerHTML = l.length ? l.map((f, i) => `<button class="${i ? '' : 'sel'}" data-id="${f.id}" onmousedown="event.preventDefault();elegirFrase('${f.id}')"><b>;${esc(f.atajo)}</b> ${esc(f.texto.slice(0, 90))}${f.texto.length > 90 ? '…' : ''}</button>`).join('')
    : `<p class="ayuda" style="padding:8px">Sin frases. Créalas en Configuración → Frases rápidas.</p>`;
}
function teclaSelectorFrases(e) {
  const botones = [...document.querySelectorAll('#selector-frases .lista button')];
  const i = botones.findIndex((b) => b.classList.contains('sel'));
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrarSelectorFrases(); }
  else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const j = Math.max(0, Math.min(botones.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
    botones.forEach((b, k) => b.classList.toggle('sel', k === j)); botones[j]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') { e.preventDefault(); if (botones[i]) elegirFrase(botones[i].dataset.id); }
}
function cerrarSelectorFrases() {
  document.getElementById('selector-frases')?.remove();
  if (campoFrase?.el?.isConnected) campoFrase.el.focus();
  campoFrase = null;
}
function elegirFrase(id) {
  const f = porId(frases(), id), c = campoFrase;
  document.getElementById('selector-frases')?.remove();
  campoFrase = null;
  if (!f || !c?.el?.isConnected) return;
  c.el.focus();
  insertarEnCampo(c.el, c.desde, c.hasta, f.texto);
}
document.addEventListener('mousedown', (e) => { if (campoFrase && !e.target.closest('#selector-frases')) { document.getElementById('selector-frases')?.remove(); campoFrase = null; } });

// ---------- Configuración ----------
function tarjetaFrases() {
  const l = frases();
  return `<div class="tarjeta" id="tarjeta-frases">
    <p class="ayuda">Escribe <b>;atajo</b> seguido de un espacio en cualquier campo (planeaciones, observaciones, comunicados, diario, planes de apoyo…) y se reemplaza por la frase. Con <b>Ctrl + Espacio</b> eliges de la lista. También funcionan en el celular del docente.</p>
    <table class="tabla"><thead><tr><th style="width:150px">Atajo</th><th>Frase</th><th></th></tr></thead><tbody>
    ${l.map((f) => `<tr><td><div class="fila" style="flex-wrap:nowrap">;<input value="${esc(f.atajo)}" onchange="cambiarFrase('${f.id}','atajo',this.value)"></div></td>
      <td><textarea rows="2" onchange="cambiarFrase('${f.id}','texto',this.value)">${esc(f.texto)}</textarea></td>
      <td><button class="icono" title="Eliminar" onclick="eliminarFrase('${f.id}')">🗑️</button></td></tr>`).join('')}
    </tbody></table>
    <button class="btn" onclick="agregarFrase()">＋ Nueva frase</button></div>`;
}
function limpiarAtajo(a) { return String(a || '').trim().replace(/^;+/, '').replace(/[^\p{L}\d_-]/gu, '').slice(0, 30); }
function cambiarFrase(id, k, v) {
  const f = porId(frases(), id); if (!f) return;
  if (k === 'atajo') {
    const a = limpiarAtajo(v);
    if (!a) return aviso('El atajo debe tener letras o números', 'error');
    if (frases().some((x) => x.id !== id && normalizar(x.atajo) === normalizar(a))) return aviso(`Ya existe el atajo ;${a}`, 'error');
    f.atajo = a;
  } else f.texto = v;
  guardar();
}
function agregarFrase() {
  let n = frases().length + 1;
  while (buscarFrase('frase' + n)) n++;
  frases().push({ id: uid(), atajo: 'frase' + n, texto: '' });
  guardar(); render();
  setTimeout(() => document.querySelector('#tarjeta-frases tbody tr:last-child textarea')?.focus(), 50);
}
async function eliminarFrase(id) {
  if (!(await confirmar('¿Eliminar esta frase rápida?'))) return;
  S.config.frases = frases().filter((f) => f.id !== id); guardar(); render();
}
