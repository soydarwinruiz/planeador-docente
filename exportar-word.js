// Genera la planeación en formato Word (.docx)
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, ShadingType, BorderStyle, Header, Footer, PageNumber, PageOrientation, ImageRun, VerticalAlign,
} = require('docx');

const AZUL = '1F4E79';
const GRIS = 'D9E2F3';
const FUENTE = 'Arial';

const borde = { style: BorderStyle.SINGLE, size: 4, color: '8EA9DB' };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };

// ---------- Membrete institucional ----------
const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const SIN_BORDES = { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE };
function imagenMembrete(img, altoMax = 62) {
  if (!img || !img.data) return null;
  const m = /^data:image\/(png|jpe?g|gif|bmp);base64,(.+)$/.exec(img.data);
  if (!m) return null;
  const tipo = m[1].startsWith('jp') ? 'jpg' : m[1];
  const alto = altoMax, ancho = Math.round(altoMax * ((img.ancho || 1) / (img.alto || 1)));
  return new ImageRun({ type: tipo, data: Buffer.from(m[2], 'base64'), transformation: { width: Math.min(ancho, 160), height: alto } });
}
function colorMembrete(c) { return ((c.membrete || {}).color || AZUL).replace('#', ''); }
function membreteHeader(c, extra) {
  const mb = c.membrete || {};
  const col = colorMembrete(c);
  const lineas = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (c.institucion || 'INSTITUCIÓN EDUCATIVA').toUpperCase(), bold: true, font: FUENTE, size: 24, color: col })] }),
    ...String(mb.lineas || '').split(/\r?\n/).filter((l) => l.trim()).map((l) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: l.trim(), font: FUENTE, size: 15 })] })),
  ];
  const sedeMun = [c.sede, c.municipio].filter(Boolean).join(' – ');
  if (sedeMun) lineas.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sedeMun, font: FUENTE, size: 15 })] }));
  if (mb.lema) lineas.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: mb.lema, italics: true, font: FUENTE, size: 15, color: col })] }));
  const logo = imagenMembrete(mb.logo), logo2 = imagenMembrete(mb.logo2);
  const celdaImg = (im) => new TableCell({ borders: SIN_BORDES, width: { size: 15, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: im ? [im] : [] })] });
  const hijos = [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { ...SIN_BORDES, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
    rows: [new TableRow({ children: [celdaImg(logo), new TableCell({ borders: SIN_BORDES, width: { size: 70, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, children: lineas }), celdaImg(logo2)] })],
  })];
  hijos.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: col, space: 1 } }, spacing: { after: 60 },
    alignment: AlignmentType.RIGHT, children: extra ? [new TextRun({ text: extra, font: FUENTE, size: 14, color: '808080' })] : [] }));
  return { default: new Header({ children: hijos }) };
}

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
    spacing: { before: 240, after: 100 }, keepNext: true,
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

  contenido.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 40 }, children: [new TextRun({ text: 'ORIENTACIONES DIDÁCTICAS', bold: true, font: FUENTE, size: 24 })] }));
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
      headers: membreteHeader(c, `${areaNombre || ''} · ${grupoNombre || ''}`),
      footers: piePagina(c),
      children: contenido,
    }],
  });
  return Packer.toBuffer(doc);
}

// ================= Documentos curriculares =================
// El nombre de la institución y el logo van en el membrete (encabezado de página)
function encabezado(c, tituloDoc, subtitulo) {
  const r = [];
  r.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: subtitulo ? 40 : 200 }, children: [new TextRun({ text: tituloDoc.toUpperCase(), bold: true, font: FUENTE, size: 24 })] }));
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

