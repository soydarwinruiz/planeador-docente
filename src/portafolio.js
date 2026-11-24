// ================= Portafolio para la evaluación de desempeño docente =================
// Reúne las evidencias que ya están en el programa, organizadas por las competencias de la evaluación anual
// de desempeño (Decreto 1278 de 2002, Guía 31 del MEN): funcionales por área de gestión y comportamentales.
// Solo usa cifras y títulos: no incluye nombres de estudiantes.

const COMPETENCIAS_1278 = [
  { gestion: 'Gestión académica', items: [
    { k: 'dominio', t: 'Dominio curricular' },
    { k: 'planeacion', t: 'Planeación y organización académica' },
    { k: 'didactica', t: 'Pedagógica y didáctica' },
    { k: 'evaluacion', t: 'Evaluación del aprendizaje' },
  ] },
  { gestion: 'Gestión administrativa', items: [
    { k: 'recursos', t: 'Uso de recursos' },
    { k: 'seguimiento', t: 'Seguimiento de procesos' },
  ] },
  { gestion: 'Gestión comunitaria', items: [
    { k: 'comunicacion', t: 'Comunicación institucional' },
    { k: 'comunidad', t: 'Interacción con la comunidad y el entorno' },
  ] },
  { gestion: 'Competencias comportamentales', items: [
    { k: 'liderazgo', t: 'Liderazgo' },
    { k: 'relaciones', t: 'Comunicación y relaciones interpersonales' },
    { k: 'equipo', t: 'Trabajo en equipo' },
    { k: 'mediacion', t: 'Negociación y mediación' },
    { k: 'compromiso', t: 'Compromiso social e institucional' },
    { k: 'iniciativa', t: 'Iniciativa' },
    { k: 'logro', t: 'Orientación al logro' },
  ] },
];
const TODAS_COMPETENCIAS = COMPETENCIAS_1278.flatMap((g) => g.items.map((i) => ({ ...i, gestion: g.gestion })));

