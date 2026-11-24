// ================= Tableros: pizarra infinita (tipo Miro) asociada a sesiones y grupos =================
// Lienzo infinito con notas adhesivas, textos con formato por letra, formas, conectores, lápiz, imágenes
// (con recorte y filtros), marcos para presentar, tablas, sellos, plantillas y exportación a PNG / PDF.
// Cada tablero puede quedar vinculado a una planeación, a una de sus sesiones, a uno o varios grupos y a un área.

// ---------- Constantes ----------
const PZ_COLORES_NOTA = ['#fff59d', '#ffe082', '#ffcc80', '#ffab91', '#f48fb1', '#ce93d8', '#b39ddb', '#9fa8da', '#90caf9', '#81d4fa',
  '#80deea', '#80cbc4', '#a5d6a7', '#c5e1a5', '#e6ee9c', '#ffffff', '#eceff1', '#bcaaa4', '#37474f', '#000000'];
const PZ_PALETA = ['#000000', '#37474f', '#607d8b', '#9e9e9e', '#e0e0e0', '#ffffff',
  '#b71c1c', '#e53935', '#ff7043', '#fb8c00', '#ffc107', '#ffeb3b',
  '#7cb342', '#43a047', '#1b5e20', '#00897b', '#00acc1', '#039be5',
  '#1e88e5', '#1f4e79', '#3949ab', '#5e35b1', '#8e24aa', '#d81b60'];
const PZ_FUENTES_BASE = ['Segoe UI', 'Arial', 'Arial Black', 'Arial Narrow', 'Bahnschrift', 'Book Antiqua', 'Bookman Old Style', 'Calibri', 'Cambria',
  'Candara', 'Century Gothic', 'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Franklin Gothic Medium', 'Garamond', 'Georgia',
  'Gill Sans MT', 'Impact', 'Ink Free', 'Lucida Console', 'Lucida Handwriting', 'Lucida Sans Unicode', 'Palatino Linotype', 'Rockwell', 'Segoe Print',
  'Segoe Script', 'Sitka Text', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Helvetica', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Poppins', 'Noto Sans', 'Noto Serif', 'DejaVu Sans', 'DejaVu Serif', 'Liberation Sans', 'Liberation Serif', 'Liberation Mono', 'Ubuntu', 'Cantarell'];
const PZ_GENERICAS = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];
const PZ_TAMANOS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120, 144, 200];
const PZ_SELLOS = ['👍', '👎', '❤️', '⭐', '✅', '❌', '❓', '❗', '💡', '🎯', '🏆', '🔥', '😀', '😮', '🤔', '😢', '👏', '🎉', '📌', '📝',
  '📚', '🧪', '🌎', '🔢', '🎨', '🎵', '⚽', '🧠', '⏰', '🚀', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '➡️'];
const PZ_AJUSTES = { auto: 'Reducir si no cabe', llenar: 'Llenar la caja', crecer: 'La caja crece con el texto', fijo: 'Tamaño fijo' };
const PZ_CON_TEXTO = ['nota', 'texto', 'forma'];
const PZ_NOMBRES = { nota: 'Nota', texto: 'Texto', forma: 'Forma', linea: 'Conector', trazo: 'Trazo', imagen: 'Imagen', marco: 'Marco', tabla: 'Tabla', sello: 'Sello' };

// Rutas normalizadas (0..1) que se escalan al tamaño de la forma
function pzEscalarRuta(d) {
  return (w, h) => {
    let cmd = '', i = 0;
    return d.replace(/([MLHVCQSTZ])|(-?\d*\.?\d+)/gi, (m, c, n) => {
      if (c) { cmd = c.toUpperCase(); i = 0; return c; }
      const v = parseFloat(n);
      const eje = cmd === 'H' ? 'x' : cmd === 'V' ? 'y' : (i % 2 === 0 ? 'x' : 'y');
      i++;
      return ' ' + +(eje === 'x' ? v * w : v * h).toFixed(2);
    });
  };
}
function pzPoligono(pts) { return pzEscalarRuta('M' + pts.map((p) => p.join(' ')).join('L') + 'Z'); }
function pzRegular(n, rot = -90, interior = 0) {
  const pts = [];
  const total = interior ? n * 2 : n;
  for (let k = 0; k < total; k++) {
    const a = (rot + (360 / total) * k) * Math.PI / 180;
    const r = interior && k % 2 ? interior : 0.5;
    pts.push([+(0.5 + r * Math.cos(a)).toFixed(4), +(0.5 + r * Math.sin(a)).toFixed(4)]);
  }
  return pzPoligono(pts);
}
const PZ_FORMAS = {
  rect: { t: 'Rectángulo', d: pzEscalarRuta('M0 0H1V1H0Z') },
  redondeado: { t: 'Rectángulo redondeado', d: (w, h) => { const r = Math.min(w, h) * 0.18; return `M${r} 0H${w - r}Q${w} 0 ${w} ${r}V${h - r}Q${w} ${h} ${w - r} ${h}H${r}Q0 ${h} 0 ${h - r}V${r}Q0 0 ${r} 0Z`; } },
  elipse: { t: 'Círculo / elipse', d: (w, h) => `M0 ${h / 2}A${w / 2} ${h / 2} 0 1 0 ${w} ${h / 2}A${w / 2} ${h / 2} 0 1 0 0 ${h / 2}Z` },
  triangulo: { t: 'Triángulo', d: pzPoligono([[0.5, 0], [1, 1], [0, 1]]) },
  trianguloRect: { t: 'Triángulo rectángulo', d: pzPoligono([[0, 0], [1, 1], [0, 1]]) },
  rombo: { t: 'Rombo', d: pzPoligono([[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]) },
  paralelogramo: { t: 'Paralelogramo', d: pzPoligono([[0.25, 0], [1, 0], [0.75, 1], [0, 1]]) },
  trapecio: { t: 'Trapecio', d: pzPoligono([[0.2, 0], [0.8, 0], [1, 1], [0, 1]]) },
  pentagono: { t: 'Pentágono', d: pzRegular(5) },
  hexagono: { t: 'Hexágono', d: pzRegular(6, 0) },
  octagono: { t: 'Octágono', d: pzRegular(8, 22.5) },
  estrella: { t: 'Estrella', d: pzRegular(5, -90, 0.2) },
  flechaDer: { t: 'Flecha derecha', d: pzPoligono([[0, 0.3], [0.6, 0.3], [0.6, 0], [1, 0.5], [0.6, 1], [0.6, 0.7], [0, 0.7]]) },
  flechaIzq: { t: 'Flecha izquierda', d: pzPoligono([[1, 0.3], [0.4, 0.3], [0.4, 0], [0, 0.5], [0.4, 1], [0.4, 0.7], [1, 0.7]]) },
  flechaArriba: { t: 'Flecha arriba', d: pzPoligono([[0.3, 1], [0.3, 0.4], [0, 0.4], [0.5, 0], [1, 0.4], [0.7, 0.4], [0.7, 1]]) },
  flechaDoble: { t: 'Flecha doble', d: pzPoligono([[0, 0.5], [0.25, 0], [0.25, 0.3], [0.75, 0.3], [0.75, 0], [1, 0.5], [0.75, 1], [0.75, 0.7], [0.25, 0.7], [0.25, 1]]) },
  cruz: { t: 'Cruz', d: pzPoligono([[0.33, 0], [0.67, 0], [0.67, 0.33], [1, 0.33], [1, 0.67], [0.67, 0.67], [0.67, 1], [0.33, 1], [0.33, 0.67], [0, 0.67], [0, 0.33], [0.33, 0.33]]) },
  globo: { t: 'Globo de diálogo', d: pzEscalarRuta('M.1 0H.9Q1 0 1 .1V.65Q1 .75 .9 .75H.42L.2 1L.25 .75H.1Q0 .75 0 .65V.1Q0 0 .1 0Z'), txt: { abajo: 0.25 } },
  nube: { t: 'Nube', d: pzEscalarRuta('M.25 .85C.04 .86 0 .58 .16 .52C.08 .3 .32 .16 .45 .28C.52 .06 .86 .08 .84 .36C1 .38 1.02 .84 .8 .85Z'), txt: { arriba: 0.25, abajo: 0.15, lados: 0.12 } },
  corazon: { t: 'Corazón', d: pzEscalarRuta('M.5 .95C.1 .65 0 .4 .1 .2C.22 0 .44 .04 .5 .24C.56 .04 .78 0 .9 .2C1 .4 .9 .65 .5 .95Z'), txt: { arriba: 0.15, abajo: 0.25, lados: 0.18 } },
  cilindro: { t: 'Cilindro', d: (w, h) => { const ry = h * 0.12; return `M0 ${ry}A${w / 2} ${ry} 0 0 1 ${w} ${ry}V${h - ry}A${w / 2} ${ry} 0 0 1 0 ${h - ry}ZM0 ${ry}A${w / 2} ${ry} 0 0 0 ${w} ${ry}`; }, txt: { arriba: 0.2 } },
};
const PZ_PUNTAS = { ninguna: 'Sin punta', flecha: 'Flecha', triangulo: 'Triángulo', circulo: 'Círculo', rombo: 'Rombo', barra: 'Barra' };

// ---------- Estado de la interfaz (no se guarda) ----------
const PZ = {
  id: null, herramienta: 'seleccionar', forma: 'rect', sello: '⭐', sel: new Set(), editando: null, htmlInicial: '',
  deshacer: [], rehacer: [], arr: null, portapapeles: null, rango: null, tamPendiente: 24, espacio: false,
  lapiz: { color: '#1d2533', grosor: 4 }, resaltador: { color: '#ffeb3b', grosor: 22 },
  notaColor: '#fff59d', ultimoPuntero: null, punteros: new Map(), pinza: null, presentando: false, marcoIdx: 0,
  fuentes: null, popAbierto: null, guias: [], cacheAjuste: new Map(), objetivo: null, temporizadorVista: null,
};

// ---------- Datos ----------
function pzT() { return S.pizarras.find((t) => t.id === PZ.id); }
function pzEl(id, t = pzT()) { return t?.elementos.find((e) => e.id === id); }
function pzNuevoTablero(datos = {}) {
  const t = {
    id: uid(), titulo: '', grupoIds: [], areaId: '', planeacionId: '', sesionId: '', fecha: hoyISO(),
    creada: new Date().toISOString(), modificada: new Date().toISOString(),
    fondo: { color: '#ffffff', patron: 'puntos' }, vista: null, elementos: [], recursos: {}, ...datos,
  };
  S.pizarras.push(t);
  return t;
}
function pzEstiloTexto(extra = {}) {
  const c = S.config.pizarra || {};
  return { fuente: c.fuente || 'Segoe UI', tam: 24, color: '#1d2533', negrita: false, cursiva: false, subrayado: false, tachado: false, alinH: 'center', alinV: 'middle', interlineado: 1.25, espaciado: 0, ...extra };
}
function pzNuevoElemento(tipo, props = {}) {
  const base = { id: uid(), tipo, x: 0, y: 0, w: 200, h: 200, rot: 0 };
  const def = {
    nota: { color: PZ.notaColor, html: '', estilo: pzEstiloTexto({ tam: 28 }), ajuste: 'auto' },
    texto: { w: 260, h: 40, html: '', estilo: pzEstiloTexto({ alinH: 'left', alinV: 'top' }), ajuste: 'crecer', fondo: '' },
    forma: { forma: PZ.forma, w: 180, h: 120, relleno: '#e3f2fd', borde: '#1e88e5', grosor: 2, trazo: 'solido', html: '', estilo: pzEstiloTexto({ tam: 20 }), ajuste: 'auto' },
    marco: { w: 1280, h: 720, titulo: 'Marco', color: '#ffffff' },
    linea: { p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, desde: null, hasta: null, ruta: 'recta', color: '#37474f', grosor: 2, trazo: 'solido', inicio: 'ninguna', fin: 'flecha', texto: '' },
    trazo: { puntos: [], vw: 1, vh: 1, color: '#1d2533', grosor: 4, opacidad: 1 },
    imagen: { rid: '', nw: 1, nh: 1, recorte: { x: 0, y: 0, w: 1, h: 1 }, recForma: 'rect', filtros: {}, voltearH: false, voltearV: false, borde: '', grosor: 0, sombra: false },
    tabla: { w: 420, h: 150, filas: 3, cols: 3, celdas: [], borde: '#90a4ae', encabezado: true, colorEnc: '#e3f2fd', relleno: '#ffffff', estilo: pzEstiloTexto({ tam: 16, alinH: 'left', alinV: 'top' }) },
    sello: { w: 72, h: 72, emoji: PZ.sello },
  }[tipo];
  const e = { ...base, ...structuredClone(def), ...props };
  if (tipo === 'tabla' && !e.celdas.length) e.celdas = Array.from({ length: e.filas }, () => Array.from({ length: e.cols }, () => ''));
  return e;
}
function pzTieneTexto(e) { return e && PZ_CON_TEXTO.includes(e.tipo); }
function pzTextoPlano(html) {
  const d = document.createElement('div');
  d.innerHTML = String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|li)>/gi, '\n');
  return d.textContent.replace(/\n{3,}/g, '\n\n').trim();
}
function pzTextoAHTML(txt) { return String(txt || '').split('\n').map((l) => esc(l) || '<br>').map((l, i) => (i ? `<div>${l}</div>` : l)).join(''); }

// ---------- Limpieza del texto con formato ----------
const PZ_ETIQUETAS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'BR', 'DIV', 'P', 'UL', 'OL', 'LI', 'SUB', 'SUP', 'FONT']);
const PZ_PROPS = ['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line',
  'text-decoration-color', 'letter-spacing', 'text-align', 'text-transform', 'text-shadow', '-webkit-text-stroke-width', '-webkit-text-stroke-color', 'vertical-align'];
