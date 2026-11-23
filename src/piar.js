// ================= PIAR – Plan Individual de Ajustes Razonables (Decreto 1421 de 2017) =================

const SECCIONES_PIAR = [
  { id: 'general', t: '1. Información general del estudiante', campos: [
    { k: 'fechaNacimiento', t: 'Fecha de nacimiento', tipo: 'date' }, { k: 'lugarNacimiento', t: 'Lugar de nacimiento' },
    { k: 'direccion', t: 'Dirección' }, { k: 'telefono', t: 'Teléfono' },
    { k: 'acudiente', t: 'Nombre del acudiente' }, { k: 'parentesco', t: 'Parentesco' },
    { k: 'grupoEtnico', t: 'Grupo étnico (si aplica)' }, { k: 'victima', t: '¿Víctima del conflicto armado? ¿Tiene registro?' },
    { k: 'eps', t: 'EPS / régimen de salud' }, { k: 'centroProteccion', t: '¿Está en centro de protección? ¿Cuál?' },
  ] },
  { id: 'salud', t: '2. Información de salud', campos: [
    { k: 'diagnostico', t: '¿Tiene diagnóstico médico? ¿Cuál?', area: true },
    { k: 'terapias', t: '¿Asiste a terapias o recibe atención de especialistas? ¿Cuáles y con qué frecuencia?', area: true },
    { k: 'medicamentos', t: '¿Consume medicamentos? ¿Cuáles y en qué horario?', area: true },
    { k: 'apoyosTecnicos', t: 'Productos de apoyo que requiere (gafas, audífonos, silla de ruedas, bastón, etc.)', area: true },
  ] },
  { id: 'hogar', t: '3. Entorno hogar', campos: [
    { k: 'madre', t: 'Nombre y ocupación de la madre' }, { k: 'padre', t: 'Nombre y ocupación del padre' },
    { k: 'cuidador', t: 'Cuidador(a) principal' }, { k: 'conQuienVive', t: 'Personas con las que vive' },
    { k: 'apoyoCrianza', t: 'Apoyos con los que cuenta la familia para la crianza', area: true },
  ] },
  { id: 'educativo', t: '4. Entorno educativo', campos: [
    { k: 'trayectoria', t: 'Trayectoria escolar (instituciones, grados repetidos, ¿por qué?)', area: true },
    { k: 'informesPrevios', t: '¿Se recibió informe pedagógico o PIAR anterior? ¿Qué dice?', area: true },
    { k: 'programasComplementarios', t: 'Programas complementarios o de apoyo en los que participa', area: true },
  ] },
  { id: 'valoracion', t: '5. Valoración pedagógica', campos: [
    { k: 'descripcion', t: 'Descripción general del estudiante (gustos, intereses, lo que le desagrada, expectativas del estudiante y la familia)', area: true },
    { k: 'sabeHacer', t: '¿Qué sabe y puede hacer? (fortalezas)', area: true },
    { k: 'fortalecer', t: '¿Qué necesita fortalecer?', area: true },
    { k: 'barrerasGenerales', t: 'Barreras para el aprendizaje y la participación identificadas', area: true },
    { k: 'apoyosGenerales', t: 'Ajustes y apoyos generales (comunicación, movilidad, tiempos, materiales, evaluación)', area: true, banco: true },
  ] },
];

function piarDe(alumnoId) { return S.piar.find((x) => x.alumnoId === alumnoId); }
function obtenerPiar(alumnoId) {
  let p = piarDe(alumnoId);
  if (!p) {
    const al = porId(S.alumnos, alumnoId);
    p = { id: uid(), alumnoId, fechaElaboracion: hoyISO(), anio: S.config.anio, ajustes: [], seguimiento: [], recomendaciones: '', compromisosFamilia: '', compromisosInstitucion: '' };
    SECCIONES_PIAR.forEach((s) => s.campos.forEach((c) => { p[c.k] = ''; }));
    if (al?.observaciones) p.diagnostico = al.observaciones;
    // Un ajuste por cada área que el docente dicta en el grupo
    areasDeGrupo(al?.grupoId).forEach((a) => p.ajustes.push(nuevoAjustePiar(a.id)));
    S.piar.push(p);
  }
  return p;
}
function nuevoAjustePiar(areaId = '') { return { id: uid(), areaId, objetivos: '', barreras: '', ajustes: '', evaluacion: {} }; }

