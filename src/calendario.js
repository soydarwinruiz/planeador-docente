// ================= Calendario y cronograma =================

const TIPOS_EVENTO = { festivo: 'Festivo', receso: 'Receso / vacaciones', institucional: 'Institucional', otro: 'Otro' };
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function eventosDelDia(iso) { return S.eventos.filter((e) => iso >= e.fecha && iso <= (e.fechaFin || e.fecha)); }
function sesionesDelDia(iso) {
  const r = [];
  for (const p of S.planeaciones) (p.sesiones || []).forEach((s, i) => { if (s.fecha === iso) r.push({ p, s, i }); });
  return r;
}

RENDERS.calendario = () => {
  const c = ui.calMes || (ui.calMes = { anio: new Date().getFullYear(), mes: new Date().getMonth(), grupoId: '' });
  const primero = new Date(c.anio, c.mes, 1);
  const inicio = lunesDe(isoLocal(primero));
  const hoy = hoyISO();
  const tituloBase = primero.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const titulo = tituloBase.charAt(0).toUpperCase() + tituloBase.slice(1);
  let celdas = '';
  for (let i = 0; i < 42; i++) {
    const iso = sumarDias(inicio, i);
    const d = deISO(iso);
    if (i >= 35 && d.getMonth() !== c.mes) break;
    const finde = d.getDay() === 0 || d.getDay() === 6;
    const evs = eventosDelDia(iso);
    const ses = sesionesDelDia(iso).filter(({ p }) => !c.grupoId || p.grupoId === c.grupoId);
    const perIni = S.config.periodos.filter((p) => p.inicio === iso);
    const perFin = S.config.periodos.filter((p) => p.fin === iso);
    celdas += `<div class="dia ${d.getMonth() !== c.mes ? 'fuera' : ''} ${iso === hoy ? 'hoy' : ''} ${finde ? 'finde' : ''}" onclick="dialogoDia('${iso}')">
      <span class="n">${d.getDate()}</span>
      ${perIni.map((p) => `<div class="item periodo">▶ Inicia ${esc(p.nombre)}</div>`).join('')}
      ${perFin.map((p) => `<div class="item periodo">■ Termina ${esc(p.nombre)}</div>`).join('')}
      ${evs.map((e) => `<div class="item ${esc(e.tipo)}" title="${esc(e.titulo)}">${esc(e.titulo)}</div>`).join('')}
      ${ses.slice(0, 4).map(({ p, s }) => `<div class="item plan" title="${esc(nombreGrupoId(p.grupoId))} · ${esc(nombreArea(p.areaId))}: ${esc(s.titulo || p.titulo)}" onclick="event.stopPropagation();editarPlaneacion('${p.id}')">${esc(porId(S.grupos, p.grupoId)?.nombre || '')} ${esc(s.titulo || p.titulo || 'Clase')}</div>`).join('')}
      ${ses.length > 4 ? `<div class="ayuda">+${ses.length - 4} más</div>` : ''}
    </div>`;
  }
  return `
  <div class="cabecera"><div><h1>Calendario</h1><p class="sub">Clases planeadas, periodos y eventos institucionales. Haz clic en un día para agregar un evento o planear.</p></div>
    <div class="acciones"><button class="btn" onclick="festivosColombia()">🇨🇴 Agregar festivos de Colombia</button></div></div>
  <div class="filtros tarjeta" style="align-items:center">
    <button class="btn" onclick="moverMes(-1)">◀</button>
    <h2 style="margin:0;min-width:200px;text-align:center">${esc(titulo)}</h2>
    <button class="btn" onclick="moverMes(1)">▶</button>
    <button class="btn" onclick="ui.calMes.anio=new Date().getFullYear();ui.calMes.mes=new Date().getMonth();render()">Hoy</button>
    <div style="margin-left:auto"><label>Mostrar clases de</label><select onchange="ui.calMes.grupoId=this.value;render()">${opcionesGrupos(c.grupoId, 'Todos los grupos')}</select></div>
  </div>
  <div class="cal">${DIAS_SEMANA.map((d) => `<div class="dsem">${d}</div>`).join('')}${celdas}</div>
  <div class="fila" style="margin-top:10px">${Object.entries(TIPOS_EVENTO).map(([k, v]) => `<span class="item ${k}">${v}</span>`).join('')}<span class="item plan">Clase planeada</span><span class="item periodo">Periodo académico</span></div>`;
};

