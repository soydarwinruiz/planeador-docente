// ================= Material de clase con IA desde una sesión =================
// Desde cada sesión planeada: guía del estudiante (ficha tipo guía), quiz de salida (prueba corta) y rúbrica
// de la actividad. Todo queda vinculado a la planeación y se revisa antes de usarlo.

function textoSesion(p, s) {
  return [p.titulo ? `Planeación: ${p.titulo}` : '', s.titulo ? `Sesión: ${s.titulo}` : '', p.objetivo ? `Objetivo: ${p.objetivo}` : '', p.pregunta ? `Pregunta problematizadora: ${p.pregunta}` : '',
    p.desempenoSaber ? `Desempeño (saber): ${p.desempenoSaber}` : '', p.desempenoHacer ? `Desempeño (hacer): ${p.desempenoHacer}` : '',
    ...MOMENTOS.filter((m) => (s[m.k] || '').trim()).map((m) => `${m.t}: ${s[m.k]}`), contextoAulaIA(p)].filter(Boolean).join('\n');
}
function dialogoMaterialSesion(planId, sesId) {
  if (sinIA()) return;
  abrirModal(`<h2>✨ Material para esta sesión</h2>
    <p class="ayuda">Se usa lo que planeaste (objetivo, desempeños y momentos). Nunca se envían datos de estudiantes. Revisa siempre lo que propone la IA.</p>
    <div class="rejilla r3">
      <button class="tarjeta mat-op" onclick="materialGuia('${planId}','${sesId}')"><div class="grande">📄</div><b>Guía del estudiante</b><span class="ayuda">Explicación, ejemplos y actividades, lista para imprimir</span></button>
      <button class="tarjeta mat-op" onclick="materialQuiz('${planId}','${sesId}')"><div class="grande">🧪</div><b>Quiz de salida</b><span class="ayuda">5 preguntas para verificar lo aprendido; se aplica en papel o por QR</span></button>
      <button class="tarjeta mat-op" id="mat-rub" onclick="materialRubrica('${planId}','${sesId}')"><div class="grande">📋</div><b>Rúbrica</b><span class="ayuda">Para valorar la actividad o producto de la sesión</span></button>
    </div>
    <div id="mat-error"></div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cerrar</button></div>`, { ancho: true });
}
function planYSesion(planId, sesId) { const p = porId(S.planeaciones, planId); return { p, s: p?.sesiones.find((x) => x.id === sesId) }; }
function materialGuia(planId, sesId) {
  const { p, s } = planYSesion(planId, sesId);
  const g = porId(S.grupos, p.grupoId);
  ui.ficha = { ...nuevaFicha('guia'), titulo: s.titulo || p.titulo || '', grupoId: p.grupoId || '', grado: g?.grado || p.gradoOrigen || '', areaId: p.areaId || '', planeacionId: p.id };
  cerrarModal(); ir('fichas');
  dialogoIAFicha();
  document.getElementById('fia-det').value = textoSesion(p, s);
}
function materialQuiz(planId, sesId) {
  const { p, s } = planYSesion(planId, sesId);
  const g = porId(S.grupos, p.grupoId);
  const pr = { id: uid(), tipo: 'prueba', titulo: `Quiz de salida – ${s.titulo || p.titulo || 'sesión'}`, grupoId: p.grupoId || '', grado: +(g?.grado || p.gradoOrigen || 6), areaId: p.areaId || '',
    periodoId: periodoDeFecha(s.fecha || hoyISO())?.id || '', planeacionId: p.id, tema: s.titulo || p.titulo || '', referentesIA: textoSesion(p, s),
    instrucciones: 'Responde estas preguntas sobre la clase de hoy. Marca una sola opción.', tiempo: 15, preguntas: [], respuestas: {}, abiertas: {}, creada: new Date().toISOString(), modificada: new Date().toISOString() };
  S.pruebas.push(pr); guardar(); cerrarModal();
  ir('pruebaEditor', { id: pr.id });
  dialogoIAPrueba(pr.id);
  document.getElementById('pia-mult').value = 5;
  document.getElementById('pia-contexto').checked = false;
}
async function materialRubrica(planId, sesId) {
  const { p, s } = planYSesion(planId, sesId);
  const niveles = nivelesDesempeno();
  const b = document.getElementById('mat-rub'); b.disabled = true; b.querySelector('b').innerHTML = '<span class="cargando"></span> Generando…';
  const contexto = [textoSesion(p, s), `Área: ${nombreArea(p.areaId)}`, `Niveles de desempeño, de mayor a menor: ${niveles.map((n) => n.nombre).join(', ')}`].join('\n');
  const r = await api.sugerirIA({ ia: S.config.ia, contexto, tarea: 'rubrica' });
  if (!document.getElementById('mat-rub')) return;
  b.disabled = false; b.querySelector('b').textContent = 'Rúbrica';
  if (!r.ok) { document.getElementById('mat-error').innerHTML = `<div class="alerta error">${esc(r.error)}</div>`; return; }
  const crit = (r.datos.criterios || []).filter((c) => c && c.nombre).slice(0, 8);
  if (!crit.length) { document.getElementById('mat-error').innerHTML = '<div class="alerta error">La IA no devolvió criterios. Inténtalo de nuevo.</div>'; return; }
  const rub = { id: uid(), tipo: 'rubrica', nombre: String(r.datos.nombre || `Rúbrica – ${s.titulo || p.titulo || 'actividad'}`).slice(0, 120), tecnicas: String(r.datos.producto || ''), descripcion: `Creada desde la planeación "${p.titulo || ''}"`,
    criterios: [], niveles, descriptores: {} };
  for (const c of crit) {
    const id = uid();
    rub.criterios.push({ id, nombre: String(c.nombre).slice(0, 200) });
    rub.descriptores[id] = niveles.map((_, i) => String((c.descriptores || [])[i] || ''));
  }
  S.rubricas.push(rub); guardar(); cerrarModal();
  editarRubrica(rub.id);
  aviso('Rúbrica creada. Revísala y ajústala; luego úsala en la programación evaluativa.', 'ok');
}
