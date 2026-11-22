// ================= Áreas, grupos y alumnos =================

const AREAS_SUGERIDAS = [
  'Matemáticas', 'Lengua Castellana', 'Inglés', 'Ciencias Naturales y Educación Ambiental', 'Ciencias Sociales',
  'Educación Ética y en Valores Humanos', 'Educación Religiosa', 'Educación Artística', 'Educación Física, Recreación y Deportes',
  'Tecnología e Informática', 'Cátedra de la Paz', 'Emprendimiento',
];

RENDERS.grupos = () => {
  const grupos = [...S.grupos].sort(ordenGrupos);
  return `
  <div class="cabecera"><div><h1>Grupos y alumnos</h1><p class="sub">Registra tus áreas, los grupos donde las dictas y la lista de estudiantes.</p></div></div>
  <div class="rejilla" style="grid-template-columns: 340px 1fr; align-items:start">
    <div class="tarjeta">
      <div class="cabecera"><h2 style="margin:0">Áreas / asignaturas</h2><button class="btn pequeno primario" onclick="editarArea()">＋ Área</button></div>
      ${S.areas.length ? `<ul class="lista-simple">${S.areas.map((a) => `
        <li><div><b>${esc(a.nombre)}</b>${a.abreviatura ? ` <span class="ayuda">(${esc(a.abreviatura)})</span>` : ''}</div>
        <div><button class="icono" title="Editar" onclick="editarArea('${a.id}')">✏️</button><button class="icono" title="Eliminar" onclick="eliminarArea('${a.id}')">🗑️</button></div></li>`).join('')}</ul>`
        : `<p class="ayuda">Aún no hay áreas.</p><button class="btn pequeno" onclick="agregarAreasSugeridas()">Agregar áreas obligatorias (Ley 115)</button>`}
    </div>
    <div class="tarjeta">
      <div class="cabecera"><h2 style="margin:0">Grupos</h2><button class="btn pequeno primario" onclick="editarGrupo()">＋ Grupo</button></div>
      ${grupos.length ? `<table class="tabla"><thead><tr><th>Grupo</th><th>Jornada</th><th>Áreas que dictas (horas/semana)</th><th class="num">Estudiantes</th><th></th></tr></thead><tbody>
      ${grupos.map((g) => `<tr>
        <td><b>${esc(nombreGrupo(g))}</b>${g.director ? '<br><span class="ayuda">Director(a) de grupo</span>' : ''}</td>
        <td>${esc(g.jornada || '')}</td>
        <td>${(g.areas || []).map((x) => `${esc(nombreArea(x.areaId))} <span class="ayuda">(${esc(x.horas || '?')} h)</span>`).join('<br>') || '<span class="ayuda">Sin áreas asignadas</span>'}</td>
        <td class="num">${alumnosDe(g.id).length}</td>
        <td style="white-space:nowrap"><button class="btn pequeno" onclick="ir('alumnos',{grupoId:'${g.id}'})">👥 Alumnos</button>
          <button class="btn pequeno" title="Estilos, gustos, barreras y ajustes del grupo" onclick="editarDiversidadGrupo('${g.id}')">🧠 Diversidad</button>
          <button class="icono" title="Editar" onclick="editarGrupo('${g.id}')">✏️</button>
          <button class="icono" title="Eliminar" onclick="eliminarGrupo('${g.id}')">🗑️</button></td></tr>`).join('')}
      </tbody></table>` : `<div class="vacio"><div class="grande">👥</div>Crea tu primer grupo (por ejemplo 6° – 601).</div>`}
    </div>
  </div>`;
};

function agregarAreasSugeridas() {
  for (const n of AREAS_SUGERIDAS) S.areas.push({ id: uid(), nombre: n, abreviatura: '' });
  guardar(); render();
  aviso('Se agregaron las áreas. Elimina las que no dictas.', 'ok');
}

function editarArea(id) {
  const a = id ? porId(S.areas, id) : { nombre: '', abreviatura: '' };
  abrirModal(`<h2>${id ? 'Editar' : 'Nueva'} área</h2>
    <div class="campo"><label>Nombre del área o asignatura</label><input id="m-nombre" list="areas-sug" value="${esc(a.nombre)}">
    <datalist id="areas-sug">${AREAS_SUGERIDAS.map((n) => `<option value="${esc(n)}">`).join('')}</datalist></div>
    <div class="campo"><label>Abreviatura (opcional)</label><input id="m-abr" value="${esc(a.abreviatura || '')}" maxlength="10"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarArea('${id || ''}')">Guardar</button></div>`);
}
function guardarArea(id) {
  const nombre = document.getElementById('m-nombre').value.trim();
  if (!nombre) return aviso('Escribe el nombre del área', 'error');
  const abreviatura = document.getElementById('m-abr').value.trim();
  if (id) Object.assign(porId(S.areas, id), { nombre, abreviatura });
  else S.areas.push({ id: uid(), nombre, abreviatura });
  guardar(); cerrarModal(); render();
}
async function eliminarArea(id) {
  const usos = S.planeaciones.filter((p) => p.areaId === id).length;
  if (!(await confirmar(`¿Eliminar el área "${nombreArea(id)}"?${usos ? ` Tiene ${usos} planeación(es) que quedarán sin área.` : ''}`))) return;
  S.areas = S.areas.filter((a) => a.id !== id);
  S.grupos.forEach((g) => { g.areas = (g.areas || []).filter((x) => x.areaId !== id); });
  guardar(); render();
}

