// ================= Planes de apoyo / mejoramiento (Decreto 1290, art. 11) =================

const ESTADOS_APOYO = {
  pendiente: 'Pendiente de entrega',
  entregado: 'Entregado / en revisión',
  superado: 'Superado',
  no_superado: 'No superado',
};

function notaPeriodoAlumno(grupoId, areaId, periodoId, alumnoId) {
  const pl = buscarPlanilla(grupoId, areaId, periodoId);
  return pl ? notaFinal(pl, alumnoId) : null;
}
function enBajo(n) { return n != null && redondear(n) < +S.config.notaAprobacion; }
function planApoyoDe(alumnoId, areaId, periodoId) {
  return S.planesApoyo.find((x) => x.alumnoId === alumnoId && x.areaId === areaId && x.periodoId === periodoId);
}

// Componentes y actividades en los que el estudiante quedó por debajo de la aprobación
function dificultadesDe(grupoId, areaId, periodoId, alumnoId) {
  const pl = buscarPlanilla(grupoId, areaId, periodoId);
  if (!pl) return [];
  const r = [];
  for (const cr of pl.criterios) {
    const pr = promedioCriterio(cr, alumnoId);
    const bajas = cr.actividades.filter((a) => { const n = nota(a.id, alumnoId); return n == null ? !!(a.fecha && a.fecha <= hoyISO()) : enBajo(n); });
    if ((pr != null && enBajo(pr)) || bajas.length) r.push(`${cr.nombre}: ${fmtNota(pr)}${bajas.length ? ' (' + bajas.map((a) => `${a.nombre} ${nota(a.id, alumnoId) == null ? 'sin entregar' : fmtNota(nota(a.id, alumnoId))}`).join(', ') + ')' : ''}`);
  }
  return r;
}
// Desempeños del periodo tomados de la malla (y si no hay, de las planeaciones del periodo)
function desempenosDelPeriodo(grupoId, areaId, periodoId) {
  const g = porId(S.grupos, grupoId);
  const items = g ? itemsMalla(areaId, g.grado, periodoId) : [];
  let lineas = items.flatMap((it) => [it.desempenoSaber, it.desempenoHacer].filter(Boolean).map((d) => `• ${it.eje ? it.eje + ': ' : ''}${d}`));
  if (!lineas.length) {
    lineas = S.planeaciones.filter((p) => p.grupoId === grupoId && p.areaId === areaId && p.periodoId === periodoId)
      .flatMap((p) => [p.desempenoSaber, p.desempenoHacer].filter(Boolean).map((d) => `• ${d}`));
  }
  return [...new Set(lineas)].join('\n');
}

function nuevoPlanApoyo(grupoId, areaId, periodoId, alumnoId) {
  const per = porId(S.config.periodos, periodoId);
  const entrega = per?.fin && per.fin > hoyISO() ? per.fin : sumarDias(hoyISO(), 15);
  return {
    id: uid(), alumnoId, grupoId, areaId, periodoId, creado: hoyISO(),
    notaInicial: notaPeriodoAlumno(grupoId, areaId, periodoId, alumnoId),
    dificultades: dificultadesDe(grupoId, areaId, periodoId, alumnoId).join('\n'),
    desempenos: desempenosDelPeriodo(grupoId, areaId, periodoId),
    actividades: '', criterios: `• Entrega completa y puntual de las actividades.\n• Sustentación oral o escrita de lo trabajado.\n• Nota máxima del plan: según el SIEE de la institución.`,
    recursos: '', fechaEntrega: entrega, fechaSustentacion: '', compromisoEstudiante: 'Desarrollar las actividades propuestas, solicitar asesoría cuando lo necesite y presentarse a la sustentación en la fecha acordada.',
    compromisoAcudiente: 'Acompañar y verificar el desarrollo de las actividades en casa y garantizar la entrega en la fecha acordada.',
    estado: 'pendiente', notaFinal: '', observaciones: '',
  };
}

