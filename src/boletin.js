// ================= Observaciones para el boletín =================

const FRASES_BOLETIN = {
  apertura: {
    Superior: [
      '{nombre} alcanzó un desempeño superior en {area}, demostrando dominio de los aprendizajes del periodo.',
      '{nombre} se destacó en {area} por la calidad y constancia de su trabajo durante el periodo.',
      '{nombre} demostró un excelente nivel de apropiación de los aprendizajes de {area}.',
    ],
    Alto: [
      '{nombre} obtuvo un desempeño alto en {area} y muestra una buena comprensión de los temas trabajados.',
      '{nombre} tuvo un buen desempeño en {area}, con avances significativos durante el periodo.',
      '{nombre} alcanzó los aprendizajes propuestos en {area} con un nivel alto de compromiso.',
    ],
    Básico: [
      '{nombre} alcanzó los aprendizajes básicos de {area} durante el periodo.',
      '{nombre} logró los desempeños mínimos esperados en {area}, aunque puede rendir mucho más.',
      '{nombre} cumplió con lo básico en {area}; con mayor dedicación puede mejorar sus resultados.',
    ],
    Bajo: [
      '{nombre} aún no alcanza los desempeños esperados en {area} para este periodo.',
      '{nombre} presentó dificultades para alcanzar los aprendizajes propuestos en {area}.',
      '{nombre} requiere fortalecer su proceso en {area}, pues no alcanzó los desempeños del periodo.',
    ],
  },
  fortaleza: ['Se destaca en {fortaleza}.', 'Su mejor resultado fue en {fortaleza}.', 'Muestra fortalezas en {fortaleza}.'],
  mejorar: ['Debe fortalecer {mejorar}.', 'Necesita mejorar en {mejorar}.', 'Es importante que mejore en {mejorar}.'],
  recomendacion: {
    Superior: ['Se le invita a seguir profundizando y a apoyar a sus compañeros.', '¡Felicitaciones! Continúe con ese compromiso.'],
    Alto: ['Se recomienda mantener la dedicación y profundizar con lecturas y ejercicios adicionales.', 'Puede alcanzar un nivel superior si mantiene su esfuerzo.'],
    Básico: ['Se recomienda repasar en casa, cumplir con todas las actividades y preguntar sus dudas en clase.', 'Se sugiere organizar un horario de estudio y entregar puntualmente sus trabajos.'],
    Bajo: ['Es necesario el acompañamiento de la familia en casa y el desarrollo responsable del plan de apoyo.', 'Se requiere mayor compromiso, acompañamiento familiar y asistir a las asesorías.'],
  },
  asistencia: 'Sus inasistencias ({faltas}) afectaron su proceso; es importante asistir puntualmente.',
  pendientes: 'Tiene {pendientes} actividad(es) sin entregar.',
  apoyo: 'Debe presentar el plan de apoyo asignado antes del {fechaPlan}.',
};

function frasesBoletin() { return S.config.frasesBoletin || FRASES_BOLETIN; }
function claveObs(c) { return `${c.grupoId}|${c.areaId}|${c.periodoId}`; }
function observacionesDe(c) { return ((S.observaciones ||= {})[claveObs(c)] ||= {}); }
function rellenar(t, v) { return String(t || '').replace(/\{(\w+)\}/g, (m, k) => (v[k] != null && v[k] !== '' ? v[k] : m)); }
function elegir(lista, semilla) {
  if (!Array.isArray(lista)) return lista || '';
  let h = 0; for (const ch of semilla) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lista.length ? lista[h % lista.length] : '';
}
function tipoTitulo(t) { return String(t || '').toLocaleLowerCase('es').replace(/(^|[\s-])(\p{L})/gu, (m, sep, l) => sep + l.toLocaleUpperCase('es')); }
function primerNombre(a) { return tipoTitulo(String(a.nombres || a.apellidos || '').trim().split(/\s+/)[0] || ''); }

// Datos del estudiante en el periodo, usados por el banco de frases y por la IA
function datosObservacion(c, al) {
  const pl = buscarPlanilla(c.grupoId, c.areaId, c.periodoId);
  const n = pl ? notaFinal(pl, al.id) : null;
  const comps = pl ? pl.criterios.map((cr) => ({ nombre: cr.nombre, v: promedioCriterio(cr, al.id) })).filter((x) => x.v != null) : [];
  const hoy = hoyISO();
  const pendientes = pl ? pl.criterios.flatMap((cr) => cr.actividades).filter((a) => a.fecha && a.fecha <= hoy && nota(a.id, al.id) == null).length : 0;
  const per = porId(S.config.periodos, c.periodoId);
  const asis = asistenciaAlumno(al.id, c.grupoId, per);
  const plan = planApoyoDe(al.id, c.areaId, c.periodoId);
  const orden = [...comps].sort((a, b) => b.v - a.v);
  const fort = orden[0] && redondear(orden[0].v) >= 4 ? orden[0] : null;
  const debil = [...orden].reverse().find((x) => redondear(x.v) < +S.config.notaAprobacion) || (desempeno(n) === 'Básico' && orden.length > 1 ? orden[orden.length - 1] : null);
  return { n, des: desempeno(n), comps, pendientes, asis, plan, fort: fort && fort !== debil ? fort : null, debil };
}

