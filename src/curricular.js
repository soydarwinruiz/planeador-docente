// ================= Planeación curricular: plan de área, malla, plan de periodo y plan de aula =================

const CAMPOS_ITEM = [
  { k: 'contenidos', t: 'Contenidos', ph: 'Temas y subtemas…' },
  { k: 'estandares', t: 'Estándares básicos de competencias', ph: 'Estándar(es) del MEN…' },
  { k: 'dba', t: 'DBA', ph: 'Derechos Básicos de Aprendizaje…' },
  { k: 'competencias', t: 'Competencias', ph: 'Interpretativa, argumentativa, propositiva…' },
  { k: 'desempenoSaber', t: 'Desempeño – Saber', ph: 'Identifica, explica…' },
  { k: 'desempenoHacer', t: 'Desempeño – Hacer', ph: 'Resuelve, aplica…' },
  { k: 'desempenoSer', t: 'Desempeño – Ser', ph: 'Participa, valora…' },
  { k: 'evidencias', t: 'Evidencias de aprendizaje', ph: 'Productos o actuaciones observables…' },
];

const SECCIONES_AREA = [
  { k: 'diagnostico', t: '1. Diagnóstico del área', ph: 'Resultados de pruebas Saber, evaluaciones institucionales, fortalezas y dificultades…' },
  { k: 'justificacion', t: '2. Justificación', ph: '¿Por qué es importante el área para la formación de los estudiantes y el contexto?' },
  { k: 'objetivoGeneral', t: '3. Objetivo general', ph: '' },
  { k: '__objetivosGrado', t: '4. Objetivos por grado' },
  { k: 'referentes', t: '5. Marco legal y referentes', ph: 'Ley 115 de 1994, lineamientos curriculares, estándares, DBA, Decreto 1290, Decreto 1421…' },
  { k: 'enfoque', t: '6. Enfoque pedagógico y didáctico', ph: 'Modelo pedagógico institucional, enfoque del área…' },
  { k: 'metodologia', t: '7. Metodología y estrategias', ph: 'Aprendizaje basado en problemas, proyectos, trabajo cooperativo…' },
  { k: 'evaluacion', t: '8. Evaluación', ph: 'Criterios, instrumentos, autoevaluación, coevaluación, planes de apoyo (Decreto 1290)…' },
  { k: 'recursos', t: '9. Recursos', ph: 'Humanos, físicos, tecnológicos, didácticos…' },
  { k: 'inclusion', t: '10. Inclusión, DUA y ajustes razonables', ph: 'Estrategias para estudiantes con PIAR, diversidad, DUA…' },
  { k: 'transversales', t: '11. Proyectos transversales', ph: 'Educación ambiental (PRAE), sexualidad, democracia, tiempo libre, Cátedra de la Paz…' },
  { k: 'bibliografia', t: '12. Bibliografía y webgrafía', ph: '' },
];

// ---------- Datos ----------
function gradosDeArea(areaId) {
  const g = [...new Set(S.grupos.filter((x) => (x.areas || []).some((a) => a.areaId === areaId)).map((x) => +x.grado))].sort((a, b) => a - b);
  return g.length ? g : [6, 7, 8, 9];
}
function intensidadDe(areaId, grado) {
  const g = S.grupos.find((x) => +x.grado === +grado && (x.areas || []).some((a) => a.areaId === areaId));
  return g ? (g.areas.find((a) => a.areaId === areaId).horas || '') : '';
}
function obtenerMalla(areaId, grado, crear = true) {
  let m = S.mallas.find((x) => x.areaId === areaId && +x.grado === +grado);
  if (!m && crear) { m = { id: uid(), areaId, grado: +grado, periodos: {} }; S.mallas.push(m); }
  return m;
}
function periodoMalla(m, periodoId) { return (m.periodos[periodoId] ||= { pregunta: '', items: [] }); }
function itemsMalla(areaId, grado, periodoId) {
  const m = obtenerMalla(areaId, grado, false);
  return m?.periodos[periodoId]?.items || [];
}
function buscarItemMalla(itemId) {
  for (const m of S.mallas) for (const [perId, per] of Object.entries(m.periodos)) {
    const it = per.items.find((i) => i.id === itemId);
    if (it) return { malla: m, periodoId: perId, item: it };
  }
  return null;
}
function clasesDeItem(itemId, grupoId) {
  return S.planeaciones.filter((p) => (p.mallaItems || []).includes(itemId) && (!grupoId || p.grupoId === grupoId));
}
function estadoItem(itemId, grupoId) {
  const clases = clasesDeItem(itemId, grupoId);
  if (!clases.length) return { t: 'Sin planear', c: 'borrador' };
  const hoy = hoyISO();
  const dictada = clases.some((p) => p.estado === 'terminada' || (p.sesiones || []).some((s) => s.fecha && s.fecha < hoy));
  return dictada ? { t: 'Desarrollado', c: 'terminada' } : { t: 'Planeado', c: 'sesion' };
}
function obtenerPlanArea(areaId) {
  let p = S.planesArea.find((x) => x.areaId === areaId);
  if (!p) {
    p = { id: uid(), areaId, asignaturas: '', docentes: '', objetivosGrado: {} };
    SECCIONES_AREA.forEach((s) => { if (!s.k.startsWith('__')) p[s.k] = ''; });
    S.planesArea.push(p);
  }
  return p;
}
function obtenerPlanPeriodo(areaId, grado, periodoId) {
  let p = S.planesPeriodo.find((x) => x.areaId === areaId && +x.grado === +grado && x.periodoId === periodoId);
  if (!p) { p = { id: uid(), areaId, grado: +grado, periodoId, unidades: [], recursos: '' }; S.planesPeriodo.push(p); }
  return p;
}
function obtenerPlanAula(grupoId, areaId, periodoId) {
  let p = S.planesAula.find((x) => x.grupoId === grupoId && x.areaId === areaId && x.periodoId === periodoId);
  if (!p) { p = { id: uid(), grupoId, areaId, periodoId, caracterizacion: '', estrategias: '', evaluacion: '', ajustes: '', observaciones: '' }; S.planesAula.push(p); }
  return p;
}
function nuevoItem() {
  const it = { id: uid(), eje: '', horas: '' };
  CAMPOS_ITEM.forEach((c) => { it[c.k] = ''; });
  return it;
}