function pzLimpiarHTML(html) {
  const plantilla = document.createElement('template');
  plantilla.innerHTML = String(html || '');
  const recorrer = (nodo) => {
    for (const hijo of [...nodo.childNodes]) {
      if (hijo.nodeType === 8) { hijo.remove(); continue; }
      if (hijo.nodeType !== 1) continue;
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'SVG', 'VIDEO', 'AUDIO', 'LINK', 'META'].includes(hijo.tagName)) { hijo.remove(); continue; }
      recorrer(hijo);
      if (!PZ_ETIQUETAS.has(hijo.tagName)) { hijo.replaceWith(...hijo.childNodes); continue; }
      let el = hijo;
      if (hijo.tagName === 'FONT') {
        el = document.createElement('span');
        if (hijo.color) el.style.color = hijo.color;
        if (hijo.face) el.style.fontFamily = hijo.face;
        el.setAttribute('style', (el.getAttribute('style') || '') + (hijo.getAttribute('style') || ''));
        el.append(...hijo.childNodes);
        hijo.replaceWith(el);
      }
      const estilo = el.style;
      const conservar = PZ_PROPS.map((p) => [p, estilo.getPropertyValue(p)]).filter(([, v]) => v && !/url\(|expression/i.test(v));
      for (const a of [...el.attributes]) el.removeAttribute(a.name);
      for (const [p, v] of conservar) el.style.setProperty(p, v);
      if (el.tagName === 'SPAN' && !el.getAttribute('style')) el.replaceWith(...el.childNodes);
    }
  };
  recorrer(plantilla.content);
  const d = document.createElement('div');
  d.append(plantilla.content);
  return d.innerHTML;
}
// Quita una propiedad de formato de todo el texto (cuando se aplica a la nota completa)
function pzQuitarFormato(html, prop) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  const etiquetas = { 'font-weight': ['B', 'STRONG'], 'font-style': ['I', 'EM'], 'text-decoration': ['U', 'S', 'STRIKE'] }[prop] || [];
  for (const el of [...d.querySelectorAll('*')]) {
    if (prop === '*') { el.removeAttribute('style'); if (['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'FONT', 'SUB', 'SUP'].includes(el.tagName)) el.replaceWith(...el.childNodes); continue; }
    if (el.style) {
      el.style.removeProperty(prop);
      if (prop === 'text-decoration') el.style.removeProperty('text-decoration-line');
      if (prop === 'font-size' && el.tagName === 'FONT') el.removeAttribute('size');
      if (prop === 'color' && el.tagName === 'FONT') el.removeAttribute('color');
      if (prop === 'font-family' && el.tagName === 'FONT') el.removeAttribute('face');
      if (!el.getAttribute('style')) el.removeAttribute('style');
    }
    if (etiquetas.includes(el.tagName) || (el.tagName === 'SPAN' && !el.attributes.length)) el.replaceWith(...el.childNodes);
  }
  return d.innerHTML;
}

// ---------- Geometría ----------
function pzCentro(e) { return { x: e.x + e.w / 2, y: e.y + e.h / 2 }; }
function pzRotar(p, c, grados) {
  const a = grados * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
  return { x: c.x + (p.x - c.x) * cos - (p.y - c.y) * sin, y: c.y + (p.x - c.x) * sin + (p.y - c.y) * cos };
}
function pzLimites(e) {
  if (e.tipo === 'linea') {
    const g = pzGeoLinea(e);
    const xs = g.pts.map((p) => p.x), ys = g.pts.map((p) => p.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  if (!e.rot) return { x: e.x, y: e.y, w: e.w, h: e.h };
  const c = pzCentro(e);
  const pts = [[e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h]].map(([x, y]) => pzRotar({ x, y }, c, e.rot));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
function pzUnion(rects) {
  if (!rects.length) return null;
  const x = Math.min(...rects.map((r) => r.x)), y = Math.min(...rects.map((r) => r.y));
  return { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
}
function pzSeCruzan(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function pzContiene(a, b) { return b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h; }
// Punto del borde de un elemento en dirección a otro punto (o en un lado concreto)
function pzAncla(e, lado, hacia) {
  const c = pzCentro(e);
  if (lado) {
    const p = { n: { x: c.x, y: e.y }, s: { x: c.x, y: e.y + e.h }, e: { x: e.x + e.w, y: c.y }, o: { x: e.x, y: c.y } }[lado];
    return e.rot ? pzRotar(p, c, e.rot) : p;
  }
  const b = pzLimites(e);
  const dx = hacia.x - c.x, dy = hacia.y - c.y;
  if (!dx && !dy) return c;
  const sx = dx ? (b.w / 2) / Math.abs(dx) : Infinity, sy = dy ? (b.h / 2) / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  if (e.tipo === 'forma' && e.forma === 'elipse' && !e.rot) {
    const a = Math.atan2(dy * e.w, dx * e.h);
    return { x: c.x + (e.w / 2) * Math.cos(a), y: c.y + (e.h / 2) * Math.sin(a) };
  }
  return { x: c.x + dx * s, y: c.y + dy * s };
}
function pzLadoMasCercano(e, p) {
  const c = pzCentro(e);
  const l = e.rot ? pzRotar(p, c, -e.rot) : p;
  const dx = (l.x - c.x) / (e.w || 1), dy = (l.y - c.y) / (e.h || 1);
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'o') : (dy > 0 ? 's' : 'n');
}
function pzGeoLinea(e, t = pzT()) {
  const a = e.desde && pzEl(e.desde.id, t), b = e.hasta && pzEl(e.hasta.id, t);
  const ca = a ? pzCentro(a) : e.p1, cb = b ? pzCentro(b) : e.p2;
  const p1 = a ? pzAncla(a, e.desde.lado, b && !e.hasta.lado ? cb : (b ? pzAncla(b, e.hasta.lado, ca) : e.p2)) : { ...e.p1 };
  const p2 = b ? pzAncla(b, e.hasta.lado, p1) : { ...e.p2 };
  if (a) e.p1 = { x: p1.x, y: p1.y };
  if (b) e.p2 = { x: p2.x, y: p2.y };
  const dirLado = (el, lado, p, otro) => {
    const l = lado || (el ? pzLadoMasCercano(el, p) : (Math.abs(otro.x - p.x) > Math.abs(otro.y - p.y) ? (otro.x > p.x ? 'e' : 'o') : (otro.y > p.y ? 's' : 'n')));
    let v = { n: { x: 0, y: -1 }, s: { x: 0, y: 1 }, e: { x: 1, y: 0 }, o: { x: -1, y: 0 } }[l];
    if (el?.rot) v = pzRotar(v, { x: 0, y: 0 }, el.rot);
    return v;
  };
  let d, pts = [p1, p2], medio = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  if (e.ruta === 'curva') {
    const dist = Math.max(40, Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.4);
    const v1 = dirLado(a, e.desde?.lado, p1, p2), v2 = dirLado(b, e.hasta?.lado, p2, p1);
    const c1 = { x: p1.x + v1.x * dist, y: p1.y + v1.y * dist }, c2 = { x: p2.x + v2.x * dist, y: p2.y + v2.y * dist };
    d = `M${p1.x} ${p1.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
    pts = [p1, c1, c2, p2];
    medio = { x: 0.125 * p1.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * p2.x, y: 0.125 * p1.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * p2.y };
  } else if (e.ruta === 'codo') {
    const v1 = dirLado(a, e.desde?.lado, p1, p2);
    const horizontal = Math.abs(v1.x) >= Math.abs(v1.y);
    if (horizontal) { const mx = (p1.x + p2.x) / 2; pts = [p1, { x: mx, y: p1.y }, { x: mx, y: p2.y }, p2]; } else { const my = (p1.y + p2.y) / 2; pts = [p1, { x: p1.x, y: my }, { x: p2.x, y: my }, p2]; }
    d = 'M' + pts.map((p) => `${p.x} ${p.y}`).join('L');
    medio = { x: (pts[1].x + pts[2].x) / 2, y: (pts[1].y + pts[2].y) / 2 };
  } else d = `M${p1.x} ${p1.y}L${p2.x} ${p2.y}`;
  return { p1, p2, d, pts, medio };
}

// ---------- Fuentes ----------
function pzFamilia(f) {
  const n = String(f || 'Segoe UI').replace(/['"\\;<>]/g, '');
  return PZ_GENERICAS.includes(n) ? n : `'${n}', sans-serif`;
}
function pzFuenteInstalada(nombre) {
  const c = pzFuenteInstalada.c || (pzFuenteInstalada.c = document.createElement('canvas').getContext('2d'));
  const texto = 'mmmmmmmmmmlli1WQ@#áñ';
  return ['monospace', 'serif', 'sans-serif'].some((g) => {
    c.font = `72px ${g}`; const a = c.measureText(texto).width;
    c.font = `72px '${nombre}', ${g}`; return c.measureText(texto).width !== a;
  });
}
async function pzCargarFuentes(forzar = false) {
  if (PZ.fuentes && !forzar) return PZ.fuentes;
  let lista = [];
  try {
    if (window.queryLocalFonts) {
      const fs = await window.queryLocalFonts();
      lista = [...new Set(fs.map((f) => f.family))];
    }
  } catch (e) { /* sin permiso: se usa la detección */ }
  if (!lista.length) lista = PZ_FUENTES_BASE.filter(pzFuenteInstalada);
  PZ.fuentes = [...new Set(lista)].sort((a, b) => a.localeCompare(b, 'es'));
  return PZ.fuentes;
}

// ---------- Dibujo de elementos ----------
function pzColorCSS(c, defecto = 'transparent') { return /^(#[0-9a-f]{3,8}|transparent|rgba?\([\d\s.,%]+\))$/i.test(String(c || '')) ? c : defecto; }
function pzTxt(e, extraPad = 0) {
  const s = e.estilo;
  const jv = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[s.alinV] || 'center';
  const deco = [s.subrayado && 'underline', s.tachado && 'line-through'].filter(Boolean).join(' ');
  const f = e.tipo === 'forma' ? (PZ_FORMAS[e.forma]?.txt || {}) : {};
  const pad = e.tipo === 'texto' ? 4 : 12 + extraPad;
  const padding = `${pad + (f.arriba || 0) * e.h}px ${pad + (f.lados || 0) * e.w}px ${pad + (f.abajo || 0) * e.h}px`;
  const ph = e.tipo === 'texto' ? 'Escribe aquí…' : '';
  return `<div class="pz-txt" style="justify-content:${jv};padding:${padding}"><div class="pz-txt-in ${e.ajuste === 'fijo' ? 'pz-cortar' : ''}" data-ph="${ph}" style="font-family:${pzFamilia(s.fuente)};font-size:${s.tam}px;color:${pzColorCSS(s.color, '#1d2533')};text-align:${s.alinH};line-height:${s.interlineado};letter-spacing:${s.espaciado || 0}px;${s.negrita ? 'font-weight:700;' : ''}${s.cursiva ? 'font-style:italic;' : ''}${deco ? `text-decoration:${deco};` : ''}">${e.html || ''}</div></div>`;
}
function pzMarcadores(e) {
  const m = (tipo, id) => {
    if (!tipo || tipo === 'ninguna') return '';
    const forma = {
      flecha: '<path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
      triangulo: '<path d="M0 0L10 5L0 10Z" fill="context-stroke"/>',
      circulo: '<circle cx="5" cy="5" r="4" fill="context-stroke"/>',
      rombo: '<path d="M0 5L5 0L10 5L5 10Z" fill="context-stroke"/>',
      barra: '<path d="M5 0V10" stroke="context-stroke" stroke-width="1.6"/>',
    }[tipo] || '';
    return `<marker id="${id}" viewBox="0 0 10 10" refX="${tipo === 'barra' || tipo === 'circulo' || tipo === 'rombo' ? 5 : 8}" refY="5" markerWidth="${Math.max(3.2, 10 / Math.sqrt(e.grosor))}" markerHeight="${Math.max(3.2, 10 / Math.sqrt(e.grosor))}" orient="auto-start-reverse" markerUnits="strokeWidth">${forma.replace(/context-stroke/g, pzColorCSS(e.color, '#37474f'))}</marker>`;
  };
  return m(e.inicio, `pzm-${e.id}-i`) + m(e.fin, `pzm-${e.id}-f`);
}
function pzGuiones(estilo, grosor) { return estilo === 'guiones' ? `${grosor * 4} ${grosor * 3}` : estilo === 'puntos' ? `0.1 ${grosor * 2.5}` : ''; }
function pzHTML(e) {
  const op = e.opacidad != null && e.opacidad < 1 ? `opacity:${e.opacidad};` : '';
  const caja = `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;${e.rot ? `transform:rotate(${e.rot}deg);` : ''}${op}`;
  const attrs = `data-id="${e.id}" class="pz-el pz-${e.tipo}${e.bloqueado ? ' pz-bloq' : ''}${e.sombra === false ? ' pz-sin-sombra' : ''}"`;
  switch (e.tipo) {
    case 'nota': return `<div ${attrs} style="${caja}background:${pzColorCSS(e.color, '#fff59d')}">${pzTxt(e)}</div>`;
    case 'texto': return `<div ${attrs} style="${caja}${e.fondo ? `background:${pzColorCSS(e.fondo)};border-radius:6px;` : ''}">${pzTxt(e)}</div>`;
    case 'forma': {
      const f = PZ_FORMAS[e.forma] || PZ_FORMAS.rect;
      const g = +e.grosor || 0;
      return `<div ${attrs} style="${caja}"><svg class="pz-svg" width="${e.w}" height="${e.h}" overflow="visible"><path d="${f.d(e.w, e.h)}" fill="${pzColorCSS(e.relleno)}" stroke="${g ? pzColorCSS(e.borde, 'transparent') : 'transparent'}" stroke-width="${g}" stroke-dasharray="${pzGuiones(e.trazo, g)}" stroke-linecap="round" stroke-linejoin="round"/></svg>${pzTxt(e)}</div>`;
    }
    case 'marco': return `<div ${attrs} style="${caja}background:${pzColorCSS(e.color, '#ffffff')}"><div class="pz-marco-titulo">${esc(e.titulo || 'Marco')}</div></div>`;
    case 'linea': {
      const g = pzGeoLinea(e);
      const gr = +e.grosor || 2;
      return `<div ${attrs} style="left:0;top:0;width:0;height:0;${op}"><svg class="pz-svg" width="1" height="1" overflow="visible"><defs>${pzMarcadores(e)}</defs>
        <path class="pz-golpe" d="${g.d}" fill="none" stroke="transparent" stroke-width="${Math.max(16, gr + 12)}" stroke-linecap="round"/>
        <path d="${g.d}" fill="none" stroke="${pzColorCSS(e.color, '#37474f')}" stroke-width="${gr}" stroke-dasharray="${pzGuiones(e.trazo, gr)}" stroke-linecap="round" stroke-linejoin="round" ${e.inicio !== 'ninguna' ? `marker-start="url(#pzm-${e.id}-i)"` : ''} ${e.fin !== 'ninguna' ? `marker-end="url(#pzm-${e.id}-f)"` : ''}/></svg>
        ${e.texto ? `<div class="pz-linea-txt" style="left:${g.medio.x}px;top:${g.medio.y}px;color:${pzColorCSS(e.color, '#37474f')}">${esc(e.texto)}</div>` : ''}</div>`;
    }
    case 'trazo': {
      const sx = e.w / (e.vw || 1), sy = e.h / (e.vh || 1);
      return `<div ${attrs} style="${caja.replace(op, '')}"><svg class="pz-svg" width="${e.w}" height="${e.h}" overflow="visible"><path d="${pzRutaSuave(e.puntos.map(([x, y]) => [x * sx, y * sy]))}" fill="none" stroke="${pzColorCSS(e.color, '#1d2533')}" stroke-width="${e.grosor}" stroke-linecap="round" stroke-linejoin="round" opacity="${e.opacidad ?? 1}" ${e.resaltador ? 'style="mix-blend-mode:multiply"' : ''}/></svg></div>`;
    }
    case 'imagen': {
      const t = pzT(), src = (t?.recursos || {})[e.rid] || e.src || '';
      const r = e.recorte || { x: 0, y: 0, w: 1, h: 1 };
      const iw = e.w / r.w, ih = e.h / r.h;
      const f = e.filtros || {};
      const filtro = [f.brillo != null && f.brillo !== 100 && `brightness(${f.brillo}%)`, f.contraste != null && f.contraste !== 100 && `contrast(${f.contraste}%)`,
        f.saturacion != null && f.saturacion !== 100 && `saturate(${f.saturacion}%)`, f.gris && `grayscale(${f.gris}%)`, f.sepia && `sepia(${f.sepia}%)`,
        f.desenfoque && `blur(${f.desenfoque}px)`, f.tono && `hue-rotate(${f.tono}deg)`].filter(Boolean).join(' ');
      const radio = e.recForma === 'circulo' ? '50%' : e.recForma === 'redondeado' ? `${Math.min(e.w, e.h) * 0.12}px` : '0';
      return `<div ${attrs} style="${caja}"><div class="pz-img-marco" style="border-radius:${radio};${e.grosor ? `box-shadow:0 0 0 ${e.grosor}px ${pzColorCSS(e.borde, '#000')}${e.sombra ? ',0 6px 18px rgba(0,0,0,.3)' : ''};` : e.sombra ? 'box-shadow:0 6px 18px rgba(0,0,0,.3);' : ''}">
        <div class="pz-img-volteo" style="${e.voltearH || e.voltearV ? `transform:scale(${e.voltearH ? -1 : 1},${e.voltearV ? -1 : 1});` : ''}"><img src="${esc(src)}" draggable="false" alt="" style="left:${-r.x * iw}px;top:${-r.y * ih}px;width:${iw}px;height:${ih}px;${filtro ? `filter:${filtro};` : ''}"></div></div></div>`;
    }
    case 'tabla': {
      const s = e.estilo;
      return `<div ${attrs} style="${caja}"><table class="pz-tabla-t" style="border-color:${pzColorCSS(e.borde, '#90a4ae')};background:${pzColorCSS(e.relleno, '#fff')};font-family:${pzFamilia(s.fuente)};font-size:${s.tam}px;color:${pzColorCSS(s.color, '#1d2533')};text-align:${s.alinH};line-height:${s.interlineado}">
        ${e.celdas.map((fila, r) => `<tr>${fila.map((c, k) => `<td style="border-color:${pzColorCSS(e.borde, '#90a4ae')};vertical-align:${{ top: 'top', middle: 'middle', bottom: 'bottom' }[s.alinV]};${r === 0 && e.encabezado ? `background:${pzColorCSS(e.colorEnc, '#e3f2fd')};font-weight:700;` : ''}"><div class="pz-celda" data-celda="${r},${k}">${c || ''}</div></td>`).join('')}</tr>`).join('')}</table></div>`;
    }
    case 'sello': return `<div ${attrs} style="${caja}"><div class="pz-sello-in" style="font-size:${Math.min(e.w, e.h) * 0.82}px">${esc(e.emoji)}</div></div>`;
  }
  return '';
}
function pzRutaSuave(pts) {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}l0.01 0`;
  if (pts.length === 2) return `M${pts[0][0]} ${pts[0][1]}L${pts[1][0]} ${pts[1][1]}`;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const u = pts[pts.length - 1];
  return d + `L${u[0].toFixed(1)} ${u[1].toFixed(1)}`;
}
// Simplificación de trazos (Ramer–Douglas–Peucker)
function pzSimplificar(pts, tol) {
  if (pts.length < 3) return pts;
  const dist = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    if (!l) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = dist(pts[i], pts[0], pts[pts.length - 1]); if (d > max) { max = d; idx = i; } }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...pzSimplificar(pts.slice(0, idx + 1), tol).slice(0, -1), ...pzSimplificar(pts.slice(idx), tol)];
}

// Ajuste automático del tamaño de la letra a la caja
function pzAjustarTexto(e, nodo = pzNodo(e.id)) {
  if (!nodo) return;
  if (e.tipo === 'tabla') {
    const tb = nodo.querySelector('table');
    if (tb && tb.offsetHeight > e.h + 1) { e.h = tb.offsetHeight; nodo.style.height = e.h + 'px'; }
    return;
  }
  if (!pzTieneTexto(e)) return;
  const caja = nodo.querySelector('.pz-txt'), inn = nodo.querySelector('.pz-txt-in');
  if (!caja || !inn) return;
  const base = e.estilo.tam;
  if (e.ajuste === 'crecer') {
    inn.style.fontSize = base + 'px';
    const h = Math.ceil(inn.offsetHeight + 8);
    if (Math.abs(h - e.h) > 0.5) { e.h = h; nodo.style.height = h + 'px'; }
    return;
  }
  if (e.ajuste === 'fijo' || (!inn.textContent.trim() && !PZ.editando)) { inn.style.fontSize = base + 'px'; return; }
  const firma = [e.html, e.w, e.h, base, e.ajuste, e.estilo.fuente, e.estilo.interlineado, e.estilo.espaciado, e.estilo.negrita, e.forma].join('|');
  const cache = PZ.cacheAjuste.get(e.id);
  if (cache && cache.firma === firma && PZ.editando?.id !== e.id) { inn.style.fontSize = cache.tam + 'px'; return; }
  const cs = getComputedStyle(caja);
  const altoDisp = caja.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const anchoDisp = caja.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const cabe = (t) => { inn.style.fontSize = t + 'px'; return inn.scrollHeight <= altoDisp + 1 && inn.scrollWidth <= anchoDisp + 1; };
  let lo = 4, hi = e.ajuste === 'llenar' ? Math.max(base, 400) : base;
  if (cabe(hi)) lo = hi;
  else {
    for (let i = 0; i < 12 && hi - lo > 0.5; i++) { const m = (lo + hi) / 2; if (cabe(m)) lo = m; else hi = m; }
  }
  const tam = Math.floor(lo * 2) / 2;
  inn.style.fontSize = tam + 'px';
  PZ.cacheAjuste.set(e.id, { firma, tam });
}

// ---------- Vista principal ----------
RENDERS.pizarra = ({ id }) => {
  PZ.id = id;
  PZ.editando = null; PZ.arr = null;
  const t = pzT();
  if (!t) return `<div class="tarjeta vacio"><div class="grande">🖍️</div>No se encontró el tablero. <a href="#" onclick="ir('pizarras');return false">Volver a los tableros</a></div>`;
  return `<div class="pz ${PZ.presentando ? 'presentando' : ''}" id="pz">
    <div class="pz-barra-sup">
      <button class="btn pequeno" onclick="pzSalir()" title="Volver a la lista de tableros">← Tableros</button>
      <input class="pz-titulo" value="${esc(t.titulo)}" placeholder="Tablero sin título" onchange="pzCambiarTitulo(this.value)" onkeydown="if(event.key==='Enter')this.blur()">
      <div class="pz-vinculo" onclick="pzDialogoVinculo('${t.id}')" title="Asignar a una planeación, sesión, grupos y área">${pzChipsVinculo(t)}</div>
      <div class="pz-sup-der">
        <button class="btn pequeno" onclick="pzMenuPlantillas(this)" title="Plantillas para la clase">🧩 Plantillas</button>
        <button class="btn pequeno" onclick="pzMenuInsertar(this)" title="Insertar estudiantes, momentos de la sesión, imágenes…">➕ Insertar</button>
        <button class="btn pequeno" onclick="pzAulaDesdeTablero()" title="Estudiante al azar, grupos de trabajo, temporizador">🎲 Aula</button>
        <button class="btn pequeno" onclick="pzMenuExportar(this)" title="Guardar como imagen o PDF">⬇️ Exportar</button>
        <button class="btn pequeno primario" onclick="pzPresentar()" title="Presentar los marcos en pantalla completa">▶ Presentar</button>
        <button class="btn pequeno" onclick="pzMenuMas(this)" title="Más opciones">⋯</button>
      </div>
    </div>
    <div class="pz-area" id="pz-area">
      <div class="pz-herramientas" id="pz-herr">${pzBotonesHerramientas()}</div>
      <div class="pz-lienzo" id="pz-lienzo" tabindex="-1">
        <div class="pz-mundo" id="pz-mundo"><div id="pz-capa-marcos"></div><div id="pz-capa-el"></div><div id="pz-capa-sel"></div></div>
      </div>
      <div class="pz-ctx oculto" id="pz-ctx"></div>
      <div class="pz-zoom" id="pz-zoom"></div>
      <div class="pz-minimapa ${S.config.pizarra?.minimapa === false ? 'oculto' : ''}" id="pz-minimapa"></div>
      <div class="pz-presentacion" id="pz-pres"></div>
      <div class="pz-pop oculto" id="pz-pop"></div>
    </div>
  </div>`;
};
RENDERS.pizarra_despues = () => {
  const t = pzT();
  if (!t) return;
  pzInstalarEventos();
  pzPintar();
  if (!t.vista) pzEncuadrar(null, false); else pzAplicarVista();
  document.getElementById('pz-lienzo').focus({ preventScroll: true });
};
function pzChipsVinculo(t) {
  const p = t.planeacionId && porId(S.planeaciones, t.planeacionId);
  const si = p ? (p.sesiones || []).findIndex((s) => s.id === t.sesionId) : -1;
  const chips = [];
  if (p) chips.push(`<span class="chip sesion" title="Planeación vinculada">📝 ${esc(p.titulo || 'Planeación sin título')}${si >= 0 ? ` · Sesión ${si + 1}` : ''}</span>`);
  else if (t.planeacionId) chips.push('<span class="chip borrador">📝 Planeación eliminada</span>');
  if (t.grupoIds.length) chips.push(`<span class="chip semanal" title="Grupos">👥 ${t.grupoIds.map((g) => esc(nombreGrupoId(g))).join(', ')}</span>`);
  if (t.areaId) chips.push(`<span class="chip secuencia">${esc(nombreArea(t.areaId))}</span>`);
  if (t.fecha) chips.push(`<span class="chip">${esc(fechaCorta(t.fecha))}</span>`);
  return chips.length ? chips.join(' ') + ' <span class="pz-editar-vinc">✏️</span>' : '<span class="chip borrador">🔗 Sin asignar: elegir sesión y grupos</span>';
}
function pzBotonesHerramientas() {
  const h = PZ.herramienta;
  const b = (k, ico, t, extra = '') => `<button class="${h === k ? 'activo' : ''}" title="${t}" onclick="pzHerramienta('${k}'${extra})">${ico}</button>`;
  return b('seleccionar', '<span class="pz-ico-flecha">➤</span>', 'Seleccionar y mover (V)') + b('mano', '✋', 'Mover el lienzo (H o barra espaciadora)')
    + '<hr>' + b('nota', '🗒️', 'Nota adhesiva (N)') + b('texto', '<b style="font-family:Georgia">T</b>', 'Texto (T)')
    + `<button class="${h === 'forma' ? 'activo' : ''}" title="Formas (S)" onclick="pzHerramienta('forma');pzMenuFormas(this)">${pzIcoForma(PZ.forma)}</button>`
    + b('linea', '↗', 'Conector o flecha (L)') + b('lapiz', '✏️', 'Lápiz (P)') + b('resaltador', '🖍️', 'Resaltador (M)') + b('borrador', '🧽', 'Borrador de trazos (E)')
    + '<hr>' + `<button title="Imagen (I)" onclick="pzElegirImagen()">🖼️</button>`
    + b('marco', '<span style="font-size:15px">⬚</span>', 'Marco para presentar (F)') + b('tabla', '▦', 'Tabla')
    + `<button class="${h === 'sello' ? 'activo' : ''}" title="Sellos y reacciones" onclick="pzHerramienta('sello');pzMenuSellos(this)">${PZ.sello}</button>`
    + '<hr>' + `<button title="Deshacer (Ctrl+Z)" onclick="pzDeshacer()" ${PZ.deshacer.length ? '' : 'disabled'}>↶</button><button title="Rehacer (Ctrl+Y)" onclick="pzRehacer()" ${PZ.rehacer.length ? '' : 'disabled'}>↷</button>`;
}
function pzIcoForma(f) {
  const d = (PZ_FORMAS[f] || PZ_FORMAS.rect).d(18, 14);
  return `<svg width="20" height="16" viewBox="-1 -1 20 16"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
}
function pzHerramienta(k) {
  pzTerminarEdicion();
  PZ.herramienta = k;
  if (!['seleccionar', 'mano'].includes(k)) { PZ.sel.clear(); pzPintarSel(); }
  pzCerrarPop();
  pzRefrescarHerramientas();
  pzBarraCtx();
  const l = document.getElementById('pz-lienzo');
  if (l) l.dataset.herr = k;
}
function pzRefrescarHerramientas() {
  const h = document.getElementById('pz-herr');
  if (h) h.innerHTML = pzBotonesHerramientas();
}

// Pinta todos los elementos
function pzPintar() {
  const t = pzT();
  const capaM = document.getElementById('pz-capa-marcos'), capaE = document.getElementById('pz-capa-el');
  if (!t || !capaE) return;
  capaM.innerHTML = t.elementos.filter((e) => e.tipo === 'marco').map(pzHTML).join('');
  capaE.innerHTML = t.elementos.filter((e) => e.tipo !== 'marco').map(pzHTML).join('');
  for (const e of t.elementos) if (pzTieneTexto(e) || e.tipo === 'tabla') pzAjustarTexto(e);
  // Las líneas conectadas a textos que crecieron se recalculan
  if (t.elementos.some((e) => e.tipo === 'linea' && (e.desde || e.hasta))) for (const e of t.elementos) if (e.tipo === 'linea') pzReemplazarNodo(e);
  pzPintarSel();
  pzMinimapa();
}
function pzNodo(id) { return document.querySelector(`#pz-mundo .pz-el[data-id="${id}"]`); }
function pzReemplazarNodo(e) {
  const n = pzNodo(e.id);
  if (!n) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = pzHTML(e);
  const nuevo = tmp.firstElementChild;
  n.replaceWith(nuevo);
  if (pzTieneTexto(e) || e.tipo === 'tabla') pzAjustarTexto(e, nuevo);
}
function pzRefrescar(ids) {
  const t = pzT();
  const set = new Set(ids);
  for (const id of set) { const e = pzEl(id); if (e) pzReemplazarNodo(e); }
  for (const e of t.elementos) if (e.tipo === 'linea' && !set.has(e.id) && ((e.desde && set.has(e.desde.id)) || (e.hasta && set.has(e.hasta.id)))) pzReemplazarNodo(e);
  pzPintarSel();
  pzMinimapa();
}
// Mover sin redibujar todo (para arrastres fluidos)
function pzMoverNodo(e) {
  const n = pzNodo(e.id);
  if (!n) return;
  if (e.tipo === 'linea') { pzReemplazarNodo(e); return; }
  n.style.left = e.x + 'px'; n.style.top = e.y + 'px';
}

// ---------- Vista: desplazamiento y zoom ----------
function pzVista() { const t = pzT(); return t.vista || (t.vista = { x: 0, y: 0, z: 1 }); }
function pzAPantalla(p) { const v = pzVista(); return { x: p.x * v.z + v.x, y: p.y * v.z + v.y }; }
function pzAMundo(cx, cy) {
  const l = document.getElementById('pz-lienzo').getBoundingClientRect(), v = pzVista();
  return { x: (cx - l.left - v.x) / v.z, y: (cy - l.top - v.y) / v.z };
}
function pzAplicarVista() {
  const v = pzVista(), m = document.getElementById('pz-mundo'), l = document.getElementById('pz-lienzo');
  if (!m) return;
  m.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.z})`;
  m.style.setProperty('--iz', 1 / v.z);
  const t = pzT(), f = t.fondo || {};
  l.style.backgroundColor = pzColorCSS(f.color, '#ffffff');
  const paso = 24 * v.z, oscuro = pzEsOscuro(f.color);
  const c = oscuro ? 'rgba(255,255,255,.16)' : 'rgba(40,60,90,.16)';
  l.style.backgroundImage = paso < 6 || f.patron === 'ninguno' ? 'none'
    : f.patron === 'cuadricula' ? `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`
      : f.patron === 'lineas' ? `linear-gradient(${c} 1px, transparent 1px)`
        : `radial-gradient(circle, ${oscuro ? 'rgba(255,255,255,.28)' : 'rgba(40,60,90,.28)'} ${Math.max(0.8, Math.min(1.6, v.z))}px, transparent ${Math.max(1, Math.min(1.8, v.z)) + 0.2}px)`;
  l.style.backgroundSize = `${paso}px ${paso}px`;
  l.style.backgroundPosition = `${v.x}px ${v.y}px`;
  const zl = document.getElementById('pz-zoom');
  if (zl) zl.innerHTML = `<button onclick="pzZoomBoton(1/1.25)" title="Alejar (Ctrl -)">−</button><button onclick="pzZoomA(1)" title="Tamaño real (Shift+0)" style="min-width:56px">${Math.round(v.z * 100)}%</button><button onclick="pzZoomBoton(1.25)" title="Acercar (Ctrl +)">＋</button><button onclick="pzEncuadrar()" title="Ver todo (Shift+1)">⤢</button><button onclick="pzAlternarMinimapa()" title="Minimapa">🗺️</button>`;
  pzPosicionarCtx();
  pzMinimapaVista();
  clearTimeout(PZ.temporizadorVista);
  PZ.temporizadorVista = setTimeout(() => guardar(), 1500);
}
function pzEsOscuro(c) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '').replace('#', '').length === 3 ? String(c).replace(/^#?(.)(.)(.)$/, '#$1$1$2$2$3$3') : String(c || ''));
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 110;
}
function pzZoom(factor, cx, cy) {
  const v = pzVista();
  const z = Math.min(8, Math.max(0.05, v.z * factor));
  const f = z / v.z;
  v.x = cx - (cx - v.x) * f; v.y = cy - (cy - v.y) * f; v.z = z;
  pzAplicarVista();
}
function pzZoomBoton(f) { const l = document.getElementById('pz-lienzo'); pzZoom(f, l.clientWidth / 2, l.clientHeight / 2); }
function pzZoomA(z) { const v = pzVista(); pzZoomBoton(z / v.z); }
function pzEncuadrar(rect, animar = true, margen = 60) {
  const t = pzT(), l = document.getElementById('pz-lienzo');
  if (!l) return;
  rect = rect || pzUnion(t.elementos.map(pzLimites));
  const v = pzVista();
  if (!rect) { v.x = l.clientWidth / 2; v.y = l.clientHeight / 2; v.z = 1; pzAplicarVista(); return; }
  const z = Math.min(4, Math.max(0.05, Math.min((l.clientWidth - margen * 2) / Math.max(rect.w, 1), (l.clientHeight - margen * 2) / Math.max(rect.h, 1))));
  const destino = { z, x: l.clientWidth / 2 - (rect.x + rect.w / 2) * z, y: l.clientHeight / 2 - (rect.y + rect.h / 2) * z };
  if (!animar) { Object.assign(v, destino); pzAplicarVista(); return; }
  const inicio = { ...v }, t0 = performance.now();
  const paso = (ahora) => {
    const k = Math.min(1, (ahora - t0) / 350), s = 1 - Math.pow(1 - k, 3);
    v.x = inicio.x + (destino.x - inicio.x) * s; v.y = inicio.y + (destino.y - inicio.y) * s; v.z = inicio.z + (destino.z - inicio.z) * s;
    pzAplicarVista();
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
function pzCentroVista() {
  const l = document.getElementById('pz-lienzo').getBoundingClientRect();
  return pzAMundo(l.left + l.width / 2, l.top + l.height / 2);
}

// ---------- Minimapa ----------
function pzAlternarMinimapa() {
  S.config.pizarra = { ...(S.config.pizarra || {}), minimapa: S.config.pizarra?.minimapa === false };
  document.getElementById('pz-minimapa')?.classList.toggle('oculto', S.config.pizarra.minimapa === false);
  guardar(); pzMinimapa();
}
function pzMarcoMinimapa() {
  const t = pzT(), l = document.getElementById('pz-lienzo');
  const v = pzVista();
  const vista = { x: -v.x / v.z, y: -v.y / v.z, w: l.clientWidth / v.z, h: l.clientHeight / v.z };
  const todo = pzUnion([vista, ...t.elementos.map(pzLimites)]);
  const W = 200, H = 130, s = Math.min(W / todo.w, H / todo.h);
  return { todo, vista, s, ox: (W - todo.w * s) / 2, oy: (H - todo.h * s) / 2 };
}
function pzMinimapa() {
  const mm = document.getElementById('pz-minimapa');
  if (!mm || mm.classList.contains('oculto')) return;
  const t = pzT(), { todo, s, ox, oy } = pzMarcoMinimapa();
  const r = (b) => `left:${ox + (b.x - todo.x) * s}px;top:${oy + (b.y - todo.y) * s}px;width:${Math.max(1.5, b.w * s)}px;height:${Math.max(1.5, b.h * s)}px`;
  mm.innerHTML = t.elementos.map((e) => {
    const c = e.tipo === 'nota' ? e.color : e.tipo === 'forma' ? (e.relleno && e.relleno !== 'transparent' ? e.relleno : e.borde) : e.tipo === 'marco' ? '#ffffff' : e.tipo === 'imagen' ? '#90a4ae' : e.tipo === 'linea' || e.tipo === 'trazo' ? e.color : '#b0bec5';
    return `<div class="pz-mm-el ${e.tipo === 'marco' ? 'marco' : ''}" style="${r(pzLimites(e))};background:${pzColorCSS(c, '#b0bec5')}"></div>`;
  }).join('') + '<div class="pz-mm-vista" id="pz-mm-vista"></div>';
  pzMinimapaVista();
}
function pzMinimapaVista() {
  const el = document.getElementById('pz-mm-vista');
  if (!el) return;
  const { todo, vista, s, ox, oy } = pzMarcoMinimapa();
  Object.assign(el.style, { left: ox + (vista.x - todo.x) * s + 'px', top: oy + (vista.y - todo.y) * s + 'px', width: vista.w * s + 'px', height: vista.h * s + 'px' });
}
function pzMinimapaIr(ev) {
  const mm = document.getElementById('pz-minimapa'), r = mm.getBoundingClientRect();
  const { todo, s, ox, oy } = pzMarcoMinimapa();
  const p = { x: todo.x + (ev.clientX - r.left - ox) / s, y: todo.y + (ev.clientY - r.top - oy) / s };
  const v = pzVista(), l = document.getElementById('pz-lienzo');
  v.x = l.clientWidth / 2 - p.x * v.z; v.y = l.clientHeight / 2 - p.y * v.z;
  pzAplicarVista();
}

// ---------- Selección ----------
function pzSeleccionados() { const t = pzT(); return t ? t.elementos.filter((e) => PZ.sel.has(e.id)) : []; }
function pzSeleccionar(ids, sumar = false) {
  const t = pzT();
  if (PZ.editando && !ids.includes(PZ.editando.id)) pzTerminarEdicion();
  if (!sumar) PZ.sel.clear();
  for (const id of ids) {
    const e = pzEl(id);
    if (!e) continue;
    if (e.g) for (const o of t.elementos) if (o.g === e.g) PZ.sel.add(o.id);
    PZ.sel.add(id);
  }
  pzPintarSel(); pzBarraCtx();
}
function pzPintarSel() {
  const capa = document.getElementById('pz-capa-sel');
  if (!capa) return;
  const sel = pzSeleccionados();
  let html = '';
  for (const g of PZ.guias) html += g.eje === 'x' ? `<div class="pz-guia" style="left:${g.v}px;top:${g.a}px;height:${g.b - g.a}px;width:0"></div>` : `<div class="pz-guia" style="top:${g.v}px;left:${g.a}px;width:${g.b - g.a}px;height:0"></div>`;
  if (PZ.objetivo) { const o = pzEl(PZ.objetivo); if (o) { const b = pzLimites(o); html += `<div class="pz-objetivo" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"></div>`; } }
  if (sel.length === 1 && sel[0].tipo === 'linea') {
    const g = pzGeoLinea(sel[0]);
    html += `<div class="pz-asa pz-asa-punto" data-h="p1" style="left:${g.p1.x}px;top:${g.p1.y}px"></div><div class="pz-asa pz-asa-punto" data-h="p2" style="left:${g.p2.x}px;top:${g.p2.y}px"></div>`;
  } else if (sel.length === 1) {
    const e = sel[0];
    const editando = PZ.editando?.id === e.id;
    const soloEsquinas = ['imagen', 'sello'].includes(e.tipo);
    const asas = e.bloqueado || editando ? [] : (soloEsquinas ? ['no', 'ne', 'se', 'so'] : ['no', 'n', 'ne', 'e', 'se', 's', 'so', 'o']);
    html += `<div class="pz-selcaja ${e.bloqueado ? 'bloq' : ''}" style="left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;${e.rot ? `transform:rotate(${e.rot}deg)` : ''}">
      ${asas.map((h) => `<div class="pz-asa pz-asa-${h}" data-h="${h}"></div>`).join('')}
      ${!e.bloqueado && !editando && e.tipo !== 'marco' ? '<div class="pz-asa pz-asa-rot" data-h="rot" title="Girar (Shift: de 15° en 15°)">⟳</div>' : ''}
      ${!e.bloqueado && !editando && ['nota', 'forma', 'texto', 'imagen', 'sello', 'tabla'].includes(e.tipo) && !PZ.presentando ? ['n', 'e', 's', 'o'].map((l) => `<div class="pz-conector pz-conector-${l}" data-h="con-${l}" title="Arrastra para conectar · clic para crear otra conectada"></div>`).join('') : ''}
      ${e.bloqueado ? '<div class="pz-candado">🔒</div>' : ''}</div>`;
  } else if (sel.length > 1) {
    for (const e of sel) { const b = pzLimites(e); html += `<div class="pz-selmarca" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"></div>`; }
    const b = pzUnion(sel.map(pzLimites));
    const bloq = sel.some((e) => e.bloqueado);
    html += `<div class="pz-selcaja multi" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px">${bloq ? '' : ['no', 'ne', 'se', 'so'].map((h) => `<div class="pz-asa pz-asa-${h}" data-h="${h}"></div>`).join('')}</div>`;
  }
  if (PZ.arr?.tipo === 'marquesina' && PZ.arr.rect) { const r = PZ.arr.rect; html += `<div class="pz-marquesina" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"></div>`; }
  if (PZ.arr?.vista) html += PZ.arr.vista;
  capa.innerHTML = html;
  pzPosicionarCtx();
}

// ---------- Historial (deshacer / rehacer) ----------
function pzFoto() { const t = pzT(); return JSON.stringify({ elementos: t.elementos, fondo: t.fondo }); }
function pzAntes() {
  PZ.deshacer.push(pzFoto());
  if (PZ.deshacer.length > 120) PZ.deshacer.shift();
  PZ.rehacer = [];
  pzRefrescarHerramientas();
}
function pzRestaurar(foto) {
  const t = pzT(), d = JSON.parse(foto);
  t.elementos = d.elementos; t.fondo = d.fondo;
  for (const id of [...PZ.sel]) if (!pzEl(id)) PZ.sel.delete(id);
  PZ.cacheAjuste.clear();
  pzGuardar(); pzPintar(); pzAplicarVista(); pzBarraCtx(); pzRefrescarHerramientas();
}
function pzDeshacer() {
  pzTerminarEdicion();
  const f = PZ.deshacer.pop();
  if (!f) return;
  PZ.rehacer.push(pzFoto());
  pzRestaurar(f);
}
function pzRehacer() {
  pzTerminarEdicion();
  const f = PZ.rehacer.pop();
  if (!f) return;
  PZ.deshacer.push(pzFoto());
  pzRestaurar(f);
}
function pzGuardar() { const t = pzT(); if (t) { t.modificada = new Date().toISOString(); guardar(); } }

// ---------- Crear elementos ----------
function pzAgregar(e, { seleccionar = true, editar = false } = {}) {
  const t = pzT();
  if (e.tipo === 'marco') t.elementos.unshift(e); else t.elementos.push(e);
  const capa = document.getElementById(e.tipo === 'marco' ? 'pz-capa-marcos' : 'pz-capa-el');
  if (capa) {
    if (e.tipo === 'marco') capa.insertAdjacentHTML('beforeend', pzHTML(e)); else capa.insertAdjacentHTML('beforeend', pzHTML(e));
    if (pzTieneTexto(e) || e.tipo === 'tabla') pzAjustarTexto(e);
  }
  if (seleccionar) { PZ.sel = new Set([e.id]); pzPintarSel(); pzBarraCtx(); }
  pzMinimapa();
  if (editar) pzEditar(e.id, { seleccionarTodo: false });
  return e;
}
function pzCrearEn(tipo, p, tam, extra = {}) {
  const e = pzNuevoElemento(tipo, extra);
  if (tam) { e.w = Math.max(20, tam.w); e.h = Math.max(tipo === 'texto' ? 30 : 20, tam.h); e.x = tam.x; e.y = tam.y; } else { e.x = p.x - e.w / 2; e.y = p.y - e.h / 2; }
  if (tipo === 'texto' && !tam) { e.x = p.x; e.y = p.y - 16; }
  if (tipo === 'forma' && ['elipse', 'estrella', 'pentagono', 'hexagono', 'octagono', 'corazon', 'cruz', 'rombo'].includes(e.forma) && !tam) { e.w = 140; e.h = 140; e.x = p.x - 70; e.y = p.y - 70; }
  return e;
}

// ---------- Edición de texto ----------
function pzNodoEdicion() {
  if (!PZ.editando) return null;
  const n = pzNodo(PZ.editando.id);
  if (!n) return null;
  return PZ.editando.celda ? n.querySelector(`.pz-celda[data-celda="${PZ.editando.celda}"]`) : n.querySelector('.pz-txt-in');
}
function pzEditar(id, { seleccionarTodo = true, celda = null } = {}) {
  pzTerminarEdicion();
  const e = pzEl(id);
  if (!e || e.bloqueado || !(pzTieneTexto(e) || e.tipo === 'tabla')) return;
  if (e.tipo === 'tabla' && !celda) celda = '0,0';
  pzAntes();
  PZ.editando = { id, celda };
  PZ.sel = new Set([id]);
  const inn = pzNodoEdicion();
  if (!inn) { PZ.editando = null; return; }
  PZ.htmlInicial = inn.innerHTML;
  pzNodo(id).classList.add('pz-editando');
  inn.contentEditable = 'true';
  inn.spellcheck = true;
  inn.focus({ preventScroll: true });
  try { document.execCommand('styleWithCSS', false, true); document.execCommand('defaultParagraphSeparator', false, 'div'); } catch (err) { /* sin soporte */ }
  const s = window.getSelection(), r = document.createRange();
  r.selectNodeContents(inn);
  if (!seleccionarTodo) r.collapse(false);
  s.removeAllRanges(); s.addRange(r);
  PZ.rango = r.cloneRange();
  pzAjustarTexto(e);
  pzPintarSel(); pzBarraCtx();
}
function pzTerminarEdicion() {
  if (!PZ.editando) return;
  const { id, celda } = PZ.editando;
  const inn = pzNodoEdicion();
  PZ.editando = null; PZ.rango = null;
  const e = pzEl(id);
  if (!e) return;
  pzNodo(id)?.classList.remove('pz-editando');
  if (inn) {
    inn.contentEditable = 'false';
    const html = pzLimpiarHTML(inn.innerHTML).replace(/^(<br>)+$/, '');
    if (celda) { const [r, c] = celda.split(',').map(Number); if (e.celdas[r]) e.celdas[r][c] = html; } else e.html = html;
    if (inn.innerHTML === PZ.htmlInicial && PZ.deshacer.length) { PZ.deshacer.pop(); pzRefrescarHerramientas(); }
  }
  window.getSelection()?.removeAllRanges();
  if (e.tipo === 'texto' && !pzTextoPlano(e.html)) { pzEliminarIds([id], false); return; }
  pzGuardar();
  pzRefrescar([id]);
  pzBarraCtx();
}
function pzAlEscribir() {
  if (!PZ.editando) return;
  const e = pzEl(PZ.editando.id), inn = pzNodoEdicion();
  if (!e || !inn) return;
  pzArreglarTamanos(inn, e);
  if (PZ.editando.celda) { const [r, c] = PZ.editando.celda.split(',').map(Number); e.celdas[r][c] = inn.innerHTML; } else e.html = inn.innerHTML;
  const hAntes = e.h;
  pzAjustarTexto(e);
  if (e.h !== hAntes) { pzPintarSel(); for (const l of pzT().elementos) if (l.tipo === 'linea' && (l.desde?.id === e.id || l.hasta?.id === e.id)) pzReemplazarNodo(l); }
  pzGuardar();
}
// Convierte los tamaños aplicados con execCommand en tamaños relativos (em) para que el ajuste automático los escale
function pzArreglarTamanos(inn, e) {
  const base = e.estilo.tam || 24;
  for (const n of inn.querySelectorAll('font[size="7"], span[style*="xxx-large"], font[size]')) {
    const em = n.tagName === 'FONT' && n.getAttribute('size') !== '7' ? null : (PZ.tamPendiente / base);
    const span = n.tagName === 'FONT' ? document.createElement('span') : n;
    if (n.tagName === 'FONT') {
      if (n.color) span.style.color = n.color;
      if (n.face) span.style.fontFamily = n.face;
      span.append(...n.childNodes);
      n.replaceWith(span);
    }
    if (em) {
      span.style.fontSize = `${+em.toFixed(4)}em`;
      for (const d of span.querySelectorAll('[style*="font-size"]')) d.style.removeProperty('font-size');
    }
  }
}
function pzGuardarRango() {
  const inn = pzNodoEdicion(), s = window.getSelection();
  if (inn && s.rangeCount && inn.contains(s.getRangeAt(0).commonAncestorContainer)) PZ.rango = s.getRangeAt(0).cloneRange();
}
function pzRestaurarRango() {
  const inn = pzNodoEdicion();
  if (!inn) return false;
  if (document.activeElement !== inn) inn.focus({ preventScroll: true });
  if (PZ.rango && inn.contains(PZ.rango.commonAncestorContainer)) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(PZ.rango); }
  return true;
}
function pzRangoVacio() { const s = window.getSelection(); return !s.rangeCount || s.getRangeAt(0).collapsed; }
// Envuelve el texto seleccionado en un span con estilos (espaciado, mayúsculas, contorno…)
function pzEnvolver(estilos) {
  const s = window.getSelection();
  if (!s.rangeCount) return;
  const r = s.getRangeAt(0);
  const frag = r.extractContents();
  const props = Object.keys(estilos).map((k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()));
  for (const n of frag.querySelectorAll?.('[style]') || []) for (const p of props) n.style.removeProperty(p);
  const span = document.createElement('span');
  Object.assign(span.style, estilos);
  span.appendChild(frag);
  r.insertNode(span);
  const nr = document.createRange();
  nr.selectNodeContents(span);
  s.removeAllRanges(); s.addRange(nr);
  PZ.rango = nr.cloneRange();
}

// Aplica un formato. Si se está escribiendo y hay letras seleccionadas, solo a esas letras; si no, a todo el elemento.
function pzFormato(cmd, valor) {
  if (PZ.editando) {
    const e = pzEl(PZ.editando.id);
    pzRestaurarRango();
    const vacio = pzRangoVacio();
    const exec = (c, v = null) => document.execCommand(c, false, v);
    const porLetra = {
      negrita: () => exec('bold'), cursiva: () => exec('italic'), subrayado: () => exec('underline'), tachado: () => exec('strikeThrough'),
      sub: () => exec('subscript'), sup: () => exec('superscript'), lista: () => exec('insertUnorderedList'), listaNum: () => exec('insertOrderedList'),
      sangria: () => exec('indent'), quitarSangria: () => exec('outdent'),
      color: () => exec('foreColor', valor), resaltado: () => exec('hiliteColor', valor === 'transparent' ? 'transparent' : valor),
      fuente: () => { exec('fontName', valor); pzRecordarFuente(valor); },
      tam: () => { PZ.tamPendiente = valor; exec('fontSize', '7'); },
      alinH: () => exec({ left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' }[valor]),
      borrar: () => { exec('removeFormat'); exec('unlink'); },
    };
    const soloSeleccion = { espaciado: { letterSpacing: valor + 'px' }, mayus: { textTransform: valor }, contorno: { webkitTextStroke: valor ? `${valor}px currentColor` : '' }, sombra: { textShadow: valor ? '2px 2px 3px rgba(0,0,0,.35)' : '' } };
    if (porLetra[cmd] && (!vacio || ['negrita', 'cursiva', 'subrayado', 'tachado', 'color', 'resaltado', 'fuente', 'tam', 'sub', 'sup', 'lista', 'listaNum', 'sangria', 'quitarSangria', 'alinH'].includes(cmd))) {
      porLetra[cmd]();
      pzAlEscribir(); pzGuardarRango(); pzBarraCtx();
      return;
    }
    if (soloSeleccion[cmd] && !vacio) { pzEnvolver(soloSeleccion[cmd]); pzAlEscribir(); pzBarraCtx(); return; }
    // Formato del elemento completo mientras se escribe
    const inn = pzNodoEdicion();
    const antes = JSON.stringify([e.html, e.celdas]);
    pzFormatoElemento([e], cmd, valor);
    if (inn && JSON.stringify([e.html, e.celdas]) !== antes) {
      if (PZ.editando.celda) { const [r, c] = PZ.editando.celda.split(',').map(Number); inn.innerHTML = e.celdas[r][c]; } else inn.innerHTML = e.html;
    }
    pzRefrescarEstiloEdicion(e, inn);
    pzBarraCtx();
    return;
  }
  const sel = pzSeleccionados().filter((e) => pzTieneTexto(e) || e.tipo === 'tabla');
  if (!sel.length) return;
  pzAntes();
  pzFormatoElemento(sel, cmd, valor);
  pzGuardar(); pzRefrescar(sel.map((e) => e.id)); pzBarraCtx();
}
function pzFormatoElemento(lista, cmd, valor) {
  const todos = (k) => lista.every((e) => e.estilo[k]);
  const quitar = (e, prop) => {
    if (e.tipo === 'tabla') e.celdas = e.celdas.map((f) => f.map((c) => pzQuitarFormato(c, prop)));
    else e.html = pzQuitarFormato(e.html, prop);
  };
  const alternar = { negrita: ['negrita', 'font-weight'], cursiva: ['cursiva', 'font-style'], subrayado: ['subrayado', 'text-decoration'], tachado: ['tachado', 'text-decoration'] }[cmd];
  if (alternar) { const v = !todos(alternar[0]); for (const e of lista) { e.estilo[alternar[0]] = v; quitar(e, alternar[1]); } return; }
  for (const e of lista) {
    const s = e.estilo;
    switch (cmd) {
      case 'color': s.color = valor; quitar(e, 'color'); break;
      case 'resaltado': quitar(e, 'background-color'); if (valor !== 'transparent') { if (e.tipo === 'tabla') e.celdas = e.celdas.map((f) => f.map((c) => c ? `<span style="background-color:${valor}">${c}</span>` : c)); else if (e.html) e.html = `<span style="background-color:${valor}">${e.html}</span>`; } break;
      case 'fuente': s.fuente = valor; quitar(e, 'font-family'); pzRecordarFuente(valor); break;
      case 'tam': s.tam = valor; quitar(e, 'font-size'); if (e.ajuste === 'llenar') e.ajuste = 'auto'; break;
      case 'alinH': s.alinH = valor; quitar(e, 'text-align'); break;
      case 'alinV': s.alinV = valor; break;
      case 'interlineado': s.interlineado = valor; break;
      case 'espaciado': s.espaciado = valor; quitar(e, 'letter-spacing'); break;
      case 'mayus': if (e.tipo === 'tabla') break; quitar(e, 'text-transform'); if (valor !== 'none') e.html = e.html ? `<span style="text-transform:${valor}">${e.html}</span>` : e.html; break;
      case 'ajuste': e.ajuste = valor; break;
      case 'borrar': Object.assign(s, { negrita: false, cursiva: false, subrayado: false, tachado: false, espaciado: 0 }); quitar(e, '*'); break;
      case 'lista': case 'listaNum': {
        if (e.tipo === 'tabla') break;
        const tag = cmd === 'lista' ? 'ul' : 'ol';
        const lineas = pzTextoPlano(e.html).split('\n').filter((l) => l.trim());
        const yaEs = new RegExp(`^<${tag}>`).test(e.html || '');
        e.html = yaEs ? pzTextoAHTML(lineas.join('\n')) : `<${tag}>${lineas.map((l) => `<li>${esc(l)}</li>`).join('')}</${tag}>`;
        if (!yaEs) s.alinH = 'left';
        break;
      }
    }
  }
}
function pzRefrescarEstiloEdicion(e, inn) {
  // Mientras se escribe solo se actualizan los estilos del contenedor (sin perder el cursor)
  if (!inn) return;
  const s = e.estilo, nodo = pzNodo(e.id), caja = nodo.querySelector('.pz-txt');
  if (e.tipo === 'tabla') {
    const tb = nodo.querySelector('table');
    Object.assign(tb.style, { fontFamily: pzFamilia(s.fuente), fontSize: s.tam + 'px', color: s.color, textAlign: s.alinH, lineHeight: s.interlineado });
    pzAjustarTexto(e); pzGuardar(); return;
  }
  Object.assign(inn.style, { fontFamily: pzFamilia(s.fuente), color: s.color, textAlign: s.alinH, lineHeight: s.interlineado, letterSpacing: (s.espaciado || 0) + 'px',
    fontWeight: s.negrita ? '700' : '', fontStyle: s.cursiva ? 'italic' : '', textDecoration: [s.subrayado && 'underline', s.tachado && 'line-through'].filter(Boolean).join(' ') });
  if (caja) caja.style.justifyContent = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[s.alinV];
  inn.classList.toggle('pz-cortar', e.ajuste === 'fijo');
  PZ.cacheAjuste.delete(e.id);
  pzAjustarTexto(e); pzPintarSel(); pzGuardar();
}
function pzRecordarFuente(f) {
  const c = S.config.pizarra = S.config.pizarra || {};
  c.recientes = [f, ...(c.recientes || []).filter((x) => x !== f)].slice(0, 8);
}
// Estado del formato donde está el cursor (para la barra)
function pzEstadoFormato(e) {
  const s = e.estilo || {};
  const st = { fuente: s.fuente, tam: s.tam, color: s.color, negrita: s.negrita, cursiva: s.cursiva, subrayado: s.subrayado, tachado: s.tachado, alinH: s.alinH, sub: false, sup: false };
  const inn = pzNodoEdicion();
  if (!inn) return st;
  const sel = window.getSelection();
  let nodo = sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
  if (nodo && nodo.nodeType === 3) nodo = nodo.parentElement;
  if (!nodo || !inn.contains(nodo)) return st;
  const cs = getComputedStyle(nodo);
  const escala = (s.tam || 24) / (parseFloat(inn.style.fontSize) || s.tam || 24);
  st.tam = Math.round(parseFloat(cs.fontSize) * escala * 2) / 2;
  st.fuente = cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  st.color = pzRgbAHex(cs.color);
  try {
    st.negrita = document.queryCommandState('bold'); st.cursiva = document.queryCommandState('italic');
    st.subrayado = document.queryCommandState('underline'); st.tachado = document.queryCommandState('strikeThrough');
    st.sub = document.queryCommandState('subscript'); st.sup = document.queryCommandState('superscript');
  } catch (err) { /* sin soporte */ }
  return st;
}
function pzRgbAHex(c) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || '');
  return m ? '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('') : c;
}

// ---------- Barra contextual ----------
function pzBarraCtx() {
  const ctx = document.getElementById('pz-ctx');
  if (!ctx) return;
  const sel = pzSeleccionados();
  let html = '';
  if (!sel.length) {
    if (PZ.herramienta === 'lapiz' || PZ.herramienta === 'resaltador') html = pzCtxLapiz();
    else if (PZ.herramienta === 'nota') html = `<span class="pz-ctx-tit">Color de la nota</span>${PZ_COLORES_NOTA.slice(0, 14).map((c) => `<button class="pz-muestra ${PZ.notaColor === c ? 'activo' : ''}" style="background:${c}" onpointerdown="event.preventDefault()" onclick="PZ.notaColor='${c}';pzBarraCtx()"></button>`).join('')}`;
  } else {
    const tipos = new Set(sel.map((e) => e.tipo));
    const uno = sel.length === 1 ? sel[0] : null;
    const partes = [];
    const conTexto = sel.filter((e) => pzTieneTexto(e) || e.tipo === 'tabla');
    if (uno?.tipo === 'nota' || (tipos.size === 1 && tipos.has('nota'))) partes.push(pzBotonColor('relleno', sel[0].color, 'Color de la nota', '🎨', PZ_COLORES_NOTA));
    if (tipos.has('forma') && tipos.size === 1) {
      partes.push(`<button class="pz-b" title="Cambiar forma" onpointerdown="event.preventDefault()" onclick="pzMenuFormas(this, true)">${pzIcoForma(sel[0].forma)}</button>`);
      partes.push(pzBotonColor('relleno', sel[0].relleno, 'Relleno', '🪣', null, true));
      partes.push(pzBotonColor('borde', sel[0].borde, 'Color del borde', '▢', null, true));
      partes.push(pzBotonGrosor(sel[0]));
    }
    if (conTexto.length && conTexto.length === sel.length) partes.push(pzCtxTexto(conTexto[0]));
    if (tipos.has('texto') && tipos.size === 1) partes.push(pzBotonColor('fondoTexto', sel[0].fondo || 'transparent', 'Fondo del texto', '🖌️', null, true));
    if (uno?.tipo === 'tabla') partes.push(pzCtxTabla(uno));
    if (uno?.tipo === 'linea' || (tipos.size === 1 && tipos.has('linea'))) partes.push(pzCtxLinea(sel[0]));
    if (tipos.size === 1 && tipos.has('trazo')) partes.push(pzBotonColor('trazo', sel[0].color, 'Color del trazo', '✏️'), pzBotonGrosor(sel[0]));
    if (uno?.tipo === 'imagen') partes.push(pzCtxImagen(uno));
    if (uno?.tipo === 'marco') partes.push(`<input class="pz-ctx-input" value="${esc(uno.titulo)}" title="Título del marco" oninput="pzPropiedad('titulo', this.value, true)" onkeydown="event.stopPropagation()">`, pzBotonColor('relleno', uno.color, 'Fondo del marco', '🎨', null, true), `<button class="pz-b" onclick="pzPresentar('${uno.id}')" title="Presentar desde este marco">▶</button>`);
    if (uno?.tipo === 'sello') partes.push(`<button class="pz-b" onclick="pzMenuSellos(this, true)" title="Cambiar sello">${esc(uno.emoji)}</button>`);
    if (sel.length > 1) partes.push(pzCtxAlinear(sel));
    partes.push(pzCtxComun(sel));
    html = partes.filter(Boolean).join('<span class="pz-sep"></span>');
  }
  ctx.innerHTML = html;
  ctx.classList.toggle('oculto', !html || !!PZ.arr?.movido);
  pzPosicionarCtx();
}
function pzPosicionarCtx() {
  const ctx = document.getElementById('pz-ctx'), area = document.getElementById('pz-area');
  if (!ctx || ctx.classList.contains('oculto') || !area) return;
  const sel = pzSeleccionados();
  const aw = area.clientWidth;
  if (!sel.length) { ctx.style.left = Math.max(70, (aw - ctx.offsetWidth) / 2) + 'px'; ctx.style.top = '12px'; return; }
  const b = pzUnion(sel.map(pzLimites));
  const v = pzVista(), herr = document.getElementById('pz-herr');
  const izq = (herr?.offsetWidth || 0) + 8;
  const sx = b.x * v.z + v.x + izq, sy = b.y * v.z + v.y, sh = b.h * v.z, sw = b.w * v.z;
  let top = sy - ctx.offsetHeight - 44; // por encima de las asas
  if (top < 8) top = sy + sh + 40;
  if (top + ctx.offsetHeight > area.clientHeight - 8) top = 8;
  const left = Math.min(aw - ctx.offsetWidth - 8, Math.max(izq + 4, sx + sw / 2 - ctx.offsetWidth / 2));
  ctx.style.left = left + 'px'; ctx.style.top = top + 'px';
}
function pzBotonColor(prop, actual, titulo, ico, paleta = null, transparente = false) {
  const c = pzColorCSS(actual, 'transparent');
  return `<button class="pz-b pz-b-color" title="${titulo}" onpointerdown="event.preventDefault()" onclick="pzPopColor(this,'${prop}',${transparente},${paleta ? 'true' : 'false'})"><span>${ico}</span><i style="background:${c === 'transparent' ? 'repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 50%/8px 8px' : c}"></i></button>`;
}
function pzBotonGrosor(e) {
  return `<select class="pz-ctx-sel" title="Grosor" onchange="pzPropiedad('grosor', +this.value)">${[0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32].map((g) => `<option value="${g}" ${+e.grosor === g ? 'selected' : ''}>${g ? g + ' px' : 'Sin borde'}</option>`).join('')}</select>
    ${e.tipo === 'forma' ? `<select class="pz-ctx-sel" title="Estilo del borde" onchange="pzPropiedad('trazo', this.value)">${[['solido', '━━ Continuo'], ['guiones', '╍╍ Guiones'], ['puntos', '┈┈ Puntos']].map(([k, t]) => `<option value="${k}" ${e.trazo === k ? 'selected' : ''}>${t}</option>`).join('')}</select>` : ''}`;
}
function pzCtxTexto(e) {
  const st = PZ.editando ? pzEstadoFormato(e) : { ...e.estilo };
  const pd = 'onpointerdown="event.preventDefault()"';
  const b = (cmd, ico, t, act, valor) => `<button class="pz-b ${act ? 'activo' : ''}" title="${t}" ${pd} onclick="pzFormato('${cmd}'${valor !== undefined ? `,'${valor}'` : ''})">${ico}</button>`;
  return `<button class="pz-b pz-fuente" title="Fuente (todas las fuentes del sistema)" ${pd} onclick="pzPopFuentes(this)" style="font-family:${pzFamilia(st.fuente)}">${esc(st.fuente || 'Fuente')} ▾</button>
    <span class="pz-tam"><button class="pz-b" ${pd} onclick="pzCambiarTam(-1)" title="Reducir letra">A−</button><button class="pz-b pz-tam-num" ${pd} onclick="pzPopTamano(this)" title="Tamaño de letra">${st.tam || ''}</button><button class="pz-b" ${pd} onclick="pzCambiarTam(1)" title="Aumentar letra">A+</button></span>
    ${b('negrita', '<b>B</b>', 'Negrita (Ctrl+B)', st.negrita)}${b('cursiva', '<i>I</i>', 'Cursiva (Ctrl+I)', st.cursiva)}${b('subrayado', '<u>U</u>', 'Subrayado (Ctrl+U)', st.subrayado)}${b('tachado', '<s>S</s>', 'Tachado', st.tachado)}
    ${pzBotonColor('textoColor', st.color, 'Color de la letra', '<b style="font-family:Georgia">A</b>')}
    ${pzBotonColor('textoResaltado', 'transparent', 'Resaltar (color de fondo de las letras)', '🖍', null, true)}
    <button class="pz-b" title="Alineación" ${pd} onclick="pzPopAlineacion(this)">${{ left: '⯇≡', center: '≡', right: '≡⯈', justify: '☰' }[st.alinH] || '≡'}</button>
    <button class="pz-b" title="Más formato: listas, subíndice, espaciado, mayúsculas, ajuste del texto…" ${pd} onclick="pzPopMasTexto(this)">Aa ▾</button>
    ${e.tipo !== 'tabla' ? `<select class="pz-ctx-sel" title="Ajuste del texto a la caja" onpointerdown="pzGuardarRango()" onchange="pzFormato('ajuste', this.value)">${Object.entries(PZ_AJUSTES).filter(([k]) => e.tipo === 'texto' || k !== 'crecer' || e.ajuste === 'crecer').map(([k, t]) => `<option value="${k}" ${e.ajuste === k ? 'selected' : ''}>↕ ${t}</option>`).join('')}</select>` : ''}`;
}
function pzCambiarTam(d) {
  const e = PZ.editando ? pzEl(PZ.editando.id) : pzSeleccionados().find((x) => pzTieneTexto(x) || x.tipo === 'tabla');
  if (!e) return;
  const actual = PZ.editando ? pzEstadoFormato(e).tam : e.estilo.tam;
  const sig = d > 0 ? PZ_TAMANOS.find((t) => t > actual + 0.1) || actual + 8 : [...PZ_TAMANOS].reverse().find((t) => t < actual - 0.1) || Math.max(4, actual - 2);
  pzFormato('tam', sig);
}
function pzCtxLinea(e) {
  return `${pzBotonColor('linea', e.color, 'Color', '🎨')}
    <select class="pz-ctx-sel" title="Grosor" onchange="pzPropiedad('grosor', +this.value)">${[1, 2, 3, 4, 6, 8, 12].map((g) => `<option value="${g}" ${+e.grosor === g ? 'selected' : ''}>${g} px</option>`).join('')}</select>
    <select class="pz-ctx-sel" title="Estilo" onchange="pzPropiedad('trazo', this.value)">${[['solido', '━━'], ['guiones', '╍╍'], ['puntos', '┈┈']].map(([k, t]) => `<option value="${k}" ${e.trazo === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <select class="pz-ctx-sel" title="Tipo de conector" onchange="pzPropiedad('ruta', this.value)">${[['recta', '╱ Recta'], ['curva', '∿ Curva'], ['codo', '┐ En ángulo']].map(([k, t]) => `<option value="${k}" ${e.ruta === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <select class="pz-ctx-sel" title="Punta inicial" onchange="pzPropiedad('inicio', this.value)">${Object.entries(PZ_PUNTAS).map(([k, t]) => `<option value="${k}" ${e.inicio === k ? 'selected' : ''}>◀ ${t}</option>`).join('')}</select>
    <select class="pz-ctx-sel" title="Punta final" onchange="pzPropiedad('fin', this.value)">${Object.entries(PZ_PUNTAS).map(([k, t]) => `<option value="${k}" ${e.fin === k ? 'selected' : ''}>${t} ▶</option>`).join('')}</select>
    <button class="pz-b" title="Invertir dirección" onclick="pzInvertirLinea()">⇄</button>
    <input class="pz-ctx-input" style="width:130px" value="${esc(e.texto || '')}" placeholder="Etiqueta…" title="Texto sobre el conector" oninput="pzPropiedad('texto', this.value, true)" onkeydown="event.stopPropagation()">`;
}
function pzCtxLapiz() {
  const h = PZ[PZ.herramienta];
  const colores = PZ.herramienta === 'resaltador' ? ['#ffeb3b', '#a5d6a7', '#81d4fa', '#f48fb1', '#ffcc80', '#ce93d8'] : ['#1d2533', '#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#ffffff'];
  const grosores = PZ.herramienta === 'resaltador' ? [12, 22, 34] : [2, 4, 8, 14];
  return `<span class="pz-ctx-tit">${PZ.herramienta === 'resaltador' ? 'Resaltador' : 'Lápiz'}</span>${colores.map((c) => `<button class="pz-muestra ${h.color === c ? 'activo' : ''}" style="background:${c}" onclick="PZ['${PZ.herramienta}'].color='${c}';pzBarraCtx()"></button>`).join('')}
    <label class="pz-muestra pz-mas-color" title="Otro color"><input type="color" value="${h.color}" oninput="PZ['${PZ.herramienta}'].color=this.value"></label><span class="pz-sep"></span>
    ${grosores.map((g) => `<button class="pz-b ${h.grosor === g ? 'activo' : ''}" title="${g} px" onclick="PZ['${PZ.herramienta}'].grosor=${g};pzBarraCtx()"><span class="pz-punto" style="width:${Math.min(20, g)}px;height:${Math.min(20, g)}px;background:${h.color}"></span></button>`).join('')}`;
}
function pzCtxImagen(e) {
  return `<button class="pz-b" title="Recortar" onclick="pzRecortar('${e.id}')">✂️ Recortar</button>
    <button class="pz-b" title="Ajustes de color" onclick="pzPopFiltros(this)">🎚️ Ajustes</button>
    <button class="pz-b ${e.voltearH ? 'activo' : ''}" title="Voltear horizontal" onclick="pzPropiedad('voltearH', ${!e.voltearH})">⇋</button>
    <button class="pz-b ${e.voltearV ? 'activo' : ''}" title="Voltear vertical" onclick="pzPropiedad('voltearV', ${!e.voltearV})">⇵</button>
    <select class="pz-ctx-sel" title="Forma de la imagen" onchange="pzPropiedad('recForma', this.value)">${[['rect', '▭ Rectangular'], ['redondeado', '▢ Redondeada'], ['circulo', '◯ Círculo']].map(([k, t]) => `<option value="${k}" ${e.recForma === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
    ${pzBotonColor('bordeImagen', e.borde || '#000000', 'Color del borde', '▢')}
    <select class="pz-ctx-sel" title="Grosor del borde" onchange="pzPropiedad('grosor', +this.value)">${[0, 1, 2, 4, 6, 10, 16].map((g) => `<option value="${g}" ${+e.grosor === g ? 'selected' : ''}>${g ? g + ' px' : 'Sin borde'}</option>`).join('')}</select>
    <button class="pz-b ${e.sombra ? 'activo' : ''}" title="Sombra" onclick="pzPropiedad('sombra', ${!e.sombra})">◩</button>
    <button class="pz-b" title="Reemplazar imagen" onclick="pzElegirImagen('${e.id}')">🔁</button>
    <button class="pz-b" title="Tamaño original" onclick="pzTamanoOriginal('${e.id}')">1:1</button>`;
}
function pzCtxTabla(e) {
  return `<button class="pz-b" title="Agregar fila" onclick="pzTablaOp('${e.id}','+fila')">＋ Fila</button><button class="pz-b" title="Agregar columna" onclick="pzTablaOp('${e.id}','+col')">＋ Col</button>
    <button class="pz-b" title="Quitar última fila" onclick="pzTablaOp('${e.id}','-fila')">− Fila</button><button class="pz-b" title="Quitar última columna" onclick="pzTablaOp('${e.id}','-col')">− Col</button>
    <button class="pz-b ${e.encabezado ? 'activo' : ''}" title="Fila de encabezado" onclick="pzPropiedad('encabezado', ${!e.encabezado})">Encabezado</button>
    ${pzBotonColor('colorEnc', e.colorEnc, 'Color del encabezado', '▤')}${pzBotonColor('relleno', e.relleno, 'Fondo de la tabla', '🪣', null, true)}${pzBotonColor('bordeTabla', e.borde, 'Color de las líneas', '▦')}`;
}
function pzCtxAlinear(sel) {
  const b = (k, ico, t) => `<button class="pz-b" title="${t}" onclick="pzAlinear('${k}')">${ico}</button>`;
  return b('izq', '⇤', 'Alinear a la izquierda') + b('centroH', '⇹', 'Centrar horizontalmente') + b('der', '⇥', 'Alinear a la derecha')
    + b('arriba', '⤒', 'Alinear arriba') + b('centroV', '⇕', 'Centrar verticalmente') + b('abajo', '⤓', 'Alinear abajo')
    + (sel.length > 2 ? b('distH', '⋯', 'Distribuir horizontalmente') + b('distV', '⋮', 'Distribuir verticalmente') : '')
    + b('igualar', '▣', 'Igualar tamaño al primero')
    + (sel.some((e) => !e.g) || new Set(sel.map((e) => e.g)).size > 1 ? b('agrupar', '⧉', 'Agrupar (Ctrl+G)') : b('desagrupar', '⧈', 'Desagrupar (Ctrl+Shift+G)'));
}
function pzCtxComun(sel) {
  const bloq = sel.every((e) => e.bloqueado);
  const op = sel.length === 1 ? (sel[0].opacidad ?? 1) : 1;
  return `<button class="pz-b" title="Transparencia" onclick="pzPopOpacidad(this)">◐ ${Math.round(op * 100)}%</button>
    <button class="pz-b" title="Traer al frente (Ctrl+Shift+])" onclick="pzOrden('frente')">⬆</button><button class="pz-b" title="Enviar al fondo (Ctrl+Shift+[)" onclick="pzOrden('fondo')">⬇</button>
    <button class="pz-b" title="Duplicar (Ctrl+D)" onclick="pzDuplicar()">⧉</button>
    <button class="pz-b ${bloq ? 'activo' : ''}" title="${bloq ? 'Desbloquear' : 'Bloquear (no se mueve ni se edita)'} (Ctrl+Shift+L)" onclick="pzBloquear()">${bloq ? '🔒' : '🔓'}</button>
    <button class="pz-b" title="Eliminar (Supr)" onclick="pzEliminar()">🗑️</button>`;
}

// Cambia una propiedad de los elementos seleccionados
function pzPropiedad(prop, valor, suave = false) {
  const sel = pzSeleccionados();
  if (!sel.length) return;
  if (!suave || !PZ.ultimaProp || PZ.ultimaProp !== prop + [...PZ.sel].join()) pzAntes();
  PZ.ultimaProp = suave ? prop + [...PZ.sel].join() : null;
  for (const e of sel) {
    if (prop === 'grosor' && !['forma', 'linea', 'trazo', 'imagen'].includes(e.tipo)) continue;
    if (prop === 'forma' && e.tipo !== 'forma') continue;
    e[prop] = valor;
  }
  pzGuardar();
  pzRefrescar(sel.map((e) => e.id));
  if (!suave) pzBarraCtx(); else pzPosicionarCtx();
}
function pzAplicarColor(destino, c) {
  const sel = pzSeleccionados();
  const mapa = { relleno: (e) => (e.tipo === 'nota' || e.tipo === 'marco' ? 'color' : 'relleno'), borde: () => 'borde', linea: () => 'color', trazo: () => 'color', fondoTexto: () => 'fondo', colorEnc: () => 'colorEnc', bordeTabla: () => 'borde', bordeImagen: () => 'borde' };
  if (destino === 'textoColor') { pzFormato('color', c); return; }
  if (destino === 'textoResaltado') { pzFormato('resaltado', c); return; }
  if (!sel.length) return;
  pzAntes();
  for (const e of sel) {
    const k = mapa[destino](e);
    e[k] = c === 'transparent' && k === 'fondo' ? '' : c;
    if (destino === 'bordeImagen' && !e.grosor) e.grosor = 3;
    if (destino === 'borde' && e.tipo === 'forma' && !e.grosor) e.grosor = 2;
  }
  if (destino === 'relleno' && sel[0].tipo === 'nota') PZ.notaColor = c;
  pzGuardar(); pzRefrescar(sel.map((e) => e.id)); pzBarraCtx();
}
function pzInvertirLinea() {
  const sel = pzSeleccionados().filter((e) => e.tipo === 'linea');
  pzAntes();
  for (const e of sel) { [e.p1, e.p2] = [e.p2, e.p1]; [e.desde, e.hasta] = [e.hasta, e.desde]; }
  pzGuardar(); pzRefrescar(sel.map((e) => e.id));
}
function pzTamanoOriginal(id) {
  const e = pzEl(id);
  pzAntes();
  const c = pzCentro(e);
  e.w = e.nw * e.recorte.w; e.h = e.nh * e.recorte.h; e.x = c.x - e.w / 2; e.y = c.y - e.h / 2;
  pzGuardar(); pzRefrescar([id]);
}
function pzTablaOp(id, op) {
  const e = pzEl(id);
  pzTerminarEdicion();
  pzAntes();
  if (op === '+fila') { e.celdas.push(Array(e.celdas[0].length).fill('')); e.h += e.h / (e.celdas.length - 1); }
  if (op === '+col') { e.celdas.forEach((f) => f.push('')); e.w += e.w / (e.celdas[0].length - 1); }
  if (op === '-fila' && e.celdas.length > 1) { e.celdas.pop(); e.h -= e.h / (e.celdas.length + 1); }
  if (op === '-col' && e.celdas[0].length > 1) { e.celdas.forEach((f) => f.pop()); e.w -= e.w / (e.celdas[0].length + 1); }
  e.filas = e.celdas.length; e.cols = e.celdas[0].length;
  pzGuardar(); pzRefrescar([id]); pzBarraCtx();
}

// ---------- Ventanas emergentes (popovers) ----------
function pzAbrirPop(boton, html, clase = '') {
  const pop = document.getElementById('pz-pop'), area = document.getElementById('pz-area');
  if (PZ.popAbierto === boton && !pop.classList.contains('oculto')) { pzCerrarPop(); return null; }
  PZ.popAbierto = boton;
  pop.className = 'pz-pop ' + clase;
  pop.innerHTML = html;
  const rb = boton.getBoundingClientRect(), ra = area.getBoundingClientRect();
  let left = rb.left - ra.left, top = rb.bottom - ra.top + 6;
  pop.style.left = '0px'; pop.style.top = '0px';
  const w = pop.offsetWidth, h = pop.offsetHeight;
  if (left + w > ra.width - 8) left = ra.width - w - 8;
  if (top + h > ra.height - 8) top = Math.max(8, rb.top - ra.top - h - 6);
  if (rb.top < ra.top) top = 8;
  pop.style.left = Math.max(8, left) + 'px'; pop.style.top = top + 'px';
  return pop;
}
function pzCerrarPop() { const p = document.getElementById('pz-pop'); if (p) { p.classList.add('oculto'); p.innerHTML = ''; } PZ.popAbierto = null; }
function pzPopColor(boton, destino, transparente, esNota) {
  const recientes = S.config.pizarra?.colores || [];
  const paleta = esNota ? PZ_COLORES_NOTA : PZ_PALETA;
  const pd = 'onpointerdown="event.preventDefault()"';
  pzAbrirPop(boton, `<div class="pz-paleta">${paleta.map((c) => `<button class="pz-muestra" style="background:${c}" title="${c}" ${pd} onclick="pzElegirColor('${destino}','${c}')"></button>`).join('')}</div>
    ${transparente ? `<button class="btn pequeno" style="margin-top:6px" ${pd} onclick="pzElegirColor('${destino}','transparent')">⊘ Sin color</button>` : ''}
    ${recientes.length ? `<div class="pz-pop-tit">Recientes</div><div class="pz-paleta">${recientes.map((c) => `<button class="pz-muestra" style="background:${c}" ${pd} onclick="pzElegirColor('${destino}','${c}')"></button>`).join('')}</div>` : ''}
    <div class="pz-pop-tit">Personalizado</div><div class="fila"><input type="color" id="pz-color-libre" value="#3366ff" onchange="pzElegirColor('${destino}', this.value)" style="width:44px;height:30px;padding:2px">
    <input id="pz-color-hex" placeholder="#RRGGBB" style="width:100px" onkeydown="event.stopPropagation();if(event.key==='Enter'&&/^#?[0-9a-f]{6}$/i.test(this.value))pzElegirColor('${destino}', '#'+this.value.replace('#',''))"></div>`);
}
function pzElegirColor(destino, c) {
  if (c !== 'transparent') { const cfg = S.config.pizarra = S.config.pizarra || {}; cfg.colores = [c, ...(cfg.colores || []).filter((x) => x !== c)].slice(0, 12); }
  pzAplicarColor(destino, c);
  pzCerrarPop();
}
async function pzPopFuentes(boton) {
  pzGuardarRango();
  const pop = pzAbrirPop(boton, '<div class="ayuda" style="padding:10px">Cargando las fuentes del sistema…</div>', 'pz-pop-fuentes');
  if (!pop) return;
  const lista = await pzCargarFuentes();
  if (PZ.popAbierto !== boton) return;
  const recientes = (S.config.pizarra?.recientes || []).filter(Boolean);
  pop.innerHTML = `<input id="pz-buscar-fuente" placeholder="🔎 Buscar entre ${lista.length} fuentes…" oninput="pzFiltrarFuentes(this.value)" onkeydown="event.stopPropagation();if(event.key==='Enter'){const b=document.querySelector('#pz-lista-fuentes button:not(.oculto)');if(b)b.click()}">
    <div class="pz-lista-fuentes" id="pz-lista-fuentes">
      ${recientes.length ? `<div class="pz-pop-tit">Usadas recientemente</div>${recientes.map((f) => pzItemFuente(f)).join('')}<div class="pz-pop-tit">Fuentes del sistema</div>` : ''}
      ${lista.map((f) => pzItemFuente(f)).join('')}
      <div class="pz-pop-tit">Genéricas</div>${PZ_GENERICAS.map((f) => pzItemFuente(f)).join('')}
    </div>
    <div class="ayuda" style="padding:6px 4px 0">${window.queryLocalFonts ? '' : 'Mostrando las fuentes comunes detectadas en este equipo.'} <a href="#" onclick="pzCargarFuentes(true).then(()=>{PZ.popAbierto=null;pzPopFuentes(document.querySelector('.pz-fuente'))});return false">Actualizar lista</a></div>`;
  setTimeout(() => document.getElementById('pz-buscar-fuente')?.focus(), 20);
}
function pzItemFuente(f) { return `<button data-f="${esc(normalizar(f))}" style="font-family:${pzFamilia(f)}" onpointerdown="event.preventDefault()" onclick="pzFormato('fuente', '${esc(f.replace(/'/g, ''))}');pzCerrarPop()">${esc(f)}</button>`; }
function pzFiltrarFuentes(q) {
  const n = normalizar(q);
  for (const b of document.querySelectorAll('#pz-lista-fuentes button')) b.classList.toggle('oculto', !!n && !b.dataset.f.includes(n));
  for (const t of document.querySelectorAll('#pz-lista-fuentes .pz-pop-tit')) t.classList.toggle('oculto', !!n);
}
function pzPopTamano(boton) {
  pzGuardarRango();
  const e = PZ.editando ? pzEl(PZ.editando.id) : pzSeleccionados()[0];
  const actual = PZ.editando ? pzEstadoFormato(e).tam : e?.estilo?.tam;
  pzAbrirPop(boton, `<div class="fila" style="margin-bottom:6px"><input type="number" id="pz-tam-libre" min="4" max="999" value="${actual || ''}" style="width:80px" onkeydown="event.stopPropagation();if(event.key==='Enter'){pzFormato('tam', +this.value);pzCerrarPop()}"><button class="btn pequeno" onclick="pzFormato('tam', +document.getElementById('pz-tam-libre').value);pzCerrarPop()">Aplicar</button></div>
    <div class="pz-lista-tam">${PZ_TAMANOS.map((t) => `<button class="${t === actual ? 'activo' : ''}" onpointerdown="event.preventDefault()" onclick="pzFormato('tam', ${t});pzCerrarPop()">${t}</button>`).join('')}</div>`);
}
function pzPopAlineacion(boton) {
  const pd = 'onpointerdown="event.preventDefault()"';
  const e = PZ.editando ? pzEl(PZ.editando.id) : pzSeleccionados()[0];
  const v = e?.estilo?.alinV;
  pzAbrirPop(boton, `<div class="pz-pop-tit">Horizontal</div><div class="fila">${[['left', '⯇≡ Izquierda'], ['center', '≡ Centro'], ['right', '≡⯈ Derecha'], ['justify', '☰ Justificado']].map(([k, t]) => `<button class="btn pequeno" ${pd} onclick="pzFormato('alinH','${k}')">${t}</button>`).join('')}</div>
    <div class="pz-pop-tit">Vertical</div><div class="fila">${[['top', '⤒ Arriba'], ['middle', '⇕ Centro'], ['bottom', '⤓ Abajo']].map(([k, t]) => `<button class="btn pequeno ${v === k ? 'primario' : ''}" ${pd} onclick="pzFormato('alinV','${k}');pzCerrarPop()">${t}</button>`).join('')}</div>`);
}
function pzPopMasTexto(boton) {
  pzGuardarRango();
  const e = PZ.editando ? pzEl(PZ.editando.id) : pzSeleccionados()[0];
  const st = PZ.editando ? pzEstadoFormato(e) : e.estilo;
  const pd = 'onpointerdown="event.preventDefault()"';
  const b = (cmd, t, valor, act) => `<button class="btn pequeno ${act ? 'primario' : ''}" ${pd} onclick="pzFormato('${cmd}'${valor !== undefined ? `,${JSON.stringify(valor).replace(/"/g, '&quot;')}` : ''})">${t}</button>`;
  pzAbrirPop(boton, `<div class="ayuda" style="margin-bottom:6px">${PZ.editando ? 'Se aplica a las <b>letras seleccionadas</b> (o al texto que escribas a continuación).' : 'Se aplica a <b>todo el texto</b>. Para cambiar solo algunas letras, haz doble clic y selecciónalas.'}</div>
    <div class="pz-pop-tit">Listas y sangría</div><div class="fila">${b('lista', '• Viñetas')}${b('listaNum', '1. Numerada')}${PZ.editando ? b('sangria', '→ Sangría') + b('quitarSangria', '← Quitar sangría') : ''}</div>
    <div class="pz-pop-tit">Posición</div><div class="fila">${b('sup', 'x² Superíndice', undefined, st.sup)}${b('sub', 'x₂ Subíndice', undefined, st.sub)}</div>
    <div class="pz-pop-tit">Mayúsculas</div><div class="fila">${b('mayus', 'ABC', 'uppercase')}${b('mayus', 'abc', 'lowercase')}${b('mayus', 'Abc Def', 'capitalize')}${b('mayus', 'Normal', 'none')}</div>
    <div class="pz-pop-tit">Efectos</div><div class="fila">${b('sombra', 'Sombra', 1)}${b('sombra', 'Sin sombra', 0)}${b('contorno', 'Contorno', 1)}${b('contorno', 'Sin contorno', 0)}</div>
    <div class="pz-pop-tit">Espaciado entre letras</div><div class="fila">${[-1, 0, 1, 2, 4, 8].map((v) => b('espaciado', v > 0 ? '+' + v : String(v), v)).join('')}</div>
    <div class="pz-pop-tit">Interlineado</div><div class="fila">${[1, 1.15, 1.25, 1.5, 2].map((v) => b('interlineado', String(v), v, e.estilo.interlineado === v)).join('')}</div>
    <div class="fila" style="margin-top:10px">${b('borrar', '🧹 Quitar formato')}</div>`, 'pz-pop-texto');
}
function pzPopOpacidad(boton) {
  const e = pzSeleccionados()[0];
  pzAbrirPop(boton, `<div class="pz-pop-tit">Opacidad</div><input type="range" min="10" max="100" value="${Math.round((e.opacidad ?? 1) * 100)}" oninput="pzPropiedad('opacidad', this.value/100, true);this.nextElementSibling.textContent=this.value+'%'"><span>${Math.round((e.opacidad ?? 1) * 100)}%</span>`);
}
function pzPopFiltros(boton) {
  const e = pzSeleccionados()[0], f = e.filtros || {};
  const r = (k, t, min, max, def, u = '%') => `<div class="pz-rango"><label>${t}</label><input type="range" min="${min}" max="${max}" value="${f[k] ?? def}" oninput="pzFiltro('${k}', +this.value);this.nextElementSibling.textContent=this.value+'${u}'"><span>${f[k] ?? def}${u}</span></div>`;
  pzAbrirPop(boton, `${r('brillo', 'Brillo', 20, 200, 100)}${r('contraste', 'Contraste', 20, 200, 100)}${r('saturacion', 'Saturación', 0, 250, 100)}${r('gris', 'Blanco y negro', 0, 100, 0)}${r('sepia', 'Sepia', 0, 100, 0)}${r('tono', 'Tono', 0, 360, 0, '°')}${r('desenfoque', 'Desenfoque', 0, 10, 0, 'px')}
    <div class="fila" style="margin-top:8px"><button class="btn pequeno" onclick="pzPropiedad('filtros', {});pzCerrarPop()">Restablecer</button></div>`, 'pz-pop-filtros');
}
function pzFiltro(k, v) {
  const e = pzSeleccionados()[0];
  if (!PZ.ultimaProp || PZ.ultimaProp !== 'filtros' + e.id) pzAntes();
  PZ.ultimaProp = 'filtros' + e.id;
  e.filtros = { ...(e.filtros || {}), [k]: v };
  pzGuardar(); pzReemplazarNodo(e);
}
function pzMenuFormas(boton, cambiar = false) {
  pzAbrirPop(boton, `<div class="pz-formas">${Object.entries(PZ_FORMAS).map(([k, f]) => `<button title="${f.t}" class="${(cambiar ? pzSeleccionados()[0]?.forma : PZ.forma) === k ? 'activo' : ''}" onclick="${cambiar ? `pzPropiedad('forma','${k}')` : `PZ.forma='${k}';pzRefrescarHerramientas()`};pzCerrarPop()">${pzIcoForma(k)}</button>`).join('')}</div>`);
}
function pzMenuSellos(boton, cambiar = false) {
  pzAbrirPop(boton, `<div class="pz-sellos">${PZ_SELLOS.map((s) => `<button onclick="${cambiar ? `pzPropiedad('emoji','${s}')` : `PZ.sello='${s}';pzRefrescarHerramientas()`};pzCerrarPop()">${s}</button>`).join('')}</div>${cambiar ? '' : '<div class="ayuda">Haz clic en el tablero para poner el sello.</div>'}`);
}

// ---------- Operaciones sobre la selección ----------
function pzEliminarIds(ids, historial = true) {
  const t = pzT();
  if (historial) pzAntes();
  const set = new Set(ids);
  // Los conectores pegados a lo que se borra quedan sueltos en su última posición
  for (const e of t.elementos) if (e.tipo === 'linea') { if (e.desde && set.has(e.desde.id)) e.desde = null; if (e.hasta && set.has(e.hasta.id)) e.hasta = null; }
  t.elementos = t.elementos.filter((e) => !set.has(e.id));
  for (const id of ids) { PZ.sel.delete(id); pzNodo(id)?.remove(); PZ.cacheAjuste.delete(id); }
  pzGuardar(); pzPintarSel(); pzBarraCtx(); pzMinimapa();
}
function pzEliminar() { const ids = [...PZ.sel]; if (ids.length) pzEliminarIds(ids); }
function pzCopiar(cortar = false) {
  const t = pzT(), sel = pzSeleccionados();
  if (!sel.length) return '';
  const ids = new Set(sel.map((e) => e.id));
  const recursos = {};
  for (const e of sel) if (e.tipo === 'imagen' && t.recursos[e.rid]) recursos[e.rid] = t.recursos[e.rid];
  const texto = sel.filter((e) => pzTieneTexto(e)).map((e) => pzTextoPlano(e.html)).filter(Boolean).join('\n\n');
  PZ.portapapeles = { elementos: structuredClone(sel), recursos, texto: texto || '​', ids, veces: 0 };
  if (cortar) pzEliminarIds([...ids]);
  return PZ.portapapeles.texto;
}
function pzPegarElementos(clip = PZ.portapapeles, enPuntero = true) {
  if (!clip) return;
  const t = pzT();
  pzAntes();
  Object.assign(t.recursos, clip.recursos);
  const mapa = {}, grupos = {};
  const nuevos = structuredClone(clip.elementos).map((e) => { mapa[e.id] = uid(); return e; });
  clip.veces = (clip.veces || 0) + 1;
  const b = pzUnion(nuevos.map((e) => pzLimites({ ...e })));
  let dx = 24 * clip.veces, dy = 24 * clip.veces;
  const p = PZ.ultimoPuntero;
  if (enPuntero && p && b) { dx = p.x - (b.x + b.w / 2); dy = p.y - (b.y + b.h / 2); }
  for (const e of nuevos) {
    e.id = mapa[e.id];
    if (e.g) e.g = grupos[e.g] || (grupos[e.g] = uid());
    e.x += dx; e.y += dy;
    if (e.tipo === 'linea') {
      e.p1 = { x: e.p1.x + dx, y: e.p1.y + dy }; e.p2 = { x: e.p2.x + dx, y: e.p2.y + dy };
      e.desde = e.desde && mapa[e.desde.id] ? { ...e.desde, id: mapa[e.desde.id] } : null;
      e.hasta = e.hasta && mapa[e.hasta.id] ? { ...e.hasta, id: mapa[e.hasta.id] } : null;
    }
    if (e.tipo === 'marco') t.elementos.unshift(e); else t.elementos.push(e);
  }
  PZ.sel = new Set(nuevos.map((e) => e.id));
  pzGuardar(); pzPintar(); pzBarraCtx();
  return nuevos;
}
function pzDuplicar() {
  pzTerminarEdicion();
  const clip = PZ.portapapeles;
  pzCopiar();
  const nuevo = PZ.portapapeles;
  pzPegarElementos(nuevo, false);
  PZ.portapapeles = clip || nuevo;
}
function pzOrden(donde) {
  const t = pzT(), sel = pzSeleccionados();
  if (!sel.length) return;
  pzAntes();
  const resto = t.elementos.filter((e) => !PZ.sel.has(e.id));
  if (donde === 'frente') t.elementos = [...resto, ...sel];
  else if (donde === 'fondo') {
    const marcosSel = sel.filter((e) => e.tipo === 'marco'), otrosSel = sel.filter((e) => e.tipo !== 'marco');
    t.elementos = [...marcosSel, ...resto.filter((e) => e.tipo === 'marco'), ...otrosSel, ...resto.filter((e) => e.tipo !== 'marco')];
  } else {
    // un paso adelante / atrás
    const arr = t.elementos;
    const idxs = sel.map((e) => arr.indexOf(e)).sort((a, b) => (donde === 'adelante' ? b - a : a - b));
    for (const i of idxs) { const j = donde === 'adelante' ? i + 1 : i - 1; if (j >= 0 && j < arr.length && !PZ.sel.has(arr[j].id)) [arr[i], arr[j]] = [arr[j], arr[i]]; }
  }
  pzGuardar(); pzPintar();
}
function pzBloquear() {
  const sel = pzSeleccionados();
  if (!sel.length) return;
  pzAntes();
  const v = !sel.every((e) => e.bloqueado);
  for (const e of sel) e.bloqueado = v;
  pzGuardar(); pzRefrescar(sel.map((e) => e.id)); pzBarraCtx();
}
function pzAlinear(modo) {
  const sel = pzSeleccionados().filter((e) => e.tipo !== 'linea' && !e.bloqueado);
  if (sel.length < 2 && !['agrupar', 'desagrupar'].includes(modo)) return;
  pzAntes();
  const todos = pzSeleccionados();
  if (modo === 'agrupar') { const g = uid(); for (const e of todos) e.g = g; }
  else if (modo === 'desagrupar') { for (const e of todos) delete e.g; }
  else if (modo === 'igualar') { const [p, ...r] = sel; for (const e of r) { const c = pzCentro(e); e.w = p.w; e.h = p.h; e.x = c.x - e.w / 2; e.y = c.y - e.h / 2; } }
  else if (modo === 'distH' || modo === 'distV') {
    const k = modo === 'distH' ? 'x' : 'y', d = modo === 'distH' ? 'w' : 'h';
    const ord = [...sel].sort((a, b) => a[k] - b[k]);
    const total = ord.reduce((s, e) => s + e[d], 0);
    const ini = ord[0][k], fin = ord[ord.length - 1][k] + ord[ord.length - 1][d];
    const hueco = (fin - ini - total) / (ord.length - 1);
    let pos = ini;
    for (const e of ord) { e[k] = pos; pos += e[d] + hueco; }
  } else {
    const b = pzUnion(sel.map(pzLimites));
    for (const e of sel) {
      const l = pzLimites(e);
      if (modo === 'izq') e.x += b.x - l.x;
      if (modo === 'der') e.x += b.x + b.w - (l.x + l.w);
      if (modo === 'centroH') e.x += b.x + b.w / 2 - (l.x + l.w / 2);
      if (modo === 'arriba') e.y += b.y - l.y;
      if (modo === 'abajo') e.y += b.y + b.h - (l.y + l.h);
      if (modo === 'centroV') e.y += b.y + b.h / 2 - (l.y + l.h / 2);
    }
  }
  pzGuardar(); pzPintar(); pzBarraCtx();
}
function pzMoverSel(dx, dy) {
  const sel = pzSeleccionados().filter((e) => !e.bloqueado);
  if (!sel.length) return;
  if (!PZ.ultimaProp || PZ.ultimaProp !== 'flechas') pzAntes();
  PZ.ultimaProp = 'flechas';
  for (const e of sel) {
    if (e.tipo === 'linea') { if (!e.desde) e.p1 = { x: e.p1.x + dx, y: e.p1.y + dy }; if (!e.hasta) e.p2 = { x: e.p2.x + dx, y: e.p2.y + dy }; } else { e.x += dx; e.y += dy; }
  }
  pzGuardar(); pzRefrescar(sel.map((e) => e.id));
}

// ---------- Imágenes ----------
function pzElegirImagen(reemplazarId) {
  pzTerminarEdicion();
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = !reemplazarId;
  inp.onchange = () => pzInsertarArchivos([...inp.files], null, reemplazarId);
  inp.click();
}
function pzLeerArchivo(f) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
}
function pzCargarImagen(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Imagen no válida')); i.src = src; }); }
// Reduce las fotos muy grandes para que el archivo de datos no crezca demasiado
async function pzPrepararImagen(dataUrl, tipo) {
  const img = await pzCargarImagen(dataUrl);
  const max = 2400;
  let { naturalWidth: w, naturalHeight: h } = img;
  if (/gif|svg/.test(tipo) && dataUrl.length < 4e6) return { src: dataUrl, w: w || 300, h: h || 300 };
  if (w <= max && h <= max && dataUrl.length < 1.6e6) return { src: dataUrl, w, h };
  const k = Math.min(1, max / Math.max(w, h));
  w = Math.round(w * k); h = Math.round(h * k);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  let src = c.toDataURL('image/webp', 0.88);
  if (!src.startsWith('data:image/webp')) src = c.toDataURL('image/jpeg', 0.88);
  return { src, w, h };
}
async function pzInsertarArchivos(archivos, punto, reemplazarId) {
  const imgs = archivos.filter((f) => /^image\//.test(f.type));
  if (!imgs.length) return;
  const t = pzT();
  const centro = punto || pzCentroVista();
  const v = pzVista();
  pzAntes();
  const nuevos = [];
  let dx = 0;
  for (const f of imgs) {
    try {
      const { src, w, h } = await pzPrepararImagen(await pzLeerArchivo(f), f.type);
      const rid = 'r' + uid();
      t.recursos[rid] = src;
      if (reemplazarId) {
        const e = pzEl(reemplazarId);
        const c = pzCentro(e);
        e.rid = rid; e.nw = w; e.nh = h; e.recorte = { x: 0, y: 0, w: 1, h: 1 };
        e.h = e.w * h / w; e.x = c.x - e.w / 2; e.y = c.y - e.h / 2;
        pzRefrescar([e.id]);
        continue;
      }
      const lado = Math.min(1, 480 / v.z / Math.max(w, h)) * Math.min(1, Math.max(1, 1 / v.z));
      const e = pzNuevoElemento('imagen', { rid, nw: w, nh: h, w: w * lado, h: h * lado });
      e.x = centro.x - e.w / 2 + dx; e.y = centro.y - e.h / 2;
      dx += e.w + 20;
      pzAgregar(e, { seleccionar: false });
      nuevos.push(e.id);
    } catch (err) { aviso('No se pudo leer la imagen: ' + err.message, 'error'); }
  }
  if (nuevos.length) pzSeleccionar(nuevos);
  pzGuardar();
}
// Recorte no destructivo: se guarda qué parte de la imagen se ve
function pzRecortar(id) {
  const e = pzEl(id), t = pzT();
  const src = t.recursos[e.rid];
  const W = Math.min(760, window.innerWidth * 0.8), H = Math.min(460, window.innerHeight * 0.55);
  const k = Math.min(W / e.nw, H / e.nh);
  const vw = e.nw * k, vh = e.nh * k;
  PZ.recorte = { id, r: { ...e.recorte }, vw, vh, prop: null, forma: e.recForma || 'rect' };
  abrirModal(`<h2>✂️ Recortar imagen</h2>
    <div class="pz-rec-caja" id="pz-rec-caja" style="width:${vw}px;height:${vh}px"><img src="${esc(src)}" draggable="false" style="width:${vw}px;height:${vh}px">
      <div class="pz-rec-sel" id="pz-rec-sel">${['no', 'n', 'ne', 'e', 'se', 's', 'so', 'o'].map((h) => `<div class="pz-rec-asa pz-asa-${h}" data-h="${h}"></div>`).join('')}</div></div>
    <div class="fila" style="margin-top:12px;justify-content:center">
      <span class="ayuda">Proporción:</span>${[['', 'Libre'], ['1', '1:1'], ['1.3333', '4:3'], ['0.75', '3:4'], ['1.7778', '16:9'], ['0.5625', '9:16'], ['orig', 'Original']].map(([v, tx]) => `<button class="btn pequeno" onclick="pzRecorteProporcion('${v}')">${tx}</button>`).join('')}
    </div>
    <div class="fila" style="margin-top:8px;justify-content:center"><span class="ayuda">Forma:</span>${[['rect', '▭ Rectangular'], ['redondeado', '▢ Redondeada'], ['circulo', '◯ Círculo']].map(([v, tx]) => `<button class="btn pequeno ${PZ.recorte.forma === v ? 'primario' : ''}" onclick="PZ.recorte.forma='${v}';this.parentElement.querySelectorAll('.btn').forEach(b=>b.classList.remove('primario'));this.classList.add('primario');pzRecortePintar()">${tx}</button>`).join('')}</div>
    <div class="botones"><button class="btn" onclick="PZ.recorte.r={x:0,y:0,w:1,h:1};pzRecortePintar()">Restablecer</button><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="pzAplicarRecorte()">Aplicar recorte</button></div>`, { ancho: true });
  pzRecortePintar();
  const caja = document.getElementById('pz-rec-caja');
  caja.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    const h = ev.target.dataset.h || (ev.target.closest('#pz-rec-sel') ? 'mover' : 'nuevo');
    const rc = caja.getBoundingClientRect();
    const p0 = { x: (ev.clientX - rc.left) / vw, y: (ev.clientY - rc.top) / vh };
    const r0 = { ...PZ.recorte.r };
    caja.setPointerCapture(ev.pointerId);
    const mover = (m) => {
      const p = { x: Math.min(1, Math.max(0, (m.clientX - rc.left) / vw)), y: Math.min(1, Math.max(0, (m.clientY - rc.top) / vh)) };
      let { x, y, w, h: hh } = r0;
      if (h === 'mover') { x = Math.min(1 - w, Math.max(0, r0.x + p.x - p0.x)); y = Math.min(1 - hh, Math.max(0, r0.y + p.y - p0.y)); }
      else if (h === 'nuevo') { x = Math.min(p0.x, p.x); y = Math.min(p0.y, p.y); w = Math.abs(p.x - p0.x); hh = Math.abs(p.y - p0.y); }
      else {
        let x2 = r0.x + r0.w, y2 = r0.y + r0.h;
        if (h.includes('o')) x = Math.min(p.x, x2 - 0.02);
        if (h.includes('e')) x2 = Math.max(p.x, x + 0.02);
        if (h.includes('n')) y = Math.min(p.y, y2 - 0.02);
        if (h.includes('s')) y2 = Math.max(p.y, y + 0.02);
        w = x2 - x; hh = y2 - y;
      }
      if (PZ.recorte.prop && h !== 'mover') {
        const prop = PZ.recorte.prop * e.nh / e.nw; // proporción en coordenadas normalizadas
        if (['n', 's'].includes(h)) w = hh * prop; else hh = w / prop;
        if (y + hh > 1) { hh = 1 - y; w = hh * prop; }
        if (x + w > 1) { w = 1 - x; hh = w / prop; }
      }
      if (w > 0.01 && hh > 0.01) { PZ.recorte.r = { x, y, w, h: hh }; pzRecortePintar(); }
    };
    const fin = () => { caja.removeEventListener('pointermove', mover); caja.removeEventListener('pointerup', fin); };
    caja.addEventListener('pointermove', mover); caja.addEventListener('pointerup', fin);
  });
}
function pzRecortePintar() {
  const el = document.getElementById('pz-rec-sel');
  if (!el) return;
  const { r, vw, vh, forma } = PZ.recorte;
  Object.assign(el.style, { left: r.x * vw + 'px', top: r.y * vh + 'px', width: r.w * vw + 'px', height: r.h * vh + 'px', borderRadius: forma === 'circulo' ? '50%' : forma === 'redondeado' ? '12%' : '0' });
}
function pzRecorteProporcion(v) {
  const e = pzEl(PZ.recorte.id);
  PZ.recorte.prop = v === 'orig' ? e.nw / e.nh : v ? +v : null;
  if (PZ.recorte.prop) {
    const r = PZ.recorte.r, prop = PZ.recorte.prop * e.nh / e.nw;
    let w = r.w, h = w / prop;
    if (h > 1 - r.y) { h = Math.min(1, r.h); w = h * prop; }
    if (w > 1) { w = 1; h = w / prop; }
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    PZ.recorte.r = { x: Math.min(1 - w, Math.max(0, cx - w / 2)), y: Math.min(1 - h, Math.max(0, cy - h / 2)), w, h };
  }
  pzRecortePintar();
}
function pzAplicarRecorte() {
  const e = pzEl(PZ.recorte.id);
  pzAntes();
  const viejo = e.recorte, nuevo = PZ.recorte.r;
  const escala = e.w / (viejo.w * e.nw);
  const c = pzCentro(e);
  e.recorte = nuevo; e.recForma = PZ.recorte.forma;
  e.w = nuevo.w * e.nw * escala; e.h = nuevo.h * e.nh * escala;
  e.x = c.x - e.w / 2; e.y = c.y - e.h / 2;
  cerrarModal();
  pzGuardar(); pzRefrescar([e.id]); pzBarraCtx();
}

// ---------- Eventos del lienzo ----------
let pzEventosGlobales = false;
function pzInstalarEventos() {
  const l = document.getElementById('pz-lienzo'), capaE = document.getElementById('pz-capa-el'), mm = document.getElementById('pz-minimapa');
  l.dataset.herr = PZ.herramienta;
  l.addEventListener('pointerdown', pzAlPresionar);
  l.addEventListener('pointermove', pzAlMover);
  l.addEventListener('pointerup', pzAlSoltar);
  l.addEventListener('pointercancel', pzAlSoltar);
  l.addEventListener('dblclick', pzDobleClic);
  l.addEventListener('wheel', pzRueda, { passive: false });
  l.addEventListener('dragover', (ev) => { ev.preventDefault(); });
  l.addEventListener('drop', (ev) => {
    ev.preventDefault();
    const p = pzAMundo(ev.clientX, ev.clientY);
    const archivos = [...(ev.dataTransfer?.files || [])];
    if (archivos.length) { pzInsertarArchivos(archivos, p); return; }
    const txt = ev.dataTransfer?.getData('text/plain');
    if (txt) { pzAntes(); pzAgregar(pzCrearEn('nota', p, null, { html: pzTextoAHTML(txt) })); pzGuardar(); }
  });
  l.addEventListener('contextmenu', (ev) => { ev.preventDefault(); pzMenuContextual(ev); });
  capaE.addEventListener('input', pzAlEscribir);
  capaE.addEventListener('paste', pzPegarEnTexto);
  capaE.addEventListener('keydown', (ev) => {
    if (!PZ.editando) return;
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); pzTerminarEdicion(); PZ.sel.clear(); pzPintarSel(); pzBarraCtx(); }
    if (ev.key === 'Tab' && PZ.editando.celda) { ev.preventDefault(); pzSiguienteCelda(ev.shiftKey ? -1 : 1); }
  });
  mm.addEventListener('pointerdown', (ev) => {
    pzMinimapaIr(ev);
    const mover = (m) => pzMinimapaIr(m);
    const fin = () => { mm.removeEventListener('pointermove', mover); mm.removeEventListener('pointerup', fin); };
    mm.setPointerCapture(ev.pointerId);
    mm.addEventListener('pointermove', mover); mm.addEventListener('pointerup', fin);
  });
  new ResizeObserver(() => { pzPosicionarCtx(); pzMinimapaVista(); }).observe(l);
  if (pzEventosGlobales) return;
  pzEventosGlobales = true;
  document.addEventListener('keydown', pzTeclado, true);
  document.addEventListener('keyup', (ev) => { if (ev.code === 'Space' && PZ.espacio) { PZ.espacio = false; const l2 = document.getElementById('pz-lienzo'); if (l2) l2.dataset.herr = PZ.herramienta; } });
  document.addEventListener('selectionchange', () => { if (PZ.editando) { pzGuardarRango(); clearTimeout(PZ.tSel); PZ.tSel = setTimeout(() => { if (!PZ.popAbierto) pzBarraCtx(); }, 120); } });
  document.addEventListener('pointerdown', (ev) => {
    const pop = document.getElementById('pz-pop');
    if (pop && !pop.classList.contains('oculto') && !pop.contains(ev.target) && ev.target !== PZ.popAbierto && !PZ.popAbierto?.contains(ev.target)) pzCerrarPop();
    const menu = document.getElementById('pz-menu-ctx');
    if (menu && !menu.contains(ev.target)) menu.remove();
  }, true);
  document.addEventListener('copy', (ev) => { if (pzActivo() && !pzEnCampo(ev.target) && PZ.sel.size && !PZ.editando) { ev.preventDefault(); ev.clipboardData.setData('text/plain', pzCopiar()); } });
  document.addEventListener('cut', (ev) => { if (pzActivo() && !pzEnCampo(ev.target) && PZ.sel.size && !PZ.editando) { ev.preventDefault(); ev.clipboardData.setData('text/plain', pzCopiar(true)); } });
  document.addEventListener('paste', pzPegarSistema);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && PZ.presentando) pzTerminarPresentacion(); });
}
function pzActivo() { return ui.vista === 'pizarra' && !!document.getElementById('pz') && document.getElementById('modal-fondo').classList.contains('oculto') && document.getElementById('aula')?.classList.contains('oculto') !== false; }
function pzEnCampo(el) { return el && (el.matches?.('input, textarea, select') || el.isContentEditable); }

