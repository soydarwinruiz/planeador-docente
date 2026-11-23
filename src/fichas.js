// ================= Fichas imprimibles: sopa de letras, crucigrama, emparejar, completar y guía =================

const TIPOS_FICHA = {
  sopa: { ico: '🔤', t: 'Sopa de letras', instr: 'Encuentra en la sopa de letras las palabras de la lista.' },
  crucigrama: { ico: '✏️', t: 'Crucigrama', instr: 'Lee cada pista y escribe la palabra en el crucigrama.' },
  emparejar: { ico: '🔗', t: 'Emparejar', instr: 'Une con una línea cada elemento de la columna A con su pareja de la columna B.' },
  completar: { ico: '📝', t: 'Completar', instr: 'Completa el texto con las palabras del recuadro.' },
  guia: { ico: '📄', t: 'Guía de trabajo', instr: 'Lee con atención la explicación y desarrolla las actividades.' },
};
const ABC_SOPA = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

function nuevaFicha(tipo = 'sopa') {
  return { id: '', tipo, titulo: '', grupoId: '', grado: '', areaId: '', instrucciones: TIPOS_FICHA[tipo].instr, palabras: '', pistas: '', pares: '', texto: '',
    guia: { objetivo: '', explicacion: '', ejemplos: '', actividades: '', reto: '', autoevaluacion: '' },
    dificultad: 'medio', mayusculas: true, banco: true, solucion: true, letraGrande: false, semilla: Math.floor(Math.random() * 1e9) };
}
// Generador pseudoaleatorio con semilla: la misma ficha siempre da la misma sopa o crucigrama
function aleatorio(semilla) { let s = semilla >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }
function palabraLimpia(p) { return String(p || '').toUpperCase().normalize('NFD').replace(/(?!̃)[̀-ͯ]/g, '').normalize('NFC').replace(/[^A-ZÑ]/g, ''); }

// ---------- Sopa de letras ----------
function generarSopa(palabras, dificultad, semilla) {
  const rnd = aleatorio(semilla);
  const lista = [...new Set(palabras.map(palabraLimpia).filter((p) => p.length >= 2))].sort((a, b) => b.length - a.length);
  const dirs = [[0, 1], [1, 0]];
  if (dificultad !== 'facil') dirs.push([1, 1], [-1, 1]);
  if (dificultad === 'dificil') dirs.push([0, -1], [-1, 0], [-1, -1], [1, -1]);
  const letras = lista.join('').length;
  let n = Math.max(10, (lista[0] || '').length + 1, Math.ceil(Math.sqrt(letras * 2.3)));
  for (let intento = 0; intento < 6; intento++, n++) {
    const g = Array.from({ length: n }, () => Array(n).fill(''));
    const ubicadas = [];
    let ok = true;
    for (const p of lista) {
      let puesta = false;
      for (let t = 0; t < 400 && !puesta; t++) {
        const [dy, dx] = dirs[Math.floor(rnd() * dirs.length)];
        const y0 = Math.floor(rnd() * n), x0 = Math.floor(rnd() * n);
        const yf = y0 + dy * (p.length - 1), xf = x0 + dx * (p.length - 1);
        if (yf < 0 || yf >= n || xf < 0 || xf >= n) continue;
        let cabe = true;
        for (let i = 0; i < p.length && cabe; i++) { const c = g[y0 + dy * i][x0 + dx * i]; if (c && c !== p[i]) cabe = false; }
        if (!cabe) continue;
        const celdas = [];
        for (let i = 0; i < p.length; i++) { g[y0 + dy * i][x0 + dx * i] = p[i]; celdas.push((y0 + dy * i) * n + x0 + dx * i); }
        ubicadas.push({ p, celdas }); puesta = true;
      }
      if (!puesta) { ok = false; break; }
    }
    if (!ok) continue;
    const sol = new Set(ubicadas.flatMap((u) => u.celdas));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!g[y][x]) g[y][x] = ABC_SOPA[Math.floor(rnd() * ABC_SOPA.length)];
    return { n, g, sol, palabras: lista };
  }
  return null;
}