// ---------- Listado ----------
RENDERS.piar = () => {
  const conPiar = S.alumnos.filter((a) => a.piar && a.activo !== false).sort((a, b) => nombreAlumno(a).localeCompare(nombreAlumno(b), 'es'));
  return `
  <div class="cabecera"><div><h1>Inclusión – PIAR</h1>
    <p class="sub">Plan Individual de Ajustes Razonables (Decreto 1421 de 2017). Marca a los estudiantes con PIAR en <a href="#" onclick="ir('grupos');return false">Grupos y alumnos</a>.</p></div></div>
  ${conPiar.length ? `<table class="tabla"><thead><tr><th>Estudiante</th><th>Grupo</th><th>Diagnóstico / observaciones</th><th>Elaboración</th><th class="num">Áreas con ajustes</th><th class="num">Seguimientos</th><th></th></tr></thead><tbody>
    ${conPiar.map((a) => { const p = piarDe(a.id); return `<tr>
      <td><b>${esc(nombreAlumno(a))}</b></td><td>${esc(nombreGrupoId(a.grupoId))}</td>
      <td class="ayuda">${esc((p?.diagnostico || a.observaciones || '').slice(0, 90))}</td>
      <td>${p ? esc(fechaCorta(p.fechaElaboracion)) : '<span class="chip borrador">Sin elaborar</span>'}</td>
      <td class="num">${p ? p.ajustes.filter((x) => x.ajustes).length : '—'}</td>
      <td class="num">${p ? p.seguimiento.length : '—'}</td>
      <td style="white-space:nowrap"><button class="btn pequeno ${p ? '' : 'primario'}" onclick="ir('piarEditor',{alumnoId:'${a.id}'})">${p ? '✏️ Abrir' : '＋ Elaborar PIAR'}</button>
        ${p ? `<button class="btn pequeno" onclick="exportarPiar('${a.id}')">📄 Word</button>` : ''}</td></tr>`; }).join('')}
  </tbody></table>` : `<div class="tarjeta vacio"><div class="grande">🤝</div>No hay estudiantes marcados con PIAR. En <b>Grupos y alumnos → Alumnos</b> marca la casilla PIAR del estudiante.</div>`}`;
};

