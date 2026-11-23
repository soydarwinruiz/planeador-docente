// ================= Actualizaciones, respaldo en la nube y compartir con otros docentes =================

// ---------- Actualizaciones ----------
let estadoAct = { fase: 'inicial' };
async function buscarActualizaciones(silencioso = false) {
  if (!silencioso) { estadoAct = { fase: 'buscando' }; pintarAct(); }
  const r = await api.buscarActualizacion();
  if (!r.ok) { if (!silencioso) { estadoAct = { fase: 'error', error: r.error }; pintarAct(); } return; }
  estadoAct = r.hay ? { fase: 'disponible', version: r.version, soloAviso: r.soloAviso } : { fase: 'aldia', version: r.version };
  if (silencioso && r.hay) mostrarAvisoActualizacion();
  pintarAct();
}
function mostrarAvisoActualizacion() {
  if (document.getElementById('banda-act')) return;
  const d = document.createElement('div');
  d.id = 'banda-act';
  d.className = 'aviso ok';
  d.style.cursor = 'pointer';
  d.innerHTML = `🎉 Hay una nueva versión (${esc(estadoAct.version)}). <u>Ver</u>`;
  d.onclick = () => { d.remove(); ir('configuracion'); setTimeout(() => document.getElementById('tarjeta-act')?.scrollIntoView({ behavior: 'smooth' }), 100); };
  document.getElementById('avisos').appendChild(d);
}
api.alEstadoActualizacion((e) => { estadoAct = e; pintarAct(); if (e.fase === 'lista') aviso(`Versión ${e.version} descargada. Reinicia para instalarla.`, 'ok'); });
async function descargarAct() {
  if (estadoAct.soloAviso) { api.paginaDescargas(); return; }
  estadoAct = { fase: 'descargando', porcentaje: 0, version: estadoAct.version }; pintarAct();
  const r = await api.descargarActualizacion();
  if (!r.ok) { estadoAct = { fase: 'error', error: r.error }; pintarAct(); }
}
function htmlAct() {
  const e = estadoAct;
  return ({
    inicial: '<span class="ayuda">Pulsa "Buscar actualizaciones".</span>',
    buscando: '<span class="cargando" style="border-color:var(--borde);border-top-color:var(--azul-2)"></span> Buscando…',
    aldia: `✔ Tienes la versión más reciente (${esc(e.version || '')}).`,
    disponible: `🎉 Hay una nueva versión: <b>${esc(e.version)}</b>. <button class="btn pequeno primario" onclick="descargarAct()">${e.soloAviso ? 'Abrir la página de descarga' : 'Descargar e instalar'}</button>`,
    descargando: `Descargando… <b>${e.porcentaje || 0}%</b> <progress max="100" value="${e.porcentaje || 0}" style="vertical-align:middle"></progress>`,
    lista: `✔ Versión ${esc(e.version || '')} lista. <button class="btn pequeno primario" onclick="api.instalarActualizacion()">Reiniciar e instalar</button> <span class="ayuda">(o se instalará al cerrar la app)</span>`,
    error: `<span style="color:var(--rojo)">✖ ${esc(e.error || 'Error')}</span>`,
  })[e.fase] || '';
}
function pintarAct() { const el = document.getElementById('estado-act'); if (el) el.innerHTML = htmlAct(); }
function tarjetaActualizaciones() {
  const auto = S.config.actualizaciones?.auto !== false;
  setTimeout(async () => { const i = await api.infoVersion(); const el = document.getElementById('info-version'); if (el) el.textContent = `Versión instalada: ${i.version}${i.portable ? ' (portable: se avisa y se descarga desde la página)' : i.instalada ? '' : ' (modo desarrollo)'}`; }, 0);
  return `<div class="tarjeta" id="tarjeta-act"><h2>🔄 Actualizaciones</h2>
    <p class="ayuda" id="info-version"></p>
    <div class="fila"><button class="btn" onclick="buscarActualizaciones()">Buscar actualizaciones</button><span id="estado-act">${htmlAct()}</span></div>
    <div class="campo" style="margin-top:10px"><label style="font-weight:normal;color:inherit"><input type="checkbox" ${auto ? 'checked' : ''} onchange="S.config.actualizaciones={auto:this.checked};guardar()"> Buscar actualizaciones automáticamente al abrir la app</label></div>
    <p class="ayuda">La versión instalada descarga e instala las mejoras sola; tus datos no se tocan. La versión portable solo avisa y abre la página de descarga.</p></div>`;
}