function pzObjetivoEn(cx, cy, excluir) {
  const el = document.elementsFromPoint(cx, cy).map((n) => n.closest?.('.pz-el')).find((n) => n && !n.classList.contains('pz-linea') && !n.classList.contains('pz-trazo') && n.dataset.id !== excluir);
  return el ? el.dataset.id : null;
}
function pzAlPresionar(ev) {
  const l = document.getElementById('pz-lienzo');
  const p = pzAMundo(ev.clientX, ev.clientY);
  PZ.ultimoPuntero = p;
  PZ.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (ev.pointerType === 'touch' && PZ.punteros.size === 2) {
    // Pellizco con dos dedos: zoom y desplazamiento
    pzCancelarArrastre();
    const [a, b] = [...PZ.punteros.values()];
    const v = pzVista();
    PZ.pinza = { d: Math.hypot(a.x - b.x, a.y - b.y), m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v: { ...v } };
    return;
  }
  if (PZ.editando) {
    const inn = pzNodoEdicion();
    if (inn && inn.contains(ev.target)) return; // seleccionar letras dentro del texto
    const celda = ev.target.closest?.('.pz-celda');
    if (celda && pzNodo(PZ.editando.id)?.contains(celda)) { pzTerminarEdicion(); pzEditar(PZ.editando?.id || celda.closest('.pz-el').dataset.id, { celda: celda.dataset.celda, seleccionarTodo: false }); return; }
    pzTerminarEdicion();
  }
  pzCerrarPop();
  document.getElementById('pz-menu-ctx')?.remove();
  if (ev.button === 2) return;
  l.focus({ preventScroll: true });
  l.setPointerCapture(ev.pointerId);
  const herr = PZ.espacio ? 'mano' : PZ.herramienta;
  const v = pzVista();
  if (ev.button === 1 || herr === 'mano') { ev.preventDefault(); PZ.arr = { tipo: 'pan', sx: ev.clientX, sy: ev.clientY, vx: v.x, vy: v.y }; l.classList.add('arrastrando'); return; }
  const h = ev.target.dataset?.h;
  const nodoEl = ev.target.closest?.('.pz-el');
  const t = pzT();
  if (h) {
    ev.preventDefault();
    const sel = pzSeleccionados();
    if (h === 'p1' || h === 'p2') { PZ.arr = { tipo: 'extremo', id: sel[0].id, cual: h, inicio: p }; return; }
    if (h === 'rot') { const e = sel[0], c = pzCentro(e); PZ.arr = { tipo: 'rotar', id: e.id, c, a0: Math.atan2(p.y - c.y, p.x - c.x), rot0: e.rot || 0 }; return; }
    if (h.startsWith('con-')) { PZ.arr = { tipo: 'conector', desde: sel[0].id, lado: h.slice(4), inicio: p, p }; return; }
    PZ.arr = { tipo: 'tamano', h, inicio: p, orig: sel.map((e) => structuredClone(e)), caja: pzUnion(sel.map(pzLimites)) };
    return;
  }
  switch (herr) {
    case 'seleccionar': {
      if (nodoEl) {
        const id = nodoEl.dataset.id, e = pzEl(id);
        // En un marco, solo el título o el borde lo seleccionan si hay algo encima
        if (ev.shiftKey || ev.ctrlKey) { if (PZ.sel.has(id)) { PZ.sel.delete(id); if (e.g) for (const o of t.elementos) if (o.g === e.g) PZ.sel.delete(o.id); pzPintarSel(); pzBarraCtx(); } else pzSeleccionar([id], true); }
        const yaSel = PZ.sel.has(id);
        if (!(ev.shiftKey || ev.ctrlKey) && !yaSel) pzSeleccionar([id]);
        if (!PZ.sel.has(id)) return;
        pzIniciarMovimiento(p, ev.altKey);
        if (PZ.arr) { PZ.arr.clicId = id; PZ.arr.yaSel = yaSel; }
      } else {
        if (!ev.shiftKey) { PZ.sel.clear(); pzPintarSel(); pzBarraCtx(); }
        PZ.arr = { tipo: 'marquesina', inicio: p, previa: new Set(PZ.sel) };
      }
      return;
    }
    case 'nota': case 'forma': case 'marco': case 'texto': case 'tabla':
      PZ.arr = { tipo: 'crear', herr, inicio: p, p };
      return;
    case 'linea': {
      const obj = pzObjetivoEn(ev.clientX, ev.clientY);
      PZ.arr = { tipo: 'linea', inicio: p, p, desde: obj ? { id: obj, lado: null } : null };
      return;
    }
    case 'lapiz': case 'resaltador':
      PZ.arr = { tipo: 'trazo', pts: [[p.x, p.y]], herr };
      pzVistaTrazo();
      return;
    case 'borrador':
      PZ.arr = { tipo: 'borrar', borrados: 0 };
      pzBorrarEn(p);
      return;
    case 'sello': {
      pzAntes();
      const e = pzNuevoElemento('sello', { emoji: PZ.sello });
      const lado = 72 / Math.max(0.5, v.z);
      e.w = e.h = lado; e.x = p.x - lado / 2; e.y = p.y - lado / 2;
      pzAgregar(e, { seleccionar: false }); pzGuardar();
    }
  }
}
function pzIniciarMovimiento(p, alt) {
  const t = pzT();
  let sel = pzSeleccionados().filter((e) => !e.bloqueado);
  if (!sel.length) { PZ.arr = null; return; }
  // Los marcos arrastran lo que tienen encima
  const extra = [];
  for (const m of sel.filter((e) => e.tipo === 'marco')) {
    for (const e of t.elementos) if (e.tipo !== 'marco' && !PZ.sel.has(e.id) && !e.bloqueado && pzContiene(m, pzLimites(e))) extra.push(e);
  }
  sel = [...sel, ...extra];
  const ids = new Set(sel.map((e) => e.id));
  const fijos = t.elementos.filter((e) => !ids.has(e.id) && e.tipo !== 'linea');
  PZ.arr = { tipo: 'mover', inicio: p, alt, ids, orig: new Map(sel.map((e) => [e.id, structuredClone(e)])), caja: pzUnion(sel.filter((e) => e.tipo !== 'linea').map(pzLimites)) || pzUnion(sel.map(pzLimites)), fijos };
}
function pzAlMover(ev) {
  const p = pzAMundo(ev.clientX, ev.clientY);
  PZ.ultimoPuntero = p;
  if (PZ.punteros.has(ev.pointerId)) PZ.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (PZ.pinza && PZ.punteros.size === 2) {
    const [a, b] = [...PZ.punteros.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const l = document.getElementById('pz-lienzo').getBoundingClientRect();
    const v = pzVista(), v0 = PZ.pinza.v;
    const z = Math.min(8, Math.max(0.05, v0.z * d / PZ.pinza.d));
    const mx0 = PZ.pinza.m.x - l.left, my0 = PZ.pinza.m.y - l.top;
    const wx = (mx0 - v0.x) / v0.z, wy = (my0 - v0.y) / v0.z;
    v.z = z; v.x = m.x - l.left - wx * z; v.y = m.y - l.top - wy * z;
    pzAplicarVista();
    return;
  }
  const a = PZ.arr;
  if (!a) return;
  const t = pzT(), v = pzVista();
  switch (a.tipo) {
    case 'pan': v.x = a.vx + ev.clientX - a.sx; v.y = a.vy + ev.clientY - a.sy; pzAplicarVista(); return;
    case 'mover': {
      let dx = p.x - a.inicio.x, dy = p.y - a.inicio.y;
      if (!a.movido && Math.hypot(dx, dy) * v.z < 3) return;
      if (!a.movido) {
        a.movido = true;
        pzAntes();
        if (a.alt) { // Alt + arrastrar: duplica
          pzCopiar();
          const nuevos = pzPegarElementos(PZ.portapapeles, false);
          for (const n of nuevos) { n.x -= 24; n.y -= 24; if (n.tipo === 'linea') { n.p1.x -= 24; n.p1.y -= 24; n.p2.x -= 24; n.p2.y -= 24; } }
          PZ.deshacer.pop();
          a.ids = new Set(nuevos.map((e) => e.id)); a.orig = new Map(nuevos.map((e) => [e.id, structuredClone(e)]));
          pzPintar();
        }
        document.getElementById('pz-ctx').classList.add('oculto');
      }
      if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      ({ dx, dy } = pzAjustarGuias(a, dx, dy));
      for (const id of a.ids) {
        const e = pzEl(id), o = a.orig.get(id);
        if (!e) continue;
        if (e.tipo === 'linea') {
          if (!e.desde || !a.ids.has(e.desde.id)) { e.desde = null; e.p1 = { x: o.p1.x + dx, y: o.p1.y + dy }; }
          if (!e.hasta || !a.ids.has(e.hasta.id)) { e.hasta = null; e.p2 = { x: o.p2.x + dx, y: o.p2.y + dy }; }
        } else { e.x = o.x + dx; e.y = o.y + dy; }
        pzMoverNodo(e);
      }
      for (const e of t.elementos) if (e.tipo === 'linea' && !a.ids.has(e.id) && ((e.desde && a.ids.has(e.desde.id)) || (e.hasta && a.ids.has(e.hasta.id)))) pzReemplazarNodo(e);
      for (const id of a.ids) { const e = pzEl(id); if (e?.tipo === 'linea') pzReemplazarNodo(e); }
      pzPintarSel();
      return;
    }
    case 'tamano': pzRedimensionar(a, p, ev.shiftKey); return;
    case 'rotar': {
      const e = pzEl(a.id);
      if (!a.movido) { a.movido = true; pzAntes(); }
      let r = a.rot0 + (Math.atan2(p.y - a.c.y, p.x - a.c.x) - a.a0) * 180 / Math.PI;
      r = ((r % 360) + 360) % 360;
      if (ev.shiftKey) r = Math.round(r / 15) * 15;
      else for (const s of [0, 90, 180, 270, 360]) if (Math.abs(r - s) < 3) r = s;
      e.rot = r % 360;
      pzReemplazarNodo(e); pzRefrescar([e.id]);
      return;
    }
    case 'marquesina': {
      a.rect = { x: Math.min(a.inicio.x, p.x), y: Math.min(a.inicio.y, p.y), w: Math.abs(p.x - a.inicio.x), h: Math.abs(p.y - a.inicio.y) };
      PZ.sel = new Set(a.previa);
      for (const e of t.elementos) {
        const b = pzLimites(e);
        if (e.tipo === 'marco' ? pzContiene(a.rect, b) : pzSeCruzan(a.rect, b)) { PZ.sel.add(e.id); if (e.g) for (const o of t.elementos) if (o.g === e.g) PZ.sel.add(o.id); }
      }
      pzPintarSel();
      return;
    }
    case 'crear': {
      a.p = p;
      const r = { x: Math.min(a.inicio.x, p.x), y: Math.min(a.inicio.y, p.y), w: Math.abs(p.x - a.inicio.x), h: Math.abs(p.y - a.inicio.y) };
      if (ev.shiftKey || a.herr === 'nota') { const m = Math.max(r.w, r.h); r.w = r.h = m; if (p.x < a.inicio.x) r.x = a.inicio.x - m; if (p.y < a.inicio.y) r.y = a.inicio.y - m; }
      a.rect = r;
      a.vista = `<div class="pz-previa ${a.herr}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"></div>`;
      pzPintarSel();
      return;
    }
    case 'linea': case 'conector': case 'extremo': {
      const excluir = a.tipo === 'extremo' ? a.id : (a.tipo === 'conector' ? a.desde : a.desde?.id);
      const obj = pzObjetivoEn(ev.clientX, ev.clientY, excluir);
      PZ.objetivo = obj;
      if (a.tipo === 'extremo') {
        const e = pzEl(a.id);
        if (!a.movido) { a.movido = true; pzAntes(); }
        const k = a.cual === 'p1' ? 'desde' : 'hasta';
        e[k] = null; e[a.cual] = { x: p.x, y: p.y };
        pzReemplazarNodo(e); pzPintarSel();
        return;
      }
      a.p = p;
      const tmp = pzNuevoElemento('linea', { id: '_previa', p1: a.inicio, p2: p, desde: a.tipo === 'conector' ? { id: a.desde, lado: a.lado } : a.desde, hasta: obj ? { id: obj, lado: null } : null, ...(S.config.pizarra?.linea || {}) });
      const g = pzGeoLinea(tmp);
      a.vista = `<svg class="pz-svg" width="1" height="1" overflow="visible" style="position:absolute;left:0;top:0"><path d="${g.d}" fill="none" stroke="#1e88e5" stroke-width="${2 / v.z}" stroke-dasharray="${6 / v.z} ${4 / v.z}"/></svg>`;
      pzPintarSel();
      return;
    }
    case 'trazo': {
      const u = a.pts[a.pts.length - 1];
      if (Math.hypot(p.x - u[0], p.y - u[1]) * v.z < 1.5) return;
      a.pts.push([p.x, p.y]);
      pzVistaTrazo();
      return;
    }
    case 'borrar': pzBorrarEn(p); return;
  }
}
function pzVistaTrazo() {
  const a = PZ.arr, h = PZ[a.herr];
  const capa = document.getElementById('pz-capa-sel');
  let svg = document.getElementById('pz-trazo-vivo');
  if (!svg) { capa.insertAdjacentHTML('beforeend', '<svg id="pz-trazo-vivo" class="pz-svg" width="1" height="1" overflow="visible" style="position:absolute;left:0;top:0"><path fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'); svg = document.getElementById('pz-trazo-vivo'); }
  const path = svg.firstElementChild;
  path.setAttribute('d', pzRutaSuave(a.pts));
  path.setAttribute('stroke', h.color);
  path.setAttribute('stroke-width', h.grosor);
  path.setAttribute('opacity', a.herr === 'resaltador' ? 0.45 : 1);
}
function pzBorrarEn(p) {
  const t = pzT(), v = pzVista(), a = PZ.arr;
  const tol = 8 / v.z;
  for (const e of [...t.elementos].reverse()) {
    if (e.tipo !== 'trazo') continue;
    const b = pzLimites(e);
    if (p.x < b.x - tol - e.grosor || p.x > b.x + b.w + tol + e.grosor || p.y < b.y - tol - e.grosor || p.y > b.y + b.h + tol + e.grosor) continue;
    const sx = e.w / (e.vw || 1), sy = e.h / (e.vh || 1);
    const c = pzCentro(e);
    const lp = e.rot ? pzRotar(p, c, -e.rot) : p;
    const pts = e.puntos.map(([x, y]) => [e.x + x * sx, e.y + y * sy]);
    let cerca = pts.length === 1 && Math.hypot(lp.x - pts[0][0], lp.y - pts[0][1]) < tol + e.grosor / 2;
    for (let i = 1; i < pts.length && !cerca; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy;
      const k = l ? Math.max(0, Math.min(1, ((lp.x - x1) * dx + (lp.y - y1) * dy) / l)) : 0;
      if (Math.hypot(lp.x - x1 - k * dx, lp.y - y1 - k * dy) < tol + e.grosor / 2) cerca = true;
    }
    if (cerca) { if (!a.borrados) pzAntes(); a.borrados++; pzEliminarIds([e.id], false); }
  }
}
// Guías inteligentes de alineación al mover
function pzAjustarGuias(a, dx, dy) {
  PZ.guias = [];
  const v = pzVista();
  if (!a.caja) return { dx, dy };
  const cfg = S.config.pizarra || {};
  const tol = 6 / v.z;
  const c = a.caja;
  const mov = { x: [c.x + dx, c.x + dx + c.w / 2, c.x + dx + c.w], y: [c.y + dy, c.y + dy + c.h / 2, c.y + dy + c.h] };
  let mejorX = null, mejorY = null;
  if (cfg.guias !== false) {
    for (const e of a.fijos) {
      const b = pzLimites(e);
      if (b.x > -v.x / v.z + 4000 / v.z || b.x + b.w < -v.x / v.z - 2000 / v.z) continue;
      const fx = [b.x, b.x + b.w / 2, b.x + b.w], fy = [b.y, b.y + b.h / 2, b.y + b.h];
      for (const m of mov.x) for (const f of fx) { const d = f - m; if (Math.abs(d) < tol && (!mejorX || Math.abs(d) < Math.abs(mejorX.d))) mejorX = { d, v: f, b }; }
      for (const m of mov.y) for (const f of fy) { const d = f - m; if (Math.abs(d) < tol && (!mejorY || Math.abs(d) < Math.abs(mejorY.d))) mejorY = { d, v: f, b }; }
    }
  }
  if (mejorX) { dx += mejorX.d; PZ.guias.push({ eje: 'x', v: mejorX.v, a: Math.min(c.y + dy, mejorX.b.y) - 20, b: Math.max(c.y + dy + c.h, mejorX.b.y + mejorX.b.h) + 20 }); }
  else if (cfg.iman) dx = Math.round((c.x + dx) / 24) * 24 - c.x;
  if (mejorY) { dy += mejorY.d; PZ.guias.push({ eje: 'y', v: mejorY.v, a: Math.min(c.x + dx, mejorY.b.x) - 20, b: Math.max(c.x + dx + c.w, mejorY.b.x + mejorY.b.w) + 20 }); }
  else if (cfg.iman) dy = Math.round((c.y + dy) / 24) * 24 - c.y;
  return { dx, dy };
}
function pzRedimensionar(a, p, shift) {
  if (!a.movido) { a.movido = true; pzAntes(); document.getElementById('pz-ctx').classList.add('oculto'); }
  const h = a.h;
  if (a.orig.length === 1) {
    const o = a.orig[0], e = pzEl(o.id);
    const c0 = pzCentro(o);
    const lp = o.rot ? pzRotar(p, c0, -o.rot) : p; // punto en coordenadas del elemento
    let x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
    const oeste = h.endsWith('o'), este = h.endsWith('e'), norte = h[0] === 'n', sur = h[0] === 's';
    if (oeste) x1 = lp.x; if (este) x2 = lp.x;
    if (norte) y1 = lp.y; if (sur) y2 = lp.y;
    const min = 12;
    if (oeste && x2 - x1 < min) x1 = x2 - min;
    if (norte && y2 - y1 < min) y1 = y2 - min;
    let w = Math.max(min, x2 - x1), hh = Math.max(min, y2 - y1);
    const proporcional = (['imagen', 'sello'].includes(o.tipo) ? !shift : shift) && h.length === 2;
    if (proporcional) {
      const k = Math.max(w / o.w, hh / o.h);
      w = o.w * k; hh = o.h * k;
      if (oeste) x1 = x2 - w; else x2 = x1 + w;
      if (norte) y1 = y2 - hh; else y2 = y1 + hh;
    } else { x2 = x1 + w; y2 = y1 + hh; }
    // nuevo centro en coordenadas del mundo
    const nc = o.rot ? pzRotar({ x: (x1 + x2) / 2, y: (y1 + y2) / 2 }, c0, o.rot) : { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    e.w = w; e.h = hh; e.x = nc.x - w / 2; e.y = nc.y - hh / 2;
    if (o.tipo === 'texto' && h.length === 2) { e.estilo.tam = Math.max(4, +(o.estilo.tam * w / o.w).toFixed(1)); }
    if (o.tipo === 'trazo') { /* se escala por vw/vh */ }
    pzReemplazarNodo(e);
    pzRefrescar([e.id]);
    return;
  }
  // Varios elementos: escala desde la esquina opuesta
  const c = a.caja;
  const ax = h.endsWith('o') ? c.x + c.w : c.x, ay = h[0] === 'n' ? c.y + c.h : c.y;
  let k = Math.max(Math.abs(p.x - ax) / c.w, Math.abs(p.y - ay) / c.h);
  k = Math.max(0.05, k);
  for (const o of a.orig) {
    const e = pzEl(o.id);
    if (e.tipo === 'linea') {
      if (!e.desde) e.p1 = { x: ax + (o.p1.x - ax) * k, y: ay + (o.p1.y - ay) * k };
      if (!e.hasta) e.p2 = { x: ax + (o.p2.x - ax) * k, y: ay + (o.p2.y - ay) * k };
      continue;
    }
    e.x = ax + (o.x - ax) * k; e.y = ay + (o.y - ay) * k; e.w = o.w * k; e.h = o.h * k;
    if (e.estilo && (e.tipo === 'texto' || e.ajuste === 'fijo')) e.estilo.tam = Math.max(4, +(o.estilo.tam * k).toFixed(1));
  }
  pzRefrescar(a.orig.map((o) => o.id));
}
function pzAlSoltar(ev) {
  PZ.punteros.delete(ev.pointerId);
  if (PZ.pinza) { if (PZ.punteros.size < 2) PZ.pinza = null; return; }
  const a = PZ.arr;
  PZ.arr = null;
  PZ.guias = [];
  const l = document.getElementById('pz-lienzo');
  l?.classList.remove('arrastrando');
  if (!a) return;
  const t = pzT(), v = pzVista();
  const p = pzAMundo(ev.clientX, ev.clientY);
  switch (a.tipo) {
    case 'pan': return;
    case 'mover': case 'tamano': case 'rotar':
      if (a.movido) { pzGuardar(); pzPintarSel(); pzBarraCtx(); pzMinimapa(); }
      else if (a.tipo === 'mover' && !ev.shiftKey && !ev.ctrlKey && a.yaSel && PZ.sel.size > 1) {
        // segundo clic sobre algo ya seleccionado (por ejemplo, dentro de un grupo): queda solo ese elemento
        PZ.sel = new Set([a.clicId]); pzPintarSel(); pzBarraCtx();
      }
      return;
    case 'marquesina': pzPintarSel(); pzBarraCtx(); return;
    case 'crear': {
      pzAntes();
      const grande = a.rect && a.rect.w * v.z > 8 && a.rect.h * v.z > 8;
      let e;
      if (a.herr === 'marco') {
        const n = t.elementos.filter((x) => x.tipo === 'marco').length + 1;
        e = pzCrearEn('marco', p, grande ? a.rect : null, { titulo: `Marco ${n}` });
      } else if (a.herr === 'texto') {
        e = pzCrearEn('texto', a.inicio, grande ? { ...a.rect, h: 40 } : null);
        e.estilo.tam = Math.round(24 / Math.max(0.4, Math.min(2.5, v.z)));
      } else e = pzCrearEn(a.herr, grande ? null : p, grande ? a.rect : null, a.herr === 'forma' ? { forma: PZ.forma } : {});
      if (!grande && v.z < 0.6 && a.herr !== 'texto' && a.herr !== 'marco') { const k = Math.min(3, 0.8 / v.z); const c = pzCentro(e); e.w *= k; e.h *= k; e.x = c.x - e.w / 2; e.y = c.y - e.h / 2; if (e.estilo) e.estilo.tam = Math.round(e.estilo.tam * k); }
      pzAgregar(e, { editar: ['nota', 'texto'].includes(a.herr) });
      pzGuardar();
      if (!S.config.pizarra?.mantenerHerramienta) { PZ.herramienta = 'seleccionar'; pzRefrescarHerramientas(); l.dataset.herr = 'seleccionar'; }
      pzPintarSel(); pzBarraCtx();
      return;
    }
    case 'linea': case 'conector': {
      const obj = PZ.objetivo;
      PZ.objetivo = null;
      const lejos = Math.hypot(p.x - a.inicio.x, p.y - a.inicio.y) * v.z > 6;
      if (a.tipo === 'conector' && !lejos) { pzCrearConectado(a.desde, a.lado); return; }
      if (!lejos) { pzPintarSel(); return; }
      pzAntes();
      const e = pzNuevoElemento('linea', { p1: { ...a.inicio }, p2: { x: p.x, y: p.y }, desde: a.tipo === 'conector' ? { id: a.desde, lado: a.lado } : a.desde, hasta: obj ? { id: obj, lado: null } : null, ...(S.config.pizarra?.linea || {}) });
      pzAgregar(e);
      pzReemplazarNodo(e);
      pzGuardar();
      if (a.tipo === 'linea' && !S.config.pizarra?.mantenerHerramienta) { PZ.herramienta = 'seleccionar'; pzRefrescarHerramientas(); l.dataset.herr = 'seleccionar'; }
      pzPintarSel(); pzBarraCtx();
      return;
    }
    case 'extremo': {
      const obj = PZ.objetivo;
      PZ.objetivo = null;
      const e = pzEl(a.id);
      if (obj && a.movido) { e[a.cual === 'p1' ? 'desde' : 'hasta'] = { id: obj, lado: null }; pzReemplazarNodo(e); }
      if (a.movido) pzGuardar();
      pzPintarSel();
      return;
    }
    case 'trazo': {
      document.getElementById('pz-trazo-vivo')?.remove();
      const h = PZ[a.herr];
      const pts = pzSimplificar(a.pts, 0.6 / v.z);
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const pad = h.grosor / 2;
      const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
      const w = Math.max(...xs) - Math.min(...xs) + pad * 2, hh = Math.max(...ys) - Math.min(...ys) + pad * 2;
      pzAntes();
      const e = pzNuevoElemento('trazo', { x, y, w, h: hh, vw: w, vh: hh, puntos: pts.map(([px, py]) => [+(px - x).toFixed(1), +(py - y).toFixed(1)]), color: h.color, grosor: h.grosor, opacidad: a.herr === 'resaltador' ? 0.45 : 1, resaltador: a.herr === 'resaltador' });
      pzAgregar(e, { seleccionar: false });
      pzGuardar();
      return;
    }
    case 'borrar': return;
  }
}
function pzCancelarArrastre() { PZ.arr = null; PZ.guias = []; document.getElementById('pz-trazo-vivo')?.remove(); pzPintarSel(); }
// Clic en un punto de conexión: crea una copia vacía conectada en esa dirección (mapas mentales rápidos)
function pzCrearConectado(id, lado) {
  const o = pzEl(id);
  pzAntes();
  const n = structuredClone(o);
  n.id = uid(); delete n.g; n.bloqueado = false;
  if (pzTieneTexto(n)) n.html = '';
  if (n.tipo === 'tabla') n.celdas = n.celdas.map((f) => f.map(() => ''));
  const sep = 90;
  n.x += lado === 'e' ? o.w + sep : lado === 'o' ? -(o.w + sep) : 0;
  n.y += lado === 's' ? o.h + sep : lado === 'n' ? -(o.h + sep) : 0;
  const t = pzT();
  // si el lugar está ocupado, se corre un poco
  for (let i = 0; i < 8 && t.elementos.some((e) => e.tipo !== 'linea' && e.tipo !== 'marco' && e.id !== o.id && pzSeCruzan(pzLimites(e), pzLimites(n))); i++) {
    if (lado === 'e' || lado === 'o') n.y += o.h + 30; else n.x += o.w + 30;
  }
  t.elementos.push(n);
  const opuesto = { n: 's', s: 'n', e: 'o', o: 'e' }[lado];
  const l = pzNuevoElemento('linea', { desde: { id: o.id, lado }, hasta: { id: n.id, lado: opuesto }, ruta: 'curva', ...(S.config.pizarra?.linea || {}) });
  t.elementos.push(l);
  pzGuardar(); pzPintar();
  if (pzTieneTexto(n)) pzEditar(n.id, { seleccionarTodo: false }); else pzSeleccionar([n.id]);
}
function pzDobleClic(ev) {
  if (PZ.editando) return;
  const nodo = ev.target.closest('.pz-el');
  const p = pzAMundo(ev.clientX, ev.clientY);
  if (nodo) {
    const e = pzEl(nodo.dataset.id);
    if (e.tipo === 'imagen') { pzRecortar(e.id); return; }
    if (e.tipo === 'marco') { pzEncuadrar(pzLimites(e)); return; }
    if (e.tipo === 'linea') { setTimeout(() => document.querySelector('#pz-ctx .pz-ctx-input')?.focus(), 30); return; }
    if (e.tipo === 'tabla') { const c = ev.target.closest('.pz-celda'); pzEditar(e.id, { celda: c?.dataset.celda || '0,0', seleccionarTodo: false }); pzColocarCursor(ev); return; }
    if (pzTieneTexto(e)) { pzEditar(e.id, { seleccionarTodo: false }); pzColocarCursor(ev); }
    return;
  }
  if (PZ.herramienta === 'seleccionar') {
    pzAntes();
    const e = pzCrearEn('texto', p);
    e.estilo.tam = Math.round(24 / Math.max(0.4, Math.min(2.5, pzVista().z)));
    pzAgregar(e, { editar: true });
    pzGuardar();
  }
}
function pzColocarCursor(ev) {
  const r = document.caretRangeFromPoint?.(ev.clientX, ev.clientY);
  const inn = pzNodoEdicion();
  if (r && inn?.contains(r.startContainer)) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); PZ.rango = r.cloneRange(); }
}
function pzSiguienteCelda(d) {
  const { id, celda } = PZ.editando;
  const e = pzEl(id);
  let [r, c] = celda.split(',').map(Number);
  c += d;
  if (c >= e.cols) { c = 0; r++; } if (c < 0) { c = e.cols - 1; r--; }
  if (r >= e.filas) { pzTerminarEdicion(); pzTablaOp(id, '+fila'); r = e.filas - 1; }
  if (r < 0) r = 0;
  pzTerminarEdicion();
  pzEditar(id, { celda: `${r},${c}` });
}
function pzRueda(ev) {
  ev.preventDefault();
  const l = document.getElementById('pz-lienzo').getBoundingClientRect();
  const cx = ev.clientX - l.left, cy = ev.clientY - l.top;
  const v = pzVista();
  const raton = ev.deltaMode === 1 || (ev.deltaX === 0 && Math.abs(ev.deltaY) >= 50 && Number.isInteger(ev.deltaY));
  if (ev.ctrlKey || ev.metaKey || (raton && !ev.shiftKey && S.config.pizarra?.ruedaZoom !== false)) {
    const d = ev.deltaMode === 1 ? ev.deltaY * 33 : ev.deltaY;
    pzZoom(Math.exp(-d * (ev.ctrlKey && !raton ? 0.01 : 0.0015)), cx, cy);
  } else {
    v.x -= ev.shiftKey && !ev.deltaX ? ev.deltaY : ev.deltaX; v.y -= ev.shiftKey && !ev.deltaX ? 0 : ev.deltaY;
    pzAplicarVista();
  }
}
function pzTeclado(ev) {
  if (!pzActivo()) return;
  const k = ev.key, ctrl = ev.ctrlKey || ev.metaKey;
  if (k === 'Escape' && (PZ.popAbierto || document.getElementById('pz-menu-ctx'))) {
    ev.preventDefault(); ev.stopPropagation();
    pzCerrarPop(); document.getElementById('pz-menu-ctx')?.remove();
    if (PZ.editando) pzRestaurarRango();
    return;
  }
  if (PZ.presentando && !PZ.editando) {
    if (['ArrowRight', 'PageDown', ' '].includes(k) && !ev.target.matches?.('input')) { ev.preventDefault(); pzIrMarco(1); return; }
    if (['ArrowLeft', 'PageUp'].includes(k)) { ev.preventDefault(); pzIrMarco(-1); return; }
    if (k === 'Escape') { ev.preventDefault(); pzTerminarPresentacion(); return; }
  }
  if (PZ.editando) {
    if (ctrl && (k === 'z' || k === 'Z' || k === 'y')) return; // deshacer dentro del texto (nativo)
    return;
  }
  if (pzEnCampo(ev.target)) return;
  if (k === ' ' && !PZ.espacio) { ev.preventDefault(); PZ.espacio = true; document.getElementById('pz-lienzo').dataset.herr = 'mano'; return; }
  if (ctrl) {
    const kk = k.toLowerCase();
    if (kk === 'z' && !ev.shiftKey) { ev.preventDefault(); pzDeshacer(); return; }
    if ((kk === 'z' && ev.shiftKey) || kk === 'y') { ev.preventDefault(); pzRehacer(); return; }
    if (kk === 'a') { ev.preventDefault(); pzSeleccionar(pzT().elementos.map((e) => e.id)); return; }
    if (kk === 'd') { ev.preventDefault(); pzDuplicar(); return; }
    if (kk === 'g') { ev.preventDefault(); pzAlinear(ev.shiftKey ? 'desagrupar' : 'agrupar'); return; }
    if (kk === 'l' && ev.shiftKey) { ev.preventDefault(); pzBloquear(); return; }
    if (k === ']' || k === '}') { ev.preventDefault(); pzOrden(ev.shiftKey ? 'frente' : 'adelante'); return; }
    if (k === '[' || k === '{') { ev.preventDefault(); pzOrden(ev.shiftKey ? 'fondo' : 'atras'); return; }
    if (k === '=' || k === '+') { ev.preventDefault(); pzZoomBoton(1.25); return; }
    if (k === '-') { ev.preventDefault(); pzZoomBoton(1 / 1.25); return; }
    if (k === '0') { ev.preventDefault(); pzZoomA(1); return; }
    if (['b', 'i', 'u'].includes(kk) && PZ.sel.size) { ev.preventDefault(); pzFormato({ b: 'negrita', i: 'cursiva', u: 'subrayado' }[kk]); return; }
    return;
  }
  if (ev.shiftKey && (k === '!' || ev.code === 'Digit1')) { ev.preventDefault(); pzEncuadrar(); return; }
  if (ev.shiftKey && (k === '=' || ev.code === 'Digit0')) { ev.preventDefault(); pzZoomA(1); return; }
  if (ev.shiftKey && ev.code === 'Digit2') { ev.preventDefault(); const s = pzSeleccionados(); if (s.length) pzEncuadrar(pzUnion(s.map(pzLimites))); return; }
  if (k === 'Delete' || k === 'Backspace') { if (PZ.sel.size) { ev.preventDefault(); pzEliminar(); } return; }
  if (k === 'Escape') {
    if (PZ.arr) { pzCancelarArrastre(); return; }
    if (PZ.sel.size) { PZ.sel.clear(); pzPintarSel(); pzBarraCtx(); return; }
    if (PZ.herramienta !== 'seleccionar') pzHerramienta('seleccionar');
    return;
  }
  if (k.startsWith('Arrow') && PZ.sel.size) {
    ev.preventDefault();
    const d = ev.shiftKey ? 10 : 1;
    pzMoverSel(k === 'ArrowLeft' ? -d : k === 'ArrowRight' ? d : 0, k === 'ArrowUp' ? -d : k === 'ArrowDown' ? d : 0);
    return;
  }
  const sel = pzSeleccionados();
  if (k === 'Enter' && sel.length === 1 && (pzTieneTexto(sel[0]) || sel[0].tipo === 'tabla')) { ev.preventDefault(); pzEditar(sel[0].id, { seleccionarTodo: true }); return; }
  // Escribir con una nota seleccionada empieza a editarla (reemplazando el texto)
  if (k.length === 1 && !ev.altKey && sel.length === 1 && pzTieneTexto(sel[0]) && !sel[0].bloqueado) { pzEditar(sel[0].id, { seleccionarTodo: true }); return; }
  const atajos = { v: 'seleccionar', h: 'mano', n: 'nota', t: 'texto', s: 'forma', r: 'forma', o: 'forma', l: 'linea', p: 'lapiz', m: 'resaltador', e: 'borrador', f: 'marco' };
  const kk = k.toLowerCase();
  if (atajos[kk] && !ev.altKey) {
    if (kk === 'r') PZ.forma = 'rect';
    if (kk === 'o') PZ.forma = 'elipse';
    pzHerramienta(atajos[kk]);
    return;
  }
  if (kk === 'i') { pzElegirImagen(); }
}
async function pzPegarSistema(ev) {
  if (!pzActivo() || PZ.editando || pzEnCampo(ev.target)) return;
  if (Date.now() - (PZ.ultimoPegado || 0) < 120) { ev.preventDefault(); return; } // evita pegar dos veces (atajo del menú + teclado)
  PZ.ultimoPegado = Date.now();
  const dt = ev.clipboardData;
  const archivos = [...(dt?.files || [])];
  const texto = dt?.getData('text/plain') || '';
  ev.preventDefault();
  if (archivos.some((f) => /^image\//.test(f.type))) { pzInsertarArchivos(archivos, PZ.ultimoPuntero || pzCentroVista()); return; }
  if (PZ.portapapeles && (!texto || texto === PZ.portapapeles.texto)) { pzPegarElementos(); return; }
  if (texto.trim()) {
    pzAntes();
    const partes = texto.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).slice(0, 40);
    const p = PZ.ultimoPuntero || pzCentroVista();
    const ids = [];
    partes.forEach((tx, i) => {
      const e = pzCrearEn('nota', { x: p.x + (i % 5) * 220, y: p.y + Math.floor(i / 5) * 220 }, null, { html: pzTextoAHTML(tx) });
      pzAgregar(e, { seleccionar: false }); ids.push(e.id);
    });
    pzGuardar(); pzSeleccionar(ids);
  }
}
function pzPegarEnTexto(ev) {
  if (!PZ.editando) return;
  const dt = ev.clipboardData;
  ev.preventDefault();
  ev.stopPropagation();
  const archivos = [...(dt?.files || [])].filter((f) => /^image\//.test(f.type));
  if (archivos.length) { const id = PZ.editando.id; pzTerminarEdicion(); const e = pzEl(id); pzInsertarArchivos(archivos, e ? { x: e.x + e.w + 260, y: e.y + e.h / 2 } : null); return; }
  const html = dt.getData('text/html');
  if (html && S.config.pizarra?.pegarConFormato) document.execCommand('insertHTML', false, pzLimpiarHTML(html));
  else document.execCommand('insertText', false, dt.getData('text/plain'));
}
function pzMenuContextual(ev) {
  document.getElementById('pz-menu-ctx')?.remove();
  const nodo = ev.target.closest('.pz-el');
  if (nodo && !PZ.sel.has(nodo.dataset.id)) pzSeleccionar([nodo.dataset.id]);
  PZ.ultimoPuntero = pzAMundo(ev.clientX, ev.clientY);
  const hay = PZ.sel.size > 0;
  const op = (fn, t, atajo = '', on = true) => on ? `<button onclick="document.getElementById('pz-menu-ctx').remove();${fn}">${t}<span>${atajo}</span></button>` : '';
  const m = document.createElement('div');
  m.id = 'pz-menu-ctx'; m.className = 'pz-menu-ctx';
  m.innerHTML = hay ? op('pzCopiar()', 'Copiar', 'Ctrl+C') + op('pzCopiar(true)', 'Cortar', 'Ctrl+X') + op('pzDuplicar()', 'Duplicar', 'Ctrl+D') + op('pzPegarElementos()', 'Pegar', 'Ctrl+V', !!PZ.portapapeles)
    + '<hr>' + op("pzOrden('frente')", 'Traer al frente', 'Ctrl+Shift+]') + op("pzOrden('adelante')", 'Traer adelante', 'Ctrl+]') + op("pzOrden('atras')", 'Enviar atrás', 'Ctrl+[') + op("pzOrden('fondo')", 'Enviar al fondo', 'Ctrl+Shift+[')
    + '<hr>' + op("pzAlinear('agrupar')", 'Agrupar', 'Ctrl+G', PZ.sel.size > 1) + op("pzAlinear('desagrupar')", 'Desagrupar', 'Ctrl+Shift+G', pzSeleccionados().some((e) => e.g)) + op('pzBloquear()', pzSeleccionados().every((e) => e.bloqueado) ? 'Desbloquear' : 'Bloquear', 'Ctrl+Shift+L')
    + op('pzEncuadrar(pzUnion(pzSeleccionados().map(pzLimites)))', 'Acercar a la selección', 'Shift+2') + '<hr>' + op('pzEliminar()', 'Eliminar', 'Supr')
    : op('pzPegarElementos()', 'Pegar', 'Ctrl+V', !!PZ.portapapeles) + op("pzSeleccionar(pzT().elementos.map(e=>e.id))", 'Seleccionar todo', 'Ctrl+A') + op('pzEncuadrar()', 'Ver todo', 'Shift+1')
      + '<hr>' + op("pzAgregarRapido('nota')", 'Agregar nota') + op("pzAgregarRapido('texto')", 'Agregar texto') + op('pzElegirImagen()', 'Insertar imagen…') + op('pzDialogoFondo()', 'Fondo del tablero…');
  document.getElementById('pz-area').appendChild(m);
  const ra = document.getElementById('pz-area').getBoundingClientRect();
  m.style.left = Math.min(ev.clientX - ra.left, ra.width - m.offsetWidth - 6) + 'px';
  m.style.top = Math.min(ev.clientY - ra.top, ra.height - m.offsetHeight - 6) + 'px';
}
function pzAgregarRapido(tipo) {
  pzAntes();
  const e = pzCrearEn(tipo, PZ.ultimoPuntero || pzCentroVista());
  pzAgregar(e, { editar: true });
  pzGuardar();
}

// ---------- Plantillas para la clase ----------
const PZ_PLANTILLAS = {
  lluvia: { t: '💡 Lluvia de ideas', d: 'Pregunta central y notas alrededor' },
  mapa: { t: '🧠 Mapa mental', d: 'Tema central con ramas conectadas' },
  sqa: { t: '📘 Cuadro S-Q-A', d: 'Lo que Sé, lo que Quiero saber, lo que Aprendí' },
  venn: { t: '⚪ Diagrama de Venn', d: 'Comparar dos conceptos' },
  linea: { t: '🕰️ Línea de tiempo', d: 'Hechos ordenados en el tiempo' },
  kanban: { t: '🗂️ Tablero de tareas', d: 'Por hacer, En proceso, Terminado' },
  retro: { t: '🔁 Retroalimentación', d: 'Qué salió bien, qué mejorar, compromisos' },
  causa: { t: '🐟 Causa y efecto', d: 'Problema central con causas y consecuencias' },
  matriz: { t: '⊞ Matriz 2 × 2', d: 'Clasificar ideas en cuatro cuadrantes' },
  clase: { t: '📝 Momentos de la clase', d: 'Exploración, estructuración, práctica, transferencia y valoración (con el texto de la sesión vinculada)' },
};
function pzMenuPlantillas(boton) {
  pzAbrirPop(boton, `<div class="pz-plantillas">${Object.entries(PZ_PLANTILLAS).map(([k, p]) => `<button onclick="pzCerrarPop();pzInsertarPlantilla('${k}')"><b>${p.t}</b><span>${p.d}</span></button>`).join('')}</div>`, 'pz-pop-plantillas');
}
function pzInsertarPlantilla(k) {
  const t = pzT();
  pzTerminarEdicion();
  pzAntes();
  const c = pzCentroVista();
  const els = [];
  const nota = (x, y, html, color = '#fff59d', w = 200, h = 200, extra = {}) => { const e = pzNuevoElemento('nota', { x, y, w, h, color, html: pzTextoAHTML(html), ...extra }); els.push(e); return e; };
  const texto = (x, y, html, tam = 32, w = 400, extra = {}) => { const e = pzNuevoElemento('texto', { x, y, w, html: `<b>${esc(html)}</b>`, estilo: pzEstiloTexto({ tam, alinH: 'center', alinV: 'top' }), ...extra }); els.push(e); return e; };
  const forma = (x, y, w, h, f, rel, bor, html = '', extra = {}) => { const e = pzNuevoElemento('forma', { x, y, w, h, forma: f, relleno: rel, borde: bor, html: html ? pzTextoAHTML(html) : '', ...extra }); els.push(e); return e; };
  const linea = (a, b, extra = {}) => { const e = pzNuevoElemento('linea', { desde: { id: a.id, lado: null }, hasta: { id: b.id, lado: null }, ...extra }); els.push(e); return e; };
  const marco = (x, y, w, h, titulo, color = '#ffffff') => { const e = pzNuevoElemento('marco', { x, y, w, h, titulo, color }); els.push(e); return e; };
  const p = t.planeacionId && porId(S.planeaciones, t.planeacionId);
  const ses = p && (p.sesiones || []).find((s) => s.id === t.sesionId);
  const tema = ses?.titulo || p?.titulo || t.titulo || '';
  switch (k) {
    case 'lluvia': {
      const centro = forma(-160, -90, 320, 180, 'nube', '#e3f2fd', '#1e88e5', p?.pregunta || tema || '¿Pregunta central?', { estilo: pzEstiloTexto({ tam: 26, negrita: true }) });
      const colores = ['#fff59d', '#ffcc80', '#a5d6a7', '#90caf9', '#f48fb1', '#ce93d8'];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; const n = nota(Math.cos(a) * 420 - 90, Math.sin(a) * 300 - 90, '', colores[i], 180, 180); linea(centro, n, { fin: 'ninguna', trazo: 'guiones', color: '#90a4ae' }); }
      break;
    }
    case 'mapa': {
      const centro = forma(-150, -60, 300, 120, 'redondeado', '#1f4e79', '#1f4e79', tema || 'Tema central', { estilo: pzEstiloTexto({ tam: 28, negrita: true, color: '#ffffff' }) });
      const colores = [['#e3f2fd', '#1e88e5'], ['#e8f5e9', '#43a047'], ['#fff3e0', '#fb8c00'], ['#f3e5f5', '#8e24aa']];
      const pos = [[-520, -260], [320, -260], [-520, 200], [320, 200]];
      pos.forEach(([x, y], i) => {
        const r = forma(x, y, 200, 80, 'redondeado', colores[i][0], colores[i][1], `Idea ${i + 1}`, { estilo: pzEstiloTexto({ tam: 20, negrita: true }) });
        linea(centro, r, { ruta: 'curva', fin: 'ninguna', color: colores[i][1], grosor: 3 });
        for (let j = 0; j < 2; j++) { const s = forma(x + (i % 2 ? 260 : -240), y - 60 + j * 120, 180, 60, 'redondeado', '#ffffff', colores[i][1], 'Detalle', { estilo: pzEstiloTexto({ tam: 16 }) }); linea(r, s, { ruta: 'curva', fin: 'ninguna', color: colores[i][1] }); }
      });
      break;
    }
    case 'sqa': case 'kanban': case 'retro': {
      const cols = { sqa: [['S – ¿Qué sé?', '#fff59d'], ['Q – ¿Qué quiero saber?', '#90caf9'], ['A – ¿Qué aprendí?', '#a5d6a7']],
        kanban: [['Por hacer', '#ffcc80'], ['En proceso', '#90caf9'], ['Terminado', '#a5d6a7']],
        retro: [['😀 Qué salió bien', '#a5d6a7'], ['🤔 Qué podemos mejorar', '#ffcc80'], ['🎯 Compromisos', '#90caf9']] }[k];
      cols.forEach(([tit, col], i) => {
        const x = -630 + i * 430;
        marco(x, -380, 400, 760, tit, '#f7f9fc');
        nota(x + 20, -300, '', col, 170, 170); nota(x + 210, -300, '', col, 170, 170);
        nota(x + 20, -110, '', col, 170, 170);
      });
      if (tema) texto(-400, -480, tema, 36, 800);
      break;
    }
    case 'venn': {
      forma(-420, -260, 520, 520, 'elipse', 'rgba(30,136,229,.18)', '#1e88e5', '', { opacidad: 1 });
      forma(-100, -260, 520, 520, 'elipse', 'rgba(229,57,53,.15)', '#e53935', '');
      texto(-400, -330, 'Concepto A', 30, 360); texto(40, -330, 'Concepto B', 30, 360); texto(-120, -40, 'Ambos', 26, 240);
      break;
    }
    case 'linea': {
      const base = forma(-700, -10, 1400, 20, 'flechaDer', '#1f4e79', '#1f4e79', '', { grosor: 0 });
      void base;
      for (let i = 0; i < 5; i++) {
        const x = -620 + i * 290;
        forma(x + 70, -22, 44, 44, 'elipse', '#ffffff', '#1f4e79', String(i + 1), { grosor: 4, estilo: pzEstiloTexto({ tam: 18, negrita: true }) });
        nota(x, i % 2 ? 60 : -260, 'Fecha / hecho', ['#fff59d', '#ffcc80', '#a5d6a7', '#90caf9', '#f48fb1'][i], 190, 180);
      }
      if (tema) texto(-400, -380, tema, 36, 800);
      break;
    }
    case 'causa': {
      const prob = forma(320, -70, 300, 140, 'redondeado', '#ffebee', '#e53935', 'Problema', { estilo: pzEstiloTexto({ tam: 26, negrita: true }) });
      for (let i = 0; i < 4; i++) {
        const n = nota(-560 + (i % 2) * 380, i < 2 ? -380 : 200, 'Causa', '#ffcc80', 180, 160);
        linea(n, prob, { color: '#e53935', grosor: 2 });
      }
      const ef = nota(760, -90, 'Consecuencia', '#ce93d8', 180, 180);
      linea(prob, ef, { color: '#8e24aa', grosor: 2 });
      break;
    }
    case 'matriz': {
      const q = [['Importante y urgente', '#ffcdd2'], ['Importante, no urgente', '#c8e6c9'], ['Urgente, no importante', '#fff9c4'], ['Ni urgente ni importante', '#e1f5fe']];
      q.forEach(([tit, col], i) => marco(-520 + (i % 2) * 530, -420 + Math.floor(i / 2) * 430, 510, 410, tit, col));
      break;
    }
    case 'clase': {
      const cols = MOMENTOS.map((m) => [m.t, ses ? ses[m.k] : '', ses ? ses[m.k + 'Med'] : '']);
      const colores = ['#bbdefb', '#c8e6c9', '#fff9c4', '#ffe0b2', '#e1bee7'];
      if (tema || p) texto(-700, -620, `${tema || 'Clase'}${ses?.fecha ? ' · ' + fechaLarga(ses.fecha) : ''}`, 36, 1400);
      cols.forEach(([tit, acc, med], i) => {
        const x = -1150 + i * 470;
        marco(x, -470, 450, 900, tit, colores[i]);
        nota(x + 20, -400, acc || 'Acciones…', '#ffffff', 410, 420, { estilo: pzEstiloTexto({ tam: 20, alinH: 'left', alinV: 'top' }), ajuste: 'auto' });
        nota(x + 20, 40, med ? 'Recursos: ' + med : 'Recursos y materiales…', '#fff59d', 410, 200, { estilo: pzEstiloTexto({ tam: 18, alinH: 'left', alinV: 'top' }) });
      });
      if (!ses) aviso('Vincula el tablero a una sesión para llenar los momentos con lo que planeaste.', '');
      break;
    }
  }
  // centrar en la vista actual, o al lado de lo que ya hay si se superpone
  const b = pzUnion(els.filter((e) => e.tipo !== 'linea').map(pzLimites));
  const { dx, dy } = pzLugarLibre(b, c);
  for (const e of els) { if (e.tipo === 'linea') continue; e.x += dx; e.y += dy; if (e.tipo === 'marco') t.elementos.unshift(e); }
  for (const e of els) if (e.tipo !== 'marco') t.elementos.push(e);
  pzGuardar(); pzPintar();
  pzEncuadrar(pzUnion(els.filter((e) => e.tipo !== 'linea').map(pzLimites)));
  PZ.sel = new Set(els.map((e) => e.id)); pzPintarSel(); pzBarraCtx();
}

function pzLugarLibre(b, c = pzCentroVista()) {
  const t = pzT();
  let dx = c.x - (b.x + b.w / 2), dy = c.y - (b.y + b.h / 2);
  const ocupado = t.elementos.filter((e) => e.tipo !== 'linea').map(pzLimites);
  const destino = { x: b.x + dx, y: b.y + dy, w: b.w, h: b.h };
  if (ocupado.some((o) => pzSeCruzan(o, destino))) {
    const todo = pzUnion(ocupado);
    dx = todo.x + todo.w + 200 - b.x; dy = todo.y - b.y;
  }
  return { dx, dy };
}

// ---------- Insertar desde el planeador ----------
function pzMenuInsertar(boton) {
  pzAbrirPop(boton, `<div class="pz-plantillas">
    <button onclick="pzCerrarPop();pzDialogoEstudiantes()"><b>🧑‍🎓 Estudiantes del grupo</b><span>Una nota por estudiante (para asignar, votar u organizar)</span></button>
    <button onclick="pzCerrarPop();pzInsertarPlantilla('clase')"><b>📝 Momentos de la sesión</b><span>Lo planeado para la sesión vinculada</span></button>
    <button onclick="pzCerrarPop();pzInsertarObjetivo()"><b>🎯 Objetivo y pregunta</b><span>De la planeación vinculada</span></button>
    <button onclick="pzCerrarPop();pzElegirImagen()"><b>🖼️ Imagen</b><span>Desde el equipo (también puedes pegar con Ctrl+V o arrastrar)</span></button>
    <button onclick="pzCerrarPop();pzAgregarRapido('tabla')"><b>▦ Tabla</b><span>Tabla editable de 3 × 3</span></button>
    <button onclick="pzCerrarPop();pzAgregarMarco()"><b>⬚ Marco / diapositiva</b><span>Para presentar paso a paso</span></button>
  </div>`, 'pz-pop-plantillas');
}
function pzAgregarMarco(tam = [1280, 720]) {
  const t = pzT(), c = pzCentroVista();
  pzAntes();
  const marcos = t.elementos.filter((e) => e.tipo === 'marco');
  const ult = marcos[marcos.length - 1];
  const e = pzNuevoElemento('marco', { w: tam[0], h: tam[1], titulo: `Marco ${marcos.length + 1}` });
  if (ult) { e.x = ult.x + ult.w + 120; e.y = ult.y; } else { e.x = c.x - e.w / 2; e.y = c.y - e.h / 2; }
  pzAgregar(e); pzGuardar();
  pzEncuadrar(pzLimites(e));
}
function pzInsertarObjetivo() {
  const t = pzT(), p = t.planeacionId && porId(S.planeaciones, t.planeacionId);
  if (!p) { aviso('Primero vincula el tablero a una planeación.', 'error'); pzDialogoVinculo(t.id); return; }
  pzAntes();
  const c = pzCentroVista();
  const ids = [];
  const add = (e) => { pzAgregar(e, { seleccionar: false }); ids.push(e.id); };
  let y = c.y - 200;
  add(pzNuevoElemento('texto', { x: c.x - 400, y, w: 800, html: `<b>${esc(p.titulo || 'Planeación')}</b>`, estilo: pzEstiloTexto({ tam: 40, alinH: 'center' }) }));
  y += 90;
  if (p.objetivo) { add(pzNuevoElemento('forma', { forma: 'redondeado', x: c.x - 400, y, w: 800, h: 150, relleno: '#e8f5e9', borde: '#43a047', html: '🎯 ' + pzTextoAHTML(p.objetivo), estilo: pzEstiloTexto({ tam: 22, alinH: 'left' }) })); y += 180; }
  if (p.pregunta) add(pzNuevoElemento('forma', { forma: 'globo', x: c.x - 400, y, w: 800, h: 200, relleno: '#e3f2fd', borde: '#1e88e5', html: '❓ ' + pzTextoAHTML(p.pregunta), estilo: pzEstiloTexto({ tam: 24 }) }));
  pzGuardar(); pzSeleccionar(ids);
}
function pzDialogoEstudiantes() {
  const t = pzT();
  const grupos = t.grupoIds.length ? t.grupoIds.map((g) => porId(S.grupos, g)).filter(Boolean) : [...S.grupos].sort(ordenGrupos);
  if (!grupos.length) { aviso('Aún no tienes grupos con estudiantes.', 'error'); return; }
  abrirModal(`<h2>🧑‍🎓 Insertar estudiantes</h2>
    <div class="rejilla r2"><div class="campo"><label>Grupo</label><select id="pz-est-grupo">${opciones(grupos, grupos[0].id, { texto: nombreGrupo })}</select></div>
    <div class="campo"><label>Color de las notas</label><select id="pz-est-color">${[['#fff59d', 'Amarillo'], ['#90caf9', 'Azul'], ['#a5d6a7', 'Verde'], ['#f48fb1', 'Rosado'], ['#ffcc80', 'Naranja'], ['varios', 'Varios colores']].map(([v, tx]) => `<option value="${v}">${tx}</option>`).join('')}</select></div></div>
    <label style="font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" id="pz-est-nombre" checked> Solo nombre y primer apellido</label>
    <label style="font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" id="pz-est-azar"> Orden al azar</label>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="pzInsertarEstudiantes()">Insertar</button></div>`);
}
function pzInsertarEstudiantes() {
  const g = document.getElementById('pz-est-grupo').value, color = document.getElementById('pz-est-color').value;
  const corto = document.getElementById('pz-est-nombre').checked, azar = document.getElementById('pz-est-azar').checked;
  cerrarModal();
  let lista = alumnosDe(g);
  if (!lista.length) { aviso('Ese grupo no tiene estudiantes.', 'error'); return; }
  if (azar) lista = lista.map((a) => [Math.random(), a]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  pzAntes();
  const cols = Math.ceil(Math.sqrt(lista.length * 1.6));
  const W = 170, H = 110, sep = 16;
  const caja = { x: 0, y: 0, w: cols * (W + sep), h: Math.ceil(lista.length / cols) * (H + sep) };
  const { dx: x0, dy: y0 } = pzLugarLibre(caja);
  const ids = [];
  lista.forEach((a, i) => {
    const nombre = corto ? `${String(a.nombres || '').split(' ')[0]} ${String(a.apellidos || '').split(' ')[0]}`.trim() : nombreAlumno(a);
    const e = pzNuevoElemento('nota', { x: x0 + (i % cols) * (W + sep), y: y0 + Math.floor(i / cols) * (H + sep), w: W, h: H, color: color === 'varios' ? PZ_COLORES_NOTA[i % 14] : color, html: esc(nombre), estilo: pzEstiloTexto({ tam: 22 }), alumnoId: a.id });
    pzAgregar(e, { seleccionar: false }); ids.push(e.id);
  });
  pzGuardar(); pzSeleccionar(ids);
  pzEncuadrar(pzUnion(pzSeleccionados().map(pzLimites)));
}
function pzAulaDesdeTablero() {
  const t = pzT();
  pzTerminarEdicion();
  abrirAula(t.grupoIds[0] || '', t.areaId || '');
}

// ---------- Vínculo con planeación, sesión y grupos ----------
function pzDialogoVinculo(id) {
  const t = S.pizarras.find((x) => x.id === id);
  const planes = [...S.planeaciones].sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));
  abrirModal(`<h2>🔗 Asignar el tablero</h2>
    <p class="ayuda">Asocia el tablero a la sesión de clase en la que lo vas a usar y a los grupos que trabajan en él. Así lo encuentras desde la planeación, desde tus clases del día y en la lista de tableros.</p>
    <div class="campo"><label>Título del tablero</label><input id="pz-v-titulo" value="${esc(t.titulo)}" placeholder="Ej.: Lluvia de ideas – fracciones"></div>
    <div class="campo"><label>Planeación</label><select id="pz-v-plan" onchange="pzVinculoPlan()"><option value="">(sin planeación)</option>${planes.map((p) => `<option value="${p.id}" ${p.id === t.planeacionId ? 'selected' : ''}>${esc(fechaCorta(p.fechaInicio))} · ${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))} · ${esc(p.titulo || 'Sin título')}</option>`).join('')}</select></div>
    <div class="rejilla r2"><div class="campo"><label>Sesión</label><select id="pz-v-sesion" onchange="pzVinculoSesion()"></select></div>
    <div class="campo"><label>Fecha de uso</label><input type="date" id="pz-v-fecha" value="${esc(t.fecha || '')}"></div></div>
    <div class="campo"><label>Área</label><select id="pz-v-area">${opcionesAreas(t.areaId, '(sin área)')}</select></div>
    <div class="campo"><label>Grupos</label><div class="fila" id="pz-v-grupos">${[...S.grupos].sort(ordenGrupos).map((g) => `<label class="chip" style="font-weight:normal;cursor:pointer;font-size:13px;padding:4px 10px"><input type="checkbox" class="pz-v-g" value="${g.id}" ${t.grupoIds.includes(g.id) ? 'checked' : ''}> ${esc(nombreGrupo(g))}</label>`).join('') || '<span class="ayuda">Aún no tienes grupos.</span>'}</div></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="pzGuardarVinculo('${t.id}')">Guardar</button></div>`);
  pzVinculoPlan(t.sesionId, true);
}
function pzVinculoPlan(sesionId, inicial = false) {
  const p = porId(S.planeaciones, document.getElementById('pz-v-plan').value);
  const sel = document.getElementById('pz-v-sesion');
  sel.innerHTML = p ? `<option value="">(toda la planeación)</option>${(p.sesiones || []).map((s, i) => `<option value="${s.id}" ${s.id === sesionId ? 'selected' : ''}>Sesión ${i + 1}${s.fecha ? ' · ' + esc(fechaCorta(s.fecha)) : ''}${s.titulo ? ' · ' + esc(s.titulo) : ''}</option>`).join('')}` : '<option value="">—</option>';
  if (!p || inicial) return;
  // Grupo, área y grupos vinculados de la planeación
  const ids = new Set([p.grupoId, ...(p.vinculadas || []).map((v) => porId(S.planeaciones, v)?.grupoId)].filter(Boolean));
  for (const c of document.querySelectorAll('.pz-v-g')) if (ids.has(c.value)) c.checked = true;
  if (p.areaId) document.getElementById('pz-v-area').value = p.areaId;
  if (!sesionId && p.sesiones?.length) { const hoy = hoyISO(); const s = p.sesiones.find((x) => x.fecha >= hoy) || p.sesiones[0]; sel.value = s.id; }
  pzVinculoSesion();
}
function pzVinculoSesion() {
  const p = porId(S.planeaciones, document.getElementById('pz-v-plan').value);
  const s = p && (p.sesiones || []).find((x) => x.id === document.getElementById('pz-v-sesion').value);
  if (s?.fecha) document.getElementById('pz-v-fecha').value = s.fecha;
  const tit = document.getElementById('pz-v-titulo');
  if (!tit.value && (s?.titulo || p?.titulo)) tit.value = s?.titulo || p.titulo;
}
function pzGuardarVinculo(id) {
  const t = S.pizarras.find((x) => x.id === id);
  t.titulo = document.getElementById('pz-v-titulo').value.trim();
  t.planeacionId = document.getElementById('pz-v-plan').value;
  t.sesionId = t.planeacionId ? document.getElementById('pz-v-sesion').value : '';
  t.fecha = document.getElementById('pz-v-fecha').value;
  t.areaId = document.getElementById('pz-v-area').value;
  t.grupoIds = [...document.querySelectorAll('.pz-v-g:checked')].map((c) => c.value);
  t.modificada = new Date().toISOString();
  guardar();
  cerrarModal();
  if (ui.vista === 'pizarra') {
    const v = document.querySelector('.pz-vinculo'); if (v) v.innerHTML = pzChipsVinculo(t);
    const ti = document.querySelector('.pz-titulo'); if (ti) ti.value = t.titulo;
  } else render();
  aviso('Tablero asignado', 'ok');
}
function pzCambiarTitulo(v) { const t = pzT(); t.titulo = v.trim(); pzGuardar(); }
// Desde una sesión de la planeación: abre su tablero o crea uno vinculado
function pzAbrirDeSesion(planId, sesionId) {
  const lista = S.pizarras.filter((t) => t.planeacionId === planId && t.sesionId === sesionId);
  if (lista.length === 1) { pzAbrir(lista[0].id); return; }
  if (lista.length > 1) {
    abrirModal(`<h2>🖍️ Tableros de esta sesión</h2><ul class="lista-simple">${lista.map((t) => `<li><div><b>${esc(t.titulo || 'Sin título')}</b><br><span class="ayuda">${t.elementos.length} elementos · modificado ${esc(fechaCorta(t.modificada?.slice(0, 10)))}</span></div><button class="btn pequeno primario" onclick="cerrarModal();pzAbrir('${t.id}')">Abrir</button></li>`).join('')}</ul>
      <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn" onclick="cerrarModal();pzCrearParaSesion('${planId}','${sesionId}')">＋ Nuevo tablero</button></div>`);
    return;
  }
  pzCrearParaSesion(planId, sesionId);
}
function pzCrearParaSesion(planId, sesionId, plantilla) {
  const p = porId(S.planeaciones, planId);
  const s = p && (p.sesiones || []).find((x) => x.id === sesionId);
  const grupos = p ? [p.grupoId, ...(p.vinculadas || []).map((v) => porId(S.planeaciones, v)?.grupoId)].filter(Boolean) : [];
  const t = pzNuevoTablero({ titulo: s?.titulo || p?.titulo || '', planeacionId: planId || '', sesionId: sesionId || '', grupoIds: [...new Set(grupos)], areaId: p?.areaId || '', fecha: s?.fecha || p?.fechaInicio || hoyISO() });
  guardar();
  pzAbrir(t.id);
  if (plantilla) setTimeout(() => pzInsertarPlantilla(plantilla), 60);
}
function pzTablerosDeSesion(planId, sesionId) { return (S.pizarras || []).filter((t) => t.planeacionId === planId && t.sesionId === sesionId); }
function pzBotonSesion(planId, sesionId) {
  const n = pzTablerosDeSesion(planId, sesionId).length;
  return `<button class="btn pequeno ${n ? 'primario' : ''}" title="${n ? 'Abrir el tablero de esta sesión' : 'Crear un tablero (pizarra) para esta sesión'}" onclick="pzAbrirDeSesion('${planId}','${sesionId}')">🖍️ Tablero${n > 1 ? ` (${n})` : n ? ' ✓' : ''}</button>`;
}
function pzAbrir(id) {
  PZ.id = id; PZ.sel = new Set(); PZ.editando = null; PZ.deshacer = []; PZ.rehacer = []; PZ.arr = null; PZ.cacheAjuste.clear(); PZ.presentando = false;
  ir('pizarra', { id });
}
function pzSalir() {
  pzTerminarEdicion();
  pzLimpiarRecursos();
  if (PZ.presentando) pzTerminarPresentacion();
  ir('pizarras');
}
// Elimina del archivo las imágenes que ya no usa ningún elemento
function pzLimpiarRecursos(t = pzT()) {
  if (!t) return;
  const usados = new Set(t.elementos.filter((e) => e.tipo === 'imagen').map((e) => e.rid));
  for (const k of Object.keys(t.recursos || {})) if (!usados.has(k)) delete t.recursos[k];
  guardar();
}

