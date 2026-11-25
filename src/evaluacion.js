// ================= Asistencia, calificaciones y rúbricas =================

const ESTADOS_ASIS = { P: 'Presente', A: 'Ausente', T: 'Tarde', E: 'Excusa' };

function selectorGrupoArea(ctx, onCambio, { periodo = false, fecha = false } = {}) {
  const areas = ctx.grupoId && areasDeGrupo(ctx.grupoId).length ? areasDeGrupo(ctx.grupoId) : S.areas;
  return `<div class="filtros tarjeta">
    <div><label>Grupo</label><select onchange="${onCambio}.grupoId=this.value;${onCambio}.areaId='';render()">${opcionesGrupos(ctx.grupoId, 'Selecciona…')}</select></div>
    <div><label>Área</label><select onchange="${onCambio}.areaId=this.value;render()">${opcionesAreas(ctx.areaId, 'Selecciona…', areas)}</select></div>
    ${periodo ? `<div><label>Periodo</label><select onchange="${onCambio}.periodoId=this.value;render()">${opcionesPeriodos(ctx.periodoId, 'Selecciona…')}</select></div>` : ''}
    ${fecha ? `<div><label>Fecha</label><input type="date" value="${esc(ctx.fecha)}" onchange="${onCambio}.fecha=this.value||hoyISO();render()"></div>` : ''}
  </div>`;
}

function contextoPorDefecto(obj) {
  if (!obj.grupoId && S.grupos.length) obj.grupoId = [...S.grupos].sort(ordenGrupos)[0].id;
  if (obj.grupoId && !obj.areaId) { const a = areasDeGrupo(obj.grupoId)[0] || S.areas[0]; obj.areaId = a ? a.id : ''; }
  if ('periodoId' in obj && !obj.periodoId) obj.periodoId = (periodoDeFecha(hoyISO()) || S.config.periodos[0] || {}).id || '';
  return obj;
}

