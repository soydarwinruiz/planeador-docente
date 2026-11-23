// ================= Importar notas desde Excel, Google Forms o Classroom =================

// Convierte un puntaje (p sobre máx) a la escala institucional: proporcional, sin bajar de la mínima
function convertirPuntaje(p, max) {
  const min = +S.config.escalaMin, top = +S.config.escalaMax;
  if (!(max > 0)) return null;
  const v = Math.max(min, Math.min(top, (p / max) * top));
  return redondear(v);
}
// Lee "4,5", "4.5", "8 / 10", "80%"; devuelve { p, max } o null
function leerPuntaje(t) {
  const s = String(t ?? '').trim().replace(/\s+/g, ' ');
  if (!s) return null;
  let m = /^(-?\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/.exec(s);
  if (m) return { p: +m[1].replace(',', '.'), max: +m[2].replace(',', '.') };
  m = /^(-?\d+(?:[.,]\d+)?)\s*%$/.exec(s);
  if (m) return { p: +m[1].replace(',', '.'), max: 100 };
  m = /^-?\d+(?:[.,]\d+)?$/.exec(s);
  if (m) return { p: +s.replace(',', '.'), max: null };
  return null;
}
const tokens = (t) => normalizar(t).replace(/[^a-zñ0-9 ]/g, ' ').split(/\s+/).filter((x) => x.length > 1);

function analizarTabla(filas) {
  const ancho = Math.max(...filas.map((f) => f.length));
  // encabezado: primera fila con 2+ celdas de texto no numérico
  let h = filas.findIndex((f) => f.filter((x) => x && !leerPuntaje(x)).length >= 2);
  if (h < 0) h = 0;
  const cab = Array.from({ length: ancho }, (_, i) => filas[h][i] || `Columna ${i + 1}`);
  let datos = filas.slice(h + 1);
  // filas especiales de Classroom ("Puntos", "Fecha de entrega", "Promedio de la clase")
  let maximos = {};
  datos = datos.filter((f) => {
    const t = normalizar(f.slice(0, 3).join(' '));
    if (/\b(puntos|points|puntaje maximo|valor)\b/.test(t)) { f.forEach((x, i) => { const v = leerPuntaje(x); if (v && v.p > 0) maximos[i] = v.p; }); return false; }
    return !/fecha de entrega|due date|promedio de la clase|class average|media de la clase/.test(t);
  });
  const col = (re) => cab.findIndex((c) => re.test(normalizar(c)));
  const guess = {
    apellidos: col(/apellido|last name|surname/),
    nombre: col(/^(nombre|nombres|nombre completo|name|full name|first name|estudiante|alumno)/),
    documento: col(/documento|identificaci|cedula|tarjeta|^doc|^id$/),
    correo: col(/correo|e-?mail/),
  };
  if (guess.nombre < 0) guess.nombre = col(/nombre|name|estudiante|alumno/);
  // columnas con notas: mayoría de valores numéricos
  const numericas = [];
  for (let i = 0; i < ancho; i++) {
    if (Object.values(guess).includes(i)) continue;
    const vals = datos.map((f) => f[i]).filter((x) => x !== '' && x != null);
    if (!vals.length) continue;
    const nums = vals.map(leerPuntaje).filter(Boolean);
    if (nums.length / vals.length < 0.6 || /marca temporal|timestamp|telefono|celular|codigo|grado|grupo|curso|edad/.test(normalizar(cab[i])) || /^(n|no|nro|num|numero|item|orden|#)\W*$/.test(normalizar(cab[i]).trim())) continue;
    // columna de numeración 1, 2, 3…
    if (nums.length > 2 && nums.every((n, k) => n.p === k + 1)) continue;
    let max = maximos[i] || (nums.find((n) => n.max)?.max) || null;
    const mayor = Math.max(...nums.map((n) => n.p));
    if (!max) max = mayor <= +S.config.escalaMax ? +S.config.escalaMax : mayor <= 10 ? 10 : 100;
    numericas.push({ i, nombre: cab[i], max });
  }
  return { cab, datos, guess, numericas };
}

// Empareja una fila con un estudiante del grupo
function emparejarFila(f, imp, alumnos) {
  const { colDoc, colNombre, colApellidos, colCorreo } = imp;
  if (colDoc >= 0 && f[colDoc]) {
    const d = String(f[colDoc]).replace(/\D/g, '');
    const a = d && alumnos.find((x) => String(x.documento || '').replace(/\D/g, '') === d);
    if (a) return a;
  }
  if (colCorreo >= 0 && f[colCorreo]) {
    const a = alumnos.find((x) => x.correo && normalizar(x.correo) === normalizar(f[colCorreo]));
    if (a) return a;
  }
  const texto = [colApellidos >= 0 ? f[colApellidos] : '', colNombre >= 0 ? f[colNombre] : ''].join(' ');
  const tf = tokens(texto);
  if (!tf.length) return null;
  let mejor = null, puntos = 0, empate = false;
  for (const a of alumnos) {
    const ta = new Set(tokens(`${a.apellidos} ${a.nombres}`));
    const n = tf.filter((t) => ta.has(t)).length;
    if (n > puntos) { mejor = a; puntos = n; empate = false; } else if (n === puntos && n) empate = true;
  }
  return mejor && !empate && puntos >= Math.min(2, tf.length) ? mejor : null;
}

async function importarNotas() {
  const r = await api.abrirTabla();
  if (!r.ok) { if (r.error) aviso(r.error, 'error'); return; }
  const c = ui.cal;
  const pl = obtenerPlanilla(c.grupoId, c.areaId, c.periodoId);
  const an = analizarTabla(r.filas);
  const acts = pl.criterios.flatMap((cr) => cr.actividades.map((a) => ({ ...a, comp: cr.nombre })));
  const usados = new Set();
  const destinoSugerido = (nombreCol) => {
    const n = normalizar(nombreCol);
    let a = acts.find((x) => !usados.has(x.id) && (normalizar(x.nombre) === n || n.includes(normalizar(x.nombre)) || normalizar(x.nombre).includes(n)));
    if (!a) a = acts.find((x) => !usados.has(x.id) && !alumnosDe(c.grupoId).some((al) => nota(x.id, al.id) != null));
    if (a) usados.add(a.id);
    return a ? a.id : '';
  };
  window._imp = {
    archivo: r.nombre, ...an, acts,
    colNombre: an.guess.nombre, colApellidos: an.guess.apellidos, colDoc: an.guess.documento, colCorreo: an.guess.correo,
    columnas: an.numericas.map((x) => ({ ...x, activa: true, destino: destinoSugerido(x.nombre) })),
    manual: {}, sobrescribir: false,
  };
  abrirModal('<div id="imp"></div>', { ancho: true });
  pintarImportacion();
}
function pintarImportacion() {
  const imp = window._imp; const c = ui.cal;
  const alumnos = alumnosDe(c.grupoId);
  const opcCols = (sel, vacio = '(ninguna)') => `<option value="-1">${vacio}</option>` + imp.cab.map((t, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const opcActs = (sel) => `<option value="">— No importar —</option>` + imp.acts.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.comp)} › ${esc(a.nombre)}</option>`).join('');
  const filas = imp.datos.map((f, idx) => ({ f, idx, a: imp.manual[idx] !== undefined ? porId(S.alumnos, imp.manual[idx]) : emparejarFila(f, imp, alumnos) }));
  const textoFila = (f) => [imp.colApellidos >= 0 ? f[imp.colApellidos] : '', imp.colNombre >= 0 ? f[imp.colNombre] : '', imp.colDoc >= 0 ? f[imp.colDoc] : '', imp.colCorreo >= 0 ? f[imp.colCorreo] : ''].filter(Boolean).join(' · ') || f.slice(0, 3).join(' · ');
  const sinPareja = filas.filter((x) => !x.a && x.f.some(Boolean));
  const activas = imp.columnas.filter((x) => x.activa && x.destino);
  document.getElementById('imp').innerHTML = `<h2>📥 Importar notas</h2>
    <p class="ayuda">Archivo: <b>${esc(imp.archivo)}</b> · ${imp.datos.length} fila(s). Sirve con planillas de Excel, respuestas de <b>Google Forms</b> (descargadas como .csv o .xlsx) y calificaciones de <b>Classroom</b>.</p>
    <h3 style="margin-bottom:4px">1. ¿Dónde está el estudiante?</h3>
    <div class="rejilla r4">
      <div class="campo"><label>Nombre (o nombre completo)</label><select onchange="_imp.colNombre=+this.value;_imp.manual={};pintarImportacion()">${opcCols(imp.colNombre)}</select></div>
      <div class="campo"><label>Apellidos</label><select onchange="_imp.colApellidos=+this.value;_imp.manual={};pintarImportacion()">${opcCols(imp.colApellidos)}</select></div>
      <div class="campo"><label>Documento</label><select onchange="_imp.colDoc=+this.value;_imp.manual={};pintarImportacion()">${opcCols(imp.colDoc)}</select></div>
      <div class="campo"><label>Correo</label><select onchange="_imp.colCorreo=+this.value;_imp.manual={};pintarImportacion()">${opcCols(imp.colCorreo)}</select></div>
    </div>
    <h3 style="margin-bottom:4px">2. ¿Qué columna va a qué actividad?</h3>
    ${imp.columnas.length ? `<table class="tabla"><thead><tr><th style="width:30px"></th><th>Columna del archivo</th><th style="width:130px">Puntaje máximo</th><th>Actividad de la planilla</th></tr></thead><tbody>
      ${imp.columnas.map((x, k) => `<tr><td><input type="checkbox" ${x.activa ? 'checked' : ''} onchange="_imp.columnas[${k}].activa=this.checked;pintarImportacion()"></td><td>${esc(x.nombre)}</td>
        <td><input type="number" min="1" step="any" value="${x.max}" onchange="_imp.columnas[${k}].max=+this.value||${S.config.escalaMax};pintarImportacion()"></td>
        <td><select onchange="_imp.columnas[${k}].destino=this.value;pintarImportacion()">${opcActs(x.destino)}</select></td></tr>`).join('')}</tbody></table>
      <p class="ayuda">Los puntajes se convierten a la escala ${S.config.escalaMin}–${S.config.escalaMax} en forma proporcional (puntaje ÷ máximo × ${S.config.escalaMax}, sin bajar de ${S.config.escalaMin}). Si el máximo es ${S.config.escalaMax}, la nota pasa igual.</p>`
      : '<div class="alerta">No se encontraron columnas con notas o puntajes en el archivo.</div>'}
    <h3 style="margin-bottom:4px">3. Revisión</h3>
    <p><b>${filas.filter((x) => x.a).length}</b> fila(s) emparejadas con estudiantes de ${esc(nombreGrupoId(c.grupoId))}${sinPareja.length ? ` · <b style="color:var(--rojo)">${sinPareja.length} sin emparejar</b> (elige el estudiante o déjalas sin importar)` : ''}.</p>
    ${sinPareja.length ? `<table class="tabla"><tbody>${sinPareja.map((x) => `<tr><td>${esc(textoFila(x.f))}</td><td style="width:280px"><select onchange="_imp.manual[${x.idx}]=this.value||null;pintarImportacion()"><option value="">— No importar —</option>${alumnos.map((a) => `<option value="${a.id}">${esc(nombreAlumno(a))}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table>` : ''}
    ${activas.length && filas.some((x) => x.a) ? `<details style="margin-top:8px"><summary class="ayuda" style="cursor:pointer">Vista previa de las notas</summary><table class="tabla"><thead><tr><th>Estudiante</th>${activas.map((x) => `<th class="num">${esc(imp.acts.find((a) => a.id === x.destino)?.nombre || '')}</th>`).join('')}</tr></thead><tbody>
      ${filas.filter((x) => x.a).map((x) => `<tr style="${filas.some((y) => y.a === x.a && y.idx > x.idx) ? 'opacity:.45' : ''}"><td>${esc(nombreAlumno(x.a))}${filas.some((y) => y.a === x.a && y.idx > x.idx) ? ' <span class="ayuda">(envío repetido: se usa el último)</span>' : ''}</td>${activas.map((col) => { const v = leerPuntaje(x.f[col.i]); const n = v ? convertirPuntaje(v.p, v.max || col.max) : null; const prev = nota(col.destino, x.a.id); return `<td class="num ${claseNota(n)}">${n == null ? '—' : fmtNota(n)}${prev != null && prev !== n ? ` <span class="ayuda" title="Nota actual">(${fmtNota(prev)})</span>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></details>` : ''}
    <div class="campo" style="margin-top:10px"><label style="font-weight:normal;color:inherit"><input type="checkbox" ${imp.sobrescribir ? 'checked' : ''} onchange="_imp.sobrescribir=this.checked"> Reemplazar las notas que ya están en la planilla (si no, solo se llenan las vacías)</label></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" ${activas.length ? '' : 'disabled'} onclick="ejecutarImportacionNotas()">Importar notas</button></div>`;
}
function ejecutarImportacionNotas() {
  const imp = window._imp; const c = ui.cal;
  const alumnos = alumnosDe(c.grupoId);
  const activas = imp.columnas.filter((x) => x.activa && x.destino);
  let n = 0, omitidas = 0;
  const escritas = new Set();
  imp.datos.forEach((f, idx) => {
    const a = imp.manual[idx] !== undefined ? porId(S.alumnos, imp.manual[idx]) : emparejarFila(f, imp, alumnos);
    if (!a) return;
    for (const col of activas) {
      const v = leerPuntaje(f[col.i]);
      if (!v) continue;
      const nn = convertirPuntaje(v.p, v.max || col.max);
      const notas = (S.notas[col.destino] ||= {});
      const k = col.destino + '|' + a.id;
      if (!escritas.has(k) && notas[a.id] != null && notas[a.id] !== '' && !imp.sobrescribir) { omitidas++; continue; }
      if (!escritas.has(k)) n++;
      notas[a.id] = nn; escritas.add(k); // si un estudiante aparece varias veces (varios envíos del formulario) queda el último
    }
  });
  guardar(); cerrarModal(); render();
  aviso(`Se importaron ${n} nota(s)${omitidas ? `; ${omitidas} se dejaron como estaban porque ya tenían nota` : ''}.`, 'ok');
}