// ---------- Presentación ----------
function pzMarcosOrdenados() {
  const marcos = pzT().elementos.filter((e) => e.tipo === 'marco');
  return marcos.sort((a, b) => (Math.abs(a.y - b.y) < Math.min(a.h, b.h) / 2 ? a.x - b.x : a.y - b.y));
}
function pzPresentar(desdeId) {
  pzTerminarEdicion();
  PZ.presentando = true;
  PZ.sel.clear(); pzPintarSel(); pzBarraCtx(); pzCerrarPop();
  const marcos = pzMarcosOrdenados();
  PZ.marcoIdx = Math.max(0, marcos.findIndex((m) => m.id === desdeId));
  document.getElementById('pz').classList.add('presentando');
  document.documentElement.requestFullscreen?.().catch(() => {});
  pzHerramienta('seleccionar');
  setTimeout(() => pzIrMarco(0), 150);
}
function pzIrMarco(d) {
  const marcos = pzMarcosOrdenados();
  const pres = document.getElementById('pz-pres');
  if (!marcos.length) { pzEncuadrar(null, true, 30); PZ.marcoIdx = 0; }
  else { PZ.marcoIdx = Math.min(marcos.length - 1, Math.max(0, PZ.marcoIdx + d)); pzEncuadrar(pzLimites(marcos[PZ.marcoIdx]), true, 16); }
  if (pres) {
    const h = PZ.herramienta;
    const b = (k, ico, t) => `<button class="${h === k ? 'activo' : ''}" title="${t}" onclick="pzHerramienta('${k}');pzIrMarco(0)">${ico}</button>`;
    pres.innerHTML = `${marcos.length ? `<button onclick="pzIrMarco(-1)" title="Anterior (←)">◀</button><span>${PZ.marcoIdx + 1} / ${marcos.length}</span><button onclick="pzIrMarco(1)" title="Siguiente (→)">▶</button><i></i>` : ''}
      ${b('seleccionar', '➤', 'Seleccionar')}${b('mano', '✋', 'Mover')}${b('lapiz', '✏️', 'Escribir sobre el tablero')}${b('resaltador', '🖍️', 'Resaltar')}${b('borrador', '🧽', 'Borrar trazos')}${b('nota', '🗒️', 'Nota')}
      <i></i><button onclick="pzAlumnoAzar()" title="Estudiante al azar de los grupos del tablero">🎲</button><button onclick="pzTerminarPresentacion()" title="Salir (Esc)">✕ Salir</button>`;
  }
}
function pzTerminarPresentacion() {
  PZ.presentando = false;
  document.getElementById('pz')?.classList.remove('presentando');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  const pres = document.getElementById('pz-pres');
  if (pres) pres.innerHTML = '';
  pzHerramienta('seleccionar');
}
function pzAlumnoAzar() {
  const t = pzT();
  const lista = (t.grupoIds.length ? t.grupoIds : []).flatMap((g) => alumnosDe(g));
  if (!lista.length) { aviso('Asigna un grupo al tablero para elegir estudiantes al azar.', 'error'); return; }
  const a = lista[Math.floor(Math.random() * lista.length)];
  document.getElementById('pz-azar')?.remove();
  const d = document.createElement('div');
  d.id = 'pz-azar'; d.className = 'pz-azar';
  d.innerHTML = `<div>🎲</div><b>${esc(nombreAlumno(a))}</b><span>${esc(nombreGrupoId(a.grupoId))}</span>`;
  d.onclick = () => d.remove();
  document.getElementById('pz-area').appendChild(d);
  setTimeout(() => d.remove(), 6000);
}

