// Genera la planeación en formato Word (.docx)
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, ShadingType, BorderStyle, Header, Footer, PageNumber, PageOrientation,
} = require('docx');

const AZUL = '1F4E79';
const GRIS = 'D9E2F3';
const FUENTE = 'Arial';

const borde = { style: BorderStyle.SINGLE, size: 4, color: '8EA9DB' };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };

function parrafos(texto, opciones = {}) {
  const lineas = String(texto || '').split(/\r?\n/);
  return lineas.map((l) => new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: l, font: FUENTE, size: 20, ...opciones })],
  }));
}

function celda(contenido, { ancho, fondo, negrita, colorTexto, columnas } = {}) {
  const hijos = Array.isArray(contenido)
    ? contenido
    : parrafos(contenido, { bold: !!negrita, color: colorTexto });
  return new TableCell({
    children: hijos.length ? hijos : [new Paragraph('')],
    width: ancho ? { size: ancho, type: WidthType.PERCENTAGE } : undefined,
    shading: fondo ? { type: ShadingType.CLEAR, color: 'auto', fill: fondo } : undefined,
    columnSpan: columnas,
    borders: bordes,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function filaEtiqueta(etiqueta, valor, columnasValor = 1) {
  return new TableRow({
    children: [
      celda(etiqueta, { ancho: 22, fondo: GRIS, negrita: true }),
      celda(valor || '', { columnas: columnasValor }),
    ],
  });
}

function tabla(filas) {
  return new Table({ rows: filas, width: { size: 100, type: WidthType.PERCENTAGE } });
}

function titulo(texto) {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text: texto.toUpperCase(), bold: true, font: FUENTE, size: 22, color: AZUL })],
  });
}