// ---------- Vista (pestaña en Evaluación y notas) ----------
function vistaApoyo(c) {
  if (!c.grupoId || !c.areaId || !c.periodoId) return '<div class="tarjeta vacio">Selecciona grupo, área y periodo.</div>';
  const alumnos = alumnosDe(c.grupoId);
  const filas = alumnos.map((a) => ({ a, n: notaPeriodoAlumno(c.grupoId, c.areaId, c.periodoId, a.id), plan: planApoyoDe(a.id, c.areaId, c.periodoId) }));
  const enRiesgo = filas.filter((f) => enBajo(f.n) || f.plan);
  const sinPlan = filas.filter((f) => enBajo(f.n) && !f.plan);
  const conPlan = filas.filter((f) => f.plan);
  return `
  <div class="fila" style="justify-content:space-between;margin-bottom:12px">
    <span class="ayuda">Estudiantes con nota del periodo inferior a ${S.config.notaAprobacion} en ${esc(nombreArea(c.areaId))}. Los planes de apoyo se toman de la planilla de notas y de la malla curricular.</span>
    <div class="fila">
      ${sinPlan.length ? `<button class="btn primario" onclick="crearPlanesApoyo()">＋ Crear planes para los ${sinPlan.length} estudiantes en Bajo</button>` : ''}
      ${conPlan.length ? `<button class="btn" onclick="exportarPlanesApoyo()">📄 Exportar todos a Word (${conPlan.length})</button>` : ''}
    </div></div>
  ${enRiesgo.length ? `<table class="tabla"><thead><tr><th>Estudiante</th><th class="num">Nota periodo</th><th>Plan de apoyo</th><th>Entrega</th><th>Estado</th><th class="num">Nota del plan</th><th></th></tr></thead><tbody>
    ${enRiesgo.map((f) => `<tr>
      <td>${esc(nombreAlumno(f.a))} ${f.a.piar ? '<span class="chip piar">PIAR</span>' : ''}</td>
      <td class="num ${claseNota(f.n)}"><b>${fmtNota(f.n)}</b></td>
      <td>${f.plan ? '✔ Creado' : '<span class="ayuda">Sin plan</span>'}</td>
      <td>${f.plan?.fechaEntrega ? esc(fechaCorta(f.plan.fechaEntrega)) : '—'}</td>
      <td>${f.plan ? `<select style="width:auto" onchange="cambiarApoyo('${f.plan.id}','estado',this.value);render()">${Object.entries(ESTADOS_APOYO).map(([k, v]) => `<option value="${k}" ${f.plan.estado === k ? 'selected' : ''}>${v}</option>`).join('')}</select>` : ''}</td>
      <td class="num">${f.plan ? `<input type="number" step="0.1" style="width:70px" value="${esc(f.plan.notaFinal)}" onchange="cambiarApoyo('${f.plan.id}','notaFinal',this.value)">` : ''}</td>
      <td style="white-space:nowrap">${f.plan
        ? `<button class="btn pequeno" onclick="editarPlanApoyo('${f.plan.id}')">✏️ Editar</button> <button class="btn pequeno" onclick="exportarPlanesApoyo(['${f.plan.id}'])">📄 Word</button> <button class="icono" title="Eliminar" onclick="eliminarPlanApoyo('${f.plan.id}')">🗑️</button>`
        : `<button class="btn pequeno primario" onclick="crearPlanApoyo('${f.a.id}')">＋ Crear plan</button>`}</td></tr>`).join('')}
  </tbody></table>
  <p class="ayuda">Al registrar la nota del plan, el resultado aparece en el seguimiento del estudiante. La nota del periodo en la planilla no se modifica automáticamente: aplícala según lo que establezca el SIEE.</p>`
    : `<div class="tarjeta vacio"><div class="grande">🎉</div>Ningún estudiante está en desempeño Bajo en esta área y periodo.</div>`}`;
}

