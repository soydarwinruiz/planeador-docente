// ================= Tableros: Pizarra Local integrada, asociada a sesiones y grupos =================
// El editor es "Pizarra Local" (src/pizarra-local/index.html), abierto dentro de un iframe.
// El planeador guarda cada tablero en S.pizarras con su vínculo a la planeación, la sesión, los grupos y el área,
// y le envía elementos (estudiantes, momentos de la sesión…) por mensajes (postMessage).

const PZ = { id: null, listo: false, cerrando: null, temporizadorCierre: null };

// ---------- Datos ----------
function pzT(id = PZ.id) { return (S.pizarras || []).find((t) => t.id === id); }
function pzNuevoTablero(datos = {}) {
  const ahora = new Date().toISOString();
  const t = { id: uid(), titulo: '', grupoIds: [], areaId: '', planeacionId: '', sesionId: '', fecha: hoyISO(), creada: ahora, modificada: ahora,
    formato: 'pizarra-local', items: [], assets: {}, view: null, miniatura: '', ...datos };
  S.pizarras.push(t);
  return t;
}
function pzTextoPlano(html) {
  const d = document.createElement('div');
  d.innerHTML = String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|li)>/gi, '\n');
  return d.textContent.replace(/\n{3,}/g, '\n\n').trim();
}
function pzTextoDe(t) { return (t.items || []).map((i) => [i.text, i.title].filter(Boolean).join(' ')).join(' '); }

// Convierte los tableros hechos con la primera versión del módulo al formato de Pizarra Local
function pzConvertir(t) {
  if (t.formato === 'pizarra-local') return t;
  const formas = { rect: 'rect', redondeado: 'round', elipse: 'ellipse', triangulo: 'triangle', trianguloRect: 'triangle', rombo: 'diamond', hexagono: 'hexagon', pentagono: 'hexagon', octagono: 'hexagon', estrella: 'star', paralelogramo: 'parallelogram', trapecio: 'parallelogram', flechaDer: 'arrow', flechaIzq: 'arrow', flechaArriba: 'arrow', flechaDoble: 'arrow', cilindro: 'cylinder' };
  const items = [];
  for (const e of t.elementos || []) {
    const base = { id: e.id, x: e.x, y: e.y, w: e.w, h: e.h };
    if (e.rot) base.rot = e.rot * Math.PI / 180;
    if (e.g) base.groupId = e.g;
    if (e.bloqueado) base.locked = true;
    const st = e.estilo || {};
    const texto = { text: pzTextoPlano(e.html), color: st.color, bold: !!st.negrita, italic: !!st.cursiva, underline: !!st.subrayado, strike: !!st.tachado, align: st.alinH === 'justify' ? 'left' : st.alinH, valign: st.alinV, font: st.fuente && st.fuente !== 'Segoe UI' ? st.fuente : '' };
    switch (e.tipo) {
      case 'nota': items.push({ ...base, type: 'sticky', fill: e.color, ...texto, fontSize: e.ajuste === 'llenar' ? 'auto' : st.tam }); break;
      case 'texto': items.push({ ...base, type: 'text', ...texto, fontSize: st.tam || 24, valign: undefined }); break;
      case 'forma': items.push({ ...base, type: 'shape', shape: formas[e.forma] || 'rect', fill: e.relleno || 'transparent', stroke: e.borde, strokeWidth: e.grosor, dash: e.trazo !== 'solido', ...texto, fontSize: e.ajuste === 'llenar' ? 'auto' : st.tam }); break;
      case 'marco': items.push({ ...base, type: 'frame', title: e.titulo, fill: e.color }); break;
      case 'imagen': { const it = { ...base, type: 'image', asset: e.rid }; if (e.recorte && (e.recorte.w < 1 || e.recorte.h < 1)) it.crop = e.recorte; items.push(it); break; }
      case 'sello': items.push({ ...base, type: 'emoji', char: e.emoji }); break;
      case 'trazo': items.push({ ...base, type: 'pen', stroke: e.color, strokeWidth: e.grosor, hl: !!e.resaltador, pts: (e.puntos || []).map(([x, y]) => [x / (e.vw || 1), y / (e.vh || 1)]) }); break;
      case 'tabla': items.push({ ...base, type: 'shape', shape: 'rect', fill: '#ffffff', stroke: e.borde, strokeWidth: 1, color: st.color, fontSize: 'auto', align: 'left', text: (e.celdas || []).map((f) => f.map(pzTextoPlano).join('  |  ')).join('\n') }); break;
      case 'linea': items.push({ id: e.id, type: 'connector', from: e.desde ? { id: e.desde.id } : { x: e.p1.x, y: e.p1.y }, to: e.hasta ? { id: e.hasta.id } : { x: e.p2.x, y: e.p2.y },
        stroke: e.color, strokeWidth: e.grosor, style: { recta: 'straight', codo: 'elbow' }[e.ruta] || 'curved', startArrow: !!e.inicio && e.inicio !== 'ninguna', endArrow: !!e.fin && e.fin !== 'ninguna', dash: e.trazo !== 'solido', text: e.texto || '' }); break;
    }
  }
  for (const it of items) for (const k of Object.keys(it)) if (it[k] === undefined || (it[k] === '' && k !== 'text')) delete it[k];
  t.items = items; t.assets = t.recursos || {}; t.view = null; t.formato = 'pizarra-local';
  delete t.elementos; delete t.recursos; delete t.fondo; delete t.vista;
  return t;
}
function pzMigrar() { for (const t of S.pizarras || []) pzConvertir(t); }

