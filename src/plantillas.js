// ================= Plantillas de planeación por grado o grupo =================
// Una plantilla guarda los datos que se repiten en cada planeación de un grado o grupo
// (identificación, diversidad del aula, fundamentación general…). Al crear una planeación
// se aplica automáticamente la plantilla más específica: grupo + área > grupo > grado + área > grado.

const CAMPOS_PLANTILLA = [
  { sec: 'Identificación', campos: [
    { k: 'duracion', t: 'Duración', ph: 'Ej.: 2 horas académicas', linea: true },
    { k: 'minutosSesion', t: 'Minutos por sesión', ph: '55', linea: true, num: true },
    { k: 'numEstudiantes', t: 'Número de estudiantes', ph: 'Se calcula del grupo si lo dejas vacío', linea: true, num: true },
    { k: 'locativos', t: 'Locativos', ph: 'Ej.: Aula de clase y/o sala de cómputo', linea: true },
    { k: 'recursos', t: 'Recursos', ph: 'Ej.: PC (docente), proyector, tablero, marcadores', linea: true },
  ] },
  { sec: 'Diversidad del aula', campos: [
    { k: 'estilos', t: 'Estilos de aprendizaje', ph: 'Cómo aprende mejor el grupo…' },
    { k: 'gustos', t: 'Los gustos', ph: 'Intereses y actividades que motivan al grupo…' },
    { k: 'caracteristicas', t: 'Características del grupo, dificultades y barreras para el aprendizaje y la participación', ph: 'Atención, convivencia, lectura, ritmos, barreras…' },
    { k: 'ajustes', t: 'Ajustes y apoyos', ph: '• Rutinas claras\n• Instrucciones de una en una…', banco: true },
  ] },
  { sec: 'Fundamentación y evaluación (opcional)', campos: [
    { k: 'componentes', t: 'Componentes del área' },
    { k: 'competencias', t: 'Competencias' },
    { k: 'tme', t: 'Métodos, técnicas y estrategias', banco: true },
    { k: 'evaluacion', t: 'Técnicas e instrumentos de evaluación', banco: true },
    { k: 'bibliografia', t: 'Bibliografía y/o cibergrafía' },
  ] },
];
const CLAVES_PLANTILLA = CAMPOS_PLANTILLA.flatMap((s) => s.campos.map((c) => c.k));

function nuevaPlantilla(datos = {}) {
  const p = { id: uid(), nombre: '', alcance: 'grado', grado: 6, grupoId: '', areaId: '', tipoPlan: 'sesion' };
  CLAVES_PLANTILLA.forEach((k) => { p[k] = ''; });
  return Object.assign(p, datos);
}
function descripcionAlcance(t) {
  const quien = t.alcance === 'grupo' ? `Grupo ${nombreGrupoId(t.grupoId)}` : `Grado ${t.grado}°`;
  return quien + (t.areaId ? ` · ${nombreArea(t.areaId)}` : ' · todas las áreas');
}
function nombrePlantilla(t) { return t.nombre || descripcionAlcance(t); }

// Convierte el antiguo "perfil de diversidad" de cada grupo en una plantilla de grupo
function migrarPlantillas() {
  S.plantillas ||= [];
  for (const g of S.grupos) {
    if (!g.diversidad || !Object.values(g.diversidad).some(Boolean)) continue;
    if (!S.plantillas.some((t) => t.alcance === 'grupo' && t.grupoId === g.id && !t.areaId)) {
      S.plantillas.push(nuevaPlantilla({ nombre: `Plantilla ${nombreGrupo(g)}`, alcance: 'grupo', grupoId: g.id, grado: g.grado, ...g.diversidad }));
    }
    delete g.diversidad;
  }
}

