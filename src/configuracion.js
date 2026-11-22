// ================= Configuración y respaldos =================

function campoConfig(k, t, tipo = 'text', extra = '') {
  return `<div class="campo"><label>${esc(t)}</label><input type="${tipo}" value="${esc(S.config[k] ?? '')}" ${extra} onchange="S.config['${k}']=${tipo === 'number' ? '+this.value' : 'this.value'};guardar();renderNav()"></div>`;
}

RENDERS.configuracion = () => {
  const c = S.config;
  const sumaPer = c.periodos.reduce((s, p) => s + (+p.peso || 0), 0);
  const sumaCrit = c.criteriosPorDefecto.reduce((s, p) => s + (+p.peso || 0), 0);
  return `
  <div class="cabecera"><div><h1>Configuración</h1><p class="sub">Datos institucionales, sistema de evaluación (SIEE), periodos, IA y respaldos.</p></div></div>

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

  <div class="tarjeta"><div class="cabecera"><h2 style="margin:0">Criterios de evaluación por defecto</h2><button class="btn pequeno" onclick="S.config.criteriosPorDefecto.push({nombre:'Nuevo criterio',peso:0});guardar();render()">＋ Criterio</button></div>
    <p class="ayuda">Se usan al crear una planilla de calificaciones nueva. Cada planilla se puede ajustar después.</p>
    ${sumaCrit !== 100 ? `<div class="alerta">Suman <b>${sumaCrit}%</b>. Deberían sumar 100%.</div>` : ''}
    <table class="tabla" style="max-width:620px"><tbody>
    ${c.criteriosPorDefecto.map((cr, i) => `<tr><td><input value="${esc(cr.nombre)}" onchange="S.config.criteriosPorDefecto[${i}].nombre=this.value;guardar()"></td>
      <td style="width:120px"><div class="fila" style="flex-wrap:nowrap"><input type="number" value="${esc(cr.peso)}" style="width:70px" onchange="S.config.criteriosPorDefecto[${i}].peso=+this.value;guardar();render()"> %</div></td>
      <td style="width:40px"><button class="icono" onclick="S.config.criteriosPorDefecto.splice(${i},1);guardar();render()">🗑️</button></td></tr>`).join('')}
    </tbody></table>
  </div>

  <div class="tarjeta"><h2>✨ Inteligencia artificial (opcional)</h2>
    <p class="ayuda">Las sugerencias con IA usan Claude, de Anthropic, y requieren internet. Crea una clave de API en <b>console.anthropic.com</b> (tiene costo según el uso).
    La clave se guarda solo en este equipo. El tema, el área, el grado y lo que hayas escrito en la planeación se envían al servicio para generar la sugerencia; no se envían nombres de estudiantes.</p>
    <div class="fila" style="max-width:640px;flex-wrap:nowrap">
      <input type="password" id="cfg-key" value="${esc(c.apiKey)}" placeholder="sk-ant-..." style="flex:1" onchange="S.config.apiKey=this.value.trim();guardar();aviso('Clave guardada','ok')">
      <button class="btn" onclick="const i=document.getElementById('cfg-key');i.type=i.type==='password'?'text':'password'">👁️</button>
      ${c.apiKey ? `<button class="btn peligro" onclick="S.config.apiKey='';guardar();render()">Quitar</button>` : ''}
    </div>
  </div>

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