// ---------- Vista principal ----------
RENDERS.curricular = () => {
  const c = ui.cur || (ui.cur = { pestana: 'malla', areaId: '', grado: '', periodoId: '', grupoId: '' });
  if (!c.areaId && S.areas.length) c.areaId = S.areas[0].id;
  if (c.areaId && !gradosDeArea(c.areaId).includes(+c.grado)) c.grado = String(gradosDeArea(c.areaId)[0]);
  if (!c.periodoId) c.periodoId = (periodoDeFecha(hoyISO()) || S.config.periodos[0] || {}).id || '';
  const pestanas = [['area', '📘 Plan de área'], ['malla', '🧩 Malla curricular'], ['periodo', '🗓️ Plan de periodo'], ['aula', '🏫 Plan de aula'], ['referentes', '📚 Referentes MEN']];
  const cab = `<div class="cabecera"><div><h1>Planeación curricular</h1>
    <p class="sub">Del plan de área a la clase: la malla alimenta el plan de periodo, el plan de aula y tus planeaciones de clase.</p></div></div>
    <div class="pestanas">${pestanas.map(([k, t]) => `<button class="${c.pestana === k ? 'activo' : ''}" onclick="ui.cur.pestana='${k}';render()">${t}</button>`).join('')}</div>`;
  if (!S.areas.length) return cab + `<div class="tarjeta vacio"><div class="grande">🧩</div>Primero crea tus áreas en <a href="#" onclick="ir('grupos')">Grupos y alumnos</a>.</div>`;
  const vista = { area: vistaPlanArea, malla: vistaMalla, periodo: vistaPlanPeriodo, aula: vistaPlanAula, referentes: vistaReferentes }[c.pestana];
  return cab + vista(c);
};

function filtrosCur(c, { grado = false, periodo = false, grupo = false } = {}) {
  const grupos = [...S.grupos].sort(ordenGrupos);
  return `<div class="filtros tarjeta">
    ${grupo ? `<div><label>Grupo</label><select onchange="ui.cur.grupoId=this.value;render()">${opciones(grupos, c.grupoId, { texto: nombreGrupo, vacio: 'Selecciona…' })}</select></div>` : ''}
    <div><label>Área</label><select onchange="ui.cur.areaId=this.value;render()">${opcionesAreas(c.areaId, null, grupo && c.grupoId && areasDeGrupo(c.grupoId).length ? areasDeGrupo(c.grupoId) : S.areas)}</select></div>
    ${grado ? `<div><label>Grado</label><select onchange="ui.cur.grado=this.value;render()">${gradosDeArea(c.areaId).map((g) => `<option value="${g}" ${+c.grado === g ? 'selected' : ''}>${g}°</option>`).join('')}</select></div>` : ''}
    ${periodo ? `<div><label>Periodo</label><select onchange="ui.cur.periodoId=this.value;render()">${opcionesPeriodos(c.periodoId)}</select></div>` : ''}
  </div>`;
}

// ---------- Plan de área ----------
function vistaPlanArea(c) {
  const p = obtenerPlanArea(c.areaId);
  const grados = gradosDeArea(c.areaId);
  const campo = (k, t, ph = '') => `<div class="campo"><label>${esc(t)}${['enfoque', 'metodologia', 'evaluacion', 'inclusion'].includes(k) ? botonBanco('ta-area-' + k) : ''}</label><textarea id="ta-area-${k}" style="min-height:90px" placeholder="${esc(ph)}" oninput="porId(S.planesArea,'${p.id}')['${k}']=this.value;guardar()">${esc(p[k] || '')}</textarea></div>`;
  return `${filtrosCur(c)}
  <div class="fila" style="justify-content:flex-end;margin-bottom:12px">
    <button class="btn ia" onclick="iaPlanArea('${p.id}')">✨ Sugerir con IA</button>
    <button class="btn primario" onclick="exportarPlanArea('${p.id}')">📄 Exportar a Word (incluye mallas)</button></div>
  <div class="tarjeta"><h2>Identificación</h2>
    <div class="rejilla r3">
      <div class="campo"><label>Asignaturas que integra</label><input value="${esc(p.asignaturas)}" oninput="porId(S.planesArea,'${p.id}').asignaturas=this.value;guardar()" placeholder="Ej.: Física, Química, Biología"></div>
      <div class="campo"><label>Docentes del área</label><input value="${esc(p.docentes)}" oninput="porId(S.planesArea,'${p.id}').docentes=this.value;guardar()" placeholder="${esc(S.config.docente)}"></div>
      <div class="campo"><label>Intensidad horaria semanal</label><div class="ayuda" style="margin-top:8px">${grados.map((g) => `${g}°: ${esc(intensidadDe(c.areaId, g) || '—')} h`).join(' · ')}<br>(Se toma de los grupos)</div></div>
    </div>
  </div>
  <div class="tarjeta">
    ${SECCIONES_AREA.map((s) => s.k === '__objetivosGrado'
      ? `<h3>${s.t}</h3><div class="rejilla r2">${grados.map((g) => `<div class="campo"><label>Grado ${g}°</label><textarea oninput="porId(S.planesArea,'${p.id}').objetivosGrado['${g}']=this.value;guardar()">${esc(p.objetivosGrado?.[g] || '')}</textarea></div>`).join('')}</div>`
      : campo(s.k, s.t, s.ph)).join('')}
  </div>`;
}

function datosMallaExport(m) {
  return {
    areaNombre: nombreArea(m.areaId), grado: m.grado, intensidad: intensidadDe(m.areaId, m.grado),
    periodos: S.config.periodos.map((per) => ({ nombre: per.nombre, pregunta: m.periodos[per.id]?.pregunta || '', items: m.periodos[per.id]?.items || [] })),
  };
}
async function exportarPlanArea(id) {
  const p = porId(S.planesArea, id);
  const grados = gradosDeArea(p.areaId);
  const mallas = grados.map((g) => obtenerMalla(p.areaId, g, false)).filter(Boolean).map(datosMallaExport);
  const plan = { ...p, areaNombre: nombreArea(p.areaId), intensidadTexto: grados.map((g) => `${g}°: ${intensidadDe(p.areaId, g) || '—'} h`).join(' · '),
    objetivosGrado: grados.map((g) => [g, p.objetivosGrado?.[g] || '']) };
  resultadoExport(await api.exportarWordCurricular('planArea', `Plan de área ${plan.areaNombre} ${S.config.anio}`, { config: S.config, plan, mallas }));
}
function resultadoExport(r) {
  if (r.ok) aviso('Documento de Word creado', 'ok');
  else if (r.error) aviso('No se pudo exportar: ' + r.error, 'error');
}