function moverMes(d) {
  const c = ui.calMes;
  c.mes += d;
  if (c.mes < 0) { c.mes = 11; c.anio--; }
  if (c.mes > 11) { c.mes = 0; c.anio++; }
  render();
}

function dialogoDia(iso) {
  const evs = eventosDelDia(iso);
  const ses = sesionesDelDia(iso);
  abrirModal(`<h2 style="text-transform:capitalize">${esc(fechaLarga(iso))}</h2>
    ${ses.length ? `<h3>Clases planeadas</h3><ul class="lista-simple">${ses.map(({ p, s, i }) => `<li><div><b>${esc(nombreGrupoId(p.grupoId))}</b> · ${esc(nombreArea(p.areaId))}<br><span class="ayuda">Sesión ${i + 1}: ${esc(s.titulo || p.titulo || '')}</span></div><button class="btn pequeno" onclick="cerrarModal();editarPlaneacion('${p.id}')">Abrir</button></li>`).join('')}</ul>` : ''}
    ${evs.length ? `<h3>Eventos</h3><ul class="lista-simple">${evs.map((e) => `<li><div><span class="item ${esc(e.tipo)}" style="display:inline-block">${esc(TIPOS_EVENTO[e.tipo])}</span> ${esc(e.titulo)}</div><button class="icono" title="Eliminar" onclick="eliminarEvento('${e.id}','${iso}')">🗑️</button></li>`).join('')}</ul>` : ''}
    <h3>Agregar evento</h3>
    <div class="rejilla r2">
      <div class="campo" style="grid-column: span 2"><label>Descripción</label><input id="m-tit" placeholder="Ej.: Día E, Semana de receso, Entrega de informes…"></div>
      <div class="campo"><label>Tipo</label><select id="m-tipo">${Object.entries(TIPOS_EVENTO).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="campo"><label>Hasta (opcional)</label><input type="date" id="m-fin" min="${iso}"></div>
    </div>
    <div class="botones"><button class="btn" style="margin-right:auto" onclick="cerrarModal();nuevaPlaneacion('${iso}')">📝 Planear clase este día</button>
      <button class="btn" onclick="cerrarModal()">Cerrar</button><button class="btn primario" onclick="guardarEvento('${iso}')">Agregar evento</button></div>`);
}
function guardarEvento(iso) {
  const titulo = document.getElementById('m-tit').value.trim();
  if (!titulo) return aviso('Escribe la descripción del evento', 'error');
  const fin = document.getElementById('m-fin').value;
  S.eventos.push({ id: uid(), fecha: iso, fechaFin: fin && fin > iso ? fin : '', titulo, tipo: document.getElementById('m-tipo').value });
  guardar(); cerrarModal(); render();
}
function eliminarEvento(id, iso) {
  S.eventos = S.eventos.filter((e) => e.id !== id);
  guardar(); render(); dialogoDia(iso);
}

// Festivos de Colombia (Ley 51 de 1983 "Ley Emiliani")
function pascua(anio) {
  const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return isoLocal(new Date(anio, mes - 1, dia));
}
function siguienteLunes(iso) { const d = deISO(iso).getDay(); return d === 1 ? iso : sumarDias(iso, (8 - d) % 7); }
function festivosDelAnio(anio) {
  const p = pascua(anio);
  const fijos = [['01-01', 'Año Nuevo'], ['05-01', 'Día del Trabajo'], ['07-20', 'Día de la Independencia'], ['08-07', 'Batalla de Boyacá'], ['12-08', 'Inmaculada Concepción'], ['12-25', 'Navidad']];
  const trasladables = [['01-06', 'Reyes Magos'], ['03-19', 'San José'], ['06-29', 'San Pedro y San Pablo'], ['08-15', 'Asunción de la Virgen'], ['10-12', 'Día de la Raza'], ['11-01', 'Todos los Santos'], ['11-11', 'Independencia de Cartagena']];
  return [
    ...fijos.map(([f, n]) => [`${anio}-${f}`, n]),
    ...trasladables.map(([f, n]) => [siguienteLunes(`${anio}-${f}`), n]),
    [sumarDias(p, -3), 'Jueves Santo'], [sumarDias(p, -2), 'Viernes Santo'],
    [sumarDias(p, 43), 'Ascensión del Señor'], [sumarDias(p, 64), 'Corpus Christi'], [sumarDias(p, 71), 'Sagrado Corazón'],
  ].sort();
}
function festivosColombia() {
  const anio = +S.config.anio || new Date().getFullYear();
  let n = 0;
  for (const [fecha, titulo] of festivosDelAnio(anio)) {
    if (S.eventos.some((e) => e.fecha === fecha && e.tipo === 'festivo')) continue;
    S.eventos.push({ id: uid(), fecha, fechaFin: '', titulo, tipo: 'festivo' });
    n++;
  }
  guardar(); render();
  aviso(n ? `Se agregaron ${n} festivos de ${anio}` : `Los festivos de ${anio} ya estaban registrados`, 'ok');
}

