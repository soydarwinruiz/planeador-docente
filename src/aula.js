// ================= Herramientas de aula (pantalla completa) =================

const aula = { pestana: 'azar', grupoId: '', areaId: '', usados: [], historial: [], excluirAusentes: true, equipos: null, modoEquipos: 'numero', valorEquipos: 4, equilibrar: false, roles: false,
  t: { total: 300, resta: 300, corriendo: false, fin: 0 }, proy: { tipo: 'plan', id: '', i: 0, mostrar: false } };
let intervaloTemporizador = null;
const ROLES_EQUIPO = ['Coordinador(a)', 'Relator(a)', 'Secretario(a)', 'Vigía del tiempo', 'Encargado(a) de materiales'];

function abrirAula(grupoId, areaId, pestana) {
  if (grupoId) aula.grupoId = grupoId;
  if (areaId) aula.areaId = areaId;
  if (!aula.grupoId) {
    const ahora = new Date().toTimeString().slice(0, 5);
    const hoy = clasesDelDia(hoyISO());
    const cl = hoy.find(({ b }) => ahora >= b.inicio && ahora < b.fin) || hoy[0];
    aula.grupoId = cl?.c.grupoId || [...S.grupos].sort(ordenGrupos)[0]?.id || '';
    aula.areaId = cl?.c.areaId || '';
  }
  if (pestana) aula.pestana = pestana;
  if (ui.proyector?.pruebaId) { aula.proy = { tipo: 'prueba', id: ui.proyector.pruebaId, i: 0, mostrar: false }; ui.proyector = null; }
  let el = document.getElementById('aula');
  if (!el) { el = document.createElement('div'); el.id = 'aula'; document.body.appendChild(el); }
  el.classList.remove('oculto');
  pintarAula();
}
function cerrarAula() {
  document.getElementById('aula')?.classList.add('oculto');
  if (document.fullscreenElement) document.exitFullscreen();
}
function pantallaCompleta() {
  if (document.fullscreenElement) document.exitFullscreen(); else document.getElementById('aula').requestFullscreen?.();
}
document.addEventListener('keydown', (e) => {
  const el = document.getElementById('aula');
  if (!el || el.classList.contains('oculto')) return;
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'Escape' && !document.fullscreenElement) cerrarAula();
  if (aula.pestana === 'proyector' && (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ')) { e.preventDefault(); moverDiapositiva(1); }
  if (aula.pestana === 'proyector' && (e.key === 'ArrowLeft' || e.key === 'PageUp')) { e.preventDefault(); moverDiapositiva(-1); }
  if (aula.pestana === 'azar' && e.key === 'Enter') elegirAlAzar();
});

function pintarAula() {
  const el = document.getElementById('aula');
  if (!el || el.classList.contains('oculto')) return;
  const tabs = [['azar', '🎲 Estudiante al azar'], ['equipos', '👥 Grupos de trabajo'], ['temporizador', '⏱️ Temporizador'], ['proyector', '📽️ Proyector'], ['tablero', '🏆 Tablero']];
  el.innerHTML = `<div class="aula-barra">
      <div class="pestanas" style="margin:0;border:0">${tabs.map(([k, t]) => `<button class="${aula.pestana === k ? 'activo' : ''}" onclick="aula.pestana='${k}';pintarAula()">${t}</button>`).join('')}</div>
      <div class="fila">${aula.t.corriendo || aula.t.resta !== aula.t.total ? `<span class="aula-mini-reloj ${claseReloj()}" onclick="aula.pestana='temporizador';pintarAula()">⏱️ ${formatoReloj(aula.t.resta)}</span>` : ''}
        <button class="btn" onclick="pantallaCompleta()" title="Pantalla completa (para el video beam)">⛶</button><button class="btn" onclick="cerrarAula()" title="Cerrar (Esc)">✕ Cerrar</button></div></div>
    <div class="aula-cuerpo">${({ azar: aulaAzar, equipos: aulaEquipos, temporizador: aulaTemporizador, proyector: aulaProyector, tablero: aulaTablero })[aula.pestana]()}</div>`;
}
function selectorGrupoAula(extra = '') {
  return `<div class="fila aula-controles"><select onchange="aula.grupoId=this.value;aula.usados=[];aula.historial=[];aula.equipos=null;pintarAula()" style="width:auto">${opcionesGrupos(aula.grupoId, 'Elige el grupo…')}</select>${extra}</div>`;
}
// Estudiantes presentes hoy (si hay asistencia registrada, se excluyen los ausentes)
function presentesAula() {
  const lista = aula.grupoId ? alumnosDe(aula.grupoId) : [];
  if (!aula.excluirAusentes) return lista;
  const hoy = hoyISO();
  const ausentes = new Set();
  for (const [k, reg] of Object.entries(S.asistencia)) if (k.startsWith(aula.grupoId + '|')) for (const [id, e] of Object.entries(reg[hoy] || {})) if (e === 'A') ausentes.add(id);
  return lista.filter((a) => !ausentes.has(a.id));
}

// ---------- Estudiante al azar ----------
function aulaAzar() {
  const pres = presentesAula();
  const quedan = pres.filter((a) => !aula.usados.includes(a.id));
  const actual = aula.historial[0] && porId(S.alumnos, aula.historial[0]);
  return `${selectorGrupoAula(`<label style="font-weight:normal;color:inherit;margin:0"><input type="checkbox" ${aula.excluirAusentes ? 'checked' : ''} onchange="aula.excluirAusentes=this.checked;pintarAula()"> Excluir ausentes de hoy</label>`)}
    ${!pres.length ? '<p class="aula-vacio">Elige un grupo con estudiantes.</p>' : `
    <div class="aula-nombre" id="azar-nombre">${actual ? esc(tipoTitulo(`${actual.nombres} ${actual.apellidos}`)) : '¿Quién será?'}</div>
    ${actual ? `<div class="fila" style="justify-content:center;margin-bottom:6px">${motivosPuntos().filter((m) => m.p > 0).slice(0, 3).map((m) => `<button class="btn" onclick="darPuntos(aula.grupoId,['a:${actual.id}'],${m.p},'${esc(m.t)}');aviso('${m.ico} +${m.p} para ${esc(primerNombre(actual))}','ok')">${m.ico} +${m.p} ${esc(m.t)}</button>`).join('')}</div>` : ''}
    <div class="fila" style="justify-content:center"><button class="btn primario aula-boton" onclick="elegirAlAzar()">🎲 Elegir</button>
      <button class="btn" onclick="aula.usados=[];aula.historial=[];pintarAula()">↺ Reiniciar</button></div>
    <p class="aula-ayuda">Sin repetir hasta que pasen todos · quedan ${quedan.length} de ${pres.length} · Enter también elige</p>
    ${aula.historial.length > 1 ? `<p class="aula-ayuda">Ya participaron: ${aula.historial.slice(1).map((id) => esc(primerNombre(porId(S.alumnos, id) || {}))).join(', ')}</p>` : ''}`}`;
}
function elegirAlAzar() {
  const pres = presentesAula();
  if (!pres.length) return;
  let quedan = pres.filter((a) => !aula.usados.includes(a.id));
  if (!quedan.length) { aula.usados = []; quedan = pres; aviso('Ya participaron todos: empieza una nueva ronda'); }
  const elegido = quedan[Math.floor(Math.random() * quedan.length)];
  const cont = document.getElementById('azar-nombre');
  let k = 0;
  const giro = setInterval(() => {
    if (cont) cont.textContent = tipoTitulo(nombreAlumno(pres[Math.floor(Math.random() * pres.length)]));
    if (++k > 14) {
      clearInterval(giro);
      aula.usados.push(elegido.id); aula.historial.unshift(elegido.id);
      pintarAula();
      document.getElementById('azar-nombre')?.classList.add('destacar');
    }
  }, 70);
}

// ---------- Grupos de trabajo ----------
function aulaEquipos() {
  const pres = presentesAula();
  const controles = `<select onchange="aula.modoEquipos=this.value;pintarAula()" style="width:auto"><option value="numero" ${aula.modoEquipos === 'numero' ? 'selected' : ''}>Número de equipos</option><option value="tamano" ${aula.modoEquipos === 'tamano' ? 'selected' : ''}>Estudiantes por equipo</option></select>
    <input type="number" min="1" max="40" value="${aula.valorEquipos}" style="width:80px" onchange="aula.valorEquipos=Math.max(1,+this.value||1)">
    <label style="font-weight:normal;color:inherit;margin:0" title="Reparte a los de mejor y menor desempeño en todos los equipos"><input type="checkbox" ${aula.equilibrar ? 'checked' : ''} onchange="aula.equilibrar=this.checked"> Equilibrar por desempeño</label>
    <label style="font-weight:normal;color:inherit;margin:0"><input type="checkbox" ${aula.roles ? 'checked' : ''} onchange="aula.roles=this.checked"> Asignar roles</label>
    <label style="font-weight:normal;color:inherit;margin:0"><input type="checkbox" ${aula.excluirAusentes ? 'checked' : ''} onchange="aula.excluirAusentes=this.checked"> Excluir ausentes</label>
    <button class="btn primario" onclick="formarEquipos()">🔀 Formar equipos</button>`;
  return `${selectorGrupoAula(controles)}
    ${!pres.length ? '<p class="aula-vacio">Elige un grupo con estudiantes.</p>' : aula.equipos ? `<div class="aula-equipos">${aula.equipos.map((eq, i) => `<div class="aula-equipo"><h3>Equipo ${i + 1}</h3><ol>${eq.map((m) => `<li>${esc(tipoTitulo(nombreAlumno(porId(S.alumnos, m.id) || { apellidos: '', nombres: '' })))}${m.rol ? ` <span class="aula-rol">${esc(m.rol)}</span>` : ''}</li>`).join('')}</ol></div>`).join('')}</div>
      <div class="fila" style="justify-content:center;margin-top:12px"><button class="btn" onclick="equiposDesdeAula()">🏆 Usar en gamificación</button><button class="btn" onclick="copiarTexto(aula.equipos.map((eq,i)=>'Equipo '+(i+1)+': '+eq.map(m=>tipoTitulo(nombreAlumno(porId(S.alumnos,m.id)))+(m.rol?' ('+m.rol+')':'')).join(', ')).join('\\n'))">📋 Copiar</button></div>`
      : `<p class="aula-vacio">${pres.length} estudiante(s). Elige cómo formar los equipos y pulsa "Formar equipos".</p>`}`;
}
function formarEquipos() {
  const pres = presentesAula();
  if (!pres.length) return;
  const n = aula.modoEquipos === 'numero' ? Math.min(pres.length, aula.valorEquipos) : Math.max(1, Math.ceil(pres.length / aula.valorEquipos));
  let orden = pres.map((a) => ({ a, r: Math.random() }));
  if (aula.equilibrar) {
    const per = periodoActual();
    orden.forEach((x) => { x.p = promedioPeriodoAlumno(x.a.id, aula.grupoId, per?.id) ?? 3; });
    orden.sort((x, y) => (y.p - x.p) || (x.r - y.r));
  } else orden.sort((x, y) => x.r - y.r);
  const equipos = Array.from({ length: n }, () => []);
  // reparto en serpentina: 1,2,3,3,2,1… para equilibrar
  orden.forEach((x, k) => { const vuelta = Math.floor(k / n), pos = k % n; equipos[vuelta % 2 ? n - 1 - pos : pos].push({ id: x.a.id }); });
  if (aula.equilibrar) equipos.forEach((eq) => eq.sort(() => Math.random() - 0.5));
  if (aula.roles) equipos.forEach((eq) => eq.forEach((m, i) => { m.rol = ROLES_EQUIPO[i] || ''; }));
  aula.equipos = equipos;
  pintarAula();
}

// ---------- Temporizador ----------
function formatoReloj(s) { s = Math.max(0, Math.ceil(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
function claseReloj() { return aula.t.resta <= 0 ? 'fin' : aula.t.resta <= 10 ? 'rojo' : aula.t.resta <= 60 ? 'amarillo' : ''; }
function aulaTemporizador() {
  const t = aula.t;
  return `<div class="aula-reloj ${claseReloj()}" id="reloj">${formatoReloj(t.resta)}</div>
    <div class="fila" style="justify-content:center">${[1, 3, 5, 10, 15, 20, 30].map((m) => `<button class="btn" onclick="ponerTemporizador(${m * 60})">${m} min</button>`).join('')}
      <input type="number" min="1" max="180" placeholder="min" style="width:80px" onchange="ponerTemporizador((+this.value||1)*60)"></div>
    <div class="fila" style="justify-content:center;margin-top:14px">
      <button class="btn primario aula-boton" onclick="alternarTemporizador()">${t.corriendo ? '⏸ Pausar' : '▶ Iniciar'}</button>
      <button class="btn aula-boton" onclick="ponerTemporizador(aula.t.total)">↺ Reiniciar</button>
      <button class="btn aula-boton" onclick="aula.t.resta+=60;aula.t.fin+=60000;pintarAula()">＋1 min</button></div>
    <p class="aula-ayuda">Se pone amarillo en el último minuto, rojo en los últimos 10 segundos y suena al terminar.</p>`;
}
function ponerTemporizador(seg) {
  clearInterval(intervaloTemporizador);
  aula.t = { total: seg, resta: seg, corriendo: false, fin: 0 };
  pintarAula();
}
function alternarTemporizador() {
  const t = aula.t;
  if (t.corriendo) { t.corriendo = false; clearInterval(intervaloTemporizador); t.resta = (t.fin - Date.now()) / 1000; pintarAula(); return; }
  if (t.resta <= 0) t.resta = t.total;
  t.corriendo = true; t.fin = Date.now() + t.resta * 1000;
  clearInterval(intervaloTemporizador);
  intervaloTemporizador = setInterval(() => {
    t.resta = (t.fin - Date.now()) / 1000;
    if (t.resta <= 0) { t.resta = 0; t.corriendo = false; clearInterval(intervaloTemporizador); sonarAlarma(); }
    const r = document.getElementById('reloj');
    if (r && aula.pestana === 'temporizador' && t.corriendo) { r.textContent = formatoReloj(t.resta); r.className = 'aula-reloj ' + claseReloj(); }
    else pintarAula();
  }, 250);
  pintarAula();
}
function sonarAlarma() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((d) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.type = 'square'; g.gain.value = 0.15;
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.25);
    });
  } catch (e) { /* sin audio */ }
}