function portafolio() { return (S.portafolio ||= { evidencias: [], reflexiones: {} }); }
const lleno = (v) => String(v ?? '').trim() !== '';
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Evidencias que el programa encuentra solo, por competencia (texto con cifras)
function evidenciasAutomaticas(desde, hasta) {
  const enRango = (f) => !f || ((!desde || f >= desde) && (!hasta || f <= hasta));
  const E = Object.fromEntries(TODAS_COMPETENCIAS.map((c) => [c.k, []]));
  const add = (k, n, texto) => { if (n) E[k].push(texto); };
  const planes = S.planeaciones.filter((p) => (p.sesiones || []).some((s) => enRango(s.fecha)) || !(p.sesiones || []).some((s) => s.fecha));
  const sesiones = planes.flatMap((p) => (p.sesiones || []).filter((s) => enRango(s.fecha)));
  const areasNombres = (lista) => [...new Set(lista.map((x) => nombreArea(x.areaId)).filter((x) => x !== '(sin área)'))].join(', ');

  // Gestión académica
  add('dominio', S.planesArea.length, `${plural(S.planesArea.length, 'plan de área', 'planes de área')} elaborados (${areasNombres(S.planesArea)}).`);
  add('dominio', S.mallas.length, `${plural(S.mallas.length, 'malla curricular', 'mallas curriculares')} con ejes, estándares, DBA y desempeños.`);
  const conRef = planes.filter((p) => lleno(p.estandares) || lleno(p.dba)).length;
  add('dominio', conRef, `${conRef} de ${planes.length} planeaciones de clase articuladas con estándares básicos de competencias y DBA.`);
  add('planeacion', planes.length, `${plural(planes.length, 'planeación de clase', 'planeaciones de clase')} con ${plural(sesiones.length, 'sesión', 'sesiones')} (${planes.filter((p) => p.estado === 'terminada').length} terminadas).`);
  add('planeacion', S.planesPeriodo.length + S.planesAula.length, `${S.planesPeriodo.length} planes de periodo y ${S.planesAula.length} planes de aula.`);
  const semanasCrono = Object.values(S.cronograma || {}).reduce((s, x) => s + (x && typeof x === 'object' ? Object.keys(x).length : 0), 0);
  add('planeacion', semanasCrono, `Cronograma de temas por semana (${semanasCrono} registros).`);
  add('planeacion', S.plantillas.length, `${plural(S.plantillas.length, 'plantilla de planeación', 'plantillas de planeación')} por grado o grupo, con caracterización del aula.`);
  const momentos = sesiones.filter((s) => ['exploracion', 'estructuracion', 'practica', 'transferencia', 'valoracion'].filter((k) => lleno(s[k])).length >= 3).length;
  add('didactica', momentos, `${plural(momentos, 'sesión desarrollada', 'sesiones desarrolladas')} por momentos (exploración, estructuración, práctica, transferencia y valoración).`);
  const tableros = (S.pizarras || []).filter((t) => enRango(t.fecha)).length;
  add('didactica', tableros, `${plural(tableros, 'tablero didáctico', 'tableros didácticos')} para la clase.`);
  add('didactica', S.fichas.length, `${plural(S.fichas.length, 'ficha imprimible', 'fichas imprimibles')} (sopas de letras, crucigramas, guías…).`);
  const conPerfil = S.alumnos.filter((a) => a.perfil && Object.keys(a.perfil).length).length;
  add('didactica', conPerfil, `Caracterización de estilos de aprendizaje (VAK, Kolb, inteligencias múltiples) de ${conPerfil} estudiantes.`);
  add('didactica', S.piar.length, `${plural(S.piar.length, 'PIAR elaborado', 'PIAR elaborados')} con ajustes razonables (Decreto 1421 de 2017).`);
  const actividades = S.planillas.flatMap((pl) => pl.criterios.flatMap((c) => c.actividades));
  const notasReg = actividades.reduce((s, a) => s + Object.keys(S.notas[a.id] || {}).length, 0);
  add('evaluacion', S.planillas.length, `Programación evaluativa en ${plural(S.planillas.length, 'planilla', 'planillas')} con ${actividades.length} actividades y ${notasReg} valoraciones registradas.`);
  const conRubrica = actividades.filter((a) => a.rubricaId).length;
  add('evaluacion', S.rubricas.length, `${S.rubricas.length} instrumentos de evaluación (rúbricas, escalas y listas de cotejo)${conRubrica ? `, usados en ${conRubrica} actividades` : ''}.`);
  const pruebasAplicadas = S.pruebas.filter((p) => Object.keys(p.respuestas || {}).length).length;
  add('evaluacion', S.pruebas.length, `${plural(S.pruebas.length, 'prueba o taller', 'pruebas y talleres')} tipo Saber${pruebasAplicadas ? ` (${pruebasAplicadas} aplicadas y calificadas)` : ''}.`);
  const retro = Object.values(S.retro || {}).reduce((s, x) => s + Object.keys(x || {}).length, 0);
  add('evaluacion', retro, `${plural(retro, 'retroalimentación escrita', 'retroalimentaciones escritas')} a trabajos de los estudiantes.`);
  add('evaluacion', S.planesApoyo.length, `${plural(S.planesApoyo.length, 'plan de apoyo', 'planes de apoyo')} para estudiantes con desempeño bajo (Decreto 1290).`);
  const recup = Object.values(S.recuperaciones || {}).reduce((s, x) => s + Object.keys(x || {}).length, 0);
  add('evaluacion', recup, `${plural(recup, 'recuperación registrada', 'recuperaciones registradas')} según el SIEE.`);
  const aprob = resumenAprobacion();
  add('evaluacion', aprob.total, `Aprobación de las áreas a cargo: ${aprob.pct}% (${aprob.aprobados} de ${aprob.total} valoraciones de periodo).`);

  // Gestión administrativa
  add('recursos', tableros + S.fichas.length, 'Uso de recursos digitales y materiales propios: tableros, fichas, pruebas por QR desde el celular de los estudiantes y lectura óptica de hojas de respuesta.');
  const clasesAsis = Object.values(S.asistencia).reduce((s, x) => s + Object.keys(x).filter(enRango).length, 0);
  add('seguimiento', clasesAsis, `Registro de asistencia en ${clasesAsis} clases.`);
  const diario = S.diario.filter((d) => enRango(d.fecha)).length;
  add('seguimiento', diario, `${plural(diario, 'entrada', 'entradas')} del diario de campo (logros, pendientes y novedades de cada clase).`);
  const informes = Object.keys(S.informes || {}).length;
  add('seguimiento', informes, `${plural(informes, 'informe de cierre de periodo', 'informes de cierre de periodo')} para coordinación.`);
  const anot = (S.anotaciones || []).filter((x) => enRango(x.fecha)).length;
  add('seguimiento', anot, `${plural(anot, 'anotación', 'anotaciones')} de seguimiento a estudiantes.`);

  // Gestión comunitaria
  const com = (S.comunicadosEnviados || []).filter((x) => enRango(x.fecha)).length;
  add('comunicacion', com, `${plural(com, 'comunicado enviado', 'comunicados enviados')} a padres y acudientes.`);
  const obs = Object.values(S.observaciones || {}).reduce((s, x) => s + Object.values(x || {}).filter(lleno).length, 0);
  add('comunicacion', obs, `${obs} observaciones personalizadas para el boletín.`);
  add('comunidad', S.piar.length + S.planesApoyo.length, 'Trabajo con las familias en los PIAR y en los planes de apoyo (compromisos y firmas de acudientes).');
  const positivas = (S.anotaciones || []).filter((x) => x.tipo === 'positiva' && enRango(x.fecha)).length;
  add('relaciones', positivas, `${plural(positivas, 'reconocimiento positivo', 'reconocimientos positivos')} registrados a estudiantes.`);
  const conv = (S.anotaciones || []).filter((x) => x.tipo === 'convivencia' && enRango(x.fecha)).length;
  add('mediacion', conv, `${plural(conv, 'situación de convivencia acompañada', 'situaciones de convivencia acompañadas')} y registradas.`);
  return E;
}
function resumenAprobacion() {
  let total = 0, aprobados = 0;
  for (const pl of S.planillas) for (const al of alumnosDe(pl.grupoId)) {
    const f = notaFinal(pl, al.id);
    if (f == null) continue;
    total++; if (redondear(f) >= +S.config.notaAprobacion) aprobados++;
  }
  return { total, aprobados, pct: total ? Math.round((aprobados / total) * 100) : 0 };
}