function fechaLarga(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

async function generarDocxPlaneacion({ config, plan, grupoNombre, areaNombre, periodoNombre, tipoLabel, numEstudiantes, piar, rangos, momentos }) {
  const c = config || {};
  const contenido = [];
  const fila4 = (e1, v1, e2, v2) => new TableRow({ children: [
    celda(e1, { ancho: 17, fondo: GRIS, negrita: true }), celda(v1 || '', { ancho: 33 }),
    celda(e2, { ancho: 17, fondo: GRIS, negrita: true }), celda(v2 || '', { ancho: 33 }),
  ] });
  const bloque = (etiqueta, texto) => new TableRow({ children: [celda([
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: etiqueta, bold: true, font: FUENTE, size: 20 })] }),
    ...parrafos(texto || ''),
  ])] });

  // Encabezado institucional
  contenido.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (c.institucion || 'INSTITUCIÓN EDUCATIVA').toUpperCase(), bold: true, font: FUENTE, size: 28, color: AZUL })] }));
  if (c.sede || c.municipio) contenido.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: [c.sede, c.municipio].filter(Boolean).join(' – '), font: FUENTE, size: 20 })] }));
  contenido.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'ORIENTACIONES DIDÁCTICAS', bold: true, font: FUENTE, size: 24 })] }));
  contenido.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: `Planeación ${tipoLabel.toLowerCase()}${plan.titulo ? ' – ' + plan.titulo : ''}`, font: FUENTE, size: 20 })] }));

  // 1. Identificación
  const rango = plan.fechaInicio && plan.fechaFin && plan.fechaFin !== plan.fechaInicio
    ? `${fechaLarga(plan.fechaInicio)} al ${fechaLarga(plan.fechaFin)}` : fechaLarga(plan.fechaInicio);
  contenido.push(titulo('1. Identificación'));
  contenido.push(tabla([
    fila4('Área/Asignatura', areaNombre, 'Docente', c.docente),
    fila4('Duración', plan.duracion, 'Período', periodoNombre),
    fila4('Grado/Grupos', grupoNombre, 'Número de estudiantes', String(numEstudiantes ?? '')),
    fila4('Locativos', plan.locativos, 'Recursos', plan.recursos),
    fila4('Fecha(s)', rango, 'Año lectivo', String(c.anio || '')),
  ]));
  contenido.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
  contenido.push(tabla([
    new TableRow({ children: [celda('Diversidad del aula', { fondo: AZUL, negrita: true, colorTexto: 'FFFFFF' })] }),
    bloque('Estilos de aprendizaje:', plan.estilos),
    bloque('Los gustos:', plan.gustos),
    bloque('Características del grupo, dificultades y barreras para el aprendizaje y la participación:', plan.caracteristicas),
    bloque('Ajustes y apoyos:', [plan.ajustes, piar ? 'Estudiantes con PIAR: ' + piar : ''].filter(Boolean).join('\n')),
  ]));

  // 2. Fundamentación
  contenido.push(titulo('2. Fundamentación'));
  const des = [plan.desempenoSaber && 'Saber: ' + plan.desempenoSaber, plan.desempenoHacer && 'Hacer: ' + plan.desempenoHacer, plan.desempenoSer && 'Ser: ' + plan.desempenoSer].filter(Boolean).join('\n');
  contenido.push(tabla([
    filaEtiqueta('Componentes', plan.componentes),
    filaEtiqueta('Competencias', plan.competencias),
    ...(plan.estandares ? [filaEtiqueta('Estándares básicos de competencias', plan.estandares)] : []),
    ...(plan.dba ? [filaEtiqueta('Derechos Básicos de Aprendizaje (DBA)', plan.dba)] : []),
    filaEtiqueta('Evidencias de aprendizaje', plan.evidencias),
    ...(des ? [filaEtiqueta('Indicadores de desempeño', des)] : []),
    filaEtiqueta('Unidad', plan.unidad),
    filaEtiqueta('Objetivo de aprendizaje', plan.objetivo),
    filaEtiqueta('Situación / pregunta problematizadora', plan.pregunta),
    ...(plan.tme ? [filaEtiqueta('Métodos, técnicas y estrategias', plan.tme)] : []),
  ]));

  // 2.1 Evaluación
  contenido.push(titulo('2.1 Evaluación'));
  const niv = ['superior', 'alto', 'basico', 'bajo'];
  const crits = (plan.criterios || []).filter((x) => x.criterio);
  contenido.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ tableHeader: true, children: [celda('Criterios de evaluación', { fondo: AZUL, negrita: true, colorTexto: 'FFFFFF', ancho: 24 }),
      ...niv.map((k) => celda(rangos?.[k] || k, { fondo: AZUL, negrita: true, colorTexto: 'FFFFFF', ancho: 19 }))] }),
    ...(crits.length ? crits : [{}, {}, {}]).map((x) => new TableRow({ children: [celda(x.criterio || '', { negrita: true }), ...niv.map((k) => celda(x[k] || ''))] })),
  ] }));
  if (plan.evaluacion) {
    contenido.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
    contenido.push(tabla([filaEtiqueta('Técnicas e instrumentos de evaluación', plan.evaluacion)]));
  }

  // 3. Acciones metodológicas
  contenido.push(titulo('3. Acciones metodológicas'));
  const sesiones = plan.sesiones || [];
  const ms = momentos || [];
  sesiones.forEach((s, i) => {
    const encabezado = [sesiones.length > 1 ? `Sesión ${i + 1}` : 'Sesión', s.titulo, s.fecha ? fechaLarga(s.fecha) : '', s.duracion ? `${s.duracion} min` : ''].filter(Boolean).join(' · ');
    contenido.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: [celda(encabezado, { columnas: 3, fondo: AZUL, negrita: true, colorTexto: 'FFFFFF' })] }),
      new TableRow({ tableHeader: true, children: [celda('Momento', { fondo: GRIS, negrita: true, ancho: 17 }), celda('Acciones', { fondo: GRIS, negrita: true, ancho: 53 }), celda('Mediaciones (recursos o materiales didácticos)', { fondo: GRIS, negrita: true, ancho: 30 })] }),
      ...ms.map((m) => new TableRow({ children: [celda(m.t, { negrita: true }), celda(s[m.k] || ''), celda(s[m.k + 'Med'] || '')] })),
    ] }));
    contenido.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  });

  contenido.push(tabla([
    filaEtiqueta('Bibliografía y/o cibergrafía', plan.bibliografia),
    filaEtiqueta('Observaciones y reflexiones', plan.observaciones),
  ]));

  // Firmas
  contenido.push(new Paragraph({ spacing: { before: 700 }, children: [] }));
  const sinBorde = { style: BorderStyle.NONE };
  contenido.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde, insideHorizontal: sinBorde, insideVertical: sinBorde },
    rows: [new TableRow({ children: [c.docente || 'Docente', c.coordinador || 'Coordinación académica'].map((nombre, i) => new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '______________________________', font: FUENTE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: nombre, font: FUENTE, size: 20, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: i === 0 ? 'Docente' : 'Revisó', font: FUENTE, size: 18 })] }),
      ],
    })) })],
  }));

  const doc = new Document({
    creator: c.docente || 'Planeador Docente',
    title: plan.titulo || 'Planeación',
    styles: { default: { document: { run: { font: FUENTE, size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 900, bottom: 900, left: 900, right: 900 }, size: { orientation: PageOrientation.PORTRAIT } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${areaNombre || ''} · ${grupoNombre || ''}`, font: FUENTE, size: 16, color: '808080' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Página ', font: FUENTE, size: 16, color: '808080' }),
        new TextRun({ children: [PageNumber.CURRENT], font: FUENTE, size: 16, color: '808080' }),
        new TextRun({ text: ' de ', font: FUENTE, size: 16, color: '808080' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FUENTE, size: 16, color: '808080' }),
      ] })] }) },
      children: contenido,
    }],
  });
  return Packer.toBuffer(doc);
}

// ================= Documentos curriculares =================
function encabezado(c, tituloDoc, subtitulo) {
  const r = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (c.institucion || 'INSTITUCIÓN EDUCATIVA').toUpperCase(), bold: true, font: FUENTE, size: 28, color: AZUL })] }),
  ];
  if (c.sede || c.municipio) r.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: [c.sede, c.municipio].filter(Boolean).join(' – '), font: FUENTE, size: 20 })] }));
  r.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: subtitulo ? 40 : 200 }, children: [new TextRun({ text: tituloDoc.toUpperCase(), bold: true, font: FUENTE, size: 24 })] }));
  if (subtitulo) r.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: subtitulo, font: FUENTE, size: 20 })] }));
  return r;
}

function celdaPeq(texto, { fondo, negrita, colorTexto, ancho, columnas, filas } = {}) {
  const ps = String(texto ?? '').split(/\r?\n/).map((l) => new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: l, font: FUENTE, size: 16, bold: !!negrita, color: colorTexto })] }));
  return new TableCell({
    children: ps.length ? ps : [new Paragraph('')],
    width: ancho ? { size: ancho, type: WidthType.PERCENTAGE } : undefined,
    shading: fondo ? { type: ShadingType.CLEAR, color: 'auto', fill: fondo } : undefined,
    columnSpan: columnas, rowSpan: filas, borders: bordes,
    margins: { top: 40, bottom: 40, left: 70, right: 70 },
  });
}

function tablaDatos(columnas, filas) {
  // columnas: [{t, k, ancho}] ; filas: array de objetos o de arreglos de celdas ya construidas
  const cab = new TableRow({ tableHeader: true, children: columnas.map((c) => celdaPeq(c.t, { fondo: AZUL, negrita: true, colorTexto: 'FFFFFF', ancho: c.ancho })) });
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [cab, ...filas] });
}

function piePagina() {
  return { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: 'Página ', font: FUENTE, size: 16, color: '808080' }),
    new TextRun({ children: [PageNumber.CURRENT], font: FUENTE, size: 16, color: '808080' }),
    new TextRun({ text: ' de ', font: FUENTE, size: 16, color: '808080' }),
    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FUENTE, size: 16, color: '808080' }),
  ] })] }) };
}

const HORIZONTAL = { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 800, bottom: 800, left: 800, right: 800 } } };
const VERTICAL = { page: { size: { orientation: PageOrientation.PORTRAIT }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } };

function documento(c, titulo, secciones) {
  return Packer.toBuffer(new Document({
    creator: c.docente || 'Planeador Docente', title: titulo,
    styles: { default: { document: { run: { font: FUENTE, size: 20 } } } },
    sections: secciones.map((s) => ({ ...s, footers: piePagina() })),
  }));
}

function datosIdent(pares) {
  // pares: [[etiqueta, valor], ...] en filas de 2 pares
  const filas = [];
  for (let i = 0; i < pares.length; i += 2) {
    const fila = [];
    for (const [e, v] of pares.slice(i, i + 2)) fila.push(celdaPeq(e, { fondo: GRIS, negrita: true, ancho: 15 }), celdaPeq(v, { ancho: 35 }));
    if (fila.length === 2) fila.push(celdaPeq('', { columnas: 2 }));
    filas.push(new TableRow({ children: fila }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: filas });
}

const COLS_MALLA = [
  { t: 'Eje temático / unidad', k: 'eje', ancho: 10 }, { t: 'Contenidos', k: 'contenidos', ancho: 13 },
  { t: 'Estándares', k: 'estandares', ancho: 13 }, { t: 'DBA', k: 'dba', ancho: 12 }, { t: 'Competencias', k: 'competencias', ancho: 10 },
  { t: 'Desempeños (saber · hacer · ser)', k: 'desempenos', ancho: 20 }, { t: 'Evidencias', k: 'evidencias', ancho: 11 }, { t: 'Horas', k: 'horas', ancho: 5 },
];

function filasMalla(malla) {
  const filas = [];
  for (const per of malla.periodos) {
    filas.push(new TableRow({ children: [celdaPeq(`${per.nombre}${per.pregunta ? ' — Pregunta problematizadora: ' + per.pregunta : ''}`, { columnas: COLS_MALLA.length, fondo: GRIS, negrita: true })] }));
    if (!per.items.length) filas.push(new TableRow({ children: [celdaPeq('(sin contenidos registrados)', { columnas: COLS_MALLA.length })] }));
    for (const it of per.items) {
      const des = [it.desempenoSaber && 'SABER: ' + it.desempenoSaber, it.desempenoHacer && 'HACER: ' + it.desempenoHacer, it.desempenoSer && 'SER: ' + it.desempenoSer].filter(Boolean).join('\n');
      filas.push(new TableRow({ children: COLS_MALLA.map((col) => celdaPeq(col.k === 'desempenos' ? des : col.k === 'eje' ? it.eje : it[col.k], { negrita: col.k === 'eje' })) }));
    }
  }
  return filas;
}

function seccionMalla(c, malla) {
  return {
    properties: HORIZONTAL,
    children: [
      ...encabezado(c, `Malla curricular – ${malla.areaNombre}`, `Grado ${malla.grado}° · Intensidad horaria: ${malla.intensidad || '—'} h semanales · Año lectivo ${c.anio || ''}`),
      tablaDatos(COLS_MALLA, filasMalla(malla)),
    ],
  };
}

async function generarDocxMalla({ config, malla }) {
  return documento(config, `Malla curricular ${malla.areaNombre} ${malla.grado}°`, [seccionMalla(config, malla)]);
}

const SECCIONES_PLAN_AREA = [
  ['diagnostico', '1. Diagnóstico del área'], ['justificacion', '2. Justificación'], ['objetivoGeneral', '3. Objetivo general'],
  ['__objetivosGrado', '4. Objetivos por grado'], ['referentes', '5. Marco legal y referentes'], ['enfoque', '6. Enfoque pedagógico y didáctico'],
  ['metodologia', '7. Metodología y estrategias'], ['evaluacion', '8. Evaluación'], ['recursos', '9. Recursos'],
  ['inclusion', '10. Inclusión, DUA y ajustes razonables'], ['transversales', '11. Proyectos transversales'], ['bibliografia', '12. Bibliografía y webgrafía'],
];

async function generarDocxPlanArea({ config, plan, mallas }) {
  const c = config;
  const hijos = [...encabezado(c, `Plan de área – ${plan.areaNombre}`, `Año lectivo ${c.anio || ''}`)];
  hijos.push(datosIdent([
    ['Área', plan.areaNombre], ['Asignaturas que integra', plan.asignaturas],
    ['Docentes', plan.docentes || c.docente], ['Intensidad horaria', plan.intensidadTexto],
  ]));
  for (const [k, t] of SECCIONES_PLAN_AREA) {
    hijos.push(titulo(t));
    if (k === '__objetivosGrado') {
      const filas = plan.objetivosGrado.map(([g, txt]) => new TableRow({ children: [celdaPeq(`Grado ${g}°`, { fondo: GRIS, negrita: true, ancho: 15 }), celdaPeq(txt, { ancho: 85 })] }));
      hijos.push(filas.length ? new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: filas }) : new Paragraph(''));
    } else {
      hijos.push(...parrafos(plan[k] || ''));
    }
  }
  if (mallas.length) {
    hijos.push(titulo('13. Mallas curriculares'));
    hijos.push(...parrafos('Ver las mallas por grado en las páginas siguientes.'));
  }
  return documento(c, `Plan de área ${plan.areaNombre}`, [{ properties: VERTICAL, children: hijos }, ...mallas.map((m) => seccionMalla(c, m))]);
}

async function generarDocxPlanPeriodo({ config, datos }) {
  const c = config;
  const hijos = [...encabezado(c, `Plan de periodo – ${datos.areaNombre}`, `Grado ${datos.grado}° · ${datos.periodoNombre} · ${datos.fechas || ''}`)];
  if (datos.pregunta) hijos.push(...parrafos('Pregunta problematizadora: ' + datos.pregunta, { bold: true }));
  hijos.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
  const cols = [
    { t: 'Unidad / proyecto', ancho: 13 }, { t: 'Fechas', ancho: 10 }, { t: 'Horas', ancho: 5 }, { t: 'Contenidos de la malla', ancho: 24 },
    { t: 'Estrategias metodológicas', ancho: 18 }, { t: 'Producto / evidencia', ancho: 14 }, { t: 'Evaluación', ancho: 16 },
  ];
  const filas = datos.unidades.map((u) => new TableRow({ children: [
    celdaPeq(u.nombre, { negrita: true }), celdaPeq(u.fechas), celdaPeq(u.horas), celdaPeq(u.contenidos),
    celdaPeq(u.estrategias), celdaPeq(u.producto), celdaPeq(u.evaluacion),
  ] }));
  hijos.push(tablaDatos(cols, filas.length ? filas : [new TableRow({ children: [celdaPeq('(sin unidades registradas)', { columnas: cols.length })] })]));
  if (datos.recursos) { hijos.push(titulo('Recursos')); hijos.push(...parrafos(datos.recursos)); }
  return documento(c, 'Plan de periodo', [{ properties: HORIZONTAL, children: hijos }]);
}

async function generarDocxPlanAula({ config, datos }) {
  const c = config;
  const hijos = [...encabezado(c, `Plan de aula – ${datos.areaNombre}`, `${datos.grupoNombre} · ${datos.periodoNombre} · ${datos.fechas || ''}`)];
  hijos.push(datosIdent([
    ['Docente', c.docente], ['Intensidad horaria', datos.intensidad],
    ['Estudiantes', String(datos.numEstudiantes)], ['Pregunta problematizadora', datos.pregunta],
  ]));
  hijos.push(titulo('Caracterización del grupo'));
  hijos.push(...parrafos(datos.caracterizacion));
  hijos.push(titulo('Ruta de aprendizaje del periodo'));
  const cols = [
    { t: 'Unidad', ancho: 10 }, { t: 'Eje / contenidos', ancho: 20 }, { t: 'Desempeños', ancho: 22 }, { t: 'Fechas previstas', ancho: 10 },
    { t: 'Clases planeadas', ancho: 18 }, { t: 'Estado', ancho: 8 }, { t: 'Evidencias', ancho: 12 },
  ];
  const filas = datos.ruta.map((r) => new TableRow({ children: [
    celdaPeq(r.unidad), celdaPeq(`${r.eje}${r.contenidos ? '\n' + r.contenidos : ''}`), celdaPeq(r.desempenos), celdaPeq(r.fechas),
    celdaPeq(r.clases), celdaPeq(r.estado, { negrita: true }), celdaPeq(r.evidencias),
  ] }));
  hijos.push(tablaDatos(cols, filas.length ? filas : [new TableRow({ children: [celdaPeq('(la malla de este grado y periodo está vacía)', { columnas: cols.length })] })]));
  const extra = [
    ['Estrategias metodológicas', datos.estrategias], ['Evaluación', datos.evaluacion],
    ['Estudiantes con PIAR y ajustes razonables', datos.piar], ['Observaciones y seguimiento', datos.observaciones],
  ];
  hijos.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: extra.map(([e, v]) => new TableRow({ children: [celdaPeq(e, { fondo: GRIS, negrita: true, ancho: 22 }), celdaPeq(v, { ancho: 78 })] })) }));
  return documento(c, 'Plan de aula', [{ properties: HORIZONTAL, children: hijos }]);
}


async function generarDocxProgramacion({ config, datos }) {
  const c = config;
  const hijos = [...encabezado(c, 'Programación evaluativa del periodo', `${datos.areaNombre} · ${datos.grupoNombre} · ${datos.periodoNombre}${datos.fechas ? ' (' + datos.fechas + ')' : ''}`)];
  hijos.push(datosIdent([['Docente', c.docente], ['Año lectivo', String(c.anio || '')]]));
  hijos.push(new Paragraph({ spacing: { before: 160, after: 120 }, children: [new TextRun({ font: FUENTE, size: 20,
    text: 'Señor padre de familia o acudiente: a continuación encontrará las actividades con las que se evaluará a su hijo(a) durante este periodo, su fecha aproximada y el porcentaje que representa cada componente en la nota final. Le invitamos a acompañar su preparación y cumplimiento.' })] }));
  const cols = [{ t: 'Componente', ancho: 20 }, { t: 'Actividad', ancho: 18 }, { t: 'Fecha', ancho: 12 }, { t: 'Descripción', ancho: 28 }, { t: 'Cómo se evalúa', ancho: 22 }];
  const filas = [];
  for (const comp of datos.componentes) {
    const acts = comp.actividades.length ? comp.actividades : [{ nombre: '—', fecha: '', descripcion: '', evalua: '' }];
    acts.forEach((a, i) => filas.push(new TableRow({ children: [
      ...(i === 0 ? [celdaPeq(`${comp.nombre}\n${comp.peso}%`, { negrita: true, fondo: GRIS, filas: acts.length })] : []),
      celdaPeq(a.nombre, { negrita: true }), celdaPeq(a.fecha), celdaPeq(a.descripcion), celdaPeq(a.evalua),
    ] })));
  }
  const total = datos.componentes.reduce((s, x) => s + (+x.peso || 0), 0);
  filas.push(new TableRow({ children: [celdaPeq(`TOTAL ${total}%`, { negrita: true, fondo: GRIS }), celdaPeq('', { columnas: 4 })] }));
  hijos.push(tablaDatos(cols, filas));
  hijos.push(titulo('Escala de valoración'));
  hijos.push(...parrafos(`Escala institucional de ${datos.escala}. Nota mínima aprobatoria: ${datos.aprobacion}. Equivalencia con la escala nacional (Decreto 1290 de 2009):`));
  hijos.push(new Table({ width: { size: 60, type: WidthType.PERCENTAGE }, rows: datos.desempenos.map(([n, r]) => new TableRow({ children: [celdaPeq(n, { negrita: true, fondo: GRIS, ancho: 50 }), celdaPeq(r, { ancho: 50 })] })) }));
  hijos.push(new Paragraph({ spacing: { before: 700 }, children: [] }));
  const sinBorde = { style: BorderStyle.NONE };
  hijos.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde, insideHorizontal: sinBorde, insideVertical: sinBorde },
    rows: [new TableRow({ children: [[c.docente || '', 'Docente'], ['', 'Firma del padre de familia o acudiente']].map(([n, rol]) => new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE }, borders: { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '______________________________', font: FUENTE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: n || ' ', font: FUENTE, size: 20, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: rol, font: FUENTE, size: 18 })] }),
      ] })) })],
  }));
  return documento(c, 'Programación evaluativa', [{ properties: VERTICAL, children: hijos }]);
}

module.exports = { generarDocxPlaneacion, generarDocxMalla, generarDocxPlanArea, generarDocxPlanPeriodo, generarDocxPlanAula, generarDocxProgramacion };
