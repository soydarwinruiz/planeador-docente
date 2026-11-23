// ================= Informe de cierre de periodo para coordinación =================

function dialogoInformeCierre() {
  const per = periodoDeFecha(hoyISO()) || S.config.periodos[0];
  const grupos = [...S.grupos].sort(ordenGrupos);
  const guardado = (S.informes || {})[per?.id] || {};
  abrirModal(`<h2>📑 Informe de cierre de periodo</h2>
    <p class="ayuda">Reúne en un solo Word lo que coordinación suele pedir: resultados por grupo y área, estudiantes en riesgo, planes de apoyo, avance de la malla, asistencia, inclusión y comunicación con las familias. Todo sale de lo que ya registraste.</p>
    <div class="rejilla r2">
      <div class="campo"><label>Periodo</label><select id="inf-per" onchange="cargarTextosInforme(this.value)">${opcionesPeriodos(per?.id || '')}</select></div>
      <div class="campo"><label>Grupos</label><div class="fila">${grupos.map((g) => `<label class="chip" style="font-weight:normal;cursor:pointer;font-size:13px;padding:4px 10px"><input type="checkbox" class="inf-g" value="${g.id}" checked> ${esc(g.nombre)}</label>`).join('')}</div></div>
    </div>
    <div class="campo"><label>Logros del periodo</label><textarea id="inf-logros" rows="3" placeholder="Ej.: Se desarrollaron los ejes previstos; buen desempeño en…">${esc(guardado.logros || '')}</textarea></div>
    <div class="campo"><label>Dificultades</label><textarea id="inf-dificultades" rows="3" placeholder="Ej.: Pérdida de clases por actividades institucionales; bajo hábito de estudio en…">${esc(guardado.dificultades || '')}</textarea></div>
    <div class="campo"><label>Propuestas y compromisos</label><textarea id="inf-propuestas" rows="3" placeholder="Ej.: Reforzar comprensión lectora; citar a acudientes de estudiantes en riesgo…">${esc(guardado.propuestas || '')}</textarea></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="generarInformeCierre()">📄 Generar Word</button></div>`, { ancho: true });
}
function cargarTextosInforme(perId) {
  const g = (S.informes || {})[perId] || {};
  ['logros', 'dificultades', 'propuestas'].forEach((k) => { document.getElementById('inf-' + k).value = g[k] || ''; });
}

