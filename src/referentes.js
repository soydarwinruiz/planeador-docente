// ================= Referentes curriculares (Estándares, DBA, orientaciones del MEN) =================
/* global REFERENTES */

const TIPOS_REFERENTE = { estandar: 'Estándares básicos de competencias', dba: 'Derechos Básicos de Aprendizaje (DBA)', orientacion: 'Orientaciones curriculares' };

function areasReferente() { return [...new Set(REFERENTES.items.map((x) => x.area))]; }
// Relaciona el nombre del área de la app con el área de los documentos oficiales
function areaReferenteDe(areaId) {
  const n = normalizar(nombreArea(areaId));
  const disponibles = areasReferente();
  const busca = (re) => disponibles.find((a) => re.test(normalizar(a)));
  if (/matem/.test(n)) return busca(/matem/);
  if (/lengua|castellan|espanol|lectura/.test(n)) return busca(/lengua/);
  if (/natural|biolog|quimic|fisica/.test(n)) return busca(/natural/);
  if (/social|historia|geograf/.test(n)) return busca(/social/);
  if (/ingl/.test(n)) return busca(/ingl/);
  if (/tecnolog|informat/.test(n)) return busca(/tecnolog/);
  if (/etica|ciudadan|paz|democr|valores/.test(n)) return busca(/ciudadan/);
  return '';
}
function bandaDeGrado(grado) {
  const g = +grado;
  const bandas = [...new Set(REFERENTES.items.map((x) => x.grados))];
  return bandas.find((b) => { const [a, z] = b.split('-').map(Number); return g >= a && g <= (z || a); }) || '';
}
function referentesDe(area, banda, tipo) {
  return REFERENTES.items.filter((x) => (!area || x.area === area) && (!banda || x.grados === banda) && (!tipo || x.tipo === tipo));
}
function textoReferentes(area, banda, tipo = 'estandar') {
  return referentesDe(area, banda, tipo).map((r) => `${r.factor}:${r.enunciado ? '\n• ' + r.enunciado : ''}${r.items.map((i) => '\n  – ' + i).join('')}`).join('\n');
}

