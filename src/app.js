// ================= Núcleo de la aplicación =================
/* global api */

let S = null; // estado persistente
const ui = { vista: 'inicio', params: {} }; // estado de la interfaz (no se guarda)

const VERSION_DATOS = 1;

function estadoInicial() {
  const anio = new Date().getFullYear();
  return {
    version: VERSION_DATOS,
    config: {
      institucion: '', sede: '', municipio: '', docente: '', coordinador: '', anio,
      escalaMin: 1, escalaMax: 5, notaAprobacion: 3, decimales: 1, faltanteComoMinima: false,
      desempenos: [
        { nombre: 'Bajo', desde: 1.0, hasta: 2.9 },
        { nombre: 'Básico', desde: 3.0, hasta: 3.9 },
        { nombre: 'Alto', desde: 4.0, hasta: 4.5 },
        { nombre: 'Superior', desde: 4.6, hasta: 5.0 },
      ],
      periodos: [
        { id: uid(), nombre: 'Primer periodo', inicio: `${anio}-01-26`, fin: `${anio}-04-03`, peso: 25 },
        { id: uid(), nombre: 'Segundo periodo', inicio: `${anio}-04-13`, fin: `${anio}-06-19`, peso: 25 },
        { id: uid(), nombre: 'Tercer periodo', inicio: `${anio}-07-06`, fin: `${anio}-09-11`, peso: 25 },
        { id: uid(), nombre: 'Cuarto periodo', inicio: `${anio}-09-14`, fin: `${anio}-11-27`, peso: 25 },
      ],
      componentesPorDefecto: null,
      criteriosPorDefecto: [
        { nombre: 'Saber (cognitivo)', peso: 40 },
        { nombre: 'Hacer (procedimental)', peso: 40 },
        { nombre: 'Ser (actitudinal)', peso: 20 },
      ],
      ia: { proveedor: 'anthropic', claves: {}, modelos: {}, url: '' },
    },
    areas: [],
    grupos: [],
    alumnos: [],
    planeaciones: [],
    asistencia: {},
    planillas: [],
    notas: {},
    notasRubrica: {},
    rubricas: [],
    eventos: [],
    cronograma: {},
    planesArea: [],
    mallas: [],
    planesPeriodo: [],
    planesAula: [],
    bancoPedagogico: [],
    bancoSemilla: 0,
    bancoEliminados: [],
    plantillas: [],
    planesApoyo: [],
    piar: [],
    instrumentosSemilla: 0,
    instrumentosEliminados: [],
    observaciones: {},
    diario: [],
    pendientes: [],
    pruebas: [],
    alertasOcultas: [],
    comunicadosEnviados: [],
    gamificacion: {},
    fichas: [],
    retro: {},
    pizarras: [],
    papelera: [],
    recuperaciones: {},
    anotaciones: [],
    portafolio: { evidencias: [], reflexiones: {} },
  };
}

