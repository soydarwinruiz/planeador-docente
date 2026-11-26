// ================= Comunicados a padres de familia =================

const PLANTILLAS_COMUNICADO = [
  { id: 'bajo', nombre: 'Bajo desempeño', titulo: 'Informe de desempeño académico', sugerir: 'bajo',
    cuerpo: 'Señor(a) {acudiente}, acudiente de {estudiante} ({grupo}):\nReciba un cordial saludo. Le informamos que, a la fecha, {nombre} presenta desempeño {desempeno} ({nota}) en {area} durante el {periodo}.{textoPendientes}\nLe solicitamos acompañar su proceso en casa, revisar sus cuadernos y verificar la entrega de las actividades. Si lo considera necesario, puede solicitar una cita con el docente.' },
  { id: 'inasistencia', nombre: 'Inasistencias', titulo: 'Reporte de inasistencias', sugerir: 'inasistencia',
    cuerpo: 'Señor(a) {acudiente}, acudiente de {estudiante} ({grupo}):\nReciba un cordial saludo. Le informamos que {nombre} registra {faltas} inasistencia(s) a la clase de {area} durante el {periodo}. Las inasistencias afectan su proceso de aprendizaje y su evaluación.\nLe recordamos que las excusas deben presentarse por escrito en los días siguientes a la ausencia, de acuerdo con el Manual de Convivencia.' },
  { id: 'pendientes', nombre: 'Actividades pendientes', titulo: 'Actividades pendientes', sugerir: 'pendientes',
    cuerpo: 'Señor(a) {acudiente}, acudiente de {estudiante} ({grupo}):\nReciba un cordial saludo. Le informamos que {nombre} tiene actividades pendientes por entregar en {area}:{listaPendientes}\nAgradecemos su apoyo para que las presente a la mayor brevedad.' },
  { id: 'apoyo', nombre: 'Plan de apoyo', titulo: 'Plan de apoyo / mejoramiento', sugerir: 'apoyo',
    cuerpo: 'Señor(a) {acudiente}, acudiente de {estudiante} ({grupo}):\nReciba un cordial saludo. Le informamos que {nombre} tiene asignado un plan de apoyo en {area} correspondiente al {periodo}, que debe entregar a más tardar el {fechaPlan}. Su acompañamiento en casa es fundamental para que lo desarrolle con éxito.' },
  { id: 'citacion', nombre: 'Citación a acudiente', titulo: 'Citación', sugerir: '',
    cuerpo: 'Señor(a) {acudiente}, acudiente de {estudiante} ({grupo}):\nReciba un cordial saludo. Por medio de la presente le citamos el día {fechaCita} a las {horaCita} en {lugar}, para dialogar sobre el proceso académico y formativo de {nombre}. Su asistencia es indispensable.' },
  { id: 'felicitacion', nombre: 'Felicitación', titulo: 'Felicitación', sugerir: 'felicitacion',
    cuerpo: 'Señor(a) {acudiente}, acudiente de {estudiante} ({grupo}):\nReciba un cordial saludo. Nos complace felicitar a {nombre} por su desempeño {desempeno} en {area} durante el {periodo}. Su esfuerzo y responsabilidad son un ejemplo para sus compañeros. ¡Gracias por su acompañamiento!' },
];
const SUGERENCIAS_COMUNICADO = { bajo: 'Estudiantes con desempeño Bajo', inasistencia: 'Estudiantes con 3 o más faltas', pendientes: 'Estudiantes con actividades sin entregar', apoyo: 'Estudiantes con plan de apoyo pendiente', felicitacion: 'Estudiantes con desempeño Superior' };

