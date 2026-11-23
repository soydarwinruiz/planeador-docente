// ================= Programación evaluativa e instrumentos de evaluación =================

const COMPONENTES_POR_DEFECTO = [
  { nombre: 'Evaluaciones', peso: 25, actividades: [{ nombre: 'Evaluación 1' }, { nombre: 'Evaluación 2' }, { nombre: 'Evaluación 3' }, { nombre: 'Evaluación 4' }] },
  { nombre: 'Consultas o investigaciones', peso: 15, actividades: [{ nombre: 'Consulta 1' }, { nombre: 'Consulta 2' }] },
  { nombre: 'Actividades de aplicación', peso: 25, actividades: [{ nombre: 'Actividad de aplicación 1' }, { nombre: 'Actividad de aplicación 2' }] },
  { nombre: 'Actitudinal', peso: 15, actividades: [{ nombre: 'Autoevaluación', rubricaId: 'ins-autoevaluacion' }, { nombre: 'Coevaluación', rubricaId: 'ins-coevaluacion' }, { nombre: 'Heteroevaluación', rubricaId: 'ins-heteroevaluacion' }] },
  { nombre: 'Prueba final de periodo', peso: 20, actividades: [{ nombre: 'Prueba final' }] },
];

const TIPOS_INSTRUMENTO = {
  rubrica: { nombre: 'Rúbrica', ayuda: 'Criterios × niveles de desempeño con descriptores. Para ensayos, exposiciones, proyectos, debates.' },
  escala: { nombre: 'Escala de valoración', ayuda: 'Grado o frecuencia (Siempre, Casi siempre…). Para participación, trabajo colaborativo, autoevaluación.' },
  cotejo: { nombre: 'Lista de cotejo', ayuda: 'Sí / No: verifica que se cumplan pasos o elementos. Para técnicas de búsqueda, comprensión, representación y procedimientos.' },
};
function tipoInstrumento(r) { return r?.tipo || 'rubrica'; }

