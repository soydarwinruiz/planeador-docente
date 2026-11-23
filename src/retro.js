// ================= Retroalimentación de trabajos escritos con IA =================

function retroDe(actId, alumnoId) { return (S.retro || {})[actId]?.[alumnoId]; }
// Reduce la foto para enviarla más rápido y barato (máx. 1600 px, JPEG)
function comprimirImagen(archivo) {
  return new Promise((ok, mal) => {
    const fr = new FileReader();
    fr.onerror = mal;
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => mal(new Error('No se pudo abrir la imagen'));
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', 0.85);
        ok({ tipo: 'image/jpeg', datos: url.split(',')[1], url });
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(archivo);
  });
}

function dialogoRetro(actIdInicial, alumnoIdInicial) {
  const c = ui.cal;
  const pl = obtenerPlanilla(c.grupoId, c.areaId, c.periodoId);
  const acts = pl.criterios.flatMap((cr) => cr.actividades.map((a) => ({ ...a, comp: cr.nombre })));
  const al = alumnosDe(c.grupoId);
  const act = acts.find((a) => a.id === actIdInicial) || acts[0];
  window._retro = { actId: act?.id || '', alumnoId: alumnoIdInicial || al[0]?.id || '', rubricaId: act?.rubricaId || S.rubricas.find((r) => tipoInstrumento(r) === 'rubrica')?.id || S.rubricas[0]?.id || '', imagenes: [], resultado: null };
  abrirModal(`<h2>✍️ Retroalimentación con IA</h2>
    <p class="ayuda">Pega el texto del trabajo o adjunta fotos (por ejemplo, de la hoja del cuaderno). La IA propone la valoración con tu instrumento y una retroalimentación para el estudiante; <b>tú revisas y decides</b>. No se envía el nombre del estudiante, pero si está escrito en el trabajo la IA lo verá.</p>
    <div class="rejilla r3">
      <div class="campo"><label>Actividad</label><select id="rt-act" onchange="_retro.actId=this.value;const a=buscarActividad(this.value);if(a?.rubricaId){_retro.rubricaId=a.rubricaId;document.getElementById('rt-rub').value=a.rubricaId}document.getElementById('rt-consigna').value=a?.descripcion||''">${acts.map((a) => `<option value="${a.id}" ${a.id === window._retro.actId ? 'selected' : ''}>${esc(a.comp)} › ${esc(a.nombre)}</option>`).join('')}</select></div>
      <div class="campo"><label>Estudiante</label><select id="rt-al" onchange="_retro.alumnoId=this.value">${al.map((a) => `<option value="${a.id}" ${a.id === window._retro.alumnoId ? 'selected' : ''}>${esc(nombreAlumno(a))}${retroDe(window._retro.actId, a.id) ? ' ✔' : ''}</option>`).join('')}</select></div>
      <div class="campo"><label>Instrumento de evaluación</label><select id="rt-rub" onchange="_retro.rubricaId=this.value">${S.rubricas.map((r) => `<option value="${r.id}" ${r.id === window._retro.rubricaId ? 'selected' : ''}>${esc(TIPOS_INSTRUMENTO[tipoInstrumento(r)].nombre)}: ${esc(r.nombre)}</option>`).join('')}</select></div>
    </div>
    <div class="campo"><label>Consigna o pregunta del trabajo</label><textarea id="rt-consigna" rows="2" placeholder="Ej.: Escribe un cuento corto con inicio, nudo y desenlace sobre…">${esc(act?.descripcion || '')}</textarea></div>
    <div class="rejilla r2">
      <div class="campo"><label>Texto del estudiante</label><textarea id="rt-texto" rows="7" placeholder="Pega aquí el trabajo escrito…"></textarea></div>
      <div class="campo"><label>…o fotos del trabajo</label><label class="btn" style="margin:0;display:inline-block">📷 Adjuntar fotos<input type="file" accept="image/*" multiple hidden onchange="adjuntarFotosRetro(this.files)"></label>
        <div id="rt-fotos" class="fila" style="margin-top:8px"></div><p class="ayuda">Requiere un modelo con visión (Claude, GPT o Gemini actuales lo tienen).</p></div>
    </div>
    <div id="rt-error"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn ia" id="rt-btn" onclick="evaluarRetro()">✨ Evaluar con IA</button></div>
    <div id="rt-resultado"></div>`, { ancho: true });
  document.getElementById('modal').classList.add('muy-ancho');
}
async function adjuntarFotosRetro(archivos) {
  for (const f of archivos) { try { window._retro.imagenes.push(await comprimirImagen(f)); } catch (e) { aviso(e.message, 'error'); } }
  pintarFotosRetro();
}
function pintarFotosRetro() {
  document.getElementById('rt-fotos').innerHTML = window._retro.imagenes.map((im, i) => `<span style="position:relative"><img src="${im.url}" style="height:90px;border-radius:6px;border:1px solid var(--borde)"><button class="icono" style="position:absolute;top:0;right:0;background:#fff" onclick="_retro.imagenes.splice(${i},1);pintarFotosRetro()">✕</button></span>`).join('');
}
function textoInstrumento(r) {
  const t = tipoInstrumento(r);
  if (t === 'cotejo') return `Lista de cotejo "${r.nombre}" (para cada indicador: 1 = sí cumple, 0 = no cumple):\n` + r.criterios.map((c, i) => `${i + 1}. ${c.nombre}`).join('\n');
  return `${TIPOS_INSTRUMENTO[t].nombre} "${r.nombre}". Niveles (índice: nombre = valor): ${r.niveles.map((n, i) => `${i}: ${n.nombre} = ${n.valor}`).join('; ')}.\nCriterios:\n` +
    r.criterios.map((c, i) => `${i + 1}. ${c.nombre}${r.descriptores?.[c.id] ? '\n' + r.niveles.map((n, k) => r.descriptores[c.id][k] ? `   - ${n.nombre}: ${r.descriptores[c.id][k]}` : '').filter(Boolean).join('\n') : ''}`).join('\n');
}
async function evaluarRetro() {
  if (sinIA()) return;
  const R = window._retro;
  R.texto = document.getElementById('rt-texto').value.trim();
  R.consigna = document.getElementById('rt-consigna').value.trim();
  if (!R.texto && !R.imagenes.length) return aviso('Pega el texto o adjunta una foto del trabajo', 'error');
  const r = porId(S.rubricas, R.rubricaId);
  if (!r) return aviso('Elige un instrumento de evaluación', 'error');
  const g = porId(S.grupos, ui.cal.grupoId);
  const al = porId(S.alumnos, R.alumnoId);
  const contexto = [`Área: ${nombreArea(ui.cal.areaId)}`, `Grado: ${g ? g.grado + '° (' + nivelDeGrado(g.grado) + ')' : ''}`, `Actividad: ${buscarActividad(R.actId)?.nombre || ''}`,
    R.consigna ? `Consigna: ${R.consigna}` : '', al?.piar ? 'El estudiante tiene PIAR: valora su proceso con los ajustes razonables y destaca sus avances.' : '',
    textoInstrumento(r), R.texto ? `Trabajo del estudiante:\n"""\n${R.texto.slice(0, 15000)}\n"""` : ''].filter(Boolean).join('\n');
  const b = document.getElementById('rt-btn'); b.disabled = true; b.innerHTML = '<span class="cargando"></span> Evaluando…';
  document.getElementById('rt-error').innerHTML = '';
  const res = await api.sugerirIA({ ia: S.config.ia, contexto, tarea: 'retro', imagenes: R.imagenes.map((i) => ({ tipo: i.tipo, datos: i.datos })) });
  if (!document.getElementById('rt-btn')) return;
  b.disabled = false; b.textContent = '✨ Evaluar de nuevo';
  if (!res.ok) { document.getElementById('rt-error').innerHTML = `<div class="alerta error">${esc(res.error)}</div>`; return; }
  const d = res.datos;
  const sel = {};
  r.criterios.forEach((c, i) => {
    const x = (d.criterios || [])[i] || (d.criterios || []).find((y) => normalizar(y.criterio) === normalizar(c.nombre));
    let n = Number(x?.nivel);
    if (tipoInstrumento(r) === 'cotejo') n = n ? 1 : 0;
    else if (!(n >= 0 && n < r.niveles.length)) { const k = r.niveles.findIndex((nv) => normalizar(nv.nombre) === normalizar(String(x?.nivel || ''))); n = k >= 0 ? k : null; }
    sel[c.id] = n;
  });
  R.resultado = { sel, evidencias: r.criterios.map((c, i) => ((d.criterios || [])[i] || {}).evidencia || ''), fortalezas: d.fortalezas || '', mejoras: d.mejoras || '', retro: d.retroalimentacion || '', transcripcion: d.transcripcion || '' };
  pintarResultadoRetro();
}
function pintarResultadoRetro() {
  const R = window._retro, x = R.resultado;
  const r = porId(S.rubricas, R.rubricaId);
  const cotejo = tipoInstrumento(r) === 'cotejo';
  const n = notaDesdeRubrica(r, x.sel);
  const lista = (t) => (Array.isArray(t) ? t.map((v) => '• ' + v).join('\n') : t);
  document.getElementById('rt-resultado').innerHTML = `<div class="tarjeta" style="margin-top:12px">
    ${x.transcripcion ? `<details><summary class="ayuda" style="cursor:pointer">📄 Transcripción de la foto</summary><div style="white-space:pre-wrap;font-size:13px">${esc(x.transcripcion)}</div></details>` : ''}
    <table class="tabla"><thead><tr><th>Criterio</th><th style="width:190px">Valoración</th><th>Evidencia</th></tr></thead><tbody>
      ${r.criterios.map((c, i) => `<tr><td>${esc(c.nombre)}</td><td><select onchange="_retro.resultado.sel['${c.id}']=this.value===''?null:+this.value;pintarResultadoRetro()">
        <option value="">—</option>${(cotejo ? [{ nombre: 'Sí', i: 1 }, { nombre: 'No', i: 0 }] : r.niveles.map((nv, k) => ({ nombre: `${nv.nombre} (${nv.valor})`, i: k }))).map((o) => `<option value="${o.i}" ${x.sel[c.id] === o.i ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('')}</select></td>
        <td class="ayuda">${esc(x.evidencias[i])}</td></tr>`).join('')}</tbody></table>
    <h3>Nota propuesta: <span class="${claseNota(n)}">${fmtNota(n)}</span> ${chipDesempeno(n)}</h3>
    <div class="rejilla r2"><div class="campo"><label>Fortalezas</label><textarea id="rt-fort" rows="3">${esc(lista(x.fortalezas))}</textarea></div><div class="campo"><label>Por mejorar</label><textarea id="rt-mej" rows="3">${esc(lista(x.mejoras))}</textarea></div></div>
    <div class="campo"><label>Retroalimentación para el estudiante</label><textarea id="rt-ret" rows="4">${esc(x.retro)}</textarea></div>
    <div class="fila" style="justify-content:flex-end"><button class="btn" onclick="copiarTexto(document.getElementById('rt-ret').value)">📋 Copiar</button>
      <button class="btn primario" onclick="guardarRetro(false)">💾 Guardar nota y retroalimentación</button><button class="btn primario" onclick="guardarRetro(true)">💾 Guardar y siguiente →</button></div></div>`;
}
function guardarRetro(siguiente) {
  const R = window._retro, x = R.resultado;
  const r = porId(S.rubricas, R.rubricaId);
  const n = notaDesdeRubrica(r, x.sel);
  if (n == null) return aviso('Completa la valoración de todos los criterios', 'error');
  const act = buscarActividad(R.actId);
  (S.notas[R.actId] ||= {})[R.alumnoId] = redondear(n);
  if (act?.rubricaId === r.id) (S.notasRubrica[R.actId] ||= {})[R.alumnoId] = { ...x.sel };
  ((S.retro ||= {})[R.actId] ||= {})[R.alumnoId] = { texto: document.getElementById('rt-ret').value.trim(), fortalezas: document.getElementById('rt-fort').value.trim(), mejoras: document.getElementById('rt-mej').value.trim(), rubricaId: r.id, fecha: hoyISO() };
  guardar();
  aviso(`Guardado: ${nombreAlumno(porId(S.alumnos, R.alumnoId))} · ${fmtNota(n)}`, 'ok');
  if (!siguiente) { cerrarModal(); render(); return; }
  const al = alumnosDe(ui.cal.grupoId);
  const i = al.findIndex((a) => a.id === R.alumnoId);
  const prox = al.slice(i + 1).find((a) => !retroDe(R.actId, a.id)) || al[i + 1];
  if (!prox) { cerrarModal(); render(); return aviso('Llegaste al final de la lista', 'ok'); }
  dialogoRetro(R.actId, prox.id);
}
function exportarRetroalimentaciones() {
  const c = ui.cal;
  const pl = buscarPlanilla(c.grupoId, c.areaId, c.periodoId);
  const acts = pl ? pl.criterios.flatMap((cr) => cr.actividades).filter((a) => S.retro?.[a.id] && Object.keys(S.retro[a.id]).length) : [];
  if (!acts.length) return aviso('Aún no hay retroalimentaciones guardadas en este periodo');
  const filas = [];
  for (const a of acts) for (const al of alumnosDe(c.grupoId)) { const x = retroDe(a.id, al.id); if (x) filas.push([a.nombre, nombreAlumno(al), fmtNota(nota(a.id, al.id)), x.fortalezas, x.mejoras, x.texto]); }
  api.exportarWordCurricular('tabla', `Retroalimentaciones ${nombreGrupoId(c.grupoId)} ${nombreArea(c.areaId)}`, {
    config: S.config, titulo: 'Retroalimentación de trabajos', subtitulo: `${nombreArea(c.areaId)} · ${nombreGrupoId(c.grupoId)} · ${nombrePeriodo(c.periodoId)}`, horizontal: true,
    columnas: [{ t: 'Actividad', ancho: 12 }, { t: 'Estudiante', ancho: 14 }, { t: 'Nota', ancho: 6 }, { t: 'Fortalezas', ancho: 20 }, { t: 'Por mejorar', ancho: 20 }, { t: 'Retroalimentación', ancho: 28 }], filas,
  }).then((r) => { if (r.ok) aviso('Documento de Word creado', 'ok'); });
}
