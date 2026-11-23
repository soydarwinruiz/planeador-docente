// ================= Semáforo de riesgo y nota necesaria =================

const SEMAFORO = { rojo: { t: 'Riesgo alto', ico: '🔴' }, amarillo: { t: 'En observación', ico: '🟡' }, verde: { t: 'Va bien', ico: '🟢' }, gris: { t: 'Sin notas', ico: '⚪' } };
const ORDEN_SEMAFORO = { rojo: 0, amarillo: 1, verde: 2, gris: 3 };

// Nota que debe sacar en promedio en las actividades que aún no tienen nota para aprobar el periodo
function notaNecesariaPeriodo(pl, alumnoId) {
  let W = 0, A = 0, B = 0;
  for (const c of pl.criterios) {
    const n = c.actividades.length, w = +c.peso || 0;
    if (!n || !w) continue;
    let suma = 0, faltan = 0;
    for (const a of c.actividades) { const v = nota(a.id, alumnoId); if (v == null) faltan++; else suma += v; }
    W += w; A += (w * suma) / n; B += (w * faltan) / n;
  }
  if (!W) return null;
  A /= W; B /= W;
  const meta = +S.config.notaAprobacion - 0.5 / 10 ** (S.config.decimales ?? 1);
  return { porEvaluar: B, necesaria: B > 0 ? (meta - A) / B : null, asegurada: A >= meta };
}
// Nota necesaria en los periodos restantes para aprobar el año
function notaNecesariaAnual(grupoId, areaId, alumnoId) {
  const hoy = hoyISO();
  let W = 0, conocido = 0, restante = 0;
  for (const per of S.config.periodos) {
    const w = +per.peso || 0; if (!w) continue;
    W += w;
    const pl = buscarPlanilla(grupoId, areaId, per.id);
    const f = pl ? notaFinal(pl, alumnoId) : null;
    if (per.fin && per.fin < hoy && f != null) conocido += w * redondear(f); else restante += w;
  }
  if (!W || !restante) return null;
  const meta = +S.config.notaAprobacion - 0.5 / 10 ** (S.config.decimales ?? 1);
  return (meta * W - conocido) / restante;
}

function riesgoAlumno(grupoId, areaId, periodoId, alumnoId) {
  const pl = buscarPlanilla(grupoId, areaId, periodoId);
  const per = porId(S.config.periodos, periodoId);
  const aprob = +S.config.notaAprobacion, max = +S.config.escalaMax, min = +S.config.escalaMin;
  const r = { nota: null, necesaria: null, porEvaluar: 1, pendientes: 0, asis: asistenciaAlumno(alumnoId, grupoId, per), anual: notaNecesariaAnual(grupoId, areaId, alumnoId), motivos: [], estado: 'gris', mensaje: '' };
  if (!pl) return r;
  const hoy = hoyISO();
  r.nota = notaFinal(pl, alumnoId);
  r.pendientes = pl.criterios.flatMap((c) => c.actividades).filter((a) => a.fecha && a.fecha <= hoy && nota(a.id, alumnoId) == null).length;
  const nn = notaNecesariaPeriodo(pl, alumnoId);
  if (nn) { r.porEvaluar = nn.porEvaluar; r.necesaria = nn.necesaria; r.asegurada = nn.asegurada; }
  // tendencia: periodo anterior
  const idx = S.config.periodos.findIndex((p) => p.id === periodoId);
  const ant = idx > 0 ? buscarPlanilla(grupoId, areaId, S.config.periodos[idx - 1].id) : null;
  const notaAnt = ant ? notaFinal(ant, alumnoId) : null;
  if (r.nota == null) { r.mensaje = 'Aún no tiene notas en el periodo.'; return r; }
  const bajo = redondear(r.nota) < aprob;
  // mensaje de la nota necesaria
  if (r.porEvaluar <= 0.0001) r.mensaje = bajo ? 'Ya no quedan actividades por calificar: necesita plan de apoyo.' : 'Periodo completo: aprobó.';
  else if (r.asegurada || r.necesaria <= min) r.mensaje = 'Ya aseguró la aprobación del periodo.';
  else if (r.necesaria > max) r.mensaje = `Aunque saque ${fmtNota(max)} en todo lo que falta no alcanza: necesita plan de apoyo.`;
  else r.mensaje = `Necesita ${fmtNota(r.necesaria)} en promedio en lo que falta (${Math.round(r.porEvaluar * 100)}% de la nota por evaluar).`;
  // motivos
  if (bajo) r.motivos.push(`Nota actual ${fmtNota(r.nota)}`);
  if (r.necesaria != null && r.porEvaluar > 0.0001 && r.necesaria >= 3.5 && !r.asegurada) r.motivos.push(`Necesita ${fmtNota(Math.min(r.necesaria, max))}${r.necesaria > max ? '+' : ''} en lo que falta`);
  if (r.pendientes) r.motivos.push(`${r.pendientes} actividad(es) sin entregar`);
  if (r.asis && r.asis.pct < 85) r.motivos.push(`Asistencia ${r.asis.pct}%`);
  if (notaAnt != null && notaAnt - r.nota >= 0.7) r.motivos.push(`Bajó ${fmtNota(notaAnt - r.nota)} frente al periodo anterior`);
  const imposible = (r.porEvaluar <= 0.0001 && bajo) || (r.necesaria != null && r.necesaria > max);
  if (imposible || (bajo && (r.necesaria >= 4 || r.pendientes >= 2 || (r.asis && r.asis.pct < 80)))) r.estado = 'rojo';
  else if (bajo || r.nota < aprob + 0.5 || r.pendientes || (r.necesaria != null && r.necesaria >= 3.5 && !r.asegurada) || (r.asis && r.asis.pct < 85) || (notaAnt != null && notaAnt - r.nota >= 0.7)) r.estado = 'amarillo';
  else r.estado = 'verde';
  return r;
}
function puntoSemaforo(estado, titulo = '') { return `<span class="semaforo ${estado}" title="${esc(titulo || SEMAFORO[estado].t)}"></span>`; }