function piePagina(c = {}) {
  const pie = String((c.membrete || {}).pie || '').split(/\r?\n/).filter((l) => l.trim());
  return { default: new Footer({ children: [
    ...pie.map((l, i) => new Paragraph({ alignment: AlignmentType.CENTER, border: i === 0 ? { top: { style: BorderStyle.SINGLE, size: 6, color: colorMembrete(c), space: 1 } } : undefined,
      children: [new TextRun({ text: l.trim(), font: FUENTE, size: 14, color: '606060' })] })),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [
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
    sections: secciones.map((s) => ({ ...s, headers: membreteHeader(c), footers: piePagina(c) })),
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

async function generarDocxApoyo({ config, planes }) {
  const c = config;
  const hijos = [];
  planes.forEach((p, i) => {
    hijos.push(...encabezado(c, 'Plan de apoyo / mejoramiento', `${p.areaNombre} · ${p.periodoNombre}`));
    hijos.push(datosIdent([
      ['Estudiante', p.estudiante], ['Grado / grupo', p.grupoNombre],
      ['Documento', p.documento], ['Docente', c.docente],
      ['Nota del periodo', p.notaTexto], ['Estado', p.estadoTexto],
      ['Fecha de entrega', p.entregaTexto], ['Fecha de sustentación', p.sustTexto],
    ]));
    hijos.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
    hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      ['Dificultades evidenciadas', p.dificultades], ['Desempeños por alcanzar', p.desempenos], ['Actividades de apoyo', p.actividades],
      ['Recursos y materiales', p.recursos], ['Criterios de evaluación', p.criterios], ['Compromiso del estudiante', p.compromisoEstudiante],
      ['Compromiso del padre de familia o acudiente', p.compromisoAcudiente],
      ...(p.notaFinal || p.observaciones ? [['Resultado', [p.notaFinal ? 'Nota del plan: ' + p.notaFinal : '', p.observaciones].filter(Boolean).join('\n')]] : []),
    ].map(([e, v]) => new TableRow({ children: [celdaPeq(e, { fondo: GRIS, negrita: true, ancho: 26 }), celdaPeq(v || '', { ancho: 74 })] })) }));
    hijos.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
    hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { ...SIN_BORDES, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
      rows: [new TableRow({ children: [[c.docente || '', 'Docente'], [p.estudiante, 'Estudiante'], ['', 'Padre de familia o acudiente']].map(([n, rol]) => new TableCell({
        borders: SIN_BORDES, width: { size: 33, type: WidthType.PERCENTAGE }, children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '________________________', font: FUENTE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: n || ' ', font: FUENTE, size: 18, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: rol, font: FUENTE, size: 16 })] }),
        ] })) })] }));
    if (i < planes.length - 1) hijos.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  });
  return documento(c, 'Planes de apoyo', [{ properties: VERTICAL, children: hijos }]);
}

async function generarDocxPiar({ config, datos: d }) {
  const c = config;
  const hijos = [...encabezado(c, 'Plan Individual de Ajustes Razonables – PIAR', 'Decreto 1421 de 2017')];
  hijos.push(datosIdent([
    ['Estudiante', d.estudiante], ['Documento', d.documento], ['Grado / grupo', d.grupoNombre], ['Año lectivo', String(d.anio || c.anio || '')],
    ['Fecha de nacimiento', d.nacimientoTexto], ['Edad', d.edad ? d.edad + ' años' : ''], ['Fecha de elaboración', d.fechaTexto], ['Responsables', d.responsables || c.docente],
  ]));
  for (const s of d.secciones) {
    const filas = s.campos.filter(([, v]) => v);
    if (!filas.length) continue;
    hijos.push(titulo(s.t));
    hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: filas.map(([e, v]) => new TableRow({ children: [celdaPeq(e, { fondo: GRIS, negrita: true, ancho: 32 }), celdaPeq(v, { ancho: 68 })] })) }));
  }
  hijos.push(titulo('6. Ajustes razonables por área'));
  hijos.push(tablaDatos([{ t: 'Área', ancho: 13 }, { t: 'Objetivos / propósitos', ancho: 22 }, { t: 'Barreras evidenciadas', ancho: 20 }, { t: 'Ajustes razonables', ancho: 25 }, { t: 'Evaluación de los ajustes', ancho: 20 }],
    d.ajustesTexto.length ? d.ajustesTexto.map((a) => new TableRow({ children: [celdaPeq(a.area, { negrita: true }), celdaPeq(a.objetivos), celdaPeq(a.barreras), celdaPeq(a.ajustes), celdaPeq(a.evaluacion)] }))
      : [new TableRow({ children: [celdaPeq('(sin áreas registradas)', { columnas: 5 })] })]));
  const recs = [['Recomendaciones', d.recomendaciones], ['Compromisos de la familia', d.compromisosFamilia], ['Compromisos de la institución', d.compromisosInstitucion]].filter(([, v]) => v);
  if (recs.length) {
    hijos.push(titulo('7. Recomendaciones y acta de acuerdo'));
    hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: recs.map(([e, v]) => new TableRow({ children: [celdaPeq(e, { fondo: GRIS, negrita: true, ancho: 28 }), celdaPeq(v, { ancho: 72 })] })) }));
  }
  if (d.seguimientoTexto.length) {
    hijos.push(titulo('8. Seguimiento'));
    hijos.push(tablaDatos([{ t: 'Fecha', ancho: 15 }, { t: 'Avances, dificultades y acciones', ancho: 60 }, { t: 'Responsable', ancho: 25 }],
      d.seguimientoTexto.map(([f, t, r]) => new TableRow({ children: [celdaPeq(f), celdaPeq(t), celdaPeq(r)] }))));
  }
  hijos.push(new Paragraph({ spacing: { before: 700 }, children: [] }));
  hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { ...SIN_BORDES, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
    rows: [new TableRow({ children: [[c.docente || '', 'Docente'], [c.coordinador || '', 'Coordinación / docente de apoyo'], ['', 'Padre de familia o acudiente']].map(([n, rol]) => new TableCell({
      borders: SIN_BORDES, width: { size: 33, type: WidthType.PERCENTAGE }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '________________________', font: FUENTE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: n || ' ', font: FUENTE, size: 18, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: rol, font: FUENTE, size: 16 })] }),
      ] })) })] }));
  return documento(c, 'PIAR', [{ properties: VERTICAL, children: hijos }]);
}