function editarGrupo(id) {
  const g = id ? porId(S.grupos, id) : { grado: 6, nombre: '', jornada: 'Mañana', director: false, areas: [] };
  const asignadas = Object.fromEntries((g.areas || []).map((x) => [x.areaId, x.horas]));
  abrirModal(`<h2>${id ? 'Editar' : 'Nuevo'} grupo</h2>
    <div class="rejilla r3">
      <div class="campo"><label>Grado</label><select id="m-grado">${[6, 7, 8, 9, 10, 11].map((n) => `<option value="${n}" ${+g.grado === n ? 'selected' : ''}>${n}°</option>`).join('')}</select></div>
      <div class="campo"><label>Nombre del grupo</label><input id="m-nombre" value="${esc(g.nombre)}" placeholder="Ej.: 601, 7A"></div>
      <div class="campo"><label>Jornada</label><select id="m-jornada">${['Mañana', 'Tarde', 'Única', 'Noche', 'Fin de semana'].map((j) => `<option ${g.jornada === j ? 'selected' : ''}>${j}</option>`).join('')}</select></div>
    </div>
    <div class="campo"><label><input type="checkbox" id="m-director" ${g.director ? 'checked' : ''}> Soy director(a) de este grupo</label></div>
    <h3>Áreas que dictas en este grupo</h3>
    ${S.areas.length ? `<table class="tabla"><thead><tr><th></th><th>Área</th><th>Horas semanales</th></tr></thead><tbody>
      ${S.areas.map((a) => `<tr><td><input type="checkbox" class="m-area" value="${a.id}" ${a.id in asignadas ? 'checked' : ''}></td><td>${esc(a.nombre)}</td>
        <td><input type="number" min="1" max="20" id="h-${a.id}" value="${esc(asignadas[a.id] || 4)}" style="width:80px"></td></tr>`).join('')}</tbody></table>`
      : '<p class="alerta">Primero crea las áreas en la columna izquierda.</p>'}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarGrupo('${id || ''}')">Guardar</button></div>`);
}
function guardarGrupo(id) {
  const nombre = document.getElementById('m-nombre').value.trim();
  if (!nombre) return aviso('Escribe el nombre del grupo', 'error');
  const datos = {
    grado: +document.getElementById('m-grado').value,
    nombre,
    jornada: document.getElementById('m-jornada').value,
    director: document.getElementById('m-director').checked,
    areas: [...document.querySelectorAll('.m-area:checked')].map((c) => ({ areaId: c.value, horas: +document.getElementById('h-' + c.value).value || 0 })),
  };
  if (id) Object.assign(porId(S.grupos, id), datos);
  else S.grupos.push({ id: uid(), ...datos });
  guardar(); cerrarModal(); render();
}
async function eliminarGrupo(id) {
  const n = alumnosDe(id).length;
  if (!(await confirmar(`¿Eliminar el grupo ${nombreGrupoId(id)}? Se eliminarán sus ${n} estudiantes, asistencia y notas. Las planeaciones se conservan.`))) return;
  const alumnosIds = new Set(S.alumnos.filter((a) => a.grupoId === id).map((a) => a.id));
  S.grupos = S.grupos.filter((g) => g.id !== id);
  S.alumnos = S.alumnos.filter((a) => a.grupoId !== id);
  for (const k of Object.keys(S.asistencia)) if (k.startsWith(id + '|')) delete S.asistencia[k];
  const planillasBorrar = S.planillas.filter((p) => p.grupoId === id);
  for (const pl of planillasBorrar) for (const c of pl.criterios) for (const a of c.actividades) { delete S.notas[a.id]; delete S.notasRubrica[a.id]; }
  S.planillas = S.planillas.filter((p) => p.grupoId !== id);
  for (const k of Object.keys(S.notas)) for (const al of alumnosIds) delete S.notas[k][al];
  guardar(); render();
}

