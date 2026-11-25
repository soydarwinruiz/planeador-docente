// ================= Celular del docente: una extensión del computador =================
// El celular abre http://<ip-del-computador>:<puerto>/cel en la misma red (WiFi del colegio o punto de acceso del celular).
// servidor-aula.js recibe cada solicitud y la pasa aquí; esta parte valida el permiso del celular y usa las mismas
// funciones del programa (asistencia, notas, gamificación, diario…), así lo que se hace en el celular queda igual que en el PC.

const DURACIONES_CEL = [
  ['1h', '1 hora'], ['jornada', 'Solo hoy (hasta la medianoche)'], ['7d', '7 días'], ['30d', '30 días'],
  ['periodo', 'Hasta que termine el periodo actual'], ['siempre', 'Hasta que yo lo desautorice'],
];
const TIPOS_ANOTACION = { positiva: '🌟 Positiva', academica: '📚 Académica', convivencia: '🕊️ Convivencia', general: '📝 General' };
const CEL = { activo: false, pin: '', pinVence: 0, duracion: '', intentos: {}, fallos: 0, conexion: null, ultimoAviso: 0 };

function configCelular() { return (S.config.celular ||= { duracion: 'jornada', dispositivos: [] }); }
function dispositivosVigentes() { const ahora = new Date().toISOString(); return (configCelular().dispositivos || []).filter((d) => !d.expira || d.expira > ahora); }
function vencimientoCel(duracion) {
  const d = new Date();
  switch (duracion) {
    case '1h': return new Date(Date.now() + 3600000).toISOString();
    case 'jornada': d.setHours(23, 59, 59, 0); return d.toISOString();
    case '7d': return new Date(Date.now() + 7 * 86400000).toISOString();
    case '30d': return new Date(Date.now() + 30 * 86400000).toISOString();
    case 'periodo': { const p = periodoDeFecha(hoyISO()); if (!p?.fin) return new Date(Date.now() + 86400000).toISOString(); const f = deISO(p.fin); f.setHours(23, 59, 59, 0); return f.toISOString(); }
    default: return null;
  }
}
function textoVence(iso) {
  if (!iso) return 'Sin vencimiento';
  const d = new Date(iso);
  return 'Vence ' + d.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
async function resumenToken(token) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(token)));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
}
function tokenNuevo() { return Array.from(crypto.getRandomValues(new Uint8Array(24)), (x) => x.toString(16).padStart(2, '0')).join(''); }

// ---------- Encender y apagar el servidor ----------
async function activarCelular(activo) {
  const r = await api.celActivar(activo);
  CEL.activo = !!(r.ok && r.activo);
  CEL.conexion = r.ok && r.activo ? r : null;
  if (!r.ok) aviso('No se pudo activar el acceso desde el celular: ' + r.error, 'error');
  return r;
}
// Al abrir el programa: si hay celulares autorizados, el acceso queda disponible solo
function iniciarCelular() {
  if (dispositivosVigentes().length && configCelular().apagado !== true) activarCelular(true);
}
api.alSolicitudCelular(async ({ id, accion, cuerpo, ip }) => {
  let r;
  try { r = await atenderCelular(accion, cuerpo || {}, ip); } catch (e) { console.error(e); r = { codigo: 500, datos: { error: 'Error en el computador: ' + e.message } }; }
  api.responderCelular(id, r.codigo, r.datos);
});

