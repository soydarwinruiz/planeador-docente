// ================= Papelera: lo que se elimina se puede recuperar durante 30 días =================
// Funciona en todos los módulos sin tocar cada uno: al confirmar un borrado se toma una "foto" de los datos;
// en el siguiente guardado se compara con lo que quedó y se guarda en S.papelera solo lo que desapareció o cambió
// (por ejemplo, un grupo con sus estudiantes, asistencia y notas). Recuperar vuelve a poner eso en su sitio
// sin tocar lo que se hizo después en el resto de la app.

const PAPELERA_DIAS = 30;
const PAPELERA_MAX = 200;
let papeleraPendiente = null;

// Nombres legibles de las colecciones de datos, para describir el contenido de cada elemento de la papelera
const PAPELERA_NOMBRES = {
  areas: 'áreas', grupos: 'grupos', alumnos: 'estudiantes', planeaciones: 'planeaciones', asistencia: 'asistencia',
  planillas: 'programaciones de evaluación', notas: 'calificaciones', notasRubrica: 'calificaciones con rúbrica', rubricas: 'instrumentos de evaluación',
  eventos: 'eventos del calendario', cronograma: 'cronograma', planesArea: 'planes de área', mallas: 'mallas curriculares',
  planesPeriodo: 'planes de periodo', planesAula: 'planes de aula', bancoPedagogico: 'banco pedagógico', plantillas: 'plantillas',
  planesApoyo: 'planes de apoyo', piar: 'PIAR', observaciones: 'observaciones', diario: 'diario de campo', pendientes: 'pendientes',
  pruebas: 'pruebas y talleres', gamificacion: 'gamificación', fichas: 'fichas', retro: 'retroalimentación', pizarras: 'tableros',
  config: 'configuración', horario: 'horario', comunicadosEnviados: 'comunicados',
  recuperaciones: 'recuperaciones', anotaciones: 'anotaciones', portafolio: 'portafolio',
};

function textoSinPapelera(estado) { return JSON.stringify(estado, (k, v) => (k === 'papelera' ? undefined : v)); }

// Se llama justo antes de borrar. confirmar() lo hace solo; las acciones que borran sin preguntar lo llaman a mano.
function iniciarPapelera(etiqueta) {
  if (!S) return;
  papeleraPendiente = { etiqueta: String(etiqueta || 'Elemento eliminado'), antes: JSON.parse(textoSinPapelera(S)) };
  // Por si la acción no llega a guardar enseguida
  setTimeout(() => cerrarPapelera(), 1500);
}
function cancelarPapelera() { papeleraPendiente = null; }

// Compara la foto con el estado actual y guarda las diferencias. guardar() la llama en cada guardado.
function cerrarPapelera() {
  const p = papeleraPendiente;
  if (!p || !S) return;
  papeleraPendiente = null;
  const ops = [];
  for (const k of Object.keys(p.antes)) {
    if (k === 'papelera') continue;
    if (!(k in S)) { ops.push({ op: 'agregar', ruta: [], clave: k, valor: p.antes[k] }); continue; }
    if (JSON.stringify(p.antes[k]) === JSON.stringify(S[k])) continue;
    difPapelera(p.antes[k], S[k], [k], ops);
  }
  if (!ops.length) return;
  (S.papelera ||= []).unshift({ id: uid(), fecha: new Date().toISOString(), etiqueta: p.etiqueta, ops });
  if (S.papelera.length > PAPELERA_MAX) S.papelera.length = PAPELERA_MAX;
  avisoPapelera(S.papelera[0].id);
}

const esObjetoPlano = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const conIds = (lista) => lista.every((x) => esObjetoPlano(x) && x.id != null);

// Registra lo que había en "a" y ya no está (o cambió) en "b". Solo guarda lo necesario para deshacer el borrado.
function difPapelera(a, b, ruta, ops) {
  if (a === b) return;
  if (Array.isArray(a) && Array.isArray(b) && a.length && conIds(a) && conIds(b)) {
    const enB = new Map(b.map((x) => [x.id, x]));
    a.forEach((x, i) => {
      const y = enB.get(x.id);
      if (!y) ops.push({ op: 'agregar', ruta, id: x.id, indice: i, valor: x });
      else if (JSON.stringify(x) !== JSON.stringify(y)) difPapelera(x, y, [...ruta, { id: x.id }], ops);
    });
    return;
  }
  if (esObjetoPlano(a) && esObjetoPlano(b)) {
    for (const k of Object.keys(a)) {
      if (!(k in b)) ops.push({ op: 'agregar', ruta, clave: k, valor: a[k] });
      else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) difPapelera(a[k], b[k], [...ruta, k], ops);
    }
    return;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) ops.push({ op: 'valor', ruta, antes: a, despues: b });
}

function buscarRuta(ruta) {
  let o = S;
  for (const seg of ruta) {
    if (o == null) return undefined;
    o = typeof seg === 'object' ? (Array.isArray(o) ? o.find((x) => x && x.id === seg.id) : undefined) : o[seg];
  }
  return o;
}
// Completa "destino" con lo que le falte de "origen" (sin pisar lo que ya tiene)
function rellenarFaltantes(destino, origen) {
  for (const k of Object.keys(origen)) {
    if (!(k in destino)) destino[k] = structuredClone(origen[k]);
    else if (esObjetoPlano(destino[k]) && esObjetoPlano(origen[k])) rellenarFaltantes(destino[k], origen[k]);
  }
}

