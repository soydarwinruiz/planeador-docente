// ================= Control de entregas y nota por lote =================
// S.entregas = { actividadId: { alumnoId: 'E' (entregó) | 'T' (tarde) | 'N' (no entregó) } }
// Las entregas alimentan las actividades pendientes del seguimiento y de los comunicados a padres.

const ESTADOS_ENTREGA = { E: { t: 'Entregó', ico: '✔' }, T: { t: 'Tarde', ico: '⏰' }, N: { t: 'No entregó', ico: '✖' } };
function entrega(actId, alumnoId) { return S.entregas?.[actId]?.[alumnoId] || ''; }
// Una actividad está pendiente si se marcó "no entregó", o si ya pasó su fecha y no tiene nota ni entrega
function actividadPendiente(a, alumnoId, hoy = hoyISO()) {
  const e = entrega(a.id, alumnoId);
  if (e === 'N') return true;
  if (e === 'E' || e === 'T') return false;
  return !!a.fecha && a.fecha <= hoy && nota(a.id, alumnoId) == null;
}
function marcarEntrega(actId, alumnoId, estado) {
  const m = ((S.entregas ||= {})[actId] ||= {});
  if (!estado || m[alumnoId] === estado) delete m[alumnoId]; else m[alumnoId] = estado;
  if (!Object.keys(m).length) delete S.entregas[actId];
  guardar();
}

