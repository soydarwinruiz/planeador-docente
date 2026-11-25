// ================= Banco pedagógico: estrategias, metodologías y técnicas =================
/* global BANCO_INICIAL */

const TIPOS_BANCO = {
  estrategia: { uno: 'Estrategia', varios: 'Estrategias', ico: '🎯' },
  metodologia: { uno: 'Metodología', varios: 'Metodologías (métodos)', ico: '🧭' },
  tecnica: { uno: 'Técnica', varios: 'Técnicas', ico: '🛠️' },
  dua: { uno: 'Pauta DUA / ajuste', varios: 'DUA y flexibilización', ico: '♿' },
};
const MOMENTOS_BANCO = [
  ['exploracion', 'Exploración'], ['estructuracion', 'Estructuración'], ['practica', 'Práctica'], ['transferencia', 'Transferencia'], ['valoracion', 'Valoración / cierre'],
];
const CAMPOS_BANCO = [
  { k: 'descripcion', t: 'Descripción', ph: '¿En qué consiste?' },
  { k: 'pasos', t: 'Cómo aplicarla (pasos)', ph: '1. …\n2. …' },
  { k: 'recursos', t: 'Recursos necesarios', ph: '' },
  { k: 'areas', t: 'Áreas o grados recomendados', ph: 'Ej.: todas, Ciencias Naturales, 1° a 5°' },
  { k: 'fuente', t: 'Fuente / referencia', ph: '' },
];

// Carga las entradas predeterminadas sin duplicar ni sobrescribir lo que el docente haya editado.
function sembrarBanco() {
  if (typeof BANCO_INICIAL === 'undefined' || !BANCO_INICIAL.items?.length) return;
  if ((S.bancoSemilla || 0) >= BANCO_INICIAL.version) return;
  const existentes = new Set(S.bancoPedagogico.map((x) => x.id));
  const eliminados = new Set(S.bancoEliminados || []);
  for (const it of BANCO_INICIAL.items) {
    if (!existentes.has(it.id) && !eliminados.has(it.id)) S.bancoPedagogico.push({ ...it, momentos: [...(it.momentos || [])], predeterminado: true });
  }
  S.bancoSemilla = BANCO_INICIAL.version;
}

function clasificacionesDe(tipo) {
  return [...new Set(S.bancoPedagogico.filter((x) => x.tipo === tipo && x.clasificacion).map((x) => x.clasificacion))].sort((a, b) => a.localeCompare(b, 'es'));
}
function filtrarBanco({ tipo, texto, clasificacion, momento, favoritos }) {
  const q = normalizar(texto);
  return S.bancoPedagogico.filter((x) => (!tipo || x.tipo === tipo) && (!clasificacion || x.clasificacion === clasificacion) &&
    (!momento || (x.momentos || []).includes(momento)) && (!favoritos || x.favorito) &&
    (!q || normalizar([x.codigo, x.nombre, x.clasificacion, x.descripcion, x.pasos, x.areas].join(' ')).includes(q)))
    .sort((a, b) => (b.favorito ? 1 : 0) - (a.favorito ? 1 : 0) || String(a.codigo || '~').localeCompare(String(b.codigo || '~'), 'es', { numeric: true }) || a.nombre.localeCompare(b.nombre, 'es'));
}