// Devuelve cuántas partes no se pudieron poner de nuevo (porque lo que las contenía ya no existe o cambió después)
function aplicarPapelera(e) {
  let fallidas = 0;
  for (const o of e.ops) {
    if (o.op === 'agregar') {
      const cont = buscarRuta(o.ruta);
      if (o.id != null) {
        if (!Array.isArray(cont)) { fallidas++; continue; }
        if (cont.some((x) => x && x.id === o.id)) continue;
        cont.splice(Math.min(o.indice, cont.length), 0, structuredClone(o.valor));
      } else {
        if (!esObjetoPlano(cont)) { fallidas++; continue; }
        if (!(o.clave in cont)) cont[o.clave] = structuredClone(o.valor);
        else if (esObjetoPlano(cont[o.clave]) && esObjetoPlano(o.valor)) rellenarFaltantes(cont[o.clave], o.valor);
      }
    } else {
      const ultima = o.ruta[o.ruta.length - 1], padre = buscarRuta(o.ruta.slice(0, -1));
      if (padre == null || typeof ultima === 'object') { fallidas++; continue; }
      const actual = padre[ultima];
      if (JSON.stringify(actual) === JSON.stringify(o.despues)) padre[ultima] = structuredClone(o.antes);
      else if (Array.isArray(actual) && Array.isArray(o.antes)) {
        // Lista sin identificadores que cambió después: se vuelven a poner los elementos que falten
        const hay = new Set(actual.map((x) => JSON.stringify(x)));
        o.antes.forEach((x, i) => { if (!hay.has(JSON.stringify(x))) actual.splice(Math.min(i, actual.length), 0, structuredClone(x)); });
      } else fallidas++;
    }
  }
  return fallidas;
}

function purgarPapelera() {
  if (!S?.papelera?.length) return;
  const limite = Date.now() - PAPELERA_DIAS * 86400000;
  const antes = S.papelera.length;
  S.papelera = S.papelera.filter((e) => Date.parse(e.fecha) >= limite);
  if (S.papelera.length !== antes) guardar();
}

function avisoPapelera(id) {
  document.querySelectorAll('.aviso-papelera').forEach((x) => x.remove());
  const el = document.createElement('div');
  el.className = 'aviso aviso-papelera';
  el.innerHTML = `🗑️ Se movió a la papelera. <button class="aviso-accion" onclick="this.parentNode.remove();recuperarPapelera('${id}')">Deshacer</button> <button class="aviso-accion" onclick="this.parentNode.remove();ir('papelera')">Ver papelera</button>`;
  document.getElementById('avisos').appendChild(el);
  setTimeout(() => el.remove(), 7000);
}

function resumenPapelera(e) {
  const cuenta = {};
  for (const o of e.ops) {
    const col = o.ruta.length ? o.ruta[0] : o.clave;
    if (o.ruta.length === 1 && o.id != null) cuenta[col] = (cuenta[col] || 0) + 1;
    else cuenta[col] = cuenta[col] || 0;
  }
  return Object.entries(cuenta).map(([k, n]) => (n > 1 ? `${n} ` : '') + (PAPELERA_NOMBRES[k] || k)).join(' · ');
}

async function recuperarPapelera(id) {
  const e = (S.papelera || []).find((x) => x.id === id);
  if (!e) return;
  const fallidas = aplicarPapelera(e);
  S.papelera = S.papelera.filter((x) => x.id !== id);
  guardar(); render();
  if (fallidas) aviso(`Se recuperó, pero ${fallidas} parte(s) no se pudieron devolver porque lo que las contenía ya no existe o cambió después.`, 'error');
  else aviso('Recuperado', 'ok');
}
async function borrarDePapelera(id) {
  if (!(await confirmar('¿Eliminar definitivamente este elemento de la papelera? Ya no se podrá recuperar.', { papelera: false }))) return;
  S.papelera = S.papelera.filter((x) => x.id !== id);
  guardar(); render();
}
async function vaciarPapelera() {
  if (!(await confirmar('¿Vaciar la papelera? Nada de lo que contiene se podrá recuperar.', { boton: 'Vaciar papelera', papelera: false }))) return;
  S.papelera = [];
  guardar(); render();
}

RENDERS.papelera = () => {
  const lista = S.papelera || [];
  const fechaHora = (iso) => new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const diasRestantes = (iso) => Math.max(0, PAPELERA_DIAS - Math.floor((Date.now() - Date.parse(iso)) / 86400000));
  return `<div class="cabecera"><div><h1>🗑️ Papelera</h1>
    <p class="sub">Lo que eliminas se guarda aquí ${PAPELERA_DIAS} días. Al recuperarlo vuelve a su lugar (por ejemplo, un grupo con sus estudiantes y notas) sin cambiar lo que hiciste después.</p></div>
    <div class="acciones">${lista.length ? '<button class="btn peligro" onclick="vaciarPapelera()">Vaciar papelera</button>' : ''}</div></div>
    ${lista.length ? `<div class="tarjeta"><ul class="lista-simple">${lista.map((e) => `<li><div><b>${esc(e.etiqueta)}</b><br>
      <span class="ayuda">${esc(fechaHora(e.fecha))} · ${esc(resumenPapelera(e))} · se borra en ${diasRestantes(e.fecha)} día(s)</span></div>
      <div class="fila"><button class="btn pequeno primario" onclick="recuperarPapelera('${e.id}')">↩️ Recuperar</button>
      <button class="btn pequeno" onclick="borrarDePapelera('${e.id}')" title="Eliminar definitivamente">✕</button></div></li>`).join('')}</ul></div>`
      : '<div class="tarjeta vacio"><div class="grande">🗑️</div>La papelera está vacía.</div>'}
    <p class="ayuda">La papelera guarda lo que eliminas con los botones de borrar (planeaciones, grupos, estudiantes, notas, actividades, tableros, eventos, etc.). No guarda lo que cambias escribiendo encima de un dato, como una nota que reemplazas por otra; para eso están los <a href="#" onclick="ir('configuracion');return false">respaldos</a>.</p>`;
};
