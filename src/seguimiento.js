// ================= Seguimiento del estudiante (dashboard) =================

const COLOR_SERIE = '#2e75b6';

function promedioPeriodoAlumno(alumnoId, grupoId, periodoId, areas = areasDeGrupo(grupoId)) {
  const notas = areas.map((a) => { const pl = buscarPlanilla(grupoId, a.id, periodoId); return pl ? notaFinal(pl, alumnoId) : null; }).filter((n) => n != null);
  return notas.length ? notas.reduce((x, y) => x + y, 0) / notas.length : null;
}
function asistenciaAlumno(alumnoId, grupoId, periodo) {
  let presentes = 0, total = 0;
  for (const [k, reg] of Object.entries(S.asistencia)) {
    if (!k.startsWith(grupoId + '|')) continue;
    for (const [f, dia] of Object.entries(reg)) {
      if (periodo && (f < periodo.inicio || f > periodo.fin)) continue;
      const e = dia[alumnoId];
      if (!e) continue;
      total++;
      if (e === 'P' || e === 'T') presentes++;
    }
  }
  return total ? { pct: Math.round((presentes / total) * 100), total, faltas: total - presentes } : null;
}
function periodoActual() { return periodoDeFecha(hoyISO()) || S.config.periodos.filter((p) => p.inicio && p.inicio <= hoyISO()).pop() || S.config.periodos[0]; }

