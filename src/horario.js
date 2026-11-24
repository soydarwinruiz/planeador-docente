// ================= Horario semanal del docente =================

const DIAS_HORARIO = [[1, 'Lunes'], [2, 'Martes'], [3, 'Miércoles'], [4, 'Jueves'], [5, 'Viernes'], [6, 'Sábado']];

function horarioPorDefecto() {
  const h = [['07:00', '07:55'], ['07:55', '08:50'], ['08:50', '09:45'], ['10:15', '11:10'], ['11:10', '12:05'], ['12:05', '13:00']];
  return { sabado: false, bloques: h.map(([inicio, fin]) => ({ id: uid(), inicio, fin, descanso: false })), celdas: {} };
}
function horario() { return (S.horario ||= horarioPorDefecto()); }
function diaSemana(iso) { const d = deISO(iso).getDay(); return d === 0 ? 7 : d; }
function esDiaSinClase(iso) {
  return S.eventos.some((e) => (e.tipo === 'festivo' || e.tipo === 'receso') && iso >= e.fecha && iso <= (e.fechaFin || e.fecha));
}
function clasesDelDia(iso) {
  const h = horario();
  const d = diaSemana(iso);
  if (esDiaSinClase(iso)) return [];
  return h.bloques.filter((b) => !b.descanso).map((b) => ({ b, c: h.celdas[`${d}|${b.id}`] })).filter((x) => x.c && x.c.grupoId);
}
// Fechas de las próximas clases de un grupo y área a partir de una fecha (incluida)
function proximasClases(grupoId, areaId, desde, n) {
  const h = horario();
  const dias = new Set(Object.entries(h.celdas).filter(([, c]) => c.grupoId === grupoId && (!areaId || c.areaId === areaId)).map(([k]) => +k.split('|')[0]));
  if (!dias.size) return [];
  const r = [];
  for (let i = 0, f = desde; r.length < n && i < 400; i++, f = sumarDias(f, 1)) {
    if (dias.has(diaSemana(f)) && !esDiaSinClase(f)) r.push(f);
  }
  return r;
}
function horasSemanales(grupoId, areaId) {
  return Object.values(horario().celdas).filter((c) => c.grupoId === grupoId && c.areaId === areaId).length;
}

