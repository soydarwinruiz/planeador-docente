// ================= Gamificación: puntos, niveles e insignias =================

const MOTIVOS_PUNTOS = [
  { ico: '🙋', t: 'Participación', p: 1 }, { ico: '📚', t: 'Tarea completa', p: 2 }, { ico: '🤝', t: 'Trabajo en equipo', p: 2 },
  { ico: '🦸', t: 'Ayudó a un compañero', p: 2 }, { ico: '💡', t: 'Respuesta creativa', p: 3 }, { ico: '🧹', t: 'Orden y cuidado del aula', p: 1 },
  { ico: '⏰', t: 'Puntualidad', p: 1 }, { ico: '⚠️', t: 'Llamado de atención', p: -1 },
];
const INSIGNIAS = [
  { id: 'lector', ico: '📖', t: 'Gran lector' }, { id: 'matematico', ico: '🧮', t: 'Mente matemática' }, { id: 'cientifico', ico: '🔬', t: 'Científico curioso' },
  { id: 'artista', ico: '🎨', t: 'Artista' }, { id: 'lider', ico: '🧭', t: 'Líder positivo' }, { id: 'companero', ico: '🤝', t: 'Buen compañero' },
  { id: 'superacion', ico: '📈', t: 'Superación' }, { id: 'responsable', ico: '✅', t: 'Responsable' }, { id: 'creativo', ico: '💡', t: 'Creativo' },
  { id: 'convivencia', ico: '🕊️', t: 'Constructor de paz' }, { id: 'ecologico', ico: '🌱', t: 'Guardián ambiental' }, { id: 'estrella', ico: '🌟', t: 'Estrella del periodo' },
];
const NIVELES = [{ min: 0, ico: '🌱', t: 'Explorador' }, { min: 10, ico: '📘', t: 'Aprendiz' }, { min: 25, ico: '⭐', t: 'Experto' }, { min: 50, ico: '🏅', t: 'Maestro' }, { min: 100, ico: '👑', t: 'Leyenda' }];
const COLORES_EQUIPO = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00897b', '#f4511e', '#3949ab', '#c0ca33', '#6d4c41'];

function motivosPuntos() { return S.config.motivosPuntos || MOTIVOS_PUNTOS; }
function juego(grupoId) { return ((S.gamificacion ||= {})[grupoId] ||= { equipos: [], historial: [], insignias: {}, sumarAlEquipo: true }); }
function puntosDe(g, destino) { return g.historial.filter((h) => h.destino === destino).reduce((s, h) => s + h.puntos, 0); }
function puntosAlumno(g, alumnoId) { return puntosDe(g, 'a:' + alumnoId); }
function puntosEquipo(g, eq) { return puntosDe(g, 'e:' + eq.id) + (g.sumarAlEquipo ? eq.miembros.reduce((s, id) => s + puntosAlumno(g, id), 0) : 0); }
function nivelDe(p) { return [...NIVELES].reverse().find((n) => p >= n.min) || NIVELES[0]; }
function siguienteNivel(p) { return NIVELES.find((n) => n.min > p); }

function darPuntos(grupoId, destinos, puntos, motivo) {
  const g = juego(grupoId);
  const fecha = hoyISO();
  destinos.forEach((d) => g.historial.push({ id: uid(), fecha, destino: d, puntos, motivo }));
  guardar();
  // subió de nivel
  destinos.filter((d) => d.startsWith('a:')).forEach((d) => {
    const p = puntosDe(g, d);
    if (puntos > 0 && nivelDe(p) !== nivelDe(p - puntos)) { const a = porId(S.alumnos, d.slice(2)); if (a) aviso(`🎉 ${primerNombre(a)} subió a ${nivelDe(p).ico} ${nivelDe(p).t}`, 'ok'); }
  });
}