// ---------- Editor ----------
function campoPiar(p, c) {
  const v = esc(p[c.k] || '');
  const on = `oninput="porId(S.piar,'${p.id}')['${c.k}']=this.value;guardar()"`;
  if (c.tipo === 'date') return `<div class="campo"><label>${esc(c.t)}</label><input type="date" value="${v}" onchange="porId(S.piar,'${p.id}')['${c.k}']=this.value;guardar()"></div>`;
  if (c.area) return `<div class="campo"><label>${esc(c.t)}${c.banco ? botonBanco('pi-' + c.k) : ''}</label><textarea id="pi-${c.k}" ${on}>${v}</textarea></div>`;
  return `<div class="campo"><label>${esc(c.t)}</label><input value="${v}" ${on}></div>`;
}
RENDERS.piarEditor = ({ alumnoId }) => {
  const al = porId(S.alumnos, alumnoId);
  if (!al) return '<p>Estudiante no encontrado.</p>';
  const p = obtenerPiar(alumnoId);
  guardar();
  const g = porId(S.grupos, al.grupoId);
  const pers = S.config.periodos;
  return `
  <div class="cabecera"><div><h1>PIAR – ${esc(nombreAlumno(al))}</h1>
    <p class="sub">${esc(nombreGrupoId(al.grupoId))}${al.documento ? ' · Doc. ' + esc(al.documento) : ''} · Se guarda automáticamente</p></div>
    <div class="acciones"><button class="btn" onclick="ir('piar')">← Volver</button><button class="btn primario" onclick="exportarPiar('${alumnoId}')">📄 Exportar a Word</button></div></div>
  <div class="tarjeta"><div class="rejilla r4">
    <div class="campo"><label>Fecha de elaboración</label><input type="date" value="${esc(p.fechaElaboracion)}" onchange="porId(S.piar,'${p.id}').fechaElaboracion=this.value;guardar()"></div>
    <div class="campo"><label>Año lectivo</label><input value="${esc(p.anio)}" onchange="porId(S.piar,'${p.id}').anio=this.value;guardar()"></div>
    <div class="campo" style="grid-column: span 2"><label>Responsables de la elaboración</label><input value="${esc(p.responsables || '')}" placeholder="Docentes, docente de apoyo, orientador(a)…" oninput="porId(S.piar,'${p.id}').responsables=this.value;guardar()"></div>
  </div></div>
  ${SECCIONES_PIAR.map((s) => `<div class="tarjeta"><h2>${s.t}</h2><div class="rejilla ${s.campos.some((c) => c.area) ? 'r2' : 'r4'}">${s.campos.map((c) => campoPiar(p, c)).join('')}</div></div>`).join('')}
  <div class="tarjeta"><div class="cabecera"><h2 style="margin:0">6. Ajustes razonables por área</h2>
    <button class="btn pequeno primario" onclick="porId(S.piar,'${p.id}').ajustes.push(nuevoAjustePiar());guardar();render()">＋ Área</button></div>
    <p class="ayuda">Para cada área: objetivos o propósitos del año, barreras evidenciadas, ajustes razonables (curriculares, didácticos, evaluativos y metodológicos) y su evaluación por periodo.</p>
    ${p.ajustes.map((a, i) => `<div class="sesion-caja">
      <div class="cab"><select style="width:auto;font-weight:600" onchange="porId(S.piar,'${p.id}').ajustes[${i}].areaId=this.value;guardar()">${opcionesAreas(a.areaId, 'Selecciona el área…')}</select>
        <button class="icono" title="Quitar" onclick="porId(S.piar,'${p.id}').ajustes.splice(${i},1);guardar();render()">🗑️</button></div>
      <div class="rejilla r3">
        <div class="campo"><label>Objetivos / propósitos (para el año)${g ? botonReferentes(`pa-${a.id}-objetivos`, a.areaId, g.grado, 'dba') : ''}</label><textarea id="pa-${a.id}-objetivos" oninput="porId(S.piar,'${p.id}').ajustes[${i}].objetivos=this.value;guardar()">${esc(a.objetivos)}</textarea></div>
        <div class="campo"><label>Barreras evidenciadas</label><textarea oninput="porId(S.piar,'${p.id}').ajustes[${i}].barreras=this.value;guardar()">${esc(a.barreras)}</textarea></div>
        <div class="campo"><label>Ajustes razonables${botonBanco(`pa-${a.id}-ajustes`)}</label><textarea id="pa-${a.id}-ajustes" oninput="porId(S.piar,'${p.id}').ajustes[${i}].ajustes=this.value;guardar()">${esc(a.ajustes)}</textarea></div>
      </div>
      <label>Evaluación de los ajustes por periodo</label>
      <div class="rejilla" style="grid-template-columns: repeat(${Math.max(1, pers.length)}, 1fr)">${pers.map((per) => `<div class="campo"><label style="font-weight:normal">${esc(per.nombre)}</label><textarea style="min-height:50px" oninput="porId(S.piar,'${p.id}').ajustes[${i}].evaluacion['${per.id}']=this.value;guardar()">${esc(a.evaluacion?.[per.id] || '')}</textarea></div>`).join('')}</div>
    </div>`).join('') || '<p class="ayuda">Agrega las áreas.</p>'}
  </div>
  <div class="tarjeta"><h2>7. Recomendaciones y acta de acuerdo</h2><div class="rejilla r3">
    ${[['recomendaciones', 'Recomendaciones (para la familia, docentes y el plan de mejoramiento institucional)'], ['compromisosFamilia', 'Compromisos de la familia'], ['compromisosInstitucion', 'Compromisos de la institución']]
      .map(([k, t]) => `<div class="campo"><label>${t}</label><textarea style="min-height:90px" oninput="porId(S.piar,'${p.id}')['${k}']=this.value;guardar()">${esc(p[k] || '')}</textarea></div>`).join('')}
  </div></div>
  <div class="tarjeta"><div class="cabecera"><h2 style="margin:0">8. Seguimiento</h2>
    <button class="btn pequeno primario" onclick="porId(S.piar,'${p.id}').seguimiento.push({id:uid(),fecha:hoyISO(),texto:'',responsable:S.config.docente||''});guardar();render()">＋ Registro</button></div>
    ${p.seguimiento.length ? `<table class="tabla"><thead><tr><th style="width:150px">Fecha</th><th>Avances, dificultades y acciones</th><th style="width:200px">Responsable</th><th></th></tr></thead><tbody>
      ${p.seguimiento.map((r, i) => `<tr><td><input type="date" value="${esc(r.fecha)}" onchange="porId(S.piar,'${p.id}').seguimiento[${i}].fecha=this.value;guardar()"></td>
        <td><textarea style="min-height:48px" oninput="porId(S.piar,'${p.id}').seguimiento[${i}].texto=this.value;guardar()">${esc(r.texto)}</textarea></td>
        <td><input value="${esc(r.responsable)}" oninput="porId(S.piar,'${p.id}').seguimiento[${i}].responsable=this.value;guardar()"></td>
        <td><button class="icono" onclick="porId(S.piar,'${p.id}').seguimiento.splice(${i},1);guardar();render()">🗑️</button></td></tr>`).join('')}</tbody></table>` : '<p class="ayuda">Sin registros de seguimiento.</p>'}
  </div>`;
};