// ---------- Cronograma ----------
RENDERS.cronograma = () => {
  const c = ui.crono || (ui.crono = { areaId: '', grado: '', periodoId: '' });
  if (!c.areaId && S.areas.length) c.areaId = S.areas[0].id;
  if (!c.grado) c.grado = String(S.grupos.length ? [...S.grupos].sort(ordenGrupos)[0].grado : 6);
  if (!c.periodoId) c.periodoId = (periodoDeFecha(hoyISO()) || S.config.periodos[0] || {}).id || '';
  const per = porId(S.config.periodos, c.periodoId);
  const grados = [...new Set(S.grupos.map((g) => g.grado))].sort((a, b) => a - b);
  if (!grados.length) grados.push(6, 7, 8, 9);

  let cuerpo = '<div class="tarjeta vacio">Selecciona área, grado y periodo (con fechas definidas en Configuración).</div>';
  if (per && per.inicio && per.fin && c.areaId) {
    const semanas = [];
    for (let l = lunesDe(per.inicio), n = 1; l <= per.fin; l = sumarDias(l, 7), n++) semanas.push({ n, lunes: l, viernes: sumarDias(l, 4) });
    const gruposGrado = S.grupos.filter((g) => String(g.grado) === c.grado).map((g) => g.id);
    const hechas = semanas.filter((s) => S.cronograma[claveCrono(c, s.lunes)]?.hecho).length;
    cuerpo = `<p class="ayuda">${semanas.length} semanas · ${hechas} desarrolladas. Escribe los temas o contenidos previstos para cada semana; las planeaciones y eventos de esa semana aparecen al lado.</p>
    <div class="envoltura-tabla"><table class="tabla"><thead><tr><th class="num">Sem.</th><th>Fechas</th><th style="width:38%">Temas / contenidos previstos</th><th>Planeaciones de la semana</th><th>Eventos</th><th class="num">✔</th></tr></thead><tbody>
    ${semanas.map((s) => {
      const e = S.cronograma[claveCrono(c, s.lunes)] || {};
      const planes = S.planeaciones.filter((p) => p.areaId === c.areaId && gruposGrado.includes(p.grupoId) &&
        (p.sesiones || []).some((x) => x.fecha && x.fecha >= s.lunes && x.fecha <= sumarDias(s.lunes, 6)));
      const evs = S.eventos.filter((ev) => ev.fecha <= s.viernes && (ev.fechaFin || ev.fecha) >= s.lunes);
      return `<tr class="${e.hecho ? 'semana-hecha' : ''}">
        <td class="num"><b>${s.n}</b></td>
        <td style="white-space:nowrap">${esc(fechaCorta(s.lunes))}<br><span class="ayuda">al ${esc(fechaCorta(s.viernes))}</span></td>
        <td><textarea style="min-height:48px" oninput="cambiarCrono('${s.lunes}','tema',this.value)">${esc(e.tema || '')}</textarea></td>
        <td>${planes.map((p) => `<a href="#" onclick="editarPlaneacion('${p.id}');return false">${esc(porId(S.grupos, p.grupoId)?.nombre || '')}: ${esc(p.titulo || 'Sin título')}</a>`).join('<br>') || `<button class="btn pequeno" onclick="nuevaPlaneacion('${s.lunes}')">＋ Planear</button>`}</td>
        <td>${evs.map((ev) => `<span class="item ${esc(ev.tipo)}" style="display:inline-block">${esc(ev.titulo)}</span>`).join(' ')}</td>
        <td class="num"><input type="checkbox" ${e.hecho ? 'checked' : ''} onchange="cambiarCrono('${s.lunes}','hecho',this.checked);render()" title="Semana desarrollada"></td></tr>`;
    }).join('')}
    </tbody></table></div>`;
  }
  return `
  <div class="cabecera"><div><h1>Cronograma</h1><p class="sub">Distribución de temas por semana para cada área y grado (plan de periodo).</p></div>
    <div class="acciones"><button class="btn" onclick="copiarCronograma()">📑 Copiar a otro periodo/grado</button><button class="btn" onclick="exportarCronograma()">⬇️ Exportar a Excel</button></div></div>
  <div class="filtros tarjeta">
    <div><label>Área</label><select onchange="ui.crono.areaId=this.value;render()">${opcionesAreas(c.areaId, 'Selecciona…')}</select></div>
    <div><label>Grado</label><select onchange="ui.crono.grado=this.value;render()">${grados.map((g) => `<option value="${g}" ${String(g) === c.grado ? 'selected' : ''}>${g}°</option>`).join('')}</select></div>
    <div><label>Periodo</label><select onchange="ui.crono.periodoId=this.value;render()">${opcionesPeriodos(c.periodoId, 'Selecciona…')}</select></div>
  </div>
  ${cuerpo}`;
};