// ---------- Utilidades ----------
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function isoLocal(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function hoyISO() { return isoLocal(new Date()); }
function deISO(iso) { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); }
function sumarDias(iso, n) { const d = deISO(iso); d.setDate(d.getDate() + n); return isoLocal(d); }
function difDias(a, b) { return Math.round((deISO(b) - deISO(a)) / 86400000); }
function lunesDe(iso) { const d = deISO(iso); const dia = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dia); return isoLocal(d); }
function fechaCorta(iso) {
  if (!iso) return '';
  return deISO(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fechaLarga(iso) {
  if (!iso) return '';
  return deISO(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}
function porId(lista, id) { return lista.find((x) => x.id === id); }
function normalizar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function csvCelda(v) { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
// Exporta una tabla a Excel (.xlsx) con el membrete básico de la institución
async function exportarExcel(nombre, filas) {
  const r = await api.guardarExcel({ nombre, filas, institucion: S.config.institucion || '', docente: S.config.docente || '', color: (S.config.membrete || {}).color || '#1f4e79' });
  if (r?.ok) aviso('Archivo de Excel creado', 'ok'); else if (r?.error) aviso('No se pudo exportar: ' + r.error, 'error');
}
function aCSV(filas) { return filas.map((f) => f.map(csvCelda).join(';')).join('\r\n'); }

// ---------- Grados ----------
const GRADOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
function nivelDeGrado(g) { g = +g; return g <= 5 ? 'básica primaria' : g <= 9 ? 'básica secundaria' : 'educación media'; }

// ---------- Nombres ----------
function nombreGrupo(g) { return g ? `${g.grado}° – ${g.nombre}` : '(sin grupo)'; }
function nombreGrupoId(id) { return nombreGrupo(porId(S.grupos, id)); }
function nombreArea(id) { const a = porId(S.areas, id); return a ? a.nombre : '(sin área)'; }
function nombrePeriodo(id) { const p = porId(S.config.periodos, id); return p ? p.nombre : ''; }
function nombreAlumno(a) { return `${a.apellidos} ${a.nombres}`.trim(); }
function alumnosDe(grupoId) {
  return S.alumnos.filter((a) => a.grupoId === grupoId && a.activo !== false)
    .sort((x, y) => nombreAlumno(x).localeCompare(nombreAlumno(y), 'es'));
}
function areasDeGrupo(grupoId) {
  const g = porId(S.grupos, grupoId);
  if (!g) return [];
  return (g.areas || []).map((x) => porId(S.areas, x.areaId)).filter(Boolean);
}
function periodoDeFecha(iso) {
  return S.config.periodos.find((p) => p.inicio && p.fin && iso >= p.inicio && iso <= p.fin);
}

// ---------- Notas ----------
function redondear(n) { const f = 10 ** (S.config.decimales ?? 1); return Math.round(n * f) / f; }
function fmtNota(n) { return n == null || isNaN(n) ? '—' : redondear(n).toFixed(S.config.decimales ?? 1); }
function desempeno(n) {
  if (n == null || isNaN(n)) return null;
  const r = redondear(n);
  const d = S.config.desempenos.find((x) => r >= x.desde && r <= x.hasta);
  if (d) return d.nombre;
  return r < S.config.desempenos[0].desde ? S.config.desempenos[0].nombre : S.config.desempenos[S.config.desempenos.length - 1].nombre;
}
function chipDesempeno(n) { const d = desempeno(n); return d ? `<span class="chip ${esc(d)}">${esc(d)}</span>` : ''; }

// ---------- Guardado ----------
// El estado se envía al proceso principal como texto JSON. Las claves de IA van aparte (cifradas) y las imágenes
// de los tableros se guardan en un archivo por tablero, así guardar sigue siendo rápido aunque haya muchos tableros.
let temporizadorGuardado = null;
let cadenaGuardado = Promise.resolve();
let ultimoTextoGuardado = null;
let ultimasClaves = null;
// Estado del año en curso (durante la consulta de un año anterior, S es ese año y no se guarda)
function estadoActual() { return ui.archivo ? ui.archivo.actual : S; }
function textoEstado(E = estadoActual()) {
  const ia = E.config?.ia;
  return JSON.stringify(E, function (k, v) { return k === 'claves' && this === ia ? undefined : v; });
}
// Ejecuta fn sobre el año en curso aunque se esté consultando un año anterior (lo usan las acciones del celular)
function conAnioActual(fn) {
  if (!ui.archivo) return fn();
  const consultado = S;
  S = ui.archivo.actual; ui.archivo.guardandoActual = true;
  try { return fn(); } finally { ui.archivo.actual = S; S = consultado; ui.archivo.guardandoActual = false; }
}
// Pasa a su propio archivo las imágenes de los tableros que aún estén dentro del estado
async function externalizarRecursos() {
  for (const t of estadoActual().pizarras || []) {
    if (!t || t.assets === undefined) continue;
    const a = t.assets;
    await api.guardarRecursosTablero(t.id, a || {});
    if (t.assets === a) delete t.assets; // si cambió mientras se escribía, se guarda en la próxima
  }
}
// Devuelve el cursor al final de un campo tras repintar (si el campo sigue en pantalla)
function reenfocar(selector) { const i = document.querySelector(selector); if (i) { i.focus(); i.setSelectionRange?.(i.value.length, i.value.length); } }
function marcarGuardado(texto) { const el = document.getElementById('estado-guardado'); if (el) el.textContent = texto; }
async function pasoGuardado() {
  try {
    await externalizarRecursos();
    const texto = textoEstado();
    if (texto !== ultimoTextoGuardado) { await api.guardar(texto); ultimoTextoGuardado = texto; }
    const E = estadoActual();
    const claves = JSON.stringify(E.config.ia?.claves || {});
    if (claves !== ultimasClaves) { await api.guardarClaves(E.config.ia?.claves || {}); ultimasClaves = claves; }
    marcarGuardado('Guardado ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
  } catch (e) {
    marcarGuardado('⚠️ Error al guardar');
    aviso('No se pudo guardar: ' + (e.message || e) + '. Revisa el espacio en disco y haz un respaldo.', 'error');
  }
}
// Si quedan cambios pendientes al cerrar la ventana, se guardan de inmediato
window.addEventListener('beforeunload', () => {
  if (typeof S === 'undefined' || !S) return;
  clearTimeout(temporizadorGuardado); temporizadorGuardado = null;
  if (typeof cerrarPapelera === 'function') cerrarPapelera();
  const texto = textoEstado();
  if (texto !== ultimoTextoGuardado) { api.guardarAlCerrar(texto); ultimoTextoGuardado = texto; }
});
function guardar() {
  if (ui.archivo && !ui.archivo.guardandoActual && !ui.archivo.avisado) { ui.archivo.avisado = true; aviso('Estás consultando un año anterior: los cambios que hagas aquí no se guardan.', 'error'); }
  if (typeof cerrarPapelera === 'function' && !ui.archivo) cerrarPapelera();
  clearTimeout(temporizadorGuardado);
  marcarGuardado('Guardando…');
  temporizadorGuardado = setTimeout(() => {
    temporizadorGuardado = null;
    cadenaGuardado = cadenaGuardado.then(pasoGuardado); // los guardados nunca se cruzan
  }, 400);
}
// Reemplaza todos los datos por los de un respaldo (conserva las claves de IA de este equipo si el respaldo no trae)
function aplicarRespaldo(datos) {
  if (ui.archivo) salirDeArchivo(false);
  const claves = S?.config?.ia?.claves || {};
  S = migrar(datos);
  if (!Object.values(S.config.ia.claves || {}).some(Boolean)) S.config.ia.claves = { ...claves };
  aplicarApariencia();
  sembrarBanco();
  migrarPlantillas();
  sembrarInstrumentos();
  guardar(); ir('inicio');
}

// Los identificadores se escriben dentro de los botones (onclick="…('id')"). Si un archivo importado
// (paquete de otro docente, respaldo, año archivado) trae uno con comillas u otros símbolos, podría ejecutar código:
// por eso, al cargar cualquier dato, un id con caracteres no permitidos se reemplaza y una referencia así se vacía.
const ID_SEGURO = /^[A-Za-z0-9_.:-]{1,100}$/;
const GRADO_SEGURO = /^[\w °ºª.-]{0,20}$/;
function sanearIds(o, nivel = 0) {
  if (!o || typeof o !== 'object' || nivel > 40) return 0;
  let n = 0;
  if (Array.isArray(o)) { for (const x of o) n += sanearIds(x, nivel + 1); return n; }
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') {
      if (k === 'id' && !ID_SEGURO.test(v)) { o[k] = uid(); n++; }
      else if (/[a-z]Id$/.test(k) && v !== '' && !ID_SEGURO.test(v)) { o[k] = ''; n++; }
      else if ((k === 'grado' || k === 'gradoOrigen') && !GRADO_SEGURO.test(v)) { o[k] = ''; n++; }
    } else if (Array.isArray(v) && /[a-z]Ids$/.test(k)) {
      const limpio = v.filter((x) => typeof x !== 'string' || ID_SEGURO.test(x));
      if (limpio.length !== v.length) { o[k] = limpio; n++; }
    } else if (v && typeof v === 'object') n += sanearIds(v, nivel + 1);
  }
  return n;
}

function migrar(d) {
  const base = estadoInicial();
  const r = { ...base, ...d, config: { ...base.config, ...(d.config || {}) } };
  for (const k of Object.keys(base)) if (r[k] == null) r[k] = base[k];
  if (!d.config?.ia) r.config.ia = { proveedor: 'anthropic', claves: { anthropic: d.config?.apiKey || '' }, modelos: {}, url: '' };
  delete r.config.apiKey;
  delete r.__recuperado; delete r.__error;
  if (!r.config.ia.claves || typeof r.config.ia.claves !== 'object') r.config.ia.claves = {};
  if (!r.config.componentesPorDefecto) r.config.componentesPorDefecto = structuredClone(COMPONENTES_POR_DEFECTO);
  sanearIds(r);
  r.version = VERSION_DATOS;
  return r;
}

// ---------- Avisos y modales ----------
function aviso(texto, tipo = '') {
  const el = document.createElement('div');
  el.className = 'aviso ' + tipo;
  el.textContent = texto;
  document.getElementById('avisos').appendChild(el);
  setTimeout(() => el.remove(), tipo === 'error' ? 6000 : 3200);
}

function abrirModal(html, { ancho = false } = {}) {
  const m = document.getElementById('modal');
  m.className = ancho ? 'ancho' : '';
  m.innerHTML = html;
  document.getElementById('modal-fondo').classList.remove('oculto');
  const primero = m.querySelector('input, select, textarea');
  if (primero) setTimeout(() => { if (!m.contains(document.activeElement)) primero.focus(); }, 30);
}
function cerrarModal() { document.getElementById('modal-fondo').classList.add('oculto'); document.getElementById('modal').innerHTML = ''; }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

let resolverConfirmacion = null;
// Si se confirma un borrado, lo eliminado va a la papelera (ver papelera.js). Se puede forzar con { papelera: true/false }.
function confirmar(texto, { boton = 'Eliminar', peligro = true, papelera } = {}) {
  const aPapelera = papelera ?? (peligro && /eliminar|vaciar|reiniciar|retirar|borrar|quitar/i.test(boton));
  return new Promise((res) => {
    resolverConfirmacion = (v) => {
      if (v && aPapelera && typeof iniciarPapelera === 'function') iniciarPapelera(String(texto).replace(/^¿/, '').split('?')[0].trim());
      res(v);
    };
    abrirModal(`<h2>Confirmar</h2><p>${esc(texto)}</p>
      <div class="botones"><button class="btn" onclick="responderConfirmacion(false)">Cancelar</button>
      <button class="btn ${peligro ? 'peligro' : 'primario'}" onclick="responderConfirmacion(true)">${esc(boton)}</button></div>`);
  });
}
function responderConfirmacion(v) { cerrarModal(); if (resolverConfirmacion) resolverConfirmacion(v); resolverConfirmacion = null; }

// ---------- IA ----------
const PROVEEDORES_IA = {
  anthropic: { nombre: 'Claude (Anthropic)', modelo: 'claude-opus-5-5', donde: 'console.anthropic.com', ph: 'sk-ant-...' },
  openai: { nombre: 'ChatGPT (OpenAI)', modelo: 'gpt-5-mini', donde: 'platform.openai.com', ph: 'sk-...' },
  gemini: { nombre: 'Gemini (Google)', modelo: 'gemini-2.5-flash', donde: 'aistudio.google.com', ph: 'AIza...' },
  compatible: { nombre: 'Otro compatible con OpenAI', modelo: '', donde: 'DeepSeek, Groq, OpenRouter, Ollama (local), LM Studio…', ph: '(opcional en servicios locales)' },
};
function iaLista() {
  const ia = S.config.ia || {};
  const p = ia.proveedor || 'anthropic';
  return p === 'compatible' ? !!(ia.url && ia.modelos?.compatible) : !!ia.claves?.[p];
}
function nombreIA() { return PROVEEDORES_IA[S.config.ia?.proveedor || 'anthropic'].nombre; }
function sinIA() {
  if (iaLista()) return false;
  abrirModal(`<h2>✨ Sugerencias con IA</h2>
    <p>Para usar las sugerencias con inteligencia artificial elige un proveedor (Claude, ChatGPT, Gemini u otro compatible) y pega tu clave de API en
    <b>Configuración → Inteligencia artificial</b>. Normalmente requiere internet y tiene un costo según el uso del proveedor.</p>
    <p class="ayuda">El resto de la aplicación funciona sin internet.</p>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn primario" onclick="cerrarModal();ir('configuracion')">Ir a Configuración</button></div>`);
  return true;
}

// ---------- Opciones de selects ----------
function opciones(lista, seleccionado, { vacio = null, valor = (x) => x.id, texto = (x) => x.nombre } = {}) {
  let html = vacio != null ? `<option value="">${esc(vacio)}</option>` : '';
  for (const x of lista) {
    const v = valor(x);
    html += `<option value="${esc(v)}" ${v === seleccionado ? 'selected' : ''}>${esc(texto(x))}</option>`;
  }
  return html;
}
function opcionesGrupos(sel, vacio) { return opciones([...S.grupos].sort(ordenGrupos), sel, { vacio, texto: nombreGrupo }); }
function opcionesAreas(sel, vacio, lista = S.areas) { return opciones(lista, sel, { vacio }); }
function opcionesPeriodos(sel, vacio) { return opciones(S.config.periodos, sel, { vacio }); }
function ordenGrupos(a, b) { return (a.grado - b.grado) || String(a.nombre).localeCompare(String(b.nombre), 'es', { numeric: true }); }

// ---------- Navegación ----------
const VISTAS = [
  { id: 'inicio', ico: '🏠', nombre: 'Inicio' },
  { id: 'curricular', ico: '🧩', nombre: 'Planeación curricular' },
  { id: 'planeaciones', ico: '📝', nombre: 'Planeaciones de clase' },
  { id: 'plantillas', ico: '📋', nombre: 'Plantillas de planeación' },
  { id: 'banco', ico: '🗂️', nombre: 'Banco de planeaciones' },
  { id: 'bancoPedagogico', ico: '📚', nombre: 'Banco pedagógico' },
  { id: 'pruebas', ico: '🧪', nombre: 'Pruebas y talleres' },
  { id: 'fichas', ico: '🧩', nombre: 'Fichas imprimibles' },
  { id: 'aula', ico: '🎲', nombre: 'Herramientas de aula' },
  { id: 'pizarras', ico: '🖍️', nombre: 'Tableros (pizarra)' },
  { id: 'gamificacion', ico: '🏆', nombre: 'Gamificación' },
  { id: 'calendario', ico: '📅', nombre: 'Calendario' },
  { id: 'horario', ico: '🕒', nombre: 'Mi horario' },
  { id: 'cronograma', ico: '🧭', nombre: 'Cronograma' },
  { id: 'grupos', ico: '👥', nombre: 'Grupos y alumnos' },
  { id: 'piar', ico: '🤝', nombre: 'Inclusión (PIAR)' },
  { id: 'diario', ico: '📓', nombre: 'Diario de campo' },
  { id: 'asistencia', ico: '✅', nombre: 'Asistencia' },
  { id: 'calificaciones', ico: '📊', nombre: 'Evaluación y notas' },
  { id: 'seguimiento', ico: '📈', nombre: 'Seguimiento del estudiante' },
  { id: 'comunicados', ico: '✉️', nombre: 'Comunicados a padres' },
  { id: 'anios', ico: '🗄️', nombre: 'Años anteriores' },
  { id: 'portafolio', ico: '🎓', nombre: 'Portafolio docente' },
  { id: 'papelera', ico: '🗑️', nombre: 'Papelera' },
  { id: 'configuracion', ico: '⚙️', nombre: 'Configuración' },
];

function ir(vista, params = {}) {
  if (vista === 'aula') { abrirAula(); return; } // se abre encima, en pantalla completa
  if (vista !== 'pizarra') ui.enfoque = false;
  ui.vista = vista;
  ui.params = params;
  render();
  document.getElementById('contenido').scrollTop = 0;
}

// Menú lateral plegable. Se recuerda por separado si está oculto en los tableros (pizarra) y en el resto de la app.
// En un tablero, el "modo enfoque" oculta además la barra superior del tablero para dejar toda la pantalla a la pizarra.
function claveMenu() { return ui.vista === 'pizarra' ? 'menuOcultoTablero' : 'menuOculto'; }
// Menú compacto (solo íconos): se activa solo en ventanas angostas, salvo que el docente elija otra cosa.
const VENTANA_ANGOSTA = window.matchMedia('(max-width: 1000px)');
VENTANA_ANGOSTA.addEventListener('change', () => aplicarMenu());
function menuCompacto() { return S?.config?.apariencia?.menuCompacto ?? VENTANA_ANGOSTA.matches; }
function alternarCompacto() {
  const ap = (S.config.apariencia ||= {});
  ap.menuCompacto = !menuCompacto();
  guardar(); aplicarMenu();
}
function aplicarMenu() {
  const ap = S?.config?.apariencia || {};
  const compacto = menuCompacto();
  document.body.classList.toggle('menu-compacto', compacto);
  const bc = document.getElementById('boton-compacto');
  if (bc) { bc.textContent = compacto ? '⇥' : '⇤'; bc.title = compacto ? 'Menú completo (con nombres)' : 'Menú compacto (solo íconos)'; }
  const tablero = ui.vista === 'pizarra';
  const enfoque = tablero && !!ui.enfoque;
  document.body.classList.toggle('en-tablero', tablero);
  document.body.classList.toggle('enfoque', enfoque);
  document.body.classList.toggle('menu-oculto', enfoque || !!ap[claveMenu()]);
  const b = document.getElementById('pz-boton-menu');
  if (b) b.title = (document.body.classList.contains('menu-oculto') ? 'Mostrar' : 'Ocultar') + ' el menú lateral (Ctrl + B)';
}
function alternarBarraLateral() {
  const ap = (S.config.apariencia ||= {}), k = claveMenu();
  if (ui.enfoque) { ui.enfoque = false; ap[k] = false; } else ap[k] = !ap[k];
  guardar(); aplicarMenu();
}
function alternarEnfoque() {
  if (ui.vista !== 'pizarra') return;
  ui.enfoque = !ui.enfoque; aplicarMenu();
  if (ui.enfoque) aviso('Modo enfoque: usa el botón de arriba o Ctrl + Shift + B para salir.');
}
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== 'b' || !S) return;
  e.preventDefault();
  if (e.shiftKey) alternarEnfoque(); else alternarBarraLateral();
});