function datosInformeCierre(perId, gruposIds) {
  const per = porId(S.config.periodos, perId);
  const grupos = gruposIds.map((id) => porId(S.grupos, id)).filter(Boolean).sort(ordenGrupos);
  const combos = grupos.flatMap((g) => areasDeGrupo(g.id).map((a) => ({ g, a })));
  const D = S.config.desempenos.map((d) => d.nombre);
  // 1. Resultados académicos
  const resultados = combos.map(({ g, a }) => {
    const pl = buscarPlanilla(g.id, a.id, perId);
    const notas = pl ? alumnosDe(g.id).map((al) => notaFinal(pl, al.id)).filter((n) => n != null) : [];
    const cuenta = Object.fromEntries(D.map((d) => [d, notas.filter((n) => desempeno(n) === d).length]));
    const prom = notas.length ? notas.reduce((x, y) => x + y, 0) / notas.length : null;
    const aprob = notas.filter((n) => !enBajo(n)).length;
    return [nombreGrupo(g), a.nombre, String(alumnosDe(g.id).length), fmtNota(prom), ...D.map((d) => String(cuenta[d])), notas.length ? Math.round((aprob / notas.length) * 100) + '%' : '—'];
  });
  // 2. Estudiantes en bajo o en riesgo
  const riesgo = [];
  for (const g of grupos) for (const al of alumnosDe(g.id)) {
    const areas = areasDeGrupo(g.id).map((a) => ({ a, r: riesgoAlumno(g.id, a.id, perId, al.id) })).filter((x) => x.r.estado === 'rojo' || (x.r.nota != null && enBajo(x.r.nota)));
    if (!areas.length) continue;
    const asis = asistenciaAlumno(al.id, g.id, per);
    const planes = S.planesApoyo.filter((p) => p.alumnoId === al.id && p.periodoId === perId);
    const com = (S.comunicadosEnviados || []).filter((x) => x.alumnoId === al.id && per && x.fecha >= per.inicio && x.fecha <= (per.fin || '9999'));
    riesgo.push([tipoTitulo(nombreAlumno(al)) + (al.piar ? ' (PIAR)' : ''), g.nombre, areas.map((x) => `${x.a.nombre}: ${fmtNota(x.r.nota)}`).join('\n'), asis ? asis.pct + '%' : '—',
      planes.length ? planes.map((p) => ESTADOS_APOYO[p.estado]).join(', ') : 'Sin plan', com.length ? `Sí (${com.length})` : 'No']);
  }
  // 3. Planes de apoyo
  const planesPer = S.planesApoyo.filter((p) => p.periodoId === perId && gruposIds.includes(p.grupoId));
  const apoyo = Object.keys(ESTADOS_APOYO).map((k) => [ESTADOS_APOYO[k], String(planesPer.filter((p) => p.estado === k).length)]);
  // 4. Avance de la malla
  const malla = combos.map(({ g, a }) => {
    const items = itemsMalla(a.id, g.grado, perId);
    const est = items.map((it) => estadoItem(it.id, g.id).t);
    const n = (t) => est.filter((x) => x === t).length;
    return [nombreGrupo(g), a.nombre, String(items.length), String(n('Desarrollado')), String(n('Planeado')), String(n('Sin planear')), items.length ? Math.round((n('Desarrollado') / items.length) * 100) + '%' : '—',
      items.filter((it, i) => est[i] !== 'Desarrollado').map((it) => it.eje).filter(Boolean).join('; ')];
  }).filter((f) => f[2] !== '0');
  // 5. Asistencia
  const asistencia = grupos.map((g) => {
    const al = alumnosDe(g.id);
    const datos = al.map((a) => asistenciaAlumno(a.id, g.id, per)).filter(Boolean);
    const dias = new Set(); Object.entries(S.asistencia).filter(([k]) => k.startsWith(g.id + '|')).forEach(([, reg]) => Object.keys(reg).forEach((f) => { if (!per || (f >= per.inicio && f <= per.fin)) dias.add(f); }));
    const muchas = al.filter((a) => { const x = asistenciaAlumno(a.id, g.id, per); return x && x.faltas >= umbralFaltas(); });
    return [nombreGrupo(g), String(dias.size), datos.length ? Math.round(datos.reduce((s, x) => s + x.pct, 0) / datos.length) + '%' : '—', muchas.length ? muchas.map((a) => `${tipoTitulo(nombreAlumno(a))} (${asistenciaAlumno(a.id, g.id, per).faltas})`).join(', ') : 'Ninguno'];
  });
  // 6. Inclusión
  const inclusion = grupos.flatMap((g) => alumnosDe(g.id).filter((a) => a.piar).map((a) => {
    const p = piarDe(a.id);
    const ajustes = p ? p.ajustes.filter((x) => (x.ajustes || '').trim()).map((x) => nombreArea(x.areaId)) : [];
    const notas = areasDeGrupo(g.id).map((ar) => { const pl = buscarPlanilla(g.id, ar.id, perId); const n = pl ? notaFinal(pl, a.id) : null; return n == null ? null : `${ar.nombre}: ${fmtNota(n)}`; }).filter(Boolean);
    return [tipoTitulo(nombreAlumno(a)), g.nombre, p ? 'Sí' : 'No', ajustes.join(', ') || '—', notas.join('\n') || '—'];
  }));
  // 7. Familias
  const comPer = (S.comunicadosEnviados || []).filter((x) => per && x.fecha >= per.inicio && x.fecha <= (per.fin || '9999') && gruposIds.includes(porId(S.alumnos, x.alumnoId)?.grupoId));
  const porTipo = {};
  comPer.forEach((x) => { const t = (plantillasComunicado().find((p) => p.id === x.tipo) || {}).nombre || x.tipo; (porTipo[t] ||= { total: 0, medios: {} }).total++; porTipo[t].medios[x.medio] = (porTipo[t].medios[x.medio] || 0) + 1; });
  const familias = Object.entries(porTipo).map(([t, v]) => [t, String(v.total), Object.entries(v.medios).map(([m, n]) => `${m}: ${n}`).join(', ')]);
  // 8. Gestión de aula
  const enPer = (f) => per && f && f >= per.inicio && f <= per.fin;
  const planeaciones = S.planeaciones.filter((p) => gruposIds.includes(p.grupoId) && (p.periodoId === perId || enPer(p.fechaInicio)));
  const diario = (S.diario || []).filter((d) => gruposIds.includes(d.grupoId) && enPer(d.fecha));
  const pruebas = (S.pruebas || []).filter((p) => gruposIds.includes(p.grupoId) && (p.periodoId === perId) && Object.keys(p.respuestas || {}).length);
  const gestion = [['Planeaciones de clase', String(planeaciones.length), `${planeaciones.filter((p) => p.estado === 'terminada').length} terminadas`],
    ['Registros en el diario de campo', String(diario.length), diario.filter((d) => d.pendiente && !d.retomado).length ? `${diario.filter((d) => d.pendiente && !d.retomado).length} pendientes sin retomar` : ''],
    ['Pruebas aplicadas', String(pruebas.length), pruebas.map((p) => p.titulo).join('; ')]];
  return { per, grupos, resultados, riesgo, apoyo, planesPer, malla, asistencia, inclusion, familias, gestion, D };
}