function generarObservacion(c, al) {
  const d = datosObservacion(c, al);
  if (d.n == null) return '';
  const f = frasesBoletin();
  const semilla = al.id + c.periodoId;
  const v = {
    nombre: primerNombre(al), nombreCompleto: tipoTitulo(`${al.nombres} ${al.apellidos}`.trim()), area: nombreArea(c.areaId),
    fortaleza: d.fort ? d.fort.nombre.toLowerCase() : '', mejorar: d.debil ? d.debil.nombre.toLowerCase() : '',
    faltas: d.asis ? d.asis.faltas : '', pendientes: d.pendientes, fechaPlan: d.plan?.fechaEntrega ? fechaCorta(d.plan.fechaEntrega) : '',
  };
  const partes = [elegir(f.apertura?.[d.des], semilla)];
  if (d.fort) partes.push(elegir(f.fortaleza, semilla + 'f'));
  if (d.debil) partes.push(elegir(f.mejorar, semilla + 'm'));
  if (d.pendientes) partes.push(f.pendientes);
  if (d.asis && d.asis.pct < 80) partes.push(f.asistencia);
  if (d.plan && d.plan.estado === 'pendiente' && v.fechaPlan) partes.push(f.apoyo);
  partes.push(elegir(f.recomendacion?.[d.des], semilla + 'r'));
  return partes.filter(Boolean).map((t) => rellenar(t, v)).join(' ');
}