// ---------- Vincular ----------
function dialogoVincularCelular() {
  if (ui.archivo) return aviso('Primero vuelve al año en curso.', 'error');
  const cfg = configCelular();
  abrirModal(`<h2>📱 Vincular el celular del docente</h2>
    <p class="ayuda">Tu celular funcionará como una extensión del computador: asistencia, notas, anotaciones, puntos, tu clase de hoy y estudiante al azar. No hay que instalar nada.</p>
    <div class="campo"><label>¿Cuánto tiempo queda autorizado el celular?</label><select id="cel-duracion">${DURACIONES_CEL.map(([k, t]) => `<option value="${k}" ${cfg.duracion === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="generarVinculo()">Continuar</button></div>`);
}
async function generarVinculo() {
  const duracion = document.getElementById('cel-duracion').value;
  configCelular().duracion = duracion; configCelular().apagado = false; guardar();
  const r = await activarCelular(true);
  if (!r.ok) return;
  CEL.pin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  CEL.pinVence = Date.now() + 10 * 60000; CEL.duracion = duracion; CEL.fallos = 0; CEL.intentos = {};
  abrirModal(`<h2>📱 Vincular el celular</h2>
    <div class="rejilla r2" style="align-items:center">
      <div class="cel-qr" style="text-align:center">${r.qr || '<p class="ayuda">No se encontró una red. Conecta el computador a la WiFi o al punto de acceso del celular.</p>'}</div>
      <div><p><b>1.</b> Conecta el celular a la <b>misma red</b> que este computador.</p>
        <p><b>2.</b> Escanea el código con la cámara o abre:<br>${r.urls.map((u) => `<code style="user-select:all">${esc(u)}</code>`).join('<br>') || '—'}</p>
        <p><b>3.</b> Escribe este PIN:</p><div class="cel-pin">${CEL.pin}</div>
        <p class="ayuda">El PIN sirve una sola vez durante 10 minutos. Autorización: <b>${esc(DURACIONES_CEL.find(([k]) => k === duracion)[1].toLowerCase())}</b>.</p></div>
    </div>
    <div class="alerta info" style="font-size:13px">Si el celular no carga la página: la red del colegio puede impedir que los equipos se vean entre sí. Activa el <b>punto de acceso</b> del celular y conecta el computador a él. La primera vez, Windows puede preguntar si permite el acceso a la red: acepta en <b>redes privadas</b>.</div>
    <div class="botones"><button class="btn" onclick="CEL.pin='';cerrarModal()">Cerrar</button></div>`, { ancho: true });
}

// ---------- Atender solicitudes ----------
const celOk = (datos = { ok: true }) => ({ codigo: 200, datos });
const celFalla = (codigo, error, extra = {}) => ({ codigo, datos: { error, ...extra } });

async function atenderCelular(accion, b, ip) {
  if (typeof S === 'undefined' || !S) return celFalla(423, 'El programa está bloqueado o cargando en el computador. Ábrelo para continuar.');
  if (accion === 'vincular') return vincularCelular(b, ip);
  const cfg = conAnioActual(() => configCelular());
  const h = await resumenToken(b.token || '');
  const disp = (cfg.dispositivos || []).find((d) => d.hash === h);
  if (!disp) return celFalla(401, 'Este celular no está autorizado. Vincúlalo de nuevo desde el computador.', { revincular: true });
  if (disp.expira && disp.expira < new Date().toISOString()) return celFalla(401, 'La autorización de este celular venció. Vincúlalo de nuevo desde el computador.', { revincular: true });
  if (!disp.ultimo || Date.now() - Date.parse(disp.ultimo) > 10 * 60000) { disp.ultimo = new Date().toISOString(); conAnioActual(() => guardar()); }
  const fn = ACCIONES_CEL[accion];
  if (!fn) return celFalla(404, 'Acción desconocida');
  return conAnioActual(() => fn(b, disp));
}

function vincularCelular(b, ip) {
  const int = (CEL.intentos[ip] ||= { n: 0, hasta: 0 });
  if (int.hasta > Date.now()) return celFalla(429, 'Demasiados intentos. Espera un minuto.');
  if (!CEL.pin || Date.now() > CEL.pinVence) return celFalla(403, 'No hay un PIN vigente. En el computador pulsa "Vincular un celular" para obtener uno nuevo.');
  if (String(b.pin || '').trim() !== CEL.pin) {
    if (++int.n >= 5) { int.hasta = Date.now() + 60000; int.n = 0; }
    if (++CEL.fallos >= 20) CEL.pin = ''; // demasiados intentos en total: el PIN deja de servir
    return celFalla(401, 'PIN incorrecto.');
  }
  CEL.pin = '';
  const token = tokenNuevo();
  return resumenToken(token).then((hash) => conAnioActual(() => {
    const disp = { id: uid(), nombre: String(b.nombre || 'Mi celular').slice(0, 40), hash, creado: new Date().toISOString(), expira: vencimientoCel(CEL.duracion || configCelular().duracion), ultimo: new Date().toISOString() };
    (configCelular().dispositivos ||= []).push(disp);
    guardar();
    if (!document.getElementById('modal-fondo').classList.contains('oculto') && document.querySelector('.cel-pin')) cerrarModal();
    aviso(`📱 Celular "${disp.nombre}" vinculado`, 'ok');
    if (ui.vista === 'configuracion') render();
    return celOk({ token, nombre: disp.nombre, expira: disp.expira });
  }));
}

// Repinta la vista del PC si lo que cambió desde el celular se está mostrando (sin interrumpir si el docente escribe)
function refrescarPorCelular(vistas) {
  const escribiendo = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  const modal = !document.getElementById('modal-fondo').classList.contains('oculto');
  if (!ui.archivo && !escribiendo && !modal && vistas.includes(ui.vista)) render();
  if (Date.now() - CEL.ultimoAviso > 8000) { CEL.ultimoAviso = Date.now(); marcarGuardado('📱 Cambios desde el celular'); }
}
function grupoValido(id) { return porId(S.grupos, id); }
function alumnoDeGrupo(grupoId, alumnoId) { const a = porId(S.alumnos, alumnoId); return a && a.grupoId === grupoId ? a : null; }
function actividadPorId(id) {
  for (const pl of S.planillas) for (const cr of pl.criterios) for (const a of cr.actividades) if (a.id === id) return { pl, cr, a };
  return null;
}

const ACCIONES_CEL = {
  inicio(b, disp) {
    const hoy = hoyISO();
    const ahora = new Date().toTimeString().slice(0, 5);
    const per = periodoDeFecha(hoy);
    return celOk({
      docente: S.config.docente || '', institucion: S.config.institucion || '', fecha: hoy, fechaTexto: fechaLarga(hoy), periodo: per?.nombre || '',
      dispositivo: { nombre: disp.nombre, expira: disp.expira, vence: textoVence(disp.expira) },
      clases: clasesDelDia(hoy).map(({ b: bl, c }) => {
        const plan = planDeClase(c.grupoId, c.areaId, hoy);
        return { inicio: bl.inicio, fin: bl.fin, grupoId: c.grupoId, areaId: c.areaId, grupo: nombreGrupoId(c.grupoId), area: nombreArea(c.areaId),
          actual: ahora >= bl.inicio && ahora < bl.fin, plan: plan ? plan.titulo || 'Planeación sin título' : '',
          asistencia: Object.keys(S.asistencia[`${c.grupoId}|${c.areaId}`]?.[hoy] || {}).length };
      }),
      grupos: [...S.grupos].sort(ordenGrupos).map((g) => ({ id: g.id, nombre: nombreGrupo(g), areas: areasDeGrupo(g.id).map((a) => ({ id: a.id, nombre: a.nombre })) })),
      motivos: motivosPuntos().map((m, i) => ({ i, ico: m.ico, t: m.t, p: m.p })),
      tipos: TIPOS_ANOTACION,
      escala: { min: +S.config.escalaMin, max: +S.config.escalaMax, aprobacion: +S.config.notaAprobacion },
      pendientes: (S.pendientes || []).filter((p) => !p.hecho).map((p) => ({ id: p.id, texto: p.texto, fecha: p.fecha || '' })),
    });
  },
  clase({ grupoId, areaId, fecha }) {
    const g = grupoValido(grupoId);
    if (!g) return celFalla(404, 'El grupo ya no existe.');
    fecha = /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') ? fecha : hoyISO();
    const jg = S.gamificacion?.[grupoId];
    const per = periodoDeFecha(fecha) || periodoDeFecha(hoyISO());
    const pl = per && areaId ? buscarPlanilla(grupoId, areaId, per.id) : null;
    const plan = areaId ? planDeClase(grupoId, areaId, fecha) : null;
    const ses = plan?.sesiones.find((s) => s.fecha === fecha);
    return celOk({
      grupo: nombreGrupo(g), area: areaId ? nombreArea(areaId) : '', fecha, fechaTexto: fechaLarga(fecha), periodo: per?.nombre || '',
      alumnos: alumnosDe(grupoId).map((a) => ({ id: a.id, nombre: nombreAlumno(a), corto: `${primerNombre(a)} ${String(a.apellidos || '').split(/\s+/)[0] || ''}`.trim(), piar: !!a.piar, puntos: jg ? puntosAlumno(jg, a.id) : 0 })),
      asistencia: areaId ? S.asistencia[`${grupoId}|${areaId}`]?.[fecha] || {} : {},
      actividades: pl ? pl.criterios.flatMap((cr) => cr.actividades.map((a) => ({ id: a.id, nombre: a.nombre, componente: cr.nombre, fecha: a.fecha || '', rubrica: !!a.rubricaId }))) : [],
      sesion: plan ? { titulo: plan.titulo || '', sesion: ses?.titulo || '', objetivo: plan.objetivo || '', pregunta: plan.pregunta || '',
        momentos: ses ? MOMENTOS.map((m) => ({ t: m.t, texto: ses[m.k] || '', med: ses[m.k + 'Med'] || '' })).filter((m) => m.texto || m.med) : [] } : null,
    });
  },
  asistencia({ grupoId, areaId, fecha, alumnoId, estado }) {
    if (!grupoValido(grupoId) || !porId(S.areas, areaId)) return celFalla(404, 'Grupo o área no válidos.');
    if (!alumnoDeGrupo(grupoId, alumnoId)) return celFalla(404, 'Estudiante no válido.');
    if (estado && !ESTADOS_ASIS[estado]) return celFalla(400, 'Estado no válido.');
    const dia = (((S.asistencia[`${grupoId}|${areaId}`] ||= {})[fecha || hoyISO()]) ||= {});
    if (estado) dia[alumnoId] = estado; else delete dia[alumnoId];
    guardar(); refrescarPorCelular(['asistencia', 'inicio', 'seguimiento']);
    return celOk();
  },
  todosPresentes({ grupoId, areaId, fecha }) {
    if (!grupoValido(grupoId) || !porId(S.areas, areaId)) return celFalla(404, 'Grupo o área no válidos.');
    const dia = (((S.asistencia[`${grupoId}|${areaId}`] ||= {})[fecha || hoyISO()]) ||= {});
    alumnosDe(grupoId).forEach((a) => { if (!dia[a.id]) dia[a.id] = 'P'; });
    guardar(); refrescarPorCelular(['asistencia', 'inicio', 'seguimiento']);
    return celOk({ asistencia: dia });
  },
  notas({ actividadId }) {
    const x = actividadPorId(actividadId);
    if (!x) return celFalla(404, 'La actividad ya no existe.');
    return celOk({ notas: S.notas[actividadId] || {}, actividad: { nombre: x.a.nombre, componente: x.cr.nombre, rubrica: !!x.a.rubricaId } });
  },
  nota({ actividadId, alumnoId, valor }) {
    const x = actividadPorId(actividadId);
    if (!x) return celFalla(404, 'La actividad ya no existe.');
    if (x.a.rubricaId) return celFalla(400, 'Esta actividad se califica con rúbrica en el computador.');
    origenNotas('celular');
    if (!alumnoDeGrupo(x.pl.grupoId, alumnoId)) return celFalla(404, 'Estudiante no válido.');
    const txt = String(valor ?? '').replace(',', '.').trim();
    S.notas[actividadId] ||= {};
    if (txt === '') delete S.notas[actividadId][alumnoId];
    else {
      const v = +txt;
      if (isNaN(v) || v < +S.config.escalaMin || v > +S.config.escalaMax) return celFalla(400, `La nota debe estar entre ${S.config.escalaMin} y ${S.config.escalaMax}.`);
      S.notas[actividadId][alumnoId] = v;
    }
    guardar(); refrescarPorCelular(['calificaciones', 'seguimiento']);
    return celOk();
  },
  anotacion({ grupoId, areaId, alumnoId, tipo, texto }) {
    texto = String(texto || '').trim().slice(0, 2000);
    if (!texto) return celFalla(400, 'Escribe la anotación.');
    if (!grupoValido(grupoId)) return celFalla(404, 'Grupo no válido.');
    const fecha = hoyISO();
    if (alumnoId) {
      if (!alumnoDeGrupo(grupoId, alumnoId)) return celFalla(404, 'Estudiante no válido.');
      (S.anotaciones ||= []).push({ id: uid(), alumnoId, grupoId, areaId: areaId || '', fecha, tipo: TIPOS_ANOTACION[tipo] ? tipo : 'general', texto, origen: 'celular', creada: new Date().toISOString() });
    } else {
      // Anotación del grupo: va a las novedades del diario de campo de la clase de hoy
      let d = entradaDiario(grupoId, areaId || '', fecha);
      if (!d) { d = { id: uid(), creado: new Date().toISOString(), grupoId, areaId: areaId || '', fecha, clima: '', logrado: '', pendiente: '', novedades: '' }; S.diario.push(d); }
      d.novedades = [d.novedades, texto].filter(Boolean).join('\n');
    }
    guardar(); refrescarPorCelular(['seguimiento', 'diario', 'inicio']);
    return celOk();
  },
  puntos({ grupoId, alumnoId, motivo }) {
    if (!alumnoDeGrupo(grupoId, alumnoId)) return celFalla(404, 'Estudiante no válido.');
    const m = motivosPuntos()[+motivo];
    if (!m) return celFalla(400, 'Motivo no válido.');
    darPuntos(grupoId, ['a:' + alumnoId], m.p, m.t);
    refrescarPorCelular(['gamificacion']);
    return celOk({ puntos: puntosAlumno(juego(grupoId), alumnoId) });
  },
  pendiente({ texto, fecha }) {
    texto = String(texto || '').trim().slice(0, 500);
    if (!texto) return celFalla(400, 'Escribe el pendiente.');
    S.pendientes.push({ id: uid(), texto, fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') ? fecha : '', hecho: false, creado: hoyISO() });
    guardar(); refrescarPorCelular(['inicio']);
    return celOk();
  },
  pendienteHecho({ id }) {
    const p = porId(S.pendientes, id);
    if (!p) return celFalla(404, 'El pendiente ya no existe.');
    p.hecho = true; p.hechoEl = hoyISO();
    guardar(); refrescarPorCelular(['inicio']);
    return celOk();
  },
  desvincular(_b, disp) {
    configCelular().dispositivos = configCelular().dispositivos.filter((d) => d.id !== disp.id);
    guardar(); if (ui.vista === 'configuracion') render();
    return celOk();
  },
};

// ---------- Anotaciones de los estudiantes (también se pueden hacer en el PC) ----------
function tarjetaAnotaciones(alumnoId, grupoId) {
  const lista = (S.anotaciones || []).filter((x) => x.alumnoId === alumnoId).sort((a, b) => b.fecha.localeCompare(a.fecha) || String(b.creada).localeCompare(String(a.creada)));
  return `<div class="tarjeta"><div class="cabecera" style="margin-bottom:6px"><h3 style="margin:0">📝 Anotaciones</h3><button class="btn pequeno" onclick="dialogoAnotacion('${alumnoId}','${grupoId}')">＋ Anotación</button></div>
    ${lista.length ? `<ul class="lista-simple">${lista.map((x) => `<li><div><b>${esc(TIPOS_ANOTACION[x.tipo] || x.tipo)}</b> · ${esc(fechaCorta(x.fecha))}${x.areaId ? ' · ' + esc(nombreArea(x.areaId)) : ''}${x.origen === 'celular' ? ' · 📱' : ''}<br>${esc(x.texto)}</div>
      <button class="icono" title="Eliminar" onclick="eliminarAnotacion('${x.id}')">🗑️</button></li>`).join('')}</ul>`
      : '<p class="ayuda">Sin anotaciones. Puedes hacerlas aquí o desde tu celular durante la clase.</p>'}</div>`;
}
function dialogoAnotacion(alumnoId, grupoId) {
  abrirModal(`<h2>📝 Anotación</h2>
    <div class="campo"><label>Tipo</label><select id="an-tipo">${Object.entries(TIPOS_ANOTACION).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div>
    <div class="campo"><label>Área (opcional)</label><select id="an-area">${opcionesAreas('', '—', areasDeGrupo(grupoId))}</select></div>
    <div class="campo"><label>Anotación</label><textarea id="an-texto" rows="3"></textarea></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarAnotacion('${alumnoId}','${grupoId}')">Guardar</button></div>`);
}
function guardarAnotacion(alumnoId, grupoId) {
  const texto = document.getElementById('an-texto').value.trim();
  if (!texto) return aviso('Escribe la anotación', 'error');
  (S.anotaciones ||= []).push({ id: uid(), alumnoId, grupoId, areaId: document.getElementById('an-area').value, fecha: hoyISO(), tipo: document.getElementById('an-tipo').value, texto, origen: 'pc', creada: new Date().toISOString() });
  guardar(); cerrarModal(); render();
}
async function eliminarAnotacion(id) {
  if (!(await confirmar('¿Eliminar esta anotación?'))) return;
  S.anotaciones = S.anotaciones.filter((x) => x.id !== id); guardar(); render();
}

// ---------- Configuración ----------
function tarjetaCelular() {
  const cfg = configCelular();
  const ahora = new Date().toISOString();
  const lista = cfg.dispositivos || [];
  return `<div class="tarjeta" id="tarjeta-celular"><div class="cabecera"><h2 style="margin:0">📱 Celular del docente</h2>
      <button class="btn primario" onclick="dialogoVincularCelular()">＋ Vincular un celular</button></div>
    <p class="ayuda">Usa tu celular como extensión del computador durante la clase: asistencia, notas, anotaciones, puntos de gamificación, tu planeación de hoy, estudiante al azar y pendientes. Funciona sin internet, en la misma red que el computador, mientras el programa esté abierto.</p>
    <p>${CEL.activo ? '🟢 Disponible para los celulares autorizados.' : '⚪ Apagado.'}
      ${CEL.activo ? '<button class="btn pequeno" onclick="configCelular().apagado=true;guardar();activarCelular(false).then(render)">Apagar</button>' : lista.some((d) => !d.expira || d.expira > ahora) ? '<button class="btn pequeno" onclick="configCelular().apagado=false;guardar();activarCelular(true).then(render)">Encender</button>' : ''}</p>
    ${lista.length ? `<table class="tabla"><thead><tr><th>Celular</th><th>Vinculado</th><th>Autorización</th><th>Último uso</th><th></th></tr></thead><tbody>
      ${lista.map((d) => { const vencido = d.expira && d.expira < ahora; return `<tr><td>📱 ${esc(d.nombre)}</td><td>${esc(new Date(d.creado).toLocaleDateString('es-CO'))}</td>
        <td>${vencido ? '<span class="chip borrador">Vencida</span>' : esc(textoVence(d.expira))}</td><td>${d.ultimo ? esc(new Date(d.ultimo).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) : '—'}</td>
        <td style="white-space:nowrap"><select style="width:auto" onchange="extenderCelular('${d.id}',this.value)"><option value="">Cambiar autorización…</option>${DURACIONES_CEL.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>
        <button class="btn pequeno peligro" onclick="desautorizarCelular('${d.id}')">Desautorizar</button></td></tr>`; }).join('')}
      </tbody></table>` : '<p class="ayuda">No hay celulares vinculados.</p>'}
    <p class="ayuda">Duración predeterminada al vincular: <select style="width:auto" onchange="configCelular().duracion=this.value;guardar()">${DURACIONES_CEL.map(([k, t]) => `<option value="${k}" ${cfg.duracion === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
      · Si pierdes el celular, desautorízalo aquí.</p></div>`;
}
function extenderCelular(id, duracion) {
  const d = porId(configCelular().dispositivos, id);
  if (!d || !duracion) return;
  d.expira = vencimientoCel(duracion);
  guardar();
  if (!CEL.activo && configCelular().apagado !== true) activarCelular(true).then(render); else render();
  aviso('Autorización actualizada', 'ok');
}
async function desautorizarCelular(id) {
  if (!(await confirmar('¿Desautorizar este celular? Para volver a usarlo habrá que vincularlo de nuevo.', { boton: 'Desautorizar', papelera: false }))) return;
  configCelular().dispositivos = configCelular().dispositivos.filter((d) => d.id !== id);
  guardar();
  if (!dispositivosVigentes().length && CEL.activo) await activarCelular(false);
  render();
}