// ---------- Vista ----------
RENDERS.bancoPedagogico = () => {
  const f = ui.bp || (ui.bp = { tipo: 'estrategia', texto: '', clasificacion: '', momento: '', favoritos: false });
  const lista = filtrarBanco(f);
  const t = TIPOS_BANCO[f.tipo];
  return `
  <div class="cabecera"><div><h1>Banco pedagógico</h1><p class="sub">Estrategias, metodologías y técnicas para insertar en tus planeaciones con un clic.</p></div>
    <div class="acciones">
      <button class="btn" onclick="dialogoImportarBanco()">📋 Importar desde Excel</button>
      <button class="btn" onclick="exportarBanco()">⬇️ Exportar a Excel</button>
      <button class="btn primario" onclick="editarEntradaBanco()">＋ Nueva ${t.uno.toLowerCase()}</button></div></div>
  <div class="pestanas">${Object.entries(TIPOS_BANCO).map(([k, v]) => `<button class="${f.tipo === k ? 'activo' : ''}" onclick="ui.bp.tipo='${k}';ui.bp.clasificacion='';render()">${v.ico} ${v.varios} (${S.bancoPedagogico.filter((x) => x.tipo === k).length})</button>`).join('')}</div>
  <div class="filtros tarjeta">
    <div style="flex:1;min-width:200px"><label>Buscar</label><input value="${esc(f.texto)}" placeholder="Nombre, descripción… (Enter)" onchange="ui.bp.texto=this.value;render()"></div>
    <div><label>Clasificación</label><select onchange="ui.bp.clasificacion=this.value;render()"><option value="">Todas</option>${clasificacionesDe(f.tipo).map((c) => `<option ${f.clasificacion === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    <div><label>Momento de la clase</label><select onchange="ui.bp.momento=this.value;render()"><option value="">Cualquiera</option>${MOMENTOS_BANCO.map(([k, v]) => `<option value="${k}" ${f.momento === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div><label><input type="checkbox" ${f.favoritos ? 'checked' : ''} onchange="ui.bp.favoritos=this.checked;render()"> Solo favoritas ★</label></div>
  </div>
  ${lista.length ? `<div class="banco">${lista.map((x) => `
    <div class="tarjeta">
      <div class="fila" style="justify-content:space-between"><span>${x.clasificacion ? `<span class="chip">${esc(x.clasificacion)}</span>` : ''}</span>
        <button class="icono" title="${x.favorito ? 'Quitar de favoritas' : 'Marcar como favorita'}" onclick="alternarFavorito('${x.id}')" style="color:${x.favorito ? '#f5a623' : '#b0b8c4'}">${x.favorito ? '★' : '☆'}</button></div>
      <div class="tit">${x.codigo ? `<span class="ayuda">${esc(x.codigo)}</span> ` : ''}${esc(x.nombre)}</div>
      <div class="ayuda">${esc((x.descripcion || '').slice(0, 180))}${(x.descripcion || '').length > 180 ? '…' : ''}</div>
      ${(x.momentos || []).length ? `<div>${x.momentos.map((m) => `<span class="item plan" style="display:inline-block;margin-right:3px">${esc((MOMENTOS_BANCO.find((z) => z[0] === m) || [m, m])[1])}</span>`).join('')}</div>` : ''}
      <div class="pie">
        <button class="btn pequeno" onclick="verEntradaBanco('${x.id}')">Ver</button>
        <button class="btn pequeno" onclick="editarEntradaBanco('${x.id}')">✏️ Editar</button>
        <button class="btn pequeno" onclick="duplicarEntradaBanco('${x.id}')">📑</button>
        <button class="btn pequeno peligro" onclick="eliminarEntradaBanco('${x.id}')">🗑️</button>
      </div>
    </div>`).join('')}</div>`
    : `<div class="tarjeta vacio"><div class="grande">${t.ico}</div>${S.bancoPedagogico.some((x) => x.tipo === f.tipo) ? 'Ninguna coincide con los filtros.' : `Aún no hay ${t.varios.toLowerCase()}. Agrégalas una a una o impórtalas desde Excel.`}</div>`}`;
};

function verEntradaBanco(id) {
  const x = porId(S.bancoPedagogico, id);
  abrirModal(`<h2>${TIPOS_BANCO[x.tipo].ico} ${x.codigo ? esc(x.codigo) + ' · ' : ''}${esc(x.nombre)}</h2>
    <p>${x.clasificacion ? `<span class="chip">${esc(x.clasificacion)}</span> ` : ''}<span class="chip">${TIPOS_BANCO[x.tipo].uno}</span>
    ${(x.momentos || []).map((m) => `<span class="chip sesion">${esc((MOMENTOS_BANCO.find((z) => z[0] === m) || [m, m])[1])}</span>`).join(' ')}</p>
    ${CAMPOS_BANCO.filter((c) => x[c.k]).map((c) => `<h3>${c.t}</h3><p style="white-space:pre-wrap;margin-top:0">${esc(x[c.k])}</p>`).join('')}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn primario" onclick="editarEntradaBanco('${id}')">✏️ Editar</button></div>`, { ancho: true });
}

function editarEntradaBanco(id) {
  const x = id ? porId(S.bancoPedagogico, id) : { tipo: ui.bp?.tipo || 'estrategia', nombre: '', clasificacion: ui.bp?.clasificacion || '', momentos: [] };
  abrirModal(`<h2>${id ? 'Editar' : 'Nueva entrada'}</h2>
    <div class="rejilla" style="grid-template-columns: 1fr 110px 2fr 1.5fr">
      <div class="campo"><label>Tipo</label><select id="b-tipo">${Object.entries(TIPOS_BANCO).map(([k, v]) => `<option value="${k}" ${x.tipo === k ? 'selected' : ''}>${v.uno}</option>`).join('')}</select></div>
      <div class="campo"><label>Código</label><input id="b-codigo" value="${esc(x.codigo || '')}"></div>
      <div class="campo"><label>Nombre</label><input id="b-nombre" value="${esc(x.nombre)}"></div>
      <div class="campo"><label>Clasificación</label><input id="b-clas" list="b-clas-l" value="${esc(x.clasificacion || '')}" placeholder="Ej.: Aprendizaje activo">
        <datalist id="b-clas-l">${[...new Set(S.bancoPedagogico.map((z) => z.clasificacion).filter(Boolean))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
    </div>
    <div class="campo"><label>Momentos de la clase en que se recomienda</label>
      ${MOMENTOS_BANCO.map(([k, v]) => `<label style="display:inline-flex;gap:4px;margin-right:14px;font-weight:normal;color:inherit;font-size:14px"><input type="checkbox" class="b-mom" value="${k}" ${(x.momentos || []).includes(k) ? 'checked' : ''}> ${v}</label>`).join('')}</div>
    ${CAMPOS_BANCO.map((c) => `<div class="campo"><label>${c.t}</label><textarea id="b-${c.k}" placeholder="${esc(c.ph)}" ${c.k === 'pasos' || c.k === 'descripcion' ? 'style="min-height:90px"' : ''}>${esc(x[c.k] || '')}</textarea></div>`).join('')}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarEntradaBanco('${id || ''}')">Guardar</button></div>`, { ancho: true });
}
function guardarEntradaBanco(id) {
  const nombre = document.getElementById('b-nombre').value.trim();
  if (!nombre) return aviso('Escribe el nombre', 'error');
  const datos = {
    tipo: document.getElementById('b-tipo').value, nombre, codigo: document.getElementById('b-codigo').value.trim(), clasificacion: document.getElementById('b-clas').value.trim(),
    momentos: [...document.querySelectorAll('.b-mom:checked')].map((c) => c.value),
  };
  CAMPOS_BANCO.forEach((c) => { datos[c.k] = document.getElementById('b-' + c.k).value.trim(); });
  if (id) Object.assign(porId(S.bancoPedagogico, id), datos);
  else S.bancoPedagogico.push({ id: uid(), ...datos });
  if (ui.bp) ui.bp.tipo = datos.tipo;
  guardar(); cerrarModal(); render();
}
function duplicarEntradaBanco(id) {
  const x = porId(S.bancoPedagogico, id);
  S.bancoPedagogico.push({ ...structuredClone(x), id: uid(), nombre: x.nombre + ' (copia)', predeterminado: false, favorito: false });
  guardar(); render();
}
async function eliminarEntradaBanco(id) {
  const x = porId(S.bancoPedagogico, id);
  if (!(await confirmar(`¿Eliminar "${x.nombre}" del banco?`))) return;
  S.bancoPedagogico = S.bancoPedagogico.filter((z) => z.id !== id);
  if (x.predeterminado) (S.bancoEliminados ||= []).push(id); // para no volver a cargarla
  guardar(); render();
}
function alternarFavorito(id) { const x = porId(S.bancoPedagogico, id); x.favorito = !x.favorito; guardar(); render(); }

// ---------- Importar / exportar ----------
const COLUMNAS_BANCO = [
  ['tipo', ['tipo']], ['codigo', ['codigo', 'cod', 'n.°', 'no']], ['nombre', ['nombre', 'estrategia', 'metodologia', 'tecnica', 'titulo']], ['clasificacion', ['clasificacion', 'categoria', 'clase', 'grupo']],
  ['descripcion', ['descripcion', 'definicion', 'en que consiste']], ['pasos', ['pasos', 'como aplicarla', 'aplicacion', 'procedimiento', 'desarrollo']],
  ['momentos', ['momentos', 'momento']], ['recursos', ['recursos', 'materiales']], ['areas', ['areas', 'area', 'grados']], ['fuente', ['fuente', 'referencia', 'autor']],
];
function tipoDesdeTexto(t, porDefecto) {
  const n = normalizar(t);
  if (n.startsWith('metod')) return 'metodologia';
  if (n.startsWith('tecn')) return 'tecnica';
  if (n.startsWith('estrat')) return 'estrategia';
  if (n.includes('dua') || n.startsWith('ajuste') || n.startsWith('flexib')) return 'dua';
  return porDefecto;
}
function momentosDesdeTexto(t) {
  const n = normalizar(t);
  return MOMENTOS_BANCO.filter(([k, v]) => n.includes(normalizar(v).slice(0, 6)) || n.includes(k.slice(0, 6))).map(([k]) => k);
}
function dialogoImportarBanco() {
  abrirModal(`<h2>Importar desde Excel</h2>
    <p class="ayuda">Copia la tabla desde Excel (incluyendo la fila de títulos) y pégala aquí. Columnas reconocidas:
    <b>Tipo</b> (Estrategia / Metodología / Técnica), <b>Nombre</b>, <b>Clasificación</b>, <b>Descripción</b>, <b>Pasos</b>, <b>Momentos</b>, <b>Recursos</b>, <b>Áreas</b>, <b>Fuente</b>.
    Solo <b>Nombre</b> es obligatoria; si no hay columna Tipo se usará el tipo elegido abajo.</p>
    <div class="campo"><label>Tipo por defecto</label><select id="b-imp-tipo">${Object.entries(TIPOS_BANCO).map(([k, v]) => `<option value="${k}" ${ui.bp?.tipo === k ? 'selected' : ''}>${v.uno}</option>`).join('')}</select></div>
    <textarea id="b-imp" style="min-height:220px" placeholder="Tipo&#9;Nombre&#9;Clasificación&#9;Descripción…"></textarea>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="importarBanco()">Importar</button></div>`, { ancho: true });
}
function partirFilasTSV(texto) {
  // Respeta celdas entre comillas con saltos de línea (como las copia Excel)
  const filas = []; let fila = []; let celda = ''; let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (ch === '"') comillas = false;
      else celda += ch;
    } else if (ch === '"' && celda === '') comillas = true;
    else if (ch === '\t') { fila.push(celda); celda = ''; }
    else if (ch === '\n') { fila.push(celda.replace(/\r$/, '')); filas.push(fila); fila = []; celda = ''; }
    else celda += ch;
  }
  if (celda || fila.length) { fila.push(celda.replace(/\r$/, '')); filas.push(fila); }
  return filas.filter((f) => f.some((c) => c.trim()));
}
function importarBanco() {
  const filas = partirFilasTSV(document.getElementById('b-imp').value);
  if (filas.length < 2) return aviso('Pega la tabla con su fila de títulos', 'error');
  const titulos = filas[0].map(normalizar).map((t) => t.trim());
  const mapa = {};
  for (const [campo, nombres] of COLUMNAS_BANCO) {
    const i = titulos.findIndex((t) => nombres.includes(t));
    if (i >= 0 && !Object.values(mapa).includes(i)) mapa[campo] = i;
  }
  if (mapa.nombre == null) return aviso('No encontré la columna "Nombre" en la fila de títulos', 'error');
  const porDefecto = document.getElementById('b-imp-tipo').value;
  let n = 0;
  for (const f of filas.slice(1)) {
    const v = (k) => (mapa[k] != null ? (f[mapa[k]] || '').trim() : '');
    if (!v('nombre')) continue;
    S.bancoPedagogico.push({
      id: uid(), tipo: tipoDesdeTexto(v('tipo'), porDefecto), codigo: v('codigo'), nombre: v('nombre'), clasificacion: v('clasificacion'),
      momentos: momentosDesdeTexto(v('momentos')), descripcion: v('descripcion'), pasos: v('pasos'), recursos: v('recursos'), areas: v('areas'), fuente: v('fuente'),
    });
    n++;
  }
  guardar(); cerrarModal(); render();
  aviso(`Se importaron ${n} entrada(s)`, 'ok');
}
function exportarBanco() {
  const filas = [['Tipo', 'Código', 'Nombre', 'Clasificación', 'Momentos', 'Descripción', 'Pasos', 'Recursos', 'Áreas', 'Fuente']];
  for (const x of [...S.bancoPedagogico].sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre, 'es'))) {
    filas.push([TIPOS_BANCO[x.tipo].uno, x.codigo || '', x.nombre, x.clasificacion, (x.momentos || []).map((m) => (MOMENTOS_BANCO.find((z) => z[0] === m) || [m, m])[1]).join(', '),
      x.descripcion, x.pasos, x.recursos, x.areas, x.fuente]);
  }
  exportarExcel('Banco pedagógico', filas);
}

