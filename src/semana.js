// ================= Resumen semanal del docente (en Inicio) =================
// Lo que hay que resolver esta semana, con un botón para cada cosa. Se abre solo los lunes; el resto de la semana
// queda plegado y recuerda si el docente lo abrió o cerró.

function resumenSemana() {
  const hoy = hoyISO();
  const lunes = lunesDe(hoy), domingo = sumarDias(lunes, 6);
  const r = { sinPlan: [], porCalificar: [], noEntregaron: 0, riesgo: [], pendientes: [] };
  if (typeof clasesSinPlan === 'function' && Object.keys(horario().celdas || {}).length) r.sinPlan = clasesSinPlan(difDias(hoy, domingo) + 1);
  const per = periodoDeFecha(hoy);
  const desde = sumarDias(hoy, -30);
  for (const pl of S.planillas.filter((p) => !per || p.periodoId === per.id)) {
    const al = alumnosDe(pl.grupoId);
    if (!al.length) continue;
    for (const cr of pl.criterios) for (const a of cr.actividades) {
      if (a.fecha && a.fecha <= hoy && a.fecha >= desde) {
        const sin = al.filter((x) => nota(a.id, x.id) == null && entrega(a.id, x.id) !== 'N').length;
        if (sin) r.porCalificar.push({ pl, a, sin });
      }
      r.noEntregaron += al.filter((x) => entrega(a.id, x.id) === 'N' && nota(a.id, x.id) == null).length;
    }
    if (typeof riesgoAlumno === 'function') {
      const rojos = al.filter((x) => riesgoAlumno(pl.grupoId, pl.areaId, pl.periodoId, x.id).estado === 'rojo');
      if (rojos.length) r.riesgo.push({ pl, n: rojos.length });
    }
  }
  r.pendientes = (S.pendientes || []).filter((p) => !p.hecho && p.fecha && p.fecha <= domingo);
  return r;
}

function tarjetaSemana() {
  const r = resumenSemana();
  const total = r.sinPlan.length + r.porCalificar.length + r.riesgo.length + r.pendientes.length + (r.noEntregaron ? 1 : 0);
  const esLunes = new Date().getDay() === 1;
  const guardado = S.config.apariencia?.semanaAbierta;
  const abierta = guardado?.semana === lunesDe(hoyISO()) ? guardado.abierta : esLunes;
  const linea = (ico, texto, boton, accion) => `<li><span>${ico} ${texto}</span>${boton ? `<button class="btn pequeno" onclick="${accion}">${boton}</button>` : ''}</li>`;
  const porGrupo = {};
  r.sinPlan.forEach((x) => { const k = `${x.c.grupoId}|${x.c.areaId}`; (porGrupo[k] ||= { c: x.c, fechas: [] }).fechas.push(x.fecha); });
  return `<details class="tarjeta semana" ${abierta ? 'open' : ''}>
    <summary onclick="(S.config.apariencia ||= {}).semanaAbierta={semana:'${lunesDe(hoyISO())}',abierta:!this.parentNode.open};guardar()">
      <h2 style="display:inline;margin:0">📋 Tu semana</h2> <span class="ayuda">${total ? `${total} cosa(s) por resolver` : 'todo al día ✨'}</span></summary>
    ${total ? `<ul class="lista-simple" style="margin-top:10px">
      ${Object.values(porGrupo).map((x) => linea('📝', `<b>${esc(nombreGrupoId(x.c.grupoId))} · ${esc(nombreArea(x.c.areaId))}</b>: ${x.fechas.length} clase(s) sin planear (${x.fechas.map((f) => esc(fechaCorta(f))).join(', ')})`, 'Planear', `nuevaPlaneacion('${x.fechas[0]}')`)).join('')}
      ${r.porCalificar.slice(0, 8).map((x) => linea('📊', `<b>${esc(nombreGrupoId(x.pl.grupoId))} · ${esc(nombreArea(x.pl.areaId))}</b>: "${esc(x.a.nombre)}" — ${x.sin} sin nota`, 'Calificar', `ui.cal={grupoId:'${x.pl.grupoId}',areaId:'${x.pl.areaId}',periodoId:'${x.pl.periodoId}',pestana:'entregas'};ui.ent={actId:'${x.a.id}',sel:{},nota:'',a:'seleccionados',respetar:true};ir('calificaciones')`)).join('')}
      ${r.porCalificar.length > 8 ? linea('📊', `y ${r.porCalificar.length - 8} actividad(es) más por calificar`) : ''}
      ${r.noEntregaron ? linea('📥', `${r.noEntregaron} entrega(s) marcadas como "no entregó" y sin nota en el periodo`, 'Comunicados', `ir('comunicados')`) : ''}
      ${r.riesgo.map((x) => linea('🚦', `<b>${esc(nombreGrupoId(x.pl.grupoId))} · ${esc(nombreArea(x.pl.areaId))}</b>: ${x.n} estudiante(s) en rojo`, 'Ver', `ui.cal={grupoId:'${x.pl.grupoId}',areaId:'${x.pl.areaId}',periodoId:'${x.pl.periodoId}',pestana:'riesgo'};ir('calificaciones')`)).join('')}
      ${r.pendientes.map((p) => linea('✔️', `${esc(p.texto)} <span class="ayuda">(${esc(fechaCorta(p.fecha))})</span>`, 'Hecho', `marcarPendiente('${p.id}',true)`)).join('')}
    </ul>` : '<p class="ayuda" style="margin-top:8px">No hay clases sin planear, actividades por calificar ni pendientes para esta semana.</p>'}
  </details>`;
}