// ---------- Gráficas (SVG) ----------
function graficaLinea(puntos, { ref, titulo }) {
  const W = 620, H = 230, m = { t: 18, r: 24, b: 34, l: 40 };
  const min = +S.config.escalaMin, max = +S.config.escalaMax;
  const pad = 34;
  const x = (i) => m.l + pad + (puntos.length === 1 ? (W - m.l - m.r - 2 * pad) / 2 : (i * (W - m.l - m.r - 2 * pad)) / (puntos.length - 1));
  const y = (v) => m.t + (1 - (v - min) / (max - min)) * (H - m.t - m.b);
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const validos = puntos.map((p, i) => ({ ...p, i })).filter((p) => p.v != null);
  const ruta = validos.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(titulo)}" style="max-width:${W}px;font-family:inherit">
    ${ticks.map((t) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" style="stroke:var(--borde)"/><text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" style="fill:var(--suave)">${fmtNota(t)}</text>`).join('')}
    ${ref != null ? `<line x1="${m.l}" x2="${W - m.r}" y1="${y(ref)}" y2="${y(ref)}" stroke="#c62828" stroke-dasharray="4 4" stroke-width="1"/>
      <text x="${W - m.r}" y="${y(ref) - 5}" text-anchor="end" font-size="11" style="fill:var(--suave)">Aprobación ${fmtNota(ref)}</text>` : ''}
    ${puntos.map((p, i) => `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" font-size="11" style="fill:var(--suave)">${esc(p.etiqueta)}</text>`).join('')}
    ${ruta ? `<path d="${ruta}" fill="none" stroke="${COLOR_SERIE}" stroke-width="2" stroke-linejoin="round"/>` : ''}
    ${validos.map((p) => `<g><circle cx="${x(p.i)}" cy="${y(p.v)}" r="14" fill="transparent"><title>${esc(p.nombre)}: ${fmtNota(p.v)} (${desempeno(p.v)})</title></circle>
      <circle cx="${x(p.i)}" cy="${y(p.v)}" r="4.5" fill="${COLOR_SERIE}" style="stroke:var(--superficie)" stroke-width="2" pointer-events="none"/>
      <text x="${x(p.i)}" y="${y(p.v) - 10}" text-anchor="middle" font-size="12" font-weight="600" style="fill:var(--texto)" pointer-events="none">${fmtNota(p.v)}</text></g>`).join('')}
    ${!validos.length ? `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="13" style="fill:var(--suave)">Aún no hay notas registradas</text>` : ''}
  </svg>`;
}
function graficaBarras(filas, { ref, min: minO, max: maxO, fmt = fmtNota, etiquetaRef = 'Aprobación' }) {
  // filas: [{nombre, v, detalle}] barras horizontales
  const W = 620, fila = 34, m = { l: 190, r: 56, t: 6 };
  const H = m.t + filas.length * fila + 22;
  const min = minO ?? +S.config.escalaMin, max = maxO ?? +S.config.escalaMax;
  const ancho = (v) => ((v - min) / (max - min)) * (W - m.l - m.r);
  const xRef = m.l + ancho(ref);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Promedio por componente" style="max-width:${W}px;font-family:inherit">
    ${filas.map((f, i) => {
      const yy = m.t + i * fila;
      const w = f.v == null ? 0 : Math.max(4, ancho(f.v));
      return `<g><text x="${m.l - 10}" y="${yy + 21}" text-anchor="end" font-size="12" style="fill:var(--texto)">${esc(f.nombre.length > 28 ? f.nombre.slice(0, 27) + '…' : f.nombre)}</text>
        <rect x="${m.l}" y="${yy + 8}" width="${W - m.l - m.r}" height="18" fill="transparent"><title>${esc(f.nombre)}: ${f.v == null ? 'sin notas' : fmt(f.v)}${f.detalle ? ' · ' + esc(f.detalle) : ''}</title></rect>
        ${f.v != null ? `<rect x="${m.l}" y="${yy + 8}" width="${w}" height="18" rx="4" fill="${COLOR_SERIE}" pointer-events="none"/>
        <text x="${m.l + w + 6}" y="${yy + 21}" font-size="12" font-weight="600" style="fill:var(--texto)" pointer-events="none">${fmt(f.v)}</text>`
        : `<text x="${m.l}" y="${yy + 21}" font-size="12" style="fill:var(--suave)">sin notas</text>`}</g>`;
    }).join('')}
    <line x1="${xRef}" x2="${xRef}" y1="${m.t}" y2="${H - 18}" stroke="#c62828" stroke-dasharray="4 4"/>
    <text x="${xRef}" y="${H - 4}" text-anchor="middle" font-size="11" style="fill:var(--suave)">${esc(etiquetaRef)} ${fmt(ref)}</text>
  </svg>`;
}
function tarjetaDato(valor, etiqueta, extra = '') {
  return `<div class="estadistica"><div class="num">${valor}</div><div class="eti">${etiqueta}</div>${extra}</div>`;
}

// ---------- Vista ----------
RENDERS.seguimiento = () => {
  const c = ui.seg || (ui.seg = { grupoId: '', alumnoId: '', areaId: '', periodoId: '' });
  if (!S.grupos.length) return `<h1>Seguimiento del estudiante</h1><div class="tarjeta vacio"><div class="grande">📈</div>Primero crea tus grupos y estudiantes.</div>`;
  if (!c.grupoId || !porId(S.grupos, c.grupoId)) c.grupoId = [...S.grupos].sort(ordenGrupos)[0].id;
  if (!c.periodoId) c.periodoId = periodoActual()?.id || '';
  const alumnos = alumnosDe(c.grupoId);
  if (c.alumnoId && !alumnos.some((a) => a.id === c.alumnoId)) c.alumnoId = '';
  return `
  <div class="cabecera"><div><h1>Seguimiento del estudiante</h1><p class="sub">Progreso académico y asistencia a lo largo de los periodos.</p></div></div>
  <div class="filtros tarjeta">
    <div><label>Grupo</label><select onchange="ui.seg.grupoId=this.value;ui.seg.alumnoId='';render()">${opcionesGrupos(c.grupoId)}</select></div>
    <div style="min-width:260px"><label>Estudiante</label><select onchange="ui.seg.alumnoId=this.value;render()"><option value="">— Resumen del grupo —</option>${alumnos.map((a) => `<option value="${a.id}" ${a.id === c.alumnoId ? 'selected' : ''}>${esc(nombreAlumno(a))}</option>`).join('')}</select></div>
    <div><label>Periodo</label><select onchange="ui.seg.periodoId=this.value;render()">${opcionesPeriodos(c.periodoId)}</select></div>
    ${c.alumnoId ? `<div style="margin-left:auto"><button class="btn" onclick="moverAlumnoSeg(-1)">◀</button> <button class="btn" onclick="moverAlumnoSeg(1)">▶</button></div>` : ''}
  </div>
  ${c.alumnoId ? vistaAlumno(c) : vistaGrupoSeg(c)}`;
};
function moverAlumnoSeg(d) {
  const lista = alumnosDe(ui.seg.grupoId);
  const i = lista.findIndex((a) => a.id === ui.seg.alumnoId);
  const sig = lista[(i + d + lista.length) % lista.length];
  if (sig) { ui.seg.alumnoId = sig.id; render(); }
}

function vistaGrupoSeg(c) {
  const areas = areasDeGrupo(c.grupoId);
  const per = porId(S.config.periodos, c.periodoId);
  const filas = alumnosDe(c.grupoId).map((a) => {
    const notas = areas.map((ar) => { const pl = buscarPlanilla(c.grupoId, ar.id, c.periodoId); return pl ? notaFinal(pl, a.id) : null; });
    const validas = notas.filter((n) => n != null);
    const prom = validas.length ? validas.reduce((x, y) => x + y, 0) / validas.length : null;
    const bajas = notas.filter((n) => n != null && redondear(n) < +S.config.notaAprobacion).length;
    return { a, notas, prom, bajas, asis: asistenciaAlumno(a.id, c.grupoId, per) };
  });
  const conProm = filas.filter((f) => f.prom != null);
  const promGrupo = conProm.length ? conProm.reduce((s, f) => s + f.prom, 0) / conProm.length : null;
  const enRiesgo = filas.filter((f) => f.bajas > 0 || (f.asis && f.asis.pct < 80));
  return `
  <div class="estadisticas">
    ${tarjetaDato(fmtNota(promGrupo), 'Promedio del grupo', chipDesempeno(promGrupo))}
    ${tarjetaDato(filas.length, 'Estudiantes')}
    ${tarjetaDato(enRiesgo.length, 'Requieren atención', '<div class="ayuda">Alguna área en Bajo o asistencia &lt; 80%</div>')}
    ${tarjetaDato(conProm.filter((f) => desempeno(f.prom) === S.config.desempenos[S.config.desempenos.length - 1].nombre).length, `En desempeño ${S.config.desempenos[S.config.desempenos.length - 1].nombre}`)}
  </div>
  ${filas.length ? `<div class="envoltura-tabla"><table class="tabla planilla"><thead><tr><th class="alumno">Estudiante</th>
    ${areas.map((ar) => `<th class="num">${esc(ar.abreviatura || ar.nombre)}</th>`).join('')}<th class="num">Promedio</th><th>Desempeño</th><th class="num">Asistencia</th><th></th></tr></thead><tbody>
    ${filas.sort((x, y) => (y.bajas - x.bajas) || ((x.prom ?? 99) - (y.prom ?? 99))).map((f) => `<tr>
      <td class="alumno"><a href="#" onclick="ui.seg.alumnoId='${f.a.id}';render();return false">${esc(nombreAlumno(f.a))}</a> ${f.a.piar ? '<span class="chip piar">PIAR</span>' : ''}</td>
      ${f.notas.map((n) => `<td class="prom ${claseNota(n)}">${fmtNota(n)}</td>`).join('')}
      <td class="final ${claseNota(f.prom)}">${fmtNota(f.prom)}</td><td>${chipDesempeno(f.prom)}</td>
      <td class="num ${f.asis && f.asis.pct < 80 ? 'bajo' : ''}">${f.asis ? f.asis.pct + '%' : '—'}</td>
      <td>${f.bajas ? `<span class="chip Bajo">⚠ ${f.bajas} área(s) en bajo</span>` : ''}</td></tr>`).join('')}
  </tbody></table></div>
  <p class="ayuda">Haz clic en un estudiante para ver su progreso detallado. Ordenado: primero quienes requieren atención.</p>` : '<div class="tarjeta vacio">Este grupo no tiene estudiantes.</div>'}`;
}

function vistaAlumno(c) {
  const al = porId(S.alumnos, c.alumnoId);
  const areas = areasDeGrupo(c.grupoId);
  if (!c.areaId || !areas.some((a) => a.id === c.areaId)) c.areaId = areas[0]?.id || '';
  const per = porId(S.config.periodos, c.periodoId);
  const pers = S.config.periodos;
  const prom = promedioPeriodoAlumno(al.id, c.grupoId, c.periodoId, areas);
  const asis = asistenciaAlumno(al.id, c.grupoId, per);
  const hoy = hoyISO();
  const pendientes = [];
  for (const ar of areas) {
    const pl = buscarPlanilla(c.grupoId, ar.id, c.periodoId);
    if (!pl) continue;
    for (const cr of pl.criterios) for (const a of cr.actividades) if (a.fecha && a.fecha <= hoy && nota(a.id, al.id) == null) pendientes.push({ ar, a });
  }
  const bajas = areas.filter((ar) => { const pl = buscarPlanilla(c.grupoId, ar.id, c.periodoId); const n = pl ? notaFinal(pl, al.id) : null; return n != null && redondear(n) < +S.config.notaAprobacion; });
  const serie = pers.map((p) => ({ etiqueta: p.nombre.replace(/ periodo$/i, '').replace(/^Periodo /i, 'P'), nombre: p.nombre, v: promedioPeriodoAlumno(al.id, c.grupoId, p.id, areas) }));
  const plArea = c.areaId ? buscarPlanilla(c.grupoId, c.areaId, c.periodoId) : null;
  return `
  <div class="tarjeta" style="display:flex;justify-content:space-between;align-items:center">
    <div><h2 style="margin:0">${esc(nombreAlumno(al))} ${al.piar ? '<span class="chip piar">PIAR</span>' : ''}</h2>
      <span class="ayuda">${esc(nombreGrupoId(c.grupoId))}${al.documento ? ' · Doc. ' + esc(al.documento) : ''}${al.observaciones ? ' · ' + esc(al.observaciones) : ''}</span>
      ${al.perfil ? `<div class="ayuda">🧠 ${[al.perfil.vak ? 'Canal: ' + canalPredominante(al.perfil.vak) : '', al.perfil.kolb ? 'Kolb: ' + estiloKolb(al.perfil.kolb) : '', al.perfil.im ? 'Inteligencias: ' + (inteligenciasDestacadas(al.perfil.im).join(', ') || '—') : ''].filter(Boolean).map(esc).join(' · ')}</div>` : ''}</div>
    <span class="fila"><button class="btn" onclick="comunicadoPara('${al.id}')">✉️ Comunicado al acudiente</button><button class="btn" onclick="ui.seg.alumnoId='';render()">← Resumen del grupo</button></span></div>
  <div class="estadisticas">
    ${tarjetaDato(fmtNota(prom), `Promedio – ${esc(per?.nombre || '')}`, chipDesempeno(prom))}
    ${tarjetaDato(asis ? asis.pct + '%' : '—', 'Asistencia del periodo', asis ? `<div class="ayuda">${asis.faltas} falta(s) / ${asis.total} clases</div>` : '')}
    ${tarjetaDato(bajas.length, 'Áreas en desempeño bajo', bajas.length ? `<div class="ayuda">${bajas.map((b) => esc(b.nombre)).join(', ')}</div>` : '')}
    ${tarjetaDato(pendientes.length, 'Actividades sin nota', '<div class="ayuda">Con fecha ya cumplida</div>')}
  </div>
  <div class="rejilla r2" style="align-items:start">
    <div class="tarjeta"><h3>Promedio general por periodo</h3>${graficaLinea(serie, { ref: +S.config.notaAprobacion, titulo: 'Promedio general por periodo' })}</div>
    <div class="tarjeta"><div class="cabecera" style="margin-bottom:6px"><h3 style="margin:0">Componentes – ${esc(per?.nombre || '')}</h3>
      <select style="width:auto" onchange="ui.seg.areaId=this.value;render()">${opcionesAreas(c.areaId, null, areas)}</select></div>
      ${plArea ? graficaBarras(plArea.criterios.map((cr) => ({ nombre: `${cr.nombre} (${cr.peso}%)`, v: promedioCriterio(cr, al.id), detalle: `${cr.actividades.filter((a) => nota(a.id, al.id) != null).length} de ${cr.actividades.length} actividades calificadas` })), { ref: +S.config.notaAprobacion })
        : '<p class="ayuda">Aún no hay programación evaluativa para esta área y periodo.</p>'}
    </div>
  </div>
  <div class="tarjeta"><h3>Notas por área y periodo</h3>
    <table class="tabla planilla"><thead><tr><th>Área</th>${pers.map((p) => `<th class="num">${esc(p.nombre)}</th>`).join('')}<th class="num">Acumulado</th><th>Desempeño</th></tr></thead><tbody>
    ${areas.map((ar) => { const an = notaAnual(c.grupoId, ar.id, al.id); return `<tr><td>${esc(ar.nombre)}</td>
      ${pers.map((p) => { const pl = buscarPlanilla(c.grupoId, ar.id, p.id); const n = pl ? notaFinal(pl, al.id) : null; return `<td class="prom ${claseNota(n)}">${fmtNota(n)}</td>`; }).join('')}
      <td class="final ${claseNota(an)}">${fmtNota(an)}</td><td>${chipDesempeno(an)}</td></tr>`; }).join('')}
    </tbody></table></div>
  ${plArea ? `<div class="tarjeta"><h3>Actividades de ${esc(nombreArea(c.areaId))} – ${esc(per?.nombre || '')}</h3>
    <table class="tabla"><thead><tr><th>Componente</th><th>Actividad</th><th>Fecha</th><th class="num">Nota</th><th>Desempeño</th></tr></thead><tbody>
    ${plArea.criterios.flatMap((cr) => cr.actividades.map((a) => { const n = nota(a.id, al.id); return `<tr><td>${esc(cr.nombre)}</td><td>${esc(a.nombre)}</td><td>${a.fecha ? esc(fechaCorta(a.fecha)) : '—'}</td>
      <td class="num ${claseNota(n)}"><b>${n == null ? (a.fecha && a.fecha <= hoy ? '<span class="chip borrador">Pendiente</span>' : '—') : fmtNota(n)}</b></td><td>${chipDesempeno(n)}</td></tr>`; })).join('')}
    </tbody></table></div>` : ''}
  ${(() => { const pa = S.planesApoyo.filter((x) => x.alumnoId === al.id); return pa.length ? `<div class="tarjeta"><h3>Planes de apoyo</h3><table class="tabla"><thead><tr><th>Área</th><th>Periodo</th><th class="num">Nota del periodo</th><th>Entrega</th><th>Estado</th><th class="num">Nota del plan</th></tr></thead><tbody>
    ${pa.map((x) => `<tr><td>${esc(nombreArea(x.areaId))}</td><td>${esc(nombrePeriodo(x.periodoId))}</td><td class="num ${claseNota(x.notaInicial)}">${fmtNota(x.notaInicial)}</td><td>${x.fechaEntrega ? esc(fechaCorta(x.fechaEntrega)) : '—'}</td><td><span class="chip ${x.estado === 'superado' ? 'terminada' : x.estado === 'no_superado' ? 'Bajo' : 'borrador'}">${esc(ESTADOS_APOYO[x.estado])}</span></td><td class="num">${esc(x.notaFinal || '—')}</td></tr>`).join('')}
    </tbody></table></div>` : ''; })()}
  ${pendientes.length ? `<div class="tarjeta"><h3>Actividades pendientes en todas las áreas</h3><ul class="lista-simple">${pendientes.map((p) => `<li><span><b>${esc(p.ar.nombre)}</b> · ${esc(p.a.nombre)}</span><span class="ayuda">${esc(fechaCorta(p.a.fecha))}</span></li>`).join('')}</ul></div>` : ''}`;
}