// ---------- Instrumentos predeterminados ----------
function valorNivel(nombre) {
  const d = S.config.desempenos.find((x) => x.nombre === nombre);
  if (!d) return 0;
  return nombre === S.config.desempenos[S.config.desempenos.length - 1].nombre ? +d.hasta : redondear((+d.desde + +d.hasta) / 2);
}
function nivelesDesempeno() { return [...S.config.desempenos].reverse().map((d) => ({ nombre: d.nombre, valor: valorNivel(d.nombre) })); }
function nivelesFrecuencia() {
  const n = nivelesDesempeno();
  return ['Siempre', 'Casi siempre', 'A veces', 'Nunca'].map((t, i) => ({ nombre: t, valor: n[Math.min(i, n.length - 1)].valor }));
}
const INSTRUMENTOS_INICIALES = {
  version: 1,
  items: [
    { id: 'ins-exposicion', tipo: 'rubrica', nombre: 'Rúbrica – Exposición oral', tecnicas: 'Exposición, panel, foro, conversatorio, sustentación',
      criterios: [
        ['Dominio del tema', 'Explica con precisión y profundidad; responde preguntas con seguridad.', 'Explica con claridad; responde la mayoría de preguntas.', 'Explica de forma general; lee buena parte del material.', 'Muestra poco dominio; lee todo o no logra explicar.'],
        ['Organización y secuencia', 'Presenta introducción, desarrollo y cierre muy bien articulados.', 'Sigue un orden lógico con pequeñas fallas.', 'El orden es irregular y cuesta seguir las ideas.', 'Las ideas aparecen sin orden.'],
        ['Expresión oral', 'Voz clara, vocabulario técnico y buen contacto visual.', 'Voz clara y vocabulario adecuado.', 'A veces no se escucha o usa muletillas frecuentes.', 'Difícil de escuchar o comprender.'],
        ['Apoyos visuales', 'Material creativo, legible y que enriquece la explicación.', 'Material legible y pertinente.', 'Material con exceso de texto o poco legible.', 'Sin material o no corresponde al tema.'],
        ['Manejo del tiempo', 'Se ajusta exactamente al tiempo asignado.', 'Se desvía poco del tiempo.', 'Se queda corto o se excede notablemente.', 'No logra completar la presentación.'],
      ] },
    { id: 'ins-escrito', tipo: 'rubrica', nombre: 'Rúbrica – Producción escrita (ensayo / informe)', tecnicas: 'Ensayo argumentativo, informe, reseña, artículo',
      criterios: [
        ['Idea central o tesis', 'Tesis clara, original y sostenida en todo el texto.', 'Tesis clara y mantenida.', 'Tesis poco clara o se pierde.', 'No presenta idea central.'],
        ['Argumentación y fuentes', 'Argumentos sólidos con fuentes confiables bien citadas.', 'Argumentos adecuados con fuentes citadas.', 'Argumentos débiles o fuentes sin citar.', 'Sin argumentos ni fuentes.'],
        ['Estructura y coherencia', 'Párrafos bien conectados con introducción, desarrollo y conclusión.', 'Estructura completa con algunas fallas de conexión.', 'Estructura incompleta.', 'Texto desordenado.'],
        ['Ortografía y redacción', 'Sin errores; redacción fluida.', 'Pocos errores que no afectan la comprensión.', 'Errores frecuentes.', 'Errores que impiden comprender.'],
      ] },
    { id: 'ins-proyecto', tipo: 'rubrica', nombre: 'Rúbrica – Proyecto o producto', tecnicas: 'Método de proyectos, prototipo, maqueta, investigación STEAM',
      criterios: [
        ['Planeación', 'Plan completo con objetivos, pasos, recursos y tiempos.', 'Plan con la mayoría de elementos.', 'Plan incompleto.', 'Sin planeación.'],
        ['Proceso', 'Registra avances, corrige errores y trabaja de forma autónoma.', 'Registra avances con poca orientación.', 'Avanza solo con orientación constante.', 'No evidencia proceso.'],
        ['Producto final', 'Cumple todos los requisitos y aporta soluciones creativas.', 'Cumple los requisitos.', 'Cumple parcialmente.', 'No cumple o no lo entrega.'],
        ['Sustentación', 'Explica el proceso y defiende sus decisiones con argumentos.', 'Explica el proceso con claridad.', 'Explicación incompleta.', 'No logra explicar su trabajo.'],
      ] },
    { id: 'ins-organizador', tipo: 'cotejo', nombre: 'Lista de cotejo – Organizador gráfico', tecnicas: 'Mapa conceptual, mapa mental, cuadro sinóptico, cuadro comparativo, línea de tiempo',
      indicadores: ['Incluye el concepto o tema central', 'Jerarquiza las ideas de lo general a lo particular', 'Usa palabras enlace o conectores adecuados', 'Las relaciones entre conceptos son correctas', 'Es legible, ordenado y creativo', 'Lo entrega en el tiempo acordado'] },
    { id: 'ins-procedimiento', tipo: 'cotejo', nombre: 'Lista de cotejo – Práctica procedimental', tecnicas: 'Prácticas de laboratorio, sala de cómputo, taller, demostración',
      indicadores: ['Sigue las instrucciones dadas', 'Usa herramientas y equipos de forma segura', 'Realiza los pasos en el orden correcto', 'Registra datos o resultados', 'Obtiene el resultado esperado', 'Deja el espacio de trabajo ordenado'] },
    { id: 'ins-consulta', tipo: 'cotejo', nombre: 'Lista de cotejo – Consulta o investigación', tecnicas: 'Búsqueda bibliográfica, búsqueda en internet, fichaje, entrevista, encuesta',
      indicadores: ['Responde a la pregunta o tema planteado', 'Usa al menos dos fuentes confiables', 'Cita las fuentes consultadas', 'Explica con sus propias palabras', 'Presenta conclusiones', 'Cumple el formato y la fecha de entrega'] },
    { id: 'ins-colaborativo', tipo: 'escala', nombre: 'Escala de valoración – Trabajo colaborativo', tecnicas: 'Trabajo en equipo, ABP, estudio de casos, debates',
      indicadores: ['Aporta ideas al equipo', 'Escucha y respeta las opiniones de los demás', 'Cumple el rol asignado', 'Ayuda a sus compañeros', 'Termina las tareas a tiempo'] },
    { id: 'ins-autoevaluacion', tipo: 'escala', nombre: 'Escala – Autoevaluación', tecnicas: 'Autoevaluación del componente actitudinal',
      indicadores: ['Asisto puntualmente a clase', 'Traigo los materiales necesarios', 'Participo activamente', 'Cumplo con mis tareas y compromisos', 'Respeto a mis compañeros y al docente', 'Me esfuerzo por mejorar'] },
    { id: 'ins-coevaluacion', tipo: 'escala', nombre: 'Escala – Coevaluación', tecnicas: 'Coevaluación entre pares',
      indicadores: ['Mi compañero(a) participa en las actividades', 'Respeta las opiniones del grupo', 'Cumple con lo que le corresponde', 'Aporta al logro del equipo'] },
    { id: 'ins-heteroevaluacion', tipo: 'escala', nombre: 'Escala – Heteroevaluación (docente)', tecnicas: 'Valoración del docente sobre el componente actitudinal',
      indicadores: ['Puntualidad y asistencia', 'Responsabilidad con tareas y materiales', 'Participación e interés', 'Respeto y convivencia', 'Trabajo autónomo'] },
  ],
};
function sembrarInstrumentos() {
  if ((S.instrumentosSemilla || 0) >= INSTRUMENTOS_INICIALES.version) return;
  const existentes = new Set(S.rubricas.map((r) => r.id));
  const eliminados = new Set(S.instrumentosEliminados || []);
  for (const t of INSTRUMENTOS_INICIALES.items) {
    if (existentes.has(t.id) || eliminados.has(t.id)) continue;
    const r = { id: t.id, tipo: t.tipo, nombre: t.nombre, tecnicas: t.tecnicas, descripcion: '', predeterminado: true, criterios: [], niveles: [], descriptores: {} };
    if (t.tipo === 'rubrica') {
      r.niveles = nivelesDesempeno();
      t.criterios.forEach(([nombre, ...desc]) => { const id = uid(); r.criterios.push({ id, nombre }); r.descriptores[id] = desc; });
    } else {
      if (t.tipo === 'escala') r.niveles = nivelesFrecuencia();
      t.indicadores.forEach((nombre) => r.criterios.push({ id: uid(), nombre }));
    }
    S.rubricas.push(r);
  }
  S.instrumentosSemilla = INSTRUMENTOS_INICIALES.version;
}