// La plantilla más específica para un grupo y un área
function plantillasPara(grupoId, areaId) {
  const g = porId(S.grupos, grupoId);
  const puntaje = (t) => {
    if (t.areaId && t.areaId !== areaId) return -1;
    if (t.alcance === 'grupo') return t.grupoId === grupoId ? (t.areaId ? 4 : 3) : -1;
    return g && +t.grado === +g.grado ? (t.areaId ? 2 : 1) : -1;
  };
  return S.plantillas.map((t) => ({ t, s: puntaje(t) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s).map((x) => x.t);
}
function plantillaSugerida(grupoId, areaId) { return plantillasPara(grupoId, areaId)[0] || null; }

function aplicarPlantilla(p, t, reemplazar = false) {
  if (!t) return 0;
  let n = 0;
  for (const k of CLAVES_PLANTILLA) {
    if (k === 'minutosSesion' || k === 'numEstudiantes') continue;
    if (t[k] && (reemplazar || !p[k])) { p[k] = t[k]; n++; }
  }
  if (+t.minutosSesion) (p.sesiones || []).forEach((s) => { if (reemplazar || !s.duracion || s.duracion === 55) s.duracion = +t.minutosSesion; });
  if (+t.numEstudiantes) p.numEstudiantes = +t.numEstudiantes;
  p.plantillaId = t.id;
  return n;
}
function numEstudiantesPlan(p) {
  const n = p.grupoId ? alumnosDe(p.grupoId).length : 0;
  return n || +p.numEstudiantes || '';
}

// ---------- Vista ----------
RENDERS.plantillas = () => {
  const lista = [...S.plantillas].sort((a, b) => (+a.grado - +b.grado) || nombrePlantilla(a).localeCompare(nombrePlantilla(b), 'es'));
  return `
  <div class="cabecera"><div><h1>Plantillas de planeación</h1>
    <p class="sub">Define una vez por grado o por grupo la identificación, el número de estudiantes, la duración, los gustos, estilos de aprendizaje y ajustes. Cada planeación nueva de ese grado o grupo empezará ya con esos datos.</p></div>
    <div class="acciones"><button class="btn" onclick="ir('planeaciones')">← Planeaciones</button>
      ${S.grupos.length ? `<button class="btn" onclick="crearPlantillasPorGrado()" title="Crea una plantilla vacía por cada grado de tus grupos que aún no tenga">＋ Una por cada grado</button>` : ''}
      <button class="btn primario" onclick="editarPlantilla()">＋ Nueva plantilla</button></div></div>
  ${lista.length ? `<div class="banco">${lista.map((t) => {
    const usos = S.planeaciones.filter((p) => p.plantillaId === t.id).length;
    return `<div class="tarjeta">
      <div><span class="chip ${t.alcance === 'grupo' ? 'sesion' : 'semanal'}">${t.alcance === 'grupo' ? 'Por grupo' : 'Por grado'}</span> <span class="chip">${esc(descripcionAlcance(t))}</span></div>
      <div class="tit">${esc(nombrePlantilla(t))}</div>
      <div class="ayuda">${[t.duracion, t.numEstudiantes ? t.numEstudiantes + ' estudiantes' : (t.alcance === 'grupo' ? alumnosDe(t.grupoId).length + ' estudiantes' : ''), t.locativos].filter(Boolean).map(esc).join(' · ')}</div>
      <div class="ayuda">${esc((t.gustos || t.estilos || '').slice(0, 140))}</div>
      <div class="pie"><button class="btn pequeno primario" onclick="editarPlantilla('${t.id}')">✏️ Editar</button>
        <button class="btn pequeno" onclick="duplicarPlantilla('${t.id}')">📑 Duplicar</button>
        <button class="btn pequeno peligro" onclick="eliminarPlantilla('${t.id}')">🗑️</button>
        ${usos ? `<span class="ayuda">Usada en ${usos} planeación(es)</span>` : ''}</div>
    </div>`;
  }).join('')}</div>`
    : `<div class="tarjeta vacio"><div class="grande">📋</div>Aún no tienes plantillas.<br>Crea una por cada grado (por ejemplo, "Sexto") o por cada grupo (por ejemplo, "601").<br><br>
      <button class="btn primario" onclick="editarPlantilla()">＋ Crear la primera plantilla</button>
</div>`}`;
};

function crearPlantillasPorGrado() {
  const nombres = { 1: 'Primero', 2: 'Segundo', 3: 'Tercero', 4: 'Cuarto', 5: 'Quinto', 6: 'Sexto', 7: 'Séptimo', 8: 'Octavo', 9: 'Noveno', 10: 'Décimo', 11: 'Undécimo' };
  let n = 0;
  for (const gr of [...new Set(S.grupos.map((g) => +g.grado))].sort((a, b) => a - b)) {
    if (S.plantillas.some((t) => t.alcance === 'grado' && +t.grado === gr && !t.areaId)) continue;
    S.plantillas.push(nuevaPlantilla({ nombre: `Plantilla ${nombres[gr] || gr + '°'}`, alcance: 'grado', grado: gr }));
    n++;
  }
  guardar(); render();
  aviso(`Se crearon ${n} plantilla(s). Complétalas con los datos de cada grado.`, 'ok');
}

let plantillaEnEdicion = null;
function editarPlantilla(id, datos) {
  plantillaEnEdicion = id ? structuredClone(porId(S.plantillas, id)) : nuevaPlantilla(datos || {});
  dibujarEditorPlantilla();
}
function dibujarEditorPlantilla() {
  const t = plantillaEnEdicion;
  const grupos = [...S.grupos].sort(ordenGrupos);
  const nGrupo = t.alcance === 'grupo' && t.grupoId ? alumnosDe(t.grupoId).length : 0;
  const campo = (c) => {
    const val = esc(t[c.k] || '');
    const ph = c.k === 'numEstudiantes' && nGrupo ? `${nGrupo} (según la lista del grupo)` : c.ph || '';
    const lbl = `${esc(c.t)}${c.banco ? botonBanco('pt-' + c.k) : ''}`;
    return c.linea
      ? `<div class="campo"><label>${lbl}</label><input id="pt-${c.k}" ${c.num ? 'type="number" min="0"' : ''} value="${val}" placeholder="${esc(ph)}" oninput="plantillaEnEdicion['${c.k}']=this.value"></div>`
      : `<div class="campo"><label>${lbl}</label><textarea id="pt-${c.k}" placeholder="${esc(ph)}" oninput="plantillaEnEdicion['${c.k}']=this.value">${val}</textarea></div>`;
  };
  abrirModal(`<h2>${porId(S.plantillas, t.id) ? 'Editar' : 'Nueva'} plantilla de planeación</h2>
    <div class="rejilla r4">
      <div class="campo" style="grid-column: span 2"><label>Nombre</label><input value="${esc(t.nombre)}" placeholder="Ej.: Plantilla Sexto" oninput="plantillaEnEdicion.nombre=this.value"></div>
      <div class="campo"><label>Se aplica a</label><select onchange="plantillaEnEdicion.alcance=this.value;dibujarEditorPlantilla()">
        <option value="grado" ${t.alcance === 'grado' ? 'selected' : ''}>Todo un grado</option><option value="grupo" ${t.alcance === 'grupo' ? 'selected' : ''}>Un grupo</option></select></div>
      ${t.alcance === 'grado'
        ? `<div class="campo"><label>Grado</label><select onchange="plantillaEnEdicion.grado=+this.value">${GRADOS.map((g) => `<option value="${g}" ${+t.grado === g ? 'selected' : ''}>${g}°</option>`).join('')}</select></div>`
        : `<div class="campo"><label>Grupo</label><select onchange="plantillaEnEdicion.grupoId=this.value;plantillaEnEdicion.grado=(porId(S.grupos,this.value)||{}).grado||plantillaEnEdicion.grado;dibujarEditorPlantilla()">${opciones(grupos, t.grupoId, { vacio: 'Selecciona…', texto: nombreGrupo })}</select></div>`}
      <div class="campo"><label>Área (opcional)</label><select onchange="plantillaEnEdicion.areaId=this.value">${opcionesAreas(t.areaId, 'Todas las áreas')}</select></div>
      <div class="campo"><label>Tipo de planeación por defecto</label><select onchange="plantillaEnEdicion.tipoPlan=this.value">${Object.entries(TIPOS_PLAN).map(([k, v]) => `<option value="${k}" ${t.tipoPlan === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    </div>
    ${CAMPOS_PLANTILLA.map((s) => `<h3>${s.sec}</h3><div class="rejilla ${s.campos.some((c) => c.linea) ? 'r3' : 'r2'}">${s.campos.map(campo).join('')}</div>`).join('')}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarPlantilla()">Guardar plantilla</button></div>`, { ancho: true });
}
function guardarPlantilla() {
  const t = plantillaEnEdicion;
  if (t.alcance === 'grupo' && !t.grupoId) return aviso('Selecciona el grupo', 'error');
  if (t.alcance === 'grupo') t.grado = (porId(S.grupos, t.grupoId) || {}).grado || t.grado;
  const choca = S.plantillas.find((x) => x.id !== t.id && x.alcance === t.alcance && (x.areaId || '') === (t.areaId || '') && (t.alcance === 'grupo' ? x.grupoId === t.grupoId : +x.grado === +t.grado));
  if (choca) return aviso(`Ya existe una plantilla para ${descripcionAlcance(t)}: "${nombrePlantilla(choca)}". Edítala en lugar de crear otra.`, 'error');
  if (!t.nombre.trim()) t.nombre = 'Plantilla ' + descripcionAlcance(t);
  const i = S.plantillas.findIndex((x) => x.id === t.id);
  if (i >= 0) S.plantillas[i] = t; else S.plantillas.push(t);
  guardar(); cerrarModal(); render();
  aviso('Plantilla guardada', 'ok');
}
function duplicarPlantilla(id) {
  const t = structuredClone(porId(S.plantillas, id));
  t.id = uid(); t.nombre += ' (copia)';
  if (t.alcance === 'grado') t.grado = Math.min(11, +t.grado + 1);
  editarPlantilla(null, t);
  plantillaEnEdicion.id = t.id;
}
async function eliminarPlantilla(id) {
  if (!(await confirmar(`¿Eliminar la plantilla "${nombrePlantilla(porId(S.plantillas, id))}"? Las planeaciones ya creadas no cambian.`))) return;
  S.plantillas = S.plantillas.filter((t) => t.id !== id);
  guardar(); render();
}

// ---------- Desde el editor de una planeación ----------
function dialogoAplicarPlantilla(planId) {
  const p = porId(S.planeaciones, planId);
  const sug = plantillasPara(p.grupoId, p.areaId);
  const otras = S.plantillas.filter((t) => !sug.includes(t));
  if (!S.plantillas.length) {
    abrirModal(`<h2>Plantillas</h2><p>Aún no tienes plantillas. Puedes crear una a partir de esta planeación con <b>"Guardar como plantilla"</b>.</p>
      <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button></div>`);
    return;
  }
  abrirModal(`<h2>Aplicar una plantilla</h2>
    <div class="campo"><label>Plantilla</label><select id="m-pt">
      ${sug.length ? `<optgroup label="Para este grupo y área">${sug.map((t) => `<option value="${t.id}">${esc(nombrePlantilla(t))} — ${esc(descripcionAlcance(t))}</option>`).join('')}</optgroup>` : ''}
      ${otras.length ? `<optgroup label="Otras">${otras.map((t) => `<option value="${t.id}">${esc(nombrePlantilla(t))} — ${esc(descripcionAlcance(t))}</option>`).join('')}</optgroup>` : ''}
    </select></div>
    <div class="campo"><label><input type="checkbox" id="m-pt-reemplazar"> Reemplazar lo que ya está escrito (si no, solo se llenan los campos vacíos)</label></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="ejecutarAplicarPlantilla('${planId}')">Aplicar</button></div>`);
}
function ejecutarAplicarPlantilla(planId) {
  const p = porId(S.planeaciones, planId);
  const n = aplicarPlantilla(p, porId(S.plantillas, document.getElementById('m-pt').value), document.getElementById('m-pt-reemplazar').checked);
  tocarPlan(p); cerrarModal(); render();
  aviso(`Plantilla aplicada (${n} campo(s))`, 'ok');
}
function guardarComoPlantilla(planId) {
  const p = porId(S.planeaciones, planId);
  const g = porId(S.grupos, p.grupoId);
  const existente = p.plantillaId && porId(S.plantillas, p.plantillaId);
  const base = existente ? structuredClone(existente) : nuevaPlantilla({
    alcance: g ? 'grupo' : 'grado', grupoId: g ? g.id : '', grado: g ? g.grado : (p.gradoOrigen || 6),
    nombre: g ? `Plantilla ${nombreGrupo(g)}` : '', tipoPlan: p.tipo,
  });
  CLAVES_PLANTILLA.forEach((k) => { if (k !== 'minutosSesion' && k !== 'numEstudiantes' && p[k]) base[k] = p[k]; });
  if (p.sesiones?.[0]?.duracion) base.minutosSesion = p.sesiones[0].duracion;
  editarPlantilla(null, base);
  plantillaEnEdicion.id = base.id;
}
