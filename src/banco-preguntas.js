// ================= Banco de preguntas =================
// Reúne las preguntas de todas las pruebas y talleres (también las de paquetes de otros docentes), sin repetir,
// para armar pruebas nuevas o agregarlas a una existente. No duplica datos: el banco se calcula de las pruebas.

function bancoPreguntas() {
  const vistas = new Set(), r = [];
  for (const p of S.pruebas || []) for (const q of p.preguntas || []) {
    const k = normalizar((q.contexto || '') + '|' + (q.enunciado || '')).replace(/\s+/g, ' ').trim();
    if (!q.enunciado || vistas.has(k)) continue;
    vistas.add(k);
    r.push({ q, p, areaId: p.areaId, grado: gradoPrueba(p) });
  }
  return r;
}
RENDERS.bancoPreguntas = ({ destino } = {}) => {
  const f = (ui.bq ||= { texto: '', areaId: '', grado: '', tipo: '', sel: {} });
  f.sel ||= {};
  if (destino !== undefined) f.destino = destino;
  const todas = bancoPreguntas();
  const t = normalizar(f.texto);
  const lista = todas.filter((x) => (!f.areaId || x.areaId === f.areaId) && (!f.grado || String(x.grado) === String(f.grado)) && (!f.tipo || (f.tipo === 'abierta' ? x.q.tipo === 'abierta' : x.q.tipo !== 'abierta'))
    && (!t || normalizar([x.q.contexto, x.q.enunciado, x.q.competencia, (x.q.opciones || []).join(' '), x.p.titulo].join(' ')).includes(t)));
  const nSel = Object.values(f.sel).filter(Boolean).length;
  const destinoP = f.destino ? porId(S.pruebas, f.destino) : null;
  return `<div class="cabecera"><div><h1>📚 Banco de preguntas</h1><p class="sub">${todas.length} preguntas de tus pruebas y talleres. Elige las que quieras para ${destinoP ? `agregarlas a "<b>${esc(destinoP.titulo || 'Sin título')}</b>"` : 'armar una prueba nueva'}.</p></div>
    <div class="acciones"><button class="btn" onclick="ir(${destinoP ? `'pruebaEditor',{id:'${destinoP.id}'}` : "'pruebas'"})">← Volver</button>
      <button class="btn primario" onclick="usarSeleccionBanco()" ${nSel ? '' : 'disabled'}>${destinoP ? `＋ Agregar ${nSel} a la prueba` : `＋ Crear prueba con ${nSel}`}</button></div></div>
  <div class="filtros tarjeta">
    <div style="flex:1;min-width:200px"><label>Buscar</label><input value="${esc(f.texto)}" placeholder="Tema, palabra, competencia…" oninput="ui.bq.texto=this.value;clearTimeout(window._tbp);window._tbp=setTimeout(()=>{render();reenfocar('.filtros input')},300)"></div>
    <div><label>Área</label><select onchange="ui.bq.areaId=this.value;render()">${opcionesAreas(f.areaId, 'Todas')}</select></div>
    <div><label>Grado</label><select onchange="ui.bq.grado=this.value;render()"><option value="">Todos</option>${GRADOS.map((g) => `<option value="${g}" ${String(f.grado) === String(g) ? 'selected' : ''}>${g}°</option>`).join('')}</select></div>
    <div><label>Tipo</label><select onchange="ui.bq.tipo=this.value;render()"><option value="">Todas</option><option value="multiple" ${f.tipo === 'multiple' ? 'selected' : ''}>Selección múltiple</option><option value="abierta" ${f.tipo === 'abierta' ? 'selected' : ''}>Abiertas</option></select></div>
  </div>
  ${lista.length ? lista.slice(0, 300).map((x) => `<label class="tarjeta bp-preg ${f.sel[x.q.id] ? 'sel' : ''}"><input type="checkbox" ${f.sel[x.q.id] ? 'checked' : ''} onchange="ui.bq.sel['${x.q.id}']=this.checked;render()">
      <div><div class="ayuda">${esc(nombreArea(x.areaId))}${x.grado ? ' · ' + esc(x.grado) + '°' : ''} · ${x.q.tipo === 'abierta' ? 'Abierta' : 'Selección múltiple'}${x.q.competencia ? ' · ' + esc(x.q.competencia) : ''} · de "${esc(x.p.titulo || 'Sin título')}"</div>
      ${x.q.contexto ? `<div class="bp-contexto">${esc(x.q.contexto)}</div>` : ''}<b>${esc(x.q.enunciado)}</b>
      ${x.q.tipo !== 'abierta' ? `<ol type="A">${(x.q.opciones || []).map((o, i) => `<li ${String.fromCharCode(65 + i) === x.q.correcta ? 'style="font-weight:600;color:var(--verde)"' : ''}>${esc(o)}</li>`).join('')}</ol>` : ''}</div></label>`).join('')
    : '<div class="tarjeta vacio">No hay preguntas con estos filtros. Las preguntas de cada prueba que crees (a mano o con IA) aparecen aquí.</div>'}
  ${lista.length > 300 ? `<p class="ayuda">Se muestran 300 de ${lista.length}. Usa los filtros.</p>` : ''}`;
};
function abrirBancoPreguntas(destino = '') { ui.bq = { texto: '', areaId: '', grado: '', tipo: '', sel: {} }; ir('bancoPreguntas', { destino }); }
function usarSeleccionBanco() {
  const f = ui.bq;
  const elegidas = bancoPreguntas().filter((x) => f.sel[x.q.id]);
  if (!elegidas.length) return;
  const copias = elegidas.map((x) => ({ ...structuredClone(x.q), id: uid() }));
  let p = f.destino ? porId(S.pruebas, f.destino) : null;
  if (!p) {
    const primera = elegidas[0];
    p = { id: uid(), tipo: copias.some((q) => q.tipo === 'abierta') ? 'taller' : 'prueba', titulo: 'Prueba desde el banco', grupoId: '', grado: +primera.grado || 6, areaId: primera.areaId || '', periodoId: periodoDeFecha(hoyISO())?.id || '',
      instrucciones: 'Lee cada pregunta y marca una sola opción.', tiempo: 60, preguntas: [], respuestas: {}, abiertas: {}, creada: new Date().toISOString() };
    S.pruebas.push(p);
  }
  p.preguntas.push(...copias);
  tocarPrueba(p);
  ui.bq.sel = {};
  aviso(`${copias.length} pregunta(s) agregadas`, 'ok');
  ir('pruebaEditor', { id: p.id });
}
