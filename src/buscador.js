// ================= Buscador general y apariencia =================

function fuentesBusqueda() {
  const r = [];
  for (const p of S.planeaciones) r.push({ tipo: '📝 Planeación', titulo: p.titulo || 'Sin título', detalle: `${nombreGrupoId(p.grupoId)} · ${nombreArea(p.areaId)} · ${fechaCorta(p.fechaInicio)}`,
    texto: [p.titulo, p.competencias, p.dba, p.estandares, p.pregunta, p.objetivo, p.unidad, ...(p.sesiones || []).flatMap((s) => [s.titulo, s.exploracion, s.estructuracion, s.practica])].join(' '),
    ir: () => editarPlaneacion(p.id) });
  for (const a of S.alumnos) r.push({ tipo: '🧑‍🎓 Estudiante', titulo: nombreAlumno(a), detalle: `${nombreGrupoId(a.grupoId)}${a.piar ? ' · PIAR' : ''}${a.activo === false ? ' · retirado' : ''}`,
    texto: [nombreAlumno(a), a.documento, a.observaciones].join(' '), ir: () => { ui.seg = { grupoId: a.grupoId, alumnoId: a.id, periodoId: '' }; ir('seguimiento'); } });
  for (const g of S.grupos) r.push({ tipo: '👥 Grupo', titulo: nombreGrupo(g), detalle: `${alumnosDe(g.id).length} estudiantes`, texto: nombreGrupo(g) + ' grado ' + g.grado, ir: () => ir('alumnos', { grupoId: g.id }) });
  for (const x of S.bancoPedagogico) r.push({ tipo: '📚 ' + (TIPOS_BANCO[x.tipo]?.uno || 'Banco'), titulo: (x.codigo ? x.codigo + ' · ' : '') + x.nombre, detalle: x.clasificacion || '',
    texto: [x.codigo, x.nombre, x.clasificacion, x.descripcion, x.pasos].join(' '), ir: () => { ir('bancoPedagogico'); verEntradaBanco(x.id); } });
  for (const t of S.plantillas) r.push({ tipo: '📋 Plantilla', titulo: nombrePlantilla(t), detalle: descripcionAlcance(t), texto: [nombrePlantilla(t), descripcionAlcance(t), t.gustos, t.estilos].join(' '), ir: () => { ir('plantillas'); editarPlantilla(t.id); } });
  for (const m of S.mallas) for (const [perId, per] of Object.entries(m.periodos)) for (const it of per.items) r.push({ tipo: '🧩 Malla', titulo: it.eje || 'Eje sin nombre', detalle: `${nombreArea(m.areaId)} · ${m.grado}° · ${nombrePeriodo(perId)}`,
    texto: [it.eje, it.contenidos, it.estandares, it.dba].join(' '), ir: () => { ui.cur = { ...(ui.cur || {}), pestana: 'malla', areaId: m.areaId, grado: String(m.grado) }; (ui.mallaAbiertos ||= {})[it.id] = true; ir('curricular'); } });
  for (const p of S.planesApoyo) r.push({ tipo: '🆘 Plan de apoyo', titulo: nombreAlumno(porId(S.alumnos, p.alumnoId) || { apellidos: '', nombres: '' }), detalle: `${nombreArea(p.areaId)} · ${nombrePeriodo(p.periodoId)}`,
    texto: [nombreAlumno(porId(S.alumnos, p.alumnoId) || { apellidos: '', nombres: '' }), 'plan de apoyo', p.actividades].join(' '), ir: () => { ui.cal = { grupoId: p.grupoId, areaId: p.areaId, periodoId: p.periodoId, pestana: 'apoyo' }; ir('calificaciones'); editarPlanApoyo(p.id); } });
  for (const p of S.piar) { const a = porId(S.alumnos, p.alumnoId); if (a) r.push({ tipo: '🤝 PIAR', titulo: nombreAlumno(a), detalle: nombreGrupoId(a.grupoId), texto: nombreAlumno(a) + ' piar ' + (p.diagnostico || ''), ir: () => ir('piarEditor', { alumnoId: a.id }) }); }
  for (const e of S.eventos) r.push({ tipo: '📅 Evento', titulo: e.titulo, detalle: fechaCorta(e.fecha), texto: e.titulo, ir: () => { const d = deISO(e.fecha); ui.calMes = { anio: d.getFullYear(), mes: d.getMonth(), grupoId: '' }; ir('calendario'); } });
  for (const d of S.diario || []) r.push({ tipo: '📓 Diario', titulo: `${fechaCorta(d.fecha)} · ${nombreGrupoId(d.grupoId)}`, detalle: nombreArea(d.areaId), texto: [d.logrado, d.pendiente, d.novedades].join(' '), ir: () => abrirDiario('', '', '', d.id) });
  for (const p of S.pruebas || []) r.push({ tipo: p.tipo === 'taller' ? '📄 Taller' : '🧪 Prueba', titulo: p.titulo || 'Sin título', detalle: `${nombreArea(p.areaId)} · ${p.preguntas.length} preguntas`,
    texto: [p.titulo, p.tema, ...p.preguntas.flatMap((q) => [q.enunciado, q.contexto])].join(' '), ir: () => { ui.pruebaPest = 'preguntas'; ir('pruebaEditor', { id: p.id }); } });
  for (const f of S.fichas || []) r.push({ tipo: '🧩 Ficha', titulo: f.titulo || TIPOS_FICHA[f.tipo].t, detalle: TIPOS_FICHA[f.tipo].t, texto: [f.titulo, f.palabras, f.pistas, f.pares, f.texto, ...Object.values(f.guia || {})].join(' '), ir: () => { ui.ficha = structuredClone(f); ir('fichas'); } });
  for (const t of S.pizarras || []) r.push({ tipo: '🖍️ Tablero', titulo: t.titulo || 'Tablero sin título', detalle: [t.grupoIds.map(nombreGrupoId).join(', '), t.areaId ? nombreArea(t.areaId) : '', fechaCorta(t.fecha)].filter(Boolean).join(' · '),
    texto: [t.titulo, ...t.elementos.map((e) => (e.html ? pzTextoPlano(e.html) : '') + ' ' + (e.titulo || '') + ' ' + (e.texto || ''))].join(' '), ir: () => pzAbrir(t.id) });
  for (const v of vistasMenu()) r.push({ tipo: '➡️ Ir a', titulo: v.nombre, detalle: '', texto: v.nombre, ir: () => ir(v.id) });
  return r;
}
let resultadosBusqueda = [], selBusqueda = 0;
function abrirBuscador(texto = '') {
  abrirModal(`<h2>🔎 Buscar en todo</h2>
    <input id="bus-q" value="${esc(texto)}" placeholder="Planeaciones, estudiantes, estrategias, mallas, plantillas…" autocomplete="off"
      oninput="buscarGeneral(this.value)" onkeydown="teclaBuscador(event)">
    <div id="bus-res" style="margin-top:10px;max-height:60vh;overflow-y:auto"></div>
    <p class="ayuda" style="margin-bottom:0">Atajo: <b>Ctrl + K</b>. Usa ↑ ↓ y Enter para abrir.</p>`, { ancho: true });
  setTimeout(() => { const i = document.getElementById('bus-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 40);
  buscarGeneral(texto);
}
function resaltar(t, palabras) {
  let h = esc(t);
  for (const p of palabras) if (p.length > 1) h = h.replace(new RegExp(`(${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
  return h;
}
function buscarGeneral(q) {
  const cont = document.getElementById('bus-res');
  if (!cont) return;
  const palabras = normalizar(q).split(/\s+/).filter(Boolean);
  if (!palabras.length) { cont.innerHTML = '<p class="ayuda">Escribe al menos una palabra.</p>'; resultadosBusqueda = []; return; }
  resultadosBusqueda = fuentesBusqueda().map((x) => {
    const n = normalizar(x.texto + ' ' + x.titulo), nt = normalizar(x.titulo);
    if (!palabras.every((p) => n.includes(p))) return null;
    return { ...x, puntos: palabras.filter((p) => nt.includes(p)).length * 3 + (nt.startsWith(palabras[0]) ? 2 : 0) };
  }).filter(Boolean).sort((a, b) => b.puntos - a.puntos).slice(0, 60);
  selBusqueda = 0;
  const pal = q.split(/\s+/).filter(Boolean);
  cont.innerHTML = resultadosBusqueda.length ? `<ul class="lista-simple res-busqueda">${resultadosBusqueda.map((x, i) => `<li class="${i === 0 ? 'sel' : ''}" onclick="abrirResultado(${i})">
      <div><span class="chip">${esc(x.tipo)}</span> <b>${resaltar(x.titulo, pal)}</b><br><span class="ayuda">${esc(x.detalle)}</span></div></li>`).join('')}</ul>`
    : '<p class="ayuda">Sin resultados.</p>';
}
function teclaBuscador(e) {
  const items = document.querySelectorAll('.res-busqueda li');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    selBusqueda = Math.max(0, Math.min(items.length - 1, selBusqueda + (e.key === 'ArrowDown' ? 1 : -1)));
    items.forEach((li, i) => li.classList.toggle('sel', i === selBusqueda));
    items[selBusqueda]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter' && resultadosBusqueda.length) { e.preventDefault(); abrirResultado(selBusqueda); }
}
function abrirResultado(i) { const r = resultadosBusqueda[i]; cerrarModal(); r?.ir(); }
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrirBuscador(); }
});

// ---------- Apariencia ----------
const TAMANOS = [0.9, 1, 1.1, 1.2, 1.35];
function aplicarApariencia() {
  const ap = S?.config?.apariencia || {};
  const oscuro = ap.tema === 'oscuro' || (ap.tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('oscuro', oscuro);
  document.body.style.zoom = ap.zoom || 1;
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => aplicarApariencia());
function cambiarTema(t) { (S.config.apariencia ||= {}).tema = t; guardar(); aplicarApariencia(); render(); }
function cambiarZoom(d) {
  const ap = (S.config.apariencia ||= {});
  const i = TAMANOS.indexOf(ap.zoom || 1);
  ap.zoom = TAMANOS[Math.max(0, Math.min(TAMANOS.length - 1, (i < 0 ? 1 : i) + d))];
  guardar(); aplicarApariencia();
  aviso(`Tamaño de letra: ${Math.round(ap.zoom * 100)}%`);
}
function tarjetaApariencia() {
  const ap = S.config.apariencia || {};
  return `<div class="tarjeta"><h2>🎨 Apariencia</h2><div class="rejilla r2">
    <div class="campo"><label>Tema</label><div class="fila">${[['claro', '☀️ Claro'], ['oscuro', '🌙 Oscuro'], ['sistema', '💻 Como el sistema']].map(([k, t]) => `<button class="btn ${(ap.tema || 'claro') === k ? 'primario' : ''}" onclick="cambiarTema('${k}')">${t}</button>`).join('')}</div></div>
    <div class="campo"><label>Tamaño de la letra</label><div class="fila">${TAMANOS.map((z) => `<button class="btn ${(ap.zoom || 1) === z ? 'primario' : ''}" onclick="S.config.apariencia={...(S.config.apariencia||{}),zoom:${z}};guardar();aplicarApariencia();render()">${Math.round(z * 100)}%</button>`).join('')}</div>
      <div class="ayuda">También con los botones A− / A+ del menú lateral.</div></div>
  </div></div>`;
}

// ---------- Menú lateral personalizable ----------
function guardarMenu(lista, ocultos) {
  S.config.menu = { orden: lista, ocultos };
  guardar(); render();
}
function moverMenu(id, d) {
  const lista = vistasMenu(true).map((v) => v.id);
  const i = lista.indexOf(id), j = i + d;
  if (j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  guardarMenu(lista, S.config.menu?.ocultos || []);
}
function alternarMenu(id, visible) {
  const ocultos = new Set(S.config.menu?.ocultos || []);
  visible ? ocultos.delete(id) : ocultos.add(id);
  guardarMenu(vistasMenu(true).map((v) => v.id), [...ocultos]);
}
let arrastreMenu = null;
function soltarMenu(destino) {
  if (!arrastreMenu || arrastreMenu === destino) return;
  const lista = vistasMenu(true).map((v) => v.id).filter((x) => x !== arrastreMenu);
  lista.splice(lista.indexOf(destino), 0, arrastreMenu);
  arrastreMenu = null;
  guardarMenu(lista, S.config.menu?.ocultos || []);
}
function tarjetaMenu() {
  const lista = vistasMenu(true);
  const ocultos = new Set(S.config.menu?.ocultos || []);
  return `<div class="tarjeta" id="tarjeta-menu"><h2>🧭 Menú lateral</h2>
    <p class="ayuda">Desmarca los módulos que no usas para ocultarlos y ordénalos a tu gusto (arrastra o usa las flechas). Ocultar un módulo no borra sus datos; puedes volver a mostrarlo cuando quieras.</p>
    <ul class="lista-simple lista-menu">${lista.map((v, i) => {
      const fija = VISTAS_FIJAS.includes(v.id);
      return `<li draggable="true" ondragstart="arrastreMenu='${v.id}'" ondragover="event.preventDefault()" ondrop="soltarMenu('${v.id}')" class="${ocultos.has(v.id) && !fija ? 'menu-oculto' : ''}">
        <label style="font-weight:normal;color:inherit;margin:0;flex:1;cursor:grab"><span class="ayuda">⋮⋮</span>
          <input type="checkbox" ${fija || !ocultos.has(v.id) ? 'checked' : ''} ${fija ? 'disabled title="Siempre visible"' : ''} onchange="alternarMenu('${v.id}',this.checked)"> ${v.ico} ${esc(v.nombre)}</label>
        <span><button class="icono" title="Subir" ${i === 0 ? 'disabled' : ''} onclick="moverMenu('${v.id}',-1)">▲</button><button class="icono" title="Bajar" ${i === lista.length - 1 ? 'disabled' : ''} onclick="moverMenu('${v.id}',1)">▼</button></span></li>`;
    }).join('')}</ul>
    <button class="btn" onclick="S.config.menu={};guardar();render()">Restablecer menú original</button></div>`;
}
