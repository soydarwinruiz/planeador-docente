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

async function generarDocxPlaneacion({ config, plan, grupoNombre, areaNombre, periodoNombre, tipoLabel }) {
  const c = config || {};
  const contenido = [];

  // Encabezado institucional
  contenido.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: (c.institucion || 'INSTITUCIÓN EDUCATIVA').toUpperCase(), bold: true, font: FUENTE, size: 28, color: AZUL })],
  }));
  if (c.sede || c.municipio) {
    contenido.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: [c.sede, c.municipio].filter(Boolean).join(' – '), font: FUENTE, size: 20 })],
    }));
  }
  contenido.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 200 },
    children: [new TextRun({ text: `PLANEACIÓN DE CLASE – ${tipoLabel.toUpperCase()}`, bold: true, font: FUENTE, size: 24 })],
  }));

  // Datos de identificación
  const rango = plan.fechaInicio && plan.fechaFin && plan.fechaFin !== plan.fechaInicio
    ? `${fechaLarga(plan.fechaInicio)} al ${fechaLarga(plan.fechaFin)}`
    : fechaLarga(plan.fechaInicio);
  contenido.push(tabla([
    new TableRow({ children: [
      celda('Docente', { ancho: 15, fondo: GRIS, negrita: true }), celda(c.docente || '', { ancho: 35 }),
      celda('Año lectivo', { ancho: 15, fondo: GRIS, negrita: true }), celda(String(c.anio || ''), { ancho: 35 }),
    ] }),
    new TableRow({ children: [
      celda('Área / asignatura', { fondo: GRIS, negrita: true }), celda(areaNombre || ''),
      celda('Grado / grupo', { fondo: GRIS, negrita: true }), celda(grupoNombre || ''),
    ] }),
    new TableRow({ children: [
      celda('Periodo', { fondo: GRIS, negrita: true }), celda(periodoNombre || ''),
      celda('Fecha(s)', { fondo: GRIS, negrita: true }), celda(rango || ''),
    ] }),
    new TableRow({ children: [
      celda('Tema / título', { fondo: GRIS, negrita: true }), celda(plan.titulo || '', { columnas: 3 }),
    ] }),
  ]));

  // Referentes curriculares
  contenido.push(titulo('Referentes curriculares'));
  contenido.push(tabla([
    filaEtiqueta('Estándares básicos de competencias', plan.estandares),
    filaEtiqueta('Derechos Básicos de Aprendizaje (DBA)', plan.dba),
    filaEtiqueta('Competencias', plan.competencias),
  ]));

  contenido.push(titulo('Indicadores de desempeño'));
  contenido.push(tabla([
    filaEtiqueta('Saber (cognitivo)', plan.desempenoSaber),
    filaEtiqueta('Hacer (procedimental)', plan.desempenoHacer),
    filaEtiqueta('Ser (actitudinal)', plan.desempenoSer),
  ]));

  // Sesiones y momentos
  const sesiones = plan.sesiones || [];
  contenido.push(titulo(sesiones.length > 1 ? 'Desarrollo de las sesiones' : 'Momentos de la clase'));
  sesiones.forEach((s, i) => {
    const encabezado = [
      sesiones.length > 1 ? `Sesión ${i + 1}` : 'Sesión',
      s.titulo,
      s.fecha ? fechaLarga(s.fecha) : '',
      s.duracion ? `${s.duracion} min` : '',
    ].filter(Boolean).join(' · ');
    contenido.push(tabla([
      new TableRow({ children: [celda(encabezado, { columnas: 2, fondo: AZUL, negrita: true, colorTexto: 'FFFFFF' })] }),
      filaEtiqueta('Exploración (inicio)', s.exploracion),
      filaEtiqueta('Estructuración / conceptualización', s.estructuracion),
      filaEtiqueta('Práctica / transferencia', s.practica),
      filaEtiqueta('Valoración (cierre)', s.valoracion),
    ]));
    contenido.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  });

  contenido.push(titulo('Recursos, evaluación y adecuaciones'));
  contenido.push(tabla([
    filaEtiqueta('Recursos y materiales', plan.recursos),
    filaEtiqueta('Evaluación (criterios e instrumentos)', plan.evaluacion),
    filaEtiqueta('Evidencias de aprendizaje', plan.evidencias),
    filaEtiqueta('Ajustes razonables / PIAR / inclusión', plan.ajustes),
    ...(plan.observaciones ? [filaEtiqueta('Observaciones', plan.observaciones)] : []),
  ]));

  // Firmas
  contenido.push(new Paragraph({ spacing: { before: 800 }, children: [] }));
  contenido.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: [c.docente || 'Docente', c.coordinador || 'Coordinación académica'].map((nombre, i) => new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
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
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 }, size: { orientation: PageOrientation.PORTRAIT } } },
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

module.exports = { generarDocxPlaneacion };