function claveCrono(c, lunes) { return `${c.areaId}|${c.grado}|${c.periodoId}|${lunes}`; }
function cambiarCrono(lunes, campo, valor) {
  const k = claveCrono(ui.crono, lunes);
  (S.cronograma[k] ||= {})[campo] = valor;
  guardar();
}
function copiarCronograma() {
  const grados = [...new Set([...S.grupos.map((g) => g.grado), 6, 7, 8, 9])].sort((a, b) => a - b);
  abrirModal(`<h2>Copiar cronograma</h2><p class="ayuda">Copia los temas de ${esc(nombreArea(ui.crono.areaId))} ${esc(ui.crono.grado)}° – ${esc(nombrePeriodo(ui.crono.periodoId))}, semana por semana, a otro destino (sin marcas de "desarrollado").</p>
    <div class="rejilla r3">
      <div class="campo"><label>Área</label><select id="m-area">${opcionesAreas(ui.crono.areaId)}</select></div>
      <div class="campo"><label>Grado</label><select id="m-grado">${grados.map((g) => `<option ${String(g) === ui.crono.grado ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
      <div class="campo"><label>Periodo</label><select id="m-per">${opcionesPeriodos(ui.crono.periodoId)}</select></div>
    </div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="ejecutarCopiaCrono()">Copiar</button></div>`);
}
function ejecutarCopiaCrono() {
  const o = ui.crono;
  const d = { areaId: document.getElementById('m-area').value, grado: document.getElementById('m-grado').value, periodoId: document.getElementById('m-per').value };
  const po = porId(S.config.periodos, o.periodoId), pd = porId(S.config.periodos, d.periodoId);
  if (!po?.inicio || !pd?.inicio) return aviso('Los periodos necesitan fechas', 'error');
  const lo = lunesDe(po.inicio), ld = lunesDe(pd.inicio);
  let n = 0;
  for (let i = 0; i < 60; i++) {
    const src = S.cronograma[claveCrono(o, sumarDias(lo, i * 7))];
    if (src?.tema) { (S.cronograma[claveCrono(d, sumarDias(ld, i * 7))] ||= {}).tema = src.tema; n++; }
  }
  guardar(); cerrarModal();
  Object.assign(ui.crono, d); render();
  aviso(`Se copiaron ${n} semana(s)`, 'ok');
}
function exportarCronograma() {
  const c = ui.crono;
  const per = porId(S.config.periodos, c.periodoId);
  if (!per?.inicio) return;
  const filas = [['Semana', 'Desde', 'Hasta', 'Temas / contenidos', 'Desarrollada']];
  for (let l = lunesDe(per.inicio), n = 1; l <= per.fin; l = sumarDias(l, 7), n++) {
    const e = S.cronograma[claveCrono(c, l)] || {};
    filas.push([n, fechaCorta(l), fechaCorta(sumarDias(l, 4)), e.tema || '', e.hecho ? 'Sí' : '']);
  }
  api.guardarCSV(`Cronograma ${nombreArea(c.areaId)} ${c.grado} ${per.nombre}`, aCSV(filas));
}