// ---------- Vista del editor ----------
RENDERS.pizarra = ({ id }) => {
  const t = pzT(id);
  if (!t) return `<div class="tarjeta vacio"><div class="grande">🖍️</div>No se encontró el tablero. <a href="#" onclick="ir('pizarras');return false">Volver a los tableros</a></div>`;
  pzConvertir(t);
  PZ.id = id; PZ.listo = false;
  return `<div class="pz" id="pz">
    <div class="pz-barra-sup">
      <button class="btn pequeno" id="pz-boton-menu" onclick="alternarBarraLateral()" title="Ocultar o mostrar el menú lateral (Ctrl + B)">☰</button>
      <button class="btn pequeno" onclick="pzSalir()" title="Volver a la lista de tableros">← Tableros</button>
      <div class="pz-vinculo" onclick="pzDialogoVinculo('${t.id}')" title="Asignar a una planeación, sesión, grupos y área">${pzChipsVinculo(t)}</div>
      <div class="pz-sup-der">
        <button class="btn pequeno" onclick="pzDialogoEstudiantes()" title="Una nota por estudiante del grupo">🧑‍🎓 Estudiantes</button>
        <button class="btn pequeno" onclick="pzInsertarMomentos()" title="Los momentos de la sesión vinculada, con lo que planeaste">📝 Momentos de la sesión</button>
        <button class="btn pequeno" onclick="pzInsertarObjetivo()" title="Objetivo y pregunta problematizadora de la planeación">🎯 Objetivo</button>
        <button class="btn pequeno" onclick="pzAlumnoAzar()" title="Estudiante al azar de los grupos del tablero">🎲 Al azar</button>
        <button class="btn pequeno" onclick="pzAulaDesdeTablero()" title="Grupos de trabajo, temporizador y más">👥 Aula</button>
        <button class="btn pequeno" onclick="alternarEnfoque()" title="Ocultar el menú y esta barra para usar toda la pantalla (Ctrl + Shift + B)">⤢ Enfoque</button>
      </div>
    </div>
    <div class="pz-area" id="pz-area"><iframe id="pz-marco" src="pizarra-local/index.html" allow="fullscreen; local-fonts; clipboard-read; clipboard-write" title="Pizarra"></iframe></div>
  </div>`;
};
function pzMarco() { return document.getElementById('pz-marco')?.contentWindow || null; }
function pzEnviar(m) { const w = pzMarco(); if (w) w.postMessage(m, '*'); }
function pzChipsVinculo(t) {
  const p = t.planeacionId && porId(S.planeaciones, t.planeacionId);
  const si = p ? (p.sesiones || []).findIndex((s) => s.id === t.sesionId) : -1;
  const chips = [];
  if (p) chips.push(`<span class="chip sesion" title="Planeación vinculada">📝 ${esc(p.titulo || 'Planeación sin título')}${si >= 0 ? ` · Sesión ${si + 1}` : ''}</span>`);
  else if (t.planeacionId) chips.push('<span class="chip borrador">📝 Planeación eliminada</span>');
  if (t.grupoIds.length) chips.push(`<span class="chip semanal" title="Grupos">👥 ${t.grupoIds.map((g) => esc(nombreGrupoId(g))).join(', ')}</span>`);
  if (t.areaId) chips.push(`<span class="chip secuencia">${esc(nombreArea(t.areaId))}</span>`);
  if (t.fecha) chips.push(`<span class="chip">${esc(fechaCorta(t.fecha))}</span>`);
  return chips.length ? chips.join(' ') + ' <span class="pz-editar-vinc">✏️</span>' : '<span class="chip borrador">🔗 Sin asignar: elegir sesión y grupos</span>';
}

