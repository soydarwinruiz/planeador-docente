// ================= Registro de cambios de notas =================
// En cada guardado se comparan las notas (y recuperaciones) con las del guardado anterior y se anota cada cambio:
// fecha y hora, estudiante, actividad, nota anterior, nota nueva y desde dónde se hizo. Así queda constancia
// aunque el cambio venga del celular, de una importación, de una rúbrica o de borrar una actividad.

const REG = { notas: null, recup: null, info: {}, origen: '' };
const REGISTRO_MAX = 40000;
const ORIGENES_REG = { computador: '💻 Computador', celular: '📱 Celular', importacion: '📥 Importación', rubrica: '📋 Rúbrica', retro: '✍️ Retroalimentación', lote: '👥 Nota por lote', restaurada: '↩️ Restaurada', papelera: '🗑️ Papelera' };

// Lo llaman las funciones que cambian notas desde un lugar especial (celular, importación…)
function origenNotas(o) { REG.origen = o; }
function copiaNotas(n) { const c = {}; for (const k in n || {}) c[k] = { ...n[k] }; return c; }
function copiaRecup(r) { const c = {}; for (const k in r || {}) { c[k] = {}; for (const a in r[k]) c[k][a] = r[k][a]?.nota; } return c; }
function infoActividades(E) {
  const m = {};
  for (const pl of E.planillas || []) for (const cr of pl.criterios || []) for (const a of cr.actividades || []) m[a.id] = { g: pl.grupoId, ar: pl.areaId, p: pl.periodoId, n: a.nombre, c: cr.nombre };
  return m;
}
// Toma la foto inicial (al abrir, al restaurar un respaldo o al iniciar un año) sin registrar nada
function reiniciarRegistroNotas() {
  const E = estadoActual();
  REG.notas = copiaNotas(E.notas); REG.recup = copiaRecup(E.recuperaciones); REG.info = infoActividades(E); REG.origen = '';
}
function registrarCambiosNotas() {
  const E = estadoActual();
  if (!E || !REG.notas) return 0;
  const origen = REG.origen || 'computador';
  REG.origen = '';
  const fecha = new Date().toISOString();
  const info = infoActividades(E);
  const nuevos = [];
  const anotar = (act, al, antes, despues, extra = {}) => {
    const i = info[act] || REG.info[act] || {};
    nuevos.push({ f: fecha, act, al, antes: antes ?? null, despues: despues ?? null, o: origen, g: i.g || extra.g || '', ar: i.ar || extra.ar || '', p: i.p || extra.p || '', n: extra.n || i.n || '', c: i.c || '', ...(extra.tipo ? { tipo: extra.tipo } : {}) });
  };
  const ahora = E.notas || {};
  for (const act of new Set([...Object.keys(REG.notas), ...Object.keys(ahora)])) {
    const a = REG.notas[act] || {}, b = ahora[act] || {};
    if (a === b) continue;
    for (const al of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const x = a[al] === '' ? undefined : a[al], y = b[al] === '' ? undefined : b[al];
      if (x !== y && !(x == null && y == null)) anotar(act, al, x, y);
    }
  }
  const recup = copiaRecup(E.recuperaciones);
  for (const k of new Set([...Object.keys(REG.recup), ...Object.keys(recup)])) {
    const a = REG.recup[k] || {}, b = recup[k] || {};
    for (const al of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[al] !== b[al]) { const [g, ar, p] = k.split('|'); anotar('rec:' + k, al, a[al], b[al], { g, ar, p, n: p === 'anual' ? 'Recuperación final del año' : 'Recuperación del periodo', tipo: 'recuperacion' }); }
    }
  }
  REG.notas = copiaNotas(ahora); REG.recup = recup; REG.info = info;
  if (nuevos.length) {
    const lista = (E.registroNotas ||= []);
    lista.push(...nuevos);
    if (lista.length > REGISTRO_MAX) lista.splice(0, lista.length - REGISTRO_MAX);
  }
  return nuevos.length;
}