// ---------- Malla curricular ----------
function vistaMalla(c) {
  const m = obtenerMalla(c.areaId, c.grado);
  const abiertos = ui.mallaAbiertos || (ui.mallaAbiertos = {});
  return `${filtrosCur(c, { grado: true })}
  <div class="fila" style="justify-content:space-between;margin-bottom:12px">
    <span class="ayuda">Intensidad: ${esc(intensidadDe(c.areaId, c.grado) || '—')} h/semana. Haz clic en un eje para ver o editar sus detalles.</span>
    <div class="fila"><button class="btn" onclick="dialogoCopiarMalla('${m.id}')">📑 Copiar de otra malla</button>
    <button class="btn primario" onclick="exportarMalla('${m.id}')">📄 Exportar a Word</button></div></div>
  ${S.config.periodos.map((per) => {
    const pm = m.periodos[per.id] || { pregunta: '', items: [] };
    return `<div class="tarjeta">
      <div class="cabecera"><h2 style="margin:0">${esc(per.nombre)}</h2>
        <div class="fila"><button class="btn pequeno ia" onclick="iaMalla('${m.id}','${per.id}')">✨ Sugerir con IA</button>
        <button class="btn pequeno primario" onclick="agregarItemMalla('${m.id}','${per.id}')">＋ Eje temático</button></div></div>
      <div class="campo"><label>Pregunta problematizadora del periodo</label><input value="${esc(pm.pregunta)}" oninput="periodoMalla(porId(S.mallas,'${m.id}'),'${per.id}').pregunta=this.value;guardar()"></div>
      ${pm.items.length ? pm.items.map((it, i) => {
        const nClases = clasesDeItem(it.id).length;
        const abierto = abiertos[it.id];
        return `<div class="sesion-caja">
          <div class="cab" style="cursor:pointer" onclick="ui.mallaAbiertos['${it.id}']=!ui.mallaAbiertos['${it.id}'];render()">
            <div><b>${abierto ? '▾' : '▸'} ${i + 1}. ${esc(it.eje || 'Eje sin nombre')}</b> ${it.horas ? `<span class="ayuda">· ${esc(it.horas)} h</span>` : ''}
              ${nClases ? `<span class="chip terminada">${nClases} clase(s)</span>` : '<span class="chip">Sin clases</span>'}
              ${!abierto && it.contenidos ? `<div class="ayuda">${esc(it.contenidos.slice(0, 160))}</div>` : ''}</div>
            <div onclick="event.stopPropagation()">
              ${i > 0 ? `<button class="icono" title="Subir" onclick="moverItemMalla('${m.id}','${per.id}',${i},-1)">⬆️</button>` : ''}
              ${i < pm.items.length - 1 ? `<button class="icono" title="Bajar" onclick="moverItemMalla('${m.id}','${per.id}',${i},1)">⬇️</button>` : ''}
              <button class="icono" title="Eliminar" onclick="eliminarItemMalla('${m.id}','${per.id}',${i})">🗑️</button></div></div>
          ${abierto ? `<div class="rejilla" style="grid-template-columns: 3fr 1fr">
              <div class="campo"><label>Eje temático / unidad</label><input value="${esc(it.eje)}" oninput="cambiarItem('${it.id}','eje',this.value)"></div>
              <div class="campo"><label>Horas</label><input type="number" min="0" value="${esc(it.horas)}" oninput="cambiarItem('${it.id}','horas',this.value)"></div></div>
            <div class="rejilla r2">${CAMPOS_ITEM.map((f) => `<div class="campo"><label>${f.t}${f.k === 'estandares' || f.k === 'dba' ? botonReferentes(`ta-it-${it.id}-${f.k}`, m.areaId, m.grado, f.k === 'dba' ? 'dba' : 'estandar') : ''}</label><textarea id="ta-it-${it.id}-${f.k}" placeholder="${esc(f.ph)}" oninput="cambiarItem('${it.id}','${f.k}',this.value)">${esc(it[f.k])}</textarea></div>`).join('')}</div>` : ''}
        </div>`;
      }).join('') : '<p class="ayuda">Aún no hay ejes temáticos en este periodo.</p>'}
    </div>`;
  }).join('')}`;
}
function cambiarItem(id, k, v) { buscarItemMalla(id).item[k] = v; guardar(); }
function agregarItemMalla(mId, perId) {
  const it = nuevoItem();
  periodoMalla(porId(S.mallas, mId), perId).items.push(it);
  ui.mallaAbiertos[it.id] = true;
  guardar(); render();
}
function moverItemMalla(mId, perId, i, d) {
  const items = periodoMalla(porId(S.mallas, mId), perId).items;
  const [x] = items.splice(i, 1); items.splice(i + d, 0, x);
  guardar(); render();
}
async function eliminarItemMalla(mId, perId, i) {
  const items = periodoMalla(porId(S.mallas, mId), perId).items;
  const it = items[i];
  const n = clasesDeItem(it.id).length;
  if (!(await confirmar(`¿Eliminar el eje "${it.eje || 'sin nombre'}"?${n ? ` Está vinculado a ${n} clase(s); las clases se conservan.` : ''}`))) return;
  items.splice(i, 1);
  S.planesPeriodo.forEach((pp) => pp.unidades.forEach((u) => { u.itemIds = (u.itemIds || []).filter((x) => x !== it.id); }));
  S.planeaciones.forEach((p) => { if (p.mallaItems) p.mallaItems = p.mallaItems.filter((x) => x !== it.id); });
  guardar(); render();
}
function exportarMalla(mId) {
  const m = porId(S.mallas, mId);
  api.exportarWordCurricular('malla', `Malla curricular ${nombreArea(m.areaId)} ${m.grado}° ${S.config.anio}`, { config: S.config, malla: datosMallaExport(m) }).then(resultadoExport);
}
function dialogoCopiarMalla(mId) {
  const otras = S.mallas.filter((x) => x.id !== mId && Object.values(x.periodos).some((p) => p.items.length));
  if (!otras.length) return aviso('No hay otras mallas con contenido para copiar', 'error');
  abrirModal(`<h2>Copiar de otra malla</h2>
    <p class="ayuda">Los ejes de la malla elegida se agregan a esta, periodo por periodo (no se borra lo que ya tienes).</p>
    <div class="campo"><label>Malla de origen</label><select id="m-origen">${opciones(otras, '', { texto: (x) => `${nombreArea(x.areaId)} · ${x.grado}°` })}</select></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="copiarMalla('${mId}')">Copiar</button></div>`);
}
function copiarMalla(mId) {
  const origen = porId(S.mallas, document.getElementById('m-origen').value);
  const destino = porId(S.mallas, mId);
  let n = 0;
  for (const [perId, per] of Object.entries(origen.periodos)) {
    const d = periodoMalla(destino, perId);
    if (!d.pregunta) d.pregunta = per.pregunta;
    per.items.forEach((it) => { d.items.push({ ...it, id: uid() }); n++; });
  }
  guardar(); cerrarModal(); render();
  aviso(`Se copiaron ${n} eje(s) temático(s)`, 'ok');
}