// ---------- Alumnos ----------
RENDERS.alumnos = ({ grupoId }) => {
  const g = porId(S.grupos, grupoId);
  if (!g) return '<p>Grupo no encontrado.</p>';
  const lista = alumnosDe(grupoId);
  const retirados = S.alumnos.filter((a) => a.grupoId === grupoId && a.activo === false);
  return `
  <div class="cabecera"><div><h1>Estudiantes de ${esc(nombreGrupo(g))}</h1><p class="sub">${lista.length} estudiante(s) activos. Los cambios se guardan automáticamente.</p></div>
  <div class="acciones">
    <button class="btn" onclick="ir('grupos')">← Volver</button>
    <button class="btn" onclick="pegarLista('${grupoId}')">📋 Pegar lista desde Excel</button>
    <button class="btn" onclick="exportarAlumnos('${grupoId}')">⬇️ Exportar a Excel</button>
    <button class="btn primario" onclick="agregarAlumno('${grupoId}')">＋ Estudiante</button>
  </div></div>
  ${lista.length ? `<div class="envoltura-tabla"><table class="tabla"><thead><tr><th class="num">#</th><th>Apellidos</th><th>Nombres</th><th>Documento</th><th class="num">PIAR</th><th>Observaciones / ajustes</th><th></th></tr></thead><tbody>
  ${lista.map((a, i) => `<tr>
    <td class="num">${i + 1}</td>
    <td><input value="${esc(a.apellidos)}" onchange="cambiarAlumno('${a.id}','apellidos',this.value)"></td>
    <td><input value="${esc(a.nombres)}" onchange="cambiarAlumno('${a.id}','nombres',this.value)"></td>
    <td><input value="${esc(a.documento || '')}" onchange="cambiarAlumno('${a.id}','documento',this.value)" style="width:130px"></td>
    <td class="num"><input type="checkbox" ${a.piar ? 'checked' : ''} onchange="cambiarAlumno('${a.id}','piar',this.checked)" title="Estudiante con PIAR"></td>
    <td><input value="${esc(a.observaciones || '')}" onchange="cambiarAlumno('${a.id}','observaciones',this.value)" placeholder="Ej.: diagnóstico, apoyos, acudiente…"></td>
    <td style="white-space:nowrap"><button class="icono" title="Mover a otro grupo" onclick="moverAlumno('${a.id}')">↔️</button><button class="icono" title="Retirar" onclick="retirarAlumno('${a.id}')">🚪</button></td>
  </tr>`).join('')}</tbody></table></div>` : `<div class="tarjeta vacio"><div class="grande">🧑‍🎓</div>Agrega estudiantes uno a uno o pega la lista copiada desde Excel o el SIMAT.</div>`}
  ${retirados.length ? `<h2>Retirados (${retirados.length})</h2><ul class="lista-simple tarjeta">${retirados.map((a) => `<li>${esc(nombreAlumno(a))}<div><button class="btn pequeno" onclick="cambiarAlumno('${a.id}','activo',true);render()">Reintegrar</button> <button class="btn pequeno peligro" onclick="eliminarAlumno('${a.id}')">Eliminar definitivamente</button></div></li>`).join('')}</ul>` : ''}`;
};

function agregarAlumno(grupoId) {
  abrirModal(`<h2>Nuevo estudiante</h2>
    <div class="rejilla r2"><div class="campo"><label>Apellidos</label><input id="m-ape"></div><div class="campo"><label>Nombres</label><input id="m-nom"></div></div>
    <div class="campo"><label>Documento (opcional)</label><input id="m-doc"></div>
    <div class="campo"><label><input type="checkbox" id="m-piar"> Tiene PIAR (Plan Individual de Ajustes Razonables)</label></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn primario" onclick="guardarAlumnoNuevo('${grupoId}')">Guardar y agregar otro</button></div>`);
  document.getElementById('m-nom').addEventListener('keydown', (e) => { if (e.key === 'Enter') guardarAlumnoNuevo(grupoId); });
}
function guardarAlumnoNuevo(grupoId) {
  const apellidos = document.getElementById('m-ape').value.trim();
  const nombres = document.getElementById('m-nom').value.trim();
  if (!apellidos && !nombres) return aviso('Escribe el nombre del estudiante', 'error');
  S.alumnos.push({ id: uid(), grupoId, apellidos, nombres, documento: document.getElementById('m-doc').value.trim(), piar: document.getElementById('m-piar').checked, observaciones: '', activo: true });
  guardar(); render();
  agregarAlumno(grupoId);
  aviso(`${apellidos} ${nombres} agregado(a)`, 'ok');
}
function cambiarAlumno(id, campo, valor) { porId(S.alumnos, id)[campo] = valor; guardar(); }
async function retirarAlumno(id) {
  const a = porId(S.alumnos, id);
  if (!(await confirmar(`¿Marcar a ${nombreAlumno(a)} como retirado(a)? Sus notas y asistencia se conservan.`, { boton: 'Retirar' }))) return;
  a.activo = false; guardar(); render();
}
async function eliminarAlumno(id) {
  const a = porId(S.alumnos, id);
  if (!(await confirmar(`¿Eliminar definitivamente a ${nombreAlumno(a)} con todas sus notas?`))) return;
  S.alumnos = S.alumnos.filter((x) => x.id !== id);
  for (const k of Object.keys(S.notas)) delete S.notas[k][id];
  for (const k of Object.keys(S.notasRubrica)) delete S.notasRubrica[k][id];
  guardar(); render();
}
function moverAlumno(id) {
  const a = porId(S.alumnos, id);
  abrirModal(`<h2>Mover a ${esc(nombreAlumno(a))}</h2>
    <div class="campo"><label>Nuevo grupo</label><select id="m-grupo">${opcionesGrupos(a.grupoId)}</select></div>
    <p class="ayuda">Las notas registradas en el grupo anterior no se trasladan.</p>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="porId(S.alumnos,'${id}').grupoId=document.getElementById('m-grupo').value;guardar();cerrarModal();render()">Mover</button></div>`);
}