async function generarInformeCierre() {
  const perId = document.getElementById('inf-per').value;
  const gruposIds = [...document.querySelectorAll('.inf-g:checked')].map((x) => x.value);
  if (!gruposIds.length) return aviso('Elige al menos un grupo', 'error');
  const textos = { logros: document.getElementById('inf-logros').value.trim(), dificultades: document.getElementById('inf-dificultades').value.trim(), propuestas: document.getElementById('inf-propuestas').value.trim() };
  (S.informes ||= {})[perId] = textos; guardar();
  const d = datosInformeCierre(perId, gruposIds);
  const secciones = [
    { titulo: 'Resultados académicos por grupo y área', tabla: { columnas: [{ t: 'Grupo', ancho: 10 }, { t: 'Área', ancho: 20 }, { t: 'Est.', ancho: 6 }, { t: 'Promedio', ancho: 9 }, ...d.D.map((x) => ({ t: x, ancho: 9 })), { t: '% aprobación', ancho: 10 }], filas: d.resultados }, vacio: 'Sin notas registradas en el periodo.' },
    { titulo: 'Estudiantes con desempeño bajo o en riesgo', tabla: { columnas: [{ t: 'Estudiante', ancho: 24 }, { t: 'Grupo', ancho: 8 }, { t: 'Áreas (nota)', ancho: 26 }, { t: 'Asistencia', ancho: 10 }, { t: 'Plan de apoyo', ancho: 18 }, { t: 'Acudiente informado', ancho: 14 }], filas: d.riesgo }, vacio: 'Ningún estudiante en desempeño bajo o en riesgo alto.' },
    { titulo: 'Planes de apoyo y mejoramiento', texto: d.planesPer.length ? `Se asignaron ${d.planesPer.length} plan(es) de apoyo en el periodo.` : 'No se asignaron planes de apoyo en el periodo.', tabla: d.planesPer.length ? { columnas: [{ t: 'Estado', ancho: 60 }, { t: 'Cantidad', ancho: 40 }], filas: d.apoyo } : null },
    { titulo: 'Avance de la malla curricular', tabla: { columnas: [{ t: 'Grupo', ancho: 9 }, { t: 'Área', ancho: 16 }, { t: 'Ejes', ancho: 7 }, { t: 'Desarrollados', ancho: 11 }, { t: 'Planeados', ancho: 10 }, { t: 'Sin planear', ancho: 10 }, { t: 'Avance', ancho: 8 }, { t: 'Pendientes', ancho: 29 }], filas: d.malla }, vacio: 'No hay ejes registrados en la malla para este periodo.' },
    { titulo: 'Asistencia', tabla: { columnas: [{ t: 'Grupo', ancho: 12 }, { t: 'Clases registradas', ancho: 14 }, { t: 'Asistencia promedio', ancho: 14 }, { t: `Estudiantes con ${umbralFaltas()} o más faltas`, ancho: 60 }], filas: d.asistencia } },
    { titulo: 'Inclusión (PIAR – Decreto 1421 de 2017)', tabla: { columnas: [{ t: 'Estudiante', ancho: 26 }, { t: 'Grupo', ancho: 9 }, { t: 'PIAR elaborado', ancho: 11 }, { t: 'Áreas con ajustes', ancho: 26 }, { t: 'Notas del periodo', ancho: 28 }], filas: d.inclusion }, vacio: 'No hay estudiantes con PIAR en los grupos seleccionados.' },
    { titulo: 'Comunicación con las familias', tabla: { columnas: [{ t: 'Comunicado', ancho: 40 }, { t: 'Cantidad', ancho: 15 }, { t: 'Medio', ancho: 45 }], filas: d.familias }, vacio: 'No se registraron comunicados en el periodo.' },
    { titulo: 'Gestión de aula', tabla: { columnas: [{ t: 'Aspecto', ancho: 35 }, { t: 'Cantidad', ancho: 15 }, { t: 'Detalle', ancho: 50 }], filas: d.gestion } },
    { titulo: 'Logros, dificultades y propuestas del docente', texto: [textos.logros ? 'Logros:\n' + textos.logros : '', textos.dificultades ? '\nDificultades:\n' + textos.dificultades : '', textos.propuestas ? '\nPropuestas y compromisos:\n' + textos.propuestas : ''].filter(Boolean).join('\n') || '(Sin observaciones)' },
  ];
  const r = await api.exportarWordCurricular('informe', `Informe de cierre ${d.per?.nombre || ''} ${S.config.docente || ''}`.trim(), {
    config: S.config, titulo: 'Informe de cierre de periodo', subtitulo: `${d.per?.nombre || ''} · Año lectivo ${S.config.anio}`, horizontal: true,
    ident: [['Docente', S.config.docente || ''], ['Fecha', fechaCorta(hoyISO())], ['Grupos', d.grupos.map((g) => g.nombre).join(', ')], ['Áreas', [...new Set(d.grupos.flatMap((g) => areasDeGrupo(g.id).map((a) => a.nombre)))].join(', ')]],
    secciones, firmas: [[S.config.docente, 'Docente'], [S.config.coordinador || '', 'Coordinador(a)']],
  });
  if (r.ok) { cerrarModal(); aviso('Informe de cierre creado', 'ok'); } else if (r.error) aviso(r.error, 'error');
}