// ---------- Exportar ----------
function pzMenuExportar(boton) {
  const hayMarcos = pzT().elementos.some((e) => e.tipo === 'marco');
  pzAbrirPop(boton, `<div class="pz-plantillas">
    <button onclick="pzCerrarPop();pzExportar('png','todo')"><b>🖼️ Imagen PNG</b><span>Todo el tablero</span></button>
    ${PZ.sel.size ? `<button onclick="pzCerrarPop();pzExportar('png','seleccion')"><b>🖼️ PNG de la selección</b><span>Solo lo seleccionado</span></button>` : ''}
    <button onclick="pzCerrarPop();pzExportar('pdf','todo')"><b>📄 PDF</b><span>Todo el tablero en una página</span></button>
    ${hayMarcos ? `<button onclick="pzCerrarPop();pzExportar('pdf','marcos')"><b>📑 PDF por marcos</b><span>Cada marco en una página (como diapositivas)</span></button>` : ''}
  </div>`, 'pz-pop-plantillas');
}
function pzHTMLExportacion(rect, ancho, alto) {
  pzTerminarEdicion();
  const t = pzT();
  const pad = 24;
  const s = Math.min((ancho - pad * 2) / rect.w, (alto - pad * 2) / rect.h);
  const ox = (ancho - rect.w * s) / 2 - rect.x * s, oy = (alto - rect.h * s) / 2 - rect.y * s;
  const capas = ['pz-capa-marcos', 'pz-capa-el'].map((id) => document.getElementById(id).innerHTML).join('');
  return `<div class="pz-export" style="width:${ancho}px;height:${alto}px;background:${pzColorCSS(t.fondo?.color, '#ffffff')}"><div class="pz-mundo" style="transform:translate(${ox}px,${oy}px) scale(${s});--iz:${1 / s}">${capas.replace(/contenteditable="[^"]*"/g, '')}</div></div>`;
}
async function pzExportar(formato, alcance) {
  const t = pzT();
  pzTerminarEdicion();
  const els = alcance === 'seleccion' ? pzSeleccionados() : t.elementos;
  if (!els.length) { aviso('El tablero está vacío.', 'error'); return; }
  const sel = new Set(PZ.sel);
  PZ.sel.clear(); pzPintarSel();
  const nombre = t.titulo || 'Tablero';
  const doc = (cuerpo, w, h) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PZ_CSS}@page{size:${w}px ${h}px;margin:0}html,body{margin:0;padding:0;background:#fff}${formato === 'png' ? 'html,body{overflow:hidden}' : ''}.pz-export{position:relative;overflow:hidden;page-break-after:always;break-after:page}.pz-export:last-child{page-break-after:auto;break-after:auto}</style></head><body>${cuerpo}</body></html>`;
  try {
    if (formato === 'png') {
      const b = pzUnion(els.map(pzLimites));
      const k = Math.min(1, 2400 / Math.max(b.w, b.h)) * Math.max(1, Math.min(2, 1600 / Math.max(b.w, b.h)));
      const w = Math.round(b.w * k + 48), h = Math.round(b.h * k + 48);
      const r = await api.guardarPNG({ nombre, html: doc(pzHTMLExportacion(b, w, h), w, h), ancho: w, alto: h });
      if (r?.ok) aviso('Imagen guardada', 'ok'); else if (r?.error) aviso('No se pudo exportar: ' + r.error, 'error');
    } else {
      const W = 1050, H = 810;
      const paginas = alcance === 'marcos' ? pzMarcosOrdenados().map((m) => pzHTMLExportacion(pzLimites(m), W, H)) : [pzHTMLExportacion(pzUnion(els.map(pzLimites)), W, H)];
      const r = await api.guardarPDF({ nombre, html: doc(paginas.join(''), W, H), horizontal: true });
      if (r?.ok) aviso('PDF guardado', 'ok'); else if (r?.error) aviso('No se pudo exportar: ' + r.error, 'error');
    }
  } finally { PZ.sel = sel; pzPintarSel(); }
}