// ================= Documentos de productividad =================
// Tabla genérica (observaciones del boletín, diario de campo…)
async function generarDocxTabla({ config, titulo: tit, subtitulo, ident = [], columnas, filas, horizontal = false, firmas = [] }) {
  const c = config;
  const hijos = [...encabezado(c, tit, subtitulo)];
  if (ident.length) { hijos.push(datosIdent(ident)); hijos.push(new Paragraph({ spacing: { after: 80 }, children: [] })); }
  hijos.push(tablaDatos(columnas, filas.map((f, i) => new TableRow({ children: f.map((v, j) => celdaPeq(v, { ancho: columnas[j]?.ancho, fondo: i % 2 ? 'F2F6FC' : undefined })) }))));
  if (firmas.length) {
    hijos.push(new Paragraph({ spacing: { before: 700 }, children: [] }));
    hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { ...SIN_BORDES, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
      rows: [new TableRow({ children: firmas.map(([n, rol]) => new TableCell({ borders: SIN_BORDES, width: { size: Math.floor(100 / firmas.length), type: WidthType.PERCENTAGE }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '________________________', font: FUENTE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: n || ' ', font: FUENTE, size: 18, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: rol, font: FUENTE, size: 16 })] }),
      ] })) })] }));
  }
  return documento(c, tit, [{ properties: horizontal ? HORIZONTAL : VERTICAL, children: hijos }]);
}

// Comunicados / citaciones a padres de familia: uno por página con desprendible
async function generarDocxComunicados({ config, cartas }) {
  const c = config;
  const hijos = [];
  cartas.forEach((k, i) => {
    hijos.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 240 }, children: [new TextRun({ text: [c.municipio, k.fechaTexto].filter(Boolean).join(', '), font: FUENTE, size: 20 })] }));
    if (k.titulo) hijos.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: k.titulo.toUpperCase(), bold: true, font: FUENTE, size: 22 })] }));
    String(k.cuerpo || '').split(/\r?\n/).forEach((l) => hijos.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 300 }, children: [new TextRun({ text: l, font: FUENTE, size: 22 })] })));
    hijos.push(new Paragraph({ spacing: { before: 700 }, children: [new TextRun({ text: '________________________________', font: FUENTE })] }));
    hijos.push(new Paragraph({ children: [new TextRun({ text: c.docente || '', bold: true, font: FUENTE, size: 20 })] }));
    hijos.push(new Paragraph({ children: [new TextRun({ text: k.cargo || 'Docente', font: FUENTE, size: 18 })] }));
    if (k.desprendible) {
      hijos.push(new Paragraph({ spacing: { before: 500, after: 120 }, border: { top: { style: BorderStyle.DASHED, size: 6, color: '808080', space: 4 } },
        alignment: AlignmentType.CENTER, children: [new TextRun({ text: '✂ Desprendible – devolver firmado al docente', italics: true, font: FUENTE, size: 16, color: '606060' })] }));
      hijos.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: `Recibí el comunicado "${k.titulo || 'Comunicado'}" del estudiante ${k.estudiante} (${k.grupo}).`, font: FUENTE, size: 20 })] }));
      hijos.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: 'Firma del acudiente: ______________________________   C.C. ________________   Fecha: __________', font: FUENTE, size: 20 })] }));
    }
    if (i < cartas.length - 1) hijos.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  });
  return documento(c, 'Comunicados', [{ properties: VERTICAL, children: hijos }]);
}