// Mensajes de la pizarra
window.addEventListener('message', (ev) => {
  const m = ev.data || {};
  if (m.origen !== 'pizarra-local' || !ev.source || ev.source !== pzMarco()) return;
  const t = pzT();
  if (!t) return;
  if (m.tipo === 'listo') {
    PZ.listo = true;
    pzEnviar({ tipo: 'abrir', tablero: { id: t.id, name: t.titulo || 'Tablero sin título', items: t.items || [], assets: t.assets || {}, view: t.view || null, created: Date.parse(t.creada) || Date.now(), updated: Date.parse(t.modificada) || Date.now() } });
  } else if (m.tipo === 'guardar' && m.id === t.id) {
    t.items = m.items || [];
    if (m.assets) t.assets = m.assets;
    t.view = m.view || null;
    if (m.nombre != null && m.nombre !== 'Tablero sin título') t.titulo = m.nombre;
    t.modificada = new Date().toISOString();
    guardar();
  } else if (m.tipo === 'cerrado') {
    if (m.miniatura != null) t.miniatura = m.miniatura;
    guardar();
    if (PZ.cerrando) { const fn = PZ.cerrando; PZ.cerrando = null; clearTimeout(PZ.temporizadorCierre); fn(); }
  } else if (m.tipo === 'pdf') pzGuardarPDF(m);
  else if (m.tipo === 'atajo') { if (m.accion === 'enfoque') alternarEnfoque(); else if (m.accion === 'menu') alternarBarraLateral(); }
});
async function pzGuardarPDF({ nombre, imagen, ancho, alto }) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{margin:10mm}html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100%;display:block}</style></head><body><img src="${imagen}"></body></html>`;
  const r = await api.guardarPDF({ nombre: nombre || 'Tablero', html, horizontal: ancho >= alto });
  if (r?.ok) aviso('PDF guardado', 'ok'); else if (r?.error) aviso('No se pudo crear el PDF: ' + r.error, 'error');
}
// Pide a la pizarra que guarde y devuelva una miniatura antes de salir
function pzCerrarYLuego(fn) {
  if (!PZ.listo || !pzMarco()) { fn(); return; }
  PZ.cerrando = fn;
  clearTimeout(PZ.temporizadorCierre);
  PZ.temporizadorCierre = setTimeout(() => { if (PZ.cerrando) { const f = PZ.cerrando; PZ.cerrando = null; f(); } }, 2500);
  pzEnviar({ tipo: 'cerrar', forzar: true });
}
function pzSalir() { pzCerrarYLuego(() => ir('pizarras')); }
function pzAbrir(id) {
  const abrir = () => ir('pizarra', { id });
  if (ui.vista === 'pizarra' && PZ.listo) pzCerrarYLuego(abrir); else abrir();
}

// ---------- Insertar desde el planeador ----------
function pzInsertar(elementos) {
  if (!PZ.listo) { aviso('La pizarra aún se está cargando.', 'error'); return; }
  pzEnviar({ tipo: 'insertar', elementos });
}
function pzDialogoEstudiantes() {
  const t = pzT();
  const grupos = t.grupoIds.length ? t.grupoIds.map((g) => porId(S.grupos, g)).filter(Boolean) : [...S.grupos].sort(ordenGrupos);
  if (!grupos.length) { aviso('Aún no tienes grupos con estudiantes.', 'error'); return; }
  abrirModal(`<h2>🧑‍🎓 Insertar estudiantes</h2>
    <div class="rejilla r2"><div class="campo"><label>Grupo</label><select id="pz-est-grupo">${opciones(grupos, grupos[0].id, { texto: nombreGrupo })}</select></div>
    <div class="campo"><label>Color de las notas</label><select id="pz-est-color">${[['#fff9b1', 'Amarillo'], ['#a6ccf5', 'Azul'], ['#d5f692', 'Verde'], ['#ffcee0', 'Rosado'], ['#ff9d48', 'Naranja'], ['varios', 'Varios colores']].map(([v, tx]) => `<option value="${v}">${tx}</option>`).join('')}</select></div></div>
    <label style="font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" id="pz-est-nombre" checked> Solo nombre y primer apellido</label>
    <label style="font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" id="pz-est-azar"> Orden al azar</label>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="pzInsertarEstudiantes()">Insertar</button></div>`);
}
function pzInsertarEstudiantes() {
  const g = document.getElementById('pz-est-grupo').value, color = document.getElementById('pz-est-color').value;
  const corto = document.getElementById('pz-est-nombre').checked, azar = document.getElementById('pz-est-azar').checked;
  cerrarModal();
  let lista = alumnosDe(g);
  if (!lista.length) { aviso('Ese grupo no tiene estudiantes.', 'error'); return; }
  if (azar) lista = lista.map((a) => [Math.random(), a]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const colores = ['#fff9b1', '#d5f692', '#a6ccf5', '#ffcee0', '#ff9d48', '#9ea9ff', '#67c6c0', '#f5d128'];
  const cols = Math.ceil(Math.sqrt(lista.length * 1.6)), W = 170, H = 110, sep = 16;
  pzInsertar(lista.map((a, i) => ({
    type: 'sticky', x: (i % cols) * (W + sep), y: Math.floor(i / cols) * (H + sep), w: W, h: H,
    fill: color === 'varios' ? colores[i % colores.length] : color,
    text: corto ? `${String(a.nombres || '').split(' ')[0]} ${String(a.apellidos || '').split(' ')[0]}`.trim() : nombreAlumno(a),
  })));
}
function pzPlanYSesion() {
  const t = pzT(), p = t.planeacionId && porId(S.planeaciones, t.planeacionId);
  return { t, p, s: p && (p.sesiones || []).find((x) => x.id === t.sesionId) };
}
function pzInsertarMomentos() {
  const { t, p, s } = pzPlanYSesion();
  if (!p) { aviso('Primero asigna el tablero a una planeación y una sesión.', 'error'); pzDialogoVinculo(t.id); return; }
  const ses = s || (p.sesiones || [])[0] || {};
  const colores = ['#a6ccf5', '#d5f692', '#fff9b1', '#ff9d48', '#be88c7'];
  const els = [{ type: 'text', x: 0, y: -170, w: 2300, fontSize: 40, bold: true, align: 'center', text: `${ses.titulo || p.titulo || 'Clase'}${ses.fecha ? ' · ' + fechaLarga(ses.fecha) : ''}` }];
  MOMENTOS.forEach((m, i) => {
    const x = i * 470;
    els.push({ type: 'frame', x, y: 0, w: 450, h: 800, title: m.t, fill: colores[i] });
    els.push({ type: 'sticky', x: x + 20, y: 30, w: 410, h: 470, fill: '#ffffff', fontSize: 20, align: 'left', valign: 'top', text: ses[m.k] || 'Acciones…' });
    els.push({ type: 'sticky', x: x + 20, y: 530, w: 410, h: 240, fill: '#fff9b1', fontSize: 18, align: 'left', valign: 'top', text: ses[m.k + 'Med'] ? 'Recursos: ' + ses[m.k + 'Med'] : 'Recursos y materiales…' });
  });
  pzInsertar(els);
}
function pzInsertarObjetivo() {
  const { t, p } = pzPlanYSesion();
  if (!p) { aviso('Primero asigna el tablero a una planeación.', 'error'); pzDialogoVinculo(t.id); return; }
  const els = [{ type: 'text', x: 0, y: 0, w: 800, fontSize: 40, bold: true, align: 'center', text: p.titulo || 'Planeación' }];
  let y = 90;
  if (p.objetivo) { els.push({ type: 'shape', shape: 'round', x: 0, y, w: 800, h: 150, fill: '#e8f5e9', stroke: '#43a047', strokeWidth: 2, fontSize: 22, align: 'left', text: '🎯 ' + p.objetivo }); y += 180; }
  if (p.pregunta) els.push({ type: 'shape', shape: 'ellipse', x: 50, y, w: 700, h: 240, fill: '#e3f2fd', stroke: '#1e88e5', strokeWidth: 2, fontSize: 24, text: '❓ ' + p.pregunta });
  pzInsertar(els);
}
function pzAulaDesdeTablero() { const t = pzT(); abrirAula(t.grupoIds[0] || '', t.areaId || ''); }
function pzAlumnoAzar() {
  const t = pzT();
  const lista = t.grupoIds.flatMap((g) => alumnosDe(g));
  if (!lista.length) { aviso('Asigna un grupo al tablero para elegir estudiantes al azar.', 'error'); return; }
  const a = lista[Math.floor(Math.random() * lista.length)];
  document.getElementById('pz-azar')?.remove();
  const d = document.createElement('div');
  d.id = 'pz-azar'; d.className = 'pz-azar';
  d.innerHTML = `<div>🎲</div><b>${esc(nombreAlumno(a))}</b><span>${esc(nombreGrupoId(a.grupoId))}</span>`;
  d.onclick = () => d.remove();
  document.getElementById('pz-area').appendChild(d);
  setTimeout(() => d.remove(), 6000);
}

// ---------- Vínculo con planeación, sesión y grupos ----------
function pzDialogoVinculo(id) {
  const t = pzT(id);
  const planes = [...S.planeaciones].sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));
  abrirModal(`<h2>🔗 Asignar el tablero</h2>
    <p class="ayuda">Asocia el tablero a la sesión de clase en la que lo vas a usar y a los grupos que trabajan en él. Así lo encuentras desde la planeación, desde tus clases del día y en la lista de tableros.</p>
    <div class="campo"><label>Título del tablero</label><input id="pz-v-titulo" value="${esc(t.titulo)}" placeholder="Ej.: Lluvia de ideas – fracciones"></div>
    <div class="campo"><label>Planeación</label><select id="pz-v-plan" onchange="pzVinculoPlan()"><option value="">(sin planeación)</option>${planes.map((p) => `<option value="${p.id}" ${p.id === t.planeacionId ? 'selected' : ''}>${esc(fechaCorta(p.fechaInicio))} · ${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))} · ${esc(p.titulo || 'Sin título')}</option>`).join('')}</select></div>
    <div class="rejilla r2"><div class="campo"><label>Sesión</label><select id="pz-v-sesion" onchange="pzVinculoSesion()"></select></div>
    <div class="campo"><label>Fecha de uso</label><input type="date" id="pz-v-fecha" value="${esc(t.fecha || '')}"></div></div>
    <div class="campo"><label>Área</label><select id="pz-v-area">${opcionesAreas(t.areaId, '(sin área)')}</select></div>
    <div class="campo"><label>Grupos</label><div class="fila" id="pz-v-grupos">${[...S.grupos].sort(ordenGrupos).map((g) => `<label class="chip" style="font-weight:normal;cursor:pointer;font-size:13px;padding:4px 10px"><input type="checkbox" class="pz-v-g" value="${g.id}" ${t.grupoIds.includes(g.id) ? 'checked' : ''}> ${esc(nombreGrupo(g))}</label>`).join('') || '<span class="ayuda">Aún no tienes grupos.</span>'}</div></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="pzGuardarVinculo('${t.id}')">Guardar</button></div>`);
  pzVinculoPlan(t.sesionId, true);
}
function pzVinculoPlan(sesionId, inicial = false) {
  const p = porId(S.planeaciones, document.getElementById('pz-v-plan').value);
  const sel = document.getElementById('pz-v-sesion');
  sel.innerHTML = p ? `<option value="">(toda la planeación)</option>${(p.sesiones || []).map((s, i) => `<option value="${s.id}" ${s.id === sesionId ? 'selected' : ''}>Sesión ${i + 1}${s.fecha ? ' · ' + esc(fechaCorta(s.fecha)) : ''}${s.titulo ? ' · ' + esc(s.titulo) : ''}</option>`).join('')}` : '<option value="">—</option>';
  if (!p || inicial) return;
  const ids = new Set([p.grupoId, ...(p.vinculadas || []).map((v) => porId(S.planeaciones, v)?.grupoId)].filter(Boolean));
  for (const c of document.querySelectorAll('.pz-v-g')) if (ids.has(c.value)) c.checked = true;
  if (p.areaId) document.getElementById('pz-v-area').value = p.areaId;
  if (!sesionId && p.sesiones?.length) { const hoy = hoyISO(); const s = p.sesiones.find((x) => x.fecha >= hoy) || p.sesiones[0]; sel.value = s.id; }
  pzVinculoSesion();
}
function pzVinculoSesion() {
  const p = porId(S.planeaciones, document.getElementById('pz-v-plan').value);
  const s = p && (p.sesiones || []).find((x) => x.id === document.getElementById('pz-v-sesion').value);
  if (s?.fecha) document.getElementById('pz-v-fecha').value = s.fecha;
  const tit = document.getElementById('pz-v-titulo');
  if (!tit.value && (s?.titulo || p?.titulo)) tit.value = s?.titulo || p.titulo;
}
function pzGuardarVinculo(id) {
  const t = pzT(id);
  t.titulo = document.getElementById('pz-v-titulo').value.trim();
  t.planeacionId = document.getElementById('pz-v-plan').value;
  t.sesionId = t.planeacionId ? document.getElementById('pz-v-sesion').value : '';
  t.fecha = document.getElementById('pz-v-fecha').value;
  t.areaId = document.getElementById('pz-v-area').value;
  t.grupoIds = [...document.querySelectorAll('.pz-v-g:checked')].map((c) => c.value);
  t.modificada = new Date().toISOString();
  guardar();
  cerrarModal();
  if (ui.vista === 'pizarra' && PZ.id === id) {
    const v = document.querySelector('.pz-vinculo'); if (v) v.innerHTML = pzChipsVinculo(t);
    pzEnviar({ tipo: 'nombre', nombre: t.titulo || 'Tablero sin título' });
  } else render();
  aviso('Tablero asignado', 'ok');
}
// Desde una sesión de la planeación: abre su tablero o crea uno vinculado
function pzAbrirDeSesion(planId, sesionId) {
  const lista = pzTablerosDeSesion(planId, sesionId);
  if (lista.length === 1) { pzAbrir(lista[0].id); return; }
  if (lista.length > 1) {
    abrirModal(`<h2>🖍️ Tableros de esta sesión</h2><ul class="lista-simple">${lista.map((t) => `<li><div><b>${esc(t.titulo || 'Sin título')}</b><br><span class="ayuda">${(t.items || t.elementos || []).length} elementos · modificado ${esc(fechaCorta((t.modificada || '').slice(0, 10)))}</span></div><button class="btn pequeno primario" onclick="cerrarModal();pzAbrir('${t.id}')">Abrir</button></li>`).join('')}</ul>
      <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn" onclick="cerrarModal();pzCrearParaSesion('${planId}','${sesionId}')">＋ Nuevo tablero</button></div>`);
    return;
  }
  pzCrearParaSesion(planId, sesionId);
}
function pzCrearParaSesion(planId, sesionId) {
  const p = porId(S.planeaciones, planId);
  const s = p && (p.sesiones || []).find((x) => x.id === sesionId);
  const grupos = p ? [p.grupoId, ...(p.vinculadas || []).map((v) => porId(S.planeaciones, v)?.grupoId)].filter(Boolean) : [];
  const t = pzNuevoTablero({ titulo: s?.titulo || p?.titulo || '', planeacionId: planId || '', sesionId: sesionId || '', grupoIds: [...new Set(grupos)], areaId: p?.areaId || '', fecha: s?.fecha || p?.fechaInicio || hoyISO() });
  guardar();
  pzAbrir(t.id);
}
function pzTablerosDeSesion(planId, sesionId) { return (S.pizarras || []).filter((t) => t.planeacionId === planId && t.sesionId === sesionId); }
function pzBotonSesion(planId, sesionId) {
  const n = pzTablerosDeSesion(planId, sesionId).length;
  return `<button class="btn pequeno ${n ? 'primario' : ''}" title="${n ? 'Abrir el tablero de esta sesión' : 'Crear un tablero (pizarra) para esta sesión'}" onclick="pzAbrirDeSesion('${planId}','${sesionId}')">🖍️ Tablero${n > 1 ? ` (${n})` : n ? ' ✓' : ''}</button>`;
}