// ---------- Plan de periodo ----------
function vistaPlanPeriodo(c) {
  const per = porId(S.config.periodos, c.periodoId);
  if (!per) return filtrosCur(c, { grado: true, periodo: true }) + '<div class="tarjeta vacio">Configura los periodos académicos.</div>';
  const pp = obtenerPlanPeriodo(c.areaId, c.grado, c.periodoId);
  const items = itemsMalla(c.areaId, c.grado, c.periodoId);
  const asignados = new Set(pp.unidades.flatMap((u) => u.itemIds || []));
  const sinAsignar = items.filter((i) => !asignados.has(i.id));
  const horasMalla = items.reduce((s, i) => s + (+i.horas || 0), 0);
  const semanas = per.inicio && per.fin ? Math.round(difDias(per.inicio, per.fin) / 7) + 1 : 0;
  const horasDisp = semanas * (+intensidadDe(c.areaId, c.grado) || 0);
  const pregunta = obtenerMalla(c.areaId, c.grado, false)?.periodos[c.periodoId]?.pregunta || '';
  return `${filtrosCur(c, { grado: true, periodo: true })}
  <div class="fila" style="justify-content:space-between;margin-bottom:12px">
    <span class="ayuda">${esc(fechaCorta(per.inicio))} – ${esc(fechaCorta(per.fin))} · ${semanas} semanas · ${horasDisp || '—'} horas disponibles · ${horasMalla} horas en la malla</span>
    <div class="fila"><button class="btn primario" onclick="agregarUnidad('${pp.id}')">＋ Unidad / proyecto</button>
    <button class="btn" onclick="exportarPlanPeriodo('${pp.id}')">📄 Exportar a Word</button></div></div>
  ${pregunta ? `<div class="alerta info"><b>Pregunta problematizadora:</b> ${esc(pregunta)}</div>` : ''}
  ${!items.length ? `<div class="alerta">La malla de ${esc(nombreArea(c.areaId))} ${esc(c.grado)}° no tiene ejes en este periodo. <a href="#" onclick="ui.cur.pestana='malla';render()">Complétala primero</a>.</div>` : ''}
  ${sinAsignar.length && pp.unidades.length ? `<div class="alerta">Ejes de la malla sin asignar a ninguna unidad: ${sinAsignar.map((i) => esc(i.eje || 'sin nombre')).join(', ')}</div>` : ''}
  ${!pp.unidades.length && items.length ? `<div class="tarjeta"><p>Organiza el periodo en unidades o proyectos. ¿Quieres empezar rápido?</p><button class="btn" onclick="unidadesDesdeMalla('${pp.id}')">Crear una unidad por cada eje de la malla</button></div>` : ''}
  ${pp.unidades.map((u, i) => `<div class="sesion-caja">
    <div class="cab"><b>Unidad ${i + 1}</b><div>
      ${i > 0 ? `<button class="icono" onclick="moverUnidad('${pp.id}',${i},-1)">⬆️</button>` : ''}${i < pp.unidades.length - 1 ? `<button class="icono" onclick="moverUnidad('${pp.id}',${i},1)">⬇️</button>` : ''}
      <button class="icono" title="Eliminar" onclick="eliminarUnidad('${pp.id}',${i})">🗑️</button></div></div>
    <div class="rejilla" style="grid-template-columns: 3fr 1fr 1fr 90px">
      <div class="campo"><label>Nombre de la unidad o proyecto</label><input value="${esc(u.nombre)}" oninput="cambiarUnidad('${pp.id}',${i},'nombre',this.value)"></div>
      <div class="campo"><label>Desde</label><input type="date" value="${esc(u.desde)}" min="${esc(per.inicio)}" max="${esc(per.fin)}" onchange="cambiarUnidad('${pp.id}',${i},'desde',this.value)"></div>
      <div class="campo"><label>Hasta</label><input type="date" value="${esc(u.hasta)}" min="${esc(per.inicio)}" max="${esc(per.fin)}" onchange="cambiarUnidad('${pp.id}',${i},'hasta',this.value)"></div>
      <div class="campo"><label>Horas</label><input type="number" min="0" value="${esc(u.horas)}" oninput="cambiarUnidad('${pp.id}',${i},'horas',this.value)"></div>
    </div>
    <div class="campo"><label>Ejes de la malla que aborda</label>
      ${items.length ? items.map((it) => `<label style="font-weight:normal;color:inherit;font-size:13px;display:inline-flex;gap:4px;margin-right:14px"><input type="checkbox" ${(u.itemIds || []).includes(it.id) ? 'checked' : ''} onchange="alternarItemUnidad('${pp.id}',${i},'${it.id}',this.checked)"> ${esc(it.eje || 'sin nombre')}</label>`).join('') : '<span class="ayuda">—</span>'}</div>
    <div class="rejilla r3">
      <div class="campo"><label>Estrategias metodológicas${botonBanco('ta-u-' + u.id)}</label><textarea id="ta-u-${u.id}" oninput="cambiarUnidad('${pp.id}',${i},'estrategias',this.value)">${esc(u.estrategias)}</textarea></div>
      <div class="campo"><label>Producto / evidencia final</label><textarea oninput="cambiarUnidad('${pp.id}',${i},'producto',this.value)">${esc(u.producto)}</textarea></div>
      <div class="campo"><label>Evaluación</label><textarea oninput="cambiarUnidad('${pp.id}',${i},'evaluacion',this.value)">${esc(u.evaluacion)}</textarea></div>
    </div></div>`).join('')}
  <div class="tarjeta"><div class="campo"><label>Recursos del periodo</label><textarea oninput="porId(S.planesPeriodo,'${pp.id}').recursos=this.value;guardar()">${esc(pp.recursos)}</textarea></div></div>`;
}
function nuevaUnidad(datos = {}) { return { id: uid(), nombre: '', desde: '', hasta: '', horas: '', itemIds: [], estrategias: '', producto: '', evaluacion: '', ...datos }; }
function agregarUnidad(ppId) { porId(S.planesPeriodo, ppId).unidades.push(nuevaUnidad()); guardar(); render(); }
function unidadesDesdeMalla(ppId) {
  const pp = porId(S.planesPeriodo, ppId);
  const per = porId(S.config.periodos, pp.periodoId);
  const items = itemsMalla(pp.areaId, pp.grado, pp.periodoId);
  const int = +intensidadDe(pp.areaId, pp.grado) || 0;
  let fecha = per.inicio ? lunesDe(per.inicio) : '';
  for (const it of items) {
    const semanas = int && +it.horas ? Math.max(1, Math.ceil(+it.horas / int)) : 2;
    const hasta = fecha ? sumarDias(fecha, semanas * 7 - 3) : '';
    pp.unidades.push(nuevaUnidad({ nombre: it.eje, horas: it.horas, itemIds: [it.id], evaluacion: '', producto: it.evidencias, desde: fecha && per.inicio > fecha ? per.inicio : fecha, hasta: hasta && per.fin && hasta > per.fin ? per.fin : hasta }));
    if (fecha) fecha = sumarDias(fecha, semanas * 7);
  }
  guardar(); render();
  aviso('Unidades creadas. Ajusta las fechas y estrategias.', 'ok');
}
function cambiarUnidad(ppId, i, k, v) { porId(S.planesPeriodo, ppId).unidades[i][k] = v; guardar(); }
function alternarItemUnidad(ppId, i, itemId, on) {
  const u = porId(S.planesPeriodo, ppId).unidades[i];
  u.itemIds = (u.itemIds || []).filter((x) => x !== itemId);
  if (on) u.itemIds.push(itemId);
  guardar(); render();
}
function moverUnidad(ppId, i, d) { const us = porId(S.planesPeriodo, ppId).unidades; const [x] = us.splice(i, 1); us.splice(i + d, 0, x); guardar(); render(); }
async function eliminarUnidad(ppId, i) {
  if (!(await confirmar('¿Eliminar esta unidad?'))) return;
  porId(S.planesPeriodo, ppId).unidades.splice(i, 1); guardar(); render();
}
function exportarPlanPeriodo(ppId) {
  const pp = porId(S.planesPeriodo, ppId);
  const per = porId(S.config.periodos, pp.periodoId);
  const datos = {
    areaNombre: nombreArea(pp.areaId), grado: pp.grado, periodoNombre: per?.nombre || '',
    fechas: per ? `${fechaCorta(per.inicio)} – ${fechaCorta(per.fin)}` : '',
    pregunta: obtenerMalla(pp.areaId, pp.grado, false)?.periodos[pp.periodoId]?.pregunta || '', recursos: pp.recursos,
    unidades: pp.unidades.map((u) => ({
      nombre: u.nombre, horas: String(u.horas || ''), estrategias: u.estrategias, producto: u.producto, evaluacion: u.evaluacion,
      fechas: u.desde ? `${fechaCorta(u.desde)}${u.hasta ? ' – ' + fechaCorta(u.hasta) : ''}` : '',
      contenidos: (u.itemIds || []).map((id) => buscarItemMalla(id)?.item).filter(Boolean).map((it) => `• ${it.eje}${it.contenidos ? ': ' + it.contenidos : ''}`).join('\n'),
    })),
  };
  api.exportarWordCurricular('planPeriodo', `Plan de periodo ${datos.areaNombre} ${pp.grado}° ${datos.periodoNombre}`, { config: S.config, datos }).then(resultadoExport);
}