// ---------- Respaldo en carpeta sincronizada ----------
function tarjetaNube() {
  const c = S.config.nube || {};
  return `<div class="tarjeta"><h2>☁️ Respaldo en la nube</h2>
    <p class="ayuda">Elige una carpeta que se sincronice con la nube (por ejemplo, la carpeta de <b>OneDrive</b> o de <b>Google Drive para escritorio</b>) o una memoria USB.
    La app guardará allí una copia de tus datos cada 20 minutos y al cerrar (conserva las de los últimos 14 días). Si cambias de computador, instala la app y usa <b>Restaurar desde archivo</b> con <i>planeador-ultimo.json</i>.</p>
    <div class="fila"><input value="${esc(c.carpeta || '')}" placeholder="Sin carpeta configurada" readonly style="flex:1;min-width:280px">
      <button class="btn" onclick="elegirCarpetaNube()">📁 Elegir carpeta…</button>
      ${c.carpeta ? `<button class="btn" onclick="respaldarAhora()">Respaldar ahora</button><button class="btn peligro" onclick="S.config.nube={};guardar();api.configurarNube('');render()">Quitar</button>` : ''}</div>
    ${c.ultimo ? `<p class="ayuda">Último respaldo: ${esc(c.ultimo)}</p>` : ''}
    <details style="margin-top:8px"><summary class="ayuda" style="cursor:pointer">¿Cómo encuentro la carpeta de OneDrive o Google Drive?</summary>
      <ol class="ayuda"><li><b>OneDrive:</b> viene con Windows. En el Explorador de archivos aparece a la izquierda como "OneDrive". Inicia sesión con tu correo si te lo pide.</li>
      <li><b>Google Drive:</b> instala "Google Drive para escritorio" e inicia sesión; aparece una unidad "Google Drive" (G:) con la carpeta "Mi unidad".</li>
      <li>En esta app pulsa "Elegir carpeta…" y selecciona esa carpeta. Desde ese momento tus respaldos también quedan en la nube.</li></ol></details></div>`;
}
async function elegirCarpetaNube() {
  const c = await api.elegirCarpetaNube();
  if (!c) return;
  S.config.nube = { carpeta: c };
  await api.configurarNube(c);
  await respaldarAhora();
}
async function respaldarAhora() {
  await api.guardar(S);
  const r = await api.respaldarNube();
  if (r.ok) { S.config.nube.ultimo = new Date().toLocaleString('es-CO'); guardar(); render(); aviso('Respaldo guardado en ' + r.ruta, 'ok'); }
  else aviso('No se pudo respaldar: ' + (r.error || 'carpeta no disponible'), 'error');
}

