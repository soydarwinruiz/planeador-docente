// ================= Mi clase ahora =================
// Una sola pantalla con la clase que toca según el horario: asistencia, la sesión planeada (con avance por
// momentos), entregas del día, herramientas de aula, tablero, modo para proyectar y cierre con el diario de campo.

function claseActual() {
  const hoy = hoyISO(), ahora = new Date().toTimeString().slice(0, 5);
  const clases = typeof clasesDelDia === 'function' ? clasesDelDia(hoy) : [];
  return clases.find(({ b }) => ahora >= b.inicio && ahora < b.fin) || clases.find(({ b }) => b.inicio > ahora) || null;
}
function abrirMiClase() { ui.mc = null; ir('miClase'); }

RENDERS.miClase = () => {
  if (!S.grupos.length) return '<h1>🎯 Mi clase ahora</h1><div class="tarjeta vacio">Primero crea tus grupos y estudiantes.</div>';
  if (!ui.mc) {
    const cl = claseActual();
    ui.mc = { grupoId: cl?.c.grupoId || '', areaId: cl?.c.areaId || '', fecha: hoyISO(), bloque: cl?.b || null };
  }
  const c = ui.mc;
  contextoPorDefecto(c);
  const hoy = c.fecha;
  const plan = planDeClase(c.grupoId, c.areaId, hoy);
  const ses = plan?.sesiones.find((s) => s.fecha === hoy);
  const pend = typeof pendienteAnterior === 'function' ? pendienteAnterior(c.grupoId, c.areaId, hoy) : null;
  const alumnos = alumnosDe(c.grupoId);
  const dia = S.asistencia[`${c.grupoId}|${c.areaId}`]?.[hoy] || {};
  const cuenta = { P: 0, A: 0, T: 0, E: 0 };
  Object.values(dia).forEach((e) => { if (cuenta[e] != null) cuenta[e]++; });
  const per = periodoDeFecha(hoy);
  const pl = per ? buscarPlanilla(c.grupoId, c.areaId, per.id) : null;
  const actsHoy = pl ? pl.criterios.flatMap((cr) => cr.actividades).filter((a) => a.fecha === hoy) : [];
  const b = c.bloque;
  const ahora = new Date().toTimeString().slice(0, 5);
  const faltan = b && hoy === hoyISO() && ahora >= b.inicio && ahora < b.fin ? difMinutos(ahora, b.fin) : null;
  const momentos = ses ? MOMENTOS.filter((m) => (ses[m.k] || '').trim()) : [];
  return `<div class="cabecera"><div><h1>🎯 ${esc(nombreGrupoId(c.grupoId))} · ${esc(nombreArea(c.areaId))}</h1>
      <p class="sub">${esc(fechaLarga(hoy))}${b ? ` · ${esc(b.inicio)}–${esc(b.fin)}` : ''}${faltan != null ? ` · <b>quedan ${faltan} min</b>` : ''}${plan ? ' · 📝 ' + esc(plan.titulo || 'Planeación sin título') : ''}</p></div>
    <div class="acciones"><select style="width:auto" onchange="const [g,a]=this.value.split('|');ui.mc={grupoId:g,areaId:a,fecha:hoyISO(),bloque:null};render()">
      ${[...S.grupos].sort(ordenGrupos).flatMap((g) => areasDeGrupo(g.id).map((a) => `<option value="${g.id}|${a.id}" ${g.id === c.grupoId && a.id === c.areaId ? 'selected' : ''}>${esc(nombreGrupo(g))} · ${esc(a.nombre)}</option>`)).join('')}</select></div></div>
  <div class="mc-acciones">
    <button class="btn primario" onclick="proyectarClase()" ${ses ? '' : 'disabled title="No hay sesión planeada para hoy"'}>📽️ Proyectar la clase</button>
    ${ses ? `<button class="btn" onclick="${pzTablerosDeSesion(plan.id, ses.id).length ? `pzAbrirDeSesion('${plan.id}','${ses.id}')` : `pzCrearParaSesion('${plan.id}','${ses.id}')`}">🖍️ Tablero</button>` : ''}
    <button class="btn" onclick="abrirAula('${c.grupoId}','${c.areaId}','azar')">🎲 Al azar</button>
    <button class="btn" onclick="abrirAula('${c.grupoId}','${c.areaId}','temporizador')">⏱️ Temporizador</button>
    <button class="btn" onclick="abrirAula('${c.grupoId}','${c.areaId}','equipos')">👥 Grupos de trabajo</button>
    ${plan ? `<button class="btn" onclick="editarPlaneacion('${plan.id}')">📝 Planeación</button>` : `<button class="btn" onclick="nuevaPlaneacion('${hoy}')">＋ Planear esta clase</button>`}
    <button class="btn" onclick="ui.cal={grupoId:'${c.grupoId}',areaId:'${c.areaId}',periodoId:'${per?.id || ''}',pestana:'entregas'};ir('calificaciones')">📥 Entregas</button>
    <span style="flex:1"></span>
    <button class="btn primario" onclick="abrirDiario('${c.grupoId}','${c.areaId}','${hoy}')">✅ Terminar clase (diario)</button>
  </div>
  ${pend ? `<div class="alerta info">📓 Quedó pendiente de la clase del ${esc(fechaCorta(pend.fecha))}: <b>${esc(pend.pendiente)}</b></div>` : ''}
  <div class="rejilla r2" style="align-items:start">
    <div class="tarjeta"><div class="cabecera" style="margin-bottom:8px"><h2 style="margin:0">✅ Asistencia</h2>
      <span class="ayuda">✅ ${cuenta.P} · ❌ ${cuenta.A} · ⏰ ${cuenta.T} · 📄 ${cuenta.E}${alumnos.length - Object.keys(dia).length ? ` · sin marcar ${alumnos.length - Object.keys(dia).length}` : ''}</span></div>
      <button class="btn pequeno" onclick="mcTodosPresentes()">Marcar a los demás como presentes</button>
      <div class="mc-lista">${alumnos.map((a) => `<button class="mc-al ${dia[a.id] || ''}" title="Clic: cambia P → A → T → E" onclick="mcAsistencia('${a.id}')"><span>${esc(tipoTitulo(`${primerNombre(a)} ${String(a.apellidos || '').split(/\s+/)[0]}`))}</span><b>${dia[a.id] || '·'}</b></button>`).join('')}</div>
    </div>
    <div class="tarjeta"><h2 style="margin-top:0">📖 La sesión de hoy</h2>
      ${ses ? `${plan.objetivo ? `<p><b>🎯 Objetivo:</b> ${esc(plan.objetivo)}</p>` : ''}${plan.pregunta ? `<p><b>❓</b> ${esc(plan.pregunta)}</p>` : ''}
        ${momentos.map((m) => `<label class="mc-momento ${ses.hechos?.[m.k] ? 'hecho' : ''}"><input type="checkbox" ${ses.hechos?.[m.k] ? 'checked' : ''} onchange="mcMomento('${plan.id}','${ses.id}','${m.k}',this.checked)">
          <span><b>${esc(m.t)}</b><br>${esc(ses[m.k])}${ses[m.k + 'Med'] ? `<br><span class="ayuda">🧰 ${esc(ses[m.k + 'Med'])}</span>` : ''}</span></label>`).join('') || '<p class="ayuda">La sesión aún no tiene momentos escritos.</p>'}`
        : `<p class="ayuda">No hay una sesión planeada para esta fecha.</p>`}
      ${actsHoy.length ? `<h3>📥 Actividades con fecha de hoy</h3><ul class="lista-simple">${actsHoy.map((a) => `<li>${esc(a.nombre)}<button class="btn pequeno" onclick="ui.cal={grupoId:'${c.grupoId}',areaId:'${c.areaId}',periodoId:'${per.id}',pestana:'entregas'};ui.ent={actId:'${a.id}',sel:{},nota:'',a:'seleccionados',respetar:true};ir('calificaciones')">Entregas</button></li>`).join('')}</ul>` : ''}
    </div>
  </div>`;
};
function difMinutos(a, b) { const m = (x) => +x.slice(0, 2) * 60 + +x.slice(3, 5); return m(b) - m(a); }
function mcAsistencia(alumnoId) {
  const c = ui.mc;
  const dia = (((S.asistencia[`${c.grupoId}|${c.areaId}`] ||= {})[c.fecha]) ||= {});
  const orden = ['', 'P', 'A', 'T', 'E'];
  const sig = orden[(orden.indexOf(dia[alumnoId] || '') + 1) % orden.length];
  if (sig) dia[alumnoId] = sig; else delete dia[alumnoId];
  guardar(); render();
}
function mcTodosPresentes() {
  const c = ui.mc;
  const dia = (((S.asistencia[`${c.grupoId}|${c.areaId}`] ||= {})[c.fecha]) ||= {});
  alumnosDe(c.grupoId).forEach((a) => { if (!dia[a.id]) dia[a.id] = 'P'; });
  guardar(); render();
}
function mcMomento(planId, sesId, k, hecho) {
  const s = porId(S.planeaciones, planId)?.sesiones.find((x) => x.id === sesId);
  if (!s) return;
  (s.hechos ||= {})[k] = hecho;
  guardar(); render();
}
// Repinta cada minuto para el tiempo que queda de la clase
setInterval(() => {
  if (ui.vista === 'miClase' && !document.getElementById('proyeccion') && document.getElementById('modal-fondo').classList.contains('oculto') && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) render();
}, 60000);

