// ================= Pruebas tipo Saber y talleres =================

const LETRAS_OP = ['A', 'B', 'C', 'D', 'E', 'F'];

function nuevaPregunta(tipo = 'multiple', datos = {}) {
  return Object.assign({ id: uid(), tipo, contexto: '', enunciado: '', opciones: tipo === 'multiple' ? ['', '', '', ''] : [], correcta: tipo === 'multiple' ? 'A' : '', competencia: '', explicacion: '', respuesta: '', puntos: 1 }, datos);
}
function preguntasCerradas(p) { return p.preguntas.filter((q) => q.tipo !== 'abierta'); }
function gradoPrueba(p) { const g = porId(S.grupos, p.grupoId); return g ? +g.grado : +p.grado || ''; }

// ---------- Listado ----------
RENDERS.pruebas = () => {
  const lista = [...S.pruebas].sort((a, b) => (b.modificada || '').localeCompare(a.modificada || ''));
  return `
  <div class="cabecera"><div><h1>Pruebas y talleres</h1><p class="sub">Crea pruebas tipo Saber (selección múltiple con única respuesta) y talleres con preguntas abiertas, a mano o con IA. Imprime el cuadernillo con hoja de respuestas, califica digitando las respuestas y envía las notas a la planilla.</p></div>
    <div class="acciones"><button class="btn primario" onclick="nuevaPrueba()">＋ Nueva prueba o taller</button></div></div>
  ${lista.length ? `<div class="rejilla r3">${lista.map((p) => { const nr = Object.keys(p.respuestas || {}).length; return `<div class="tarjeta">
    <div class="cabecera" style="margin-bottom:4px"><span class="chip ${p.tipo === 'taller' ? 'semanal' : 'sesion'}">${p.tipo === 'taller' ? '📄 Taller' : '🧪 Prueba'}</span>
      <span><button class="icono" title="Duplicar" onclick="duplicarPrueba('${p.id}')">📑</button><button class="icono" title="Eliminar" onclick="eliminarPrueba('${p.id}')">🗑️</button></span></div>
    <h3 style="margin:6px 0">${esc(p.titulo || 'Sin título')}</h3>
    <p class="ayuda" style="margin:0">${esc(nombreArea(p.areaId))} · ${p.grupoId ? esc(nombreGrupoId(p.grupoId)) : gradoPrueba(p) ? gradoPrueba(p) + '°' : ''}${p.periodoId ? ' · ' + esc(nombrePeriodo(p.periodoId)) : ''}</p>
    <p class="ayuda">${p.preguntas.length} pregunta(s)${nr ? ` · ${nr} estudiante(s) calificados` : ''}${p.actividadId ? ' · notas en la planilla ✔' : ''}</p>
    <button class="btn pequeno primario" onclick="ir('pruebaEditor',{id:'${p.id}'})">Abrir</button></div>`; }).join('')}</div>`
    : '<div class="tarjeta vacio"><div class="grande">🧪</div>Aún no tienes pruebas. Crea la primera y genera las preguntas con IA o escríbelas tú.</div>'}`;
};
function nuevaPrueba() {
  const per = periodoDeFecha(hoyISO());
  abrirModal(`<h2>Nueva prueba o taller</h2>
    <div class="campo"><label>Tipo</label><div class="fila">
      <label style="font-weight:normal;color:inherit"><input type="radio" name="pr-tipo" value="prueba" checked> 🧪 Prueba tipo Saber (selección múltiple)</label>
      <label style="font-weight:normal;color:inherit"><input type="radio" name="pr-tipo" value="taller"> 📄 Taller (preguntas abiertas y de selección)</label></div></div>
    <div class="rejilla r2">
      <div class="campo" style="grid-column:span 2"><label>Título</label><input id="pr-titulo" placeholder="Ej.: Prueba de periodo – Fracciones"></div>
      <div class="campo"><label>Grupo</label><select id="pr-grupo" onchange="const g=porId(S.grupos,this.value);if(g){document.getElementById('pr-grado').value=g.grado;document.getElementById('pr-area').innerHTML=opcionesAreas(areasDeGrupo(g.id)[0]?.id,'Selecciona…',areasDeGrupo(g.id).length?areasDeGrupo(g.id):S.areas)}">${opcionesGrupos('', '(para todo el grado)')}</select></div>
      <div class="campo"><label>Grado</label><select id="pr-grado">${GRADOS.map((g) => `<option value="${g}" ${g === 6 ? 'selected' : ''}>${g}°</option>`).join('')}</select></div>
      <div class="campo"><label>Área</label><select id="pr-area">${opcionesAreas(S.areas[0]?.id, 'Selecciona…')}</select></div>
      <div class="campo"><label>Periodo</label><select id="pr-periodo">${opcionesPeriodos(per?.id || '', '(sin periodo)')}</select></div>
    </div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="crearPrueba()">Crear</button></div>`);
}
function crearPrueba() {
  const v = (id) => document.getElementById(id).value;
  const tipo = document.querySelector('input[name=pr-tipo]:checked').value;
  const p = { id: uid(), tipo, titulo: v('pr-titulo').trim(), grupoId: v('pr-grupo'), grado: +v('pr-grado'), areaId: v('pr-area'), periodoId: v('pr-periodo'),
    instrucciones: tipo === 'taller' ? 'Lee con atención y responde cada punto de forma clara y completa.' : 'Lee cada pregunta y marca en la hoja de respuestas una sola opción (A, B, C o D). No se permiten tachones ni enmendaduras.',
    tiempo: tipo === 'taller' ? '' : 60, preguntas: [], respuestas: {}, abiertas: {}, creada: new Date().toISOString(), modificada: new Date().toISOString() };
  S.pruebas.push(p); guardar(); cerrarModal();
  ir('pruebaEditor', { id: p.id });
}
function duplicarPrueba(id) {
  const c = structuredClone(porId(S.pruebas, id));
  Object.assign(c, { id: uid(), titulo: c.titulo + ' (copia)', respuestas: {}, abiertas: {}, actividadId: '', creada: new Date().toISOString(), modificada: new Date().toISOString() });
  c.preguntas.forEach((q) => { q.id = uid(); });
  S.pruebas.push(c); guardar(); render();
}
async function eliminarPrueba(id) {
  if (!(await confirmar('¿Eliminar esta prueba y sus resultados? Las notas ya enviadas a la planilla se conservan.'))) return;
  S.pruebas = S.pruebas.filter((p) => p.id !== id); guardar(); render();
}
function tocarPrueba(p) { p.modificada = new Date().toISOString(); guardar(); }