// ---------- Compartir con otros docentes ----------
const PARTES_PAQUETE = [
  ['planeaciones', '📝 Planeaciones de clase'],
  ['mallas', '🧩 Mallas curriculares'],
  ['planesArea', '📘 Planes de área'],
  ['plantillas', '📋 Plantillas de planeación'],
  ['rubricas', '📋 Instrumentos de evaluación'],
  ['banco', '📚 Entradas propias del banco pedagógico'],
  ['pruebas', '🧪 Pruebas y talleres (sin resultados)'],
  ['fichas', '🧩 Fichas imprimibles'],
];
function dialogoExportarPaquete() {
  const n = {
    planeaciones: S.planeaciones.length, mallas: S.mallas.filter((m) => Object.values(m.periodos).some((p) => p.items.length)).length,
    planesArea: S.planesArea.length, plantillas: S.plantillas.length, rubricas: S.rubricas.filter((r) => !r.predeterminado).length,
    banco: S.bancoPedagogico.filter((x) => !x.predeterminado).length,
    pruebas: (S.pruebas || []).filter((p) => p.preguntas.length).length,
    fichas: (S.fichas || []).length,
  };
  abrirModal(`<h2>📤 Compartir con otros docentes</h2>
    <p class="ayuda">Crea un archivo <b>.planeador</b> que puedes enviar por correo, WhatsApp o USB. Nunca incluye estudiantes, notas, asistencia ni PIAR.</p>
    ${PARTES_PAQUETE.map(([k, t]) => `<label style="font-weight:normal;color:inherit;font-size:14px;display:block;margin:6px 0"><input type="checkbox" class="m-pq" value="${k}" ${n[k] ? 'checked' : 'disabled'}> ${t} <span class="ayuda">(${n[k]})</span></label>`).join('')}
    <div class="campo" style="margin-top:8px"><label>Filtrar planeaciones por área (opcional)</label><select id="m-pq-area">${opcionesAreas('', 'Todas las áreas')}</select></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="exportarPaquete()">Crear archivo</button></div>`);
}
async function exportarPaquete() {
  const partes = [...document.querySelectorAll('.m-pq:checked')].map((x) => x.value);
  const area = document.getElementById('m-pq-area').value;
  if (!partes.length) return aviso('Elige qué compartir', 'error');
  const areasUsadas = new Set();
  const usarArea = (id) => { if (id) areasUsadas.add(id); return id; };
  const d = { formato: 'paquete-planeador', version: 1, autor: S.config.docente || '', institucion: S.config.institucion || '', fecha: hoyISO() };
  if (partes.includes('planeaciones')) d.planeaciones = S.planeaciones.filter((p) => !area || p.areaId === area).map((p) => {
    const g = porId(S.grupos, p.grupoId);
    const c = structuredClone(p);
    usarArea(c.areaId);
    c.gradoOrigen = g ? g.grado : p.gradoOrigen; c.grupoId = ''; c.observaciones = ''; c.plantillaId = ''; c.estado = 'borrador';
    ['estilos', 'gustos', 'caracteristicas'].forEach((k) => { c[k] = ''; });
    return c;
  });
  if (partes.includes('mallas')) d.mallas = S.mallas.filter((m) => (!area || m.areaId === area) && Object.values(m.periodos).some((x) => x.items.length)).map((m) => { usarArea(m.areaId); return { ...structuredClone(m), periodos: Object.fromEntries(Object.entries(m.periodos).map(([pid, v]) => [nombrePeriodo(pid) || pid, v])) }; });
  if (partes.includes('planesArea')) d.planesArea = S.planesArea.filter((p) => !area || p.areaId === area).map((p) => { usarArea(p.areaId); return structuredClone(p); });
  if (partes.includes('plantillas')) d.plantillas = S.plantillas.map((t) => { const c = structuredClone(t); if (c.alcance === 'grupo') { c.alcance = 'grado'; c.grupoId = ''; } usarArea(c.areaId); ['estilos', 'gustos', 'caracteristicas', 'numEstudiantes'].forEach((k) => { c[k] = ''; }); return c; });
  if (partes.includes('rubricas')) d.rubricas = structuredClone(S.rubricas.filter((r) => !r.predeterminado));
  if (partes.includes('banco')) d.banco = structuredClone(S.bancoPedagogico.filter((x) => !x.predeterminado));
  if (partes.includes('fichas')) d.fichas = (S.fichas || []).filter((f) => !area || f.areaId === area).map((f) => { usarArea(f.areaId); const g = porId(S.grupos, f.grupoId); return { ...structuredClone(f), grado: g ? g.grado : f.grado, grupoId: '' }; });
  if (partes.includes('pruebas')) d.pruebas = S.pruebas.filter((p) => p.preguntas.length && (!area || p.areaId === area)).map((p) => {
    usarArea(p.areaId);
    const g = porId(S.grupos, p.grupoId);
    return { ...structuredClone(p), grado: g ? g.grado : p.grado, grupoId: '', periodoId: '', respuestas: {}, abiertas: {}, actividadId: '' };
  });
  d.areas = [...areasUsadas].map((id) => ({ id, nombre: nombreArea(id) }));
  const r = await api.exportarPaquete(`Paquete ${S.config.docente || 'Planeador'} ${hoyISO()}`, d);
  if (r.ok) { cerrarModal(); aviso('Paquete creado. Envíalo al otro docente.', 'ok'); }
}
async function importarPaquete() {
  const r = await api.abrirPaquete();
  if (!r.ok) { if (r.error) aviso(r.error, 'error'); return; }
  const d = r.datos;
  const cuenta = (k) => (d[k] || []).length;
  window._paquete = d;
  abrirModal(`<h2>📥 Importar paquete</h2>
    <p>De: <b>${esc(d.autor || 'docente')}</b>${d.institucion ? ' · ' + esc(d.institucion) : ''} · ${esc(fechaCorta(d.fecha))}</p>
    ${PARTES_PAQUETE.map(([k, t]) => cuenta(k) ? `<label style="font-weight:normal;color:inherit;font-size:14px;display:block;margin:6px 0"><input type="checkbox" class="m-pi" value="${k}" checked> ${t} <span class="ayuda">(${cuenta(k)})</span></label>` : '').join('')}
    <p class="ayuda">Las planeaciones llegan al <b>Banco de planeaciones</b> sin grupo asignado; desde allí las usas con "Usar en otro grupo". Las áreas se emparejan por nombre (si no existe, se crea). Las mallas se agregan a las tuyas sin borrar nada.</p>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="ejecutarImportacion()">Importar</button></div>`);
}
function ejecutarImportacion() {
  const d = window._paquete;
  const partes = [...document.querySelectorAll('.m-pi:checked')].map((x) => x.value);
  const mapaArea = {};
  for (const a of d.areas || []) {
    let local = S.areas.find((x) => normalizar(x.nombre) === normalizar(a.nombre));
    if (!local) { local = { id: uid(), nombre: a.nombre, abreviatura: '' }; S.areas.push(local); }
    mapaArea[a.id] = local.id;
  }
  const area = (id) => mapaArea[id] || id || '';
  const perPorNombre = (n) => (S.config.periodos.find((p) => normalizar(p.nombre) === normalizar(n)) || {}).id;
  let n = 0;
  if (partes.includes('planeaciones')) for (const p of d.planeaciones || []) {
    S.planeaciones.push({ ...p, id: uid(), areaId: area(p.areaId), periodoId: '', enBanco: true, importada: d.autor || true, sesiones: (p.sesiones || []).map((s) => ({ ...s, id: uid() })), mallaItems: [] }); n++;
  }
  if (partes.includes('mallas')) for (const m of d.mallas || []) {
    const dest = obtenerMalla(area(m.areaId), m.grado);
    for (const [nomPer, per] of Object.entries(m.periodos)) {
      const pid = perPorNombre(nomPer) || S.config.periodos[0]?.id;
      if (!pid) continue;
      const pm = periodoMalla(dest, pid);
      if (!pm.pregunta) pm.pregunta = per.pregunta || '';
      per.items.forEach((it) => pm.items.push({ ...it, id: uid() })); n += per.items.length;
    }
  }
  if (partes.includes('planesArea')) for (const p of d.planesArea || []) {
    const dest = obtenerPlanArea(area(p.areaId));
    for (const [k, v] of Object.entries(p)) if (!['id', 'areaId'].includes(k) && v && !dest[k]) dest[k] = v;
    n++;
  }
  if (partes.includes('plantillas')) for (const t of d.plantillas || []) { S.plantillas.push({ ...t, id: uid(), areaId: area(t.areaId), nombre: t.nombre + (d.autor ? ` (de ${d.autor})` : '') }); n++; }
  if (partes.includes('rubricas')) for (const r of d.rubricas || []) { S.rubricas.push({ ...r, id: uid(), nombre: r.nombre + (d.autor ? ` (de ${d.autor})` : '') }); n++; }
  if (partes.includes('banco')) for (const x of d.banco || []) { S.bancoPedagogico.push({ ...x, id: uid() }); n++; }
  if (partes.includes('fichas')) for (const f of d.fichas || []) { (S.fichas ||= []).push({ ...f, id: uid(), areaId: area(f.areaId), titulo: f.titulo + (d.autor ? ` (de ${d.autor})` : '') }); n++; }
  if (partes.includes('pruebas')) for (const p of d.pruebas || []) {
    S.pruebas.push({ ...p, id: uid(), areaId: area(p.areaId), titulo: p.titulo + (d.autor ? ` (de ${d.autor})` : ''), preguntas: (p.preguntas || []).map((q) => ({ ...q, id: uid() })), modificada: new Date().toISOString() }); n++;
  }
  guardar(); cerrarModal(); render();
  aviso(`Se importaron ${n} elemento(s).`, 'ok');
}
function tarjetaCompartir() {
  return `<div class="tarjeta"><h2>🤝 Compartir con otros docentes</h2>
    <p class="ayuda">Intercambia planeaciones, mallas, planes de área, plantillas, instrumentos, estrategias y pruebas con colegas mediante un archivo <b>.planeador</b>. Nunca se comparten datos de estudiantes.</p>
    <div class="fila"><button class="btn primario" onclick="dialogoExportarPaquete()">📤 Crear paquete para compartir</button><button class="btn" onclick="importarPaquete()">📥 Importar paquete recibido</button></div></div>`;
}