RENDERS.portafolio = () => {
  const pf = portafolio();
  const r = (ui.pf ||= { desde: '', hasta: '' });
  const auto = evidenciasAutomaticas(r.desde, r.hasta);
  const totalAuto = Object.values(auto).reduce((s, x) => s + x.length, 0);
  return `<div class="cabecera"><div><h1>🎓 Portafolio docente</h1>
    <p class="sub">Evidencias para la evaluación anual de desempeño (Decreto 1278) y la evaluación con carácter diagnóstico formativa, organizadas por competencia. Se arman solas con tu trabajo en el programa; agrega las tuyas y tus reflexiones.</p></div>
    <div class="acciones"><button class="btn primario" onclick="exportarPortafolio()">⬇️ Exportar a Word</button></div></div>
  <div class="filtros tarjeta">
    <div><label>Desde</label><input type="date" value="${esc(r.desde)}" onchange="ui.pf.desde=this.value;render()"></div>
    <div><label>Hasta</label><input type="date" value="${esc(r.hasta)}" onchange="ui.pf.hasta=this.value;render()"></div>
    <div style="align-self:end" class="ayuda">${totalAuto} evidencias del programa · ${pf.evidencias.length} aportadas por ti. Sin fechas = todo el año lectivo ${esc(S.config.anio)}.</div>
  </div>
  ${COMPETENCIAS_1278.map((g) => `<h2 style="margin-top:18px">${esc(g.gestion)}</h2>
    ${g.items.map((c) => { const propias = pf.evidencias.filter((e) => e.competencia === c.k); return `<div class="tarjeta">
      <div class="cabecera" style="margin-bottom:6px"><h3 style="margin:0">${esc(c.t)}</h3><button class="btn pequeno" onclick="dialogoEvidencia('${c.k}')">＋ Evidencia</button></div>
      ${auto[c.k].length ? `<ul style="margin:4px 0 8px 18px">${auto[c.k].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${propias.length ? `<ul class="lista-simple">${propias.map((e) => `<li><div><b>${esc(e.titulo)}</b>${e.fecha ? ' · ' + esc(fechaCorta(e.fecha)) : ''}${e.descripcion ? `<br><span class="ayuda">${esc(e.descripcion)}</span>` : ''}${e.ubicacion ? `<br><span class="ayuda">📎 ${esc(e.ubicacion)}</span>` : ''}</div>
        <span class="fila"><button class="icono" title="Editar" onclick="dialogoEvidencia('${c.k}','${e.id}')">✏️</button><button class="icono" title="Eliminar" onclick="eliminarEvidencia('${e.id}')">🗑️</button></span></li>`).join('')}</ul>` : ''}
      ${!auto[c.k].length && !propias.length ? '<p class="ayuda">Aún sin evidencias.</p>' : ''}
      <textarea rows="2" placeholder="Reflexión: ¿qué hiciste, qué lograste y qué mejorarías en esta competencia?" onchange="portafolio().reflexiones['${c.k}']=this.value;guardar()">${esc(pf.reflexiones[c.k] || '')}</textarea>
    </div>`; }).join('')}`).join('')}`;
};

function dialogoEvidencia(competencia, id = '') {
  const e = id ? porId(portafolio().evidencias, id) : { titulo: '', fecha: hoyISO(), descripcion: '', ubicacion: '' };
  const c = TODAS_COMPETENCIAS.find((x) => x.k === competencia);
  abrirModal(`<h2>${id ? 'Editar' : 'Nueva'} evidencia · ${esc(c.t)}</h2>
    <div class="campo"><label>Título</label><input id="ev-titulo" value="${esc(e.titulo)}" placeholder="Ej.: Proyecto de lectura con 7.° A; Feria de la ciencia; Capacitación en DUA"></div>
    <div class="rejilla r2"><div class="campo"><label>Fecha</label><input type="date" id="ev-fecha" value="${esc(e.fecha)}"></div>
      <div class="campo"><label>Competencia</label><select id="ev-comp">${TODAS_COMPETENCIAS.map((x) => `<option value="${x.k}" ${x.k === competencia ? 'selected' : ''}>${esc(x.gestion)} · ${esc(x.t)}</option>`).join('')}</select></div></div>
    <div class="campo"><label>Descripción</label><textarea id="ev-desc" rows="3" placeholder="Qué se hizo, con quiénes y qué resultados tuvo">${esc(e.descripcion)}</textarea></div>
    <div class="campo"><label>Dónde está el soporte <span class="ayuda">(archivo, carpeta, enlace, acta…)</span></label><input id="ev-ubic" value="${esc(e.ubicacion)}" placeholder="Ej.: Drive > Evidencias 2026 > Feria; Acta 12 del consejo académico"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarEvidencia('${id}')">Guardar</button></div>`);
}
function guardarEvidencia(id) {
  const v = (k) => document.getElementById(k).value.trim();
  if (!v('ev-titulo')) return aviso('Escribe un título', 'error');
  const pf = portafolio();
  let e = id ? porId(pf.evidencias, id) : null;
  if (!e) { e = { id: uid() }; pf.evidencias.push(e); }
  Object.assign(e, { competencia: v('ev-comp'), titulo: v('ev-titulo'), fecha: v('ev-fecha'), descripcion: v('ev-desc'), ubicacion: v('ev-ubic') });
  guardar(); cerrarModal(); render();
}
async function eliminarEvidencia(id) {
  if (!(await confirmar('¿Eliminar esta evidencia?'))) return;
  portafolio().evidencias = portafolio().evidencias.filter((e) => e.id !== id); guardar(); render();
}

async function exportarPortafolio() {
  const pf = portafolio();
  const r = ui.pf || {};
  const auto = evidenciasAutomaticas(r.desde, r.hasta);
  const secciones = COMPETENCIAS_1278.map((g) => ({
    titulo: g.gestion,
    tabla: { columnas: [{ t: 'Competencia', ancho: 22 }, { t: 'Evidencias', ancho: 50 }, { t: 'Reflexión del docente', ancho: 28 }],
      filas: g.items.map((c) => [c.t,
        [...auto[c.k].map((t) => '• ' + t), ...pf.evidencias.filter((e) => e.competencia === c.k).map((e) => `• ${e.titulo}${e.fecha ? ' (' + fechaCorta(e.fecha) + ')' : ''}${e.descripcion ? ': ' + e.descripcion : ''}${e.ubicacion ? ' [Soporte: ' + e.ubicacion + ']' : ''}`)].join('\n') || '—',
        pf.reflexiones[c.k] || '']) },
  }));
  const planes = S.planeaciones.filter((p) => !p.enBanco || p.grupoId).sort((a, b) => String((a.sesiones || [])[0]?.fecha || '').localeCompare(String((b.sesiones || [])[0]?.fecha || '')));
  secciones.push({ titulo: 'Anexo: planeaciones de clase', tabla: { columnas: [{ t: 'Planeación', ancho: 40 }, { t: 'Grupo', ancho: 18 }, { t: 'Área', ancho: 22 }, { t: 'Sesiones', ancho: 20 }],
    filas: planes.map((p) => [p.titulo || 'Sin título', p.grupoId ? nombreGrupoId(p.grupoId) : '', nombreArea(p.areaId), `${(p.sesiones || []).length}${(p.sesiones || [])[0]?.fecha ? ' · desde ' + fechaCorta(p.sesiones[0].fecha) : ''}`]) }, vacio: 'Sin planeaciones.' });
  const rango = r.desde || r.hasta ? `${r.desde ? fechaCorta(r.desde) : 'inicio'} a ${r.hasta ? fechaCorta(r.hasta) : 'hoy'}` : `Año lectivo ${S.config.anio}`;
  const res = await api.exportarWordCurricular('informe', `Portafolio docente ${S.config.docente || ''} ${S.config.anio}`.trim(), {
    config: S.config, titulo: 'Portafolio de evidencias del desempeño docente', subtitulo: `${rango} · Decreto 1278 de 2002`, horizontal: true,
    ident: [['Docente', S.config.docente || ''], ['Institución', S.config.institucion || ''], ['Sede', S.config.sede || ''], ['Áreas', S.areas.map((a) => a.nombre).join(', ')], ['Grupos', [...S.grupos].sort(ordenGrupos).map(nombreGrupo).join(', ')], ['Fecha', fechaCorta(hoyISO())]],
    secciones, firmas: [[S.config.docente, 'Docente'], [S.config.coordinador || '', 'Evaluador(a)']],
  });
  if (res.ok) aviso('Portafolio exportado', 'ok'); else if (res.error) aviso(res.error, 'error');
}