// ---------- Vista (pestaña en Evaluación y notas) ----------
function vistaObservaciones(c) {
  if (!c.grupoId || !c.areaId || !c.periodoId) return '<div class="tarjeta vacio">Selecciona grupo, área y periodo.</div>';
  const alumnos = alumnosDe(c.grupoId);
  const obs = observacionesDe(c);
  const pl = buscarPlanilla(c.grupoId, c.areaId, c.periodoId);
  const hechas = alumnos.filter((a) => (obs[a.id] || '').trim()).length;
  return `
  <div class="tarjeta"><div class="cabecera" style="margin-bottom:6px"><div><h2 style="margin:0">Observaciones del boletín</h2>
    <p class="ayuda" style="margin:4px 0 0">${hechas} de ${alumnos.length} redactadas. Se generan a partir de la nota, los componentes, las actividades pendientes, la asistencia y los planes de apoyo. Revísalas y ajústalas antes de copiarlas a la plataforma.</p></div>
    <div class="acciones"><button class="btn" onclick="editarFrasesBoletin()">✏️ Banco de frases</button></div></div>
    <div class="fila">
      <button class="btn primario" onclick="generarObservaciones()">⚙️ Generar con el banco de frases</button>
      <button class="btn" id="obs-ia" onclick="observacionesIA()">✨ Redactar con IA</button>
      <button class="btn" onclick="copiarObservaciones()">📋 Copiar todas</button>
      <button class="btn" onclick="exportarObservaciones('excel')">⬇️ Excel</button>
      <button class="btn" onclick="exportarObservaciones('word')">⬇️ Word</button>
    </div><div id="obs-error"></div></div>
  ${!pl ? '<div class="alerta">Aún no hay notas para este grupo, área y periodo. Las observaciones se generan a partir de la planilla.</div>' : ''}
  ${alumnos.length ? `<div class="tarjeta" style="padding:0"><table class="tabla"><thead><tr><th style="width:30px">#</th><th style="width:210px">Estudiante</th><th class="num" style="width:60px">Nota</th><th style="width:90px">Desempeño</th><th>Observación</th><th style="width:70px"></th></tr></thead><tbody>
    ${alumnos.map((a, i) => { const d = datosObservacion(c, a); const t = obs[a.id] || ''; return `<tr>
      <td class="num">${i + 1}</td><td>${esc(nombreAlumno(a))} ${a.piar ? '<span class="chip piar">PIAR</span>' : ''}</td>
      <td class="num ${claseNota(d.n)}"><b>${fmtNota(d.n)}</b></td><td>${chipDesempeno(d.n)}</td>
      <td><textarea rows="3" data-obs="${a.id}" oninput="ponerObservacion('${a.id}',this)" placeholder="${d.n == null ? 'Sin notas en el periodo' : 'Escribe o genera la observación'}">${esc(t)}</textarea>
        <div class="ayuda" style="text-align:right" data-cont="${a.id}">${t.length} caracteres</div></td>
      <td style="white-space:nowrap"><button class="icono" title="Volver a generar" onclick="regenerarObservacion('${a.id}')">↻</button><button class="icono" title="Copiar" onclick="copiarTexto(observacionesDe(ui.cal)['${a.id}']||'')">📋</button></td></tr>`; }).join('')}
  </tbody></table></div>` : '<div class="tarjeta vacio">Este grupo no tiene estudiantes.</div>'}`;
}
function ponerObservacion(alumnoId, ta) {
  observacionesDe(ui.cal)[alumnoId] = ta.value;
  const c = document.querySelector(`[data-cont="${alumnoId}"]`); if (c) c.textContent = ta.value.length + ' caracteres';
  guardar();
}
async function generarObservaciones() {
  const c = ui.cal; const obs = observacionesDe(c);
  const alumnos = alumnosDe(c.grupoId);
  const conTexto = alumnos.filter((a) => (obs[a.id] || '').trim()).length;
  let sobrescribir = false;
  if (conTexto) sobrescribir = await confirmar(`${conTexto} estudiante(s) ya tienen observación. ¿Reemplazarlas también? (Si eliges Cancelar, solo se completan las vacías)`, { boton: 'Reemplazar todas', peligro: false });
  let n = 0;
  for (const a of alumnos) if (sobrescribir || !(obs[a.id] || '').trim()) { const t = generarObservacion(c, a); if (t) { obs[a.id] = t; n++; } }
  guardar(); render();
  aviso(n ? `Se generaron ${n} observación(es).` : 'No hay estudiantes con notas para generar.', n ? 'ok' : '');
}
function regenerarObservacion(alumnoId) {
  const a = porId(S.alumnos, alumnoId);
  const t = generarObservacion(ui.cal, a);
  if (!t) return aviso('Este estudiante no tiene notas en el periodo.');
  observacionesDe(ui.cal)[alumnoId] = t; guardar(); render();
}
async function observacionesIA() {
  if (sinIA()) return;
  const c = ui.cal; const obs = observacionesDe(c);
  const alumnos = alumnosDe(c.grupoId).filter((a) => datosObservacion(c, a).n != null);
  if (!alumnos.length) return aviso('No hay estudiantes con notas en este periodo.');
  const g = porId(S.grupos, c.grupoId);
  const lineas = alumnos.map((a, i) => {
    const d = datosObservacion(c, a);
    return `E${i + 1}: desempeño ${d.des}; componentes: ${d.comps.map((x) => `${x.nombre} ${desempeno(x.v)}`).join(', ') || '—'}`
      + `${d.pendientes ? `; ${d.pendientes} actividad(es) sin entregar` : ''}${d.asis && d.asis.pct < 80 ? `; asistencia ${d.asis.pct}%` : ''}${d.plan ? '; tiene plan de apoyo' : ''}${a.piar ? '; tiene PIAR (valorar su proceso individual)' : ''}`;
  });
  const contexto = [`Área: ${nombreArea(c.areaId)}`, `Grado: ${g ? g.grado + '°' : ''}`, `Periodo: ${nombrePeriodo(c.periodoId)}`,
    desempenosDelPeriodo(c.grupoId, c.areaId, c.periodoId) ? `Desempeños del periodo:\n${desempenosDelPeriodo(c.grupoId, c.areaId, c.periodoId)}` : '',
    'Estudiantes:', ...lineas].filter(Boolean).join('\n');
  const btn = document.getElementById('obs-ia');
  btn.disabled = true; btn.innerHTML = '<span class="cargando"></span> Redactando…';
  const r = await api.sugerirIA({ ia: S.config.ia, contexto, tarea: 'boletin' });
  const b2 = document.getElementById('obs-ia'); if (b2) { b2.disabled = false; b2.textContent = '✨ Redactar con IA'; }
  if (!r.ok) { const e = document.getElementById('obs-error'); if (e) e.innerHTML = `<div class="alerta error" style="margin-top:8px">${esc(r.error)}</div>`; return; }
  const res = r.datos.observaciones || {};
  let n = 0;
  alumnos.forEach((a, i) => { const t = res['E' + (i + 1)]; if (typeof t === 'string' && t.trim()) { obs[a.id] = t.trim().replace(/\{nombre\}/g, primerNombre(a)); n++; } });
  guardar(); render();
  aviso(`La IA redactó ${n} observación(es). Revísalas antes de usarlas.`, 'ok');
}
function copiarTexto(t) { navigator.clipboard.writeText(t).then(() => aviso('Copiado', 'ok')); }
function copiarObservaciones() {
  const c = ui.cal; const obs = observacionesDe(c);
  copiarTexto(alumnosDe(c.grupoId).map((a) => `${nombreAlumno(a)}\t${(obs[a.id] || '').replace(/\s*\n\s*/g, ' ')}`).join('\n'));
}
function exportarObservaciones(formato) {
  const c = ui.cal; const obs = observacionesDe(c);
  const filas = alumnosDe(c.grupoId).map((a, i) => { const d = datosObservacion(c, a); return [i + 1, nombreAlumno(a), a.documento || '', fmtNota(d.n), d.des || '', obs[a.id] || '']; });
  const nombre = `Observaciones ${nombreGrupoId(c.grupoId)} ${nombreArea(c.areaId)} ${nombrePeriodo(c.periodoId)}`;
  if (formato === 'excel') return exportarExcel(nombre, [['N.°', 'Estudiante', 'Documento', 'Nota', 'Desempeño', 'Observación'], ...filas]);
  api.exportarWordCurricular('tabla', nombre, {
    config: S.config, titulo: 'Observaciones del boletín', subtitulo: `${nombreArea(c.areaId)} · ${nombreGrupoId(c.grupoId)} · ${nombrePeriodo(c.periodoId)}`,
    columnas: [{ t: 'N.°', ancho: 5 }, { t: 'Estudiante', ancho: 22 }, { t: 'Nota', ancho: 7 }, { t: 'Desempeño', ancho: 10 }, { t: 'Observación', ancho: 56 }],
    filas: filas.map((f) => [String(f[0]), f[1], f[3], f[4], f[5]]), horizontal: true, firmas: [[S.config.docente, 'Docente']],
  }).then((r) => { if (r.ok) aviso('Documento de Word creado', 'ok'); else if (r.error) aviso(r.error, 'error'); });
}

