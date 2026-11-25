// ================= Hoja de respuestas para cámara y lectura óptica (OMR) =================
// Todo se mide en milímetros respecto al centro de la marca superior izquierda.

const OMR = {
  pagina: { ancho: 215.9, alto: 279.4 },
  marcas: { x0: 18, y0: 52, x1: 197.9, y1: 266, lado: 9 }, // centros de las 4 marcas
  burbuja: 5.2, pasoX: 7.2, pasoY: 8.4,
  idY: [10, 19], idX0: 34, // filas de decenas y unidades del número de lista
  respY0: 36, filasPorColumna: 20, columnaX: [12, 72, 132], numAncho: 8,
};
OMR.W = OMR.marcas.x1 - OMR.marcas.x0; OMR.H = OMR.marcas.y1 - OMR.marcas.y0;
const LETRAS_OMR = ['A', 'B', 'C', 'D', 'E', 'F'];

// Posiciones (mm relativos a la marca superior izquierda) de todas las burbujas
function geometriaOMR(nPreg, nOps) {
  const id = [0, 1].map((f) => Array.from({ length: 10 }, (_, d) => ({ u: OMR.idX0 + d * OMR.pasoX, v: OMR.idY[f] })));
  const resp = Array.from({ length: nPreg }, (_, i) => {
    const col = Math.floor(i / OMR.filasPorColumna), fila = i % OMR.filasPorColumna;
    return Array.from({ length: nOps }, (_, j) => ({ u: OMR.columnaX[col] + OMR.numAncho + j * OMR.pasoX, v: OMR.respY0 + fila * OMR.pasoY }));
  });
  return { id, resp };
}