function vistaEntregas(c) {
  if (!c.grupoId || !c.areaId || !c.periodoId) return '<div class="tarjeta vacio">Selecciona grupo, área y periodo.</div>';
  const pl = buscarPlanilla(c.grupoId, c.areaId, c.periodoId);
  const acts = pl ? pl.criterios.flatMap((cr) => cr.actividades.map((a) => ({ a, cr }))) : [];
  if (!acts.length) return '<div class="tarjeta vacio">Este periodo aún no tiene actividades. Créalas en la programación evaluativa.</div>';
  const e = (ui.ent ||= { actId: '', sel: {}, nota: '', a: 'seleccionados', respetar: true });
  if (!acts.some((x) => x.a.id === e.actId)) {
    const hoy = hoyISO();
    e.actId = (acts.filter((x) => x.a.fecha && x.a.fecha <= hoy).sort((x, y) => y.a.fecha.localeCompare(x.a.fecha))[0] || acts[0]).a.id;
    e.sel = {};
  }
  const { a, cr } = acts.find((x) => x.a.id === e.actId);
  const alumnos = alumnosDe(c.grupoId);
  const cuenta = { E: 0, T: 0, N: 0 };
  alumnos.forEach((al) => { const x = entrega(a.id, al.id); if (cuenta[x] != null) cuenta[x]++; });
  return `<div class="filtros tarjeta">
      <div style="flex:1;min-width:260px"><label>Actividad</label><select onchange="ui.ent.actId=this.value;ui.ent.sel={};render()">${acts.map((x) => `<option value="${x.a.id}" ${x.a.id === e.actId ? 'selected' : ''}>${esc(x.cr.nombre)} · ${esc(x.a.nombre)}${x.a.fecha ? ' (' + esc(fechaCorta(x.a.fecha)) + ')' : ''}</option>`).join('')}</select></div>
      <div class="ayuda" style="align-self:end">✔ ${cuenta.E} entregaron · ⏰ ${cuenta.T} tarde · ✖ ${cuenta.N} no entregaron · ${alumnos.length - cuenta.E - cuenta.T - cuenta.N} sin marcar</div>
    </div>
    <div class="tarjeta">
      <div class="fila" style="margin-bottom:10px">
        <button class="btn" onclick="entregasTodos('E')">✔ Todos entregaron</button>
        <button class="btn" onclick="entregasTodos('N')">✖ Los que faltan: no entregaron</button>
        <span style="flex:1"></span>
        <b>Nota por lote:</b>
        <input type="number" step="0.1" min="${S.config.escalaMin}" max="${S.config.escalaMax}" style="width:80px" value="${esc(e.nota)}" placeholder="Nota" oninput="ui.ent.nota=this.value" ${a.rubricaId ? 'disabled title="Se califica con rúbrica"' : ''}>
        <select style="width:auto" onchange="ui.ent.a=this.value">${[['seleccionados', 'a los seleccionados'], ['E', 'a los que entregaron'], ['T', 'a los que entregaron tarde'], ['N', 'a los que no entregaron'], ['sinNota', 'a todos los que no tienen nota']].map(([k, t]) => `<option value="${k}" ${e.a === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <label style="font-weight:normal;color:inherit;font-size:13px"><input type="checkbox" ${e.respetar ? 'checked' : ''} onchange="ui.ent.respetar=this.checked"> no cambiar las notas que ya están</label>
        <button class="btn primario" onclick="aplicarNotaLote()" ${a.rubricaId ? 'disabled' : ''}>Aplicar</button>
      </div>
      <table class="tabla"><thead><tr><th style="width:32px"><input type="checkbox" title="Seleccionar todos" onchange="alumnosDe(ui.cal.grupoId).forEach((x)=>{ui.ent.sel[x.id]=this.checked});render()"></th><th>Estudiante</th><th>Entrega</th><th class="num">Nota</th></tr></thead><tbody>
      ${alumnos.map((al, i) => { const x = entrega(a.id, al.id), n = nota(a.id, al.id); return `<tr><td><input type="checkbox" ${e.sel[al.id] ? 'checked' : ''} onchange="ui.ent.sel['${al.id}']=this.checked"></td>
        <td>${i + 1}. ${esc(nombreAlumno(al))}</td>
        <td class="asis" style="white-space:nowrap">${Object.entries(ESTADOS_ENTREGA).map(([k, v]) => `<button class="${k === 'E' ? 'P' : k === 'T' ? 'T' : 'A'} ${x === k ? 'on' : ''}" title="${v.t}" onclick="marcarEntrega('${a.id}','${al.id}','${k}');render()">${v.ico}</button>`).join('')}</td>
        <td class="nota">${a.rubricaId ? `<button class="btn pequeno" onclick="calificarConRubrica('${a.id}','${al.id}')">${n == null ? 'Calificar' : fmtNota(n)}</button>`
          : `<input type="number" step="0.1" class="${claseNota(n)}" value="${n == null ? '' : n}" data-fila="${i}" data-col="0" onchange="ponerNota('${a.id}','${al.id}',this)" onkeydown="navegarNotas(event,this)" oncontextmenu="event.preventDefault();verHistorialNota('${a.id}','${al.id}')">`}</td></tr>`; }).join('')}
      </tbody></table>
      <p class="ayuda">Componente: ${esc(cr.nombre)}. Lo marcado como "no entregó" aparece en las actividades pendientes del seguimiento y en los comunicados a padres. Las entregas también se marcan desde el celular.</p>
    </div>`;
}
function entregasTodos(estado) {
  const actId = ui.ent.actId;
  const m = ((S.entregas ||= {})[actId] ||= {});
  for (const al of alumnosDe(ui.cal.grupoId)) {
    if (estado === 'E') { if (!m[al.id]) m[al.id] = 'E'; } else if (!m[al.id]) m[al.id] = 'N';
  }
  guardar(); render();
}
function aplicarNotaLote() {
  const e = ui.ent;
  const v = +String(e.nota).replace(',', '.');
  if (e.nota === '' || isNaN(v) || v < +S.config.escalaMin || v > +S.config.escalaMax) return aviso(`Escribe una nota entre ${S.config.escalaMin} y ${S.config.escalaMax}`, 'error');
  const destino = alumnosDe(ui.cal.grupoId).filter((al) => e.a === 'seleccionados' ? e.sel[al.id] : e.a === 'sinNota' ? nota(e.actId, al.id) == null : entrega(e.actId, al.id) === e.a);
  const aplicar = destino.filter((al) => !e.respetar || nota(e.actId, al.id) == null);
  if (!aplicar.length) return aviso(destino.length ? 'Todos ya tienen nota (desmarca "no cambiar las notas que ya están" para reemplazarlas).' : 'No hay estudiantes en ese grupo de la lista.', 'error');
  origenNotas('lote');
  const m = (S.notas[e.actId] ||= {});
  aplicar.forEach((al) => { m[al.id] = v; });
  guardar(); render();
  aviso(`Nota ${fmtNota(v)} puesta a ${aplicar.length} estudiante(s)`, 'ok');
}