// ---------- Lista de tableros ----------
RENDERS.pizarras = () => {
  pzMigrar();
  const f = ui.filtroPz || (ui.filtroPz = { grupoId: '', areaId: '', texto: '' });
  const q = normalizar(f.texto);
  const lista = S.pizarras.filter((t) => (!f.grupoId || t.grupoIds.includes(f.grupoId)) && (!f.areaId || t.areaId === f.areaId)
    && (!q || normalizar(t.titulo + ' ' + pzTextoDe(t)).includes(q)))
    .sort((a, b) => (b.modificada || '').localeCompare(a.modificada || ''));
  return `<div class="cabecera"><div><h1>🖍️ Tableros</h1><p class="sub">Pizarras infinitas para la clase: notas, textos con formato, formas, conectores, dibujo, imágenes y PDF, marcos para presentar, comentarios y temporizador. Cada tablero se asigna a una sesión y a sus grupos.</p></div>
    <div class="acciones"><button class="btn primario" onclick="pzNuevoDialogo()">＋ Nuevo tablero</button></div></div>
  <div class="filtros tarjeta">
    <div style="flex:1;min-width:200px"><label>Buscar</label><input value="${esc(f.texto)}" placeholder="Título o texto del tablero…" oninput="ui.filtroPz.texto=this.value;clearTimeout(window._tpz);window._tpz=setTimeout(()=>{render();const i=document.querySelector('.filtros input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},300)"></div>
    <div><label>Grupo</label><select onchange="ui.filtroPz.grupoId=this.value;render()">${opcionesGrupos(f.grupoId, 'Todos')}</select></div>
    <div><label>Área</label><select onchange="ui.filtroPz.areaId=this.value;render()">${opcionesAreas(f.areaId, 'Todas')}</select></div>
  </div>
  ${lista.length ? `<div class="pz-lista">${lista.map((t) => {
    const p = t.planeacionId && porId(S.planeaciones, t.planeacionId);
    const si = p ? (p.sesiones || []).findIndex((s) => s.id === t.sesionId) : -1;
    const n = (t.items || []).length;
    return `<div class="tarjeta pz-tarjeta"><div class="pz-mini" onclick="pzAbrir('${t.id}')">${t.miniatura ? `<img src="${esc(t.miniatura)}" alt="">` : `<div class="pz-mini-vacio">${n ? 'Ábrelo para ver la vista previa' : 'Tablero vacío'}</div>`}</div>
      <div class="tit" style="font-weight:600;font-size:15px">${esc(t.titulo || 'Tablero sin título')}</div>
      <div class="ayuda">${p ? `📝 ${esc(p.titulo || 'Sin título')}${si >= 0 ? ` · Sesión ${si + 1}` : ''}<br>` : ''}${t.grupoIds.length ? '👥 ' + t.grupoIds.map((g) => esc(nombreGrupoId(g))).join(', ') + '<br>' : ''}${t.areaId ? esc(nombreArea(t.areaId)) + ' · ' : ''}${t.fecha ? esc(fechaCorta(t.fecha)) + ' · ' : ''}${n} elementos</div>
      ${!p && !t.grupoIds.length ? '<div><span class="chip borrador">Sin asignar</span></div>' : ''}
      <div class="pie"><button class="btn pequeno primario" onclick="pzAbrir('${t.id}')">Abrir</button><button class="btn pequeno" onclick="pzDialogoVinculo('${t.id}')">🔗 Asignar</button>
        ${p ? `<button class="btn pequeno" onclick="editarPlaneacion('${p.id}')" title="Ir a la planeación">📝</button>` : ''}
        <button class="icono" title="Duplicar" onclick="pzDuplicarTablero('${t.id}')">📑</button><button class="icono" title="Eliminar" onclick="pzEliminarTablero('${t.id}')">🗑️</button></div></div>`;
  }).join('')}</div>` : `<div class="tarjeta vacio"><div class="grande">🖍️</div>${S.pizarras.length ? 'Ningún tablero coincide con los filtros.' : 'Aún no tienes tableros. Crea uno aquí o desde una sesión de tu planeación (botón 🖍️ Tablero).'}</div>`}`;
};
function pzNuevoDialogo() {
  const hoy = hoyISO();
  const recientes = S.planeaciones.filter((p) => (p.sesiones || []).some((s) => s.fecha && s.fecha >= sumarDias(hoy, -7))).sort((a, b) => (a.fechaInicio || '').localeCompare(b.fechaInicio || ''));
  const otras = S.planeaciones.filter((p) => !recientes.includes(p)).sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));
  abrirModal(`<h2>＋ Nuevo tablero</h2>
    <div class="campo"><label>¿Para qué clase?</label><select id="pz-n-plan" onchange="pzNuevoSesiones()"><option value="">Tablero libre (lo asignas después)</option>${recientes.map((p) => `<option value="${p.id}">${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))} · ${esc(p.titulo || 'Sin título')}</option>`).join('')}
      ${otras.length ? `<optgroup label="Planeaciones anteriores">${otras.map((p) => `<option value="${p.id}">${esc(fechaCorta(p.fechaInicio))} · ${esc(nombreGrupoId(p.grupoId))} · ${esc(p.titulo || 'Sin título')}</option>`).join('')}</optgroup>` : ''}</select></div>
    <div class="campo" id="pz-n-ses-c" style="display:none"><label>Sesión</label><select id="pz-n-ses"></select></div>
    <p class="ayuda">Dentro del tablero encuentras plantillas (lluvia de ideas, mapa mental, retrospectiva…) en la barra de herramientas.</p>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="pzCrearDesdeDialogo()">Crear</button></div>`);
}
function pzNuevoSesiones() {
  const p = porId(S.planeaciones, document.getElementById('pz-n-plan').value);
  document.getElementById('pz-n-ses-c').style.display = p ? '' : 'none';
  if (!p) return;
  const hoy = hoyISO();
  const prox = (p.sesiones || []).find((s) => s.fecha >= hoy) || p.sesiones?.[0];
  document.getElementById('pz-n-ses').innerHTML = (p.sesiones || []).map((s, i) => `<option value="${s.id}" ${s === prox ? 'selected' : ''}>Sesión ${i + 1}${s.fecha ? ' · ' + esc(fechaCorta(s.fecha)) : ''}${s.titulo ? ' · ' + esc(s.titulo) : ''}</option>`).join('');
}
function pzCrearDesdeDialogo() {
  const plan = document.getElementById('pz-n-plan').value, ses = plan ? document.getElementById('pz-n-ses').value : '';
  cerrarModal();
  if (plan) { pzCrearParaSesion(plan, ses); return; }
  const t = pzNuevoTablero({ fecha: hoyISO() });
  guardar();
  pzAbrir(t.id);
  setTimeout(() => pzDialogoVinculo(t.id), 300);
}
function pzDuplicarTablero(id) {
  const o = pzT(id);
  const c = structuredClone(o);
  c.id = uid(); c.titulo = (o.titulo || 'Tablero') + ' (copia)'; c.creada = c.modificada = new Date().toISOString();
  S.pizarras.push(c);
  guardar();
  aviso('Tablero duplicado', 'ok');
  render();
}
async function pzEliminarTablero(id) {
  const t = pzT(id);
  if (!(await confirmar(`¿Eliminar el tablero "${t.titulo || 'Sin título'}"? Se borrarán todos sus elementos.`))) return;
  S.pizarras = S.pizarras.filter((x) => x.id !== id);
  guardar();
  render();
}