// ---------- Vista (pestaña en Evaluación y notas) ----------
function vistaRiesgo(c) {
  if (!c.grupoId || !c.areaId || !c.periodoId) return '<div class="tarjeta vacio">Selecciona grupo, área y periodo.</div>';
  const filas = alumnosDe(c.grupoId).map((a) => ({ a, r: riesgoAlumno(c.grupoId, c.areaId, c.periodoId, a.id) }))
    .sort((x, y) => (ORDEN_SEMAFORO[x.r.estado] - ORDEN_SEMAFORO[y.r.estado]) || ((x.r.nota ?? 99) - (y.r.nota ?? 99)));
  const cuenta = (e) => filas.filter((f) => f.r.estado === e).length;
  return `
  <div class="estadisticas">${['rojo', 'amarillo', 'verde', 'gris'].map((e) => tarjetaDato(cuenta(e), `${SEMAFORO[e].ico} ${SEMAFORO[e].t}`)).join('')}</div>
  <div class="tarjeta" style="padding:0"><table class="tabla"><thead><tr><th style="width:30px"></th><th>Estudiante</th><th class="num">Nota actual</th><th class="num">Por evaluar</th><th>¿Cuánto necesita?</th><th class="num">Para el año</th><th>Alertas</th><th></th></tr></thead><tbody>
    ${filas.map(({ a, r }) => `<tr>
      <td>${puntoSemaforo(r.estado)}</td><td>${esc(nombreAlumno(a))} ${a.piar ? '<span class="chip piar">PIAR</span>' : ''}</td>
      <td class="num ${claseNota(r.nota)}"><b>${fmtNota(r.nota)}</b></td><td class="num">${r.nota == null ? '—' : Math.round(r.porEvaluar * 100) + '%'}</td>
      <td style="max-width:300px">${esc(r.mensaje)}</td>
      <td class="num ${r.anual != null && r.anual > +S.config.escalaMax ? 'bajo' : ''}" title="Promedio que necesita en los periodos que faltan para aprobar el año">${r.anual == null ? '—' : r.anual <= +S.config.escalaMin ? '✔' : r.anual > +S.config.escalaMax ? 'No alcanza' : fmtNota(r.anual)}</td>
      <td class="ayuda">${r.motivos.map(esc).join(' · ')}</td>
      <td style="white-space:nowrap">${r.estado === 'rojo' || r.estado === 'amarillo' ? `<button class="icono" title="Comunicado al acudiente" onclick="ui.seg={grupoId:'${c.grupoId}',areaId:'${c.areaId}',periodoId:'${c.periodoId}'};comunicadoPara('${a.id}','bajo')">✉️</button>
        <button class="icono" title="Plan de apoyo" onclick="ui.cal.pestana='apoyo';render()">🆘</button>` : ''}
        <button class="icono" title="Seguimiento" onclick="ui.seg={grupoId:'${c.grupoId}',alumnoId:'${a.id}',periodoId:'${c.periodoId}',areaId:'${c.areaId}'};ir('seguimiento')">👁️</button></td></tr>`).join('')}
  </tbody></table></div>
  <p class="ayuda">🔴 Riesgo alto: va perdiendo y necesita 4,0 o más en lo que falta, tiene 2 o más actividades sin entregar, asistencia menor al 80% o ya no alcanza. 🟡 En observación: está cerca del límite, tiene algo pendiente, bajó frente al periodo anterior o necesita 3,5 o más. "Para el año" es el promedio que necesita en los periodos que faltan.</p>`;
}

// Tarjeta "¿Cuánto necesita?" en el seguimiento del estudiante
function tarjetaCalculadora(grupoId, alumnoId, periodoId) {
  const areas = areasDeGrupo(grupoId);
  const filas = areas.map((ar) => ({ ar, r: riesgoAlumno(grupoId, ar.id, periodoId, alumnoId) })).filter((x) => x.r.nota != null);
  if (!filas.length) return '';
  return `<div class="tarjeta"><h3 style="margin-top:0">🧮 ¿Cuánto necesita para aprobar?</h3><table class="tabla"><thead><tr><th></th><th>Área</th><th class="num">Nota actual</th><th>En lo que falta del periodo</th><th class="num">Para el año</th></tr></thead><tbody>
    ${filas.sort((x, y) => ORDEN_SEMAFORO[x.r.estado] - ORDEN_SEMAFORO[y.r.estado]).map(({ ar, r }) => `<tr><td>${puntoSemaforo(r.estado, r.motivos.join(' · '))}</td><td>${esc(ar.nombre)}</td><td class="num ${claseNota(r.nota)}"><b>${fmtNota(r.nota)}</b></td><td>${esc(r.mensaje)}</td>
      <td class="num">${r.anual == null ? '—' : r.anual <= +S.config.escalaMin ? '✔' : r.anual > +S.config.escalaMax ? 'No alcanza' : fmtNota(r.anual)}</td></tr>`).join('')}
  </tbody></table></div>`;
}
// Semáforo general del estudiante (el peor de sus áreas)
function semaforoGeneral(grupoId, alumnoId, periodoId) {
  let peor = 'gris';
  for (const ar of areasDeGrupo(grupoId)) {
    const e = riesgoAlumno(grupoId, ar.id, periodoId, alumnoId).estado;
    if (e !== 'gris' && (peor === 'gris' || ORDEN_SEMAFORO[e] < ORDEN_SEMAFORO[peor])) peor = e;
  }
  return peor;
}
