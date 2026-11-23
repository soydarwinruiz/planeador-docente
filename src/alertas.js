// ================= Alertas y pendientes =================

function umbralFaltas() { return +(S.config.alertas?.faltas) || 3; }

function calcularAlertas() {
  const r = [];
  const hoy = hoyISO();
  const add = (clave, nivel, icono, texto, accion, etiqueta = 'Ver') => r.push({ clave, nivel, icono, texto, accion, etiqueta });
  const per = periodoDeFecha(hoy);

  // 1. Cierre de periodo
  if (per?.fin) {
    const dias = difDias(hoy, per.fin);
    if (dias >= 0 && dias <= 10) {
      // observaciones del boletín sin redactar
      const faltanObs = [];
      for (const pl of S.planillas.filter((p) => p.periodoId === per.id)) {
        const al = alumnosDe(pl.grupoId); if (!al.length) continue;
        const obs = (S.observaciones || {})[`${pl.grupoId}|${pl.areaId}|${pl.periodoId}`] || {};
        const n = al.filter((a) => !(obs[a.id] || '').trim()).length;
        if (n) faltanObs.push({ pl, n, total: al.length });
      }
      add(`cierre|${per.id}|${dias}`, dias <= 3 ? 'urgente' : 'aviso', '⏳', `${dias === 0 ? 'Hoy cierra' : `Faltan ${dias} día(s) para cerrar`} el <b>${esc(per.nombre)}</b> (${esc(fechaCorta(per.fin))}).`, `ui.cal={grupoId:'',areaId:'',periodoId:'${per.id}',pestana:'riesgo'};ir('calificaciones');dialogoInformeCierre()`, 'Informe de cierre');
      for (const x of faltanObs) add(`obs|${x.pl.id}|${x.n}`, 'aviso', '📝', `Faltan observaciones del boletín en <b>${esc(nombreGrupoId(x.pl.grupoId))} · ${esc(nombreArea(x.pl.areaId))}</b> (${x.n} de ${x.total}).`,
        `ui.cal={grupoId:'${x.pl.grupoId}',areaId:'${x.pl.areaId}',periodoId:'${per.id}',pestana:'observaciones'};ir('calificaciones')`, 'Redactar');
    }
  }

  // 2. Actividades con fecha cumplida (últimos 45 días) sin calificar
  const desde = sumarDias(hoy, -45);
  for (const pl of S.planillas) {
    const al = alumnosDe(pl.grupoId); if (!al.length) continue;
    for (const cr of pl.criterios) for (const a of cr.actividades) {
      if (!a.fecha || a.fecha > hoy || a.fecha < desde) continue;
      const sin = al.filter((x) => nota(a.id, x.id) == null).length;
      if (!sin) continue;
      add(`act|${a.id}|${sin}`, sin === al.length ? 'urgente' : 'aviso', '📊', `<b>${esc(nombreGrupoId(pl.grupoId))} · ${esc(nombreArea(pl.areaId))}:</b> "${esc(a.nombre)}" (${esc(fechaCorta(a.fecha))}) ${sin === al.length ? 'sin calificar' : `sin nota para ${sin} estudiante(s)`}.`,
        `ui.cal={grupoId:'${pl.grupoId}',areaId:'${pl.areaId}',periodoId:'${pl.periodoId}',pestana:'planilla'};ir('calificaciones')`, 'Calificar');
    }
  }

  // 3. Asistencia de hoy sin registrar (clases ya terminadas)
  const ahora = new Date().toTimeString().slice(0, 5);
  for (const { b, c } of clasesDelDia(hoy)) {
    if (b.fin > ahora) continue;
    const reg = (S.asistencia[`${c.grupoId}|${c.areaId}`] || {})[hoy];
    if (reg && Object.keys(reg).length) continue;
    add(`asis|${c.grupoId}|${c.areaId}|${hoy}|${b.id}`, 'aviso', '✅', `No has registrado la asistencia de <b>${esc(nombreGrupoId(c.grupoId))} · ${esc(nombreArea(c.areaId))}</b> de hoy (${esc(b.inicio)}).`, `asistenciaDe('${c.grupoId}','${c.areaId}','${hoy}')`, 'Registrar');
  }

  // 4. Estudiantes con muchas faltas en el periodo
  if (per) {
    const avisados = new Set((S.comunicadosEnviados || []).filter((x) => x.tipo === 'inasistencia' && x.fecha >= per.inicio).map((x) => x.alumnoId));
    for (const g of S.grupos) for (const a of alumnosDe(g.id)) {
      const asis = asistenciaAlumno(a.id, g.id, per);
      if (!asis || asis.faltas < umbralFaltas() || avisados.has(a.id)) continue;
      add(`faltas|${a.id}|${per.id}|${asis.faltas}`, asis.faltas >= umbralFaltas() + 2 ? 'urgente' : 'aviso', '🚸', `<b>${esc(tipoTitulo(nombreAlumno(a)))}</b> (${esc(g.nombre)}) lleva ${asis.faltas} falta(s) en el ${esc(per.nombre.toLowerCase())}.`,
        `comunicadoPara('${a.id}','inasistencia')`, 'Avisar al acudiente');
    }
  }

  // 4b. Estudiantes en riesgo alto (semáforo rojo) en el periodo actual
  if (per) for (const pl of S.planillas.filter((p) => p.periodoId === per.id)) {
    const rojos = alumnosDe(pl.grupoId).filter((a) => riesgoAlumno(pl.grupoId, pl.areaId, per.id, a.id).estado === 'rojo');
    if (rojos.length) add(`riesgo|${pl.id}|${rojos.map((a) => a.id).join(',')}`, 'urgente', '🔴', `<b>${esc(nombreGrupoId(pl.grupoId))} · ${esc(nombreArea(pl.areaId))}:</b> ${rojos.length} estudiante(s) en riesgo alto de perder el periodo (${rojos.slice(0, 3).map((a) => esc(primerNombre(a))).join(', ')}${rojos.length > 3 ? '…' : ''}).`,
      `ui.cal={grupoId:'${pl.grupoId}',areaId:'${pl.areaId}',periodoId:'${per.id}',pestana:'riesgo'};ir('calificaciones')`, 'Ver semáforo');
  }

  // 5. Planes de apoyo vencidos
  for (const p of S.planesApoyo) {
    if (p.estado !== 'pendiente' || !p.fechaEntrega || p.fechaEntrega >= hoy) continue;
    const a = porId(S.alumnos, p.alumnoId); if (!a) continue;
    add(`apoyo|${p.id}|${p.fechaEntrega}`, 'aviso', '🆘', `El plan de apoyo de <b>${esc(tipoTitulo(nombreAlumno(a)))}</b> en ${esc(nombreArea(p.areaId))} venció el ${esc(fechaCorta(p.fechaEntrega))} y sigue pendiente.`,
      `ui.cal={grupoId:'${p.grupoId}',areaId:'${p.areaId}',periodoId:'${p.periodoId}',pestana:'apoyo'};ir('calificaciones');editarPlanApoyo('${p.id}')`, 'Revisar');
  }

  // 6. Clases de los próximos 3 días sin planeación
  const sinPlan = Object.keys(horario().celdas).length ? clasesSinPlan(3) : [];
  if (sinPlan.length) add(`sinplan|${hoy}|${sinPlan.length}`, 'info', '🗓️', `${sinPlan.length} clase(s) de los próximos 3 días aún no tienen planeación.`, `ir('horario')`, 'Planear');

  // 7. Eventos de hoy y mañana
  for (const e of S.eventos) {
    const fin = e.fechaFin || e.fecha;
    if (e.tipo === 'festivo' || fin < hoy || e.fecha > sumarDias(hoy, 1)) continue;
    add(`ev|${e.id}|${hoy}`, 'info', '📅', `${e.fecha <= hoy ? 'Hoy' : 'Mañana'}: <b>${esc(e.titulo)}</b>.`, `ir('calendario')`, 'Calendario');
  }

  const ocultas = new Set(S.alertasOcultas || []);
  const orden = { urgente: 0, aviso: 1, info: 2 };
  return r.filter((x) => !ocultas.has(x.clave)).sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
function ocultarAlerta(clave) {
  (S.alertasOcultas ||= []).push(clave);
  if (S.alertasOcultas.length > 500) S.alertasOcultas = S.alertasOcultas.slice(-300);
  guardar(); render();
}

// ---------- Mis pendientes (lista de tareas del docente) ----------
function agregarPendiente() {
  const t = document.getElementById('pend-texto'), f = document.getElementById('pend-fecha');
  if (!t.value.trim()) return t.focus();
  S.pendientes.push({ id: uid(), texto: t.value.trim(), fecha: f.value || '', hecho: false, creado: hoyISO() });
  guardar(); render();
  setTimeout(() => document.getElementById('pend-texto')?.focus(), 30);
}
function marcarPendiente(id, v) { const p = porId(S.pendientes, id); p.hecho = v; p.hechoEl = v ? hoyISO() : ''; guardar(); render(); }
function borrarPendiente(id) { S.pendientes = S.pendientes.filter((p) => p.id !== id); guardar(); render(); }

function tarjetaAlertas() {
  const alertas = calcularAlertas();
  const hoy = hoyISO();
  const pend = S.pendientes.filter((p) => !p.hecho || p.hechoEl === hoy).sort((a, b) => (a.hecho - b.hecho) || (a.fecha || '9').localeCompare(b.fecha || '9'));
  const max = ui.alertasTodas ? alertas.length : 6;
  return `<div class="rejilla r2" style="align-items:start">
    <div class="tarjeta"><div class="cabecera" style="margin-bottom:6px"><h2 style="margin:0">🔔 Alertas${alertas.length ? ` <span class="insignia">${alertas.length}</span>` : ''}</h2>
      ${(S.alertasOcultas || []).length ? `<a href="#" class="ayuda" onclick="S.alertasOcultas=[];guardar();render();return false">Mostrar ocultas</a>` : ''}</div>
      ${alertas.length ? `<ul class="lista-simple alertas">${alertas.slice(0, max).map((a) => `<li class="alerta-${a.nivel}"><span>${a.icono} ${a.texto}</span>
        <span class="fila" style="flex-wrap:nowrap"><button class="btn pequeno" onclick="${esc(a.accion)}">${esc(a.etiqueta)}</button><button class="icono" title="Ocultar" onclick="ocultarAlerta('${esc(a.clave)}')">✕</button></span></li>`).join('')}</ul>
        ${alertas.length > max ? `<a href="#" class="ayuda" onclick="ui.alertasTodas=true;render();return false">Ver ${alertas.length - max} más…</a>` : ''}`
        : '<p class="ayuda">✔ Todo al día. Aquí verás notas por registrar, cierres de periodo, faltas, planes de apoyo vencidos y clases sin planear.</p>'}</div>
    <div class="tarjeta"><h2 style="margin-top:0">✔️ Mis pendientes</h2>
      <div class="fila" style="flex-wrap:nowrap"><input id="pend-texto" style="flex:1;min-width:0;width:auto" placeholder="Ej.: Entregar planeación a coordinación" onkeydown="if(event.key==='Enter')agregarPendiente()">
        <input type="date" id="pend-fecha" style="width:140px;flex:none" title="Fecha límite (opcional)"><button class="btn primario" onclick="agregarPendiente()">＋</button></div>
      ${pend.length ? `<ul class="lista-simple" style="margin-top:8px">${pend.map((p) => { const vencido = !p.hecho && p.fecha && p.fecha < hoy; return `<li style="${p.hecho ? 'opacity:.5;text-decoration:line-through' : ''}">
        <label style="font-weight:normal;color:inherit;margin:0;display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" ${p.hecho ? 'checked' : ''} onchange="marcarPendiente('${p.id}',this.checked)"> ${esc(p.texto)}</label>
        <span class="fila" style="flex-wrap:nowrap">${p.fecha ? `<span class="ayuda" style="${vencido ? 'color:var(--rojo);font-weight:600' : ''}">${p.fecha === hoy ? 'Hoy' : esc(fechaCorta(p.fecha))}</span>` : ''}<button class="icono" title="Borrar" onclick="borrarPendiente('${p.id}')">🗑️</button></span></li>`; }).join('')}</ul>`
        : '<p class="ayuda">Anota aquí lo que tienes que hacer: entregas, reuniones, compras de material…</p>'}</div></div>`;
}
// Número de alertas urgentes y pendientes vencidos (para la insignia del menú)
function numeroAlertas() {
  try {
    const hoy = hoyISO();
    return calcularAlertas().filter((a) => a.nivel !== 'info').length + S.pendientes.filter((p) => !p.hecho && p.fecha && p.fecha <= hoy).length;
  } catch (e) { return 0; }
}