// ---------- Banco de frases editable ----------
function editarFrasesBoletin() {
  const f = frasesBoletin();
  const ta = (id, v, filas = 3) => `<textarea id="${id}" rows="${filas}">${esc(Array.isArray(v) ? v.join('\n') : v)}</textarea>`;
  abrirModal(`<h2>✏️ Banco de frases del boletín</h2>
    <p class="ayuda">Una frase por línea; la app elige una distinta para cada estudiante. Puedes usar: {nombre}, {nombreCompleto}, {area}, {fortaleza}, {mejorar}, {faltas}, {pendientes}, {fechaPlan}.</p>
    ${S.config.desempenos.map((d) => `<h3 style="margin:14px 0 4px">${esc(d.nombre)}</h3><div class="rejilla r2">
      <div class="campo"><label>Apertura</label>${ta('fb-ap-' + d.nombre, f.apertura?.[d.nombre] || [])}</div>
      <div class="campo"><label>Recomendación</label>${ta('fb-re-' + d.nombre, f.recomendacion?.[d.nombre] || [])}</div></div>`).join('')}
    <h3 style="margin:14px 0 4px">Otras frases</h3><div class="rejilla r2">
      <div class="campo"><label>Fortaleza (componente más alto)</label>${ta('fb-fo', f.fortaleza)}</div>
      <div class="campo"><label>Por mejorar (componente más bajo)</label>${ta('fb-me', f.mejorar)}</div>
      <div class="campo"><label>Actividades pendientes</label>${ta('fb-pe', f.pendientes, 2)}</div>
      <div class="campo"><label>Asistencia baja (menos del 80%)</label>${ta('fb-as', f.asistencia, 2)}</div>
      <div class="campo"><label>Plan de apoyo pendiente</label>${ta('fb-apo', f.apoyo, 2)}</div></div>
    <div class="botones"><button class="btn" onclick="S.config.frasesBoletin=null;guardar();cerrarModal();aviso('Se restauraron las frases sugeridas','ok')">Restaurar sugeridas</button>
      <button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarFrasesBoletin()">Guardar</button></div>`, { ancho: true });
}
function guardarFrasesBoletin() {
  const lineas = (id) => (document.getElementById(id)?.value || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const f = { apertura: {}, recomendacion: {}, fortaleza: lineas('fb-fo'), mejorar: lineas('fb-me'),
    pendientes: lineas('fb-pe').join(' '), asistencia: lineas('fb-as').join(' '), apoyo: lineas('fb-apo').join(' ') };
  for (const d of S.config.desempenos) { f.apertura[d.nombre] = lineas('fb-ap-' + d.nombre); f.recomendacion[d.nombre] = lineas('fb-re-' + d.nombre); }
  S.config.frasesBoletin = f; guardar(); cerrarModal(); aviso('Banco de frases guardado', 'ok');
}