// ---------- Selector para insertar ----------
let selectorRef = {};
function botonReferentes(textareaId, areaId, grado, tipo = 'estandar') {
  return `<button type="button" class="btn pequeno" style="padding:1px 7px;margin-left:6px;font-weight:normal" title="Elegir de los referentes oficiales del MEN" onclick="abrirSelectorReferentes('${textareaId}','${areaId || ''}','${grado || ''}','${tipo}')">📘 Referentes</button>`;
}
function abrirSelectorReferentes(textareaId, areaId, grado, tipo) {
  selectorRef = { textareaId, area: areaId ? areaReferenteDe(areaId) : '', banda: grado ? bandaDeGrado(grado) : '', tipo, texto: '', sel: new Set() };
  if (!selectorRef.area) selectorRef.area = areasReferente()[0];
  if (!selectorRef.banda) selectorRef.banda = REFERENTES.items[0]?.grados || '';
  dibujarSelectorReferentes();
}
function listaReferentesHTML(lista, { seleccionable, texto }) {
  const q = normalizar(texto);
  const visible = (t) => !q || normalizar(t).includes(q);
  return lista.map((r) => {
    const enunciadoVisible = r.enunciado && visible(r.enunciado + ' ' + r.factor);
    const items = r.items.map((t, i) => ({ t, i })).filter(({ t }) => visible(t + ' ' + r.factor) || enunciadoVisible);
    if (!enunciadoVisible && !items.length) return '';
    const cb = (clave) => seleccionable ? `<input type="checkbox" ${selectorRef.sel.has(clave) ? 'checked' : ''} onchange="alternarRef('${clave}',this.checked)" style="margin-right:6px;flex:0 0 auto">` : '';
    return `<div class="sesion-caja" style="padding:10px 12px">
      <div style="font-weight:600;color:var(--azul);margin-bottom:4px">${esc(r.factor)} ${seleccionable && r.items.length > 1 ? `<button class="btn pequeno" style="padding:0 6px;font-weight:normal" onclick="marcarGrupoRef('${r.id}')">marcar todo</button>` : ''}</div>
      ${r.enunciado ? `<label style="display:flex;font-weight:600;color:inherit;font-size:13px;margin:4px 0">${cb(r.id + '|e')}${esc(r.enunciado)}</label>` : ''}
      ${items.map(({ t, i }) => `<label style="display:flex;font-weight:normal;color:inherit;font-size:13px;margin:3px 0 3px ${r.enunciado ? 18 : 0}px">${cb(r.id + '|' + i)}${seleccionable ? '' : '• '}${esc(t)}</label>`).join('')}
    </div>`;
  }).join('') || '<p class="ayuda">Nada coincide con la búsqueda.</p>';
}
function filtrosReferentesHTML(s, prefijo) {
  const tipos = [...new Set(REFERENTES.items.map((x) => x.tipo))];
  const bandas = [...new Set(REFERENTES.items.filter((x) => !s.area || x.area === s.area).map((x) => x.grados))];
  return `<div class="filtros" style="margin-bottom:8px">
    <div><label>Área</label><select onchange="${prefijo}.area=this.value;${prefijo === 'selectorRef' ? 'dibujarSelectorReferentes()' : 'render()'}">${areasReferente().map((a) => `<option ${a === s.area ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></div>
    <div><label>Grados</label><select onchange="${prefijo}.banda=this.value;${prefijo === 'selectorRef' ? 'dibujarSelectorReferentes()' : 'render()'}">${bandas.map((b) => `<option value="${b}" ${b === s.banda ? 'selected' : ''}>${b.replace('-', '° a ')}°</option>`).join('')}</select></div>
    ${tipos.length > 1 ? `<div><label>Documento</label><select onchange="${prefijo}.tipo=this.value;${prefijo === 'selectorRef' ? 'dibujarSelectorReferentes()' : 'render()'}"><option value="">Todos</option>${tipos.map((t) => `<option value="${t}" ${t === s.tipo ? 'selected' : ''}>${TIPOS_REFERENTE[t]}</option>`).join('')}</select></div>` : ''}
    <div style="flex:1;min-width:180px"><label>Buscar</label><input id="${prefijo}-q" value="${esc(s.texto)}" placeholder="Palabra clave…" oninput="${prefijo}.texto=this.value;clearTimeout(window._rq);window._rq=setTimeout(()=>{${prefijo === 'selectorRef' ? 'dibujarSelectorReferentes()' : 'render()'};const i=document.getElementById('${prefijo}-q');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"></div>
  </div>`;
}
function dibujarSelectorReferentes() {
  const s = selectorRef;
  const lista = referentesDe(s.area, s.banda, s.tipo || '');
  abrirModal(`<h2>📘 Referentes curriculares del MEN</h2>
    ${filtrosReferentesHTML(s, 'selectorRef')}
    <div style="max-height:52vh;overflow-y:auto">${lista.length ? listaReferentesHTML(lista, { seleccionable: true, texto: s.texto }) : '<p class="ayuda">No hay referentes cargados para esta combinación.</p>'}</div>
    <div class="botones"><span class="ayuda" style="margin-right:auto">${s.sel.size} seleccionado(s)</span>
      <button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="insertarReferentes()">Insertar seleccionados</button></div>`, { ancho: true });
}
function alternarRef(clave, on) { if (on) selectorRef.sel.add(clave); else selectorRef.sel.delete(clave); document.querySelector('#modal .botones .ayuda').textContent = `${selectorRef.sel.size} seleccionado(s)`; }
function marcarGrupoRef(id) {
  const r = REFERENTES.items.find((x) => x.id === id);
  if (r.enunciado) selectorRef.sel.add(id + '|e');
  r.items.forEach((_, i) => selectorRef.sel.add(id + '|' + i));
  dibujarSelectorReferentes();
}
function insertarReferentes() {
  const s = selectorRef;
  if (!s.sel.size) return aviso('Marca al menos un referente', 'error');
  const lineas = [];
  for (const r of REFERENTES.items) {
    const conE = s.sel.has(r.id + '|e');
    const its = r.items.filter((_, i) => s.sel.has(r.id + '|' + i));
    if (!conE && !its.length) continue;
    if (conE) { lineas.push('• ' + r.enunciado); its.forEach((t) => lineas.push('   – ' + t)); }
    else its.forEach((t) => lineas.push('• ' + t));
  }
  const ta = document.getElementById(s.textareaId);
  if (!ta) return cerrarModal();
  const nuevo = lineas.filter((l) => !ta.value.includes(l.replace(/^[•\s–]+/, ''))).join('\n');
  ta.value = ta.value.trim() ? ta.value.replace(/\s+$/, '') + (nuevo ? '\n' + nuevo : '') : nuevo;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  cerrarModal();
  aviso(`${s.sel.size} referente(s) insertado(s)`, 'ok');
}

// ---------- Consulta (pestaña en Planeación curricular) ----------
function vistaReferentes() {
  const s = ui.refs || (ui.refs = { area: areasReferente()[0], banda: '', tipo: '', texto: '' });
  if (!s.banda || !referentesDe(s.area, s.banda).length) s.banda = referentesDe(s.area)[0]?.grados || '';
  const lista = referentesDe(s.area, s.banda, s.tipo);
  const fuentes = [...new Set(lista.map((x) => x.tipo))].map((t) => REFERENTES.fuentes[t]).filter(Boolean);
  return `<p class="ayuda">Consulta los referentes oficiales. Para usarlos, haz clic en <b>📘 Referentes</b> junto a los campos de estándares, DBA o competencias en la malla y en la planeación.</p>
  <div class="tarjeta">${filtrosReferentesHTML(s, 'ui.refs')}
    ${listaReferentesHTML(lista, { seleccionable: false, texto: s.texto })}
    ${fuentes.length ? `<p class="ayuda">Fuente: ${fuentes.map(esc).join('; ')}.</p>` : ''}</div>`;
}