function crearPlanApoyo(alumnoId) {
  const c = ui.cal;
  const p = nuevoPlanApoyo(c.grupoId, c.areaId, c.periodoId, alumnoId);
  S.planesApoyo.push(p);
  guardar();
  editarPlanApoyo(p.id);
}
function crearPlanesApoyo() {
  const c = ui.cal;
  let n = 0;
  for (const a of alumnosDe(c.grupoId)) {
    if (enBajo(notaPeriodoAlumno(c.grupoId, c.areaId, c.periodoId, a.id)) && !planApoyoDe(a.id, c.areaId, c.periodoId)) {
      S.planesApoyo.push(nuevoPlanApoyo(c.grupoId, c.areaId, c.periodoId, a.id)); n++;
    }
  }
  guardar(); render();
  aviso(`Se crearon ${n} plan(es) de apoyo. Completa las actividades (o usa la IA) en cada uno.`, 'ok');
}
function cambiarApoyo(id, k, v) { porId(S.planesApoyo, id)[k] = v; guardar(); }
async function eliminarPlanApoyo(id) {
  if (!(await confirmar('¿Eliminar este plan de apoyo?'))) return;
  S.planesApoyo = S.planesApoyo.filter((x) => x.id !== id);
  guardar(); render();
}

const CAMPOS_APOYO = [
  { k: 'dificultades', t: 'Dificultades evidenciadas (de la planilla de notas)' },
  { k: 'desempenos', t: 'Desempeños por alcanzar', ref: true },
  { k: 'actividades', t: 'Actividades de apoyo', ph: '1. Taller de…\n2. Consulta sobre…\n3. Sustentación…', banco: true },
  { k: 'recursos', t: 'Recursos y materiales' },
  { k: 'criterios', t: 'Criterios de evaluación', banco: true },
  { k: 'compromisoEstudiante', t: 'Compromiso del estudiante' },
  { k: 'compromisoAcudiente', t: 'Compromiso del padre de familia o acudiente' },
  { k: 'observaciones', t: 'Observaciones y resultado' },
];
function editarPlanApoyo(id) {
  const p = porId(S.planesApoyo, id);
  const al = porId(S.alumnos, p.alumnoId);
  const g = porId(S.grupos, p.grupoId);
  abrirModal(`<h2>Plan de apoyo – ${esc(nombreAlumno(al))}</h2>
    <p class="ayuda">${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))} · ${esc(nombrePeriodo(p.periodoId))} · Nota del periodo: <b class="${claseNota(p.notaInicial)}">${fmtNota(p.notaInicial)}</b>${al?.piar ? ' · <span class="chip piar">PIAR</span>' : ''}</p>
    <div class="fila" style="justify-content:flex-end;margin-bottom:8px"><button class="btn ia pequeno" id="ap-ia" onclick="iaPlanApoyo('${id}')">✨ Sugerir actividades con IA</button></div>
    <div class="rejilla r3">
      <div class="campo"><label>Fecha de entrega</label><input type="date" value="${esc(p.fechaEntrega)}" onchange="cambiarApoyo('${id}','fechaEntrega',this.value)"></div>
      <div class="campo"><label>Fecha de sustentación</label><input type="date" value="${esc(p.fechaSustentacion)}" onchange="cambiarApoyo('${id}','fechaSustentacion',this.value)"></div>
      <div class="campo"><label>Estado</label><select onchange="cambiarApoyo('${id}','estado',this.value)">${Object.entries(ESTADOS_APOYO).map(([k, v]) => `<option value="${k}" ${p.estado === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    </div>
    <div class="rejilla r2">${CAMPOS_APOYO.map((f) => `<div class="campo"><label>${f.t}${f.banco ? botonBanco('ap-' + f.k) : ''}${f.ref && g ? botonReferentes('ap-' + f.k, p.areaId, g.grado, 'dba') : ''}</label>
      <textarea id="ap-${f.k}" style="min-height:90px" placeholder="${esc(f.ph || '')}" oninput="cambiarApoyo('${id}','${f.k}',this.value)">${esc(p[f.k] || '')}</textarea></div>`).join('')}</div>
    <div id="ap-error"></div>
    <div class="botones"><button class="btn" onclick="exportarPlanesApoyo(['${id}'])">📄 Exportar a Word</button><button class="btn primario" onclick="cerrarModal();render()">Listo</button></div>`, { ancho: true });
}

async function iaPlanApoyo(id) {
  if (sinIA()) return;
  const p = porId(S.planesApoyo, id);
  const al = porId(S.alumnos, p.alumnoId);
  const g = porId(S.grupos, p.grupoId);
  const contexto = [`Área: ${nombreArea(p.areaId)}`, `Grado: ${g ? g.grado + '° (' + nivelDeGrado(g.grado) + ')' : ''}`, `Periodo: ${nombrePeriodo(p.periodoId)}`,
    `Nota del periodo: ${fmtNota(p.notaInicial)} (aprobación desde ${S.config.notaAprobacion})`,
    p.dificultades ? `Dificultades evidenciadas:\n${p.dificultades}` : '', p.desempenos ? `Desempeños por alcanzar:\n${p.desempenos}` : '',
    al?.piar ? `El estudiante tiene PIAR${al.observaciones ? ': ' + al.observaciones : ''}. Incluye ajustes razonables.` : ''].filter(Boolean).join('\n');
  const btn = document.getElementById('ap-ia');
  btn.disabled = true; btn.innerHTML = '<span class="cargando"></span> Generando…';
  const r = await api.sugerirIA({ ia: S.config.ia, contexto, tarea: 'apoyo' });
  if (!document.getElementById('ap-ia')) return;
  btn.disabled = false; btn.textContent = '✨ Sugerir actividades con IA';
  if (!r.ok) { document.getElementById('ap-error').innerHTML = `<div class="alerta error">${esc(r.error)}</div>`; return; }
  for (const k of ['actividades', 'recursos', 'criterios']) {
    if (typeof r.datos[k] === 'string' && r.datos[k].trim()) {
      p[k] = r.datos[k].trim();
      const ta = document.getElementById('ap-' + k); if (ta) ta.value = p[k];
    }
  }
  guardar();
  aviso('Actividades sugeridas. Revísalas y ajústalas.', 'ok');
}

async function exportarPlanesApoyo(ids) {
  const c = ui.cal;
  const lista = ids ? ids.map((i) => porId(S.planesApoyo, i)) : S.planesApoyo.filter((x) => x.grupoId === c.grupoId && x.areaId === c.areaId && x.periodoId === c.periodoId);
  if (!lista.length) return;
  const planes = lista.map((p) => ({
    ...p, estudiante: nombreAlumno(porId(S.alumnos, p.alumnoId) || { apellidos: '', nombres: '' }), documento: porId(S.alumnos, p.alumnoId)?.documento || '',
    grupoNombre: nombreGrupoId(p.grupoId), areaNombre: nombreArea(p.areaId), periodoNombre: nombrePeriodo(p.periodoId),
    notaTexto: `${fmtNota(p.notaInicial)} (${desempeno(p.notaInicial) || ''})`, entregaTexto: p.fechaEntrega ? fechaCorta(p.fechaEntrega) : '', sustTexto: p.fechaSustentacion ? fechaCorta(p.fechaSustentacion) : '',
    estadoTexto: ESTADOS_APOYO[p.estado] || '',
  }));
  const nombre = lista.length === 1 ? `Plan de apoyo ${planes[0].estudiante} ${planes[0].areaNombre} ${planes[0].periodoNombre}` : `Planes de apoyo ${planes[0].grupoNombre} ${planes[0].areaNombre} ${planes[0].periodoNombre}`;
  const r = await api.exportarWordCurricular('apoyo', nombre, { config: S.config, planes });
  if (r.ok) aviso('Documento de Word creado', 'ok'); else if (r.error) aviso('No se pudo exportar: ' + r.error, 'error');
}
