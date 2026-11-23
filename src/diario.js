// ================= Diario de campo =================

const CLIMA_DIARIO = { bien: '😀 Bien', regular: '😐 Regular', dificil: '😟 Difícil' };

function entradaDiario(grupoId, areaId, fecha) {
  return S.diario.find((d) => d.grupoId === grupoId && d.areaId === areaId && d.fecha === fecha);
}
// Último pendiente sin retomar de un grupo y área, anterior a una fecha
function pendienteAnterior(grupoId, areaId, fecha) {
  return S.diario.filter((d) => d.grupoId === grupoId && d.areaId === areaId && d.fecha < fecha && (d.pendiente || '').trim() && !d.retomado)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0] || null;
}

function abrirDiario(grupoId, areaId, fecha = hoyISO(), id = '') {
  const d = id ? porId(S.diario, id) : entradaDiario(grupoId, areaId, fecha);
  const e = d || { id: '', grupoId, areaId, fecha, clima: '', logrado: '', pendiente: '', novedades: '' };
  const plan = planDeClase(e.grupoId, e.areaId, e.fecha);
  const ses = plan?.sesiones.find((s) => s.fecha === e.fecha);
  const pend = pendienteAnterior(e.grupoId, e.areaId, e.fecha);
  window._diarioClima = e.clima;
  abrirModal(`<h2>📓 Diario de campo</h2>
    <div class="rejilla r2">
      <div class="campo"><label>Grupo</label><select id="dc-grupo">${opcionesGrupos(e.grupoId, 'Selecciona…')}</select></div>
      <div class="campo"><label>Área</label><select id="dc-area">${opcionesAreas(e.areaId, 'Selecciona…')}</select></div>
      <div class="campo"><label>Fecha</label><input type="date" id="dc-fecha" value="${esc(e.fecha)}"></div>
      <div class="campo"><label>¿Cómo te fue?</label><div class="fila" id="dc-clima">${Object.entries(CLIMA_DIARIO).map(([k, t]) => `<button type="button" class="btn ${e.clima === k ? 'primario' : ''}" data-clima="${k}" onclick="elegirClimaDiario('${k}')">${t}</button>`).join('')}</div></div>
    </div>
    ${plan ? `<p class="ayuda">Planeación: <b>${esc(plan.titulo || 'Sin título')}</b>${ses?.titulo ? ' · ' + esc(ses.titulo) : ''}</p>` : ''}
    ${pend && !d ? `<div class="alerta info">Pendiente de la clase del ${esc(fechaCorta(pend.fecha))}: ${esc(pend.pendiente)}</div>` : ''}
    <div class="campo"><label>¿Qué se alcanzó?</label><textarea id="dc-logrado" rows="2" placeholder="Temas y actividades desarrolladas, logros del grupo…">${esc(e.logrado)}</textarea></div>
    <div class="campo"><label>¿Qué quedó pendiente? <span class="ayuda">(aparecerá al planear la siguiente clase)</span></label><textarea id="dc-pendiente" rows="2" placeholder="Lo que no alcanzó a desarrollarse o hay que reforzar…">${esc(e.pendiente)}</textarea></div>
    <div class="campo"><label>Novedades <span class="ayuda">(estudiantes, convivencia, imprevistos)</span></label><textarea id="dc-novedades" rows="2" placeholder="Ej.: Simulacro de evacuación; Juan llegó tarde; buen trabajo en equipo…">${esc(e.novedades)}</textarea></div>
    <div class="botones">${d ? `<button class="btn peligro" onclick="eliminarDiario('${d.id}')">Eliminar</button>` : ''}<button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarDiario('${d ? d.id : ''}')">Guardar</button></div>`);
}
function elegirClimaDiario(k) {
  window._diarioClima = window._diarioClima === k ? '' : k;
  document.querySelectorAll('#dc-clima button').forEach((b) => b.classList.toggle('primario', b.dataset.clima === window._diarioClima));
}
function guardarDiario(id) {
  const v = (k) => document.getElementById('dc-' + k).value;
  const datos = { grupoId: v('grupo'), areaId: v('area'), fecha: v('fecha') || hoyISO(), clima: window._diarioClima || '', logrado: v('logrado').trim(), pendiente: v('pendiente').trim(), novedades: v('novedades').trim() };
  if (!datos.grupoId) return aviso('Elige el grupo', 'error');
  if (!datos.logrado && !datos.pendiente && !datos.novedades && !datos.clima) return aviso('Escribe al menos una nota', 'error');
  let d = id ? porId(S.diario, id) : entradaDiario(datos.grupoId, datos.areaId, datos.fecha);
  if (!d) { d = { id: uid(), creado: new Date().toISOString() }; S.diario.push(d); }
  Object.assign(d, datos);
  const plan = planDeClase(d.grupoId, d.areaId, d.fecha);
  if (plan) d.planeacionId = plan.id;
  // si se registró la clase, el pendiente anterior se da por retomado
  const ant = pendienteAnterior(d.grupoId, d.areaId, d.fecha);
  if (ant && ant.id !== d.id && datos.logrado) ant.retomado = d.fecha;
  guardar(); cerrarModal(); render();
  aviso('Guardado en el diario de campo', 'ok');
}
async function eliminarDiario(id) {
  if (!(await confirmar('¿Eliminar esta entrada del diario?'))) return;
  S.diario = S.diario.filter((d) => d.id !== id); guardar(); render();
}
function retomarPendiente(id, planId) {
  const d = porId(S.diario, id);
  const p = planId && porId(S.planeaciones, planId);
  if (p) {
    const s = p.sesiones[0];
    if (s) s.exploracion = `Retomar lo pendiente de la clase anterior: ${d.pendiente}${s.exploracion ? '\n' + s.exploracion : ''}`;
    tocarPlan(p);
  }
  d.retomado = hoyISO(); guardar(); render();
  aviso(p ? 'Se agregó a la exploración de la primera sesión' : 'Marcado como retomado', 'ok');
}
// Aviso dentro del editor de planeación
function avisoPendienteEnPlan(p) {
  if (!p.grupoId || !p.areaId) return '';
  const pend = pendienteAnterior(p.grupoId, p.areaId, p.fechaInicio || hoyISO());
  if (!pend) return '';
  return `<div class="alerta info" style="display:flex;justify-content:space-between;align-items:center;gap:10px">
    <span>📓 <b>Pendiente de la clase del ${esc(fechaCorta(pend.fecha))}:</b> ${esc(pend.pendiente)}</span>
    <span class="fila" style="flex-wrap:nowrap"><button class="btn pequeno" onclick="retomarPendiente('${pend.id}','${p.id}')">Agregar a la exploración</button><button class="btn pequeno" onclick="retomarPendiente('${pend.id}','')">Ya lo retomé</button></span></div>`;
}