function plantillasComunicado() { return S.config.plantillasComunicado || PLANTILLAS_COMUNICADO; }
function contextoCom() {
  const c = ui.com || (ui.com = { tipo: 'bajo', grupoId: '', areaId: '', periodoId: '', fechaCita: sumarDias(hoyISO(), 2), horaCita: '07:00', lugar: 'la coordinación de la institución', sel: {}, editados: {} });
  contextoPorDefecto(c);
  return c;
}
function variablesComunicado(c, a) {
  const per = porId(S.config.periodos, c.periodoId);
  const pl = buscarPlanilla(c.grupoId, c.areaId, c.periodoId);
  const n = pl ? notaFinal(pl, a.id) : null;
  const hoy = hoyISO();
  const pend = pl ? pl.criterios.flatMap((cr) => cr.actividades).filter((x) => actividadPendiente(x, a.id, hoy)) : [];
  const asis = asistenciaAlumno(a.id, c.grupoId, per);
  const plan = planApoyoDe(a.id, c.areaId, c.periodoId);
  return {
    acudiente: a.acudiente || 'padre de familia o acudiente', estudiante: tipoTitulo(`${a.nombres} ${a.apellidos}`.trim()), nombre: primerNombre(a),
    grupo: nombreGrupoId(c.grupoId), area: nombreArea(c.areaId), periodo: (per?.nombre || '').toLowerCase(), nota: fmtNota(n), desempeno: (desempeno(n) || '').toLowerCase(),
    faltas: asis ? asis.faltas : 0, pendientes: pend.length,
    listaPendientes: pend.length ? '\n' + pend.map((x) => `• ${x.nombre}${x.fecha ? ' (' + fechaCorta(x.fecha) + ')' : ''}`).join('\n') : '',
    textoPendientes: pend.length ? `\nTiene ${pend.length} actividad(es) sin entregar:\n` + pend.map((x) => `• ${x.nombre}${x.fecha ? ' (' + fechaCorta(x.fecha) + ')' : ''}`).join('\n') : '',
    fechaPlan: plan?.fechaEntrega ? fechaLarga(plan.fechaEntrega) : '(fecha por definir)',
    docente: S.config.docente || '', institucion: S.config.institucion || '', fecha: fechaLarga(hoy),
    fechaCita: c.fechaCita ? fechaLarga(c.fechaCita) : '', horaCita: c.horaCita ? new Date('2000-01-01T' + c.horaCita).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '', lugar: c.lugar || '',
    _n: n, _asis: asis, _pend: pend, _plan: plan,
  };
}
function cumpleSugerencia(tipo, v) {
  return ({
    bajo: () => v._n != null && enBajo(v._n),
    inasistencia: () => v._asis && v._asis.faltas >= 3,
    pendientes: () => v._pend.length > 0,
    apoyo: () => v._plan && v._plan.estado === 'pendiente',
    felicitacion: () => desempeno(v._n) === 'Superior',
  })[tipo]?.() || false;
}
function textoComunicado(c, a, conFirma = true) {
  const t = plantillasComunicado().find((x) => x.id === c.tipo) || plantillasComunicado()[0];
  const cuerpo = c.editados[a.id] ?? rellenar(t.cuerpo, variablesComunicado(c, a)).replace(/\{\w+\}/g, '');
  return conFirma ? `${cuerpo}\n\nAtentamente,\n${S.config.docente || ''}\nDocente de ${nombreArea(c.areaId)}${S.config.institucion ? ' – ' + S.config.institucion : ''}` : cuerpo;
}
function telefonoWhatsApp(cel) {
  // Si hay varios números ("300 123 4567 / 310 987 6543"), se usa el primero
  const primero = String(cel || '').split(/[\/,;|]|\s+(?:y|o)\s+/i).find((x) => /\d{7,}/.test(x.replace(/\D/g, ''))) || '';
  let d = primero.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('3')) d = '57' + d; // celular colombiano
  return d.length >= 11 ? d : '';
}