// ---------- Cálculo de notas con instrumentos ----------
function notaDesdeRubrica(r, sel) {
  if (!r.criterios.length) return null;
  if (tipoInstrumento(r) === 'cotejo') {
    const resp = r.criterios.map((c) => sel?.[c.id]);
    if (resp.some((v) => v !== 0 && v !== 1)) return null;
    const min = +S.config.escalaMin, max = +S.config.escalaMax;
    return min + (max - min) * (resp.filter((v) => v === 1).length / resp.length);
  }
  const vals = r.criterios.map((c) => sel?.[c.id]).filter((i) => i != null && r.niveles[i]).map((i) => +r.niveles[i].valor);
  return vals.length === r.criterios.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}
function recalcularNotasRubrica(rubId) {
  const r = porId(S.rubricas, rubId);
  for (const pl of S.planillas) for (const c of pl.criterios) for (const a of c.actividades) {
    if (a.rubricaId !== rubId || !S.notasRubrica[a.id]) continue;
    for (const [alId, sel] of Object.entries(S.notasRubrica[a.id])) {
      const n = notaDesdeRubrica(r, sel);
      S.notas[a.id] ||= {};
      if (n == null) delete S.notas[a.id][alId]; else S.notas[a.id][alId] = redondear(n);
    }
  }
}
function buscarActividad(actId) {
  for (const pl of S.planillas) for (const c of pl.criterios) for (const a of c.actividades) if (a.id === actId) return a;
  return null;
}