// ---------- Hoja imprimible ----------
function htmlHojaOMR(p, hojas) {
  const nPreg = Math.min(60, preguntasCerradas(p).length);
  const nOps = Math.min(6, Math.max(2, ...preguntasCerradas(p).map((q) => q.opciones.length)));
  const g = geometriaOMR(nPreg, nOps);
  const m = OMR.marcas, b = OMR.burbuja;
  const abs = (u, v) => `left:${(m.x0 + u).toFixed(2)}mm;top:${(m.y0 + v).toFixed(2)}mm`;
  const burbuja = (u, v, txt, llena) => `<div class="b ${llena ? 'llena' : ''}" style="${abs(u - b / 2, v - b / 2)}">${llena ? '' : txt}</div>`;
  const hoja = (h) => {
    const dec = h.numero != null ? Math.floor(h.numero / 10) : -1, uni = h.numero != null ? h.numero % 10 : -1;
    return `<div class="pag">
      ${['x0', 'x1'].flatMap((x) => ['y0', 'y1'].map((y) => `<div class="marca" style="left:${m[x] - m.lado / 2}mm;top:${m[y] - m.lado / 2}mm"></div>`)).join('')}
      <div class="cab"><div class="inst">${esc((S.config.institucion || '').toUpperCase())}</div>
        <div class="tit">HOJA DE RESPUESTAS · ${esc(p.titulo || 'Prueba')}</div>
        <div class="datos"><span><b>Estudiante:</b> ${esc(h.nombre || '_______________________________________')}</span><span><b>Grupo:</b> ${esc(nombreGrupoId(p.grupoId))}</span><span><b>Fecha:</b> __________</span></div></div>
      <div class="et" style="${abs(8, OMR.idY[0] - 8.5)}">N.° DE LISTA ${h.numero != null ? `(${h.numero})` : '— rellena tu número, ej.: 07 = decenas 0, unidades 7'}</div>
      <div class="et" style="${abs(4, OMR.idY[0] - 2)}">Decenas</div><div class="et" style="${abs(4, OMR.idY[1] - 2)}">Unidades</div>
      ${g.id[0].map((x, d) => burbuja(x.u, x.v, d, d === dec)).join('')}${g.id[1].map((x, d) => burbuja(x.u, x.v, d, d === uni)).join('')}
      ${g.resp.map((fila, i) => `<div class="num" style="${abs(fila[0].u - OMR.numAncho - 3.6, fila[0].v - 2.3)}">${i + 1}</div>${fila.map((x, j) => burbuja(x.u, x.v, LETRAS_OMR[j])).join('')}`).join('')}
      <div class="pie">Rellena completamente un solo círculo por pregunta con lápiz o lapicero oscuro. No dobles ni manches las marcas negras de las esquinas.</div>
    </div>`;
  };
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: letter; margin: 0 } body { margin: 0; font-family: Arial, sans-serif; }
    .pag { position: relative; width: 215.9mm; height: 279.4mm; overflow: hidden; page-break-after: always; }
    .cab { position: absolute; left: 14mm; right: 14mm; top: 12mm; } .inst { text-align: center; font-weight: bold; font-size: 13pt; color: #1f4e79; }
    .tit { text-align: center; font-weight: bold; font-size: 12pt; margin: 2px 0 4px; } .datos { display: flex; justify-content: space-between; font-size: 10pt; border: 1px solid #8ea9db; padding: 4px 8px; }
    .marca { position: absolute; width: ${m.lado}mm; height: ${m.lado}mm; background: #000; }
    .b { position: absolute; width: ${b}mm; height: ${b}mm; border: 0.3mm solid #444; border-radius: 50%; box-sizing: border-box; font-size: 6.5pt; color: #9a9a9a; text-align: center; line-height: ${b - 0.6}mm; }
    .b.llena { background: #000; border-color: #000; }
    .num { position: absolute; width: ${OMR.numAncho - 1}mm; text-align: right; font-size: 9pt; font-weight: bold; }
    .et { position: absolute; font-size: 8pt; color: #333; white-space: nowrap; }
    .pie { position: absolute; left: 30mm; right: 30mm; bottom: 2.5mm; font-size: 8pt; color: #555; text-align: center; }
  </style></head><body>${hojas.map(hoja).join('')}</body></html>`;
}
function dialogoHojasOMR(id) {
  const p = porId(S.pruebas, id);
  if (!preguntasCerradas(p).length) return aviso('La prueba no tiene preguntas de selección múltiple', 'error');
  if (!p.grupoId) return aviso('Elige primero el grupo de la prueba (pestaña Calificar)', 'error');
  abrirModal(`<h2>🖨️ Hojas de respuestas para cámara</h2>
    <p class="ayuda">Hojas con marcas negras en las esquinas: después las calificas mostrándolas a la cámara del computador o con fotos del celular. ${preguntasCerradas(p).length > 60 ? '<b>Se incluyen las primeras 60 preguntas.</b>' : ''}</p>
    <label style="font-weight:normal;color:inherit;display:block;margin:8px 0"><input type="radio" name="omr-tipo" value="nombres" checked> <b>Una por estudiante</b>, con su nombre y número de lista ya marcados (${alumnosDe(p.grupoId).length} hojas)</label>
    <label style="font-weight:normal;color:inherit;display:block;margin:8px 0"><input type="radio" name="omr-tipo" value="blanco"> <b>En blanco</b>: cada estudiante rellena su número de lista <input type="number" id="omr-n" min="1" max="200" value="${alumnosDe(p.grupoId).length}" style="width:70px;display:inline-block"> hojas</label>
    <details class="ayuda"><summary>Números de lista de ${esc(nombreGrupoId(p.grupoId))}</summary>${alumnosDe(p.grupoId).map((a, i) => `${i + 1}. ${esc(nombreAlumno(a))}`).join('<br>')}</details>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="generarHojasOMR('${id}')">Crear PDF</button></div>`);
}
async function generarHojasOMR(id) {
  const p = porId(S.pruebas, id);
  const tipo = document.querySelector('input[name=omr-tipo]:checked').value;
  const hojas = tipo === 'nombres' ? alumnosDe(p.grupoId).map((a, i) => ({ nombre: tipoTitulo(`${a.nombres} ${a.apellidos}`), numero: i + 1 }))
    : Array.from({ length: Math.max(1, +document.getElementById('omr-n').value || 1) }, () => ({ nombre: '', numero: null }));
  cerrarModal();
  const r = await api.guardarPDF({ nombre: `Hojas de respuestas - ${p.titulo || 'prueba'}`, html: htmlHojaOMR(p, hojas) });
  if (r.ok) aviso('PDF creado. Imprímelo al 100% (sin ajustar a la página).', 'ok'); else if (r.error) aviso(r.error, 'error');
}

// ---------- Lectura óptica ----------
function resolverSistema(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let max = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[max][i])) max = k;
    [A[i], A[max]] = [A[max], A[i]]; [b[i], b[max]] = [b[max], b[i]];
    for (let k = i + 1; k < n; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < n; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
  return x;
}
// Homografía del cuadrado unitario a los 4 puntos (sup-izq, sup-der, inf-izq, inf-der)
function homografia(p) {
  const src = [[0, 0], [1, 0], [0, 1], [1, 1]];
  const A = [], b = [];
  src.forEach(([x, y], i) => {
    const [X, Y] = p[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y);
  });
  const h = resolverSistema(A, b);
  return (x, y) => { const w = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
}
// Convierte la imagen a "oscuro / claro" con umbral local (tolera sombras e iluminación desigual)
function binarizar(gris, w, h) {
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) { s += gris[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + s; } }
  const r = Math.max(8, Math.round(Math.min(w, h) / 40));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const suma = I[(y1 + 1) * (w + 1) + x1 + 1] - I[y0 * (w + 1) + x1 + 1] - I[(y1 + 1) * (w + 1) + x0] + I[y0 * (w + 1) + x0];
      out[y * w + x] = gris[y * w + x] < (suma / area) * 0.78 && gris[y * w + x] < 150 ? 1 : 0;
    }
  }
  return out;
}
// Componentes conexas casi cuadradas y rellenas: candidatas a marcas de esquina
function buscarMarcas(bin, w, h) {
  const etiqueta = new Int32Array(w * h);
  const cands = [];
  const pila = [];
  let n = 0;
  for (let i = 0; i < w * h; i++) {
    if (!bin[i] || etiqueta[i]) continue;
    n++; let area = 0, minx = w, maxx = 0, miny = h, maxy = 0, sx = 0, sy = 0;
    pila.push(i); etiqueta[i] = n;
    while (pila.length) {
      const j = pila.pop(), x = j % w, y = (j / w) | 0;
      area++; sx += x; sy += y; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      for (const k of [j - 1, j + 1, j - w, j + w]) if (k >= 0 && k < w * h && bin[k] && !etiqueta[k] && Math.abs((k % w) - x) <= 1) { etiqueta[k] = n; pila.push(k); }
    }
    const bw = maxx - minx + 1, bh = maxy - miny + 1;
    const lado = Math.min(w, h);
    if (bw < lado * 0.011 || bw > lado * 0.12 || bh / bw < 0.6 || bh / bw > 1.6) continue;
    const relleno = area / (bw * bh);
    if (relleno < 0.62) continue;
    cands.push({ x: sx / area, y: sy / area, area, relleno, bw, bh });
  }
  if (cands.length < 4) return null;
  // la marca más cercana a cada esquina de la imagen, entre las de mayor tamaño
  // Las marcas (9 mm) tienen casi 4 veces el área de una burbuja rellena (5 mm): se agrupan las de tamaño parecido a la mayor
  // y se acepta cualquier giro (un cuadrado girado llena menos su recuadro, por eso el umbral de relleno es bajo).
  const grandes = cands.filter((c) => c.relleno > 0.5).sort((a, b) => b.area - a.area).slice(0, 40);
  if (grandes.length < 4) return null;
  let utiles = [];
  for (const ref of grandes.slice(0, 6)) {
    const grupo = grandes.filter((c) => c.area > ref.area * 0.5 && c.area < ref.area * 1.8);
    if (grupo.length >= 4) { utiles = grupo; break; }
  }
  if (utiles.length < 4) return null;
  const elegir = (f) => utiles.reduce((m, c) => (f(c) > f(m) ? c : m));
  const tl = elegir((c) => -c.x - c.y), tr = elegir((c) => c.x - c.y), bl = elegir((c) => -c.x + c.y), br = elegir((c) => c.x + c.y);
  if (new Set([tl, tr, bl, br]).size < 4) return null;
  // sanidad: proporciones parecidas a las de la hoja
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ancho = (d(tl, tr) + d(bl, br)) / 2, alto = (d(tl, bl) + d(tr, br)) / 2;
  if (Math.abs(alto / ancho - OMR.H / OMR.W) > 0.35) return null;
  return [tl, tr, bl, br].map((c) => [c.x, c.y]);
}
// Lee una imagen (canvas, video o img) y devuelve el número de lista y las respuestas
function leerHojaOMR(fuente, nPreg, nOps) {
  const sw = fuente.videoWidth || fuente.naturalWidth || fuente.width, sh = fuente.videoHeight || fuente.naturalHeight || fuente.height;
  const esc = Math.min(1, 1100 / Math.max(sw, sh));
  const w = Math.round(sw * esc), h = Math.round(sh * esc);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(fuente, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const gris = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) gris[i] = (px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11) | 0;
  const bin = binarizar(gris, w, h);
  const marcas = buscarMarcas(bin, w, h);
  if (!marcas) return { ok: false, error: 'No se encuentran las 4 marcas negras de las esquinas. Que se vea la hoja completa, plana y con buena luz.' };
  const anchoHoja = Math.hypot(marcas[1][0] - marcas[0][0], marcas[1][1] - marcas[0][1]);
  if (anchoHoja < Math.max(w, h) * 0.3) return { ok: false, error: 'La hoja se ve muy pequeña: acércala a la cámara.', marcas };
  const H = homografia(marcas);
  const aImg = (u, v) => H(u / OMR.W, v / OMR.H);
  const pxPorMm = Math.hypot(marcas[1][0] - marcas[0][0], marcas[1][1] - marcas[0][1]) / OMR.W;
  const radio = Math.max(2, (OMR.burbuja / 2) * 0.62 * pxPorMm);
  // fracción oscura dentro de cada burbuja, comparada con el blanco del papel alrededor
  const oscuridad = (u, v) => {
    const [cx, cy] = aImg(u, v);
    let s = 0, n = 0;
    for (let y = Math.floor(cy - radio); y <= Math.ceil(cy + radio); y++) for (let x = Math.floor(cx - radio); x <= Math.ceil(cx + radio); x++) {
      if (x < 0 || y < 0 || x >= w || y >= h || (x - cx) ** 2 + (y - cy) ** 2 > radio * radio) continue;
      s += 255 - gris[y * w + x]; n++;
    }
    return n ? s / n / 255 : 0;
  };
  const decidir = (valores) => {
    const orden = valores.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const fondo = orden[orden.length - 1].v;
    const umbral = Math.max(0.33, fondo + 0.22);
    const marcadas = orden.filter((x) => x.v >= umbral && x.v - fondo > 0.2 && x.v >= orden[0].v * 0.72);
    if (!marcadas.length) return -1; // en blanco
    if (marcadas.length > 1) return -2; // más de una
    return marcadas[0].i;
  };
  const g = geometriaOMR(nPreg, nOps);
  const dig = g.id.map((fila) => decidir(fila.map((x) => oscuridad(x.u, x.v))));
  const numero = dig[0] >= 0 && dig[1] >= 0 ? dig[0] * 10 + dig[1] : null;
  const respuestas = g.resp.map((fila) => { const r = decidir(fila.map((x) => oscuridad(x.u, x.v))); return r >= 0 ? LETRAS_OMR[r] : r === -2 ? '*' : '-'; });
  return { ok: true, numero, letras: respuestas.join(''), multiples: respuestas.filter((x) => x === '*').length, marcas };
}

// ---------- Interfaz de cámara ----------
let camOMR = null; // { stream, pid, timer, ultimo, repetido }
async function abrirCamaraOMR(pid) {
  const p = porId(S.pruebas, pid);
  if (!p.grupoId) return aviso('Elige primero el grupo de la prueba', 'error');
  abrirModal(`<h2>📷 Calificar hojas con la cámara</h2>
    <div class="rejilla" style="grid-template-columns: 1fr 300px; gap:14px; align-items:start">
      <div><div class="cam-caja"><video id="cam-video" autoplay playsinline muted></video><canvas id="cam-capa"></canvas></div>
        <p class="ayuda">Pon la hoja sobre una superficie plana y con buena luz, con las 4 marcas negras dentro de la imagen. Se califica sola cuando la lectura es estable.</p>
        <div class="fila"><label class="btn" style="margin:0">📁 Calificar desde fotos<input type="file" accept="image/*" multiple hidden onchange="fotosOMR('${pid}',this.files)"></label><select id="cam-disp" style="width:auto" onchange="iniciarCamaraOMR('${pid}',this.value)"></select></div></div>
      <div><div id="cam-estado" class="tarjeta" style="min-height:120px">Iniciando cámara…</div><div id="cam-lista"></div></div></div>
    <div class="botones"><button class="btn primario" onclick="cerrarCamaraOMR()">Terminar</button></div>`, { ancho: true });
  document.getElementById('modal').classList.add('muy-ancho');
  camOMR = { pid, ultimo: '', repetido: 0, registrados: [] };
  iniciarCamaraOMR(pid);
}
async function iniciarCamaraOMR(pid, dispositivo) {
  try {
    if (camOMR.stream) camOMR.stream.getTracks().forEach((t) => t.stop());
    camOMR.stream = await navigator.mediaDevices.getUserMedia({ video: dispositivo ? { deviceId: { exact: dispositivo }, width: 1920, height: 1080 } : { width: 1920, height: 1080, facingMode: 'environment' } });
    const v = document.getElementById('cam-video'); v.srcObject = camOMR.stream;
    const lista = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    const sel = document.getElementById('cam-disp');
    if (sel) sel.hidden = lista.length < 2;
    if (sel) sel.innerHTML = lista.map((d, i) => `<option value="${d.deviceId}" ${d.deviceId === camOMR.stream.getVideoTracks()[0].getSettings().deviceId ? 'selected' : ''}>${esc(d.label || 'Cámara ' + (i + 1))}</option>`).join('');
    clearInterval(camOMR.timer);
    camOMR.timer = setInterval(() => cuadroOMR(pid), 450);
  } catch (e) {
    const el = document.getElementById('cam-estado');
    const sel = document.getElementById('cam-disp'); if (sel) sel.hidden = true;
    if (el) el.innerHTML = `<b>No se pudo usar la cámara.</b><p class="ayuda">${esc(e.message)}. Puedes calificar desde fotos tomadas con el celular (pásalas al computador).</p>`;
  }
}
function cerrarCamaraOMR() {
  if (camOMR) { clearInterval(camOMR.timer); camOMR.stream?.getTracks().forEach((t) => t.stop()); }
  camOMR = null; cerrarModal(); render();
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && camOMR) cerrarCamaraOMR(); });
function dibujarMarcas(r, v) {
  const c = document.getElementById('cam-capa'); if (!c || !v) return;
  c.width = v.clientWidth; c.height = v.clientHeight;
  const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
  if (!r?.marcas) return;
  const escala = Math.min(1, 1100 / Math.max(v.videoWidth, v.videoHeight)); // escala usada al leer
  const f = c.width / (v.videoWidth * escala);
  const [a, b, cc, d] = r.marcas.map(([x, y]) => [x * f, y * f]);
  ctx.strokeStyle = '#43a047'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...d); ctx.lineTo(...cc); ctx.closePath(); ctx.stroke();
}
function datosOMR(p) { const c = preguntasCerradas(p); return { n: Math.min(60, c.length), ops: Math.min(6, Math.max(2, ...c.map((q) => q.opciones.length))) }; }
function cuadroOMR(pid) {
  const v = document.getElementById('cam-video');
  if (!v || !v.videoWidth || !camOMR) return;
  const p = porId(S.pruebas, pid);
  const { n, ops } = datosOMR(p);
  const r = leerHojaOMR(v, n, ops);
  dibujarMarcas(r, v);
  const est = document.getElementById('cam-estado');
  if (!r.ok) { est.innerHTML = `<span class="ayuda">🔎 ${esc(r.error)}</span>`; camOMR.repetido = 0; return; }
  const firma = r.numero + '|' + r.letras;
  camOMR.repetido = firma === camOMR.ultimo ? camOMR.repetido + 1 : 0;
  camOMR.ultimo = firma;
  if (camOMR.repetido < 1) { est.innerHTML = '<span class="ayuda">📄 Hoja detectada, leyendo…</span>'; return; }
  mostrarLecturaOMR(p, r);
}
function mostrarLecturaOMR(p, r, origen = 'cámara') {
  const est = document.getElementById('cam-estado');
  const al = alumnosDe(p.grupoId);
  const a = r.numero ? al[r.numero - 1] : null;
  const ya = camOMR.registrados.find((x) => x.firma === r.numero + '|' + r.letras);
  if (a && !ya) return registrarOMR(p, a, r, origen);
  est.innerHTML = a ? `✔ <b>${esc(nombreAlumno(a))}</b> ya registrado. Pon la siguiente hoja.`
    : `<b>No se pudo leer el número de lista.</b><p class="ayuda">Respuestas leídas: <code>${esc(r.letras)}</code></p>
      <select id="cam-al">${al.map((x, i) => `<option value="${x.id}">${i + 1}. ${esc(nombreAlumno(x))}</option>`).join('')}</select>
      <button class="btn primario" style="margin-top:6px" onclick="registrarOMR(porId(S.pruebas,'${p.id}'),porId(S.alumnos,document.getElementById('cam-al').value),${esc(JSON.stringify(r)).replace(/"/g, '&quot;')})">Registrar</button>`;
}
function registrarOMR(p, a, r, origen = 'cámara') {
  (p.respuestas ||= {})[a.id] = r.letras.replace(/\*/g, '-');
  tocarPrueba(p);
  const res = resultadoAlumno(p, a.id);
  camOMR?.registrados?.unshift({ firma: r.numero + '|' + r.letras, a, res, multiples: r.multiples }); // la cámara del PC puede no estar abierta (foto desde el celular)
  sonidoOK();
  const est = document.getElementById('cam-estado');
  if (est) est.innerHTML = `<div style="font-size:18px">✔ <b>${esc(nombreAlumno(a))}</b></div><div style="font-size:28px;font-weight:800" class="${claseNota(res?.nota)}">${fmtNota(res?.nota)}</div>
    <div class="ayuda">${res?.correctas ?? 0} de ${preguntasCerradas(p).length} correctas${r.multiples ? ` · ⚠ ${r.multiples} con más de una marca (cuentan como mal)` : ''} · desde ${origen}</div>`;
  const lista = document.getElementById('cam-lista');
  if (lista && camOMR) lista.innerHTML = `<ul class="lista-simple">${camOMR.registrados.slice(0, 40).map((x) => `<li><span>${esc(nombreAlumno(x.a))}</span><b class="${claseNota(x.res?.nota)}">${fmtNota(x.res?.nota)}</b></li>`).join('')}</ul>`;
}
function sonidoOK() { try { const c = new AudioContext(); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 1320; g.gain.value = 0.12; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.12); } catch (e) { /* */ } }
async function fotosOMR(pid, archivos) {
  const p = porId(S.pruebas, pid);
  const { n, ops } = datosOMR(p);
  let ok = 0, mal = 0;
  for (const f of archivos) {
    const img = new Image();
    img.src = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(''); fr.readAsDataURL(f); });
    const cargo = await img.decode().then(() => true).catch(() => false);
    if (!cargo) { mal++; continue; }
    const r = leerHojaOMR(img, n, ops);
    if (!r.ok) { mal++; continue; }
    const a = r.numero ? alumnosDe(p.grupoId)[r.numero - 1] : null;
    if (a) { registrarOMR(p, a, r, 'foto'); ok++; } else { mostrarLecturaOMR(p, r, 'foto'); mal++; }
  }
  aviso(`${ok} hoja(s) calificadas${mal ? `, ${mal} sin leer o sin número de lista` : ''}.`, ok ? 'ok' : '');
}