// Menú lateral personalizable: orden y módulos ocultos
const VISTAS_FIJAS = ['inicio', 'configuracion'];
function vistasMenu(incluirOcultas = false) {
  const m = S.config.menu || {};
  const orden = (m.orden || []).filter((id) => VISTAS.some((v) => v.id === id));
  const lista = [...orden.map((id) => VISTAS.find((v) => v.id === id)), ...VISTAS.filter((v) => !orden.includes(v.id))];
  const ocultos = new Set(m.ocultos || []);
  return incluirOcultas ? lista : lista.filter((v) => VISTAS_FIJAS.includes(v.id) || !ocultos.has(v.id));
}
function vistaVisible(id) { return !(S.config.menu?.ocultos || []).includes(id); }
function renderNav() {
  const insignia = typeof numeroAlertas === 'function' ? numeroAlertas() : 0;
  document.getElementById('nav').innerHTML = vistasMenu().map((v) =>
    `<button class="${ui.vista === v.id || (ui.vista === 'editor' && v.id === 'planeaciones') || ((ui.vista === 'alumnos' || ui.vista === 'perfil') && v.id === 'grupos') || (ui.vista === 'piarEditor' && v.id === 'piar') || (ui.vista === 'pruebaEditor' && v.id === 'pruebas') || (ui.vista === 'pizarra' && v.id === 'pizarras') ? 'activo' : ''}" onclick="ir('${v.id}')" title="${esc(v.nombre)}"><span class="ico">${v.ico}</span><span class="nom">${v.nombre}</span>${v.id === 'inicio' && insignia ? `<span class="insignia" title="Alertas y pendientes">${insignia}</span>` : ''}</button>`
  ).join('');
  document.getElementById('marca-sub').textContent = S.config.institucion || 'Educación básica y media';
}