// ---------- Opciones de técnicas e instrumentos ----------
function opcionesTecnicas(sel) {
  const tecnicas = S.bancoPedagogico.filter((x) => x.tipo === 'tecnica' || x.tipo === 'metodologia');
  const grupos = {};
  tecnicas.forEach((t) => { const g = t.tipo === 'metodologia' ? 'Métodos' : (t.clasificacion || 'Otras técnicas'); (grupos[g] ||= []).push(t); });
  return `<option value="">—</option>` + Object.entries(grupos).map(([g, ts]) => `<optgroup label="${esc(g)}">${ts.map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc((t.codigo ? t.codigo + ' ' : '') + t.nombre)}</option>`).join('')}</optgroup>`).join('');
}
function opcionesInstrumentos(sel, vacio = 'Nota directa') {
  return `<option value="">${esc(vacio)}</option>` + Object.entries(TIPOS_INSTRUMENTO).map(([k, v]) => {
    const lista = S.rubricas.filter((r) => tipoInstrumento(r) === k);
    return lista.length ? `<optgroup label="${v.nombre}">${lista.map((r) => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('')}</optgroup>` : '';
  }).join('');
}
// Según el Tratado (cap. 4): el instrumento debe corresponder con la técnica usada.
function instrumentoSugerido(tecnicaId) {
  const t = porId(S.bancoPedagogico, tecnicaId);
  if (!t) return '';
  if (t.tipo === 'metodologia') return 'rubrica';
  const c = t.clasificacion || '';
  if (/Tipo [123]/.test(c)) return 'cotejo';
  if (/4A/.test(c)) return 'escala';
  return 'rubrica';
}

// ---------- Programación evaluativa ----------
function vistaProgramacion(c) {
  if (!c.grupoId || !c.areaId || !c.periodoId) return '<div class="tarjeta vacio">Selecciona grupo, área y periodo.</div>';
  const pl = obtenerPlanilla(c.grupoId, c.areaId, c.periodoId);
  const suma = pl.criterios.reduce((s, x) => s + (+x.peso || 0), 0);
  const per = porId(S.config.periodos, c.periodoId);
  return `
  <div class="fila" style="justify-content:space-between;margin-bottom:12px">
    <span class="ayuda">Organiza los componentes y actividades evaluativas del periodo${per?.inicio ? ` (${esc(fechaCorta(per.inicio))} – ${esc(fechaCorta(per.fin))})` : ''}. Los porcentajes de los componentes deben sumar 100%.</span>
    <div class="fila">
      <button class="btn" onclick="dialogoCopiarProgramacion('${pl.id}')">📑 Copiar a otros grupos</button>
      <button class="btn" onclick="copiarEstructura('${pl.id}')">Traer de otra planilla</button>
      <button class="btn primario" onclick="exportarProgramacion('${pl.id}')">📄 Exportar para padres (Word)</button>
    </div></div>
  <div class="alerta ${suma === 100 ? 'info' : ''}">Total: <b>${suma}%</b>${suma === 100 ? ' ✔' : ' — los componentes deberían sumar 100%.'}</div>
  ${pl.criterios.map((cr, ci) => `<div class="tarjeta">
    <div class="cabecera" style="align-items:center">
      <div class="fila" style="flex:1;flex-wrap:nowrap"><input value="${esc(cr.nombre)}" style="font-weight:600;font-size:15px;max-width:380px" onchange="cambiarComponente('${pl.id}','${cr.id}','nombre',this.value)">
        <input type="number" min="0" max="100" value="${esc(cr.peso)}" style="width:80px" onchange="cambiarComponente('${pl.id}','${cr.id}','peso',+this.value);render()"> %</div>
      <div class="fila">
        ${ci > 0 ? `<button class="icono" title="Subir" onclick="moverComponente('${pl.id}',${ci},-1)">⬆️</button>` : ''}
        <button class="btn pequeno primario" onclick="agregarActividadProgramada('${pl.id}','${cr.id}')">＋ Actividad</button>
        <button class="icono" title="Eliminar componente" onclick="eliminarCriterio('${pl.id}','${cr.id}')">🗑️</button></div></div>
    ${cr.actividades.length ? `<table class="tabla"><thead><tr><th style="width:22%">Actividad</th><th style="width:130px">Fecha</th><th>Descripción</th><th style="width:20%">Técnica / método</th><th style="width:20%">Instrumento</th><th></th></tr></thead><tbody>
      ${cr.actividades.map((a) => {
        const sug = instrumentoSugerido(a.tecnicaId);
        const actual = porId(S.rubricas, a.rubricaId);
        const nNotas = Object.keys(S.notas[a.id] || {}).length;
        return `<tr>
        <td><input value="${esc(a.nombre)}" onchange="cambiarActividad('${a.id}','nombre',this.value)">${nNotas ? `<div class="ayuda">${nNotas} nota(s)</div>` : ''}</td>
        <td><input type="date" value="${esc(a.fecha || '')}" onchange="cambiarActividad('${a.id}','fecha',this.value)"></td>
        <td><input value="${esc(a.descripcion || '')}" placeholder="¿Qué harán los estudiantes?" onchange="cambiarActividad('${a.id}','descripcion',this.value)"></td>
        <td><select onchange="cambiarActividad('${a.id}','tecnicaId',this.value);render()">${opcionesTecnicas(a.tecnicaId)}</select></td>
        <td><select onchange="cambiarInstrumentoActividad('${a.id}',this.value)">${opcionesInstrumentos(a.rubricaId)}</select>
          ${sug && tipoInstrumento(actual) !== sug ? `<div class="ayuda">Sugerido para esta técnica: <b>${TIPOS_INSTRUMENTO[sug].nombre.toLowerCase()}</b></div>` : ''}</td>
        <td>${calificacionesDe(a.id) ? `<span class="icono" title="Tiene ${calificacionesDe(a.id)} estudiante(s) calificado(s): no se puede eliminar" style="cursor:help">🔒</span>` : `<button class="icono" title="Eliminar actividad" onclick="eliminarActividad('${pl.id}','${cr.id}','${a.id}')">🗑️</button>`}</td></tr>`;
      }).join('')}
    </tbody></table>` : '<p class="ayuda">Sin actividades.</p>'}
    <p class="ayuda" style="margin-bottom:0">La nota del componente es el promedio de sus actividades${cr.actividades.length ? ` (cada una vale ${fmtNota((+cr.peso || 0) / cr.actividades.length)}% de la nota del periodo)` : ''}.</p>
  </div>`).join('')}
  <button class="btn" onclick="agregarCriterio('${pl.id}')">＋ Componente</button>`;
}
function cambiarComponente(plId, crId, k, v) { porId(porId(S.planillas, plId).criterios, crId)[k] = v; guardar(); }
function moverComponente(plId, i, d) { const cs = porId(S.planillas, plId).criterios; const [x] = cs.splice(i, 1); cs.splice(i + d, 0, x); guardar(); render(); }
function cambiarActividad(actId, k, v) { buscarActividad(actId)[k] = v; guardar(); }
async function cambiarInstrumentoActividad(actId, rubId) {
  const a = buscarActividad(actId);
  const conNotas = Object.keys(S.notas[actId] || {}).length;
  if (conNotas && a.rubricaId !== rubId && !(await confirmar('Esta actividad ya tiene notas. Al cambiar el instrumento se conservan las notas actuales, pero las nuevas se calcularán con el nuevo instrumento. ¿Continuar?', { boton: 'Cambiar', peligro: false }))) { render(); return; }
  a.rubricaId = rubId;
  delete S.notasRubrica[actId];
  guardar(); render();
}
function agregarActividadProgramada(plId, crId) {
  const cr = porId(porId(S.planillas, plId).criterios, crId);
  cr.actividades.push({ id: uid(), nombre: `${cr.nombre.split(' ')[0]} ${cr.actividades.length + 1}`, fecha: '', descripcion: '', rubricaId: '', tecnicaId: '' });
  guardar(); render();
}

function dialogoCopiarProgramacion(plId) {
  const pl = porId(S.planillas, plId);
  const grupos = S.grupos.filter((g) => g.id !== pl.grupoId).sort(ordenGrupos);
  abrirModal(`<h2>Copiar programación a otros grupos</h2>
    <p class="ayuda">Se copian los componentes, porcentajes y actividades de ${esc(nombreArea(pl.areaId))} – ${esc(nombrePeriodo(pl.periodoId))} (sin notas). Los grupos que ya tengan notas en ese periodo no se modifican.</p>
    ${grupos.length ? grupos.map((g) => `<label style="font-weight:normal;color:inherit;font-size:14px;display:block;margin:4px 0"><input type="checkbox" class="m-g" value="${g.id}" ${areasDeGrupo(g.id).some((a) => a.id === pl.areaId) ? 'checked' : ''}> ${esc(nombreGrupo(g))}</label>`).join('') : '<p>No hay otros grupos.</p>'}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="copiarProgramacion('${plId}')">Copiar</button></div>`);
}
function copiarProgramacion(plId) {
  const pl = porId(S.planillas, plId);
  let ok = 0; const omitidos = [];
  for (const el of document.querySelectorAll('.m-g:checked')) {
    const dest = obtenerPlanilla(el.value, pl.areaId, pl.periodoId);
    const tieneNotas = dest.criterios.some((c) => c.actividades.some((a) => Object.keys(S.notas[a.id] || {}).length));
    if (tieneNotas) { omitidos.push(nombreGrupoId(el.value)); continue; }
    dest.criterios = pl.criterios.map((c) => ({ ...c, id: uid(), actividades: c.actividades.map((a) => ({ ...a, id: uid() })) }));
    ok++;
  }
  guardar(); cerrarModal(); render();
  aviso(`Programación copiada a ${ok} grupo(s)${omitidos.length ? `. Omitidos por tener notas: ${omitidos.join(', ')}` : ''}`, omitidos.length ? '' : 'ok');
}

async function exportarProgramacion(plId) {
  const pl = porId(S.planillas, plId);
  const g = porId(S.grupos, pl.grupoId);
  const per = porId(S.config.periodos, pl.periodoId);
  const datos = {
    grupoNombre: nombreGrupo(g), areaNombre: nombreArea(pl.areaId), periodoNombre: per?.nombre || '',
    fechas: per?.inicio ? `${fechaCorta(per.inicio)} – ${fechaCorta(per.fin)}` : '',
    escala: `${S.config.escalaMin} a ${S.config.escalaMax}`, aprobacion: String(S.config.notaAprobacion),
    desempenos: [...S.config.desempenos].reverse().map((d) => [d.nombre, `${fmtNota(d.desde)} – ${fmtNota(d.hasta)}`]),
    componentes: pl.criterios.map((c) => ({
      nombre: c.nombre, peso: c.peso,
      actividades: c.actividades.map((a) => {
        const ins = porId(S.rubricas, a.rubricaId);
        const tec = porId(S.bancoPedagogico, a.tecnicaId);
        return { nombre: a.nombre, fecha: a.fecha ? fechaCorta(a.fecha) : 'Por definir', descripcion: a.descripcion || '',
          evalua: [tec ? tec.nombre : '', ins ? `${TIPOS_INSTRUMENTO[tipoInstrumento(ins)].nombre}: ${ins.nombre.replace(/^[^–]*–\s*/, '')}` : ''].filter(Boolean).join('\n') };
      }),
    })),
  };
  const r = await api.exportarWordCurricular('programacion', `Programación evaluativa ${datos.areaNombre} ${g?.nombre || ''} ${datos.periodoNombre}`, { config: S.config, datos });
  if (r.ok) aviso('Documento de Word creado', 'ok'); else if (r.error) aviso('No se pudo exportar: ' + r.error, 'error');
}

// ---------- Banco de instrumentos ----------
function vistaRubricas() {
  const f = ui.insFiltro || (ui.insFiltro = '');
  const lista = S.rubricas.filter((r) => !f || tipoInstrumento(r) === f);
  return `<div class="cabecera"><p class="sub" style="margin:0">Rúbricas, escalas de valoración y listas de cotejo. Asígnalas a una actividad para calificar con clics.</p>
    <div class="fila"><select style="width:auto" onchange="ui.insFiltro=this.value;render()"><option value="">Todos los tipos</option>${Object.entries(TIPOS_INSTRUMENTO).map(([k, v]) => `<option value="${k}" ${f === k ? 'selected' : ''}>${v.nombre}</option>`).join('')}</select>
    <button class="btn primario" onclick="editarRubrica()">＋ Nuevo instrumento</button></div></div>
  ${lista.length ? lista.map((r) => {
    const t = tipoInstrumento(r);
    return `<div class="tarjeta">
    <div class="cabecera"><div><h3 style="margin:0">${esc(r.nombre)}</h3><span class="chip">${TIPOS_INSTRUMENTO[t].nombre}</span> ${r.tecnicas ? `<span class="ayuda">Técnicas: ${esc(r.tecnicas)}</span>` : ''}</div>
      <div><button class="btn pequeno" onclick="editarRubrica('${r.id}')">✏️ Editar</button> <button class="btn pequeno" onclick="duplicarRubrica('${r.id}')">📑 Duplicar</button> <button class="btn pequeno peligro" onclick="eliminarRubrica('${r.id}')">🗑️</button></div></div>
    ${t === 'cotejo'
      ? `<table class="tabla"><thead><tr><th>Indicador</th><th class="num">Sí</th><th class="num">No</th></tr></thead><tbody>${r.criterios.map((c) => `<tr><td>${esc(c.nombre)}</td><td class="num">☐</td><td class="num">☐</td></tr>`).join('')}</tbody></table>`
      : `<table class="tabla"><thead><tr><th>${t === 'escala' ? 'Indicador' : 'Criterio'}</th>${r.niveles.map((n) => `<th>${esc(n.nombre)} (${esc(n.valor)})</th>`).join('')}</tr></thead><tbody>
      ${r.criterios.map((c) => `<tr><td><b>${esc(c.nombre)}</b></td>${r.niveles.map((_, i) => `<td class="ayuda">${t === 'escala' ? '☐' : esc(r.descriptores?.[c.id]?.[i] || '')}</td>`).join('')}</tr>`).join('')}
      </tbody></table>`}
    </div>`;
  }).join('') : '<div class="tarjeta vacio"><div class="grande">📋</div>No hay instrumentos de este tipo.</div>'}`;
}

let rubricaEnEdicion = null;
function editarRubrica(id) {
  rubricaEnEdicion = id ? structuredClone(porId(S.rubricas, id)) : {
    id: null, tipo: 'rubrica', nombre: '', tecnicas: '', descripcion: '',
    criterios: [{ id: uid(), nombre: '' }, { id: uid(), nombre: '' }, { id: uid(), nombre: '' }],
    niveles: nivelesDesempeno(), descriptores: {},
  };
  rubricaEnEdicion.tipo ||= 'rubrica';
  dibujarEditorRubrica();
}
function cambiarTipoInstrumento(t) {
  const r = rubricaEnEdicion;
  r.tipo = t;
  if (t === 'escala') r.niveles = nivelesFrecuencia();
  if (t === 'rubrica' && (!r.niveles.length || r.niveles[0].nombre === 'Siempre')) r.niveles = nivelesDesempeno();
  dibujarEditorRubrica();
}
function dibujarEditorRubrica() {
  const r = rubricaEnEdicion;
  const t = tipoInstrumento(r);
  const etiqueta = t === 'rubrica' ? 'Criterio' : 'Indicador';
  abrirModal(`<h2>${r.id ? 'Editar' : 'Nuevo'} instrumento de evaluación</h2>
    <div class="rejilla" style="grid-template-columns: 1fr 2fr">
      <div class="campo"><label>Tipo</label><select onchange="cambiarTipoInstrumento(this.value)">${Object.entries(TIPOS_INSTRUMENTO).map(([k, v]) => `<option value="${k}" ${t === k ? 'selected' : ''}>${v.nombre}</option>`).join('')}</select></div>
      <div class="campo"><label>Nombre</label><input value="${esc(r.nombre)}" oninput="rubricaEnEdicion.nombre=this.value" placeholder="Ej.: Rúbrica de exposición oral"></div>
    </div>
    <p class="ayuda" style="margin-top:-6px">${TIPOS_INSTRUMENTO[t].ayuda}</p>
    <div class="campo"><label>Técnicas o actividades con las que se usa</label><input value="${esc(r.tecnicas || '')}" oninput="rubricaEnEdicion.tecnicas=this.value" placeholder="Ej.: Exposición, debate, foro"></div>
    ${t === 'cotejo' ? `
      <table class="tabla"><thead><tr><th>Indicador (se marca Sí o No)</th><th></th></tr></thead><tbody>
      ${r.criterios.map((c, ci) => `<tr><td><input value="${esc(c.nombre)}" oninput="rubricaEnEdicion.criterios[${ci}].nombre=this.value"></td>
        <td style="width:40px">${r.criterios.length > 1 ? `<button class="icono" onclick="rubricaEnEdicion.criterios.splice(${ci},1);dibujarEditorRubrica()">🗑️</button>` : ''}</td></tr>`).join('')}
      </tbody></table>
      <p class="ayuda">La nota es proporcional a los indicadores cumplidos: todos = ${S.config.escalaMax}, ninguno = ${S.config.escalaMin}.</p>`
    : `<div style="overflow-x:auto"><table class="tabla rubrica"><thead><tr><th style="min-width:160px">${etiqueta}</th>
      ${r.niveles.map((n, i) => `<th style="min-width:${t === 'rubrica' ? 150 : 110}px"><input value="${esc(n.nombre)}" oninput="rubricaEnEdicion.niveles[${i}].nombre=this.value" style="margin-bottom:4px">
        <div class="fila" style="flex-wrap:nowrap">Valor <input type="number" step="0.1" value="${esc(n.valor)}" oninput="rubricaEnEdicion.niveles[${i}].valor=+this.value" style="width:70px">
        ${r.niveles.length > 2 ? `<button class="icono" onclick="rubricaEnEdicion.niveles.splice(${i},1);Object.values(rubricaEnEdicion.descriptores).forEach(d=>d.splice(${i},1));dibujarEditorRubrica()">✖</button>` : ''}</div></th>`).join('')}
      <th><button class="btn pequeno" onclick="rubricaEnEdicion.niveles.push({nombre:'Nivel',valor:${S.config.escalaMin}});dibujarEditorRubrica()">＋ Nivel</button></th></tr></thead><tbody>
      ${r.criterios.map((c, ci) => `<tr><td><input value="${esc(c.nombre)}" oninput="rubricaEnEdicion.criterios[${ci}].nombre=this.value"></td>
        ${r.niveles.map((_, ni) => t === 'rubrica' ? `<td><textarea oninput="(rubricaEnEdicion.descriptores['${c.id}'] ||= [])[${ni}]=this.value" placeholder="Descriptor…">${esc(r.descriptores?.[c.id]?.[ni] || '')}</textarea></td>` : '<td class="num ayuda">☐</td>').join('')}
        <td>${r.criterios.length > 1 ? `<button class="icono" onclick="rubricaEnEdicion.criterios.splice(${ci},1);dibujarEditorRubrica()">🗑️</button>` : ''}</td></tr>`).join('')}
    </tbody></table></div>`}
    <button class="btn pequeno" onclick="rubricaEnEdicion.criterios.push({id:uid(),nombre:''});dibujarEditorRubrica()">＋ ${etiqueta}</button>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarRubrica()">Guardar</button></div>`, { ancho: true });
}
function guardarRubrica() {
  const r = rubricaEnEdicion;
  if (!r.nombre.trim()) return aviso('Ponle un nombre al instrumento', 'error');
  r.criterios = r.criterios.filter((c) => c.nombre.trim());
  if (!r.criterios.length) return aviso(`Agrega al menos un ${r.tipo === 'rubrica' ? 'criterio' : 'indicador'}`, 'error');
  if (r.id) {
    const i = S.rubricas.findIndex((x) => x.id === r.id);
    S.rubricas[i] = r;
    recalcularNotasRubrica(r.id);
  } else { r.id = uid(); S.rubricas.push(r); }
  guardar(); cerrarModal(); render();
}
function duplicarRubrica(id) {
  const r = structuredClone(porId(S.rubricas, id));
  r.id = uid(); r.nombre += ' (copia)'; r.predeterminado = false;
  S.rubricas.push(r); guardar(); render();
}
async function eliminarRubrica(id) {
  const usos = S.planillas.flatMap((p) => p.criterios.flatMap((c) => c.actividades)).filter((a) => a.rubricaId === id);
  if (!(await confirmar(`¿Eliminar este instrumento?${usos.length ? ` Se usa en ${usos.length} actividad(es); sus notas se conservan como notas directas.` : ''}`))) return;
  usos.forEach((a) => { a.rubricaId = ''; });
  const r = porId(S.rubricas, id);
  if (r.predeterminado) (S.instrumentosEliminados ||= []).push(id);
  S.rubricas = S.rubricas.filter((x) => x.id !== id);
  guardar(); render();
}