// ---------- Editor ----------
RENDERS.pruebaEditor = ({ id }) => {
  const p = porId(S.pruebas, id);
  if (!p) return '<p>Prueba no encontrada.</p>';
  const pest = ui.pruebaPest || 'preguntas';
  const tabs = [['preguntas', `✏️ Preguntas (${p.preguntas.length})`], ['calificar', '✅ Calificar'], ['resultados', '📈 Resultados']];
  return `
  <div class="cabecera"><div><h1>${esc(p.titulo || 'Sin título')}</h1><p class="sub">${p.tipo === 'taller' ? '📄 Taller' : '🧪 Prueba tipo Saber'} · ${esc(nombreArea(p.areaId))} · ${p.grupoId ? esc(nombreGrupoId(p.grupoId)) : gradoPrueba(p) + '°'}</p></div>
    <div class="acciones"><button class="btn" onclick="ir('pruebas')">← Volver</button>
      <button class="btn" onclick="exportarPrueba('${p.id}','estudiante')">📄 Word del estudiante</button>
      <button class="btn" onclick="exportarPrueba('${p.id}','docente')">🔑 Clave del docente</button>
      <button class="btn" onclick="ui.proyector={pruebaId:'${p.id}',i:0};abrirAula('','','proyector')" title="Mostrar las preguntas en el video beam">📽️ Proyectar</button></div></div>
  <div class="pestanas">${tabs.map(([k, t]) => `<button class="${pest === k ? 'activo' : ''}" onclick="ui.pruebaPest='${k}';render()">${t}</button>`).join('')}</div>
  ${pest === 'calificar' ? vistaCalificarPrueba(p) : pest === 'resultados' ? vistaResultadosPrueba(p) : vistaPreguntasPrueba(p)}`;
};
function vistaPreguntasPrueba(p) {
  const cp = (campo) => `onchange="cambiarPrueba('${p.id}','${campo}',this.value)"`;
  return `
  <div class="tarjeta"><div class="rejilla r4">
    <div class="campo" style="grid-column:span 2"><label>Título</label><input value="${esc(p.titulo)}" ${cp('titulo')}></div>
    <div class="campo"><label>Área</label><select ${cp('areaId')}>${opcionesAreas(p.areaId, 'Selecciona…')}</select></div>
    <div class="campo"><label>Tiempo (minutos)</label><input type="number" min="0" value="${esc(p.tiempo || '')}" ${cp('tiempo')}></div>
    <div class="campo"><label>Grupo</label><select onchange="cambiarPrueba('${p.id}','grupoId',this.value);render()">${opcionesGrupos(p.grupoId, '(para todo el grado)')}</select></div>
    <div class="campo"><label>Grado</label><select ${cp('grado')}>${GRADOS.map((g) => `<option value="${g}" ${+gradoPrueba(p) === g ? 'selected' : ''}>${g}°</option>`).join('')}</select></div>
    <div class="campo"><label>Periodo</label><select ${cp('periodoId')}>${opcionesPeriodos(p.periodoId, '(sin periodo)')}</select></div>
    <div class="campo"><label>Tipo</label><select onchange="cambiarPrueba('${p.id}','tipo',this.value);render()"><option value="prueba">Prueba tipo Saber</option><option value="taller" ${p.tipo === 'taller' ? 'selected' : ''}>Taller</option></select></div>
    <div class="campo" style="grid-column:span 4"><label>Instrucciones para el estudiante</label><textarea rows="2" ${cp('instrucciones')}>${esc(p.instrucciones)}</textarea></div>
  </div></div>
  <div class="fila" style="margin-bottom:12px"><button class="btn ia" onclick="dialogoIAPrueba('${p.id}')">✨ Generar preguntas con IA</button>
    <button class="btn" onclick="agregarPregunta('${p.id}','multiple')">＋ Selección múltiple</button><button class="btn" onclick="agregarPregunta('${p.id}','abierta')">＋ Pregunta abierta</button>
    ${p.preguntas.length > 1 ? `<button class="btn" onclick="mezclarOpciones('${p.id}')" title="Cambia de lugar las opciones para que las respuestas correctas queden repartidas">🔀 Repartir respuestas correctas</button>` : ''}</div>
  ${p.preguntas.length ? p.preguntas.map((q, i) => tarjetaPregunta(p, q, i)).join('') : '<div class="tarjeta vacio">Agrega preguntas o genéralas con IA.</div>'}`;
}
function tarjetaPregunta(p, q, i) {
  const cq = (campo) => `onchange="cambiarPregunta('${p.id}','${q.id}','${campo}',this.value)"`;
  const ant = p.preguntas[i - 1];
  return `<div class="tarjeta pregunta">
    <div class="cabecera" style="margin-bottom:6px"><b>Pregunta ${i + 1} · ${q.tipo === 'abierta' ? 'Abierta' : 'Selección múltiple'}</b>
      <span><button class="icono" title="Subir" onclick="moverPregunta('${p.id}',${i},-1)">▲</button><button class="icono" title="Bajar" onclick="moverPregunta('${p.id}',${i},1)">▼</button>
      <button class="icono" title="Duplicar" onclick="duplicarPregunta('${p.id}',${i})">📑</button><button class="icono" title="Eliminar" onclick="eliminarPregunta('${p.id}',${i})">🗑️</button></span></div>
    <div class="campo"><label>Contexto (lectura, situación, tabla…) ${ant && ant.contexto && ant.contexto === q.contexto ? '<span class="chip">igual al de la pregunta anterior</span>' : ''}</label><textarea rows="2" ${cq('contexto')} placeholder="Opcional. Si varias preguntas comparten el mismo texto, en el Word aparece una sola vez.">${esc(q.contexto)}</textarea></div>
    <div class="campo"><label>Enunciado</label><textarea rows="2" ${cq('enunciado')}>${esc(q.enunciado)}</textarea></div>
    ${q.tipo === 'abierta' ? `<div class="rejilla r4"><div class="campo" style="grid-column:span 3"><label>Respuesta esperada / criterios</label><textarea rows="2" ${cq('respuesta')}>${esc(q.respuesta)}</textarea></div>
      <div class="campo"><label>Puntos</label><input type="number" min="0" step="0.5" value="${esc(q.puntos ?? 1)}" ${cq('puntos')}></div></div>`
    : `<div class="opciones-pregunta">${q.opciones.map((o, j) => `<div class="fila" style="flex-wrap:nowrap;margin-bottom:4px">
        <label title="Respuesta correcta" style="margin:0;display:flex;align-items:center;gap:4px;font-weight:700;color:${q.correcta === LETRAS_OP[j] ? 'var(--verde, #2e7d32)' : 'inherit'}"><input type="radio" name="c-${q.id}" ${q.correcta === LETRAS_OP[j] ? 'checked' : ''} onchange="cambiarPregunta('${p.id}','${q.id}','correcta','${LETRAS_OP[j]}');render()"> ${LETRAS_OP[j]}</label>
        <input value="${esc(o)}" onchange="cambiarOpcion('${p.id}','${q.id}',${j},this.value)"></div>`).join('')}
      ${q.opciones.length < 6 ? `<button class="btn pequeno" onclick="agregarOpcion('${p.id}','${q.id}')">＋ Opción</button>` : ''}${q.opciones.length > 2 ? ` <button class="btn pequeno" onclick="quitarOpcion('${p.id}','${q.id}')">− Opción</button>` : ''}</div>
      <div class="rejilla r2" style="margin-top:6px"><div class="campo"><label>Competencia / evidencia que evalúa</label><input value="${esc(q.competencia)}" ${cq('competencia')}></div>
      <div class="campo"><label>Justificación de la respuesta (solo en la clave)</label><input value="${esc(q.explicacion)}" ${cq('explicacion')}></div></div>`}
  </div>`;
}
function cambiarPrueba(id, k, v) { const p = porId(S.pruebas, id); p[k] = k === 'grado' ? +v : v; tocarPrueba(p); }
function preguntaDe(pid, qid) { return porId(S.pruebas, pid).preguntas.find((q) => q.id === qid); }
function cambiarPregunta(pid, qid, k, v) { const q = preguntaDe(pid, qid); q[k] = k === 'puntos' ? +v : v; tocarPrueba(porId(S.pruebas, pid)); }
function cambiarOpcion(pid, qid, j, v) { preguntaDe(pid, qid).opciones[j] = v; tocarPrueba(porId(S.pruebas, pid)); }
function agregarOpcion(pid, qid) { preguntaDe(pid, qid).opciones.push(''); tocarPrueba(porId(S.pruebas, pid)); render(); }
function quitarOpcion(pid, qid) { const q = preguntaDe(pid, qid); q.opciones.pop(); if (LETRAS_OP.indexOf(q.correcta) >= q.opciones.length) q.correcta = 'A'; tocarPrueba(porId(S.pruebas, pid)); render(); }
function agregarPregunta(pid, tipo) {
  const p = porId(S.pruebas, pid); const ant = p.preguntas[p.preguntas.length - 1];
  p.preguntas.push(nuevaPregunta(tipo, { contexto: '' , competencia: ant?.competencia || '' }));
  tocarPrueba(p); render();
  setTimeout(() => document.querySelector('.pregunta:last-of-type textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}
function moverPregunta(pid, i, d) { const p = porId(S.pruebas, pid); const j = i + d; if (j < 0 || j >= p.preguntas.length) return; [p.preguntas[i], p.preguntas[j]] = [p.preguntas[j], p.preguntas[i]]; tocarPrueba(p); render(); }
function duplicarPregunta(pid, i) { const p = porId(S.pruebas, pid); p.preguntas.splice(i + 1, 0, { ...structuredClone(p.preguntas[i]), id: uid() }); tocarPrueba(p); render(); }
async function eliminarPregunta(pid, i) { if (!(await confirmar('¿Eliminar esta pregunta?'))) return; const p = porId(S.pruebas, pid); p.preguntas.splice(i, 1); tocarPrueba(p); render(); }
// Reparte las respuestas correctas entre A, B, C y D de forma equilibrada (cambia el orden de las opciones)
async function mezclarOpciones(pid) {
  const p = porId(S.pruebas, pid);
  const cerradas = preguntasCerradas(p);
  if (Object.keys(p.respuestas || {}).length && !(await confirmar('Ya hay respuestas registradas. Si cambias el orden de las opciones, la calificación dejará de coincidir. ¿Continuar?', { boton: 'Continuar' }))) return;
  cerradas.forEach((q, k) => {
    const n = q.opciones.length;
    const correctaTxt = q.opciones[LETRAS_OP.indexOf(q.correcta)];
    const otras = q.opciones.filter((_, j) => LETRAS_OP[j] !== q.correcta).sort(() => Math.random() - 0.5);
    const pos = (k + Math.floor(Math.random() * n)) % n;
    otras.splice(pos, 0, correctaTxt);
    q.opciones = otras; q.correcta = LETRAS_OP[pos];
  });
  tocarPrueba(p); render();
  aviso('Las respuestas correctas quedaron repartidas', 'ok');
}

// ---------- IA ----------
function dialogoIAPrueba(id) {
  if (sinIA()) return;
  const p = porId(S.pruebas, id);
  const grado = gradoPrueba(p);
  const items = p.periodoId && grado ? itemsMalla(p.areaId, grado, p.periodoId) : [];
  const referentes = items.map((it) => [it.eje, it.contenidos, it.dba, it.desempenoSaber, it.desempenoHacer].filter(Boolean).join(' | ')).join('\n');
  abrirModal(`<h2>✨ Generar preguntas con IA</h2>
    <p class="ayuda">${esc(nombreArea(p.areaId))} · grado ${grado}° · ${esc(nombrePeriodo(p.periodoId) || 'sin periodo')}. Se envían el área, el grado, el tema y los referentes; nunca datos de estudiantes.</p>
    <div class="campo"><label>Tema o contenidos a evaluar</label><textarea id="pia-tema" rows="2" placeholder="Ej.: fracciones equivalentes, simplificación y comparación de fracciones">${esc(p.tema || '')}</textarea></div>
    <div class="campo"><label>Desempeños, DBA o competencias de referencia ${items.length ? '<span class="ayuda">(tomados de tu malla del periodo)</span>' : ''}</label><textarea id="pia-ref" rows="4">${esc(p.referentesIA || referentes)}</textarea></div>
    <div class="rejilla r3">
      <div class="campo"><label>Selección múltiple</label><input type="number" id="pia-mult" min="0" max="40" value="${p.tipo === 'taller' ? 4 : 10}"></div>
      <div class="campo"><label>Preguntas abiertas</label><input type="number" id="pia-abiertas" min="0" max="15" value="${p.tipo === 'taller' ? 4 : 0}"></div>
      <div class="campo"><label>Nivel de dificultad</label><select id="pia-nivel"><option value="mixto">Mixto (fácil, medio y difícil)</option><option value="basico">Básico</option><option value="avanzado">Avanzado</option></select></div>
    </div>
    <div class="campo"><label><input type="checkbox" id="pia-contexto" checked> Usar contextos (lecturas cortas, situaciones o tablas) como en las pruebas Saber</label></div>
    <div id="pia-error"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn ia" id="pia-btn" onclick="generarPreguntasIA('${p.id}')">✨ Generar</button></div>`, { ancho: true });
}
async function generarPreguntasIA(id) {
  const p = porId(S.pruebas, id);
  const v = (k) => document.getElementById('pia-' + k);
  const nm = +v('mult').value || 0, na = +v('abiertas').value || 0;
  if (!nm && !na) return aviso('Indica cuántas preguntas quieres', 'error');
  p.tema = v('tema').value.trim(); p.referentesIA = v('ref').value.trim();
  const grado = gradoPrueba(p);
  const contexto = [`Área: ${nombreArea(p.areaId)}`, `Grado: ${grado}° (${nivelDeGrado(grado)})`, p.tema ? `Tema: ${p.tema}` : '', p.referentesIA ? `Referentes:\n${p.referentesIA}` : '',
    `Cantidad: ${nm} pregunta(s) de selección múltiple con única respuesta y ${na} pregunta(s) abierta(s).`, `Dificultad: ${v('nivel').value}.`,
    v('contexto').checked ? 'Usa contextos (lecturas cortas, situaciones cotidianas colombianas, tablas o gráficas descritas en texto); varias preguntas pueden compartir un contexto.' : 'Preguntas directas, sin contextos largos.',
    p.preguntas.length ? `Ya existen ${p.preguntas.length} preguntas; no las repitas:\n${p.preguntas.map((q) => '- ' + q.enunciado.slice(0, 120)).join('\n')}` : ''].filter(Boolean).join('\n');
  const btn = document.getElementById('pia-btn');
  btn.disabled = true; btn.innerHTML = '<span class="cargando"></span> Generando… (puede tardar un minuto)';
  const r = await api.sugerirIA({ ia: S.config.ia, contexto, tarea: 'saber' });
  if (!document.getElementById('pia-btn')) return;
  btn.disabled = false; btn.textContent = '✨ Generar';
  if (!r.ok) { document.getElementById('pia-error').innerHTML = `<div class="alerta error">${esc(r.error)}</div>`; return; }
  const nuevas = (r.datos.preguntas || []).map((q) => {
    const abierta = q.tipo === 'abierta' || !Array.isArray(q.opciones) || q.opciones.length < 2;
    const correcta = String(q.correcta || 'A').trim().toUpperCase().slice(0, 1);
    return nuevaPregunta(abierta ? 'abierta' : 'multiple', {
      contexto: String(q.contexto || '').trim(), enunciado: String(q.enunciado || '').trim(),
      opciones: abierta ? [] : q.opciones.slice(0, 6).map((o) => String(o).replace(/^[A-F][.)]\s*/, '').trim()),
      correcta: abierta ? '' : (LETRAS_OP.includes(correcta) ? correcta : 'A'), competencia: String(q.competencia || ''), explicacion: String(q.explicacion || ''), respuesta: String(q.respuesta || ''), puntos: 1,
    });
  }).filter((q) => q.enunciado);
  if (!nuevas.length) { document.getElementById('pia-error').innerHTML = '<div class="alerta error">La IA no devolvió preguntas válidas. Inténtalo de nuevo.</div>'; return; }
  p.preguntas.push(...nuevas);
  if (!p.instrucciones && r.datos.instrucciones) p.instrucciones = r.datos.instrucciones;
  tocarPrueba(p); cerrarModal(); render();
  aviso(`Se agregaron ${nuevas.length} pregunta(s). Revísalas: la IA puede equivocarse.`, 'ok');
}

// ---------- Calificar ----------
function respuestasDe(p, alumnoId) { return String((p.respuestas || {})[alumnoId] || '').toUpperCase().replace(/[^A-F\-_.*]/g, ''); }
function resultadoAlumno(p, alumnoId) {
  const cerradas = preguntasCerradas(p);
  const resp = respuestasDe(p, alumnoId);
  const abiertas = p.preguntas.filter((q) => q.tipo === 'abierta');
  const pa = (p.abiertas || {})[alumnoId] || {};
  const tieneAlgo = resp.length || abiertas.some((q) => pa[q.id] != null && pa[q.id] !== '');
  if (!tieneAlgo) return null;
  const aciertos = cerradas.map((q, k) => resp[k] === q.correcta);
  const ptsCerr = cerradas.reduce((s, q, k) => s + (aciertos[k] ? (+q.puntos || 1) : 0), 0);
  const ptsAb = abiertas.reduce((s, q) => s + Math.min(+q.puntos || 1, +(pa[q.id] || 0)), 0);
  const max = cerradas.reduce((s, q) => s + (+q.puntos || 1), 0) + abiertas.reduce((s, q) => s + (+q.puntos || 1), 0);
  const total = ptsCerr + ptsAb;
  return { aciertos, correctas: aciertos.filter(Boolean).length, total, max, nota: max ? convertirPuntaje(total, max) : null };
}
function vistaCalificarPrueba(p) {
  const cerradas = preguntasCerradas(p);
  const abiertas = p.preguntas.filter((q) => q.tipo === 'abierta');
  if (!p.preguntas.length) return '<div class="tarjeta vacio">Primero agrega las preguntas.</div>';
  if (!p.grupoId) return `<div class="tarjeta"><p>¿Qué grupo presentó la prueba?</p><select onchange="cambiarPrueba('${p.id}','grupoId',this.value);render()" style="max-width:300px">${opcionesGrupos('', 'Selecciona el grupo…')}</select></div>`;
  const alumnos = alumnosDe(p.grupoId);
  return `<div class="tarjeta"><p class="ayuda" style="margin:0">${cerradas.length ? `Digita las respuestas de cada estudiante en orden, una letra por pregunta (ej.: <b>ABDCA…</b>). Usa <b>-</b> si dejó la pregunta en blanco. Clave: <code>${cerradas.map((q) => q.correcta).join('')}</code>.` : ''}
    ${abiertas.length ? ` En las abiertas escribe los puntos obtenidos.` : ''} La nota se calcula sobre ${S.config.escalaMax} en forma proporcional.</p></div>
  <div class="tarjeta" style="padding:0"><div class="envoltura-tabla" style="border:0"><table class="tabla"><thead><tr><th>#</th><th>Estudiante</th>
    ${cerradas.length ? `<th>Respuestas (${cerradas.length})</th>` : ''}${abiertas.map((q) => `<th class="num" title="${esc(q.enunciado)}">P${p.preguntas.indexOf(q) + 1} (${q.puntos || 1})</th>`).join('')}
    <th class="num">Puntos</th><th class="num">Nota</th></tr></thead><tbody>
    ${alumnos.map((a, i) => { const r = resultadoAlumno(p, a.id); const pa = (p.abiertas || {})[a.id] || {}; return `<tr data-al="${a.id}"><td class="num">${i + 1}</td><td>${esc(nombreAlumno(a))}</td>
      ${cerradas.length ? `<td><input class="resp-prueba" value="${esc(respuestasDe(p, a.id))}" maxlength="${cerradas.length + 10}" style="font-family:monospace;letter-spacing:2px;text-transform:uppercase;min-width:${Math.min(40, cerradas.length) * 14 + 30}px"
        oninput="ponerRespuestas('${p.id}','${a.id}',this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.closest('tr').nextElementSibling?.querySelector('input')?.focus()}">
        <div class="aciertos" data-ac="${a.id}">${r ? marcasAciertos(r) : ''}</div></td>` : ''}
      ${abiertas.map((q) => `<td class="num"><input type="number" min="0" max="${q.puntos || 1}" step="0.5" style="width:64px" value="${esc(pa[q.id] ?? '')}" onchange="ponerPuntosAbierta('${p.id}','${a.id}','${q.id}',this.value)"></td>`).join('')}
      <td class="num" data-pts="${a.id}">${r ? `${r.total}/${r.max}` : '—'}</td><td class="num ${claseNota(r?.nota)}" data-nota="${a.id}"><b>${fmtNota(r?.nota)}</b></td></tr>`; }).join('')}
  </tbody></table></div></div>
  ${tarjetaEnviarPlanilla(p)}`;
}
function marcasAciertos(r) { return r.aciertos.map((ok, k) => `<span class="${ok ? 'ok' : 'mal'}" title="Pregunta ${k + 1}">${k + 1}</span>`).join(''); }
function ponerRespuestas(pid, aid, input) {
  const p = porId(S.pruebas, pid);
  (p.respuestas ||= {})[aid] = input.value.toUpperCase().replace(/[^A-F\-_.*]/g, '');
  if (input.value !== p.respuestas[aid]) { const pos = input.selectionStart; input.value = p.respuestas[aid]; input.setSelectionRange(pos, pos); }
  if (!p.respuestas[aid]) delete p.respuestas[aid];
  tocarPrueba(p); actualizarFilaPrueba(p, aid);
}
function ponerPuntosAbierta(pid, aid, qid, v) {
  const p = porId(S.pruebas, pid);
  const pa = ((p.abiertas ||= {})[aid] ||= {});
  if (v === '') delete pa[qid]; else pa[qid] = +v;
  tocarPrueba(p); actualizarFilaPrueba(p, aid);
}
function actualizarFilaPrueba(p, aid) {
  const r = resultadoAlumno(p, aid);
  const ac = document.querySelector(`[data-ac="${aid}"]`); if (ac) ac.innerHTML = r ? marcasAciertos(r) : '';
  const pt = document.querySelector(`[data-pts="${aid}"]`); if (pt) pt.textContent = r ? `${r.total}/${r.max}` : '—';
  const no = document.querySelector(`[data-nota="${aid}"]`); if (no) { no.innerHTML = `<b>${fmtNota(r?.nota)}</b>`; no.className = `num ${claseNota(r?.nota)}`; }
}
function tarjetaEnviarPlanilla(p) {
  const per = p.periodoId || periodoDeFecha(hoyISO())?.id;
  if (!per || !p.areaId) return '';
  const pl = buscarPlanilla(p.grupoId, p.areaId, per);
  const acts = pl ? pl.criterios.flatMap((cr) => cr.actividades.map((a) => ({ ...a, comp: cr.nombre }))) : [];
  const sug = p.actividadId || (acts.find((a) => /prueba|evaluaci|examen|taller/i.test(a.nombre) && !alumnosDe(p.grupoId).some((al) => nota(a.id, al.id) != null)) || {}).id || '';
  return `<div class="tarjeta"><h3 style="margin-top:0">📤 Enviar las notas a la planilla</h3>
    ${acts.length ? `<div class="fila"><select id="pr-act" style="max-width:420px">${acts.map((a) => `<option value="${a.id}" ${a.id === sug ? 'selected' : ''}>${esc(a.comp)} › ${esc(a.nombre)}</option>`).join('')}</select>
      <button class="btn primario" onclick="enviarNotasPrueba('${p.id}','${per}')">Enviar notas</button></div>
      <p class="ayuda">${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))} · ${esc(nombrePeriodo(per))}. Solo se envían los estudiantes calificados; reemplaza la nota que tuvieran en esa actividad.</p>`
      : `<p class="ayuda">Aún no hay programación evaluativa para ${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))} · ${esc(nombrePeriodo(per))}. <a href="#" onclick="ui.cal={grupoId:'${p.grupoId}',areaId:'${p.areaId}',periodoId:'${per}',pestana:'programacion'};ir('calificaciones');return false">Crearla</a></p>`}</div>`;
}
function enviarNotasPrueba(pid, perId) {
  const p = porId(S.pruebas, pid);
  const act = document.getElementById('pr-act').value;
  let n = 0;
  for (const a of alumnosDe(p.grupoId)) { const r = resultadoAlumno(p, a.id); if (r?.nota != null) { (S.notas[act] ||= {})[a.id] = r.nota; n++; } }
  p.actividadId = act; tocarPrueba(p); render();
  aviso(`Se enviaron ${n} nota(s) a la planilla de ${nombrePeriodo(perId)}.`, 'ok');
}