const RENDERS = {};
function render() {
  renderNav();
  const fn = RENDERS[ui.vista] || RENDERS.inicio;
  document.getElementById('contenido').innerHTML = (ui.archivo ? bandaArchivo() : '') + fn(ui.params);
  aplicarMenu();
  if (RENDERS[ui.vista + '_despues']) RENDERS[ui.vista + '_despues'](ui.params);
}

// ---------- Inicio ----------
RENDERS.inicio = () => {
  const c = S.config;
  const hoy = hoyISO();
  const limite = sumarDias(hoy, 7);
  const proximas = [];
  for (const p of S.planeaciones) {
    for (const s of p.sesiones || []) {
      if (s.fecha && s.fecha >= hoy && s.fecha <= limite) proximas.push({ p, s });
    }
  }
  proximas.sort((a, b) => a.s.fecha.localeCompare(b.s.fecha));
  const eventos = S.eventos.filter((e) => (e.fechaFin || e.fecha) >= hoy && e.fecha <= sumarDias(hoy, 30)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const periodo = periodoDeFecha(hoy);
  const borradores = S.planeaciones.filter((p) => p.estado !== 'terminada').length;
  const configurado = c.institucion && c.docente;

  return `
  <div class="cabecera"><div>
    <h1>${c.docente ? '¡Hola, ' + esc(c.docente.split(' ')[0]) + '!' : 'Bienvenido(a) al Planeador Docente'}</h1>
    <p class="sub">${esc(fechaLarga(hoy))}${periodo ? ' · ' + esc(periodo.nombre) : ''}${c.institucion ? ' · ' + esc(c.institucion) : ''}</p>
  </div><div class="acciones">
    <button class="btn primario" onclick="nuevaPlaneacion()">＋ Nueva planeación</button>
    <button class="btn" onclick="ir('asistencia')">✅ Tomar asistencia</button>
    <button class="btn" onclick="abrirAula()">🎲 Herramientas de aula</button>
    <button class="btn" onclick="ir('pizarras')">🖍️ Tableros</button>
  </div></div>

  ${!configurado ? `<div class="alerta info"><b>Primeros pasos:</b> 1) Completa los datos en <a href="#" onclick="ir('configuracion')">Configuración</a> (institución, docente, periodos).
    2) Crea tus <a href="#" onclick="ir('grupos')">áreas, grupos y alumnos</a>. 3) Arma tu <a href="#" onclick="ir('curricular')">planeación curricular</a> (plan de área y malla). 4) ¡Planea tus clases!</div>` : ''}

  <div class="estadisticas">
    <div class="estadistica"><div class="num">${S.grupos.length}</div><div class="eti">Grupos</div></div>
    <div class="estadistica"><div class="num">${S.alumnos.filter((a) => a.activo !== false).length}</div><div class="eti">Estudiantes</div></div>
    <div class="estadistica"><div class="num">${S.planeaciones.length}</div><div class="eti">Planeaciones</div></div>
    <div class="estadistica"><div class="num">${borradores}</div><div class="eti">En borrador</div></div>
    <div class="estadistica"><div class="num">${S.planeaciones.filter((p) => p.enBanco).length}</div><div class="eti">En el banco</div></div>
  </div>

  ${tarjetaAlertas()}

  ${tarjetaClasesHoy()}

  <div class="rejilla r2">
    <div class="tarjeta"><h2>Clases de los próximos 7 días</h2>
      ${proximas.length ? `<ul class="lista-simple">${proximas.slice(0, 12).map(({ p, s }) => `
        <li><div><b>${esc(fechaLarga(s.fecha))}</b> · ${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))}<br>
        <span class="ayuda">${esc(s.titulo || p.titulo || 'Sin título')}</span></div>
        <button class="btn pequeno" onclick="editarPlaneacion('${p.id}')">Abrir</button></li>`).join('')}</ul>`
        : '<p class="ayuda">No hay clases planeadas para esta semana.</p>'}
    </div>
    <div class="tarjeta"><h2>Próximos eventos (30 días)</h2>
      ${eventos.length ? `<ul class="lista-simple">${eventos.map((e) => `<li><div><span class="item ${esc(e.tipo)}" style="display:inline-block">${esc(TIPOS_EVENTO[e.tipo] || e.tipo)}</span> <b>${esc(e.titulo)}</b></div><span class="ayuda">${esc(fechaCorta(e.fecha))}${e.fechaFin && e.fechaFin !== e.fecha ? ' – ' + esc(fechaCorta(e.fechaFin)) : ''}</span></li>`).join('')}</ul>`
        : '<p class="ayuda">Sin eventos. Agrégalos desde el <a href="#" onclick="ir(\'calendario\')">Calendario</a>.</p>'}
    </div>
  </div>`;
};