// ---------- Plan de aula ----------
function rutaAula(grupoId, areaId, periodoId) {
  const g = porId(S.grupos, grupoId);
  const items = itemsMalla(areaId, g.grado, periodoId);
  const pp = S.planesPeriodo.find((x) => x.areaId === areaId && +x.grado === +g.grado && x.periodoId === periodoId);
  return items.map((it) => {
    const u = pp?.unidades.find((x) => (x.itemIds || []).includes(it.id));
    return { it, u, clases: clasesDeItem(it.id, grupoId), estado: estadoItem(it.id, grupoId) };
  });
}
function vistaPlanAula(c) {
  if (!S.grupos.length) return '<div class="tarjeta vacio">Primero crea tus grupos.</div>';
  if (!c.grupoId || !porId(S.grupos, c.grupoId)) c.grupoId = [...S.grupos].sort(ordenGrupos)[0].id;
  const areasG = areasDeGrupo(c.grupoId);
  if (areasG.length && !areasG.some((a) => a.id === c.areaId)) c.areaId = areasG[0].id;
  const g = porId(S.grupos, c.grupoId);
  const per = porId(S.config.periodos, c.periodoId);
  if (!per) return filtrosCur(c, { grupo: true, periodo: true }) + '<div class="tarjeta vacio">Configura los periodos académicos.</div>';
  const pa = obtenerPlanAula(c.grupoId, c.areaId, c.periodoId);
  const ruta = rutaAula(c.grupoId, c.areaId, c.periodoId);
  const piar = alumnosDe(c.grupoId).filter((a) => a.piar);
  const desarrollados = ruta.filter((r) => r.estado.t === 'Desarrollado').length;
  const pregunta = obtenerMalla(c.areaId, g.grado, false)?.periodos[c.periodoId]?.pregunta || '';
  const campo = (k, t, ph = '') => `<div class="campo"><label>${esc(t)}${['estrategias', 'evaluacion', 'ajustes'].includes(k) ? botonBanco('ta-aula-' + k) : ''}</label><textarea id="ta-aula-${k}" placeholder="${esc(ph)}" oninput="porId(S.planesAula,'${pa.id}')['${k}']=this.value;guardar()">${esc(pa[k] || '')}</textarea></div>`;
  return `${filtrosCur(c, { grupo: true, periodo: true })}
  <div class="fila" style="justify-content:space-between;margin-bottom:12px">
    <span class="ayuda">${esc(nombreGrupo(g))} · ${alumnosDe(c.grupoId).length} estudiantes · ${esc(intensidadDe(c.areaId, g.grado) || '—')} h/semana · Avance: <b>${desarrollados} de ${ruta.length}</b> ejes desarrollados</span>
    <button class="btn primario" onclick="exportarPlanAula('${pa.id}')">📄 Exportar a Word</button></div>
  ${pregunta ? `<div class="alerta info"><b>Pregunta problematizadora:</b> ${esc(pregunta)}</div>` : ''}
  <div class="tarjeta"><h2>Ruta de aprendizaje del periodo</h2>
    ${ruta.length ? `<table class="tabla"><thead><tr><th>Unidad</th><th>Eje temático</th><th>Fechas previstas</th><th>Clases planeadas</th><th>Estado</th><th></th></tr></thead><tbody>
    ${ruta.map((r) => `<tr>
      <td>${esc(r.u?.nombre || '—')}</td>
      <td><b>${esc(r.it.eje || 'sin nombre')}</b>${r.it.contenidos ? `<br><span class="ayuda">${esc(r.it.contenidos.slice(0, 120))}</span>` : ''}</td>
      <td style="white-space:nowrap">${r.u?.desde ? esc(fechaCorta(r.u.desde)) + (r.u.hasta ? '<br>al ' + esc(fechaCorta(r.u.hasta)) : '') : '—'}</td>
      <td>${r.clases.map((p) => `<a href="#" onclick="editarPlaneacion('${p.id}');return false">${esc(p.titulo || 'Sin título')}</a> <span class="ayuda">${esc(fechaCorta(p.fechaInicio))}</span>`).join('<br>') || '—'}</td>
      <td><span class="chip ${r.estado.c}">${r.estado.t}</span></td>
      <td><button class="btn pequeno" onclick="planearDesdeMalla('${r.it.id}','${c.grupoId}','${c.areaId}','${c.periodoId}')">＋ Planear clase</button></td></tr>`).join('')}
    </tbody></table>` : `<div class="alerta">La malla de ${esc(nombreArea(c.areaId))} ${esc(g.grado)}° está vacía en este periodo. <a href="#" onclick="ui.cur.pestana='malla';ui.cur.grado='${g.grado}';render()">Completa la malla</a>.</div>`}
  </div>
  <div class="tarjeta"><div class="rejilla r2">
    ${campo('caracterizacion', 'Caracterización del grupo', 'Edades, intereses, ritmos de aprendizaje, convivencia, resultados del periodo anterior…')}
    ${campo('estrategias', 'Estrategias metodológicas para este grupo')}
    ${campo('evaluacion', 'Evaluación', 'Criterios e instrumentos para este grupo…')}
    <div>${campo('ajustes', 'Ajustes razonables (PIAR)', 'Ajustes específicos por estudiante…')}
      ${piar.length ? `<div class="ayuda" style="margin-top:-6px">Estudiantes con PIAR: ${piar.map((a) => esc(nombreAlumno(a)) + (a.observaciones ? ` (${esc(a.observaciones)})` : '')).join('; ')}</div>` : ''}</div>
  </div>${campo('observaciones', 'Observaciones y seguimiento')}</div>`;
}
function planearDesdeMalla(itemId, grupoId, areaId, periodoId) {
  const it = buscarItemMalla(itemId).item;
  const ruta = rutaAula(grupoId, areaId, periodoId).find((r) => r.it.id === itemId);
  const hoy = hoyISO();
  const per = porId(S.config.periodos, periodoId);
  let fecha = ruta?.u?.desde && ruta.u.desde > hoy ? ruta.u.desde : hoy;
  if (per && (fecha < per.inicio || fecha > per.fin)) fecha = per.inicio;
  const p = {
    id: uid(), tipo: 'sesion', titulo: it.eje, grupoId, areaId, periodoId, fechaInicio: fecha, fechaFin: fecha,
    estado: 'borrador', enBanco: false, sesiones: [nuevaSesion(fecha)], observaciones: '', mallaItems: [itemId],
    creada: new Date().toISOString(), modificada: new Date().toISOString(),
  };
  CAMPOS_TEXTO.forEach((c) => { p[c.k] = ''; });
  p.criterios = [];
  p.unidad = ruta?.u?.nombre || '';
  p.pregunta = obtenerMalla(areaId, porId(S.grupos, grupoId).grado, false)?.periodos[periodoId]?.pregunta || '';
  aplicarDiversidadGrupo(p);
  copiarDeMalla(p, [itemId], false);
  S.planeaciones.push(p);
  guardar();
  aviso('Clase creada con los referentes de la malla', 'ok');
  editarPlaneacion(p.id);
}
function exportarPlanAula(paId) {
  const pa = porId(S.planesAula, paId);
  const g = porId(S.grupos, pa.grupoId);
  const per = porId(S.config.periodos, pa.periodoId);
  const piar = alumnosDe(pa.grupoId).filter((a) => a.piar);
  const datos = {
    areaNombre: nombreArea(pa.areaId), grupoNombre: nombreGrupo(g), periodoNombre: per?.nombre || '',
    fechas: per ? `${fechaCorta(per.inicio)} – ${fechaCorta(per.fin)}` : '', intensidad: `${intensidadDe(pa.areaId, g.grado) || '—'} h semanales`,
    numEstudiantes: alumnosDe(pa.grupoId).length, pregunta: obtenerMalla(pa.areaId, g.grado, false)?.periodos[pa.periodoId]?.pregunta || '',
    caracterizacion: pa.caracterizacion, estrategias: pa.estrategias, evaluacion: pa.evaluacion, observaciones: pa.observaciones,
    piar: [piar.length ? `Estudiantes con PIAR: ${piar.map((a) => nombreAlumno(a) + (a.observaciones ? ` (${a.observaciones})` : '')).join('; ')}` : '', pa.ajustes].filter(Boolean).join('\n'),
    ruta: rutaAula(pa.grupoId, pa.areaId, pa.periodoId).map((r) => ({
      unidad: r.u?.nombre || '', eje: r.it.eje, contenidos: r.it.contenidos,
      desempenos: [r.it.desempenoSaber && 'Saber: ' + r.it.desempenoSaber, r.it.desempenoHacer && 'Hacer: ' + r.it.desempenoHacer, r.it.desempenoSer && 'Ser: ' + r.it.desempenoSer].filter(Boolean).join('\n'),
      fechas: r.u?.desde ? `${fechaCorta(r.u.desde)}${r.u.hasta ? ' – ' + fechaCorta(r.u.hasta) : ''}` : '',
      clases: r.clases.map((p) => `${fechaCorta(p.fechaInicio)}: ${p.titulo || 'Sin título'}`).join('\n'), estado: r.estado.t, evidencias: r.it.evidencias,
    })),
  };
  api.exportarWordCurricular('planAula', `Plan de aula ${datos.areaNombre} ${g.nombre} ${datos.periodoNombre}`, { config: S.config, datos }).then(resultadoExport);
}

