// ================= Acerca de Tiza (menú Ayuda) =================
// Créditos: quién lo creó, contenidos de referencia y componentes de software libre que usa.

const CREDITOS = {
  autor: 'DocenTech', // nombre del creador tal como debe aparecer
  detalle: '', // cargo, institución o contacto público (opcional)
};
const REFERENTES_CREDITOS = [
  ['Estándares Básicos de Competencias y Derechos Básicos de Aprendizaje (DBA)', 'Ministerio de Educación Nacional de Colombia'],
  ['Orientaciones curriculares de Tecnología e Informática', 'Ministerio de Educación Nacional de Colombia'],
  ['Estrategias, técnicas y métodos del banco pedagógico', 'Compendio pedagógico Radar 360°'],
  ['Pautas de Diseño Universal para el Aprendizaje (DUA 3.0)', 'CAST'],
];
const LIBRERIAS_CREDITOS = [
  ['Electron', 'MIT'], ['docx', 'MIT'], ['ExcelJS', 'MIT'], ['QRCode', 'MIT'], ['electron-updater', 'MIT'],
  ['Anthropic SDK', 'MIT'], ['PDF.js (Mozilla)', 'Apache 2.0'], ['Pizarra Local', 'MIT'],
];
async function abrirAcercaDe() {
  const i = await api.infoVersion().catch(() => ({}));
  abrirModal(`<div class="acerca">
    <img src="icono.svg" alt="" style="width:72px;height:72px">
    <h1>Tiza</h1>
    <p class="sub">Planeador y asistente del docente · educación básica y media (Colombia, grados 1.° a 11.°)</p>
    <p class="ayuda">Versión ${esc(i.version || '')}${i.portable ? ' · portable' : ''}</p>
    ${CREDITOS.autor ? `<div class="acerca-autor"><span class="ayuda">Creado por</span><b>${esc(CREDITOS.autor)}</b>${CREDITOS.detalle ? `<span class="ayuda">${esc(CREDITOS.detalle)}</span>` : ''}</div>` : ''}
    <p>Hecho para que los docentes colombianos dediquen menos tiempo al papeleo y más a sus estudiantes. Tus datos se guardan solo en este equipo.</p>
    <p class="ayuda">Desarrollado con la ayuda de inteligencia artificial (Claude, de Anthropic).</p>
    <details><summary>Contenidos de referencia</summary><ul>${REFERENTES_CREDITOS.map(([a, b]) => `<li>${esc(a)} — <span class="ayuda">${esc(b)}</span></li>`).join('')}</ul></details>
    <details><summary>Software libre que usa Tiza</summary><ul>${LIBRERIAS_CREDITOS.map(([a, b]) => `<li>${esc(a)} <span class="ayuda">(licencia ${esc(b)})</span></li>`).join('')}</ul>
      <p class="ayuda">Tiza se distribuye con licencia MIT.</p></details>
    <div class="botones" style="justify-content:center">
      <button class="btn" onclick="api.paginaDescargas()">🌐 Novedades y descargas</button>
      <button class="btn primario" onclick="cerrarModal()">Cerrar</button></div></div>`);
}
api.alAcercaDe(() => abrirAcercaDe());
