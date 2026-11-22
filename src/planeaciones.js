// ================= Planeaciones y banco =================

const TIPOS_PLAN = {
  sesion: 'Por sesión',
  semanal: 'Semanal',
  secuencia: 'Secuencia didáctica / proyecto',
};

// Campos de texto de la planeación que puede redactar la IA
const CAMPOS_TEXTO = [
  { k: 'componentes', t: 'Componentes del área' },
  { k: 'competencias', t: 'Competencias' },
  { k: 'estandares', t: 'Estándares básicos de competencias' },
  { k: 'dba', t: 'Derechos Básicos de Aprendizaje (DBA)' },
  { k: 'evidencias', t: 'Evidencias de aprendizaje' },
  { k: 'objetivo', t: 'Objetivo de aprendizaje' },
  { k: 'pregunta', t: 'Situación / pregunta problematizadora' },
  { k: 'tme', t: 'Métodos, técnicas y estrategias' },
  { k: 'desempenoSaber', t: 'Desempeño – Saber (cognitivo)' },
  { k: 'desempenoHacer', t: 'Desempeño – Hacer (procedimental)' },
  { k: 'desempenoSer', t: 'Desempeño – Ser (actitudinal)' },
  { k: 'recursos', t: 'Recursos' },
  { k: 'evaluacion', t: 'Técnicas e instrumentos de evaluación' },
  { k: 'ajustes', t: 'Ajustes y apoyos (PIAR / inclusión)' },
  { k: 'bibliografia', t: 'Bibliografía y/o cibergrafía' },
];
const CAMPOS_DIVERSIDAD = [
  { k: 'estilos', t: 'Estilos de aprendizaje', ph: 'Cómo aprende mejor el grupo: visual, kinestésico, necesita instrucciones estructuradas…' },
  { k: 'gustos', t: 'Los gustos', ph: 'Intereses y actividades que motivan al grupo…' },
  { k: 'caracteristicas', t: 'Características del grupo, dificultades y barreras para el aprendizaje y la participación', ph: 'Atención, convivencia, lectura, ritmos, barreras…' },
  { k: 'ajustes', t: 'Ajustes y apoyos', ph: '• Rutinas claras\n• Instrucciones de una en una\n• Apoyos visuales…' },
];

const MOMENTOS = [
  { k: 'exploracion', t: 'Exploración', ph: 'Saberes previos, motivación, pregunta problematizadora…' },
  { k: 'estructuracion', t: 'Estructuración', ph: 'Explicación, construcción de conceptos, modelación…' },
  { k: 'practica', t: 'Práctica', ph: 'Ejercicios, talleres, trabajo colaborativo…' },
  { k: 'transferencia', t: 'Transferencia', ph: 'Aplicación en nuevos contextos, situaciones reales…' },
  { k: 'valoracion', t: 'Valoración / cierre', ph: 'Socialización, autoevaluación, verificación de aprendizajes…' },
];

function nuevaSesion(fecha = '') {
  const s = { id: uid(), fecha, titulo: '', duracion: 55 };
  MOMENTOS.forEach((m) => { s[m.k] = ''; s[m.k + 'Med'] = ''; });
  return s;
}
function aplicarDiversidadGrupo(p, reemplazar = false) {
  const g = porId(S.grupos, p.grupoId);
  const d = g?.diversidad || {};
  CAMPOS_DIVERSIDAD.forEach((c) => { if (d[c.k] && (reemplazar || !p[c.k])) p[c.k] = d[c.k]; });
}