// ---------- Crucigrama ----------
// Prueba varias distribuciones y se queda con la que ubica más palabras en menos espacio
function generarCrucigrama(pistas, semilla) {
  let mejor = null;
  for (let i = 0; i < 40; i++) {
    const c = intentoCrucigrama(pistas, (semilla + i * 7919) >>> 0);
    if (!c) return null;
    const puntaje = c.sobrantes.length * 1000 + c.alto * c.ancho;
    if (!mejor || puntaje < mejor.puntaje) mejor = { ...c, puntaje };
    if (!c.sobrantes.length && i >= 10) break;
  }
  return mejor;
}
function intentoCrucigrama(pistas, semilla) {
  const rnd = aleatorio(semilla);
  const lista = pistas.map((x) => ({ ...x, p: palabraLimpia(x.palabra) })).filter((x) => x.p.length >= 2).sort((a, b) => b.p.length - a.p.length || rnd() - 0.5);
  if (!lista.length) return null;
  const T = 60, g = new Map(); // clave "y,x" -> letra
  const k = (y, x) => `${y},${x}`;
  const colocadas = [];
  const cabe = (p, y, x, h) => {
    const dy = h ? 0 : 1, dx = h ? 1 : 0;
    if (g.has(k(y - dy, x - dx)) || g.has(k(y + dy * p.length, x + dx * p.length))) return -1;
    let cruces = 0;
    for (let i = 0; i < p.length; i++) {
      const yy = y + dy * i, xx = x + dx * i, c = g.get(k(yy, xx));
      if (c) { if (c !== p[i]) return -1; cruces++; continue; }
      // vecinos laterales vacíos (no se pegan palabras paralelas)
      if (g.has(k(yy + dx, xx + dy)) || g.has(k(yy - dx, xx - dy))) return -1;
    }
    return cruces;
  };
  const poner = (x0, p, y, x, h) => { for (let i = 0; i < p.length; i++) g.set(k(y + (h ? 0 : i), x + (h ? i : 0)), p[i]); colocadas.push({ ...x0, y, x, h }); };
  poner(lista[0], lista[0].p, T / 2, T / 2 - Math.floor(lista[0].p.length / 2), true);
  const sobrantes = [];
  for (const item of lista.slice(1)) {
    let mejor = null;
    for (const c of colocadas) for (let i = 0; i < c.p.length; i++) for (let j = 0; j < item.p.length; j++) {
      if (c.p[i] !== item.p[j]) continue;
      const h = !c.h;
      const y = c.h ? c.y - j : c.y + i, x = c.h ? c.x + i : c.x - j;
      const cr = cabe(item.p, y, x, h);
      if (cr > 0 && (!mejor || cr > mejor.cr || (cr === mejor.cr && rnd() < 0.3))) mejor = { y, x, h, cr };
    }
    if (mejor) poner(item, item.p, mejor.y, mejor.x, mejor.h); else sobrantes.push(item);
  }
  const ys = colocadas.flatMap((c) => [c.y, c.h ? c.y : c.y + c.p.length - 1]), xs = colocadas.flatMap((c) => [c.x, c.h ? c.x + c.p.length - 1 : c.x]);
  const y0 = Math.min(...ys), x0 = Math.min(...xs), alto = Math.max(...ys) - y0 + 1, ancho = Math.max(...xs) - x0 + 1;
  // numeración en orden de lectura
  const inicios = [...new Set(colocadas.map((c) => k(c.y, c.x)))].map((s) => s.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const num = new Map(inicios.map(([y, x], i) => [k(y, x), i + 1]));
  colocadas.forEach((c) => { c.num = num.get(k(c.y, c.x)); });
  const celdas = Array.from({ length: alto }, (_, yy) => Array.from({ length: ancho }, (_, xx) => { const y = yy + y0, x = xx + x0; return g.has(k(y, x)) ? { l: g.get(k(y, x)), n: num.get(k(y, x)) } : null; }));
  return { celdas, alto, ancho, horizontales: colocadas.filter((c) => c.h).sort((a, b) => a.num - b.num), verticales: colocadas.filter((c) => !c.h).sort((a, b) => a.num - b.num), sobrantes };
}

// ---------- Lectura de los datos escritos por el docente ----------
function lineas(t) { return String(t || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean); }
function pistasDe(f) { return lineas(f.pistas).map((l) => { const m = /^([^:=\-–]+)\s*[:=\-–]\s*(.+)$/.exec(l); return m ? { palabra: m[1].trim(), pista: m[2].trim() } : null; }).filter(Boolean); }
function paresDe(f) { return lineas(f.pares).map((l) => { const m = /^(.+?)\s*(?:=|→|->|\|)\s*(.+)$/.exec(l); return m ? { a: m[1].trim(), b: m[2].trim() } : null; }).filter(Boolean); }
function mezclar(arr, semilla) { const rnd = aleatorio(semilla); const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- HTML imprimible ----------
function membreteHTML() {
  const c = S.config, mb = c.membrete || {};
  const img = (x) => x?.data ? `<img src="${x.data}" style="max-height:62px;max-width:120px">` : '';
  return `<table class="mb"><tr><td style="width:18%;text-align:center">${img(mb.logo)}</td><td style="text-align:center">
    <div style="font-weight:700;font-size:14pt;color:${mb.color || '#1f4e79'}">${esc((c.institucion || 'INSTITUCIÓN EDUCATIVA').toUpperCase())}</div>
    ${lineas(mb.lineas).map((l) => `<div style="font-size:8pt">${esc(l)}</div>`).join('')}${[c.sede, c.municipio].filter(Boolean).length ? `<div style="font-size:8pt">${esc([c.sede, c.municipio].filter(Boolean).join(' – '))}</div>` : ''}
    ${mb.lema ? `<div style="font-size:8pt;font-style:italic;color:${mb.color || '#1f4e79'}">${esc(mb.lema)}</div>` : ''}</td><td style="width:18%;text-align:center">${img(mb.logo2)}</td></tr></table>
    <div style="border-bottom:2px solid ${mb.color || '#1f4e79'};margin:2px 0 8px"></div>`;
}
function encabezadoFichaHTML(f) {
  const g = porId(S.grupos, f.grupoId);
  return `${membreteHTML()}<h1>${TIPOS_FICHA[f.tipo].ico} ${esc(f.titulo || TIPOS_FICHA[f.tipo].t)}</h1>
    <table class="datos"><tr><td style="width:55%"><b>Nombre:</b></td><td><b>Grado:</b> ${esc(g ? nombreGrupo(g) : f.grado ? f.grado + '°' : '')}</td><td><b>Fecha:</b></td></tr>
    <tr><td><b>Área:</b> ${esc(f.areaId ? nombreArea(f.areaId) : '')}</td><td colspan="2"><b>Docente:</b> ${esc(S.config.docente || '')}</td></tr></table>
    ${f.instrucciones ? `<p class="instr">${esc(f.instrucciones)}</p>` : ''}`;
}
function cuerpoFicha(f, solucion = false) {
  if (f.tipo === 'sopa') {
    const s = generarSopa(lineas(f.palabras).flatMap((l) => l.split(/[,;]/)), f.dificultad, f.semilla);
    if (!s) return '<p>Escribe las palabras (una por línea).</p>';
    const tam = Math.min(30, Math.floor(520 / s.n));
    return `<table class="sopa" style="font-size:${Math.round(tam * 0.6)}px">${s.g.map((fila, y) => `<tr>${fila.map((l, x) => `<td style="width:${tam}px;height:${tam}px" class="${solucion && s.sol.has(y * s.n + x) ? 'resaltar' : ''}">${f.mayusculas ? l : l.toLowerCase()}</td>`).join('')}</tr>`).join('')}</table>
      ${f.banco ? `<div class="banco">${s.palabras.map((p) => `<span>☐ ${f.mayusculas ? p : p.toLowerCase()}</span>`).join('')}</div>` : ''}`;
  }
  if (f.tipo === 'crucigrama') {
    const c = generarCrucigrama(pistasDe(f), f.semilla);
    if (!c) return '<p>Escribe las palabras con su pista (PALABRA: pista).</p>';
    const tam = Math.min(30, Math.floor(600 / Math.max(c.ancho, c.alto * 0.9)));
    return `<table class="cruci">${c.celdas.map((fila) => `<tr>${fila.map((x) => x ? `<td class="letra" style="width:${tam}px;height:${tam}px">${x.n ? `<span class="num">${x.n}</span>` : ''}${solucion ? `<span class="sol" style="font-size:${Math.round(tam * 0.55)}px">${x.l}</span>` : ''}</td>` : `<td style="width:${tam}px;height:${tam}px"></td>`).join('')}</tr>`).join('')}</table>
      <div class="pistas"><div><h3>➡️ Horizontales</h3><ol>${c.horizontales.map((x) => `<li value="${x.num}">${esc(x.pista)}${solucion ? ` <b>(${x.p})</b>` : ` <span class="gris">(${x.p.length})</span>`}</li>`).join('')}</ol></div>
        <div><h3>⬇️ Verticales</h3><ol>${c.verticales.map((x) => `<li value="${x.num}">${esc(x.pista)}${solucion ? ` <b>(${x.p})</b>` : ` <span class="gris">(${x.p.length})</span>`}</li>`).join('')}</ol></div></div>
      ${c.sobrantes.length && solucion ? `<p class="gris">No cupieron: ${c.sobrantes.map((x) => x.p).join(', ')}</p>` : ''}`;
  }
  if (f.tipo === 'emparejar') {
    const pares = paresDe(f);
    if (!pares.length) return '<p>Escribe los pares (término = definición).</p>';
    const der = mezclar(pares.map((p, i) => ({ ...p, i })), f.semilla);
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return `<table class="emparejar"><tr><th>Columna A</th><th style="width:22%"></th><th>Columna B</th></tr>${pares.map((p, i) => `<tr><td>${i + 1}. ${esc(p.a)} <span class="punto">●</span></td><td>${solucion ? `<b>${i + 1} → ${L[der.findIndex((d) => d.i === i)]}</b>` : ''}</td><td><span class="punto">●</span> ${L[i]}. ${esc(der[i].b)}</td></tr>`).join('')}</table>`;
  }
  if (f.tipo === 'completar') {
    const palabras = [];
    const html = esc(f.texto || '').replace(/\*([^*]+)\*/g, (m, p) => { palabras.push(p); return solucion ? `<b class="sol-linea">${p}</b>` : `<span class="hueco">${'&nbsp;'.repeat(Math.max(12, p.length * 2))}</span>`; });
    if (!palabras.length) return '<p>Escribe el texto y marca entre *asteriscos* las palabras que el estudiante debe completar.</p>';
    return `${f.banco ? `<div class="banco recuadro">${mezclar(palabras, f.semilla).map((p) => `<span>${esc(p)}</span>`).join('')}</div>` : ''}<p class="texto-completar">${html.replace(/\n/g, '<br>')}</p>`;
  }
  // guía
  const g = f.guia;
  const sec = (t, html) => html ? `<h2>${t}</h2>${html}` : '';
  const par = (t) => esc(t || '').replace(/\n/g, '<br>');
  return `${sec('🎯 Objetivo', g.objetivo && `<p>${par(g.objetivo)}</p>`)}${sec('📚 Lo que debes saber', g.explicacion && `<p>${par(g.explicacion)}</p>`)}${sec('💡 Ejemplos', g.ejemplos && `<p>${par(g.ejemplos)}</p>`)}
    ${sec('✏️ Actividades', lineas(g.actividades).length && `<ol>${lineas(g.actividades).map((a) => `<li>${esc(a)}<div class="renglones"></div></li>`).join('')}</ol>`)}
    ${sec('🚀 Reto', g.reto && `<p>${par(g.reto)}</p><div class="renglones"></div>`)}
    ${sec('🪞 Autoevaluación', lineas(g.autoevaluacion).length && `<table class="autoev"><tr><th></th><th>😀 Lo logré</th><th>🙂 Casi</th><th>🤔 Necesito ayuda</th></tr>${lineas(g.autoevaluacion).map((a) => `<tr><td>${esc(a)}</td><td></td><td></td><td></td></tr>`).join('')}</table>`)}`;
}
function htmlFicha(f, { conSolucion = f.solucion } = {}) {
  const css = `@page { size: letter; margin: 14mm 14mm 14mm 14mm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: ${f.letraGrande ? 14 : 11.5}pt; color: #111; margin: 0; }
    .mb { width: 100%; border-collapse: collapse; } h1 { font-size: ${f.letraGrande ? 20 : 17}pt; text-align: center; margin: 4px 0 8px; }
    h2 { font-size: 13pt; color: #1f4e79; margin: 12px 0 4px; } h3 { font-size: 12pt; margin: 6px 0; }
    .datos { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt; } .datos td { border: 1px solid #8ea9db; padding: 5px 6px; }
    .instr { background: #eef3fb; padding: 6px 10px; border-radius: 6px; margin: 6px 0 12px; }
    .sopa { border-collapse: collapse; margin: 0 auto; } .sopa td { border: 1px solid #999; text-align: center; font-weight: bold; font-family: 'Courier New', monospace; }
    .sopa td.resaltar { background: #ffe082; }
    .banco { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 12px 0; font-weight: bold; } .banco.recuadro { border: 2px dashed #1f4e79; padding: 8px 12px; border-radius: 8px; justify-content: center; }
    .cruci { border-collapse: collapse; margin: 0 auto 10px; } .cruci td { padding: 0; } .cruci td.letra { border: 1.5px solid #222; position: relative; text-align: center; vertical-align: middle; }
    .cruci .num { position: absolute; top: 1px; left: 2px; font-size: 7pt; } .cruci .sol { font-weight: bold; }
    .pistas { display: flex; gap: 20px; } .pistas > div { flex: 1; } .pistas ol { margin: 0; padding-left: 26px; } .pistas li { margin-bottom: 3px; } .gris { color: #777; }
    .emparejar { width: 100%; border-collapse: collapse; } .emparejar th { text-align: left; color: #1f4e79; } .emparejar td { padding: 9px 4px; vertical-align: middle; } .emparejar td:first-child { text-align: right; }
    .punto { color: #1f4e79; font-size: 14pt; }
    .texto-completar { line-height: 2.3; text-align: justify; } .hueco { border-bottom: 1.5px solid #222; display: inline-block; } .sol-linea { text-decoration: underline; color: #1b5e20; }
    .renglones { height: 58px; background: repeating-linear-gradient(transparent, transparent 27px, #bbb 28px); margin: 4px 0 8px; }
    .autoev { width: 100%; border-collapse: collapse; } .autoev td, .autoev th { border: 1px solid #8ea9db; padding: 6px; } .autoev td + td { width: 15%; }
    .salto { page-break-before: always; } .titulo-sol { text-align: center; color: #1b5e20; }`;
  const solucionable = conSolucion && ['sopa', 'crucigrama', 'emparejar', 'completar'].includes(f.tipo);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
    ${encabezadoFichaHTML(f)}${cuerpoFicha(f, false)}
    ${solucionable ? `<div class="salto"></div>${membreteHTML()}<h1 class="titulo-sol">🔑 Solucionario – ${esc(f.titulo || TIPOS_FICHA[f.tipo].t)}</h1>${cuerpoFicha(f, true)}` : ''}</body></html>`;
}

// ---------- Vista ----------
RENDERS.fichas = () => {
  const f = ui.ficha || (ui.ficha = nuevaFicha());
  const campo = (k, t, filas, ph) => `<div class="campo"><label>${t}</label><textarea rows="${filas}" oninput="ui.ficha.${k}=this.value;vistaPreviaFicha()" placeholder="${esc(ph)}">${esc(f[k])}</textarea></div>`;
  const datos = {
    sopa: campo('palabras', 'Palabras (una por línea o separadas por comas)', 8, 'FRACCIÓN\nNUMERADOR\nDENOMINADOR…') + `<div class="campo"><label>Dificultad</label><select onchange="ui.ficha.dificultad=this.value;vistaPreviaFicha()">${[['facil', 'Fácil: → y ↓'], ['medio', 'Media: también en diagonal'], ['dificil', 'Difícil: también al revés']].map(([k, t]) => `<option value="${k}" ${f.dificultad === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`,
    crucigrama: campo('pistas', 'Palabra: pista (una por línea)', 9, 'FOTOSINTESIS: Proceso con el que las plantas fabrican su alimento\nRAIZ: Parte de la planta que absorbe el agua'),
    emparejar: campo('pares', 'Pares: término = definición (uno por línea)', 9, 'Mamífero = Animal que se alimenta de leche materna\nOvíparo = Animal que nace de un huevo'),
    completar: campo('texto', 'Texto: marca entre *asteriscos* las palabras que se deben completar', 9, 'Las plantas fabrican su alimento mediante la *fotosíntesis*, usando la luz del *sol*…'),
    guia: ['objetivo', 'explicacion', 'ejemplos', 'actividades', 'reto', 'autoevaluacion'].map((k) => `<div class="campo"><label>${{ objetivo: 'Objetivo', explicacion: 'Lo que debes saber (explicación)', ejemplos: 'Ejemplos', actividades: 'Actividades (una por línea)', reto: 'Reto', autoevaluacion: 'Autoevaluación: afirmaciones "Puedo…" (una por línea)' }[k]}</label>
      <textarea rows="${k === 'explicacion' ? 5 : 3}" oninput="ui.ficha.guia.${k}=this.value;vistaPreviaFicha()">${esc(f.guia[k])}</textarea></div>`).join(''),
  }[f.tipo];
  const guardadas = (S.fichas || []).slice().reverse();
  return `
  <div class="cabecera"><div><h1>Fichas imprimibles</h1><p class="sub">Sopas de letras, crucigramas, emparejar, completar y guías de trabajo con el membrete de la institución. Funcionan sin internet; la IA es opcional para sugerir el contenido.</p></div>
    <div class="acciones">${guardadas.length ? `<select style="width:auto" onchange="if(this.value)abrirFicha(this.value)"><option value="">📂 Mis fichas (${guardadas.length})…</option>${guardadas.map((x) => `<option value="${x.id}">${TIPOS_FICHA[x.tipo].ico} ${esc(x.titulo || TIPOS_FICHA[x.tipo].t)}</option>`).join('')}</select>` : ''}
      <button class="btn" onclick="ui.ficha=nuevaFicha(ui.ficha.tipo);render()">＋ Nueva</button><button class="btn" onclick="guardarFicha()">💾 Guardar</button>
      <button class="btn primario" onclick="exportarFicha()">🖨️ PDF para imprimir</button></div></div>
  <div class="pestanas">${Object.entries(TIPOS_FICHA).map(([k, x]) => `<button class="${f.tipo === k ? 'activo' : ''}" onclick="cambiarTipoFicha('${k}')">${x.ico} ${x.t}</button>`).join('')}</div>
  <div class="rejilla" style="grid-template-columns: minmax(330px, 420px) 1fr; align-items:start">
    <div class="tarjeta">
      <div class="campo"><label>Título</label><input value="${esc(f.titulo)}" oninput="ui.ficha.titulo=this.value;vistaPreviaFicha()" placeholder="Ej.: Las fracciones"></div>
      <div class="rejilla r2"><div class="campo"><label>Grupo</label><select onchange="ui.ficha.grupoId=this.value;const g=porId(S.grupos,this.value);if(g)ui.ficha.grado=g.grado;vistaPreviaFicha()">${opcionesGrupos(f.grupoId, '(sin grupo)')}</select></div>
        <div class="campo"><label>Área</label><select onchange="ui.ficha.areaId=this.value;vistaPreviaFicha()">${opcionesAreas(f.areaId, '(sin área)')}</select></div></div>
      <div class="campo"><label>Instrucciones</label><textarea rows="2" oninput="ui.ficha.instrucciones=this.value;vistaPreviaFicha()">${esc(f.instrucciones)}</textarea></div>
      ${datos}
      <div class="fila" style="margin:6px 0 10px">
        <button class="btn ia" onclick="dialogoIAFicha()">✨ Sugerir con IA</button><button class="btn" onclick="fichaDesdePlaneacion()">📝 Desde una planeación</button>
        ${['sopa', 'crucigrama', 'emparejar', 'completar'].includes(f.tipo) ? `<button class="btn" title="Otra distribución" onclick="ui.ficha.semilla=Math.floor(Math.random()*1e9);vistaPreviaFicha()">🔀 Reorganizar</button>` : ''}</div>
      <div class="fila" style="gap:14px">
        ${f.tipo === 'sopa' || f.tipo === 'completar' ? `<label style="font-weight:normal;color:inherit;margin:0"><input type="checkbox" ${f.banco ? 'checked' : ''} onchange="ui.ficha.banco=this.checked;vistaPreviaFicha()"> ${f.tipo === 'sopa' ? 'Mostrar lista de palabras' : 'Recuadro de palabras'}</label>` : ''}
        ${f.tipo === 'sopa' ? `<label style="font-weight:normal;color:inherit;margin:0"><input type="checkbox" ${f.mayusculas ? 'checked' : ''} onchange="ui.ficha.mayusculas=this.checked;vistaPreviaFicha()"> Mayúsculas</label>` : ''}
        ${f.tipo !== 'guia' ? `<label style="font-weight:normal;color:inherit;margin:0"><input type="checkbox" ${f.solucion ? 'checked' : ''} onchange="ui.ficha.solucion=this.checked;vistaPreviaFicha()"> Incluir solucionario</label>` : ''}
        <label style="font-weight:normal;color:inherit;margin:0"><input type="checkbox" ${f.letraGrande ? 'checked' : ''} onchange="ui.ficha.letraGrande=this.checked;vistaPreviaFicha()"> Letra grande (primaria)</label></div>
    </div>
    <div class="tarjeta" style="padding:8px"><iframe id="ficha-previa" class="ficha-previa" title="Vista previa"></iframe></div>
  </div>`;
};
RENDERS.fichas_despues = () => vistaPreviaFicha();
function vistaPreviaFicha() {
  const fr = document.getElementById('ficha-previa');
  if (fr) fr.srcdoc = htmlFicha(ui.ficha).replace('<style>', '<style>body{padding:18px;background:#fff} .salto{border-top:3px dashed #bbb;margin:24px 0} ');
}
function cambiarTipoFicha(tipo) {
  const f = ui.ficha;
  if (f.instrucciones === TIPOS_FICHA[f.tipo].instr) f.instrucciones = TIPOS_FICHA[tipo].instr;
  // aprovechar lo escrito en otro tipo
  if (tipo === 'sopa' && !f.palabras) f.palabras = pistasDe(f).map((x) => x.palabra).join('\n') || [...f.texto.matchAll(/\*([^*]+)\*/g)].map((m) => m[1]).join('\n');
  if (tipo === 'completar' && !f.texto && f.pares) f.texto = paresDe(f).map((p) => `${p.a}: *${p.b.split(' ')[0]}*${p.b.split(' ').slice(1).length ? ' ' + p.b.split(' ').slice(1).join(' ') : ''}`).join('\n');
  f.tipo = tipo; render();
}
function guardarFicha() {
  const f = ui.ficha;
  S.fichas ||= [];
  if (!f.id) { f.id = uid(); S.fichas.push(structuredClone(f)); }
  else { const i = S.fichas.findIndex((x) => x.id === f.id); S.fichas[i >= 0 ? i : S.fichas.length] = structuredClone(f); }
  guardar(); render(); aviso('Ficha guardada', 'ok');
}
function abrirFicha(id) { ui.ficha = structuredClone(porId(S.fichas, id)); render(); }
async function exportarFicha() {
  const f = ui.ficha;
  const r = await api.guardarPDF({ nombre: `${TIPOS_FICHA[f.tipo].t} - ${f.titulo || 'ficha'}`, html: htmlFicha(f) });
  if (r.ok) aviso('PDF creado', 'ok'); else if (r.error) aviso(r.error, 'error');
}
function fichaDesdePlaneacion() {
  const lista = [...S.planeaciones].sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || '')).slice(0, 80);
  if (!lista.length) return aviso('Aún no tienes planeaciones');
  abrirModal(`<h2>📝 Tomar datos de una planeación</h2><p class="ayuda">Se copian el título, el grupo, el área y, en la guía, el objetivo, la explicación (estructuración) y las actividades (práctica y transferencia).</p>
    <select id="fp-plan">${lista.map((p) => `<option value="${p.id}">${esc(p.titulo || 'Sin título')} · ${esc(nombreGrupoId(p.grupoId))} · ${esc(fechaCorta(p.fechaInicio))}</option>`).join('')}</select>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="aplicarPlaneacionFicha(document.getElementById('fp-plan').value)">Usar</button></div>`);
}
function aplicarPlaneacionFicha(id) {
  const p = porId(S.planeaciones, id), f = ui.ficha;
  Object.assign(f, { titulo: f.titulo || p.titulo || '', grupoId: p.grupoId || f.grupoId, areaId: p.areaId || f.areaId, planeacionId: p.id });
  const s = p.sesiones || [];
  if (f.tipo === 'guia') {
    f.guia.objetivo ||= p.objetivo || '';
    f.guia.explicacion ||= s.map((x) => x.estructuracion).filter(Boolean).join('\n');
    f.guia.actividades ||= s.flatMap((x) => [x.practica, x.transferencia]).filter(Boolean).join('\n');
    f.guia.autoevaluacion ||= [p.desempenoSaber, p.desempenoHacer].filter(Boolean).map((d) => 'Puedo ' + d.replace(/^[•\-\s]+/, '').replace(/^\w/, (c) => c.toLowerCase())).join('\n');
  }
  cerrarModal(); render();
  if (f.tipo !== 'guia') aviso('Usa "✨ Sugerir con IA" para generar las palabras o el texto a partir del tema.');
}
function dialogoIAFicha() {
  if (sinIA()) return;
  const f = ui.ficha;
  const p = f.planeacionId && porId(S.planeaciones, f.planeacionId);
  abrirModal(`<h2>✨ Sugerir contenido de la ficha</h2>
    <div class="campo"><label>Tema</label><input id="fia-tema" value="${esc(f.titulo || p?.titulo || '')}" placeholder="Ej.: Partes de la planta"></div>
    <div class="campo"><label>Detalles (opcional)</label><textarea id="fia-det" rows="3" placeholder="Contenidos, vocabulario que ya vieron, nivel…">${esc(p ? [p.objetivo, p.desempenoSaber].filter(Boolean).join('\n') : '')}</textarea></div>
    <p class="ayuda">${TIPOS_FICHA[f.tipo].ico} ${TIPOS_FICHA[f.tipo].t} · ${esc(f.areaId ? nombreArea(f.areaId) : 'sin área')} · grado ${esc(String(porId(S.grupos, f.grupoId)?.grado || f.grado || '—'))}. Se reemplaza el contenido actual de la ficha.</p>
    <div id="fia-error"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn ia" id="fia-btn" onclick="generarFichaIA()">✨ Generar</button></div>`);
}
async function generarFichaIA() {
  const f = ui.ficha;
  const grado = porId(S.grupos, f.grupoId)?.grado || f.grado;
  const tema = document.getElementById('fia-tema').value.trim();
  if (!tema) return aviso('Escribe el tema', 'error');
  const contexto = [`Tipo de ficha: ${f.tipo}`, `Tema: ${tema}`, f.areaId ? `Área: ${nombreArea(f.areaId)}` : '', grado ? `Grado: ${grado}° (${nivelDeGrado(grado)})` : '', document.getElementById('fia-det').value.trim()].filter(Boolean).join('\n');
  const b = document.getElementById('fia-btn'); b.disabled = true; b.innerHTML = '<span class="cargando"></span> Generando…';
  const r = await api.sugerirIA({ ia: S.config.ia, contexto, tarea: 'ficha' });
  if (!document.getElementById('fia-btn')) return;
  b.disabled = false; b.textContent = '✨ Generar';
  if (!r.ok) { document.getElementById('fia-error').innerHTML = `<div class="alerta error">${esc(r.error)}</div>`; return; }
  const d = r.datos;
  if (f.tipo === 'sopa' && Array.isArray(d.palabras)) f.palabras = d.palabras.join('\n');
  if (f.tipo === 'crucigrama' && Array.isArray(d.pistas)) f.pistas = d.pistas.map((x) => `${x.palabra}: ${x.pista}`).join('\n');
  if (f.tipo === 'emparejar' && Array.isArray(d.pares)) f.pares = d.pares.map((x) => `${x.a} = ${x.b}`).join('\n');
  if (f.tipo === 'completar' && d.texto) f.texto = d.texto;
  if (f.tipo === 'guia') for (const k of Object.keys(f.guia)) if (d[k]) f.guia[k] = Array.isArray(d[k]) ? d[k].join('\n') : String(d[k]);
  if (!f.titulo) f.titulo = tema;
  cerrarModal(); render(); aviso('Contenido sugerido. Revísalo antes de imprimir.', 'ok');
}