RENDERS.comunicados = () => {
  const c = contextoCom();
  const plantillas = plantillasComunicado();
  const t = plantillas.find((x) => x.id === c.tipo) || plantillas[0];
  c.tipo = t.id;
  const alumnos = c.grupoId ? alumnosDe(c.grupoId) : [];
  const sel = alumnos.filter((a) => c.sel[a.id]);
  const enviados = (S.comunicadosEnviados || []).filter((x) => alumnos.some((a) => a.id === x.alumnoId)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return `
  <div class="cabecera"><div><h1>Comunicados a padres</h1><p class="sub">Mensajes listos con los datos de cada estudiante para enviar por WhatsApp o correo, o imprimir en Word con desprendible.</p></div>
    <div class="acciones"><button class="btn" onclick="editarPlantillasComunicado()">✏️ Editar textos</button></div></div>
  <div class="filtros tarjeta">
    <div><label>Tipo de comunicado</label><select onchange="ui.com.tipo=this.value;ui.com.editados={};render()">${plantillas.map((x) => `<option value="${x.id}" ${x.id === c.tipo ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></div>
    <div><label>Grupo</label><select onchange="ui.com.grupoId=this.value;ui.com.sel={};ui.com.editados={};render()">${opcionesGrupos(c.grupoId, 'Selecciona…')}</select></div>
    <div><label>Área</label><select onchange="ui.com.areaId=this.value;ui.com.editados={};render()">${opcionesAreas(c.areaId, 'Selecciona…', c.grupoId && areasDeGrupo(c.grupoId).length ? areasDeGrupo(c.grupoId) : S.areas)}</select></div>
    <div><label>Periodo</label><select onchange="ui.com.periodoId=this.value;ui.com.editados={};render()">${opcionesPeriodos(c.periodoId, 'Selecciona…')}</select></div>
    ${/\{(fechaCita|horaCita|lugar)\}/.test(t.cuerpo) ? `<div><label>Fecha de la cita</label><input type="date" value="${esc(c.fechaCita)}" onchange="ui.com.fechaCita=this.value;ui.com.editados={};render()"></div>
      <div><label>Hora</label><input type="time" value="${esc(c.horaCita)}" onchange="ui.com.horaCita=this.value;ui.com.editados={};render()"></div>
      <div style="flex:1;min-width:200px"><label>Lugar</label><input value="${esc(c.lugar)}" onchange="ui.com.lugar=this.value;ui.com.editados={};render()"></div>` : ''}
  </div>
  ${!alumnos.length ? '<div class="tarjeta vacio">Selecciona un grupo con estudiantes.</div>' : `
  <div class="rejilla" style="grid-template-columns: 300px 1fr; align-items:start">
    <div class="tarjeta"><h3 style="margin-top:0">Destinatarios (${sel.length})</h3>
      <div class="fila" style="margin-bottom:8px">${t.sugerir ? `<button class="btn pequeno" title="${esc(SUGERENCIAS_COMUNICADO[t.sugerir])}" onclick="sugerirDestinatarios()">✨ Sugerir</button>` : ''}
        <button class="btn pequeno" onclick="alumnosDe(ui.com.grupoId).forEach(a=>ui.com.sel[a.id]=true);render()">Todos</button><button class="btn pequeno" onclick="ui.com.sel={};render()">Ninguno</button></div>
      ${t.sugerir ? `<p class="ayuda" style="margin-top:0">✨ ${esc(SUGERENCIAS_COMUNICADO[t.sugerir])}.</p>` : ''}
      <ul class="lista-simple">${alumnos.map((a) => { const v = variablesComunicado(c, a); const ok = t.sugerir && cumpleSugerencia(t.sugerir, v); return `<li style="padding:4px 0"><label style="font-weight:normal;color:inherit;margin:0;display:flex;gap:6px;align-items:center;cursor:pointer">
        <input type="checkbox" ${c.sel[a.id] ? 'checked' : ''} onchange="ui.com.sel['${a.id}']=this.checked;render()"> ${esc(nombreAlumno(a))} ${ok ? '✨' : ''}</label>
        <span class="ayuda">${a.celular ? '📱' : ''}${a.correo ? '✉️' : ''}</span></li>`; }).join('')}</ul>
      <p class="ayuda">📱 tiene celular · ✉️ tiene correo. Regístralos en Grupos y alumnos.</p></div>
    <div>
      ${sel.length ? `<div class="tarjeta fila" style="justify-content:space-between"><span><b>${sel.length}</b> comunicado(s) · ${esc(t.nombre)}</span>
        <span class="fila"><button class="btn" onclick="exportarComunicados()">⬇️ Word para imprimir</button><button class="btn" onclick="copiarTexto(alumnosDe(ui.com.grupoId).filter(a=>ui.com.sel[a.id]).map(a=>textoComunicado(ui.com,a)).join('\\n\\n────────\\n\\n'))">📋 Copiar todos</button></span></div>
      ${sel.map((a) => { const tel = telefonoWhatsApp(a.celular); const env = enviados.filter((x) => x.alumnoId === a.id && x.tipo === c.tipo); return `<div class="tarjeta">
        <div class="cabecera" style="margin-bottom:6px"><b>${esc(nombreAlumno(a))}</b><span class="ayuda">${esc(a.acudiente || 'Sin acudiente registrado')}${a.celular ? ' · ' + esc(a.celular) : ''}</span></div>
        <textarea rows="7" oninput="ui.com.editados['${a.id}']=this.value">${esc(textoComunicado(c, a, false))}</textarea>
        <div class="fila" style="margin-top:6px">
          <button class="btn pequeno" onclick="copiarTexto(textoComunicado(ui.com,porId(S.alumnos,'${a.id}')))">📋 Copiar</button>
          <button class="btn pequeno" style="color:#128c7e" onclick="enviarComunicado('${a.id}','whatsapp')" title="${tel ? 'Abre WhatsApp con el mensaje listo' : 'Sin celular: WhatsApp te pedirá elegir el contacto'}">🟢 WhatsApp</button>
          <button class="btn pequeno" onclick="enviarComunicado('${a.id}','correo')" ${a.correo ? '' : 'title="Sin correo registrado"'}>✉️ Correo</button>
          ${env.length ? `<span class="chip terminada">Enviado ${esc(fechaCorta(env[0].fecha))} por ${esc(env[0].medio)}</span>` : ''}</div></div>`; }).join('')}`
      : '<div class="tarjeta vacio"><div class="grande">✉️</div>Elige los destinatarios a la izquierda.</div>'}
      ${enviados.length ? `<div class="tarjeta"><h3 style="margin-top:0">Historial del grupo</h3><table class="tabla"><thead><tr><th>Fecha</th><th>Estudiante</th><th>Comunicado</th><th>Medio</th></tr></thead><tbody>
        ${enviados.slice(0, 30).map((x) => `<tr><td>${esc(fechaCorta(x.fecha))}</td><td>${esc(nombreAlumno(porId(S.alumnos, x.alumnoId) || { apellidos: '', nombres: '' }))}</td><td>${esc((plantillasComunicado().find((p) => p.id === x.tipo) || {}).nombre || x.tipo)}${x.areaId ? ' · ' + esc(nombreArea(x.areaId)) : ''}</td><td>${esc(x.medio)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    </div></div>`}`;
};
function sugerirDestinatarios() {
  const c = ui.com; const t = plantillasComunicado().find((x) => x.id === c.tipo);
  c.sel = {};
  let n = 0;
  alumnosDe(c.grupoId).forEach((a) => { if (cumpleSugerencia(t.sugerir, variablesComunicado(c, a))) { c.sel[a.id] = true; n++; } });
  render();
  aviso(n ? `${n} estudiante(s) sugeridos` : 'Ningún estudiante cumple la condición');
}
function registrarEnvio(alumnoId, medio) {
  (S.comunicadosEnviados ||= []).push({ id: uid(), alumnoId, tipo: ui.com.tipo, areaId: ui.com.areaId, periodoId: ui.com.periodoId, fecha: hoyISO(), medio });
  guardar();
}
function enviarComunicado(alumnoId, medio) {
  const a = porId(S.alumnos, alumnoId);
  const texto = textoComunicado(ui.com, a);
  const t = plantillasComunicado().find((x) => x.id === ui.com.tipo);
  if (medio === 'whatsapp') {
    const tel = telefonoWhatsApp(a.celular);
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`);
  } else {
    if (!a.correo) return aviso('Este estudiante no tiene correo del acudiente registrado', 'error');
    window.open(`mailto:${encodeURIComponent(a.correo)}?subject=${encodeURIComponent(`${t.titulo} – ${tipoTitulo(nombreAlumno(a))}`)}&body=${encodeURIComponent(texto)}`);
  }
  registrarEnvio(alumnoId, medio === 'whatsapp' ? 'WhatsApp' : 'correo');
  render();
}
function exportarComunicados() {
  const c = ui.com; const t = plantillasComunicado().find((x) => x.id === c.tipo);
  const sel = alumnosDe(c.grupoId).filter((a) => c.sel[a.id]);
  const fechaDoc = deISO(hoyISO()).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const cartas = sel.map((a) => ({ titulo: t.titulo, fechaTexto: fechaDoc, cuerpo: textoComunicado(c, a, false), cargo: `Docente de ${nombreArea(c.areaId)}`, desprendible: true, estudiante: tipoTitulo(`${a.nombres} ${a.apellidos}`), grupo: nombreGrupoId(c.grupoId) }));
  api.exportarWordCurricular('comunicados', `${t.nombre} ${nombreGrupoId(c.grupoId)} ${hoyISO()}`, { config: S.config, cartas }).then((r) => {
    if (r.ok) { sel.forEach((a) => registrarEnvio(a.id, 'impreso')); render(); aviso('Documento de Word creado', 'ok'); } else if (r.error) aviso(r.error, 'error');
  });
}
// Acceso desde el seguimiento de un estudiante
function comunicadoPara(alumnoId, tipo) {
  const a = porId(S.alumnos, alumnoId);
  const c = contextoCom();
  Object.assign(c, { grupoId: a.grupoId, sel: { [alumnoId]: true }, editados: {} });
  if (tipo) c.tipo = tipo;
  if (ui.seg?.areaId) c.areaId = ui.seg.areaId;
  if (ui.seg?.periodoId) c.periodoId = ui.seg.periodoId;
  if (!areasDeGrupo(a.grupoId).some((x) => x.id === c.areaId)) c.areaId = areasDeGrupo(a.grupoId)[0]?.id || '';
  ir('comunicados');
}

// ---------- Editar textos ----------
function editarPlantillasComunicado() {
  const lista = plantillasComunicado();
  abrirModal(`<h2>✏️ Textos de los comunicados</h2>
    <p class="ayuda">Variables disponibles: {acudiente} {estudiante} {nombre} {grupo} {area} {periodo} {nota} {desempeno} {faltas} {pendientes} {listaPendientes} {textoPendientes} {fechaPlan} {fechaCita} {horaCita} {lugar} {docente} {institucion} {fecha}. La firma del docente se agrega sola.</p>
    <div id="pc-lista">${lista.map((t, i) => `<div class="tarjeta" data-pc="${i}" style="padding:10px">
      <div class="rejilla r2"><div class="campo"><label>Nombre</label><input class="pc-nombre" value="${esc(t.nombre)}"></div><div class="campo"><label>Título (Word)</label><input class="pc-titulo" value="${esc(t.titulo)}"></div></div>
      <div class="campo"><label>Texto</label><textarea class="pc-cuerpo" rows="5">${esc(t.cuerpo)}</textarea></div>
      <input type="hidden" class="pc-id" value="${esc(t.id)}"><input type="hidden" class="pc-sug" value="${esc(t.sugerir || '')}"></div>`).join('')}</div>
    <button class="btn" onclick="agregarPlantillaComunicado()">＋ Nuevo tipo de comunicado</button>
    <div class="botones"><button class="btn" onclick="S.config.plantillasComunicado=null;guardar();cerrarModal();render();aviso('Se restauraron los textos sugeridos','ok')">Restaurar sugeridos</button>
      <button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarPlantillasComunicado()">Guardar</button></div>`, { ancho: true });
}
function agregarPlantillaComunicado() {
  const d = document.createElement('div');
  d.className = 'tarjeta'; d.style.padding = '10px';
  d.innerHTML = `<div class="rejilla r2"><div class="campo"><label>Nombre</label><input class="pc-nombre" value="Nuevo comunicado"></div><div class="campo"><label>Título (Word)</label><input class="pc-titulo" value="Comunicado"></div></div>
    <div class="campo"><label>Texto</label><textarea class="pc-cuerpo" rows="5">Señor(a) {acudiente}, acudiente de {estudiante} ({grupo}):\nReciba un cordial saludo. </textarea></div><input type="hidden" class="pc-id" value="${uid()}"><input type="hidden" class="pc-sug" value="">`;
  document.getElementById('pc-lista').appendChild(d);
  d.querySelector('.pc-nombre').focus();
}
function guardarPlantillasComunicado() {
  S.config.plantillasComunicado = [...document.querySelectorAll('#pc-lista > div')].map((d) => ({
    id: d.querySelector('.pc-id').value, nombre: d.querySelector('.pc-nombre').value.trim() || 'Comunicado', titulo: d.querySelector('.pc-titulo').value.trim(),
    cuerpo: d.querySelector('.pc-cuerpo').value, sugerir: d.querySelector('.pc-sug').value,
  })).filter((t) => t.cuerpo.trim());
  ui.com.editados = {};
  guardar(); cerrarModal(); render(); aviso('Textos guardados', 'ok');
}