// ---------- Calificar con un instrumento ----------
let seleccionRubrica = {};
function calificarConRubrica(actId, alumnoId) {
  const a = buscarActividad(actId);
  const r = porId(S.rubricas, a.rubricaId);
  if (!r) return aviso('El instrumento de esta actividad ya no existe', 'error');
  seleccionRubrica = { ...(S.notasRubrica[actId]?.[alumnoId] || {}) };
  const al = porId(S.alumnos, alumnoId);
  const t = tipoInstrumento(r);
  const dibujar = () => {
    const n = notaDesdeRubrica(r, seleccionRubrica);
    const cuerpo = t === 'cotejo'
      ? `<table class="tabla"><tbody>${r.criterios.map((c) => `<tr><td>${esc(c.nombre)}</td><td style="width:150px;white-space:nowrap">
          <button class="btn pequeno ${seleccionRubrica[c.id] === 1 ? 'primario' : ''}" onclick="seleccionRubrica['${c.id}']=1;window._dibRub()">✔ Sí</button>
          <button class="btn pequeno ${seleccionRubrica[c.id] === 0 ? 'peligro' : ''}" style="${seleccionRubrica[c.id] === 0 ? 'background:#fdecec' : ''}" onclick="seleccionRubrica['${c.id}']=0;window._dibRub()">✖ No</button></td></tr>`).join('')}</tbody></table>
          <button class="btn pequeno" style="margin-top:8px" onclick="${r.criterios.map((c) => `seleccionRubrica['${c.id}']=1`).join(';')};window._dibRub()">Marcar todo como Sí</button>`
      : `<div class="rejilla" style="grid-template-columns: repeat(${Math.min(r.criterios.length, t === 'escala' ? 2 : 3)}, 1fr)">
        ${r.criterios.map((c) => `<div><h3>${esc(c.nombre)}</h3>${r.niveles.map((nv, i) => `<button class="nivel-btn ${seleccionRubrica[c.id] === i ? 'sel' : ''}" onclick="seleccionRubrica['${c.id}']=${i};window._dibRub()"><b>${esc(nv.nombre)} (${esc(nv.valor)})</b>${r.descriptores?.[c.id]?.[i] ? '<br>' + esc(r.descriptores[c.id][i]) : ''}</button>`).join('')}</div>`).join('')}
        </div>`;
    abrirModal(`<h2>${esc(a.nombre)} – ${esc(nombreAlumno(al))}</h2><p class="ayuda">${TIPOS_INSTRUMENTO[t].nombre}: ${esc(r.nombre)}</p>
      ${cuerpo}
      <h3>Nota: <span class="${claseNota(n)}">${fmtNota(n)}</span> ${chipDesempeno(n)}</h3>
      <div class="botones"><button class="btn peligro" style="margin-right:auto" onclick="guardarNotaRubrica('${actId}','${alumnoId}',true)">Borrar calificación</button>
        <button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarNotaRubrica('${actId}','${alumnoId}')">Guardar</button></div>`, { ancho: true });
  };
  window._dibRub = dibujar;
  dibujar();
}
function guardarNotaRubrica(actId, alumnoId, borrar = false) {
  const r = porId(S.rubricas, buscarActividad(actId).rubricaId);
  S.notasRubrica[actId] ||= {};
  S.notas[actId] ||= {};
  if (borrar) { delete S.notasRubrica[actId][alumnoId]; delete S.notas[actId][alumnoId]; }
  else {
    const n = notaDesdeRubrica(r, seleccionRubrica);
    if (n == null) return aviso(tipoInstrumento(r) === 'cotejo' ? 'Marca Sí o No en cada indicador' : 'Selecciona un nivel en cada criterio', 'error');
    S.notasRubrica[actId][alumnoId] = { ...seleccionRubrica };
    S.notas[actId][alumnoId] = redondear(n);
  }
  guardar(); cerrarModal(); render();
}