// ---------- Conexión con la planeación de clase ----------
const CAMPOS_DESDE_MALLA = ['estandares', 'dba', 'competencias', 'desempenoSaber', 'desempenoHacer', 'desempenoSer', 'evidencias'];
function copiarDeMalla(p, itemIds, reemplazar) {
  const items = itemIds.map((id) => buscarItemMalla(id)?.item).filter(Boolean);
  for (const k of CAMPOS_DESDE_MALLA) {
    const textos = [...new Set(items.map((it) => (it[k] || '').trim()).filter(Boolean))];
    if (!textos.length) continue;
    if (reemplazar || !p[k]) p[k] = textos.join('\n');
    else { const faltan = textos.filter((t) => !p[k].includes(t)); if (faltan.length) p[k] = [p[k], ...faltan].join('\n'); }
  }
}
function tarjetaMallaEnEditor(p) {
  const items = (p.mallaItems || []).map((id) => buscarItemMalla(id)?.item).filter(Boolean);
  return `<div class="tarjeta"><div class="cabecera"><h2 style="margin:0">🧩 Contenidos de la malla curricular</h2>
    <button class="btn pequeno primario" onclick="dialogoElegirMalla('${p.id}')">${items.length ? 'Cambiar' : 'Elegir de la malla'}</button></div>
    ${items.length ? items.map((it) => `<span class="chip terminada" style="margin:2px">${esc(it.eje || 'sin nombre')}</span>`).join('') : '<p class="ayuda" style="margin:0">Vincula esta clase a uno o varios ejes de la malla: se copian sus estándares, DBA, competencias y desempeños, y el plan de aula registra el avance.</p>'}
  </div>`;
}
function dialogoElegirMalla(planId) {
  const p = porId(S.planeaciones, planId);
  const g = porId(S.grupos, p.grupoId);
  if (!p.areaId || !g) return aviso('Primero elige el grupo y el área de la planeación', 'error');
  const m = obtenerMalla(p.areaId, g.grado, false);
  const sel = new Set(p.mallaItems || []);
  const hay = m && Object.values(m.periodos).some((x) => x.items.length);
  abrirModal(`<h2>Contenidos de la malla – ${esc(nombreArea(p.areaId))} ${esc(g.grado)}°</h2>
    ${hay ? S.config.periodos.filter((per) => m.periodos[per.id]?.items.length).map((per) => `<h3>${esc(per.nombre)}${per.id === p.periodoId ? ' <span class="chip sesion">periodo de la clase</span>' : ''}</h3>
      ${m.periodos[per.id].items.map((it) => `<label style="font-weight:normal;color:inherit;font-size:14px;margin:6px 0"><input type="checkbox" class="m-item" value="${it.id}" ${sel.has(it.id) ? 'checked' : ''}>
        <b>${esc(it.eje || 'sin nombre')}</b> ${clasesDeItem(it.id, p.grupoId).filter((x) => x.id !== p.id).length ? '<span class="chip">ya tiene clases en este grupo</span>' : ''}
        ${it.contenidos ? `<br><span class="ayuda" style="margin-left:22px">${esc(it.contenidos.slice(0, 150))}</span>` : ''}</label>`).join('')}`).join('')
      : `<div class="alerta">La malla de este grado está vacía. Complétala en <b>Planeación curricular → Malla curricular</b>.</div>`}
    ${hay ? `<div class="campo" style="margin-top:12px"><label><input type="checkbox" id="m-copiar" checked> Copiar estándares, DBA, competencias, desempeños y evidencias a la planeación</label>
      <label><input type="checkbox" id="m-reemplazar"> Reemplazar lo que ya está escrito (si no, solo se agrega lo que falta)</label></div>` : ''}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button>${hay ? `<button class="btn primario" onclick="aplicarMalla('${planId}')">Aplicar</button>` : `<button class="btn primario" onclick="cerrarModal();ui.cur={...(ui.cur||{}),pestana:'malla',areaId:'${p.areaId}',grado:'${g.grado}'};ir('curricular')">Ir a la malla</button>`}</div>`, { ancho: true });
}
function aplicarMalla(planId) {
  const p = porId(S.planeaciones, planId);
  p.mallaItems = [...document.querySelectorAll('.m-item:checked')].map((x) => x.value);
  if (document.getElementById('m-copiar').checked) copiarDeMalla(p, p.mallaItems, document.getElementById('m-reemplazar').checked);
  tocarPlan(p); cerrarModal(); render();
  aviso('Planeación vinculada a la malla', 'ok');
}