// ---------- Proyectar la clase (pantalla completa) ----------
function proyectarClase() {
  const c = ui.mc;
  const plan = planDeClase(c.grupoId, c.areaId, c.fecha);
  const ses = plan?.sesiones.find((s) => s.fecha === c.fecha);
  if (!ses) return;
  const diapositivas = [{ t: plan.titulo || 'Nuestra clase de hoy', texto: [plan.objetivo ? '🎯 ' + plan.objetivo : '', plan.pregunta ? '❓ ' + plan.pregunta : ''].filter(Boolean).join('\n\n') },
    ...MOMENTOS.filter((m) => (ses[m.k] || '').trim()).map((m) => ({ t: m.t, texto: ses[m.k] }))];
  window._proy = { d: diapositivas, i: 0, titulo: `${nombreGrupoId(c.grupoId)} · ${nombreArea(c.areaId)}` };
  const capa = document.createElement('div');
  capa.id = 'proyeccion';
  document.body.appendChild(capa);
  dibujarProyeccion();
  capa.requestFullscreen?.().catch(() => {});
}
function dibujarProyeccion() {
  const p = window._proy, d = p.d[p.i];
  document.getElementById('proyeccion').innerHTML = `<div class="proy-cab">${esc(p.titulo)}<span>${p.i + 1} / ${p.d.length}</span></div>
    <div class="proy-cuerpo"><h1>${esc(d.t)}</h1><div class="proy-texto">${esc(d.texto)}</div></div>
    <div class="proy-pie"><button onclick="moverProyeccion(-1)" ${p.i ? '' : 'disabled'}>← Anterior</button><button onclick="cerrarProyeccion()">✕ Salir (Esc)</button><button onclick="moverProyeccion(1)" ${p.i < p.d.length - 1 ? '' : 'disabled'}>Siguiente →</button></div>`;
}
function moverProyeccion(d) { const p = window._proy; p.i = Math.max(0, Math.min(p.d.length - 1, p.i + d)); dibujarProyeccion(); }
function cerrarProyeccion() { document.getElementById('proyeccion')?.remove(); if (document.fullscreenElement) document.exitFullscreen?.(); }
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('proyeccion')) return;
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); moverProyeccion(1); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); moverProyeccion(-1); }
  else if (e.key === 'Escape') cerrarProyeccion();
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.getElementById('proyeccion')?.remove(); });