// ---------- Vista ----------
RENDERS.horario = () => {
  const h = horario();
  const dias = DIAS_HORARIO.filter(([d]) => d <= (h.sabado ? 6 : 5));
  const combos = S.grupos.slice().sort(ordenGrupos).flatMap((g) => (g.areas || []).map((a) => ({ g, a: porId(S.areas, a.areaId) })).filter((x) => x.a));
  const opcionesCelda = (sel) => `<option value="">—</option>` + combos.map(({ g, a }) => { const v = `${g.id}|${a.id}`; return `<option value="${v}" ${v === sel ? 'selected' : ''}>${esc(g.nombre)} · ${esc(a.abreviatura || a.nombre)}</option>`; }).join('');
  const resumen = combos.map(({ g, a }) => ({ g, a, n: horasSemanales(g.id, a.id), plan: +((g.areas || []).find((x) => x.areaId === a.id)?.horas || 0) })).filter((x) => x.n || x.plan);
  return `
  <div class="cabecera"><div><h1>Mi horario</h1>
    <p class="sub">Con tu horario la app muestra tus clases de hoy, propone las fechas de las sesiones al planear y abre la asistencia del grupo correcto.</p></div>
    <div class="acciones"><label class="btn" style="margin:0;font-weight:normal;color:inherit"><input type="checkbox" ${h.sabado ? 'checked' : ''} onchange="horario().sabado=this.checked;guardar();render()"> Incluir sábado</label>
      <button class="btn" onclick="agregarBloque()">＋ Franja</button></div></div>
  ${tarjetaSemanaSinPlan()}
  ${!combos.length ? '<div class="alerta">Primero crea tus grupos y asígnales las áreas que dictas en <a href="#" onclick="ir(\'grupos\');return false">Grupos y alumnos</a>.</div>' : ''}
  <div class="envoltura-tabla"><table class="tabla horario"><thead><tr><th style="width:150px">Hora</th>${dias.map(([, n]) => `<th>${n}</th>`).join('')}<th style="width:40px"></th></tr></thead><tbody>
  ${h.bloques.map((b, i) => `<tr class="${b.descanso ? 'descanso' : ''}">
    <td><div class="fila" style="flex-wrap:nowrap;gap:4px"><input type="time" value="${esc(b.inicio)}" style="width:92px;padding:4px" onchange="horario().bloques[${i}].inicio=this.value;ordenarBloques()">
      <input type="time" value="${esc(b.fin)}" style="width:92px;padding:4px" onchange="horario().bloques[${i}].fin=this.value;guardar()"></div>
      <label style="font-weight:normal;font-size:11px;margin:3px 0 0"><input type="checkbox" ${b.descanso ? 'checked' : ''} onchange="horario().bloques[${i}].descanso=this.checked;guardar();render()"> Descanso</label></td>
    ${dias.map(([d]) => { const c = h.celdas[`${d}|${b.id}`]; const v = c ? `${c.grupoId}|${c.areaId}` : ''; return b.descanso ? '<td class="ayuda" style="text-align:center">Descanso</td>'
      : `<td class="${v ? 'ocupada' : ''}"><select onchange="ponerCelda(${d},'${b.id}',this.value)">${opcionesCelda(v)}</select></td>`; }).join('')}
    <td><button class="icono" title="Quitar franja" onclick="quitarBloque(${i})">🗑️</button></td></tr>`).join('')}
  </tbody></table></div>
  ${resumen.length ? `<div class="tarjeta" style="margin-top:14px"><h3>Horas semanales según el horario</h3><div class="fila">${resumen.map((x) => `<span class="chip ${x.plan && x.n !== x.plan ? 'borrador' : 'terminada'}" title="Intensidad registrada en el grupo: ${x.plan || '—'} h">${esc(x.g.nombre)} · ${esc(x.a.abreviatura || x.a.nombre)}: ${x.n} h${x.plan && x.n !== x.plan ? ` (grupo dice ${x.plan})` : ''}</span>`).join(' ')}</div></div>` : ''}`;
};
function ponerCelda(d, bloqueId, v) {
  const h = horario();
  if (!v) delete h.celdas[`${d}|${bloqueId}`];
  else { const [grupoId, areaId] = v.split('|'); h.celdas[`${d}|${bloqueId}`] = { grupoId, areaId }; }
  guardar(); render();
}
function agregarBloque() {
  const h = horario();
  const ult = h.bloques[h.bloques.length - 1];
  const sumar = (t, m) => { const [a, b] = (t || '07:00').split(':').map(Number); const x = a * 60 + b + m; return `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
  h.bloques.push({ id: uid(), inicio: ult ? ult.fin : '07:00', fin: sumar(ult ? ult.fin : '07:00', 55), descanso: false });
  guardar(); render();
}
async function quitarBloque(i) {
  const h = horario();
  const b = h.bloques[i];
  const ocupada = Object.keys(h.celdas).some((k) => k.endsWith('|' + b.id));
  if (ocupada && !(await confirmar('Esta franja tiene clases asignadas. ¿Quitarla?'))) return;
  Object.keys(h.celdas).forEach((k) => { if (k.endsWith('|' + b.id)) delete h.celdas[k]; });
  h.bloques.splice(i, 1);
  guardar(); render();
}
function ordenarBloques() { horario().bloques.sort((a, b) => a.inicio.localeCompare(b.inicio)); guardar(); render(); }

// ---------- Clases de la semana sin planeación ----------
function planDeClase(grupoId, areaId, fecha) {
  return S.planeaciones.find((p) => p.grupoId === grupoId && p.areaId === areaId && (p.sesiones || []).some((s) => s.fecha === fecha));
}
function clasesSinPlan(dias = 7) {
  const r = [];
  const hoy = hoyISO();
  for (let i = 0; i < dias; i++) {
    const f = sumarDias(hoy, i);
    for (const { b, c } of clasesDelDia(f)) if (!planDeClase(c.grupoId, c.areaId, f)) r.push({ fecha: f, b, c });
  }
  return r;
}
function tarjetaSemanaSinPlan() {
  if (!Object.keys(horario().celdas).length) return '';
  const lista = clasesSinPlan(7);
  // agrupar por grupo y área: una planeación semanal por cada uno
  const combos = {};
  lista.forEach((x) => { (combos[`${x.c.grupoId}|${x.c.areaId}`] ||= []).push(x); });
  return `<div class="tarjeta"><h2>🗓️ Planear la semana</h2>
    ${lista.length ? `<p class="ayuda">${lista.length} clase(s) de los próximos 7 días aún no tienen planeación.</p>
      <ul class="lista-simple">${Object.values(combos).map((xs) => `<li><div><b>${esc(nombreGrupoId(xs[0].c.grupoId))}</b> · ${esc(nombreArea(xs[0].c.areaId))}<br>
        <span class="ayuda">${xs.map((x) => esc(fechaLarga(x.fecha)) + ' ' + esc(x.b.inicio)).join(' · ')}</span></div>
        <button class="btn pequeno" onclick="planearClaseDe('${xs[0].c.grupoId}','${xs[0].c.areaId}','${xs[0].fecha}')">＋ Planear</button></li>`).join('')}</ul>`
      : '<p class="ayuda">✔ Todas tus clases de los próximos 7 días tienen planeación.</p>'}</div>`;
}

// ---------- Tarjeta "Mis clases de hoy" para Inicio ----------
function tarjetaClasesHoy() {
  const hoy = hoyISO();
  const tieneHorario = Object.keys(horario().celdas).length > 0;
  if (!tieneHorario) return `<div class="tarjeta"><h2>Mis clases de hoy</h2><p class="ayuda">Registra tu horario para ver aquí tus clases del día. <a href="#" onclick="ir('horario');return false">Ir a Mi horario</a></p></div>`;
  const clases = clasesDelDia(hoy);
  const ahora = new Date().toTimeString().slice(0, 5);
  return `<div class="tarjeta"><div class="cabecera" style="margin-bottom:6px"><h2 style="margin:0">Mis clases de hoy</h2><a href="#" onclick="ir('horario');return false" class="ayuda">Ver horario</a></div>
    ${esDiaSinClase(hoy) ? '<p class="ayuda">Hoy no hay clases (festivo o receso).</p>' : clases.length ? `<ul class="lista-simple">${clases.map(({ b, c }) => {
      const plan = S.planeaciones.find((p) => p.grupoId === c.grupoId && p.areaId === c.areaId && (p.sesiones || []).some((s) => s.fecha === hoy));
      const actual = ahora >= b.inicio && ahora < b.fin;
      const dc = typeof entradaDiario === 'function' ? entradaDiario(c.grupoId, c.areaId, hoy) : null;
      const pend = typeof pendienteAnterior === 'function' ? pendienteAnterior(c.grupoId, c.areaId, hoy) : null;
      return `<li style="${actual ? 'background:var(--azul-claro);border-radius:6px;padding:8px' : ''}"><div><b>${esc(b.inicio)}–${esc(b.fin)}</b> · ${esc(nombreGrupoId(c.grupoId))} · ${esc(nombreArea(c.areaId))} ${actual ? '<span class="chip sesion">Ahora</span>' : ''}
        <br><span class="ayuda">${plan ? '📝 ' + esc(plan.titulo || 'Planeación sin título') : 'Sin planeación para hoy'}</span>
        ${pend ? `<br><span class="ayuda">📓 Pendiente (${esc(fechaCorta(pend.fecha))}): ${esc(pend.pendiente)}</span>` : ''}</div>
        <div class="fila" style="flex-wrap:nowrap">${plan ? `<button class="btn pequeno" onclick="editarPlaneacion('${plan.id}')">Abrir</button>` : `<button class="btn pequeno" onclick="planearClaseDe('${c.grupoId}','${c.areaId}','${hoy}')">＋ Planear</button>`}
          <button class="btn pequeno" onclick="asistenciaDe('${c.grupoId}','${c.areaId}','${hoy}')">✅ Asistencia</button>
          <button class="btn pequeno ${dc ? 'primario' : ''}" title="${dc ? 'Ya registraste esta clase' : 'Registrar cómo fue la clase'}" onclick="abrirDiario('${c.grupoId}','${c.areaId}','${hoy}')">📓 Diario${dc ? ' ✓' : ''}</button>
          ${plan ? pzBotonSesion(plan.id, (plan.sesiones.find((s) => s.fecha === hoy) || {}).id || '').replace('🖍️ Tablero', '🖍️') : ''}
          <button class="btn pequeno" title="Estudiante al azar, grupos, temporizador, proyector" onclick="abrirAula('${c.grupoId}','${c.areaId}')">🎲</button></div></li>`;
    }).join('')}</ul>` : '<p class="ayuda">No tienes clases hoy según tu horario.</p>'}
  </div>`;
}
function asistenciaDe(grupoId, areaId, fecha) { ui.asis = { grupoId, areaId, fecha, periodoId: (periodoDeFecha(fecha) || {}).id || '' }; ir('asistencia'); }
function planearClaseDe(grupoId, areaId, fecha) {
  nuevaPlaneacion(fecha);
  document.getElementById('m-grupo').value = grupoId;
  actualizarAreasModal();
  document.getElementById('m-area').value = areaId;
  actualizarPlantillaModal();
}
