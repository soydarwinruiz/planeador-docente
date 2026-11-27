// ================= Configuración y respaldos =================

function campoConfig(k, t, tipo = 'text', extra = '') {
  return `<div class="campo"><label>${esc(t)}</label><input type="${tipo}" value="${esc(S.config[k] ?? '')}" ${extra} onchange="${tipo === 'number' ? `cambiarNumeroConfig('${k}',this)` : `S.config['${k}']=this.value;guardar();renderNav()`}"></div>`;
}

// Números de la configuración con validación (año lectivo y escala de valoración)
function cambiarNumeroConfig(k, input) {
  const v = +String(input.value).replace(',', '.');
  const c = S.config;
  const prueba = { escalaMin: +c.escalaMin, escalaMax: +c.escalaMax, notaAprobacion: +c.notaAprobacion, [k]: v };
  let error = '';
  if (input.value === '' || isNaN(v)) error = 'Escribe un número.';
  else if (k === 'anio' && (!Number.isInteger(v) || v < 2000 || v > 2100)) error = 'El año lectivo debe ser un año completo, por ejemplo 2027.';
  else if (['escalaMin', 'escalaMax', 'notaAprobacion'].includes(k) && !(prueba.escalaMin < prueba.escalaMax && prueba.notaAprobacion >= prueba.escalaMin && prueba.notaAprobacion <= prueba.escalaMax))
    error = 'La nota mínima debe ser menor que la máxima, y la aprobatoria debe estar entre las dos.';
  if (error) { aviso(error, 'error'); input.value = c[k]; return; }
  c[k] = v;
  guardar(); renderNav();
}
// Avisos sobre los periodos: fechas al revés o periodos que se cruzan
function problemasPeriodos() {
  const r = [];
  const ps = S.config.periodos;
  ps.forEach((p) => { if (p.inicio && p.fin && p.inicio > p.fin) r.push(`"${p.nombre}" termina antes de empezar.`); });
  const orden = ps.filter((p) => p.inicio && p.fin).sort((a, b) => a.inicio.localeCompare(b.inicio));
  for (let i = 1; i < orden.length; i++) if (orden[i].inicio <= orden[i - 1].fin) r.push(`"${orden[i - 1].nombre}" y "${orden[i].nombre}" se cruzan en las fechas.`);
  return r;
}