function pegarLista(grupoId) {
  abrirModal(`<h2>Pegar lista de estudiantes</h2>
    <p class="ayuda">Copia las columnas desde Excel o el SIMAT y pégalas aquí. Formatos aceptados por línea:<br>
    • <b>Apellidos [TAB] Nombres [TAB] Documento</b> (columnas de Excel)<br>
    • <b>APELLIDO1 APELLIDO2 NOMBRES</b> (texto: se toman las dos primeras palabras como apellidos)</p>
    <textarea id="m-lista" style="min-height:220px" placeholder="GÓMEZ PÉREZ&#9;ANA MARÍA&#9;1012345678"></textarea>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="procesarLista('${grupoId}')">Agregar estudiantes</button></div>`, { ancho: true });
}
function procesarLista(grupoId) {
  const lineas = document.getElementById('m-lista').value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let n = 0;
  for (const l of lineas) {
    let apellidos, nombres, documento = '';
    if (l.includes('\t') || l.includes(';')) {
      const c = l.split(/\t|;/).map((x) => x.trim());
      // Si la primera columna es numérica (n.º de lista o documento) la saltamos
      if (/^\d+$/.test(c[0]) && c.length > 2) { if (c[0].length > 4) documento = c[0]; c.shift(); }
      [apellidos, nombres] = c;
      if (c[2] && !documento) documento = c[2];
    } else {
      const p = l.replace(/^\d+[.)-]?\s+/, '').split(/\s+/);
      apellidos = p.slice(0, Math.min(2, p.length - 1)).join(' ');
      nombres = p.slice(Math.min(2, p.length - 1)).join(' ');
    }
    if (!apellidos && !nombres) continue;
    S.alumnos.push({ id: uid(), grupoId, apellidos: apellidos || '', nombres: nombres || '', documento, piar: false, observaciones: '', activo: true });
    n++;
  }
  guardar(); cerrarModal(); render();
  aviso(`Se agregaron ${n} estudiante(s). Revisa que apellidos y nombres hayan quedado bien.`, 'ok');
}
function exportarAlumnos(grupoId) {
  const filas = [['#', 'Apellidos', 'Nombres', 'Documento', 'PIAR', 'Observaciones']];
  alumnosDe(grupoId).forEach((a, i) => filas.push([i + 1, a.apellidos, a.nombres, a.documento, a.piar ? 'Sí' : '', a.observaciones]));
  api.guardarCSV(`Lista ${nombreGrupoId(grupoId)}`, aCSV(filas));
}

// ---------- Perfil de diversidad del grupo ----------
function editarDiversidadGrupo(id) {
  const g = porId(S.grupos, id);
  const d = g.diversidad || {};
  abrirModal(`<h2>Diversidad del aula – ${esc(nombreGrupo(g))}</h2>
    <p class="ayuda">Este perfil se copia automáticamente en cada planeación nueva de este grupo (y luego puedes ajustarlo en cada una).</p>
    ${CAMPOS_DIVERSIDAD.map((c) => `<div class="campo"><label>${esc(c.t)}</label><textarea id="dv-${c.k}" style="min-height:80px" placeholder="${esc(c.ph)}">${esc(d[c.k] || '')}</textarea></div>`).join('')}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarDiversidadGrupo('${id}')">Guardar</button></div>`, { ancho: true });
}
function guardarDiversidadGrupo(id) {
  porId(S.grupos, id).diversidad = Object.fromEntries(CAMPOS_DIVERSIDAD.map((c) => [c.k, document.getElementById('dv-' + c.k).value.trim()]));
  guardar(); cerrarModal(); render();
  aviso('Perfil de diversidad guardado', 'ok');
}