// Prueba o taller: versión del estudiante (con hoja de respuestas) o del docente (clave y análisis)
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
async function generarDocxPrueba({ config, prueba: p, version = 'estudiante', analisis = null }) {
  const c = config;
  const docente = version === 'docente';
  const hijos = [...encabezado(c, (p.tipo === 'taller' ? 'Taller' : 'Prueba') + (docente ? ' – clave de respuestas' : ''), p.titulo)];
  hijos.push(datosIdent(docente
    ? [['Área', p.areaNombre], ['Grado', p.gradoTexto], ['Periodo', p.periodoNombre], ['Preguntas', String(p.preguntas.length)]]
    : [['Estudiante', ''], ['Grado / grupo', p.grupoNombre || p.gradoTexto], ['Área', p.areaNombre], ['Fecha', ''], ['Docente', c.docente || ''], ['Valoración', '']]));
  if (!docente && (p.instrucciones || p.tiempo)) {
    hijos.push(new Paragraph({ spacing: { before: 160, after: 60 }, children: [new TextRun({ text: 'Instrucciones', bold: true, font: FUENTE, size: 20 })] }));
    hijos.push(...parrafos([p.instrucciones, p.tiempo ? `Tiempo: ${p.tiempo} minutos.` : ''].filter(Boolean).join('\n'), { size: 19 }));
  }
  let ultimoContexto = '';
  p.preguntas.forEach((q, i) => {
    if (q.contexto && q.contexto !== ultimoContexto) {
      hijos.push(new Paragraph({ spacing: { before: 220, after: 60 }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F2F6FC' },
        children: [new TextRun({ text: q.contexto, font: FUENTE, size: 19 })] }));
    }
    ultimoContexto = q.contexto || '';
    hijos.push(new Paragraph({ spacing: { before: 160, after: 60 }, keepNext: true, children: [
      new TextRun({ text: `${i + 1}. `, bold: true, font: FUENTE, size: 20 }), new TextRun({ text: q.enunciado || '', font: FUENTE, size: 20 }),
      ...(q.puntos && q.tipo === 'abierta' ? [new TextRun({ text: `  (${q.puntos} pts)`, font: FUENTE, size: 16, color: '808080' })] : [])] }));
    if (q.tipo === 'abierta') {
      if (docente) { if (q.respuesta) hijos.push(...parrafos('Respuesta esperada: ' + q.respuesta, { size: 18, color: '1F6F3F' })); }
      else for (let l = 0; l < (q.lineas || 4); l++) hijos.push(new Paragraph({ spacing: { before: 160 }, indent: { left: 200 }, children: [new TextRun({ text: '_'.repeat(82), font: FUENTE, size: 20, color: 'A0A0A0' })] }));
    } else {
      (q.opciones || []).forEach((o, j) => {
        const ok = docente && LETRAS[j] === q.correcta;
        hijos.push(new Paragraph({ indent: { left: 400 }, spacing: { after: 30 }, keepNext: j < q.opciones.length - 1,
          children: [new TextRun({ text: `${LETRAS[j]}. `, bold: true, font: FUENTE, size: 20, color: ok ? '1F6F3F' : undefined }), new TextRun({ text: o, font: FUENTE, size: 20, bold: ok, color: ok ? '1F6F3F' : undefined })] }));
      });
      if (docente && (q.explicacion || q.competencia)) hijos.push(...parrafos([q.competencia ? 'Competencia / evidencia: ' + q.competencia : '', q.explicacion ? 'Justificación: ' + q.explicacion : ''].filter(Boolean).join('\n'), { size: 17, color: '505050', italics: true }));
    }
  });
  const cerradas = p.preguntas.map((q, i) => ({ q, i })).filter((x) => x.q.tipo !== 'abierta');
  if (cerradas.length) {
    hijos.push(new Paragraph({ pageBreakBefore: true, children: [] }));
    hijos.push(...encabezado(c, docente ? 'Clave de respuestas' : 'Hoja de respuestas', p.titulo));
    if (!docente) hijos.push(datosIdent([['Estudiante', ''], ['Grado / grupo', p.grupoNombre || p.gradoTexto]]));
    hijos.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: docente ? '' : 'Rellena completamente el círculo de la opción que elijas.', font: FUENTE, size: 18, italics: true })] }));
    const nOps = Math.max(...cerradas.map((x) => (x.q.opciones || []).length), 2);
    const cols = [{ t: 'N.°', ancho: 10 }, ...LETRAS.slice(0, nOps).map((l) => ({ t: l, ancho: Math.floor(70 / nOps) })), ...(docente && analisis ? [{ t: '% acierto', ancho: 20 }] : [])];
    hijos.push(tablaDatos(cols, cerradas.map(({ q, i }) => new TableRow({ children: [
      celdaPeq(String(i + 1), { negrita: true }),
      ...LETRAS.slice(0, nOps).map((l, j) => new TableCell({ borders: bordes, children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: j < (q.opciones || []).length ? (docente && l === q.correcta ? '●' : '○') : '', font: FUENTE, size: 26 })] })] })),
      ...(docente && analisis ? [celdaPeq(analisis[q.id] == null ? '—' : analisis[q.id] + '%')] : []),
    ] }))));
  }
  return documento(c, p.titulo || 'Prueba', [{ properties: VERTICAL, children: hijos }]);
}