// ---------- Más opciones ----------
function pzMenuMas(boton) {
  const c = S.config.pizarra || {};
  pzAbrirPop(boton, `<div class="pz-plantillas">
    <button onclick="pzCerrarPop();pzDialogoFondo()"><b>🎨 Fondo del tablero</b><span>Color y cuadrícula</span></button>
    <button onclick="pzOpcion('guias')"><b>${c.guias !== false ? '☑' : '☐'} Guías de alineación</b><span>Ayudan a alinear al mover</span></button>
    <button onclick="pzOpcion('iman')"><b>${c.iman ? '☑' : '☐'} Ajustar a la cuadrícula</b><span>Mueve en pasos de 24 px</span></button>
    <button onclick="pzOpcion('mantenerHerramienta')"><b>${c.mantenerHerramienta ? '☑' : '☐'} Mantener la herramienta</b><span>Crear varias notas o formas seguidas</span></button>
    <button onclick="pzOpcion('ruedaZoom', true)"><b>${c.ruedaZoom !== false ? '☑' : '☐'} La rueda del ratón hace zoom</b><span>Si no, desplaza (Ctrl + rueda hace zoom)</span></button>
    <button onclick="pzOpcion('pegarConFormato')"><b>${c.pegarConFormato ? '☑' : '☐'} Pegar texto con formato</b><span>Conserva negritas y colores al pegar</span></button>
    <button onclick="pzCerrarPop();pzAtajos()"><b>⌨️ Atajos de teclado</b><span></span></button>
    <button onclick="pzCerrarPop();pzDuplicarTablero('${pzT().id}')"><b>📑 Duplicar tablero</b><span></span></button>
    <button onclick="pzCerrarPop();pzEliminarTablero('${pzT().id}')"><b>🗑️ Eliminar tablero</b><span></span></button>
  </div>`, 'pz-pop-plantillas');
}
function pzOpcion(k, defectoTrue = false) {
  const c = S.config.pizarra = S.config.pizarra || {};
  const actual = defectoTrue || k === 'guias' ? c[k] !== false : !!c[k];
  c[k] = !actual;
  guardar();
  pzCerrarPop();
  aviso(`${{ guias: 'Guías de alineación', iman: 'Ajustar a la cuadrícula', mantenerHerramienta: 'Mantener la herramienta', ruedaZoom: 'Zoom con la rueda', pegarConFormato: 'Pegar con formato' }[k]}: ${c[k] ? 'activado' : 'desactivado'}`, 'ok');
}
function pzDialogoFondo() {
  const t = pzT(), f = t.fondo || {};
  abrirModal(`<h2>🎨 Fondo del tablero</h2>
    <div class="campo"><label>Color</label><div class="fila">${['#ffffff', '#f7f9fc', '#fffdf3', '#f1f8e9', '#e3f2fd', '#fce4ec', '#263238', '#1b3a2b', '#102a43'].map((c) => `<button class="pz-muestra grande" style="background:${c}" onclick="pzFondo('color','${c}')"></button>`).join('')}<input type="color" value="${esc(f.color || '#ffffff')}" onchange="pzFondo('color',this.value)" style="width:44px;height:34px;padding:2px"></div>
      <div class="ayuda">Los fondos oscuros sirven como "tablero verde" o pizarra negra para proyectar.</div></div>
    <div class="campo"><label>Patrón</label><div class="fila">${[['puntos', '⠿ Puntos'], ['cuadricula', '▦ Cuadrícula'], ['lineas', '☰ Renglones'], ['ninguno', '▢ Liso']].map(([k, tx]) => `<button class="btn pequeno ${f.patron === k ? 'primario' : ''}" onclick="pzFondo('patron','${k}');this.parentElement.querySelectorAll('.btn').forEach(b=>b.classList.remove('primario'));this.classList.add('primario')">${tx}</button>`).join('')}</div></div>
    <div class="botones"><button class="btn primario" onclick="cerrarModal()">Listo</button></div>`);
}
function pzFondo(k, v) { const t = pzT(); pzAntes(); t.fondo = { ...(t.fondo || {}), [k]: v }; pzGuardar(); pzAplicarVista(); }
function pzAtajos() {
  const f = (a, b) => `<tr><td><kbd>${a}</kbd></td><td>${b}</td></tr>`;
  abrirModal(`<h2>⌨️ Atajos del tablero</h2><div class="rejilla r2"><table class="tabla">${[
    ['V', 'Seleccionar'], ['H / Espacio', 'Mover el lienzo'], ['N', 'Nota adhesiva'], ['T', 'Texto'], ['S · R · O', 'Forma · rectángulo · círculo'], ['L', 'Conector'], ['P', 'Lápiz'], ['M', 'Resaltador'], ['E', 'Borrador'], ['F', 'Marco'], ['I', 'Imagen'],
    ['Doble clic', 'Editar texto · recortar imagen · crear texto'], ['Enter', 'Editar el elemento seleccionado'], ['Esc', 'Terminar de editar / quitar selección'],
  ].map(([a, b]) => f(a, b)).join('')}</table><table class="tabla">${[
    ['Ctrl+Z / Ctrl+Y', 'Deshacer / rehacer'], ['Ctrl+C · X · V', 'Copiar · cortar · pegar (también imágenes)'], ['Ctrl+D', 'Duplicar'], ['Alt + arrastrar', 'Duplicar arrastrando'], ['Ctrl+A', 'Seleccionar todo'],
    ['Ctrl+G / Ctrl+Shift+G', 'Agrupar / desagrupar'], ['Ctrl+Shift+L', 'Bloquear'], ['Ctrl+] / Ctrl+[', 'Adelante / atrás'], ['Flechas (Shift)', 'Mover 1 px (10 px)'],
    ['Ctrl+B · I · U', 'Negrita · cursiva · subrayado'], ['Shift+1 / Shift+2', 'Ver todo / ver selección'], ['Ctrl + rueda', 'Zoom'], ['Shift al girar / redimensionar', '15° / mantener proporción'],
  ].map(([a, b]) => f(a, b)).join('')}</table></div><div class="botones"><button class="btn primario" onclick="cerrarModal()">Cerrar</button></div>`, { ancho: true });
}