// ---------- IA curricular ----------
function sinClaveIA() { return sinIA(); }
function iaMalla(mId, perId) {
  if (sinClaveIA()) return;
  const m = porId(S.mallas, mId);
  const per = porId(S.config.periodos, perId);
  abrirModal(`<h2>✨ Sugerir ejes para ${esc(per.nombre)}</h2>
    <p class="ayuda">${esc(nombreArea(m.areaId))} · ${esc(m.grado)}°. Se agregarán ejes nuevos a la malla; revísalos y ajústalos al PEI de tu institución.</p>
    <div class="rejilla r2"><div class="campo"><label>Número de ejes temáticos</label><input type="number" id="m-n" min="1" max="8" value="3"></div></div>
    <div class="campo"><label>Indicaciones (opcional)</label><textarea id="m-extra" placeholder="Ej.: temas que deben estar, enfoque del PEI, contexto rural…"></textarea></div>
    <div id="m-ia-error"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn ia" id="m-ia-btn" onclick="ejecutarIAMalla('${mId}','${perId}')">✨ Generar</button></div>`);
}
async function ejecutarIAMalla(mId, perId) {
  const m = porId(S.mallas, mId);
  const per = porId(S.config.periodos, perId);
  const idx = S.config.periodos.indexOf(per);
  const otros = S.config.periodos.map((x) => `${x.nombre}: ${(m.periodos[x.id]?.items || []).map((i) => i.eje).filter(Boolean).join(', ') || '(vacío)'}`).join('\n');
  const extra = document.getElementById('m-extra').value.trim();
  const contexto = [`Área: ${nombreArea(m.areaId)}`, `Grado: ${m.grado}° (Colombia)`, `Periodo: ${per.nombre} (${idx + 1} de ${S.config.periodos.length})`,
    `Intensidad: ${intensidadDe(m.areaId, m.grado) || 'no indicada'} horas semanales`, `Ejes ya definidos en la malla del año:\n${otros}`,
    extra ? `Indicaciones del docente: ${extra}` : '',
    textoReferentes(areaReferenteDe(m.areaId), bandaDeGrado(m.grado)) ? `Referentes oficiales del MEN para este grado (en "estandares" copia textualmente los pertinentes; no inventes estándares):\n${textoReferentes(areaReferenteDe(m.areaId), bandaDeGrado(m.grado))}` : ''].filter(Boolean).join('\n');
  const btn = document.getElementById('m-ia-btn');
  btn.disabled = true; btn.innerHTML = '<span class="cargando"></span> Generando…';
  const r = await api.sugerirIA({ ia: S.config.ia, contexto, tarea: 'malla', numItems: Math.min(8, Math.max(1, +document.getElementById('m-n').value || 3)) });
  if (!document.getElementById('m-ia-btn')) return;
  if (!r.ok || !Array.isArray(r.datos?.items)) {
    btn.disabled = false; btn.textContent = '✨ Reintentar';
    document.getElementById('m-ia-error').innerHTML = `<div class="alerta error">${esc(r.error || 'La respuesta no tuvo el formato esperado.')}</div>`;
    return;
  }
  const pm = periodoMalla(m, perId);
  if (!pm.pregunta && r.datos.pregunta) pm.pregunta = String(r.datos.pregunta);
  for (const d of r.datos.items) {
    const it = nuevoItem();
    it.eje = String(d.eje || ''); it.horas = d.horas ? String(d.horas) : '';
    CAMPOS_ITEM.forEach((c) => { if (d[c.k]) it[c.k] = String(d[c.k]).trim(); });
    pm.items.push(it);
  }
  guardar(); cerrarModal(); render();
  aviso(`Se agregaron ${r.datos.items.length} eje(s). Revísalos y ajústalos.`, 'ok');
}
function iaPlanArea(id) {
  if (sinClaveIA()) return;
  const p = porId(S.planesArea, id);
  const secciones = SECCIONES_AREA.filter((s) => !s.k.startsWith('__'));
  abrirModal(`<h2>✨ Borrador del plan de área</h2>
    <p class="ayuda">Se llenarán solo las secciones vacías que marques. Es un punto de partida: ajústalo al PEI y al diagnóstico real de tu institución.</p>
    ${secciones.map((s) => `<label style="font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" class="m-sec" value="${s.k}" ${!p[s.k] ? 'checked' : 'disabled'}> ${s.t}${p[s.k] ? ' <span class="ayuda">(ya tiene contenido)</span>' : ''}</label>`).join('')}
    <div class="campo" style="margin-top:10px"><label>Contexto de la institución (opcional)</label><textarea id="m-extra" placeholder="Ej.: institución rural, modelo pedagógico desarrollista, énfasis agropecuario…"></textarea></div>
    <div id="m-ia-error"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn ia" id="m-ia-btn" onclick="ejecutarIAPlanArea('${id}')">✨ Generar</button></div>`);
}
async function ejecutarIAPlanArea(id) {
  const p = porId(S.planesArea, id);
  const campos = [...document.querySelectorAll('.m-sec:checked')].map((x) => x.value);
  if (!campos.length) return aviso('Selecciona al menos una sección', 'error');
  const extra = document.getElementById('m-extra').value.trim();
  const contexto = [`Área: ${nombreArea(p.areaId)}`, p.asignaturas ? `Asignaturas: ${p.asignaturas}` : '', `Grados: ${gradosDeArea(p.areaId).map((g) => g + '°').join(', ')} (básica secundaria, Colombia)`,
    S.config.municipio ? `Municipio: ${S.config.municipio}` : '', extra ? `Contexto: ${extra}` : ''].filter(Boolean).join('\n');
  const btn = document.getElementById('m-ia-btn');
  btn.disabled = true; btn.innerHTML = '<span class="cargando"></span> Generando… (puede tardar un minuto)';
  const r = await api.sugerirIA({ ia: S.config.ia, contexto, tarea: 'planArea', campos });
  if (!document.getElementById('m-ia-btn')) return;
  if (!r.ok) {
    btn.disabled = false; btn.textContent = '✨ Reintentar';
    document.getElementById('m-ia-error').innerHTML = `<div class="alerta error">${esc(r.error)}</div>`;
    return;
  }
  let n = 0;
  for (const k of campos) if (typeof r.datos[k] === 'string' && r.datos[k].trim() && !p[k]) { p[k] = r.datos[k].trim(); n++; }
  guardar(); cerrarModal(); render();
  aviso(`Se redactaron ${n} sección(es). Revísalas y ajústalas.`, 'ok');
}