RENDERS.configuracion = () => {
  const c = S.config;
  const sumaPer = c.periodos.reduce((s, p) => s + (+p.peso || 0), 0);
  return `
  <div class="cabecera"><div><h1>Configuración</h1><p class="sub">Abre solo la sección que necesitas. El programa recuerda cuáles dejaste abiertas.</p></div>
    <div class="acciones"><button class="btn" onclick="abrirAcercaDe()">ℹ️ Acerca de Tiza</button><button class="btn" onclick="abrirSeccionesConfig(true)">Abrir todo</button><button class="btn" onclick="abrirSeccionesConfig(false)">Cerrar todo</button>
      <button class="btn primario" onclick="abrirAsistente()">🧭 Asistente de configuración inicial</button></div></div>
  <div class="tarjeta" style="padding:10px 14px"><input id="buscar-config" placeholder="🔎 Buscar en la configuración (membrete, clave, recuperación, color, celular…)" oninput="filtrarConfig(this.value)"></div>

  ${seccionConfig('institucion', '🏫', 'Institución y docente', 'Datos institucionales y hoja membrete de los documentos', `
  <div class="tarjeta"><h2>Datos institucionales</h2>
    <div class="rejilla r3">
      ${campoConfig('institucion', 'Institución educativa')}
      ${campoConfig('sede', 'Sede')}
      ${campoConfig('municipio', 'Municipio / ciudad')}
      ${campoConfig('docente', 'Nombre del docente')}
      ${campoConfig('coordinador', 'Coordinador(a) académico(a)')}
      ${campoConfig('anio', 'Año lectivo', 'number', 'min="2020" max="2100"')}
    </div>
  </div>

  ${tarjetaMembrete()}`)}

  ${seccionConfig('evaluacion', '📊', 'Evaluación (SIEE)', 'Escala, desempeños, recuperaciones, periodos y componentes de evaluación', `
  <div class="tarjeta"><h2>Escala de valoración (SIEE)</h2>
    <div class="rejilla r4">
      ${campoConfig('escalaMin', 'Nota mínima', 'number', 'step="0.1"')}
      ${campoConfig('escalaMax', 'Nota máxima', 'number', 'step="0.1"')}
      ${campoConfig('notaAprobacion', 'Nota mínima aprobatoria', 'number', 'step="0.1"')}
      <div class="campo"><label>Decimales</label><select onchange="S.config.decimales=+this.value;guardar()">${[0, 1, 2].map((n) => `<option ${c.decimales === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    </div>
    <div class="campo"><label><input type="checkbox" ${c.faltanteComoMinima ? 'checked' : ''} onchange="S.config.faltanteComoMinima=this.checked;guardar()"> Las notas faltantes cuentan como la nota mínima al calcular promedios</label></div>
    <h3>Equivalencia con la escala nacional (Decreto 1290)</h3>
    <table class="tabla" style="max-width:520px"><thead><tr><th>Desempeño</th><th>Desde</th><th>Hasta</th></tr></thead><tbody>
    ${c.desempenos.map((d, i) => `<tr><td><span class="chip ${esc(d.nombre)}">${esc(d.nombre)}</span></td>
      <td><input type="number" step="0.1" value="${d.desde}" onchange="S.config.desempenos[${i}].desde=+this.value;guardar()"></td>
      <td><input type="number" step="0.1" value="${d.hasta}" onchange="S.config.desempenos[${i}].hasta=+this.value;guardar()"></td></tr>`).join('')}
    </tbody></table>
    ${tarjetaRecuperaciones()}
  </div>

  <div class="tarjeta"><div class="cabecera"><h2 style="margin:0">Periodos académicos</h2><button class="btn pequeno primario" onclick="agregarPeriodo()">＋ Periodo</button></div>
    ${sumaPer !== 100 ? `<div class="alerta">Los porcentajes de los periodos suman <b>${sumaPer}%</b>. Deberían sumar 100%.</div>` : ''}
    ${problemasPeriodos().map((t) => `<div class="alerta">⚠️ ${esc(t)}</div>`).join('')}
    <table class="tabla"><thead><tr><th>Nombre</th><th>Inicio</th><th>Fin</th><th style="width:120px">Porcentaje</th><th></th></tr></thead><tbody>
    ${c.periodos.map((p, i) => `<tr>
      <td><input value="${esc(p.nombre)}" onchange="S.config.periodos[${i}].nombre=this.value;guardar()"></td>
      <td><input type="date" value="${esc(p.inicio)}" onchange="S.config.periodos[${i}].inicio=this.value;guardar()"></td>
      <td><input type="date" value="${esc(p.fin)}" onchange="S.config.periodos[${i}].fin=this.value;guardar()"></td>
      <td><div class="fila" style="flex-wrap:nowrap"><input type="number" min="0" max="100" value="${esc(p.peso)}" style="width:70px" onchange="S.config.periodos[${i}].peso=+this.value;guardar();render()"> %</div></td>
      <td><button class="icono" title="Eliminar" onclick="eliminarPeriodo(${i})">🗑️</button></td></tr>`).join('')}
    </tbody></table>
  </div>

  ${tarjetaComponentes()}`)}

  ${seccionConfig('apariencia', '🎨', 'Apariencia y menú', 'Tema, colores, tipo y tamaño de letra, corrector y menú lateral', `${tarjetaApariencia()}${tarjetaMenu()}`)}

  ${seccionConfig('frases', '⚡', 'Frases rápidas', 'Atajos de texto para escribir más rápido en cualquier campo', tarjetaFrases())}

  ${seccionConfig('ia', '✨', 'Inteligencia artificial y dictado', 'Proveedor, clave y modelo de IA; dictado por voz', `${tarjetaIA()}${tarjetaVoz()}`)}

  ${seccionConfig('seguridad', '🔒', 'Seguridad, datos y celular', 'Clave de acceso, base de datos cifrada y celular del docente', `${tarjetaAcceso()}${tarjetaAlmacen()}${tarjetaCelular()}`)}

  ${seccionConfig('respaldos', '💾', 'Respaldos, actualizaciones y compartir', 'Respaldos, carpeta en la nube, actualizaciones y paquetes para otros docentes', `
  <div class="tarjeta"><h2>💾 Respaldo de datos</h2>
    <p class="ayuda">Todos tus datos se guardan en este equipo. Haz respaldos frecuentes en una memoria USB o en una carpeta sincronizada (OneDrive, Google Drive).
    Además, la aplicación crea un respaldo automático al abrirse y cada hora si hubo cambios (15 recientes y uno por día durante 30 días).</p>
    <div class="fila">
      <button class="btn primario" onclick="crearRespaldo()">💾 Crear respaldo…</button>
      <button class="btn" onclick="restaurarRespaldo()">📂 Restaurar desde archivo…</button>
      <button class="btn" onclick="verRespaldosAuto()">🕘 Respaldos automáticos</button>
      <button class="btn" onclick="api.abrirCarpetaDatos()">Abrir carpeta de datos</button>
    </div>
    <p class="ayuda" id="ubicacion-datos"></p>
  </div>

  ${tarjetaNube()}${tarjetaActualizaciones()}${tarjetaCompartir()}`)}

  ${seccionConfig('anio', '🗓️', 'Año lectivo', 'Iniciar un nuevo año y elegir qué conservar', `
  <div class="tarjeta"><h2>Nuevo año lectivo</h2>
    <p class="ayuda">Prepara la aplicación para un nuevo año. <b>Tú eliges qué conservar</b>: planeaciones, planeación curricular, cronograma, plantillas, pruebas, fichas, tableros, grupos (y si suben de grado), estudiantes, PIAR, programación evaluativa, horario, eventos, pendientes y portafolio. Asistencia, notas, observaciones y demás datos del año se vacían.
    <b>Antes, el año que termina se archiva completo</b> y queda para consultar en <a href="#" onclick="ir('anios');return false">Años anteriores</a>.</p>
    <button class="btn peligro" onclick="nuevoAnio()">Iniciar nuevo año lectivo…</button>
  </div>`)}`;
};
// Secciones desplegables de la configuración
function seccionConfig(k, ico, titulo, resumen, html) {
  const abierta = !!(S.config.apariencia?.secciones || {})[k];
  return `<details class="seccion-config" data-sec="${k}" ${abierta ? 'open' : ''}>
    <summary onclick="recordarSeccion('${k}', !this.parentNode.open)"><span class="sec-ico">${ico}</span><span><b>${esc(titulo)}</b><br><span class="ayuda">${esc(resumen)}</span></span><span class="sec-flecha">›</span></summary>
    <div class="sec-cuerpo">${html}</div></details>`;
}
function recordarSeccion(k, abierta) {
  const ap = (S.config.apariencia ||= {});
  ap.secciones = { ...(ap.secciones || {}), [k]: abierta };
  guardar();
}
function abrirSeccionesConfig(abrir) {
  document.querySelectorAll('.seccion-config').forEach((d) => { d.open = abrir; d.hidden = false; });
  const ap = (S.config.apariencia ||= {});
  ap.secciones = Object.fromEntries([...document.querySelectorAll('.seccion-config')].map((d) => [d.dataset.sec, abrir]));
  guardar();
}
// Busca en el texto de cada sección (incluidas las cerradas) y deja abiertas solo las que coinciden
function filtrarConfig(q) {
  const t = normalizar(q.trim());
  const abiertas = S.config.apariencia?.secciones || {};
  document.querySelectorAll('.seccion-config').forEach((d) => {
    if (!t) { d.hidden = false; d.open = !!abiertas[d.dataset.sec]; return; }
    const si = normalizar(d.textContent + ' ' + [...d.querySelectorAll('input,textarea')].map((x) => x.placeholder).join(' ')).includes(t);
    d.hidden = !si; d.open = si;
  });
}
// Abre la configuración en una sección (y opcionalmente lleva hasta un elemento)
function irAConfig(seccion, idElemento) {
  const ap = (S.config.apariencia ||= {});
  ap.secciones = { ...(ap.secciones || {}), [seccion]: true };
  ir('configuracion');
  setTimeout(() => (document.getElementById(idElemento) || document.querySelector(`[data-sec="${seccion}"]`))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}
RENDERS.configuracion_despues = async () => {
  const el = document.getElementById('ubicacion-datos');
  if (el) el.textContent = 'Ubicación de los datos: ' + (await api.ubicacionDatos());
};

function agregarPeriodo() {
  const ult = S.config.periodos[S.config.periodos.length - 1];
  const inicio = ult?.fin ? sumarDias(ult.fin, 3) : hoyISO();
  S.config.periodos.push({ id: uid(), nombre: `Periodo ${S.config.periodos.length + 1}`, inicio, fin: sumarDias(inicio, 70), peso: 0 });
  guardar(); render();
}
async function eliminarPeriodo(i) {
  const p = S.config.periodos[i];
  const usos = S.planillas.filter((x) => x.periodoId === p.id).length;
  if (!(await confirmar(`¿Eliminar "${p.nombre}"?${usos ? ` Tiene ${usos} planilla(s) de calificaciones que se eliminarán.` : ''}`))) return;
  S.planillas.filter((x) => x.periodoId === p.id).forEach((pl) => pl.criterios.forEach((c) => c.actividades.forEach((a) => { delete S.notas[a.id]; delete S.notasRubrica[a.id]; })));
  S.planillas = S.planillas.filter((x) => x.periodoId !== p.id);
  S.config.periodos.splice(i, 1);
  guardar(); render();
}

async function crearRespaldo() {
  const r = await api.exportarRespaldo(textoEstado());
  if (r.ok) aviso('Respaldo guardado en ' + r.ruta, 'ok'); else if (r.error) aviso('No se pudo guardar el respaldo: ' + r.error, 'error');
}
async function restaurarRespaldo() {
  const r = await api.importarRespaldo();
  if (!r.ok) { if (r.error) aviso(r.error, 'error'); return; }
  if (!(await confirmar('Se reemplazarán TODOS los datos actuales por los del respaldo. (Los datos actuales quedan en los respaldos automáticos.) ¿Continuar?', { boton: 'Restaurar' }))) return;
  await api.confirmarRestauracion();
  aplicarRespaldo(r.datos);
  aviso('Respaldo restaurado', 'ok');
}
function nombreRespaldoAuto(n) {
  const m = n.match(/^(respaldo|diario)_(\d{4})-(\d{2})-(\d{2})(?:_(\d{2})(\d{2}))?/);
  if (!m) return n;
  const f = fechaCorta(`${m[2]}-${m[3]}-${m[4]}`);
  return m[1] === 'diario' ? `${f} · último del día` : `${f} a las ${m[5]}:${m[6]}`;
}
async function verRespaldosAuto() {
  const lista = await api.listarRespaldosAuto();
  abrirModal(`<h2>Respaldos automáticos</h2>
    <p class="ayuda">Se crea uno al abrir el programa y cada hora si hubo cambios (se guardan los 15 más recientes), y uno por día durante 30 días.</p>
    ${lista.length ? `<ul class="lista-simple">${lista.map((n) => `<li>${esc(nombreRespaldoAuto(n))}<button class="btn pequeno" onclick="restaurarAuto('${esc(n)}')">Restaurar</button></li>`).join('')}</ul>` : '<p class="ayuda">Aún no hay respaldos automáticos.</p>'}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button></div>`);
}
async function restaurarAuto(nombre) {
  cerrarModal();
  if (!(await confirmar('Se reemplazarán los datos actuales por este respaldo. ¿Continuar?', { boton: 'Restaurar' }))) return;
  const r = await api.restaurarRespaldoAuto(nombre);
  if (!r?.ok) { aviso(r?.error || 'No se pudo restaurar el respaldo.', 'error'); return; }
  aplicarRespaldo(r.datos);
  aviso('Respaldo restaurado', 'ok');
}
// ---------- Almacenamiento (base de datos SQLite cifrada) ----------
function tarjetaAlmacen() {
  setTimeout(async () => {
    const i = await api.infoAlmacen(), el = document.getElementById('tarjeta-almacen-cuerpo');
    if (!el) return;
    const mb = (b) => (b / 1e6).toFixed(b < 1e7 ? 2 : 1) + ' MB';
    const prot = { clave: '🔐 con tu clave de acceso: sin la clave o el código de recuperación nadie puede leerlos', windows: '🛡️ por Windows: solo tu usuario de este computador puede leerlos', plano: '⚠️ sin protección (modo de prueba)' }[i.proteccion] || '—';
    el.innerHTML = `<p>Tus datos están en una <b>base de datos SQLite</b> y cada registro va <b>cifrado (AES-256)</b>. La llave está protegida ${prot}.</p>
      <p class="ayuda">Base de datos: ${mb(i.bd)} · Respaldos automáticos: ${mb(i.respaldos)} · Cambios de notas registrados: ${i.registro}</p>
      ${i.antes2 ? `<div class="alerta info">Al pasar a la versión 2.0 se guardó una copia <b>sin cifrar</b> de tus datos anteriores (carpeta "antes-de-2.0"). Cuando compruebes que todo está bien, bórrala para que tus datos solo queden cifrados.
        <div style="margin-top:8px"><button class="btn peligro" onclick="borrarCopiaAntes2()">Borrar la copia sin cifrar de la versión 1.x</button></div></div>` : ''}`;
  }, 0);
  return `<div class="tarjeta" id="tarjeta-almacen"><h2>🗄️ Almacenamiento</h2><div id="tarjeta-almacen-cuerpo"><p class="ayuda">Cargando…</p></div></div>`;
}
async function borrarCopiaAntes2() {
  if (!(await confirmar('¿Borrar la copia sin cifrar de la versión 1.x? Tus datos actuales, cifrados en la base de datos, y sus respaldos automáticos no se tocan.', { boton: 'Borrar copia', papelera: false }))) return;
  await api.borrarCopiaAntes2();
  aviso('Copia sin cifrar borrada', 'ok'); render();
}

// ---------- Nuevo año lectivo: el docente elige qué conservar ----------
// [clave, título, detalle, marcado por defecto, requiere (otra clave)]
const OPCIONES_NUEVO_ANIO = [
  ['Planeación y recursos', [
    ['planeaciones', 'Planeaciones de clase', 'Pasan al Banco de planeaciones para reutilizarlas (las fechas se ajustan al usarlas)', true],
    ['curricular', 'Planes de área, mallas y planes de periodo', '', true],
    ['cronograma', 'Cronograma de temas', 'Se corre a las mismas semanas del año nuevo, sin marcar como vistos', true],
    ['plantillas', 'Plantillas de planeación', '', true],
    ['pruebas', 'Pruebas y talleres', 'Sin las respuestas ni los resultados', true],
    ['fichas', 'Fichas imprimibles', '', true],
    ['pizarras', 'Tableros (pizarra)', '', true],
  ]],
  ['Grupos y estudiantes', [
    ['grupos', 'Grados y grupos', 'Con sus áreas e intensidad horaria', true],
    ['promover', 'Subir cada grupo un grado', 'Ej.: 7.° A pasa a 8.° A; los de 11.° se retiran', false, 'grupos'],
    ['estudiantes', 'Estudiantes', 'Con acudiente, contactos, PIN y perfil de aprendizaje; quedan en su grupo (útil si sigues con los mismos)', false, 'grupos'],
    ['piar', 'PIAR', 'Como base para actualizarlos', false, 'estudiantes'],
    ['programacion', 'Programación evaluativa', 'Componentes, porcentajes y actividades de cada grupo, sin notas (fechas corridas un año)', true, 'grupos'],
    ['planesAula', 'Planes de aula', '', false, 'grupos'],
    ['horario', 'Clases del horario', 'Las franjas horarias se conservan siempre', false, 'grupos'],
  ]],
  ['Otros', [
    ['eventos', 'Eventos del calendario', 'Se corren al año nuevo (los festivos se calculan solos)', false],
    ['pendientes', 'Mis pendientes sin terminar', '', true],
    ['portafolio', 'Evidencias del portafolio docente', '', false],
  ]],
];
async function nuevoAnio() {
  if (ui.archivo) return aviso('Primero vuelve al año en curso.', 'error');
  const anio = (+S.config.anio || new Date().getFullYear()) + 1;
  abrirModal(`<h2>🗓️ Iniciar el año lectivo ${anio}</h2>
    <p>El año <b>${esc(S.config.anio)}</b> se archivará completo en <b>Años anteriores</b>, donde lo puedes consultar cuando quieras. Elige qué quieres <b>conservar</b> para el año nuevo:</p>
    ${OPCIONES_NUEVO_ANIO.map(([grupo, ops]) => `<h3 style="margin:12px 0 4px">${esc(grupo)}</h3>${ops.map(([k, t, d, def, req]) => `
      <label class="opcion-anio" style="display:flex;gap:8px;align-items:flex-start;font-weight:normal;color:inherit;font-size:14px;margin:5px 0 5px ${req ? '24px' : '0'}">
        <input type="checkbox" data-na="${k}" ${req ? `data-req="${req}"` : ''} ${def ? 'checked' : ''} onchange="dependenciasNuevoAnio()" style="width:auto;margin-top:3px">
        <span><b>${esc(t)}</b>${d ? `<br><span class="ayuda">${esc(d)}</span>` : ''}</span></label>`).join('')}`).join('')}
    <p class="ayuda" style="margin-top:12px">Siempre se conservan la configuración, las áreas, el banco pedagógico, los instrumentos de evaluación y las franjas del horario. Siempre se vacían los datos propios del año: asistencia, notas, recuperaciones, observaciones, anotaciones, diario de campo, comunicados, planes de apoyo, retroalimentaciones y gamificación.</p>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn peligro" onclick="ejecutarNuevoAnio()">Archivar ${esc(S.config.anio)} e iniciar ${anio}</button></div>`, { ancho: true });
  dependenciasNuevoAnio();
}
// Una opción que depende de otra (p. ej. estudiantes → grupos) se desactiva si aquella no está marcada
function dependenciasNuevoAnio() {
  const caja = (k) => document.querySelector(`[data-na="${k}"]`);
  for (let i = 0; i < 3; i++) document.querySelectorAll('[data-req]').forEach((c) => {
    const base = caja(c.dataset.req);
    const ok = base.checked && !base.disabled;
    if (!ok && !c.disabled) { c.dataset.antes = c.checked ? '1' : ''; c.checked = false; } // recuerda lo marcado
    else if (ok && c.disabled) c.checked = c.dataset.antes === '1';
    c.disabled = !ok;
    c.closest('label').style.opacity = ok ? 1 : 0.45;
  });
}
async function ejecutarNuevoAnio() {
  const op = Object.fromEntries([...document.querySelectorAll('[data-na]')].map((c) => [c.dataset.na, c.checked && !c.disabled]));
  cerrarModal();
  registrarCambiosNotas(); await enviarRegistroPendiente().catch(() => {});
  const arch = await api.aniosArchivar(textoEstado());
  if (!arch?.ok) { aviso('No se pudo archivar el año: ' + (arch?.error || 'error desconocido') + '. No se borró nada.', 'error'); return; }
  aplicarNuevoAnio(op);
  reiniciarRegistroNotas();
  guardar(); ir('inicio');
  aviso(`Año lectivo ${S.config.anio} listo. El año anterior quedó en "Años anteriores". Revisa las fechas de los periodos en Configuración.`, 'ok');
}
function correrAnio(iso) { return iso ? String(iso).replace(/^(\d{4})/, (y) => String(+y + 1)) : iso; }
function aplicarNuevoAnio(op) {
  const anio = (+S.config.anio || new Date().getFullYear()) + 1;
  // Planeaciones: recuerdan el grado para sugerirlas en el banco
  S.planeaciones.forEach((p) => { const g = porId(S.grupos, p.grupoId); if (g) p.gradoOrigen = g.grado; });
  if (op.planeaciones) S.planeaciones.forEach((p) => { p.enBanco = true; p.grupoId = ''; }); else S.planeaciones = [];
  if (!op.curricular) Object.assign(S, { planesArea: [], mallas: [], planesPeriodo: [] });
  S.cronograma = op.cronograma ? Object.fromEntries(Object.entries(S.cronograma || {}).map(([k, v]) => {
    const partes = k.split('|'); partes[3] = sumarDias(partes[3], 364); // mismo lunes de la semana equivalente
    const { hecho, ...resto } = v || {}; return [partes.join('|'), resto];
  })) : {};
  if (!op.plantillas) S.plantillas = [];
  if (op.pruebas) (S.pruebas || []).forEach((p) => { p.grupoId = ''; p.respuestas = {}; p.abiertas = {}; p.textos = {}; p.actividadId = ''; p.periodoId = ''; }); else S.pruebas = [];
  if (!op.fichas) S.fichas = [];
  if (!op.pizarras) S.pizarras = [];

  // Grupos y estudiantes
  if (op.grupos) {
    if (op.promover) {
      const salen = new Set(S.grupos.filter((g) => +g.grado >= 11).map((g) => g.id));
      S.grupos = S.grupos.filter((g) => !salen.has(g.id));
      S.grupos.forEach((g) => { const ant = String(g.grado); g.grado = +g.grado + 1; if (String(g.nombre).startsWith(ant)) g.nombre = String(g.grado) + String(g.nombre).slice(ant.length); });
      S.alumnos = S.alumnos.filter((a) => !salen.has(a.grupoId));
    }
    S.alumnos = op.estudiantes ? S.alumnos.filter((a) => a.activo !== false && porId(S.grupos, a.grupoId)) : [];
    S.piar = op.piar ? S.piar.filter((x) => porId(S.alumnos, x.alumnoId)) : [];
    if (op.programacion) {
      S.planillas = S.planillas.filter((pl) => porId(S.grupos, pl.grupoId));
      S.planillas.forEach((pl) => pl.criterios.forEach((c) => c.actividades.forEach((a) => { a.fecha = correrAnio(a.fecha); })));
    } else S.planillas = [];
    if (!op.planesAula) S.planesAula = [];
    if (S.horario) S.horario.celdas = op.horario ? Object.fromEntries(Object.entries(S.horario.celdas || {}).filter(([, c]) => !c.grupoId || porId(S.grupos, c.grupoId))) : {};
  } else {
    Object.assign(S, { grupos: [], alumnos: [], piar: [], planillas: [], planesAula: [] });
    if (S.horario) S.horario.celdas = {};
  }
  (S.pizarras || []).forEach((t) => { t.grupoIds = (t.grupoIds || []).filter((id) => porId(S.grupos, id)); });

  // Otros
  S.eventos = op.eventos ? S.eventos.filter((e) => e.tipo !== 'festivo').map((e) => ({ ...e, fecha: correrAnio(e.fecha), fechaFin: correrAnio(e.fechaFin) })) : [];
  S.pendientes = op.pendientes ? (S.pendientes || []).filter((p) => !p.hecho) : [];
  if (!op.portafolio) S.portafolio = { evidencias: [], reflexiones: {} };

  // Datos propios del año: siempre se vacían (quedan en el año archivado)
  Object.assign(S, { asistencia: {}, notas: {}, notasRubrica: {}, recuperaciones: {}, registroNotas: [], entregas: {}, anotaciones: [], observaciones: {}, diario: [], comunicadosEnviados: [],
    alertasOcultas: [], planesApoyo: [], gamificacion: {}, retro: {}, informes: {} });
  S.config.anio = anio;
  S.config.periodos.forEach((p) => { p.inicio = correrAnio(p.inicio); p.fin = correrAnio(p.fin); });
}