// Informe con secciones (texto y tablas), p. ej. el informe de cierre de periodo
async function generarDocxInforme({ config, titulo: tit, subtitulo, ident = [], secciones = [], firmas = [], horizontal = false }) {
  const c = config;
  const hijos = [...encabezado(c, tit, subtitulo)];
  if (ident.length) hijos.push(datosIdent(ident));
  secciones.forEach((sec, i) => {
    hijos.push(titulo(`${i + 1}. ${sec.titulo}`));
    if (sec.texto) hijos.push(...parrafos(sec.texto, { size: 19 }));
    if (sec.tabla && sec.tabla.filas.length) {
      hijos.push(tablaDatos(sec.tabla.columnas, sec.tabla.filas.map((f, k) => new TableRow({ children: f.map((v, j) => celdaPeq(v, { ancho: sec.tabla.columnas[j]?.ancho, fondo: k % 2 ? 'F2F6FC' : undefined })) }))));
    } else if (sec.tabla && sec.vacio) hijos.push(...parrafos(sec.vacio, { size: 18, italics: true, color: '606060' }));
    if (sec.nota) hijos.push(...parrafos(sec.nota, { size: 16, italics: true, color: '606060' }));
  });
  if (firmas.length) {
    hijos.push(new Paragraph({ spacing: { before: 800 }, children: [] }));
    hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { ...SIN_BORDES, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
      rows: [new TableRow({ children: firmas.map(([n, rol]) => new TableCell({ borders: SIN_BORDES, width: { size: Math.floor(100 / firmas.length), type: WidthType.PERCENTAGE }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '________________________', font: FUENTE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: n || ' ', font: FUENTE, size: 18, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: rol, font: FUENTE, size: 16 })] }),
      ] })) })] }));
  }
  return documento(c, tit, [{ properties: horizontal ? HORIZONTAL : VERTICAL, children: hijos }]);
}

module.exports = { generarDocxInforme, generarDocxTabla, generarDocxComunicados, generarDocxPrueba, generarDocxPlaneacion, generarDocxMalla, generarDocxPlanArea, generarDocxPlanPeriodo, generarDocxPlanAula, generarDocxProgramacion, generarDocxApoyo, generarDocxPiar };