async function exportarPiar(alumnoId) {
  const al = porId(S.alumnos, alumnoId);
  const p = obtenerPiar(alumnoId);
  const datos = {
    ...p, estudiante: nombreAlumno(al), documento: al.documento || '', grupoNombre: nombreGrupoId(al.grupoId),
    edad: p.fechaNacimiento ? String(Math.floor((deISO(hoyISO()) - deISO(p.fechaNacimiento)) / 31557600000)) : '',
    fechaTexto: fechaCorta(p.fechaElaboracion), nacimientoTexto: p.fechaNacimiento ? fechaCorta(p.fechaNacimiento) : '',
    secciones: SECCIONES_PIAR.map((s) => ({ t: s.t, campos: s.campos.filter((c) => c.tipo !== 'date').map((c) => [c.t, p[c.k] || '']) })),
    ajustesTexto: p.ajustes.map((a) => ({ area: nombreArea(a.areaId), objetivos: a.objetivos, barreras: a.barreras, ajustes: a.ajustes,
      evaluacion: S.config.periodos.map((per) => a.evaluacion?.[per.id] ? `${per.nombre}: ${a.evaluacion[per.id]}` : '').filter(Boolean).join('\n') })),
    seguimientoTexto: p.seguimiento.map((r) => [fechaCorta(r.fecha), r.texto, r.responsable]),
  };
  const r = await api.exportarWordCurricular('piar', `PIAR ${nombreAlumno(al)} ${S.config.anio}`, { config: S.config, datos });
  if (r.ok) aviso('Documento de Word creado', 'ok'); else if (r.error) aviso('No se pudo exportar: ' + r.error, 'error');
}
