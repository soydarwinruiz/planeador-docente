// ================= Configuración y respaldos =================

function campoConfig(k, t, tipo = 'text', extra = '') {
  return `<div class="campo"><label>${esc(t)}</label><input type="${tipo}" value="${esc(S.config[k] ?? '')}" ${extra} onchange="S.config['${k}']=${tipo === 'number' ? '+this.value' : 'this.value'};guardar();renderNav()"></div>`;
}

RENDERS.configuracion = () => {
  const c = S.config;
  const sumaPer = c.periodos.reduce((s, p) => s + (+p.peso || 0), 0);
  return `
  <div class="cabecera"><div><h1>Configuración</h1><p class="sub">Datos institucionales, sistema de evaluación (SIEE), periodos, IA y respaldos.</p></div>
    <div class="acciones"><button class="btn primario" onclick="abrirAsistente()">🧭 Asistente de configuración inicial</button></div></div>

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
  </div>

  <div class="tarjeta"><div class="cabecera"><h2 style="margin:0">Periodos académicos</h2><button class="btn pequeno primario" onclick="agregarPeriodo()">＋ Periodo</button></div>
    ${sumaPer !== 100 ? `<div class="alerta">Los porcentajes de los periodos suman <b>${sumaPer}%</b>. Deberían sumar 100%.</div>` : ''}
    <table class="tabla"><thead><tr><th>Nombre</th><th>Inicio</th><th>Fin</th><th style="width:120px">Porcentaje</th><th></th></tr></thead><tbody>
    ${c.periodos.map((p, i) => `<tr>
      <td><input value="${esc(p.nombre)}" onchange="S.config.periodos[${i}].nombre=this.value;guardar()"></td>
      <td><input type="date" value="${esc(p.inicio)}" onchange="S.config.periodos[${i}].inicio=this.value;guardar()"></td>
      <td><input type="date" value="${esc(p.fin)}" onchange="S.config.periodos[${i}].fin=this.value;guardar()"></td>
      <td><div class="fila" style="flex-wrap:nowrap"><input type="number" min="0" max="100" value="${esc(p.peso)}" style="width:70px" onchange="S.config.periodos[${i}].peso=+this.value;guardar();render()"> %</div></td>
      <td><button class="icono" title="Eliminar" onclick="eliminarPeriodo(${i})">🗑️</button></td></tr>`).join('')}
    </tbody></table>
  </div>

  ${tarjetaComponentes()}

  ${tarjetaIA()}

  <div class="tarjeta"><h2>💾 Respaldo de datos</h2>
    <p class="ayuda">Todos tus datos se guardan en este equipo. Haz respaldos frecuentes en una memoria USB o en una carpeta sincronizada (OneDrive, Google Drive).
    Además, la aplicación crea un respaldo automático cada vez que se abre (se conservan los últimos 15).</p>
    <div class="fila">
      <button class="btn primario" onclick="crearRespaldo()">💾 Crear respaldo…</button>
      <button class="btn" onclick="restaurarRespaldo()">📂 Restaurar desde archivo…</button>
      <button class="btn" onclick="verRespaldosAuto()">🕘 Respaldos automáticos</button>
      <button class="btn" onclick="api.abrirCarpetaDatos()">Abrir carpeta de datos</button>
    </div>
    <p class="ayuda" id="ubicacion-datos"></p>
  </div>

  <div class="tarjeta"><h2>Nuevo año lectivo</h2>
    <p class="ayuda">Prepara la aplicación para un nuevo año: conserva áreas, rúbricas, configuración, planes de área, mallas, planes de periodo y todas las planeaciones (para reutilizarlas desde el banco), y elimina grupos, estudiantes, asistencia, notas, eventos y cronograma.
    <b>Antes se crea un respaldo automático.</b></p>
    <button class="btn peligro" onclick="nuevoAnio()">Iniciar nuevo año lectivo…</button>
  </div>`;
};
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
  const r = await api.exportarRespaldo(S);
  if (r.ok) aviso('Respaldo guardado en ' + r.ruta, 'ok');
}
async function restaurarRespaldo() {
  const r = await api.importarRespaldo();
  if (!r.ok) { if (r.error) aviso(r.error, 'error'); return; }
  if (!(await confirmar('Se reemplazarán TODOS los datos actuales por los del respaldo. (Los datos actuales quedan en los respaldos automáticos.) ¿Continuar?', { boton: 'Restaurar' }))) return;
  S = migrar(r.datos);
  sembrarBanco();
  migrarPlantillas();
  sembrarInstrumentos();
  guardar(); ir('inicio');
  aviso('Respaldo restaurado', 'ok');
}
async function verRespaldosAuto() {
  const lista = await api.listarRespaldosAuto();
  abrirModal(`<h2>Respaldos automáticos</h2>
    ${lista.length ? `<ul class="lista-simple">${lista.map((n) => `<li>${esc(n.replace('respaldo_', '').replace('.json', '').replace('_', ' a las ').replace(/(\d{2})(\d{2})$/, '$1:$2'))}<button class="btn pequeno" onclick="restaurarAuto('${esc(n)}')">Restaurar</button></li>`).join('')}</ul>` : '<p class="ayuda">Aún no hay respaldos automáticos.</p>'}
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button></div>`);
}
async function restaurarAuto(nombre) {
  cerrarModal();
  if (!(await confirmar('Se reemplazarán los datos actuales por este respaldo. ¿Continuar?', { boton: 'Restaurar' }))) return;
  S = migrar(await api.restaurarRespaldoAuto(nombre));
  sembrarBanco();
  migrarPlantillas();
  sembrarInstrumentos();
  guardar(); ir('inicio');
  aviso('Respaldo restaurado', 'ok');
}
async function nuevoAnio() {
  if (!(await confirmar('Se eliminarán grupos, estudiantes, asistencia, notas, eventos y cronograma. Las planeaciones, áreas, rúbricas, planes de área, mallas y planes de periodo se conservan. ¿Continuar?', { boton: 'Iniciar nuevo año' }))) return;
  await api.exportarRespaldo(S);
  const anio = (+S.config.anio || new Date().getFullYear()) + 1;
  S.planeaciones.forEach((p) => { const g = porId(S.grupos, p.grupoId); if (g) p.gradoOrigen = g.grado; });
  Object.assign(S, { grupos: [], alumnos: [], asistencia: {}, planillas: [], notas: {}, notasRubrica: {}, eventos: [], cronograma: {}, planesAula: [] });
  S.planeaciones.forEach((p) => { p.enBanco = true; p.grupoId = ''; });
  S.config.anio = anio;
  S.config.periodos.forEach((p) => {
    if (p.inicio) p.inicio = p.inicio.replace(/^\d{4}/, (y) => String(+y + 1));
    if (p.fin) p.fin = p.fin.replace(/^\d{4}/, (y) => String(+y + 1));
  });
  guardar(); ir('inicio');
  aviso(`Año lectivo ${anio} listo. Revisa las fechas de los periodos en Configuración.`, 'ok');
}