function historialNota(actId, alumnoId) { return (S.registroNotas || []).filter((r) => r.act === actId && r.al === alumnoId); }
function fechaHoraReg(iso) { return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function textoNotaReg(v) { return v == null ? '—' : fmtNota(+v); }

// Ventana con el historial de una nota (clic derecho sobre la nota en la planilla)
function verHistorialNota(actId, alumnoId) {
  const h = historialNota(actId, alumnoId).slice().reverse();
  const a = porId(S.alumnos, alumnoId);
  const act = REG.info[actId] || infoActividades(S)[actId] || {};
  abrirModal(`<h2>🕘 Historial de la nota</h2>
    <p><b>${esc(a ? nombreAlumno(a) : 'Estudiante')}</b> · ${esc(act.c ? act.c + ' · ' : '')}${esc(act.n || 'Actividad')}</p>
    ${h.length ? `<table class="tabla"><thead><tr><th>Fecha</th><th class="num">Antes</th><th class="num">Después</th><th>Desde</th><th></th></tr></thead><tbody>
      ${h.map((r) => `<tr><td>${esc(fechaHoraReg(r.f))}</td><td class="num">${textoNotaReg(r.antes)}</td><td class="num"><b>${textoNotaReg(r.despues)}</b></td><td>${esc(ORIGENES_REG[r.o] || r.o)}</td>
        <td>${r.antes != null ? `<button class="btn pequeno" onclick="restaurarNotaRegistro('${esc(r.act)}','${esc(r.al)}',${+r.antes})" title="Volver a poner ${textoNotaReg(r.antes)}">↩️ ${textoNotaReg(r.antes)}</button>` : ''}</td></tr>`).join('')}
    </tbody></table>` : '<p class="ayuda">Esta nota no ha cambiado desde que se activó el registro.</p>'}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button></div>`);
}
function restaurarNotaRegistro(actId, alumnoId, valor) {
  if (actId.startsWith('rec:')) {
    const k = actId.slice(4);
    (((S.recuperaciones ||= {})[k] ||= {})[alumnoId] ||= {}).nota = valor;
  } else {
    if (!infoActividades(S)[actId]) return aviso('La actividad ya no existe. Recupérala primero desde la papelera.', 'error');
    (S.notas[actId] ||= {})[alumnoId] = valor;
  }
  origenNotas('restaurada');
  guardar(); cerrarModal(); render();
  aviso(`Nota restaurada: ${fmtNota(valor)}`, 'ok');
}

// Pestaña "Registro de cambios" en Evaluación y notas
function vistaRegistroNotas(c) {
  const f = (ui.regF ||= { alumnoId: '', desde: '', hasta: '', origen: '' });
  const lista = (S.registroNotas || []).filter((r) => (!c.grupoId || r.g === c.grupoId) && (!c.areaId || r.ar === c.areaId) && (!c.periodoId || r.p === c.periodoId)
    && (!f.alumnoId || r.al === f.alumnoId) && (!f.origen || r.o === f.origen) && (!f.desde || r.f.slice(0, 10) >= f.desde) && (!f.hasta || r.f.slice(0, 10) <= f.hasta)).reverse();
  const visibles = lista.slice(0, 500);
  return `<div class="filtros tarjeta">
      <div><label>Estudiante</label><select onchange="ui.regF.alumnoId=this.value;render()"><option value="">Todos</option>${alumnosDe(c.grupoId).map((a) => `<option value="${a.id}" ${f.alumnoId === a.id ? 'selected' : ''}>${esc(nombreAlumno(a))}</option>`).join('')}</select></div>
      <div><label>Desde</label><input type="date" value="${esc(f.desde)}" onchange="ui.regF.desde=this.value;render()"></div>
      <div><label>Hasta</label><input type="date" value="${esc(f.hasta)}" onchange="ui.regF.hasta=this.value;render()"></div>
      <div><label>Origen</label><select onchange="ui.regF.origen=this.value;render()"><option value="">Todos</option>${Object.entries(ORIGENES_REG).map(([k, t]) => `<option value="${k}" ${f.origen === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div style="align-self:end"><button class="btn" onclick="exportarRegistroNotas()">⬇️ Excel</button></div>
    </div>
    <div class="tarjeta">${visibles.length ? `<table class="tabla"><thead><tr><th>Fecha</th><th>Estudiante</th><th>Actividad</th><th class="num">Antes</th><th class="num">Después</th><th>Desde</th><th></th></tr></thead><tbody>
      ${visibles.map((r) => { const a = porId(S.alumnos, r.al); return `<tr><td style="white-space:nowrap">${esc(fechaHoraReg(r.f))}</td><td>${esc(a ? nombreAlumno(a) : '(estudiante retirado)')}</td>
        <td>${esc(r.c ? r.c + ' · ' : '')}${esc(r.n || '')}</td><td class="num">${textoNotaReg(r.antes)}</td><td class="num"><b class="${claseNota(r.despues)}">${textoNotaReg(r.despues)}</b></td><td>${esc(ORIGENES_REG[r.o] || r.o)}</td>
        <td><button class="icono" title="Historial de esta nota" onclick="verHistorialNota('${esc(r.act)}','${esc(r.al)}')">🕘</button></td></tr>`; }).join('')}
    </tbody></table>${lista.length > visibles.length ? `<p class="ayuda">Se muestran los 500 cambios más recientes de ${lista.length}. Usa los filtros o exporta a Excel.</p>` : ''}`
      : '<div class="vacio">No hay cambios de notas con estos filtros.</div>'}
    <p class="ayuda">Cada vez que una nota se pone, se cambia o se borra (en el computador, desde el celular, al importar, con rúbrica o al eliminar una actividad) queda aquí. Clic derecho sobre una nota de la planilla muestra su historial y permite volver a un valor anterior. El registro de cada año queda en Años anteriores.</p></div>`;
}
function exportarRegistroNotas() {
  const c = ui.cal;
  const filas = [['Fecha', 'Hora', 'Estudiante', 'Grupo', 'Área', 'Periodo', 'Componente', 'Actividad', 'Nota anterior', 'Nota nueva', 'Desde']];
  for (const r of (S.registroNotas || []).filter((x) => (!c.grupoId || x.g === c.grupoId) && (!c.areaId || x.ar === c.areaId))) {
    const a = porId(S.alumnos, r.al), d = new Date(r.f);
    filas.push([d.toLocaleDateString('es-CO'), d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), a ? nombreAlumno(a) : '', nombreGrupoId(r.g), nombreArea(r.ar), r.p === 'anual' ? 'Año' : nombrePeriodo(r.p), r.c || '', r.n || '', textoNotaReg(r.antes), textoNotaReg(r.despues), (ORIGENES_REG[r.o] || r.o).replace(/^\S+\s/, '')]);
  }
  exportarExcel(`Registro de cambios de notas ${nombreGrupoId(c.grupoId)} ${nombreArea(c.areaId)}`, filas);
}