// ---------- Resultados ----------
function analisisPrueba(p) {
  const alumnos = p.grupoId ? alumnosDe(p.grupoId) : [];
  const res = alumnos.map((a) => ({ a, r: resultadoAlumno(p, a.id) })).filter((x) => x.r);
  const cerradas = preguntasCerradas(p);
  const porPregunta = {};
  cerradas.forEach((q, k) => { porPregunta[q.id] = res.length ? Math.round((res.filter((x) => x.r.aciertos[k]).length / res.length) * 100) : null; });
  // opción más elegida entre los que fallaron (distractor más fuerte)
  const distractor = {};
  cerradas.forEach((q, k) => {
    const cuenta = {};
    res.forEach((x) => { const l = respuestasDe(p, x.a.id)[k]; if (l && l !== q.correcta && LETRAS_OP.includes(l)) cuenta[l] = (cuenta[l] || 0) + 1; });
    const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];
    if (top) distractor[q.id] = top;
  });
  return { res, porPregunta, distractor };
}
function vistaResultadosPrueba(p) {
  const { res, porPregunta, distractor } = analisisPrueba(p);
  if (!res.length) return '<div class="tarjeta vacio">Aún no hay estudiantes calificados. Usa la pestaña "Calificar".</div>';
  const cerradas = preguntasCerradas(p);
  const prom = res.reduce((s, x) => s + x.r.nota, 0) / res.length;
  const dist = {}; res.forEach((x) => { const d = desempeno(x.r.nota); dist[d] = (dist[d] || 0) + 1; });
  const dificiles = cerradas.filter((q) => porPregunta[q.id] != null && porPregunta[q.id] < 50);
  return `<div class="estadisticas">
    ${tarjetaDato(fmtNota(prom), 'Promedio del grupo', chipDesempeno(prom))}
    ${tarjetaDato(res.length, 'Estudiantes calificados')}
    ${S.config.desempenos.map((d) => tarjetaDato(dist[d.nombre] || 0, d.nombre)).join('')}
  </div>
  ${cerradas.length ? `<div class="tarjeta"><h3 style="margin-top:0">Porcentaje de acierto por pregunta</h3>
    ${graficaBarras(cerradas.map((q) => ({ nombre: `P${p.preguntas.indexOf(q) + 1}${q.competencia ? ' · ' + q.competencia.slice(0, 40) : ''}`, v: porPregunta[q.id], detalle: `${porPregunta[q.id]}% de acierto${distractor[q.id] ? ` · opción errada más elegida: ${distractor[q.id][0]} (${distractor[q.id][1]})` : ''}` })), { ref: 50, min: 0, max: 100, fmt: (v) => Math.round(v) + '%', etiquetaRef: 'Meta' })}
    <p class="ayuda">Pasa el cursor sobre cada barra para ver la opción errada más elegida.</p></div>` : ''}
  ${dificiles.length ? `<div class="tarjeta"><h3 style="margin-top:0">🎯 Preguntas para retroalimentar (menos del 50% de acierto)</h3><ul class="lista-simple">${dificiles.map((q) => `<li><div><b>P${p.preguntas.indexOf(q) + 1}.</b> ${esc(q.enunciado.slice(0, 160))}<br><span class="ayuda">${porPregunta[q.id]}% de acierto · correcta: ${q.correcta}${distractor[q.id] ? ` · muchos eligieron ${distractor[q.id][0]}: "${esc((q.opciones[LETRAS_OP.indexOf(distractor[q.id][0])] || '').slice(0, 80))}"` : ''}</span></div></li>`).join('')}</ul></div>` : ''}
  <div class="tarjeta"><h3 style="margin-top:0">Resultados por estudiante</h3><table class="tabla"><thead><tr><th>Estudiante</th>${cerradas.length ? '<th class="num">Correctas</th>' : ''}<th class="num">Puntos</th><th class="num">Nota</th><th>Desempeño</th></tr></thead><tbody>
    ${res.sort((a, b) => b.r.nota - a.r.nota).map((x) => `<tr><td>${esc(nombreAlumno(x.a))}</td>${cerradas.length ? `<td class="num">${x.r.correctas}/${cerradas.length}</td>` : ''}<td class="num">${x.r.total}/${x.r.max}</td><td class="num ${claseNota(x.r.nota)}"><b>${fmtNota(x.r.nota)}</b></td><td>${chipDesempeno(x.r.nota)}</td></tr>`).join('')}
  </tbody></table></div>`;
}

// ---------- Word ----------
function exportarPrueba(id, version) {
  const p = porId(S.pruebas, id);
  if (!p.preguntas.length) return aviso('La prueba no tiene preguntas', 'error');
  const an = version === 'docente' && p.grupoId ? analisisPrueba(p) : null;
  const datos = { ...p, areaNombre: nombreArea(p.areaId), gradoTexto: gradoPrueba(p) ? gradoPrueba(p) + '°' : '', grupoNombre: p.grupoId ? nombreGrupoId(p.grupoId) : '', periodoNombre: nombrePeriodo(p.periodoId) };
  api.exportarWordCurricular('prueba', `${p.titulo || 'Prueba'}${version === 'docente' ? ' - clave' : ''}`, { config: S.config, prueba: datos, version, analisis: an && an.res.length ? an.porPregunta : null })
    .then((r) => { if (r.ok) aviso('Documento de Word creado', 'ok'); else if (r.error) aviso(r.error, 'error'); });
}