// ---------- Lista de tableros ----------
RENDERS.pizarras = () => {
  const f = ui.filtroPz || (ui.filtroPz = { grupoId: '', areaId: '', texto: '' });
  const q = normalizar(f.texto);
  const lista = S.pizarras.filter((t) => (!f.grupoId || t.grupoIds.includes(f.grupoId)) && (!f.areaId || t.areaId === f.areaId)
    && (!q || normalizar([t.titulo, ...t.elementos.map((e) => pzTextoPlano(e.html || '') + ' ' + (e.titulo || ''))].join(' ')).includes(q)))
    .sort((a, b) => (b.modificada || '').localeCompare(a.modificada || ''));
  return `<div class="cabecera"><div><h1>🖍️ Tableros</h1><p class="sub">Pizarras infinitas para la clase: notas, textos con formato, formas, conectores, dibujo, imágenes y marcos para presentar. Cada tablero se asigna a una sesión y a sus grupos.</p></div>
    <div class="acciones"><button class="btn primario" onclick="pzNuevoDialogo()">＋ Nuevo tablero</button></div></div>
  <div class="filtros tarjeta">
    <div style="flex:1;min-width:200px"><label>Buscar</label><input value="${esc(f.texto)}" placeholder="Título o texto del tablero…" oninput="ui.filtroPz.texto=this.value;clearTimeout(window._tpz);window._tpz=setTimeout(()=>{render();const i=document.querySelector('.filtros input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},300)"></div>
    <div><label>Grupo</label><select onchange="ui.filtroPz.grupoId=this.value;render()">${opcionesGrupos(f.grupoId, 'Todos')}</select></div>
    <div><label>Área</label><select onchange="ui.filtroPz.areaId=this.value;render()">${opcionesAreas(f.areaId, 'Todas')}</select></div>
  </div>
  ${lista.length ? `<div class="pz-lista">${lista.map((t) => {
    const p = t.planeacionId && porId(S.planeaciones, t.planeacionId);
    const si = p ? (p.sesiones || []).findIndex((s) => s.id === t.sesionId) : -1;
    return `<div class="tarjeta pz-tarjeta"><div class="pz-mini" onclick="pzAbrir('${t.id}')">${pzMiniatura(t)}</div>
      <div class="tit" style="font-weight:600;font-size:15px">${esc(t.titulo || 'Tablero sin título')}</div>
      <div class="ayuda">${p ? `📝 ${esc(p.titulo || 'Sin título')}${si >= 0 ? ` · Sesión ${si + 1}` : ''}<br>` : ''}${t.grupoIds.length ? '👥 ' + t.grupoIds.map((g) => esc(nombreGrupoId(g))).join(', ') + '<br>' : ''}${t.areaId ? esc(nombreArea(t.areaId)) + ' · ' : ''}${t.fecha ? esc(fechaCorta(t.fecha)) + ' · ' : ''}${t.elementos.length} elementos</div>
      ${!p && !t.grupoIds.length ? '<div><span class="chip borrador">Sin asignar</span></div>' : ''}
      <div class="pie"><button class="btn pequeno primario" onclick="pzAbrir('${t.id}')">Abrir</button><button class="btn pequeno" onclick="pzDialogoVinculo('${t.id}')">🔗 Asignar</button>
        ${p ? `<button class="btn pequeno" onclick="editarPlaneacion('${p.id}')" title="Ir a la planeación">📝</button>` : ''}
        <button class="icono" title="Duplicar" onclick="pzDuplicarTablero('${t.id}')">📑</button><button class="icono" title="Eliminar" onclick="pzEliminarTablero('${t.id}')">🗑️</button></div></div>`;
  }).join('')}</div>` : `<div class="tarjeta vacio"><div class="grande">🖍️</div>${S.pizarras.length ? 'Ningún tablero coincide con los filtros.' : 'Aún no tienes tableros. Crea uno aquí o desde una sesión de tu planeación (botón 🖍️ Tablero).'}</div>`}`;
};
function pzMiniatura(t) {
  const els = t.elementos;
  if (!els.length) return '<div class="pz-mini-vacio">Tablero vacío</div>';
  const prev = PZ.id;
  PZ.id = t.id;
  try {
    const b = pzUnion(els.map(pzLimites));
    const pad = Math.max(b.w, b.h) * 0.04;
    const vb = `${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}`;
    const partes = els.map((e) => {
      const tr = e.rot ? ` transform="rotate(${e.rot} ${e.x + e.w / 2} ${e.y + e.h / 2})"` : '';
      switch (e.tipo) {
        case 'marco': return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="${pzColorCSS(e.color, '#fff')}" stroke="#cfd8dc" stroke-width="${Math.max(b.w, b.h) / 300}"/>`;
        case 'nota': return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="${pzColorCSS(e.color, '#fff59d')}"${tr}/>`;
        case 'forma': return `<path d="${(PZ_FORMAS[e.forma] || PZ_FORMAS.rect).d(e.w, e.h)}" transform="translate(${e.x} ${e.y})${e.rot ? ` rotate(${e.rot} ${e.w / 2} ${e.h / 2})` : ''}" fill="${pzColorCSS(e.relleno)}" stroke="${pzColorCSS(e.borde, 'transparent')}" stroke-width="${e.grosor || 0}"/>`;
        case 'texto': return `<rect x="${e.x}" y="${e.y + e.h * 0.3}" width="${e.w * 0.8}" height="${Math.max(4, e.h * 0.35)}" rx="3" fill="#90a4ae"${tr}/>`;
        case 'imagen': return `<image href="${esc(t.recursos[e.rid] || '')}" x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" preserveAspectRatio="xMidYMid slice"${tr}/>`;
        case 'linea': return `<path d="${pzGeoLinea(e, t).d}" stroke="${pzColorCSS(e.color, '#37474f')}" stroke-width="${Math.max(e.grosor, Math.max(b.w, b.h) / 250)}" fill="none"/>`;
        case 'trazo': { const sx = e.w / (e.vw || 1), sy = e.h / (e.vh || 1); return `<path d="${pzRutaSuave(e.puntos.map(([x, y]) => [e.x + x * sx, e.y + y * sy]))}" stroke="${pzColorCSS(e.color)}" stroke-width="${e.grosor}" fill="none" opacity="${e.opacidad ?? 1}" stroke-linecap="round"/>`; }
        case 'tabla': return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="#fff" stroke="${pzColorCSS(e.borde, '#90a4ae')}" stroke-width="2"/>`;
        case 'sello': return `<text x="${e.x}" y="${e.y + e.h * 0.85}" font-size="${e.h * 0.85}">${esc(e.emoji)}</text>`;
      }
      return '';
    });
    return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" style="background:${pzColorCSS(t.fondo?.color, '#fff')}">${partes.join('')}</svg>`;
  } finally { PZ.id = prev; }
}
function pzNuevoDialogo() {
  const hoy = hoyISO();
  const planes = [...S.planeaciones].filter((p) => (p.sesiones || []).some((s) => s.fecha && s.fecha >= sumarDias(hoy, -7))).sort((a, b) => (a.fechaInicio || '').localeCompare(b.fechaInicio || ''));
  abrirModal(`<h2>＋ Nuevo tablero</h2>
    <div class="campo"><label>¿Para qué clase?</label><select id="pz-n-plan" onchange="pzNuevoSesiones()"><option value="">Tablero libre (lo asignas después)</option>${planes.map((p) => `<option value="${p.id}">${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))} · ${esc(p.titulo || 'Sin título')}</option>`).join('')}
      ${S.planeaciones.length > planes.length ? `<optgroup label="Planeaciones anteriores">${S.planeaciones.filter((p) => !planes.includes(p)).sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || '')).map((p) => `<option value="${p.id}">${esc(fechaCorta(p.fechaInicio))} · ${esc(nombreGrupoId(p.grupoId))} · ${esc(p.titulo || 'Sin título')}</option>`).join('')}</optgroup>` : ''}</select></div>
    <div class="campo" id="pz-n-ses-c" style="display:none"><label>Sesión</label><select id="pz-n-ses"></select></div>
    <div class="campo"><label>Empezar con</label><select id="pz-n-plant"><option value="">Tablero en blanco</option>${Object.entries(PZ_PLANTILLAS).map(([k, p]) => `<option value="${k}">${p.t}</option>`).join('')}</select></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="pzCrearDesdeDialogo()">Crear</button></div>`);
}
function pzNuevoSesiones() {
  const p = porId(S.planeaciones, document.getElementById('pz-n-plan').value);
  document.getElementById('pz-n-ses-c').style.display = p ? '' : 'none';
  if (!p) return;
  const hoy = hoyISO();
  const prox = (p.sesiones || []).find((s) => s.fecha >= hoy) || p.sesiones?.[0];
  document.getElementById('pz-n-ses').innerHTML = (p.sesiones || []).map((s, i) => `<option value="${s.id}" ${s === prox ? 'selected' : ''}>Sesión ${i + 1}${s.fecha ? ' · ' + esc(fechaCorta(s.fecha)) : ''}${s.titulo ? ' · ' + esc(s.titulo) : ''}</option>`).join('');
}
function pzCrearDesdeDialogo() {
  const plan = document.getElementById('pz-n-plan').value, ses = plan ? document.getElementById('pz-n-ses').value : '', pl = document.getElementById('pz-n-plant').value;
  cerrarModal();
  if (plan) { pzCrearParaSesion(plan, ses, pl); return; }
  const t = pzNuevoTablero({ fecha: hoyISO() });
  guardar();
  pzAbrir(t.id);
  if (pl) setTimeout(() => pzInsertarPlantilla(pl), 60);
  setTimeout(() => pzDialogoVinculo(t.id), pl ? 300 : 80);
}
function pzDuplicarTablero(id) {
  const o = S.pizarras.find((t) => t.id === id);
  const c = structuredClone(o);
  c.id = uid(); c.titulo = (o.titulo || 'Tablero') + ' (copia)'; c.creada = c.modificada = new Date().toISOString();
  const mapa = {};
  for (const e of c.elementos) { mapa[e.id] = uid(); }
  for (const e of c.elementos) {
    e.id = mapa[e.id];
    if (e.desde) e.desde.id = mapa[e.desde.id] || e.desde.id;
    if (e.hasta) e.hasta.id = mapa[e.hasta.id] || e.hasta.id;
  }
  S.pizarras.push(c);
  guardar();
  aviso('Tablero duplicado', 'ok');
  if (ui.vista === 'pizarra') pzAbrir(c.id); else render();
}
async function pzEliminarTablero(id) {
  const t = S.pizarras.find((x) => x.id === id);
  if (!(await confirmar(`¿Eliminar el tablero "${t.titulo || 'Sin título'}"? Se borrarán todos sus elementos.`))) return;
  S.pizarras = S.pizarras.filter((x) => x.id !== id);
  guardar();
  if (ui.vista === 'pizarra') ir('pizarras'); else render();
}