RENDERS.gamificacion = () => {
  const c = ui.gam || (ui.gam = { grupoId: '', pestana: 'estudiantes', sel: {} });
  if (!c.grupoId && S.grupos.length) c.grupoId = [...S.grupos].sort(ordenGrupos)[0].id;
  const tabs = [['estudiantes', '🧑‍🎓 Estudiantes'], ['equipos', '👥 Equipos'], ['tablero', '🏆 Tablero'], ['historial', '📜 Historial']];
  const cab = `<div class="cabecera"><div><h1>Gamificación</h1><p class="sub">Puntos, niveles e insignias para motivar la participación, la responsabilidad y el trabajo en equipo.</p></div>
    <div class="acciones"><button class="btn" onclick="editarMotivosPuntos()">⚙️ Motivos y puntos</button><button class="btn primario" onclick="abrirAula(ui.gam.grupoId,'','tablero')">📽️ Proyectar tablero</button></div></div>
    <div class="filtros tarjeta"><div><label>Grupo</label><select onchange="ui.gam.grupoId=this.value;ui.gam.sel={};render()">${opcionesGrupos(c.grupoId, 'Selecciona…')}</select></div></div>
    <div class="pestanas">${tabs.map(([k, t]) => `<button class="${c.pestana === k ? 'activo' : ''}" onclick="ui.gam.pestana='${k}';render()">${t}</button>`).join('')}</div>`;
  if (!c.grupoId) return cab + '<div class="tarjeta vacio">Crea primero tus grupos.</div>';
  return cab + ({ estudiantes: gamEstudiantes, equipos: gamEquipos, tablero: () => `<div class="tarjeta">${htmlTablero(c.grupoId)}</div>`, historial: gamHistorial })[c.pestana](c);
};
function botonesMotivos(accion) {
  return motivosPuntos().map((m, i) => `<button class="btn pequeno ${m.p < 0 ? 'peligro' : ''}" title="${esc(m.t)}" onclick="${accion}(${i})">${m.ico} ${m.p > 0 ? '+' : ''}${m.p}</button>`).join('');
}
function gamEstudiantes(c) {
  const g = juego(c.grupoId);
  const al = alumnosDe(c.grupoId);
  const sel = al.filter((a) => c.sel[a.id]);
  return `<div class="tarjeta fila" style="justify-content:space-between;position:sticky;top:0;z-index:2">
      <span><b>${sel.length}</b> seleccionado(s) · <a href="#" onclick="alumnosDe(ui.gam.grupoId).forEach(a=>ui.gam.sel[a.id]=true);render();return false">todos</a> · <a href="#" onclick="ui.gam.sel={};render();return false">ninguno</a></span>
      <span class="fila">${sel.length ? botonesMotivos('puntosSeleccion') + `<button class="btn pequeno" onclick="dialogoInsignia()">🏅 Insignia</button>` : '<span class="ayuda">Toca las tarjetas para seleccionar estudiantes y dar puntos a varios a la vez.</span>'}</span></div>
    <div class="gam-alumnos">${al.map((a) => { const p = puntosAlumno(g, a.id); const n = nivelDe(p), sig = siguienteNivel(p); const ins = g.insignias[a.id] || [];
      return `<div class="gam-alumno ${c.sel[a.id] ? 'sel' : ''}" onclick="if(event.target.closest('button'))return;ui.gam.sel['${a.id}']=!ui.gam.sel['${a.id}'];render()">
        <div class="gam-nivel" title="${n.t}">${n.ico}</div><div class="gam-nombre">${esc(tipoTitulo(`${a.nombres} ${a.apellidos}`))}</div>
        <div class="gam-puntos">${p} pts</div><div class="ayuda">${n.t}${sig ? ` · faltan ${sig.min - p} para ${sig.t}` : ''}</div>
        ${sig ? `<div class="gam-progreso"><div style="width:${Math.round(((p - n.min) / (sig.min - n.min)) * 100)}%"></div></div>` : ''}
        <div class="gam-insignias">${ins.map((x) => { const t = INSIGNIAS.find((i) => i.id === x.tipo); return t ? `<span title="${esc(t.t)} · ${esc(fechaCorta(x.fecha))}">${t.ico}</span>` : ''; }).join('')}</div>
        <div class="fila" style="justify-content:center;gap:4px"><button class="btn pequeno" onclick="darPuntos(ui.gam.grupoId,['a:${a.id}'],1,'Participación');render()">＋1</button><button class="btn pequeno" onclick="darPuntos(ui.gam.grupoId,['a:${a.id}'],-1,'Ajuste');render()">−1</button></div></div>`; }).join('')}</div>`;
}
function puntosSeleccion(i) {
  const m = motivosPuntos()[i];
  const ids = alumnosDe(ui.gam.grupoId).filter((a) => ui.gam.sel[a.id]).map((a) => 'a:' + a.id);
  darPuntos(ui.gam.grupoId, ids, m.p, m.t);
  ui.gam.sel = {}; render();
  aviso(`${m.ico} ${m.p > 0 ? '+' : ''}${m.p} a ${ids.length} estudiante(s): ${m.t}`, 'ok');
}
function dialogoInsignia() {
  abrirModal(`<h2>🏅 Otorgar insignia</h2><div class="gam-elegir-insignia">${INSIGNIAS.map((x) => `<button class="btn" onclick="otorgarInsignia('${x.id}')"><span style="font-size:28px">${x.ico}</span><br>${esc(x.t)}</button>`).join('')}</div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button></div>`, { ancho: true });
}
function otorgarInsignia(tipo) {
  const g = juego(ui.gam.grupoId);
  const al = alumnosDe(ui.gam.grupoId).filter((a) => ui.gam.sel[a.id]);
  al.forEach((a) => (g.insignias[a.id] ||= []).push({ tipo, fecha: hoyISO() }));
  guardar(); cerrarModal(); ui.gam.sel = {}; render();
  const t = INSIGNIAS.find((i) => i.id === tipo);
  aviso(`${t.ico} ${t.t} para ${al.map(primerNombre).join(', ')}`, 'ok');
}
function gamEquipos(c) {
  const g = juego(c.grupoId);
  return `<div class="tarjeta"><div class="fila" style="justify-content:space-between">
      <span class="ayuda">Arma equipos aquí o en <b>🎲 Herramientas de aula → Grupos de trabajo</b> (botón "Usar en gamificación").</span>
      <span class="fila"><label style="font-weight:normal;color:inherit;margin:0"><input type="checkbox" ${g.sumarAlEquipo ? 'checked' : ''} onchange="juego(ui.gam.grupoId).sumarAlEquipo=this.checked;guardar();render()"> Los puntos individuales también suman al equipo</label>
      <button class="btn" onclick="agregarEquipo()">＋ Equipo</button></span></div></div>
    ${g.equipos.length ? `<div class="aula-equipos">${g.equipos.map((eq, i) => `<div class="aula-equipo" style="border-top:6px solid ${eq.color}">
      <div class="fila" style="flex-wrap:nowrap"><input value="${esc(eq.nombre)}" onchange="juego(ui.gam.grupoId).equipos[${i}].nombre=this.value;guardar()" style="font-weight:700">
        <button class="icono" title="Eliminar equipo" onclick="eliminarEquipo(${i})">🗑️</button></div>
      <div class="gam-puntos" style="margin:6px 0">${puntosEquipo(g, eq)} pts</div>
      <div class="fila" style="gap:4px;margin-bottom:6px">${motivosPuntos().filter((m) => m.p !== 0).slice(0, 4).map((m, k) => `<button class="btn pequeno" title="${esc(m.t)}" onclick="darPuntos(ui.gam.grupoId,['e:${eq.id}'],${m.p},'${esc(m.t)} (equipo)');render()">${m.ico} ${m.p > 0 ? '+' : ''}${m.p}</button>`).join('')}
        <button class="btn pequeno" onclick="darPuntos(ui.gam.grupoId,['e:${eq.id}'],5,'Reto ganado');render()">🏆 +5</button></div>
      <ol>${eq.miembros.map((id) => { const a = porId(S.alumnos, id); return a ? `<li>${esc(tipoTitulo(`${a.nombres} ${a.apellidos}`))} <button class="icono" title="Quitar" onclick="quitarDeEquipo(${i},'${id}')">✕</button></li>` : ''; }).join('')}</ol>
      <select onchange="if(this.value){moverAEquipo(${i},this.value)}"><option value="">＋ Agregar estudiante…</option>${alumnosDe(c.grupoId).filter((a) => !eq.miembros.includes(a.id)).map((a) => `<option value="${a.id}">${esc(nombreAlumno(a))}</option>`).join('')}</select>
    </div>`).join('')}</div>` : '<div class="tarjeta vacio">Aún no hay equipos en este grupo.</div>'}`;
}
function agregarEquipo(miembros = []) {
  const g = juego(ui.gam?.grupoId || aula.grupoId);
  const n = g.equipos.length;
  g.equipos.push({ id: uid(), nombre: `Equipo ${n + 1}`, color: COLORES_EQUIPO[n % COLORES_EQUIPO.length], miembros });
  guardar(); render();
}
async function eliminarEquipo(i) {
  if (!(await confirmar('¿Eliminar este equipo? Sus puntos de equipo se pierden; los puntos individuales se conservan.'))) return;
  const g = juego(ui.gam.grupoId); const eq = g.equipos[i];
  g.historial = g.historial.filter((h) => h.destino !== 'e:' + eq.id);
  g.equipos.splice(i, 1); guardar(); render();
}
function moverAEquipo(i, alumnoId) { const g = juego(ui.gam.grupoId); g.equipos.forEach((e) => { e.miembros = e.miembros.filter((x) => x !== alumnoId); }); g.equipos[i].miembros.push(alumnoId); guardar(); render(); }
function quitarDeEquipo(i, alumnoId) { const g = juego(ui.gam.grupoId); g.equipos[i].miembros = g.equipos[i].miembros.filter((x) => x !== alumnoId); guardar(); render(); }
async function equiposDesdeAula() {
  if (!aula.equipos?.length || !aula.grupoId) return;
  const g = juego(aula.grupoId);
  if (g.equipos.length && !(await confirmar('Este grupo ya tiene equipos en gamificación. ¿Reemplazarlos por estos? (los puntos individuales se conservan)', { boton: 'Reemplazar', peligro: false }))) return;
  g.historial = g.historial.filter((h) => !h.destino.startsWith('e:'));
  g.equipos = aula.equipos.map((eq, i) => ({ id: uid(), nombre: `Equipo ${i + 1}`, color: COLORES_EQUIPO[i % COLORES_EQUIPO.length], miembros: eq.map((m) => m.id) }));
  guardar(); aviso('Equipos guardados en Gamificación', 'ok'); pintarAula();
}
function htmlTablero(grupoId, grande = false) {
  const g = juego(grupoId);
  const ranking = alumnosDe(grupoId).map((a) => ({ a, p: puntosAlumno(g, a.id) })).sort((x, y) => y.p - x.p);
  const equipos = g.equipos.map((eq) => ({ eq, p: puntosEquipo(g, eq) })).sort((x, y) => y.p - x.p);
  const maxE = Math.max(1, ...equipos.map((x) => x.p));
  const medalla = (i) => ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
  return `<div class="gam-tablero ${grande ? 'grande' : ''}">
    ${equipos.length ? `<div><h2>🏆 Equipos</h2>${equipos.map((x, i) => `<div class="gam-barra-eq"><span class="gam-pos">${medalla(i)}</span><span class="gam-eq-nombre">${esc(x.eq.nombre)}</span>
      <div class="gam-barra"><div style="width:${Math.max(3, (Math.max(0, x.p) / maxE) * 100)}%;background:${x.eq.color}"></div></div><b>${x.p}</b></div>`).join('')}</div>` : ''}
    <div><h2>⭐ Estudiantes</h2><ol class="gam-ranking">${ranking.slice(0, grande ? 10 : 15).map((x, i) => { const n = nivelDe(x.p); const ins = (g.insignias[x.a.id] || []).slice(-4); return `<li><span class="gam-pos">${medalla(i)}</span> ${esc(tipoTitulo(`${x.a.nombres} ${x.a.apellidos}`))} <span title="${n.t}">${n.ico}</span>
      <span class="gam-ins-mini">${ins.map((y) => INSIGNIAS.find((t) => t.id === y.tipo)?.ico || '').join('')}</span><b>${x.p}</b></li>`; }).join('')}</ol></div></div>`;
}
function gamHistorial(c) {
  const g = juego(c.grupoId);
  const nombre = (d) => d.startsWith('e:') ? (g.equipos.find((e) => 'e:' + e.id === d)?.nombre || 'Equipo') : tipoTitulo(nombreAlumno(porId(S.alumnos, d.slice(2)) || { apellidos: '', nombres: '' }));
  const h = [...g.historial].reverse().slice(0, 200);
  return `<div class="tarjeta"><div class="fila" style="justify-content:space-between"><span class="ayuda">${g.historial.length} registro(s).</span>
      <button class="btn peligro" onclick="nuevaTemporada()">🔄 Nueva temporada (reiniciar puntos)</button></div>
    ${h.length ? `<table class="tabla"><thead><tr><th>Fecha</th><th>Para</th><th>Motivo</th><th class="num">Puntos</th><th></th></tr></thead><tbody>
      ${h.map((x) => `<tr><td>${esc(fechaCorta(x.fecha))}</td><td>${esc(nombre(x.destino))}</td><td>${esc(x.motivo)}</td><td class="num ${x.puntos < 0 ? 'bajo' : ''}">${x.puntos > 0 ? '+' : ''}${x.puntos}</td>
        <td><button class="icono" title="Deshacer" onclick="juego(ui.gam.grupoId).historial=juego(ui.gam.grupoId).historial.filter(y=>y.id!=='${x.id}');guardar();render()">↶</button></td></tr>`).join('')}</tbody></table>` : '<p class="ayuda">Aún no hay puntos registrados.</p>'}</div>`;
}
async function nuevaTemporada() {
  if (!(await confirmar('Se reinician los puntos del grupo (por ejemplo, al empezar un periodo). Las insignias y los equipos se conservan. ¿Continuar?', { boton: 'Reiniciar puntos' }))) return;
  const g = juego(ui.gam.grupoId);
  (g.temporadas ||= []).push({ fecha: hoyISO(), historial: g.historial });
  g.historial = []; guardar(); render();
}
function editarMotivosPuntos() {
  abrirModal(`<h2>⚙️ Motivos y puntos</h2><p class="ayuda">Un motivo por línea con el formato: <b>emoji | motivo | puntos</b> (los negativos restan).</p>
    <textarea id="gm-motivos" rows="10">${esc(motivosPuntos().map((m) => `${m.ico} | ${m.t} | ${m.p}`).join('\n'))}</textarea>
    <div class="botones"><button class="btn" onclick="S.config.motivosPuntos=null;guardar();cerrarModal();render()">Restaurar sugeridos</button><button class="btn" onclick="cerrarModal()">Cancelar</button>
      <button class="btn primario" onclick="guardarMotivosPuntos()">Guardar</button></div>`);
}
function guardarMotivosPuntos() {
  const lista = document.getElementById('gm-motivos').value.split(/\r?\n/).map((l) => l.split('|').map((x) => x.trim())).filter((x) => x.length >= 3 && x[1])
    .map(([ico, t, p]) => ({ ico: ico || '⭐', t, p: Math.round(+p) || 1 }));
  if (!lista.length) return aviso('Escribe al menos un motivo', 'error');
  S.config.motivosPuntos = lista; guardar(); cerrarModal(); render();
}