// ---------- Asistencia ----------
RENDERS.asistencia = () => {
  if (!ui.asis) {
    // Por defecto, la clase que está en curso (o la próxima de hoy) según el horario
    const ahora = new Date().toTimeString().slice(0, 5);
    const hoy = clasesDelDia(hoyISO());
    const cl = hoy.find(({ b }) => ahora >= b.inicio && ahora < b.fin) || hoy.find(({ b }) => b.inicio > ahora) || hoy[0];
    ui.asis = { grupoId: cl?.c.grupoId || '', areaId: cl?.c.areaId || '', fecha: hoyISO(), periodoId: '' };
  }
  const c = ui.asis;
  contextoPorDefecto(c);
  if (!S.grupos.length) return `<h1>Asistencia</h1><div class="tarjeta vacio"><div class="grande">✅</div>Primero crea tus grupos y alumnos.</div>`;
  const clave = `${c.grupoId}|${c.areaId}`;
  const registro = (S.asistencia[clave] ||= {});
  const delDia = registro[c.fecha] || {};
  const alumnos = alumnosDe(c.grupoId);
  const per = porId(S.config.periodos, c.periodoId);
  const fechas = Object.keys(registro).filter((f) => !per || (f >= per.inicio && f <= per.fin)).sort();

  const resumen = alumnos.map((a) => {
    const cont = { P: 0, A: 0, T: 0, E: 0 };
    fechas.forEach((f) => { const e = registro[f][a.id]; if (e) cont[e]++; });
    const total = fechas.filter((f) => registro[f][a.id]).length;
    return { a, cont, pct: total ? Math.round(((cont.P + cont.T) / total) * 100) : null };
  });

  return `
  <div class="cabecera"><div><h1>Asistencia</h1><p class="sub">P = presente · A = ausente · T = tarde · E = excusa. Se guarda al tocar cada botón.</p></div>
  <div class="acciones"><button class="btn" onclick="exportarAsistencia()">⬇️ Exportar a Excel</button></div></div>
  ${selectorGrupoArea(c, 'ui.asis', { fecha: true })}
  <div class="rejilla" style="grid-template-columns: 1fr 1fr; align-items:start">
    <div class="tarjeta">
      <div class="cabecera"><h2 style="margin:0">${esc(fechaLarga(c.fecha))}</h2>
        <div class="fila"><button class="btn pequeno" onclick="todosPresentes()">Todos presentes</button>
        ${Object.keys(delDia).length ? `<button class="btn pequeno peligro" onclick="borrarDiaAsistencia()">Borrar día</button>` : ''}</div></div>
      ${alumnos.length ? `<table class="tabla"><tbody>${alumnos.map((a, i) => `<tr>
        <td class="num" style="width:30px">${i + 1}</td><td>${esc(nombreAlumno(a))} ${a.piar ? '<span class="chip piar">PIAR</span>' : ''}</td>
        <td class="asis" style="white-space:nowrap">${Object.keys(ESTADOS_ASIS).map((e) => `<button class="${e} ${delDia[a.id] === e ? 'on' : ''}" title="${ESTADOS_ASIS[e]}" onclick="marcarAsistencia('${a.id}','${e}')">${e}</button>`).join('')}</td></tr>`).join('')}
      </tbody></table>` : '<p class="ayuda">Este grupo no tiene estudiantes.</p>'}
    </div>
    <div class="tarjeta">
      <div class="cabecera"><h2 style="margin:0">Resumen</h2><select style="width:auto" onchange="ui.asis.periodoId=this.value;render()">${opcionesPeriodos(c.periodoId, 'Todo el año')}</select></div>
      <p class="ayuda">${fechas.length} clase(s) registradas${per ? ' en ' + esc(per.nombre) : ''}.</p>
      <table class="tabla"><thead><tr><th>Estudiante</th><th class="num">P</th><th class="num">A</th><th class="num">T</th><th class="num">E</th><th class="num">% asist.</th></tr></thead><tbody>
      ${resumen.map((r) => `<tr><td>${esc(nombreAlumno(r.a))}</td><td class="num">${r.cont.P}</td><td class="num ${r.cont.A >= 3 ? 'bajo' : ''}">${r.cont.A}</td><td class="num">${r.cont.T}</td><td class="num">${r.cont.E}</td><td class="num ${r.pct != null && r.pct < 80 ? 'bajo' : ''}">${r.pct == null ? '—' : r.pct + '%'}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </div>`;
};

function diaAsistencia() {
  const c = ui.asis;
  const clave = `${c.grupoId}|${c.areaId}`;
  S.asistencia[clave] ||= {};
  return (S.asistencia[clave][c.fecha] ||= {});
}
function marcarAsistencia(alumnoId, estado) {
  const d = diaAsistencia();
  if (d[alumnoId] === estado) delete d[alumnoId]; else d[alumnoId] = estado;
  guardar(); render();
}
function todosPresentes() {
  const d = diaAsistencia();
  alumnosDe(ui.asis.grupoId).forEach((a) => { if (!d[a.id]) d[a.id] = 'P'; });
  guardar(); render();
}
async function borrarDiaAsistencia() {
  if (!(await confirmar('¿Borrar la asistencia registrada en esta fecha?'))) return;
  delete S.asistencia[`${ui.asis.grupoId}|${ui.asis.areaId}`][ui.asis.fecha];
  guardar(); render();
}
function exportarAsistencia() {
  const c = ui.asis;
  const registro = S.asistencia[`${c.grupoId}|${c.areaId}`] || {};
  const per = porId(S.config.periodos, c.periodoId);
  const fechas = Object.keys(registro).filter((f) => !per || (f >= per.inicio && f <= per.fin)).sort();
  const filas = [['Estudiante', ...fechas.map(fechaCorta), 'Presente', 'Ausente', 'Tarde', 'Excusa']];
  for (const a of alumnosDe(c.grupoId)) {
    const est = fechas.map((f) => registro[f][a.id] || '');
    filas.push([nombreAlumno(a), ...est, ...['P', 'A', 'T', 'E'].map((e) => est.filter((x) => x === e).length)]);
  }
  exportarExcel(`Asistencia ${nombreGrupoId(c.grupoId)} ${nombreArea(c.areaId)} ${per ? per.nombre : ''}`, filas);
}

// ---------- Cálculos de notas ----------
function buscarPlanilla(grupoId, areaId, periodoId) {
  return S.planillas.find((p) => p.grupoId === grupoId && p.areaId === areaId && p.periodoId === periodoId);
}
function obtenerPlanilla(grupoId, areaId, periodoId) {
  let p = buscarPlanilla(grupoId, areaId, periodoId);
  if (!p) {
    const per = porId(S.config.periodos, periodoId);
    p = { id: uid(), grupoId, areaId, periodoId, criterios: (S.config.componentesPorDefecto || COMPONENTES_POR_DEFECTO).map((c) => ({
      id: uid(), nombre: c.nombre, peso: c.peso,
      actividades: (c.actividades || []).map((a) => ({ id: uid(), nombre: a.nombre, fecha: '', descripcion: '', tecnicaId: '', rubricaId: porId(S.rubricas, a.rubricaId) ? a.rubricaId : '' })),
    })) };
    if (per && !per.inicio) void 0;
    S.planillas.push(p);
    guardar();
  }
  return p;
}
function nota(actId, alumnoId) { const v = S.notas[actId]?.[alumnoId]; return v === '' || v == null ? null : +v; }
function promedioCriterio(crit, alumnoId) {
  const vals = [];
  for (const a of crit.actividades) {
    const n = nota(a.id, alumnoId);
    if (n != null) vals.push(n);
    else if (S.config.faltanteComoMinima) vals.push(+S.config.escalaMin);
  }
  return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
}
// Nota del periodo antes de recuperaciones
function notaDefinitiva(planilla, alumnoId) {
  let suma = 0, pesos = 0;
  for (const c of planilla.criterios) {
    const pr = promedioCriterio(c, alumnoId);
    if (pr != null) { suma += pr * (+c.peso || 0); pesos += +c.peso || 0; }
  }
  return pesos ? suma / pesos : null;
}
// Nota del periodo que vale (con la recuperación aplicada según el SIEE)
function notaFinal(planilla, alumnoId) {
  return aplicarRecuperacion(notaDefinitiva(planilla, alumnoId), recuperacion(planilla.grupoId, planilla.areaId, planilla.periodoId, alumnoId));
}
function notaAnualSinRecuperacion(grupoId, areaId, alumnoId) {
  let suma = 0, pesos = 0;
  for (const per of S.config.periodos) {
    const pl = buscarPlanilla(grupoId, areaId, per.id);
    const f = pl ? notaFinal(pl, alumnoId) : null;
    if (f != null) { suma += redondear(f) * (+per.peso || 0); pesos += +per.peso || 0; }
  }
  return pesos ? suma / pesos : null;
}
function notaAnual(grupoId, areaId, alumnoId) {
  return aplicarRecuperacion(notaAnualSinRecuperacion(grupoId, areaId, alumnoId), recuperacion(grupoId, areaId, 'anual', alumnoId));
}

// ---------- Recuperaciones (según el SIEE de la institución) ----------
// S.recuperaciones = { "grupo|área|periodoId": { alumnoId: { nota, fecha, obs } } }; periodoId = 'anual' para la recuperación final del año
const MODOS_RECUPERACION = {
  reemplaza: 'La nota de recuperación reemplaza la del periodo',
  promedio: 'Se promedia la nota del periodo con la de recuperación',
  ponderada: 'Porcentaje de la nota del periodo + porcentaje de la recuperación',
};
function configRecuperacion() {
  return { modo: 'reemplaza', tope: +S.config.notaAprobacion, peso: 50, ...(S.config.recuperacion || {}) };
}
function claveRecuperacion(grupoId, areaId, periodoId) { return `${grupoId}|${areaId}|${periodoId}`; }
function registroRecuperacion(grupoId, areaId, periodoId, alumnoId) { return S.recuperaciones?.[claveRecuperacion(grupoId, areaId, periodoId)]?.[alumnoId] || null; }
function recuperacion(grupoId, areaId, periodoId, alumnoId) {
  const r = registroRecuperacion(grupoId, areaId, periodoId, alumnoId);
  return r && r.nota !== '' && r.nota != null && !isNaN(+r.nota) ? +r.nota : null;
}
// Combina la definitiva con la recuperación. Nunca baja la nota que el estudiante ya tenía.
function aplicarRecuperacion(def, rec) {
  if (rec == null) return def;
  const r = configRecuperacion();
  let v = rec;
  if (r.modo === 'promedio' && def != null) v = (def + rec) / 2;
  else if (r.modo === 'ponderada' && def != null) { const p = Math.min(100, Math.max(0, +r.peso || 0)) / 100; v = def * (1 - p) + rec * p; }
  if (r.tope !== '' && r.tope != null && !isNaN(+r.tope)) v = Math.min(v, +r.tope);
  return def == null ? v : Math.max(def, v);
}
function necesitaRecuperacion(def) { return def != null && redondear(def) < +S.config.notaAprobacion; }
function ponerRecuperacion(grupoId, areaId, periodoId, alumnoId, input) {
  const txt = input.value.replace(',', '.').trim();
  const k = claveRecuperacion(grupoId, areaId, periodoId);
  const reg = ((S.recuperaciones ||= {})[k] ||= {});
  if (txt === '') delete reg[alumnoId];
  else {
    let v = +txt;
    if (isNaN(v)) { aviso('Nota no válida', 'error'); input.value = reg[alumnoId]?.nota ?? ''; return; }
    if (v < +S.config.escalaMin || v > +S.config.escalaMax) { aviso(`La nota debe estar entre ${S.config.escalaMin} y ${S.config.escalaMax}`, 'error'); v = Math.min(+S.config.escalaMax, Math.max(+S.config.escalaMin, v)); input.value = v; }
    reg[alumnoId] = { ...(reg[alumnoId] || {}), nota: v, fecha: hoyISO() };
  }
  if (!Object.keys(reg).length) delete S.recuperaciones[k];
  guardar();
  if (periodoId === 'anual') render(); else actualizarFilaPlanilla(alumnoId);
}
function celdaRecuperacion(grupoId, areaId, periodoId, alumnoId, def) {
  const rec = recuperacion(grupoId, areaId, periodoId, alumnoId);
  const visible = rec != null || necesitaRecuperacion(def);
  return `<td class="nota" data-rec><input type="number" step="0.1" min="${S.config.escalaMin}" max="${S.config.escalaMax}" value="${rec == null ? '' : rec}" placeholder="—"
    title="Nota de la actividad de recuperación (${esc(MODOS_RECUPERACION[configRecuperacion().modo])})" style="${visible ? '' : 'visibility:hidden'}"
    onchange="ponerRecuperacion('${grupoId}','${areaId}','${periodoId}','${alumnoId}',this)"></td>`;
}
function textoFinal(def, fin) {
  return fmtNota(fin) + (def != null && fin != null && redondear(fin) !== redondear(def) ? ' <sup title="Con recuperación. Antes: ' + fmtNota(def) + '">R</sup>' : '');
}
function tarjetaRecuperaciones() {
  const r = configRecuperacion();
  const cambiar = (k, v) => `(S.config.recuperacion ||= {}).${k}=${v};guardar();render()`;
  return `<h3>Recuperaciones</h3>
    <div class="rejilla r3">
      <div class="campo"><label>Cómo se aplica la recuperación</label><select onchange="${cambiar('modo', 'this.value')}">${Object.entries(MODOS_RECUPERACION).map(([k, t]) => `<option value="${k}" ${r.modo === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
      ${r.modo === 'ponderada' ? `<div class="campo"><label>Peso de la recuperación (%)</label><input type="number" min="0" max="100" value="${esc(r.peso)}" onchange="${cambiar('peso', '+this.value')}"></div>` : ''}
      <div class="campo"><label>Nota máxima después de recuperar <span class="ayuda">(vacío = sin tope)</span></label><input type="number" step="0.1" value="${r.tope === '' || r.tope == null ? '' : esc(r.tope)}" onchange="${cambiar('tope', "this.value===''?'':+this.value")}"></div>
    </div>
    <p class="ayuda">En la planilla de notas aparece la columna <b>Recup.</b> para los estudiantes que no alcanzan ${esc(S.config.notaAprobacion)}, y en el consolidado anual la recuperación final del año. La recuperación nunca baja la nota que el estudiante ya tenía.</p>`;
}
function claseNota(n) { return n != null && redondear(n) < +S.config.notaAprobacion ? 'bajo' : ''; }

// ---------- Calificaciones ----------
RENDERS.calificaciones = () => {
  const c = ui.cal || (ui.cal = { grupoId: '', areaId: '', periodoId: '', pestana: 'programacion' });
  contextoPorDefecto(c);
  const pestanas = `<div class="pestanas">${[['programacion', '📅 Programación evaluativa'], ['planilla', '📊 Planilla de notas'], ['entregas', '📥 Entregas y nota por lote'], ['anual', '📈 Consolidado anual'], ['apoyo', '🆘 Planes de apoyo'], ['riesgo', '🚦 Semáforo de riesgo'], ['observaciones', '📝 Observaciones del boletín'], ['rubricas', '📋 Instrumentos de evaluación'], ['registro', '🕘 Registro de cambios']].map(([k, t]) => `<button class="${c.pestana === k ? 'activo' : ''}" onclick="ui.cal.pestana='${k}';render()">${t}</button>`).join('')}</div>`;
  const cab = `<div class="cabecera"><div><h1>Evaluación y notas</h1><p class="sub">Escala ${S.config.escalaMin} a ${S.config.escalaMax} · Aprobación desde ${S.config.notaAprobacion} · Decreto 1290 de 2009</p></div>
    <div class="acciones">${c.pestana === 'planilla' || c.pestana === 'anual' ? `<button class="btn" onclick="exportarCalificaciones()">⬇️ Exportar a Excel</button>` : ''}
      <button class="btn" onclick="dialogoInformeCierre()" title="Informe del periodo para coordinación">📑 Informe de cierre</button></div></div>`;
  if (c.pestana === 'rubricas') return cab + pestanas + vistaRubricas();
  if (!S.grupos.length || !S.config.periodos.length) return cab + pestanas + '<div class="tarjeta vacio">Configura primero tus grupos y los periodos académicos.</div>';
  if (c.pestana === 'anual') return cab + pestanas + selectorGrupoArea(c, 'ui.cal') + vistaAnual(c);
  if (c.pestana === 'riesgo') return cab + pestanas + selectorGrupoArea(c, 'ui.cal', { periodo: true }) + vistaRiesgo(c);
  if (c.pestana === 'observaciones') return cab + pestanas + selectorGrupoArea(c, 'ui.cal', { periodo: true }) + vistaObservaciones(c);
  if (c.pestana === 'apoyo') return cab + pestanas + selectorGrupoArea(c, 'ui.cal', { periodo: true }) + vistaApoyo(c);
  if (c.pestana === 'entregas') return cab + pestanas + selectorGrupoArea(c, 'ui.cal', { periodo: true }) + vistaEntregas(c);
  if (c.pestana === 'registro') return cab + pestanas + selectorGrupoArea(c, 'ui.cal', { periodo: true }) + vistaRegistroNotas(c);
  if (c.pestana === 'programacion') return cab + pestanas + selectorGrupoArea(c, 'ui.cal', { periodo: true }) + vistaProgramacion(c);
  return cab + pestanas + selectorGrupoArea(c, 'ui.cal', { periodo: true }) + vistaPlanilla(c);
};

function vistaPlanilla(c) {
  if (!c.grupoId || !c.areaId || !c.periodoId) return '<div class="tarjeta vacio">Selecciona grupo, área y periodo.</div>';
  const pl = obtenerPlanilla(c.grupoId, c.areaId, c.periodoId);
  const alumnos = alumnosDe(c.grupoId);
  const sumaPesos = pl.criterios.reduce((s, x) => s + (+x.peso || 0), 0);
  let col = 0;
  return `
  <div class="alerta ${sumaPesos === 100 ? 'info' : ''}" style="display:flex;justify-content:space-between;align-items:center;gap:10px">
    <span>${pl.criterios.map((cr) => `<b>${esc(cr.nombre)}</b> ${esc(cr.peso)}%`).join(' · ')}${sumaPesos !== 100 ? ` — suman <b>${sumaPesos}%</b>, deberían sumar 100%` : ''}</span>
    <span class="fila" style="flex-wrap:nowrap"><button class="btn pequeno" onclick="dialogoRetro()" title="Valorar un trabajo escrito (texto o foto) con tu rúbrica y la IA">✍️ Retroalimentación IA</button>
    <button class="btn pequeno" onclick="exportarRetroalimentaciones()" title="Word con las retroalimentaciones guardadas">⬇️ Retroalimentaciones</button>
    <button class="btn pequeno" onclick="importarNotas()" title="Desde Excel, Google Forms o Classroom">📥 Importar notas</button>
    <button class="btn pequeno" onclick="ui.cal.pestana='programacion';render()">✏️ Editar programación</button></span></div>
  ${alumnos.length ? `<div class="envoltura-tabla"><table class="tabla planilla"><thead>
    <tr><th class="alumno" rowspan="2">Estudiante</th>${pl.criterios.map((cr) => `<th class="criterio" colspan="${cr.actividades.length + 1}" style="text-align:center">${esc(cr.nombre)} (${esc(cr.peso)}%)</th>`).join('')}<th rowspan="2" class="num" title="Actividad de recuperación (SIEE)">Recup.</th><th rowspan="2" class="num">Nota<br>periodo</th><th rowspan="2">Desempeño</th></tr>
    <tr>${pl.criterios.map((cr) => cr.actividades.map((a) => `<th title="${esc(a.descripcion || '')}${a.fecha ? ' · ' + esc(fechaCorta(a.fecha)) : ''}" style="cursor:pointer" onclick="editarActividad('${pl.id}','${cr.id}','${a.id}')">${a.rubricaId ? '📋 ' : ''}${esc(a.nombre.length > 14 ? a.nombre.slice(0, 13) + '…' : a.nombre)}</th>`).join('') + '<th class="num">Prom.</th>').join('')}</tr>
  </thead><tbody>
  ${alumnos.map((al, fila) => {
    col = 0;
    const def = notaDefinitiva(pl, al.id);
    const f = notaFinal(pl, al.id);
    return `<tr data-al="${al.id}"><td class="alumno">${fila + 1}. ${esc(nombreAlumno(al))} ${al.piar ? '<span class="chip piar">PIAR</span>' : ''}</td>
    ${pl.criterios.map((cr) => cr.actividades.map((a) => {
      const n = nota(a.id, al.id);
      const ci = col++;
      return a.rubricaId
        ? `<td class="nota num"><button class="btn pequeno ${claseNota(n)}" data-fila="${fila}" data-col="${ci}" oncontextmenu="event.preventDefault();verHistorialNota('${a.id}','${al.id}')" onclick="calificarConRubrica('${a.id}','${al.id}')">${n == null ? 'Calificar' : fmtNota(n)}</button></td>`
        : `<td class="nota"><input type="number" step="0.1" min="${S.config.escalaMin}" max="${S.config.escalaMax}" class="${claseNota(n)}" value="${n == null ? '' : n}" data-fila="${fila}" data-col="${ci}" title="Clic derecho: historial de esta nota" oncontextmenu="event.preventDefault();verHistorialNota('${a.id}','${al.id}')" onchange="ponerNota('${a.id}','${al.id}',this)" onkeydown="navegarNotas(event,this)"></td>`;
    }).join('') + (() => { const pr = promedioCriterio(cr, al.id); return `<td class="prom ${claseNota(pr)}" data-prom="${cr.id}">${fmtNota(pr)}</td>`; })()).join('')}
    ${celdaRecuperacion(pl.grupoId, pl.areaId, pl.periodoId, al.id, def)}
    <td class="final ${claseNota(f)}" data-final>${textoFinal(def, f)}</td><td data-des>${chipDesempeno(f)}</td></tr>`;
  }).join('')}
  </tbody></table></div>
  <p class="ayuda">Consejo: usa <b>Enter</b> para bajar al siguiente estudiante. Las notas en rojo están por debajo de ${S.config.notaAprobacion}.
  ${S.config.faltanteComoMinima ? 'Las notas faltantes cuentan como la mínima.' : 'Las notas faltantes no se tienen en cuenta en el promedio.'}</p>`
    : '<div class="tarjeta vacio">Este grupo no tiene estudiantes.</div>'}`;
}

function ponerNota(actId, alumnoId, input) {
  const txt = input.value.replace(',', '.').trim();
  S.notas[actId] ||= {};
  if (txt === '') delete S.notas[actId][alumnoId];
  else {
    let v = +txt;
    if (isNaN(v)) { aviso('Nota no válida', 'error'); input.value = ''; delete S.notas[actId][alumnoId]; }
    else {
      if (v < +S.config.escalaMin || v > +S.config.escalaMax) {
        aviso(`La nota debe estar entre ${S.config.escalaMin} y ${S.config.escalaMax}`, 'error');
        v = Math.min(+S.config.escalaMax, Math.max(+S.config.escalaMin, v));
        input.value = v;
      }
      S.notas[actId][alumnoId] = v;
    }
  }
  guardar();
  input.className = claseNota(nota(actId, alumnoId));
  actualizarFilaPlanilla(alumnoId);
}
function actualizarFilaPlanilla(alumnoId) {
  const c = ui.cal;
  const pl = buscarPlanilla(c.grupoId, c.areaId, c.periodoId);
  const tr = document.querySelector(`tr[data-al="${alumnoId}"]`);
  if (!pl || !tr) return;
  for (const cr of pl.criterios) {
    const td = tr.querySelector(`[data-prom="${cr.id}"]`);
    const pr = promedioCriterio(cr, alumnoId);
    if (td) { td.textContent = fmtNota(pr); td.className = 'prom ' + claseNota(pr); }
  }
  const def = notaDefinitiva(pl, alumnoId);
  const f = notaFinal(pl, alumnoId);
  const tf = tr.querySelector('[data-final]');
  tf.innerHTML = textoFinal(def, f); tf.className = 'final ' + claseNota(f);
  const ri = tr.querySelector('[data-rec] input');
  if (ri) ri.style.visibility = ri.value !== '' || necesitaRecuperacion(def) ? '' : 'hidden';
  tr.querySelector('[data-des]').innerHTML = chipDesempeno(f);
}
function navegarNotas(e, input) {
  if (e.key !== 'Enter' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const f = +input.dataset.fila + (e.key === 'ArrowUp' ? -1 : 1);
  const sig = document.querySelector(`[data-fila="${f}"][data-col="${input.dataset.col}"]`);
  if (sig) { sig.focus(); sig.select?.(); } else input.blur();
}

function agregarCriterio(plId) {
  porId(S.planillas, plId).criterios.push({ id: uid(), nombre: 'Nuevo componente', peso: 0, actividades: [] });
  guardar(); render();
}
// Cuántas calificaciones tiene una actividad (notas, instrumentos y retroalimentaciones)
function calificacionesDe(actId) {
  const ids = new Set();
  for (const [id, v] of Object.entries(S.notas[actId] || {})) if (v !== '' && v != null) ids.add(id);
  for (const id of Object.keys(S.notasRubrica[actId] || {})) ids.add(id);
  for (const id of Object.keys((S.retro || {})[actId] || {})) ids.add(id);
  return ids.size;
}
function avisoNoEliminar(titulo, filas) {
  abrirModal(`<h2>🔒 ${esc(titulo)}</h2>
    <p>Para proteger las calificaciones, no se puede eliminar porque ya tiene notas registradas:</p>
    <ul>${filas.map(([a, n]) => `<li><b>${esc(a.nombre)}</b>: ${n} estudiante(s) calificado(s)</li>`).join('')}</ul>
    <p class="ayuda">Si la actividad se creó por error y de verdad quieres eliminarla, primero vacía sus notas con el botón 🧹 (en "Editar actividad") y luego elimínala. Si solo quieres cambiarle el nombre o la fecha, edítala.</p>
    <div class="botones"><button class="btn primario" onclick="cerrarModal()">Entendido</button></div>`);
}
async function vaciarNotasActividad(plId, crId, actId) {
  const a = porId(porId(porId(S.planillas, plId).criterios, crId).actividades, actId);
  const n = calificacionesDe(actId);
  if (!(await confirmar(`Se borrarán las ${n} calificación(es) de "${a.nombre}" (quedan en la papelera 30 días por si necesitas recuperarlas). ¿Vaciar las notas?`, { boton: 'Vaciar notas' }))) return;
  delete S.notas[actId]; delete S.notasRubrica[actId]; if (S.retro) delete S.retro[actId];
  guardar(); render(); aviso('Notas vaciadas. Ahora puedes eliminar la actividad si lo necesitas.');
}
async function eliminarCriterio(plId, crId) {
  const pl = porId(S.planillas, plId);
  const cr = porId(pl.criterios, crId);
  const conNotas = cr.actividades.map((a) => [a, calificacionesDe(a.id)]).filter(([, n]) => n);
  if (conNotas.length) return avisoNoEliminar(`No se puede eliminar el componente "${cr.nombre}"`, conNotas);
  if (!(await confirmar(`¿Eliminar el componente "${cr.nombre}" y sus ${cr.actividades.length} actividad(es) (sin notas)?`))) return;
  cr.actividades.forEach((a) => { delete S.notas[a.id]; delete S.notasRubrica[a.id]; });
  pl.criterios = pl.criterios.filter((x) => x.id !== crId);
  guardar(); render();
}
function editarActividad(plId, crId, actId) {
  const cr = porId(porId(S.planillas, plId).criterios, crId);
  const a = actId ? porId(cr.actividades, actId) : { nombre: '', fecha: hoyISO(), descripcion: '', rubricaId: '' };
  abrirModal(`<h2>${actId ? 'Editar' : 'Nueva'} actividad – ${esc(cr.nombre)}</h2>
    <div class="rejilla r2">
      <div class="campo"><label>Nombre</label><input id="m-nombre" value="${esc(a.nombre)}" placeholder="Ej.: Taller 1, Quiz, Exposición"></div>
      <div class="campo"><label>Fecha</label><input type="date" id="m-fecha" value="${esc(a.fecha || '')}"></div>
    </div>
    <div class="campo"><label>Descripción (opcional)</label><input id="m-desc" value="${esc(a.descripcion || '')}"></div>
    <div class="rejilla r2">
      <div class="campo"><label>Técnica o método</label><select id="m-tec">${opcionesTecnicas(a.tecnicaId)}</select></div>
      <div class="campo"><label>Instrumento de evaluación</label><select id="m-rub">${opcionesInstrumentos(a.rubricaId)}</select>
        <div class="ayuda">Con un instrumento, la nota se calcula al marcar los niveles o indicadores.</div></div>
    </div>
    ${actId && calificacionesDe(actId) ? `<p class="ayuda">🔒 Esta actividad tiene ${calificacionesDe(actId)} estudiante(s) calificado(s): puedes editarla, pero no eliminarla.</p>` : ''}
    <div class="botones">${actId ? (calificacionesDe(actId) ? `<button class="btn" style="margin-right:auto" title="Borra todas las notas de esta actividad" onclick="cerrarModal();vaciarNotasActividad('${plId}','${crId}','${actId}')">🧹 Vaciar notas</button>`
      : `<button class="btn peligro" style="margin-right:auto" onclick="eliminarActividad('${plId}','${crId}','${actId}')">Eliminar</button>`) : ''}
      <button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarActividad('${plId}','${crId}','${actId || ''}')">Guardar</button></div>`);
}
function guardarActividad(plId, crId, actId) {
  const cr = porId(porId(S.planillas, plId).criterios, crId);
  const datos = { nombre: document.getElementById('m-nombre').value.trim() || 'Actividad', fecha: document.getElementById('m-fecha').value, descripcion: document.getElementById('m-desc').value.trim(), rubricaId: document.getElementById('m-rub').value, tecnicaId: document.getElementById('m-tec').value };
  if (actId) Object.assign(porId(cr.actividades, actId), datos);
  else cr.actividades.push({ id: uid(), ...datos });
  guardar(); cerrarModal(); render();
}
async function eliminarActividad(plId, crId, actId) {
  const cr = porId(porId(S.planillas, plId).criterios, crId);
  const a = porId(cr.actividades, actId);
  const n = calificacionesDe(actId);
  if (n) return avisoNoEliminar(`No se puede eliminar "${a.nombre}"`, [[a, n]]);
  if (!(await confirmar(`¿Eliminar la actividad "${a.nombre}"? (no tiene notas)`))) return;
  cr.actividades = cr.actividades.filter((a) => a.id !== actId);
  delete S.notas[actId]; delete S.notasRubrica[actId];
  guardar(); render();
}
function copiarEstructura(plId) {
  const otras = S.planillas.filter((p) => p.id !== plId && p.criterios.length);
  if (!otras.length) return aviso('No hay otras planillas para copiar', 'error');
  abrirModal(`<h2>Copiar estructura</h2><p class="ayuda">Se copiarán los criterios, porcentajes y actividades (sin notas). Reemplaza la estructura actual.</p>
    <div class="campo"><label>Planilla de origen</label><select id="m-origen">${opciones(otras, '', { texto: (p) => `${nombreGrupoId(p.grupoId)} · ${nombreArea(p.areaId)} · ${nombrePeriodo(p.periodoId)}` })}</select></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="ejecutarCopiaEstructura('${plId}')">Copiar</button></div>`);
}
async function ejecutarCopiaEstructura(plId) {
  const origen = porId(S.planillas, document.getElementById('m-origen').value);
  const pl = porId(S.planillas, plId);
  const conNotas = pl.criterios.flatMap((c) => c.actividades).map((a) => [a, calificacionesDe(a.id)]).filter(([, n]) => n);
  cerrarModal();
  if (conNotas.length) return avisoNoEliminar('No se puede reemplazar la estructura de esta planilla', conNotas);
  pl.criterios.forEach((c) => c.actividades.forEach((a) => { delete S.notas[a.id]; delete S.notasRubrica[a.id]; }));
  pl.criterios = origen.criterios.map((c) => ({ ...c, id: uid(), actividades: c.actividades.map((a) => ({ ...a, id: uid() })) }));
  guardar(); render();
}

function vistaAnual(c) {
  if (!c.grupoId || !c.areaId) return '<div class="tarjeta vacio">Selecciona grupo y área.</div>';
  const alumnos = alumnosDe(c.grupoId);
  const pers = S.config.periodos;
  return `<div class="envoltura-tabla"><table class="tabla planilla"><thead><tr><th class="alumno">Estudiante</th>
    ${pers.map((p) => `<th class="num">${esc(p.nombre)}<br><span style="font-weight:normal">${esc(p.peso)}%</span></th>`).join('')}<th class="num" title="Recuperación final del año (SIEE)">Recup.<br>final</th><th class="num">Acumulado</th><th>Desempeño</th></tr></thead><tbody>
    ${alumnos.map((a, i) => {
      const base = notaAnualSinRecuperacion(c.grupoId, c.areaId, a.id);
      const anual = notaAnual(c.grupoId, c.areaId, a.id);
      return `<tr><td class="alumno">${i + 1}. ${esc(nombreAlumno(a))}</td>
      ${pers.map((p) => { const pl = buscarPlanilla(c.grupoId, c.areaId, p.id); const f = pl ? notaFinal(pl, a.id) : null; return `<td class="prom ${claseNota(f)}">${fmtNota(f)}</td>`; }).join('')}
      ${celdaRecuperacion(c.grupoId, c.areaId, 'anual', a.id, base)}
      <td class="final ${claseNota(anual)}">${textoFinal(base, anual)}</td><td>${chipDesempeno(anual)}</td></tr>`;
    }).join('')}
  </tbody></table></div>
  <p class="ayuda">El acumulado pondera cada periodo con su porcentaje (Configuración). Solo se tienen en cuenta los periodos con notas. La recuperación final se aplica según el SIEE (Configuración → Escala de valoración).</p>`;
}

function exportarCalificaciones() {
  const c = ui.cal;
  const alumnos = alumnosDe(c.grupoId);
  let filas, nombre;
  if (c.pestana === 'anual') {
    filas = [['Estudiante', ...S.config.periodos.map((p) => p.nombre), 'Recuperación final', 'Acumulado', 'Desempeño']];
    for (const a of alumnos) {
      const anual = notaAnual(c.grupoId, c.areaId, a.id);
      const rec = recuperacion(c.grupoId, c.areaId, 'anual', a.id);
      filas.push([nombreAlumno(a), ...S.config.periodos.map((p) => { const pl = buscarPlanilla(c.grupoId, c.areaId, p.id); const f = pl ? notaFinal(pl, a.id) : null; return f == null ? '' : fmtNota(f); }), rec == null ? '' : fmtNota(rec), anual == null ? '' : fmtNota(anual), desempeno(anual) || '']);
    }
    nombre = `Consolidado ${nombreGrupoId(c.grupoId)} ${nombreArea(c.areaId)}`;
  } else {
    const pl = obtenerPlanilla(c.grupoId, c.areaId, c.periodoId);
    filas = [['Estudiante', ...pl.criterios.flatMap((cr) => [...cr.actividades.map((a) => `${cr.nombre}: ${a.nombre}`), `PROMEDIO ${cr.nombre} (${cr.peso}%)`]), 'Definitiva', 'Recuperación', 'Nota periodo', 'Desempeño']];
    for (const al of alumnos) {
      const f = notaFinal(pl, al.id);
      const def = notaDefinitiva(pl, al.id);
      const rec = recuperacion(pl.grupoId, pl.areaId, pl.periodoId, al.id);
      filas.push([nombreAlumno(al), ...pl.criterios.flatMap((cr) => [...cr.actividades.map((a) => { const n = nota(a.id, al.id); return n == null ? '' : fmtNota(n); }), (() => { const p = promedioCriterio(cr, al.id); return p == null ? '' : fmtNota(p); })()]), def == null ? '' : fmtNota(def), rec == null ? '' : fmtNota(rec), f == null ? '' : fmtNota(f), desempeno(f) || '']);
    }
    nombre = `Planilla ${nombreGrupoId(c.grupoId)} ${nombreArea(c.areaId)} ${nombrePeriodo(c.periodoId)}`;
  }
  exportarExcel(nombre, filas);
}