// ---------- Estilos del tablero (también se usan al exportar) ----------
const PZ_CSS = `
.pz-mundo{position:absolute;left:0;top:0;transform-origin:0 0;--iz:1}
.pz-el{position:absolute;box-sizing:border-box;transform-origin:50% 50%}
.pz-nota{box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px rgba(0,0,0,.12)}
.pz-txt{position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box}
.pz-txt-in{outline:none;white-space:pre-wrap;overflow-wrap:normal;word-break:normal;min-height:1em;cursor:inherit;font-kerning:normal}
.pz-txt-in.pz-cortar{overflow-wrap:anywhere}
.pz-txt-in ul,.pz-txt-in ol{margin:0;padding-left:1.3em;text-align:left}
.pz-txt-in p{margin:0}
.pz-texto .pz-txt{overflow:visible}
.pz-svg{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.pz-forma .pz-svg path{pointer-events:none}
.pz-linea{pointer-events:none}
.pz-linea .pz-golpe{pointer-events:stroke;cursor:pointer}
.pz-linea-txt{position:absolute;transform:translate(-50%,-50%);background:#fff;padding:2px 8px;border-radius:6px;font:600 15px 'Segoe UI',system-ui,sans-serif;white-space:nowrap;pointer-events:none;box-shadow:0 0 0 1px rgba(0,0,0,.06)}
.pz-trazo{pointer-events:none}
.pz-trazo .pz-svg path{pointer-events:stroke}
.pz-img-marco{position:absolute;inset:0;overflow:hidden}
.pz-img-volteo{position:absolute;inset:0}
.pz-img-volteo img{position:absolute;max-width:none;user-select:none;-webkit-user-drag:none;pointer-events:none}
.pz-marco{box-shadow:0 0 0 1px rgba(0,0,0,.12),0 2px 10px rgba(0,0,0,.06)}
.pz-marco-titulo{position:absolute;left:0;bottom:100%;margin-bottom:calc(6px * var(--iz));font:600 calc(14px * var(--iz)) 'Segoe UI',system-ui,sans-serif;color:#607d8b;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.pz-tabla-t{width:100%;height:100%;border-collapse:collapse;table-layout:fixed}
.pz-tabla-t td{border:1px solid;padding:6px 8px;overflow:hidden}
.pz-celda{outline:none;min-height:1.2em;white-space:pre-wrap;overflow-wrap:anywhere}
.pz-sello-in{width:100%;height:100%;display:flex;align-items:center;justify-content:center;line-height:1;user-select:none}
.pz-sin-sombra{box-shadow:none}
`;
(function pzInyectarEstilos() {
  const st = document.createElement('style');
  st.id = 'pz-estilos';
  st.textContent = PZ_CSS;
  document.head.appendChild(st);
})();