// ---------- Listado ----------
RENDERS.planeaciones = () => {
  const f = ui.filtroPlan || (ui.filtroPlan = { grupoId: '', areaId: '', periodoId: '', tipo: '', estado: '', texto: '' });
  const q = normalizar(f.texto);
  const lista = S.planeaciones.filter((p) =>
    (!f.grupoId || p.grupoId === f.grupoId) && (!f.areaId || p.areaId === f.areaId) && (!f.periodoId || p.periodoId === f.periodoId) &&
    (!f.tipo || p.tipo === f.tipo) && (!f.estado || (p.estado || 'borrador') === f.estado) &&
    (!q || normalizar([p.titulo, p.competencias, p.dba, ...(p.sesiones || []).map((s) => s.titulo)].join(' ')).includes(q))
  ).sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));

  return `
  <div class="cabecera"><div><h1>Planeaciones</h1><p class="sub">Planeaciones por sesión, semanales o por secuencia didáctica.</p></div>
    <div class="acciones"><button class="btn primario" onclick="nuevaPlaneacion()">＋ Nueva planeación</button></div></div>
  <div class="filtros tarjeta">
    <div style="flex:1;min-width:200px"><label>Buscar</label><input value="${esc(f.texto)}" placeholder="Tema, competencia, DBA…" oninput="ui.filtroPlan.texto=this.value;clearTimeout(window._tb);window._tb=setTimeout(()=>{render();const i=document.querySelector('.filtros input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},300)"></div>
    <div><label>Grupo</label><select onchange="ui.filtroPlan.grupoId=this.value;render()">${opcionesGrupos(f.grupoId, 'Todos')}</select></div>
    <div><label>Área</label><select onchange="ui.filtroPlan.areaId=this.value;render()">${opcionesAreas(f.areaId, 'Todas')}</select></div>
    <div><label>Periodo</label><select onchange="ui.filtroPlan.periodoId=this.value;render()">${opcionesPeriodos(f.periodoId, 'Todos')}</select></div>
    <div><label>Tipo</label><select onchange="ui.filtroPlan.tipo=this.value;render()"><option value="">Todos</option>${Object.entries(TIPOS_PLAN).map(([k, v]) => `<option value="${k}" ${f.tipo === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div><label>Estado</label><select onchange="ui.filtroPlan.estado=this.value;render()"><option value="">Todos</option><option value="borrador" ${f.estado === 'borrador' ? 'selected' : ''}>Borrador</option><option value="terminada" ${f.estado === 'terminada' ? 'selected' : ''}>Terminada</option></select></div>
  </div>
  ${lista.length ? `<div class="envoltura-tabla"><table class="tabla"><thead><tr><th>Fecha</th><th>Tema / título</th><th>Tipo</th><th>Grupo</th><th>Área</th><th>Periodo</th><th>Estado</th><th></th></tr></thead><tbody>
  ${lista.map((p) => `<tr>
    <td style="white-space:nowrap">${esc(fechaCorta(p.fechaInicio))}</td>
    <td><a href="#" onclick="editarPlaneacion('${p.id}');return false"><b>${esc(p.titulo || 'Sin título')}</b></a>${p.enBanco ? ' <span title="En el banco">🗂️</span>' : ''}<br><span class="ayuda">${(p.sesiones || []).length} sesión(es)</span></td>
    <td><span class="chip ${p.tipo}">${esc(TIPOS_PLAN[p.tipo])}</span></td>
    <td>${esc(nombreGrupoId(p.grupoId))}</td><td>${esc(nombreArea(p.areaId))}</td><td>${esc(nombrePeriodo(p.periodoId))}</td>
    <td><span class="chip ${p.estado || 'borrador'}">${p.estado === 'terminada' ? 'Terminada' : 'Borrador'}</span></td>
    <td style="white-space:nowrap">
      <button class="icono" title="Editar" onclick="editarPlaneacion('${p.id}')">✏️</button>
      <button class="icono" title="Exportar a Word" onclick="exportarPlanWord('${p.id}')">📄</button>
      <button class="icono" title="Duplicar / usar en otro grupo" onclick="dialogoReutilizar('${p.id}')">📑</button>
      <button class="icono" title="Eliminar" onclick="eliminarPlaneacion('${p.id}')">🗑️</button></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="tarjeta vacio"><div class="grande">📝</div>${S.planeaciones.length ? 'Ninguna planeación coincide con los filtros.' : 'Aún no tienes planeaciones. ¡Crea la primera!'}</div>`}`;
};

function nuevaPlaneacion(fecha) {
  const grupos = [...S.grupos].sort(ordenGrupos);
  abrirModal(`<h2>Nueva planeación</h2>
    <div class="campo"><label>Tipo de planeación</label>
      ${Object.entries(TIPOS_PLAN).map(([k, v], i) => `<label style="font-weight:normal;color:inherit;font-size:14px;margin:6px 0"><input type="radio" name="m-tipo" value="${k}" ${i === 0 ? 'checked' : ''}> <b>${v}</b> – <span class="ayuda">${{ sesion: 'una clase con sus momentos', semanal: 'las clases de una semana', secuencia: 'varias sesiones bajo un mismo propósito o proyecto' }[k]}</span></label>`).join('')}
    </div>
    <div class="rejilla r2">
      <div class="campo"><label>Grupo</label><select id="m-grupo" onchange="actualizarAreasModal()">${opciones(grupos, grupos[0]?.id, { vacio: '(sin grupo)', texto: nombreGrupo })}</select></div>
      <div class="campo"><label>Área</label><select id="m-area"></select></div>
      <div class="campo"><label>Fecha de inicio</label><input type="date" id="m-fecha" value="${fecha || hoyISO()}"></div>
      <div class="campo"><label>Tema / título</label><input id="m-titulo" placeholder="Ej.: Números enteros en la recta"></div>
    </div>
    ${!S.grupos.length ? '<p class="alerta">Consejo: crea primero tus grupos y áreas en "Grupos y alumnos".</p>' : ''}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="crearPlaneacion()">Crear</button></div>`);
  actualizarAreasModal();
}
function actualizarAreasModal() {
  const g = document.getElementById('m-grupo').value;
  const lista = g && areasDeGrupo(g).length ? areasDeGrupo(g) : S.areas;
  document.getElementById('m-area').innerHTML = opcionesAreas(lista[0]?.id, '(sin área)', lista);
}
function crearPlaneacion() {
  const tipo = document.querySelector('input[name=m-tipo]:checked').value;
  const fecha = document.getElementById('m-fecha').value || hoyISO();
  const n = tipo === 'secuencia' ? 3 : 1;
  let sesiones;
  if (tipo === 'semanal') {
    sesiones = [nuevaSesion(fecha), nuevaSesion('')];
  } else {
    sesiones = Array.from({ length: n }, (_, i) => nuevaSesion(i === 0 ? fecha : ''));
  }
  const fechaInicio = fecha;
  const p = {
    id: uid(), tipo, titulo: document.getElementById('m-titulo').value.trim(),
    grupoId: document.getElementById('m-grupo').value, areaId: document.getElementById('m-area').value,
    periodoId: periodoDeFecha(fecha)?.id || '', fechaInicio, fechaFin: tipo === 'semanal' ? sumarDias(lunesDe(fecha), 4) : fecha,
    estado: 'borrador', enBanco: false, sesiones, observaciones: '',
    creada: new Date().toISOString(), modificada: new Date().toISOString(),
  };
  CAMPOS_TEXTO.forEach((c) => { p[c.k] = ''; });
  p.criterios = [];
  aplicarDiversidadGrupo(p);
  S.planeaciones.push(p);
  guardar(); cerrarModal();
  editarPlaneacion(p.id);
}

function editarPlaneacion(id) { ir('editor', { id }); }

async function eliminarPlaneacion(id) {
  const p = porId(S.planeaciones, id);
  if (!(await confirmar(`¿Eliminar la planeación "${p.titulo || 'Sin título'}"?`))) return;
  S.planeaciones = S.planeaciones.filter((x) => x.id !== id);
  guardar();
  ir('planeaciones');
}

// ---------- Editor ----------
function campoTexto(p, k, t, ph = '', banco = false, momentoBanco = '') {
  const id = `ta-${p.id}-${k}`;
  return `<div class="campo"><label>${esc(t)}${banco ? botonBanco(id, momentoBanco) : ''}</label><textarea id="${id}" data-campo="${k}" placeholder="${esc(ph)}" oninput="cambiarPlan('${p.id}','${k}',this.value)">${esc(p[k] || '')}</textarea></div>`;
}
function campoLinea(p, k, t, ph = '') {
  return `<div class="campo"><label>${esc(t)}</label><input value="${esc(p[k] || '')}" placeholder="${esc(ph)}" oninput="cambiarPlan('${p.id}','${k}',this.value)"></div>`;
}
function rangoDesempeno(nombre) {
  const d = S.config.desempenos.find((x) => x.nombre === nombre);
  return d ? `${fmtNota(d.hasta)} – ${fmtNota(d.desde)}` : '';
}
const NIVELES_CRITERIO = [['superior', 'Superior'], ['alto', 'Alto'], ['basico', 'Básico'], ['bajo', 'Bajo']];

RENDERS.editor = ({ id }) => {
  const p = porId(S.planeaciones, id);
  if (!p) return '<p>Planeación no encontrada.</p>';
  p.criterios ||= [];
  const areas = p.grupoId && areasDeGrupo(p.grupoId).length ? areasDeGrupo(p.grupoId) : S.areas;
  const piar = p.grupoId ? alumnosDe(p.grupoId).filter((a) => a.piar) : [];
  const nEst = p.grupoId ? alumnosDe(p.grupoId).length : 0;
  const g = porId(S.grupos, p.grupoId);
  const etiquetaSesion = p.tipo === 'semanal' ? 'Clase' : 'Sesión';
  return `
  <div class="cabecera"><div>
    <h1>${esc(p.titulo || 'Planeación sin título')}</h1>
    <p class="sub"><span class="chip ${p.tipo}">${TIPOS_PLAN[p.tipo]}</span> · ${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))} · Se guarda automáticamente</p>
  </div><div class="acciones">
    <button class="btn" onclick="ir('planeaciones')">← Volver</button>
    <button class="btn ia" onclick="dialogoIA('${p.id}')">✨ Sugerir con IA</button>
    <button class="btn" onclick="dialogoReutilizar('${p.id}')">📑 Duplicar</button>
    <button class="btn primario" onclick="exportarPlanWord('${p.id}')">📄 Exportar a Word</button>
  </div></div>

  <div class="tarjeta"><h2>1. Identificación</h2>
    <div class="rejilla r4">
      <div class="campo" style="grid-column: span 2"><label>Tema / título</label><input value="${esc(p.titulo)}" oninput="cambiarPlan('${p.id}','titulo',this.value);document.querySelector('main h1').textContent=this.value||'Planeación sin título'"></div>
      <div class="campo"><label>Tipo</label><select onchange="cambiarPlan('${p.id}','tipo',this.value);render()">${Object.entries(TIPOS_PLAN).map(([k, v]) => `<option value="${k}" ${p.tipo === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="campo"><label>Estado</label><select onchange="cambiarPlan('${p.id}','estado',this.value)"><option value="borrador">Borrador</option><option value="terminada" ${p.estado === 'terminada' ? 'selected' : ''}>Terminada</option></select></div>
      <div class="campo"><label>Grado / grupo</label><select onchange="cambiarPlan('${p.id}','grupoId',this.value);aplicarDiversidadGrupo(porId(S.planeaciones,'${p.id}'));render()">${opcionesGrupos(p.grupoId, '(sin grupo)')}</select>
        <div class="ayuda">${p.grupoId ? `${nEst} estudiante(s)` : ''}</div></div>
      <div class="campo"><label>Área / asignatura</label><select onchange="cambiarPlan('${p.id}','areaId',this.value);render()">${opcionesAreas(p.areaId, '(sin área)', areas)}</select></div>
      <div class="campo"><label>Período</label><select onchange="cambiarPlan('${p.id}','periodoId',this.value)">${opcionesPeriodos(p.periodoId, '(sin periodo)')}</select></div>
      ${campoLinea(p, 'duracion', 'Duración', 'Ej.: 2 horas académicas')}
      <div class="campo"><label>Fecha de inicio</label><input type="date" value="${esc(p.fechaInicio)}" onchange="cambiarPlan('${p.id}','fechaInicio',this.value);if(!porId(S.planeaciones,'${p.id}').periodoId){cambiarPlan('${p.id}','periodoId',periodoDeFecha(this.value)?.id||'');render()}"></div>
      <div class="campo"><label>Fecha de finalización</label><input type="date" value="${esc(p.fechaFin)}" onchange="cambiarPlan('${p.id}','fechaFin',this.value)"></div>
      <div class="campo" style="grid-column: span 2">${campoLinea(p, 'locativos', 'Locativos', 'Ej.: Aula de clase y/o sala de cómputo').replace('<div class="campo">', '<div>')}</div>
      <div class="campo" style="grid-column: span 3">${campoLinea(p, 'recursos', 'Recursos', 'Ej.: PC (docente), proyector, tablero, marcadores').replace('<div class="campo">', '<div>')}</div>
      <div class="campo"><label><input type="checkbox" ${p.enBanco ? 'checked' : ''} onchange="cambiarPlan('${p.id}','enBanco',this.checked)"> Guardar en el banco</label><div class="ayuda">Para reutilizarla en otros grupos o años.</div></div>
    </div>
  </div>

  <div class="tarjeta"><div class="cabecera"><h2 style="margin:0">Diversidad del aula</h2>
    ${g ? `<div class="fila"><button class="btn pequeno" onclick="aplicarDiversidadGrupo(porId(S.planeaciones,'${p.id}'),true);tocarPlan(porId(S.planeaciones,'${p.id}'));render()" title="Reemplaza estos campos con el perfil guardado del grupo">↺ Traer del perfil de ${esc(g.nombre)}</button>
      <button class="btn pequeno" onclick="guardarDiversidadEnGrupo('${p.id}')" title="Guarda estos textos como perfil del grupo para próximas planeaciones">💾 Guardar como perfil del grupo</button></div>` : ''}</div>
    <div class="rejilla r2">
      ${CAMPOS_DIVERSIDAD.map((c) => campoTexto(p, c.k, c.t, c.ph, c.k === 'ajustes')).join('')}
    </div>
    ${piar.length ? `<div class="alerta info">Estudiantes con PIAR en este grupo: ${piar.map((a) => esc(nombreAlumno(a)) + (a.observaciones ? ` <span class="ayuda">(${esc(a.observaciones)})</span>` : '')).join(', ')}</div>` : ''}
  </div>

  ${tarjetaMallaEnEditor(p)}

  <div class="tarjeta"><h2>2. Fundamentación</h2>
    <div class="rejilla r2">
      ${campoTexto(p, 'componentes', 'Componentes', 'Ej.: Naturaleza y evolución de la tecnología; Uso y apropiación…')}
      ${campoTexto(p, 'competencias', 'Competencias', 'Competencias a desarrollar…')}
      ${campoTexto(p, 'estandares', 'Estándares básicos de competencias', 'Estándar(es) del MEN…')}
      ${campoTexto(p, 'dba', 'Derechos Básicos de Aprendizaje (DBA)', 'Si el área los tiene…')}
      ${campoTexto(p, 'evidencias', 'Evidencias de aprendizaje', 'Comparo…, Establezco…, Reflexiono…')}
      <div>${campoLinea(p, 'unidad', 'Unidad', 'Ej.: Inventos que ayudan a vivir mejor en la ciudad')}
        ${campoTexto(p, 'objetivo', 'Objetivo de aprendizaje', 'Que el estudiante logre…')}</div>
      ${campoTexto(p, 'pregunta', 'Situación / pregunta problematizadora', '¿…?')}
      ${campoTexto(p, 'tme', 'Métodos, técnicas y estrategias', 'Método rector, técnicas y estrategias que se usarán…', true)}
    </div>
    <h3>Indicadores de desempeño</h3>
    <div class="rejilla r3">
      ${campoTexto(p, 'desempenoSaber', 'Saber (cognitivo)', 'Identifica, reconoce, explica…')}
      ${campoTexto(p, 'desempenoHacer', 'Hacer (procedimental)', 'Resuelve, construye, aplica…')}
      ${campoTexto(p, 'desempenoSer', 'Ser (actitudinal)', 'Participa, respeta, colabora…')}
    </div>
  </div>

  <div class="tarjeta"><div class="cabecera"><h2 style="margin:0">2.1 Evaluación</h2>
    <button class="btn pequeno primario" onclick="agregarCriterioPlan('${p.id}')">＋ Criterio de evaluación</button></div>
    ${p.criterios.length ? `<div style="overflow-x:auto"><table class="tabla rubrica"><thead><tr><th style="min-width:180px">Criterio de evaluación</th>
      ${NIVELES_CRITERIO.map(([, n]) => `<th style="min-width:150px">${n} (${rangoDesempeno(n)})</th>`).join('')}<th></th></tr></thead><tbody>
      ${p.criterios.map((c, i) => `<tr><td><textarea oninput="cambiarCriterioPlan('${p.id}',${i},'criterio',this.value)">${esc(c.criterio)}</textarea></td>
        ${NIVELES_CRITERIO.map(([k]) => `<td><textarea oninput="cambiarCriterioPlan('${p.id}',${i},'${k}',this.value)">${esc(c[k])}</textarea></td>`).join('')}
        <td><button class="icono" title="Eliminar" onclick="eliminarCriterioPlan('${p.id}',${i})">🗑️</button></td></tr>`).join('')}
    </tbody></table></div>` : '<p class="ayuda">Agrega los criterios con su descriptor para cada nivel de desempeño (o usa la IA para un borrador).</p>'}
    ${campoTexto(p, 'evaluacion', 'Técnicas e instrumentos de evaluación', 'Rúbrica, lista de cotejo, escala de valoración, autoevaluación, coevaluación…', true, 'valoracion')}
  </div>

  <div class="tarjeta"><div class="cabecera"><h2 style="margin:0">3. Acciones metodológicas${p.tipo === 'sesion' ? '' : (p.tipo === 'semanal' ? ' – clases de la semana' : ' – sesiones de la secuencia')}</h2>
    <button class="btn pequeno primario" onclick="agregarSesion('${p.id}')">＋ ${etiquetaSesion}</button></div>
    ${(p.sesiones || []).map((s, i) => `
    <div class="sesion-caja">
      <div class="cab"><b>${etiquetaSesion} ${i + 1}${s.fecha ? ' · ' + esc(fechaLarga(s.fecha)) : ''}</b>
        <div>${i > 0 ? `<button class="icono" title="Subir" onclick="moverSesion('${p.id}',${i},-1)">⬆️</button>` : ''}${i < p.sesiones.length - 1 ? `<button class="icono" title="Bajar" onclick="moverSesion('${p.id}',${i},1)">⬇️</button>` : ''}
        <button class="icono" title="Duplicar sesión" onclick="duplicarSesion('${p.id}',${i})">📑</button>
        ${p.sesiones.length > 1 ? `<button class="icono" title="Eliminar sesión" onclick="eliminarSesion('${p.id}',${i})">🗑️</button>` : ''}</div></div>
      <div class="rejilla" style="grid-template-columns: 2fr 1fr 120px">
        <div class="campo"><label>Título o propósito de la sesión</label><input value="${esc(s.titulo)}" oninput="cambiarSesion('${p.id}',${i},'titulo',this.value)"></div>
        <div class="campo"><label>Fecha</label><input type="date" value="${esc(s.fecha)}" onchange="cambiarSesion('${p.id}',${i},'fecha',this.value);render()"></div>
        <div class="campo"><label>Duración (min)</label><input type="number" min="0" value="${esc(s.duracion)}" oninput="cambiarSesion('${p.id}',${i},'duracion',+this.value)"></div>
      </div>
      <table class="tabla" style="background:transparent"><thead><tr><th style="width:130px">Momento</th><th>Acciones</th><th style="width:32%">Mediaciones (recursos o materiales didácticos)</th></tr></thead><tbody>
        ${MOMENTOS.map((m) => `<tr><td><b>${m.t}</b><br>${botonBanco(`ta-${s.id}-${m.k}`, m.k).replace('margin-left:6px', 'margin:4px 0 0 0')}</td>
          <td><textarea id="ta-${s.id}-${m.k}" placeholder="${esc(m.ph)}" oninput="cambiarSesion('${p.id}',${i},'${m.k}',this.value)">${esc(s[m.k] || '')}</textarea></td>
          <td><textarea placeholder="Recursos, materiales, herramientas…" oninput="cambiarSesion('${p.id}',${i},'${m.k}Med',this.value)">${esc(s[m.k + 'Med'] || '')}</textarea></td></tr>`).join('')}
      </tbody></table>
    </div>`).join('')}
  </div>

  <div class="tarjeta"><div class="rejilla r2">
    ${campoTexto(p, 'bibliografia', 'Bibliografía y/o cibergrafía', 'Textos, sitios web, videos…')}
    ${campoTexto(p, 'observaciones', 'Observaciones y reflexiones', '¿Qué funcionó? ¿Qué ajustar la próxima vez?')}
  </div></div>
  <div class="fila" style="justify-content:flex-end"><button class="btn peligro" onclick="eliminarPlaneacion('${p.id}')">🗑️ Eliminar planeación</button></div>`;
};

function guardarDiversidadEnGrupo(planId) {
  const p = porId(S.planeaciones, planId);
  const g = porId(S.grupos, p.grupoId);
  g.diversidad = Object.fromEntries(CAMPOS_DIVERSIDAD.map((c) => [c.k, p[c.k] || '']));
  guardar();
  aviso(`Perfil de diversidad guardado en ${g.nombre}`, 'ok');
}
function agregarCriterioPlan(id) { const p = porId(S.planeaciones, id); p.criterios.push({ criterio: '', superior: '', alto: '', basico: '', bajo: '' }); tocarPlan(p); render(); }
function cambiarCriterioPlan(id, i, k, v) { const p = porId(S.planeaciones, id); p.criterios[i][k] = v; tocarPlan(p); }
function eliminarCriterioPlan(id, i) { const p = porId(S.planeaciones, id); p.criterios.splice(i, 1); tocarPlan(p); render(); }

function tocarPlan(p) { p.modificada = new Date().toISOString(); guardar(); }
function cambiarPlan(id, campo, valor) { const p = porId(S.planeaciones, id); p[campo] = valor; tocarPlan(p); }
function cambiarSesion(id, i, campo, valor) {
  const p = porId(S.planeaciones, id);
  p.sesiones[i][campo] = valor;
  if (campo === 'fecha') {
    const fechas = p.sesiones.map((s) => s.fecha).filter(Boolean).sort();
    if (fechas.length) { p.fechaInicio = fechas[0]; p.fechaFin = fechas[fechas.length - 1]; }
  }
  tocarPlan(p);
}
function agregarSesion(id) {
  const p = porId(S.planeaciones, id);
  const ultima = [...p.sesiones].reverse().find((s) => s.fecha);
  const s = nuevaSesion(ultima ? sumarDias(ultima.fecha, 1) : '');
  s.duracion = p.sesiones[0]?.duracion || 55;
  p.sesiones.push(s);
  tocarPlan(p); render();
}
function duplicarSesion(id, i) {
  const p = porId(S.planeaciones, id);
  p.sesiones.splice(i + 1, 0, { ...structuredClone(p.sesiones[i]), id: uid(), fecha: '' });
  tocarPlan(p); render();
}
async function eliminarSesion(id, i) {
  if (!(await confirmar(`¿Eliminar la sesión ${i + 1}?`))) return;
  const p = porId(S.planeaciones, id);
  p.sesiones.splice(i, 1);
  tocarPlan(p); render();
}
function moverSesion(id, i, d) {
  const p = porId(S.planeaciones, id);
  const [s] = p.sesiones.splice(i, 1);
  p.sesiones.splice(i + d, 0, s);
  tocarPlan(p); render();
}

// ---------- Exportar a Word ----------
async function exportarPlanWord(id) {
  const p = porId(S.planeaciones, id);
  const g = porId(S.grupos, p.grupoId);
  const r = await api.exportarWord({
    config: S.config, plan: p,
    numEstudiantes: p.grupoId ? alumnosDe(p.grupoId).length : '',
    piar: p.grupoId ? alumnosDe(p.grupoId).filter((a) => a.piar).map((a) => nombreAlumno(a) + (a.observaciones ? ` (${a.observaciones})` : '')).join('; ') : '',
    rangos: Object.fromEntries(NIVELES_CRITERIO.map(([k, n]) => [k, `${n} (${rangoDesempeno(n)})`])),
    momentos: MOMENTOS.map((m) => ({ k: m.k, t: m.t })),
    grupoNombre: g ? nombreGrupo(g) : '', areaNombre: p.areaId ? nombreArea(p.areaId) : '',
    periodoNombre: nombrePeriodo(p.periodoId), tipoLabel: TIPOS_PLAN[p.tipo],
    nombreArchivo: `Planeación ${p.areaId ? nombreArea(p.areaId) : ''} ${g ? g.nombre : ''} ${p.fechaInicio || ''} ${p.titulo || ''}`.replace(/\s+/g, ' ').trim().slice(0, 120),
  });
  if (r.ok) aviso('Documento de Word creado', 'ok');
  else if (r.error) aviso('No se pudo exportar: ' + r.error, 'error');
}

// ---------- Duplicar / reutilizar ----------
function dialogoReutilizar(id) {
  const p = porId(S.planeaciones, id);
  abrirModal(`<h2>Duplicar o reutilizar planeación</h2>
    <p class="ayuda">Se creará una copia de "<b>${esc(p.titulo || 'Sin título')}</b>". Las fechas de las sesiones se desplazan según la nueva fecha de inicio.</p>
    <div class="rejilla r2">
      <div class="campo"><label>Grupo destino</label><select id="m-grupo">${opcionesGrupos(p.grupoId, '(sin grupo)')}</select></div>
      <div class="campo"><label>Área</label><select id="m-area">${opcionesAreas(p.areaId, '(sin área)')}</select></div>
      <div class="campo"><label>Nueva fecha de inicio</label><input type="date" id="m-fecha" value="${esc(p.fechaInicio || hoyISO())}"></div>
      <div class="campo"><label>Periodo</label><select id="m-periodo">${opcionesPeriodos(p.periodoId, '(automático según fecha)')}</select></div>
    </div>
    <div class="campo"><label><input type="checkbox" id="m-limpiar" checked> Quitar las observaciones/reflexión de la copia</label></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="reutilizar('${id}')">Crear copia</button></div>`);
}
function reutilizar(id) {
  const o = porId(S.planeaciones, id);
  const c = structuredClone(o);
  const nuevaFecha = document.getElementById('m-fecha').value || o.fechaInicio || hoyISO();
  const desfase = o.fechaInicio ? difDias(o.fechaInicio, nuevaFecha) : 0;
  c.id = uid();
  c.grupoId = document.getElementById('m-grupo').value;
  c.areaId = document.getElementById('m-area').value;
  c.fechaInicio = nuevaFecha;
  c.fechaFin = o.fechaFin ? sumarDias(o.fechaFin, desfase) : nuevaFecha;
  c.sesiones = c.sesiones.map((s) => ({ ...s, id: uid(), fecha: s.fecha ? sumarDias(s.fecha, desfase) : '' }));
  c.periodoId = document.getElementById('m-periodo').value || periodoDeFecha(nuevaFecha)?.id || '';
  c.estado = 'borrador';
  c.enBanco = false;
  c.origenId = o.id;
  if (document.getElementById('m-limpiar').checked) c.observaciones = '';
  c.creada = c.modificada = new Date().toISOString();
  S.planeaciones.push(c);
  guardar(); cerrarModal();
  aviso('Copia creada', 'ok');
  editarPlaneacion(c.id);
}

// ---------- Banco ----------
RENDERS.banco = () => {
  const f = ui.filtroBanco || (ui.filtroBanco = { areaId: '', grado: '', texto: '', todas: false });
  const q = normalizar(f.texto);
  const lista = S.planeaciones.filter((p) => {
    const g = porId(S.grupos, p.grupoId);
    return (f.todas || p.enBanco) && (!f.areaId || p.areaId === f.areaId) && (!f.grado || String(g ? g.grado : p.gradoOrigen) === f.grado) &&
      (!q || normalizar([p.titulo, p.competencias, p.dba, p.estandares].join(' ')).includes(q));
  }).sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'es'));
  return `
  <div class="cabecera"><div><h1>Banco de planeaciones</h1><p class="sub">Tus planeaciones guardadas para reutilizar en otros grupos o en el siguiente año lectivo.</p></div></div>
  <div class="filtros tarjeta">
    <div style="flex:1;min-width:200px"><label>Buscar</label><input value="${esc(f.texto)}" onchange="ui.filtroBanco.texto=this.value;render()" placeholder="Tema, DBA, competencia… (Enter)"></div>
    <div><label>Área</label><select onchange="ui.filtroBanco.areaId=this.value;render()">${opcionesAreas(f.areaId, 'Todas')}</select></div>
    <div><label>Grado</label><select onchange="ui.filtroBanco.grado=this.value;render()"><option value="">Todos</option>${[6, 7, 8, 9, 10, 11].map((n) => `<option value="${n}" ${f.grado === String(n) ? 'selected' : ''}>${n}°</option>`).join('')}</select></div>
    <div><label><input type="checkbox" ${f.todas ? 'checked' : ''} onchange="ui.filtroBanco.todas=this.checked;render()"> Incluir todas mis planeaciones</label></div>
  </div>
  ${lista.length ? `<div class="banco">${lista.map((p) => `
    <div class="tarjeta">
      <div><span class="chip ${p.tipo}">${TIPOS_PLAN[p.tipo]}</span> ${p.enBanco ? '' : '<span class="chip">No está en el banco</span>'}</div>
      <div class="tit">${esc(p.titulo || 'Sin título')}</div>
      <div class="ayuda">${esc(nombreArea(p.areaId))} · ${p.grupoId ? esc(nombreGrupoId(p.grupoId)) : (p.gradoOrigen ? p.gradoOrigen + '°' : 'Sin grupo')} · ${(p.sesiones || []).length} sesión(es)</div>
      <div class="ayuda">${esc((p.competencias || p.dba || '').slice(0, 140))}</div>
      <div class="pie">
        <button class="btn pequeno primario" onclick="dialogoReutilizar('${p.id}')">📑 Usar en otro grupo</button>
        <button class="btn pequeno" onclick="editarPlaneacion('${p.id}')">Ver</button>
        <button class="btn pequeno" onclick="exportarPlanWord('${p.id}')">📄 Word</button>
        ${p.enBanco ? `<button class="btn pequeno" onclick="cambiarPlan('${p.id}','enBanco',false);render()">Quitar del banco</button>` : `<button class="btn pequeno" onclick="cambiarPlan('${p.id}','enBanco',true);render()">Agregar al banco</button>`}
      </div>
    </div>`).join('')}</div>` : `<div class="tarjeta vacio"><div class="grande">🗂️</div>El banco está vacío. En el editor de una planeación marca <b>"Guardar en el banco"</b>.</div>`}`;
};

// ---------- IA ----------
function dialogoIA(id) {
  const p = porId(S.planeaciones, id);
  if (sinIA()) return;
  const sesionesVacias = p.sesiones.every((s) => MOMENTOS.every((m) => !s[m.k]));
  abrirModal(`<h2>✨ Generar borrador con IA</h2><p class="ayuda" style="margin-top:-6px">Proveedor: ${esc(nombreIA())}</p>
    <p class="ayuda">La IA usará el tema, área, grado y lo que ya hayas escrito. Revisa y ajusta siempre las sugerencias: tú eres quien conoce a tus estudiantes.</p>
    ${!p.titulo ? '<p class="alerta">Escribe primero el <b>tema / título</b> para obtener mejores sugerencias.</p>' : ''}
    <div class="campo"><label>Campos a generar</label>
      ${CAMPOS_TEXTO.map((c) => `<label style="font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" class="m-ia" value="${c.k}" ${!p[c.k] ? 'checked' : ''}> ${c.t}${p[c.k] ? ' <span class="ayuda">(ya tiene contenido)</span>' : ''}</label>`).join('')}
      <label style="font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" id="m-ia-crit" ${!(p.criterios || []).length ? 'checked' : ''}> Criterios de evaluación por niveles (Superior, Alto, Básico, Bajo)</label>
      <label style="font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" id="m-ia-ses" ${sesionesVacias ? 'checked' : ''}> Momentos de las ${p.sesiones.length} sesión(es)</label>
    </div>
    <div class="campo"><label>Indicaciones adicionales (opcional)</label><textarea id="m-ia-extra" placeholder="Ej.: grupo numeroso, sin sala de sistemas, enfocar en trabajo cooperativo, contexto rural…"></textarea></div>
    <div class="campo"><label><input type="checkbox" id="m-ia-reemplazar"> Reemplazar el contenido existente (si no, solo se llenan campos vacíos)</label></div>
    <div id="m-ia-error"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn ia" id="m-ia-btn" onclick="ejecutarIA('${id}')">✨ Generar</button></div>`);
}

async function ejecutarIA(id) {
  const p = porId(S.planeaciones, id);
  const campos = [...document.querySelectorAll('.m-ia:checked')].map((c) => c.value);
  const conSesiones = document.getElementById('m-ia-ses').checked;
  if (document.getElementById('m-ia-crit').checked) campos.push('criterios');
  const reemplazar = document.getElementById('m-ia-reemplazar').checked;
  if (!campos.length && !conSesiones) return aviso('Selecciona al menos un campo', 'error');
  const g = porId(S.grupos, p.grupoId);
  const piar = p.grupoId ? alumnosDe(p.grupoId).filter((a) => a.piar).map((a) => a.observaciones).filter(Boolean) : [];
  const contexto = [
    `Área: ${p.areaId ? nombreArea(p.areaId) : 'no indicada'}`,
    `Grado: ${g ? g.grado + '°' : (p.gradoOrigen ? p.gradoOrigen + '°' : 'no indicado')} (básica secundaria, Colombia)`,
    `Tipo de planeación: ${TIPOS_PLAN[p.tipo]} con ${p.sesiones.length} sesión(es) de ${p.sesiones[0]?.duracion || 55} minutos`,
    `Tema: ${p.titulo || 'no indicado'}`,
    p.sesiones.some((s) => s.titulo) ? `Títulos de sesiones: ${p.sesiones.map((s, i) => `${i + 1}) ${s.titulo || '-'}`).join('; ')}` : '',
    ...CAMPOS_TEXTO.filter((c) => p[c.k] && !campos.includes(c.k)).map((c) => `${c.t} (ya definido): ${p[c.k]}`),
    ...CAMPOS_DIVERSIDAD.filter((c) => p[c.k]).map((c) => `Diversidad del aula – ${c.t}: ${p[c.k]}`),
    piar.length ? `Necesidades registradas en PIAR del grupo: ${piar.join('; ')}` : '',
    document.getElementById('m-ia-extra').value.trim() ? `Indicaciones del docente: ${document.getElementById('m-ia-extra').value.trim()}` : '',
  ].filter(Boolean).join('\n');

  const btn = document.getElementById('m-ia-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="cargando"></span> Generando… (puede tardar un minuto)';
  const r = await api.sugerirIA({ ia: S.config.ia, contexto, campos, numSesiones: conSesiones ? p.sesiones.length : 0 });
  if (!document.getElementById('m-ia-btn')) return; // el modal se cerró
  if (!r.ok) {
    btn.disabled = false; btn.textContent = '✨ Reintentar';
    document.getElementById('m-ia-error').innerHTML = `<div class="alerta error">${esc(r.error)}</div>`;
    return;
  }
  const d = r.datos;
  let n = 0;
  if (campos.includes('criterios') && Array.isArray(d.criterios) && (reemplazar || !(p.criterios || []).length)) {
    p.criterios = d.criterios.filter((c) => c && c.criterio).map((c) => ({ criterio: String(c.criterio), superior: String(c.superior || ''), alto: String(c.alto || ''), basico: String(c.basico || ''), bajo: String(c.bajo || '') }));
    n++;
  }
  for (const k of campos) {
    if (typeof d[k] === 'string' && d[k].trim() && (reemplazar || !p[k])) { p[k] = d[k].trim(); n++; }
  }
  if (conSesiones && Array.isArray(d.sesiones)) {
    d.sesiones.forEach((sd, i) => {
      const s = p.sesiones[i];
      if (!s || !sd) return;
      if (sd.titulo && (reemplazar || !s.titulo)) s.titulo = String(sd.titulo);
      for (const m of MOMENTOS) {
        if (sd[m.k] && (reemplazar || !s[m.k])) { s[m.k] = String(sd[m.k]).trim(); n++; }
        if (sd[m.k + 'Med'] && (reemplazar || !s[m.k + 'Med'])) s[m.k + 'Med'] = String(sd[m.k + 'Med']).trim();
      }
    });
  }
  tocarPlan(p); cerrarModal(); render();
  aviso(`La IA completó ${n} campo(s). Revísalos y ajústalos a tu grupo.`, 'ok');
}