// ---------- Proyector ----------
function diapositivasProyector() {
  const pr = aula.proy;
  if (pr.tipo === 'prueba') {
    const p = porId(S.pruebas, pr.id);
    if (!p) return [];
    return [{ titulo: p.titulo || 'Prueba', cuerpo: [p.instrucciones, p.tiempo ? `Tiempo: ${p.tiempo} minutos` : ''].filter(Boolean).join('\n\n') },
      ...p.preguntas.map((q, i) => ({ etiqueta: `Pregunta ${i + 1} de ${p.preguntas.length}`, contexto: q.contexto, titulo: q.enunciado, opciones: q.opciones, correcta: q.correcta, respuesta: q.respuesta }))];
  }
  const p = porId(S.planeaciones, pr.id);
  if (!p) return [];
  const d = [{ etiqueta: `${nombreArea(p.areaId)} · ${nombreGrupoId(p.grupoId)}`, titulo: p.titulo || 'Clase', cuerpo: [p.pregunta ? '❓ ' + p.pregunta : '', p.objetivo ? '🎯 ' + p.objetivo : ''].filter(Boolean).join('\n\n') }];
  const hoy = hoyISO();
  const sesiones = p.sesiones.filter((s) => MOMENTOS.some((m) => (s[m.k] || '').trim()));
  const ses = sesiones.find((s) => s.fecha === hoy) ? [sesiones.find((s) => s.fecha === hoy)] : sesiones;
  for (const s of ses) for (const m of MOMENTOS) if ((s[m.k] || '').trim()) d.push({ etiqueta: `${s.titulo || 'Sesión'} · ${m.t}`, titulo: m.t, cuerpo: s[m.k] });
  return d;
}
function aulaProyector() {
  const pr = aula.proy;
  if (!pr.id) {
    const hoy = hoyISO();
    const plan = aula.grupoId && S.planeaciones.find((p) => p.grupoId === aula.grupoId && (!aula.areaId || p.areaId === aula.areaId) && p.sesiones.some((s) => s.fecha === hoy));
    if (plan) Object.assign(pr, { tipo: 'plan', id: plan.id, i: 0 });
  }
  const planes = [...S.planeaciones].sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || '')).slice(0, 60);
  const sel = `<select onchange="const [t,id]=this.value.split('|');aula.proy={tipo:t,id,i:0,mostrar:false};pintarAula()" style="width:auto;max-width:520px">
    <option value="|">Elige qué proyectar…</option>
    <optgroup label="Planeaciones">${planes.map((p) => `<option value="plan|${p.id}" ${pr.tipo === 'plan' && pr.id === p.id ? 'selected' : ''}>${esc(p.titulo || 'Sin título')} · ${esc(nombreGrupoId(p.grupoId))} · ${esc(fechaCorta(p.fechaInicio))}</option>`).join('')}</optgroup>
    <optgroup label="Pruebas y talleres">${S.pruebas.map((p) => `<option value="prueba|${p.id}" ${pr.tipo === 'prueba' && pr.id === p.id ? 'selected' : ''}>${esc(p.titulo || 'Sin título')}</option>`).join('')}</optgroup></select>`;
  const d = diapositivasProyector();
  if (!d.length) return `<div class="fila aula-controles">${sel}</div><p class="aula-vacio">Elige una planeación (se muestran sus momentos de clase) o una prueba (una pregunta por pantalla).</p>`;
  pr.i = Math.max(0, Math.min(d.length - 1, pr.i));
  const x = d[pr.i];
  return `<div class="fila aula-controles">${sel}<span class="aula-ayuda" style="margin:0">Usa ← → o la barra espaciadora · ⛶ para pantalla completa</span></div>
    <div class="aula-diapositiva">
      ${x.etiqueta ? `<div class="aula-etiqueta">${esc(x.etiqueta)}</div>` : ''}
      ${x.contexto ? `<div class="aula-contexto">${esc(x.contexto)}</div>` : ''}
      <h2>${esc(x.titulo)}</h2>
      ${x.cuerpo ? `<div class="aula-texto">${esc(x.cuerpo)}</div>` : ''}
      ${x.opciones?.length ? `<ol class="aula-opciones" type="A">${x.opciones.map((o, j) => `<li class="${pr.mostrar && LETRAS_OP[j] === x.correcta ? 'correcta' : ''}">${esc(o)}</li>`).join('')}</ol>` : ''}
      ${pr.mostrar && x.respuesta ? `<div class="aula-contexto">✔ ${esc(x.respuesta)}</div>` : ''}
    </div>
    <div class="fila" style="justify-content:center"><button class="btn aula-boton" onclick="moverDiapositiva(-1)" ${pr.i ? '' : 'disabled'}>←</button>
      <span class="aula-ayuda" style="margin:0 12px">${pr.i + 1} / ${d.length}</span>
      <button class="btn aula-boton" onclick="moverDiapositiva(1)" ${pr.i < d.length - 1 ? '' : 'disabled'}>→</button>
      ${x.correcta || x.respuesta ? `<button class="btn" onclick="aula.proy.mostrar=!aula.proy.mostrar;pintarAula()">${pr.mostrar ? '🙈 Ocultar respuesta' : '👁️ Mostrar respuesta'}</button>` : ''}</div>`;
}
function aulaTablero() {
  return `${selectorGrupoAula(`<button class="btn" onclick="pintarAula()">↻ Actualizar</button>`)}${aula.grupoId ? htmlTablero(aula.grupoId, true) : '<p class="aula-vacio">Elige un grupo.</p>'}`;
}
function moverDiapositiva(d) {
  const n = diapositivasProyector().length;
  aula.proy.i = Math.max(0, Math.min(n - 1, aula.proy.i + d));
  aula.proy.mostrar = false;
  pintarAula();
}
