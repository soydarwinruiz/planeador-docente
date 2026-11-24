// ================= Años anteriores: archivo de consulta =================
// Al iniciar un año lectivo, el año que termina se archiva completo (grupos, estudiantes, notas, asistencia,
// observaciones, PIAR…). Se puede consultar en modo solo lectura con todas las vistas del programa
// (planillas, consolidados, seguimiento, informes y exportaciones), mientras el año en curso sigue intacto.

function bandaArchivo() {
  const m = ui.archivo.meta;
  return `<div id="banda-archivo"><span>🗄️ Consultando el año <b>${esc(m.anio)}</b>${m.institucion ? ' · ' + esc(m.institucion) : ''} · <b>solo lectura</b>: lo que cambies aquí no se guarda.</span>
    <button class="btn pequeno" onclick="salirDeArchivo()">↩️ Volver al año ${esc(ui.archivo.actual.config.anio)}</button></div>`;
}

RENDERS.anios = () => {
  setTimeout(dibujarListaAnios, 0);
  return `<div class="cabecera"><div><h1>🗄️ Años anteriores</h1>
    <p class="sub">Consulta notas, asistencia, observaciones, PIAR y seguimiento de años lectivos pasados: para reclamos (Decreto 1290), certificados o para comparar grupos.</p></div>
    <div class="acciones">
      <button class="btn" onclick="archivarCopiaActual()" title="Guarda una copia del año en curso sin borrar nada">📸 Archivar una copia del año actual</button>
      <button class="btn" onclick="importarAnio()" title="Por ejemplo, el respaldo que se guardó al iniciar el año con una versión anterior del programa">📥 Importar un año desde un respaldo…</button>
    </div></div>
  <div class="tarjeta" id="lista-anios"><p class="ayuda">Cargando…</p></div>
  <p class="ayuda">Los años se archivan solos al usar <b>Configuración → Nuevo año lectivo</b>. Se incluyen en los respaldos manuales y en la carpeta de la nube.</p>`;
};
async function dibujarListaAnios() {
  const el = document.getElementById('lista-anios');
  if (!el) return;
  const lista = await api.aniosListar();
  el.innerHTML = lista.length ? `<table class="tabla"><thead><tr><th>Año</th><th>Institución</th><th class="num">Grupos</th><th class="num">Estudiantes</th><th class="num">Planeaciones</th><th>Archivado</th><th></th></tr></thead><tbody>
    ${lista.map((m) => `<tr><td><b>${esc(m.anio)}</b>${m.nota ? `<br><span class="ayuda">${esc(m.nota)}</span>` : ''}</td><td>${esc(m.institucion)}</td><td class="num">${m.grupos}</td><td class="num">${m.estudiantes}</td><td class="num">${m.planeaciones}</td>
      <td>${esc(new Date(m.archivado).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }))}</td>
      <td style="white-space:nowrap"><button class="btn pequeno primario" onclick="consultarAnio('${esc(m.id)}')">👁️ Consultar</button>
      <button class="icono" title="Eliminar" onclick="eliminarAnio('${esc(m.id)}','${esc(m.anio)}')">🗑️</button></td></tr>`).join('')}
    </tbody></table>` : '<div class="vacio"><div class="grande">🗄️</div>Aún no hay años archivados.</div>';
}

async function consultarAnio(id) {
  if (ui.archivo) salirDeArchivo(false);
  const meta = (await api.aniosListar()).find((m) => m.id === id);
  let datos;
  try { datos = await api.aniosLeer(id); } catch (e) { aviso('No se pudo abrir ese año: ' + e.message, 'error'); return; }
  if (typeof cancelarPapelera === 'function') cancelarPapelera();
  ui.archivo = { actual: S, meta: meta || { id, anio: datos.config?.anio || '' } };
  S = migrar(datos);
  S.config.ia = ui.archivo.actual.config.ia; // las sugerencias con IA siguen disponibles
  S.config.apariencia = ui.archivo.actual.config.apariencia;
  reiniciarFiltros(); // los filtros de cada vista apuntan a grupos del año en curso
  document.body.classList.add('modo-archivo');
  ir('calificaciones');
  aviso(`Consultando el año ${ui.archivo.meta.anio}`, 'ok');
}
function salirDeArchivo(mostrar = true) {
  if (!ui.archivo) return;
  if (typeof cancelarPapelera === 'function') cancelarPapelera();
  S = ui.archivo.actual;
  ui.archivo = null;
  reiniciarFiltros();
  document.body.classList.remove('modo-archivo');
  if (mostrar) ir('anios');
}

function reiniciarFiltros() { for (const k of Object.keys(ui)) if (!['vista', 'params', 'archivo', 'enfoque'].includes(k)) delete ui[k]; }

async function archivarCopiaActual() {
  if (ui.archivo) return aviso('Primero vuelve al año en curso.', 'error');
  const r = await api.aniosArchivar(textoEstado());
  if (r.ok) { aviso(`Copia del año ${r.meta.anio} archivada`, 'ok'); dibujarListaAnios(); } else aviso('No se pudo archivar: ' + r.error, 'error');
}
async function importarAnio() {
  const r = await api.aniosImportar();
  if (r.ok) { aviso(`Año ${r.meta.anio} archivado desde el respaldo`, 'ok'); dibujarListaAnios(); } else if (r.error) aviso(r.error, 'error');
}
async function eliminarAnio(id, anio) {
  if (!(await confirmar(`¿Eliminar definitivamente el año ${anio} archivado? Sus notas, asistencia y observaciones ya no se podrán consultar (salvo desde un respaldo).`, { papelera: false }))) return;
  if (ui.archivo?.meta.id === id) salirDeArchivo(false);
  await api.aniosEliminar(id);
  aviso('Año eliminado', 'ok');
  render();
}