// ---------- Arranque ----------
async function iniciar() {
  const datos = await api.cargar();
  if (datos && datos.__bloqueado) { await refrescarEstadoAcceso(); mostrarBloqueo(iniciar); return; }
  refrescarEstadoAcceso();
  if (datos && datos.__error) {
    S = estadoInicial();
    render();
    aviso(datos.__error + ' Puedes restaurar un respaldo desde Configuración.', 'error');
    ir('configuracion');
    return;
  }
  const recuperado = datos?.__recuperado;
  S = migrar(datos || estadoInicial());
  ultimasClaves = JSON.stringify(S.config.ia.claves || {});
  sembrarBanco();
  sembrarInstrumentos();
  migrarPlantillas();
  aplicarApariencia();
  if (S.config.apariencia?.ortografia === false) api.ortografia(false);
  purgarPapelera();
  if (S.config.nube?.carpeta) api.configurarNube(S.config.nube.carpeta);
  if (S.config.actualizaciones?.auto !== false) setTimeout(() => buscarActualizaciones(true), 6000);
  guardar();
  if (!datos || (!S.config.configurado && !S.config.institucion)) setTimeout(abrirAsistente, 300);
  render();
  if (recuperado) {
    abrirModal(`<h2>🛟 Datos recuperados</h2>
      <p>El archivo de datos estaba dañado (posiblemente por un apagón o un cierre inesperado). Se cargó automáticamente el respaldo
      <b>${esc(recuperado.desde)}</b>. Revisa que tus últimos cambios estén; si falta algo, en <b>Configuración → Respaldos automáticos</b> hay otros puntos de restauración.</p>
      <p class="ayuda">Se guardó una copia del archivo dañado como ${esc(recuperado.danado)} en la carpeta de datos.</p>
      <div class="botones"><button class="btn primario" onclick="cerrarModal()">Entendido</button></div>`);
  }
  // Limpieza en segundo plano de imágenes de tableros que ya no existen
  setTimeout(() => {
    const ids = (S.pizarras || []).map((t) => t.id);
    for (const e of S.papelera || []) for (const o of e.ops) if (o.ruta?.[0] === 'pizarras' && o.id) ids.push(o.id);
    api.limpiarRecursosTableros(ids).catch(() => {});
  }, 15000);
  iniciarCelular();
}