// ---------- Configuración de IA ----------
function tarjetaIA() {
  setTimeout(() => actualizarModelosIA(false), 0);
  const ia = S.config.ia;
  const p = ia.proveedor || 'anthropic';
  const info = PROVEEDORES_IA[p];
  return `<div class="tarjeta"><h2>✨ Inteligencia artificial (opcional)</h2>
    <p class="ayuda">Puedes usar el proveedor que prefieras. Las claves se guardan cifradas y solo en este equipo (no se copian en los respaldos ni en los paquetes). Para generar sugerencias se envían el tema, el área, el grado
    y lo escrito en la planeación; <b>no se envían nombres de estudiantes</b>. El costo depende del proveedor y del modelo.</p>
    <div class="rejilla r4" style="align-items:end">
      <div class="campo"><label>Proveedor</label><select onchange="S.config.ia.proveedor=this.value;guardar();render()">
        ${Object.entries(PROVEEDORES_IA).map(([k, v]) => `<option value="${k}" ${p === k ? 'selected' : ''}>${v.nombre}${(k === 'compatible' ? ia.url : ia.claves?.[k]) ? ' ✔' : ''}</option>`).join('')}</select></div>
      <div class="campo" style="grid-column: span 2"><label>Clave de API ${p === 'compatible' ? '(opcional)' : ''} <span style="font-weight:normal">· se obtiene en ${esc(info.donde)}</span></label>
        <div class="fila" style="flex-wrap:nowrap"><input type="password" id="cfg-key" style="flex:1" value="${esc(ia.claves?.[p] || '')}" placeholder="${esc(info.ph)}"
          onchange="(S.config.ia.claves ||= {})['${p}']=this.value.trim();guardar();aviso('Clave guardada','ok');actualizarModelosIA(false,true)">
        <button class="btn" title="Mostrar u ocultar" onclick="const i=document.getElementById('cfg-key');i.type=i.type==='password'?'text':'password'">👁️</button></div></div>
      ${campoModeloIA()}
    </div>
    ${p === 'compatible' ? `<div class="campo"><label>Dirección (URL base) del servicio</label><input value="${esc(ia.url || '')}" placeholder="https://api.deepseek.com/v1   ·   http://localhost:11434/v1 (Ollama)"
        onchange="S.config.ia.url=this.value.trim();guardar()">
      <div class="ayuda">Cualquier servicio que use el formato de OpenAI (<i>/chat/completions</i>). Con <b>Ollama</b> o <b>LM Studio</b> la IA corre en tu propio computador, sin costo y sin enviar datos a internet.</div>
      <div class="fila" style="margin-top:6px"><button class="btn pequeno" onclick="usarOllama()">🖥️ Usar Ollama en este equipo</button>
        <span class="ayuda">Instala Ollama (ollama.com), abre una terminal y escribe <code>ollama pull qwen3:8b</code>. Con 8 GB de RAM usa <code>qwen3:4b</code>; con tarjeta gráfica de 12 GB o más, <code>gemma3:12b</code>.</span></div></div>`
      : `<div class="ayuda" style="margin-top:-4px">Si dejas el modelo vacío se usa <b>${esc(info.modelo)}</b>. Puedes escribir cualquier otro modelo que ofrezca tu proveedor; si está saturado, el programa reintenta solo${p === 'gemini' ? ' y, si el modelo ya no existe o sigue saturado, usa el Gemini Flash más reciente de tu cuenta' : ''}.</div>`}
    <div class="fila" style="margin-top:10px"><button class="btn" id="btn-probar-ia" onclick="probarIA()">🔌 Probar conexión</button>
      ${ia.claves?.[p] ? `<button class="btn peligro" onclick="delete S.config.ia.claves['${p}'];guardar();render()">Quitar clave</button>` : ''}
      </div>
      <div id="res-probar-ia" class="ayuda" style="margin-top:8px;overflow-wrap:anywhere"></div>
  </div>`;
}
// Modelo: lista con los modelos de la cuenta del docente (se actualiza con internet; sin internet se ve la última)
function campoModeloIA() {
  const ia = S.config.ia, p = ia.proveedor || 'anthropic', info = PROVEEDORES_IA[p];
  const disp = ia.disponibles?.[p], lista = Array.isArray(disp?.modelos) ? disp.modelos : [];
  const actual = ia.modelos?.[p] || '';
  const enLista = !actual || lista.some((m) => m.id === actual);
  const opcionesM = `<option value="">${info.modelo ? `Automático (${esc(info.modelo)})` : '(elige un modelo)'}</option>`
    + lista.map((m) => `<option value="${esc(m.id)}" ${m.id === actual ? 'selected' : ''}>${esc(m.id)}${m.nombre && m.nombre !== m.id ? ' · ' + esc(m.nombre) : ''}</option>`).join('')
    + `<option value="__otro" ${enLista ? '' : 'selected'}>Otro (escribir el nombre)…</option>`;
  const fecha = disp?.fecha ? new Date(disp.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '';
  return `<div class="campo" id="cfg-campo-modelo"><label>Modelo <button class="icono" style="font-size:13px" title="Actualizar la lista con los modelos de tu cuenta (requiere internet)" onclick="actualizarModelosIA(true)">🔄</button></label>
    <select id="cfg-modelo-sel" onchange="elegirModeloIA(this.value)">${opcionesM}</select>
    <input id="cfg-modelo" ${enLista ? 'hidden' : ''} style="margin-top:6px" value="${esc(actual)}" placeholder="${esc(info.modelo || 'ej.: llama3.1, deepseek-chat')}" onchange="(S.config.ia.modelos ||= {})['${p}']=this.value.trim();guardar()">
    <div class="ayuda" id="cfg-modelos-info" style="overflow-wrap:anywhere">${lista.length ? `${lista.length} modelos de tu cuenta · ${esc(fecha)}` : 'Pulsa 🔄 para ver los modelos de tu cuenta'}</div></div>`;
}
function elegirModeloIA(v) {
  const p = S.config.ia.proveedor || 'anthropic', i = document.getElementById('cfg-modelo');
  if (v === '__otro') { i.hidden = false; i.focus(); return; }
  i.hidden = true; i.value = v;
  (S.config.ia.modelos ||= {})[p] = v; guardar();
}
// Consulta los modelos al proveedor. Automático: al abrir la tarjeta si hay clave, internet y la lista tiene más de 3 días
async function actualizarModelosIA(manual, forzar) {
  const ia = S.config.ia, p = ia.proveedor || 'anthropic';
  const disp = ia.disponibles?.[p];
  const pedidos = (ui.modelosPedidos ||= {});
  if (!manual) {
    const listo = p === 'compatible' ? ia.url : ia.claves?.[p];
    if (!listo || !navigator.onLine) return;
    if (!forzar && (pedidos[p] || (disp?.fecha && Date.now() - Date.parse(disp.fecha) < 3 * 86400000))) return;
  }
  pedidos[p] = true;
  const info = document.getElementById('cfg-modelos-info');
  if (info) info.textContent = 'Consultando los modelos de tu cuenta…';
  const r = await api.modelosIA({ ia: S.config.ia, proveedor: p });
  if ((S.config.ia.proveedor || 'anthropic') !== p) return; // cambió de proveedor mientras tanto
  if (r.ok) { (S.config.ia.disponibles ||= {})[p] = { fecha: new Date().toISOString(), modelos: r.modelos }; guardar(); }
  const campo = document.getElementById('cfg-campo-modelo');
  if (campo) campo.outerHTML = campoModeloIA();
  if (!r.ok) {
    const i2 = document.getElementById('cfg-modelos-info');
    if (i2) i2.textContent = (manual ? '' : 'No se pudo actualizar la lista: ') + r.error + (disp ? ' (se muestra la última lista guardada)' : '');
    if (manual) aviso('No se pudo obtener la lista de modelos: ' + r.error, 'error');
  } else if (manual) aviso(`Lista actualizada: ${r.modelos.length} modelos`, 'ok');
}
function usarOllama() {
  const ia = S.config.ia;
  ia.proveedor = 'compatible'; ia.url = 'http://localhost:11434/v1';
  (ia.modelos ||= {}).compatible = ia.modelos.compatible || 'qwen3:8b';
  guardar(); render(); aviso('Listo. Usa "Probar conexión" para verificar que Ollama esté abierto.', 'ok');
}
async function probarIA() {
  const btn = document.getElementById('btn-probar-ia');
  const res = document.getElementById('res-probar-ia');
  btn.disabled = true; res.textContent = 'Probando…';
  const r = await api.sugerirIA({ ia: S.config.ia, tarea: 'prueba', contexto: '' });
  btn.disabled = false;
  res.innerHTML = r.ok ? '<b style="color:var(--verde)">✔ Conexión correcta con ' + esc(nombreIA()) + '</b>' : '<b style="color:var(--rojo)">✖ ' + esc(r.error) + '</b>';
}

// ---------- Componentes de evaluación por defecto ----------
function tarjetaComponentes() {
  const comps = S.config.componentesPorDefecto ||= structuredClone(COMPONENTES_POR_DEFECTO);
  const suma = comps.reduce((s, p) => s + (+p.peso || 0), 0);
  return `<div class="tarjeta"><div class="cabecera"><h2 style="margin:0">Componentes de evaluación por defecto</h2>
    <div class="fila"><button class="btn pequeno" onclick="restaurarComponentes()">Restaurar sugeridos</button>
    <button class="btn pequeno" onclick="S.config.componentesPorDefecto.push({nombre:'Nuevo componente',peso:0,actividades:[]});guardar();render()">＋ Componente</button></div></div>
    <p class="ayuda">Se usan al crear la programación evaluativa de un grupo, área y periodo. Cada programación se puede ajustar después. Escribe una actividad por línea.</p>
    ${suma !== 100 ? `<div class="alerta">Suman <b>${suma}%</b>. Deberían sumar 100%.</div>` : ''}
    <table class="tabla"><thead><tr><th>Componente</th><th style="width:120px">Porcentaje</th><th>Actividades programables (una por línea)</th><th></th></tr></thead><tbody>
    ${comps.map((cr, i) => `<tr><td><input value="${esc(cr.nombre)}" onchange="S.config.componentesPorDefecto[${i}].nombre=this.value;guardar()"></td>
      <td><div class="fila" style="flex-wrap:nowrap"><input type="number" value="${esc(cr.peso)}" style="width:70px" onchange="S.config.componentesPorDefecto[${i}].peso=+this.value;guardar();render()"> %</div></td>
      <td><textarea style="min-height:${Math.max(48, 22 * (cr.actividades || []).length)}px" onchange="cambiarActividadesPorDefecto(${i},this.value)">${esc((cr.actividades || []).map((a) => a.nombre).join('\n'))}</textarea></td>
      <td style="width:40px"><button class="icono" onclick="S.config.componentesPorDefecto.splice(${i},1);guardar();render()">🗑️</button></td></tr>`).join('')}
    </tbody></table>
  </div>`;
}
function cambiarActividadesPorDefecto(i, texto) {
  const comp = S.config.componentesPorDefecto[i];
  const previas = Object.fromEntries((comp.actividades || []).map((a) => [a.nombre, a]));
  comp.actividades = texto.split('\n').map((l) => l.trim()).filter(Boolean).map((n) => previas[n] || { nombre: n });
  guardar();
}
async function restaurarComponentes() {
  if (!(await confirmar('¿Restaurar los componentes sugeridos (Evaluaciones, Consultas, Aplicación, Actitudinal y Prueba final)? Las programaciones ya creadas no cambian.', { boton: 'Restaurar', peligro: false }))) return;
  S.config.componentesPorDefecto = structuredClone(COMPONENTES_POR_DEFECTO);
  guardar(); render();
}

// ---------- Asistente de configuración inicial ----------
const ESCALAS = {
  '1-5': { escalaMin: 1, escalaMax: 5, notaAprobacion: 3, decimales: 1, desempenos: [['Bajo', 1, 2.9], ['Básico', 3, 3.9], ['Alto', 4, 4.5], ['Superior', 4.6, 5]] },
  '1-10': { escalaMin: 1, escalaMax: 10, notaAprobacion: 6, decimales: 1, desempenos: [['Bajo', 1, 5.9], ['Básico', 6, 7.9], ['Alto', 8, 9.4], ['Superior', 9.5, 10]] },
  '1-100': { escalaMin: 1, escalaMax: 100, notaAprobacion: 60, decimales: 0, desempenos: [['Bajo', 1, 59], ['Básico', 60, 79], ['Alto', 80, 94], ['Superior', 95, 100]] },
};
const PASOS_ASISTENTE = ['Institución', 'Periodos', 'Escala', 'Evaluación', 'Listo'];
function abrirAsistente() {
  const anio = +S.config.anio || new Date().getFullYear();
  const ps = S.config.periodos;
  ui.wiz = { paso: 0, n: ps.length || 4, inicio: ps[0]?.inicio || `${anio}-01-26`, fin: ps[ps.length - 1]?.fin || `${anio}-11-27` };
  dibujarAsistente();
}
function generarPeriodos(n, inicio, fin) {
  if (!inicio || !fin || fin <= inicio) return aviso('Revisa las fechas de inicio y fin del año lectivo', 'error');
  const dias = difDias(inicio, fin) + 1;
  const largo = dias / n;
  const nombres = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto'];
  const anteriores = S.config.periodos;
  S.config.periodos = Array.from({ length: n }, (_, i) => {
    const ini = sumarDias(inicio, Math.round(i * largo));
    const f = i === n - 1 ? fin : sumarDias(inicio, Math.round((i + 1) * largo) - 1);
    return { id: anteriores[i]?.id || uid(), nombre: `${nombres[i] || 'Periodo ' + (i + 1)} periodo`, inicio: ini, fin: f, peso: i === n - 1 ? 100 - Math.floor(100 / n) * (n - 1) : Math.floor(100 / n) };
  });
  guardar();
}
function aplicarEscala(k) {
  const e = ESCALAS[k];
  Object.assign(S.config, { escalaMin: e.escalaMin, escalaMax: e.escalaMax, notaAprobacion: e.notaAprobacion, decimales: e.decimales });
  S.config.desempenos = e.desempenos.map(([nombre, desde, hasta]) => ({ nombre, desde, hasta }));
  guardar();
}
function escalaActual() { return Object.keys(ESCALAS).find((k) => ESCALAS[k].escalaMax === +S.config.escalaMax) || ''; }
function dibujarAsistente() {
  const w = ui.wiz, c = S.config;
  const campoW = (k, t, tipo = 'text') => `<div class="campo"><label>${t}</label><input type="${tipo}" value="${esc(c[k] ?? '')}" onchange="S.config['${k}']=${tipo === 'number' ? '+this.value' : 'this.value'};guardar()"></div>`;
  let cuerpo = '';
  if (w.paso === 0) cuerpo = `<p>Vamos a ajustar el Planeador a tu institución y a tu forma de trabajar. Puedes cambiar todo después en Configuración.</p>
    <div class="rejilla r2">${campoW('institucion', 'Institución educativa')}${campoW('sede', 'Sede')}${campoW('municipio', 'Municipio')}${campoW('docente', 'Tu nombre (docente)')}${campoW('coordinador', 'Coordinador(a) académico(a)')}${campoW('anio', 'Año lectivo', 'number')}</div>`;
  if (w.paso === 1) cuerpo = `<p>¿Cuántos periodos académicos tiene tu institución y en qué fechas va el año escolar?</p>
    <div class="rejilla r3">
      <div class="campo"><label>Número de periodos</label><select onchange="ui.wiz.n=+this.value">${[2, 3, 4, 5, 6].map((n) => `<option ${w.n === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="campo"><label>Inicio de clases</label><input type="date" value="${esc(w.inicio)}" onchange="ui.wiz.inicio=this.value"></div>
      <div class="campo"><label>Fin de clases</label><input type="date" value="${esc(w.fin)}" onchange="ui.wiz.fin=this.value"></div>
    </div>
    <button class="btn" onclick="generarPeriodos(ui.wiz.n,ui.wiz.inicio,ui.wiz.fin);dibujarAsistente()">⚙️ Generar periodos de igual duración</button>
    <table class="tabla" style="margin-top:12px"><thead><tr><th>Nombre</th><th>Inicio</th><th>Fin</th><th style="width:100px">%</th></tr></thead><tbody>
    ${c.periodos.map((p, i) => `<tr><td><input value="${esc(p.nombre)}" onchange="S.config.periodos[${i}].nombre=this.value;guardar()"></td>
      <td><input type="date" value="${esc(p.inicio)}" onchange="S.config.periodos[${i}].inicio=this.value;guardar()"></td>
      <td><input type="date" value="${esc(p.fin)}" onchange="S.config.periodos[${i}].fin=this.value;guardar()"></td>
      <td><input type="number" value="${esc(p.peso)}" onchange="S.config.periodos[${i}].peso=+this.value;guardar();dibujarAsistente()"></td></tr>`).join('')}
    </tbody></table>
    <p class="ayuda">Los porcentajes suman ${c.periodos.reduce((s, p) => s + (+p.peso || 0), 0)}% (deben sumar 100%). Ajusta las fechas exactas según el calendario de tu Secretaría de Educación.</p>`;
  if (w.paso === 2) cuerpo = `<p>¿Qué escala de valoración usa tu institución (SIEE)?</p>
    <div class="fila">${Object.keys(ESCALAS).map((k) => `<button class="btn ${escalaActual() === k ? 'primario' : ''}" onclick="aplicarEscala('${k}');dibujarAsistente()">${k.replace('-', ' a ')}</button>`).join('')}</div>
    <div class="rejilla r3" style="margin-top:12px">${campoW('notaAprobacion', 'Nota mínima aprobatoria', 'number')}
      <div class="campo"><label>Decimales</label><select onchange="S.config.decimales=+this.value;guardar()">${[0, 1, 2].map((n) => `<option ${c.decimales === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
    <table class="tabla" style="max-width:460px"><thead><tr><th>Desempeño</th><th>Desde</th><th>Hasta</th></tr></thead><tbody>
    ${c.desempenos.map((d, i) => `<tr><td><span class="chip ${esc(d.nombre)}">${esc(d.nombre)}</span></td>
      <td><input type="number" step="0.1" value="${d.desde}" onchange="S.config.desempenos[${i}].desde=+this.value;guardar()"></td>
      <td><input type="number" step="0.1" value="${d.hasta}" onchange="S.config.desempenos[${i}].hasta=+this.value;guardar()"></td></tr>`).join('')}</tbody></table>`;
  if (w.paso === 3) {
    const comps = c.componentesPorDefecto ||= structuredClone(COMPONENTES_POR_DEFECTO);
    const suma = comps.reduce((s, x) => s + (+x.peso || 0), 0);
    cuerpo = `<p>¿Cómo distribuyes la evaluación del periodo? Estos componentes se usarán al crear la programación evaluativa de cada grupo (luego puedes cambiar nombres, actividades y porcentajes).</p>
    <table class="tabla"><thead><tr><th>Componente</th><th style="width:110px">%</th><th>Actividades programadas</th><th></th></tr></thead><tbody>
    ${comps.map((x, i) => `<tr><td><input value="${esc(x.nombre)}" onchange="S.config.componentesPorDefecto[${i}].nombre=this.value;guardar()"></td>
      <td><input type="number" value="${esc(x.peso)}" onchange="S.config.componentesPorDefecto[${i}].peso=+this.value;guardar();dibujarAsistente()"></td>
      <td><input value="${esc((x.actividades || []).map((a) => a.nombre).join(', '))}" onchange="cambiarActividadesPorDefecto(${i},this.value.split(',').join('\\n'))"></td>
      <td><button class="icono" onclick="S.config.componentesPorDefecto.splice(${i},1);guardar();dibujarAsistente()">🗑️</button></td></tr>`).join('')}
    </tbody></table>
    <button class="btn pequeno" onclick="S.config.componentesPorDefecto.push({nombre:'Nuevo componente',peso:0,actividades:[]});guardar();dibujarAsistente()">＋ Componente</button>
    <p class="ayuda">${suma === 100 ? '✔ Suman 100%.' : `<b style="color:var(--rojo)">Suman ${suma}%; deben sumar 100%.</b>`} Separa las actividades con comas.</p>`;
  }
  if (w.paso === 4) cuerpo = `<p>¡Listo! Tu configuración básica está guardada. Siguientes pasos recomendados:</p>
    <ol><li><b>Grupos y alumnos:</b> crea tus áreas, grupos y listas de estudiantes, y una <b>plantilla de planeación</b> por grado o grupo (estudiantes, duración, gustos, estilos de aprendizaje…).</li>
    <li><b>Planeación curricular:</b> plan de área y malla curricular.</li>
    <li><b>Calificaciones → Programación evaluativa:</b> fechas y actividades del periodo para compartir con los padres.</li>
    <li><b>Calendario:</b> agrega los festivos de Colombia con un clic.</li></ol>`;
  abrirModal(`<h2>🧭 Asistente de configuración</h2>
    <div class="pestanas">${PASOS_ASISTENTE.map((p, i) => `<button class="${w.paso === i ? 'activo' : ''}" onclick="ui.wiz.paso=${i};dibujarAsistente()">${i + 1}. ${p}</button>`).join('')}</div>
    ${cuerpo}
    <div class="botones">${w.paso > 0 ? '<button class="btn" style="margin-right:auto" onclick="ui.wiz.paso--;dibujarAsistente()">← Anterior</button>' : ''}
      ${w.paso < PASOS_ASISTENTE.length - 1 ? `<button class="btn" onclick="cerrarModal();render()">Terminar después</button><button class="btn primario" onclick="ui.wiz.paso++;dibujarAsistente()">Siguiente →</button>`
        : `<button class="btn" onclick="S.config.configurado=true;guardar();cerrarModal();render()">Cerrar</button><button class="btn primario" onclick="S.config.configurado=true;guardar();cerrarModal();ir('grupos')">Ir a Grupos y alumnos</button>`}</div>`, { ancho: true });
}

// ---------- Membrete institucional ----------
function tarjetaMembrete() {
  const mb = S.config.membrete ||= { logo: null, logo2: null, lineas: '', lema: '', pie: '', color: '#1f4e79' };
  const img = (k, t) => `<div class="campo"><label>${t}</label>
    <div class="fila" style="flex-wrap:nowrap">${mb[k] ? `<img src="${mb[k].data}" style="height:56px;max-width:140px;object-fit:contain;border:1px solid var(--borde);border-radius:6px;padding:3px;background:#fff">` : '<span class="ayuda">Sin imagen</span>'}
      <label class="btn pequeno" style="margin:0;cursor:pointer;font-weight:normal;color:inherit">📁 Elegir…<input type="file" accept="image/png,image/jpeg" style="display:none" onchange="cargarLogo('${k}',this.files[0])"></label>
      ${mb[k] ? `<button class="btn pequeno peligro" onclick="S.config.membrete['${k}']=null;guardar();render()">Quitar</button>` : ''}</div></div>`;
  return `<div class="tarjeta"><h2>🏫 Membrete de los documentos</h2>
    <p class="ayuda">Aparece en el encabezado de todas las páginas de los documentos de Word (planeaciones, mallas, planes de área, programación evaluativa, planes de apoyo, PIAR…).</p>
    <div class="rejilla" style="grid-template-columns: 1fr 1fr 1fr">
      ${img('logo', 'Escudo o logo (izquierda)')}
      ${img('logo2', 'Segundo logo (derecha, opcional)')}
      <div class="campo"><label>Color del membrete</label><input type="color" value="${esc(mb.color || '#1f4e79')}" style="width:80px;height:38px;padding:2px" onchange="S.config.membrete.color=this.value;guardar();render()"></div>
    </div>
    <div class="rejilla r2">
      <div class="campo"><label>Líneas bajo el nombre (una por línea)</label><textarea placeholder="Aprobada por Resolución N.° … de …\nNIT: … · DANE: …" oninput="S.config.membrete.lineas=this.value;guardar();actualizarVistaMembrete()">${esc(mb.lineas || '')}</textarea></div>
      <div><div class="campo"><label>Lema (opcional)</label><input value="${esc(mb.lema || '')}" placeholder="Ej.: Educamos para la vida" oninput="S.config.membrete.lema=this.value;guardar();actualizarVistaMembrete()"></div>
        <div class="campo"><label>Pie de página (dirección, teléfono, correo…)</label><textarea style="min-height:48px" placeholder="Calle … · Tel. … · correo@…" oninput="S.config.membrete.pie=this.value;guardar();actualizarVistaMembrete()">${esc(mb.pie || '')}</textarea></div></div>
    </div>
    <label>Vista previa</label><div id="vista-membrete">${vistaMembreteHTML()}</div>
  </div>`;
}
function vistaMembreteHTML() {
  const c = S.config, mb = c.membrete || {};
  const col = mb.color || '#1f4e79';
  const lin = String(mb.lineas || '').split('\n').filter((l) => l.trim());
  return `<div style="background:#fff;border:1px solid var(--borde);border-radius:6px;padding:12px 16px;color:#222">
    <div style="display:grid;grid-template-columns:90px 1fr 90px;align-items:center;gap:8px;border-bottom:2px solid ${esc(col)};padding-bottom:8px">
      <div style="text-align:center">${mb.logo ? `<img src="${mb.logo.data}" style="max-height:60px;max-width:88px">` : ''}</div>
      <div style="text-align:center;font-family:Arial;line-height:1.3">
        <div style="font-weight:700;color:${esc(col)};font-size:15px">${esc((c.institucion || 'INSTITUCIÓN EDUCATIVA').toUpperCase())}</div>
        ${lin.map((l) => `<div style="font-size:11px">${esc(l)}</div>`).join('')}
        ${[c.sede, c.municipio].filter(Boolean).length ? `<div style="font-size:11px">${esc([c.sede, c.municipio].filter(Boolean).join(' – '))}</div>` : ''}
        ${mb.lema ? `<div style="font-size:11px;font-style:italic;color:${esc(col)}">${esc(mb.lema)}</div>` : ''}</div>
      <div style="text-align:center">${mb.logo2 ? `<img src="${mb.logo2.data}" style="max-height:60px;max-width:88px">` : ''}</div>
    </div>
    <div style="height:40px"></div>
    ${mb.pie ? `<div style="border-top:1px solid ${esc(col)};font-size:10px;color:#666;text-align:center;padding-top:4px;font-family:Arial">${esc(mb.pie).replace(/\n/g, '<br>')}</div>` : ''}
  </div>`;
}
function actualizarVistaMembrete() { const v = document.getElementById('vista-membrete'); if (v) v.innerHTML = vistaMembreteHTML(); }
function cargarLogo(clave, archivo) {
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = () => {
    const im = new Image();
    im.onload = () => {
      // Se reduce a máximo 400 px para que los datos no crezcan demasiado
      const escala = Math.min(1, 400 / Math.max(im.width, im.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(im.width * escala); cv.height = Math.round(im.height * escala);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      S.config.membrete[clave] = { data: cv.toDataURL('image/png'), ancho: cv.width, alto: cv.height };
      guardar(); render();
      aviso('Imagen cargada', 'ok');
    };
    im.onerror = () => aviso('No se pudo leer la imagen', 'error');
    im.src = lector.result;
  };
  lector.readAsDataURL(archivo);
}