// ---------- Insertar en las planeaciones ----------
function botonBanco(textareaId, momento = '') {
  return `<button type="button" class="btn pequeno" style="padding:1px 7px;margin-left:6px;font-weight:normal" title="Insertar desde el banco pedagógico" onclick="abrirSelectorBanco('${textareaId}','${momento}')">📚 Banco</button>`;
}
let selectorBanco = {};
function abrirSelectorBanco(textareaId, momento) {
  // Los campos de ajustes, apoyos e inclusión abren directamente las pautas DUA
  const esAjuste = /ajuste|apoyo|inclusion|barrera/i.test(textareaId);
  selectorBanco = { textareaId, tipo: esAjuste ? 'dua' : '', texto: '', momento: esAjuste ? '' : (momento || ''), conPasos: false };
  dibujarSelectorBanco();
}
function dibujarSelectorBanco() {
  const s = selectorBanco;
  if (!S.bancoPedagogico.length) {
    abrirModal(`<h2>📚 Banco pedagógico</h2><p>El banco está vacío. Agrega estrategias, metodologías y técnicas desde <b>Banco pedagógico</b> en el menú.</p>
      <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn primario" onclick="cerrarModal();ir('bancoPedagogico')">Ir al banco</button></div>`);
    return;
  }
  const lista = filtrarBanco(s);
  abrirModal(`<h2>📚 Insertar desde el banco pedagógico</h2>
    <div class="filtros" style="margin-bottom:8px">
      <div style="flex:1"><label>Buscar</label><input id="sb-texto" value="${esc(s.texto)}" oninput="selectorBanco.texto=this.value;clearTimeout(window._sb);window._sb=setTimeout(()=>{dibujarSelectorBanco();reenfocar('#sb-texto')},250)"></div>
      <div><label>Tipo</label><select onchange="selectorBanco.tipo=this.value;dibujarSelectorBanco()"><option value="">Todos</option>${Object.entries(TIPOS_BANCO).map(([k, v]) => `<option value="${k}" ${s.tipo === k ? 'selected' : ''}>${v.varios}</option>`).join('')}</select></div>
      <div><label>Momento</label><select onchange="selectorBanco.momento=this.value;dibujarSelectorBanco()"><option value="">Cualquiera</option>${MOMENTOS_BANCO.map(([k, v]) => `<option value="${k}" ${s.momento === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div><label><input type="checkbox" ${s.conPasos ? 'checked' : ''} onchange="selectorBanco.conPasos=this.checked"> Incluir los pasos</label></div>
    </div>
    <div style="max-height:52vh;overflow-y:auto">
    ${lista.length ? `<ul class="lista-simple">${lista.slice(0, 150).map((x) => `<li><div><b>${x.favorito ? '★ ' : ''}${x.codigo ? esc(x.codigo) + ' · ' : ''}${esc(x.nombre)}</b> <span class="chip">${TIPOS_BANCO[x.tipo].uno}</span> ${x.clasificacion ? `<span class="chip">${esc(x.clasificacion)}</span>` : ''}
      <br><span class="ayuda">${esc((x.descripcion || '').slice(0, 160))}</span></div>
      <button class="btn pequeno primario" onclick="insertarDelBanco('${x.id}')">Insertar</button></li>`).join('')}</ul>`
      : '<p class="ayuda">Nada coincide con la búsqueda.' + (s.momento ? ' Prueba con "Momento: Cualquiera".' : '') + '</p>'}
    </div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button></div>`, { ancho: true });
}
function insertarDelBanco(id) {
  const x = porId(S.bancoPedagogico, id);
  const ta = document.getElementById(selectorBanco.textareaId);
  if (!ta) return cerrarModal();
  let texto = `• ${TIPOS_BANCO[x.tipo].uno}${x.codigo ? ' ' + x.codigo : ''} – ${x.nombre}${x.descripcion ? ': ' + x.descripcion.split('\n')[0] : ''}`;
  if (selectorBanco.conPasos && x.pasos) texto += '\n' + x.pasos;
  ta.value = ta.value.trim() ? ta.value.replace(/\s+$/, '') + '\n' + texto : texto;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  cerrarModal();
  ta.focus();
  aviso(`"${x.nombre}" insertada`, 'ok');
}