// ---------- Configuración de IA ----------
function tarjetaIA() {
  const ia = S.config.ia;
  const p = ia.proveedor || 'anthropic';
  const info = PROVEEDORES_IA[p];
  return `<div class="tarjeta"><h2>✨ Inteligencia artificial (opcional)</h2>
    <p class="ayuda">Puedes usar el proveedor que prefieras. Las claves se guardan solo en este equipo. Para generar sugerencias se envían el tema, el área, el grado
    y lo escrito en la planeación; <b>no se envían nombres de estudiantes</b>. El costo depende del proveedor y del modelo.</p>
    <div class="rejilla r4" style="align-items:end">
      <div class="campo"><label>Proveedor</label><select onchange="S.config.ia.proveedor=this.value;guardar();render()">
        ${Object.entries(PROVEEDORES_IA).map(([k, v]) => `<option value="${k}" ${p === k ? 'selected' : ''}>${v.nombre}${(k === 'compatible' ? ia.url : ia.claves?.[k]) ? ' ✔' : ''}</option>`).join('')}</select></div>
      <div class="campo" style="grid-column: span 2"><label>Clave de API ${p === 'compatible' ? '(opcional)' : ''} <span style="font-weight:normal">· se obtiene en ${esc(info.donde)}</span></label>
        <div class="fila" style="flex-wrap:nowrap"><input type="password" id="cfg-key" style="flex:1" value="${esc(ia.claves?.[p] || '')}" placeholder="${esc(info.ph)}"
          onchange="(S.config.ia.claves ||= {})['${p}']=this.value.trim();guardar();aviso('Clave guardada','ok')">
        <button class="btn" title="Mostrar u ocultar" onclick="const i=document.getElementById('cfg-key');i.type=i.type==='password'?'text':'password'">👁️</button></div></div>
      <div class="campo"><label>Modelo</label><input value="${esc(ia.modelos?.[p] || '')}" placeholder="${esc(info.modelo || 'ej.: llama3.1, deepseek-chat')}"
        onchange="(S.config.ia.modelos ||= {})['${p}']=this.value.trim();guardar()"></div>
    </div>
    ${p === 'compatible' ? `<div class="campo"><label>Dirección (URL base) del servicio</label><input value="${esc(ia.url || '')}" placeholder="https://api.deepseek.com/v1   ·   http://localhost:11434/v1 (Ollama)"
        onchange="S.config.ia.url=this.value.trim();guardar()">
      <div class="ayuda">Cualquier servicio que use el formato de OpenAI (<i>/chat/completions</i>). Con <b>Ollama</b> o <b>LM Studio</b> la IA corre en tu propio computador, sin costo y sin enviar datos a internet (requiere un equipo potente).</div></div>`
      : `<div class="ayuda" style="margin-top:-4px">Si dejas el modelo vacío se usa <b>${esc(info.modelo)}</b>. Puedes escribir cualquier otro modelo que ofrezca tu proveedor.</div>`}
    <div class="fila" style="margin-top:10px"><button class="btn" id="btn-probar-ia" onclick="probarIA()">🔌 Probar conexión</button>
      ${ia.claves?.[p] ? `<button class="btn peligro" onclick="delete S.config.ia.claves['${p}'];guardar();render()">Quitar clave</button>` : ''}
      <span id="res-probar-ia" class="ayuda"></span></div>
  </div>`;
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