// ---------- Vista ----------
RENDERS.diario = () => {
  const f = ui.diario || (ui.diario = { grupoId: '', areaId: '', periodoId: '' });
  const per = porId(S.config.periodos, f.periodoId);
  const lista = S.diario.filter((d) => (!f.grupoId || d.grupoId === f.grupoId) && (!f.areaId || d.areaId === f.areaId) && (!per || (d.fecha >= per.inicio && d.fecha <= per.fin)))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  return `
  <div class="cabecera"><div><h1>Diario de campo</h1><p class="sub">Registra en segundos cómo fue cada clase. Lo pendiente aparece al planear la siguiente y el diario sirve como evidencia para la evaluación de desempeño.</p></div>
    <div class="acciones"><button class="btn" onclick="exportarDiario('excel')">⬇️ Excel</button><button class="btn" onclick="exportarDiario('word')">⬇️ Word</button>
      <button class="btn primario" onclick="abrirDiario(ui.diario.grupoId,ui.diario.areaId)">＋ Nueva entrada</button></div></div>
  <div class="filtros tarjeta">
    <div><label>Grupo</label><select onchange="ui.diario.grupoId=this.value;render()">${opcionesGrupos(f.grupoId, 'Todos')}</select></div>
    <div><label>Área</label><select onchange="ui.diario.areaId=this.value;render()">${opcionesAreas(f.areaId, 'Todas')}</select></div>
    <div><label>Periodo</label><select onchange="ui.diario.periodoId=this.value;render()">${opcionesPeriodos(f.periodoId, 'Todo el año')}</select></div>
  </div>
  ${lista.length ? lista.map((d) => { const p = d.planeacionId && porId(S.planeaciones, d.planeacionId); return `<div class="tarjeta diario-entrada">
    <div class="cabecera" style="margin-bottom:6px"><div><b>${esc(fechaLarga(d.fecha))}</b> · ${esc(nombreGrupoId(d.grupoId))} · ${esc(nombreArea(d.areaId))} ${d.clima ? `<span class="chip">${CLIMA_DIARIO[d.clima]}</span>` : ''}
      ${p ? `<br><a href="#" class="ayuda" onclick="editarPlaneacion('${p.id}');return false">📝 ${esc(p.titulo || 'Planeación')}</a>` : ''}</div>
      <button class="btn pequeno" onclick="abrirDiario('','','','${d.id}')">Editar</button></div>
    ${d.logrado ? `<p style="margin:4px 0"><b>Se alcanzó:</b> ${esc(d.logrado)}</p>` : ''}
    ${d.pendiente ? `<p style="margin:4px 0"><b>Pendiente:</b> ${esc(d.pendiente)} ${d.retomado ? `<span class="chip terminada">Retomado ${esc(fechaCorta(d.retomado))}</span>` : '<span class="chip borrador">Por retomar</span>'}</p>` : ''}
    ${d.novedades ? `<p style="margin:4px 0"><b>Novedades:</b> ${esc(d.novedades)}</p>` : ''}</div>`; }).join('')
    : '<div class="tarjeta vacio"><div class="grande">📓</div>Aún no hay entradas. Usa el botón <b>📓 Diario</b> en "Mis clases de hoy" (Inicio) al terminar cada clase.</div>'}`;
};
function exportarDiario(formato) {
  const f = ui.diario; const per = porId(S.config.periodos, f.periodoId);
  const lista = S.diario.filter((d) => (!f.grupoId || d.grupoId === f.grupoId) && (!f.areaId || d.areaId === f.areaId) && (!per || (d.fecha >= per.inicio && d.fecha <= per.fin)))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (!lista.length) return aviso('No hay entradas para exportar');
  const filas = lista.map((d) => { const p = d.planeacionId && porId(S.planeaciones, d.planeacionId); return [fechaCorta(d.fecha), nombreGrupoId(d.grupoId), nombreArea(d.areaId), p?.titulo || '', d.logrado || '', d.pendiente || '', d.novedades || '', d.clima ? CLIMA_DIARIO[d.clima].slice(3) : '']; });
  const nombre = `Diario de campo ${f.grupoId ? nombreGrupoId(f.grupoId) : ''} ${f.areaId ? nombreArea(f.areaId) : ''} ${per ? per.nombre : ''}`.replace(/\s+/g, ' ').trim();
  if (formato === 'excel') return exportarExcel(nombre, [['Fecha', 'Grupo', 'Área', 'Planeación', 'Se alcanzó', 'Pendiente', 'Novedades', 'Clima'], ...filas]);
  api.exportarWordCurricular('tabla', nombre, {
    config: S.config, titulo: 'Diario de campo', subtitulo: [f.grupoId ? nombreGrupoId(f.grupoId) : 'Todos los grupos', f.areaId ? nombreArea(f.areaId) : '', per ? per.nombre : `Año ${S.config.anio}`].filter(Boolean).join(' · '),
    ident: [['Docente', S.config.docente || ''], ['Entradas', String(lista.length)]],
    columnas: [{ t: 'Fecha', ancho: 9 }, { t: 'Grupo', ancho: 8 }, { t: 'Área', ancho: 10 }, { t: 'Planeación', ancho: 13 }, { t: 'Se alcanzó', ancho: 22 }, { t: 'Pendiente', ancho: 17 }, { t: 'Novedades', ancho: 21 }],
    filas: filas.map((x) => x.slice(0, 7)), horizontal: true, firmas: [[S.config.docente, 'Docente']],
  }).then((r) => { if (r.ok) aviso('Documento de Word creado', 'ok'); else if (r.error) aviso(r.error, 'error'); });
}
