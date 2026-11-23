// ================= Mapa de cobertura curricular =================
// Cruza los referentes oficiales (estándares, DBA, orientaciones) con la malla y las planeaciones

const ESTADO_COB = {
  sin: { t: 'Sin trabajar', c: 'cob-sin' },
  malla: { t: 'En la malla', c: 'cob-malla' },
  planeado: { t: 'Planeado en clase', c: 'cob-planeado' },
  desarrollado: { t: 'Desarrollado', c: 'cob-desarrollado' },
};
const NIVEL_COB = { sin: 0, malla: 1, planeado: 2, desarrollado: 3 };

function huella(t) { return normalizar(t).replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim(); }
// Un referente "aparece" en un texto si está su comienzo (unas 8 palabras) o, en los DBA, su número
function apareceEn(texto, frase, numDba) {
  const f = huella(frase).split(' ').slice(0, 8).join(' ');
  if (f.length >= 20 && texto.includes(f)) return true;
  if (numDba && new RegExp(`\\bdba\\s*(n\\s*o?\\s*)?${numDba}\\b`).test(texto)) return true;
  return false;
}
function unidadesCobertura(area, grado, tipo) {
  const lista = referentesDe(area, grado, tipo || undefined);
  const u = [];
  for (const r of lista) {
    if (r.tipo === 'dba') u.push({ id: r.id, tipo: r.tipo, grupo: r.factor, texto: r.enunciado, frases: [r.enunciado, ...r.items], num: (/\d+/.exec(r.factor) || [])[0] });
    else r.items.forEach((it, i) => u.push({ id: r.id + '|' + i, tipo: r.tipo, grupo: r.factor + (r.enunciado ? ' – ' + r.enunciado.slice(0, 80) : ''), texto: it, frases: [it] }));
  }
  return u;
}
function calcularCobertura(areaId, grado, tipo, grupoId) {
  const area = areaReferenteDe(areaId);
  if (!area) return null;
  const unidades = unidadesCobertura(area, grado, tipo);
  const m = obtenerMalla(areaId, grado, false);
  const hoy = hoyISO();
  const grupos = grupoId ? [grupoId] : S.grupos.filter((g) => +g.grado === +grado).map((g) => g.id);
  const textoMalla = {}, textoPlan = {}, textoHecho = {};
  for (const per of S.config.periodos) {
    textoMalla[per.id] = huella((m?.periodos[per.id]?.items || []).map((it) => [it.estandares, it.dba, it.competencias, it.evidencias, it.desempenoSaber, it.desempenoHacer].join(' ')).join(' '));
    const planes = S.planeaciones.filter((p) => p.areaId === areaId && grupos.includes(p.grupoId) && (p.periodoId === per.id || (!p.periodoId && periodoDeFecha(p.fechaInicio || '')?.id === per.id)));
    const txt = (p) => [p.estandares, p.dba, p.competencias, p.evidencias, p.componentes].join(' ');
    textoPlan[per.id] = huella(planes.map(txt).join(' '));
    textoHecho[per.id] = huella(planes.filter((p) => p.estado === 'terminada' || (p.sesiones || []).some((s) => s.fecha && s.fecha < hoy)).map(txt).join(' '));
  }
  const filas = unidades.map((u) => {
    const est = {};
    for (const per of S.config.periodos) {
      const en = (t) => u.frases.some((f) => apareceEn(t, f, u.tipo === 'dba' ? u.num : null));
      est[per.id] = en(textoHecho[per.id]) ? 'desarrollado' : en(textoPlan[per.id]) ? 'planeado' : en(textoMalla[per.id]) ? 'malla' : 'sin';
    }
    const total = Object.values(est).reduce((a, b) => (NIVEL_COB[b] > NIVEL_COB[a] ? b : a), 'sin');
    return { ...u, est, total };
  });
  return { area, filas };
}

function vistaCobertura(c) {
  const f = ui.cob || (ui.cob = { tipo: 'dba', grupoId: '' });
  const area = areaReferenteDe(c.areaId);
  const filtros = `${filtrosCur(c, { grado: true })}
    <div class="filtros tarjeta" style="margin-top:-6px">
      <div><label>Referente</label><select onchange="ui.cob.tipo=this.value;render()">${Object.entries(TIPOS_REFERENTE).map(([k, t]) => `<option value="${k}" ${f.tipo === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div><label>Planeaciones de</label><select onchange="ui.cob.grupoId=this.value;render()">${opciones([...S.grupos].filter((g) => +g.grado === +c.grado).sort(ordenGrupos), f.grupoId, { vacio: `Todos los grupos de ${c.grado}°`, texto: nombreGrupo })}</select></div></div>`;
  if (!area) return filtros + `<div class="tarjeta vacio">No hay referentes oficiales cargados para ${esc(nombreArea(c.areaId))}. Están disponibles: Matemáticas, Lenguaje, Ciencias Naturales, Ciencias Sociales, Inglés (DBA 6.°–11.°), Competencias Ciudadanas y Tecnología.</div>`;
  const cob = calcularCobertura(c.areaId, c.grado, f.tipo, f.grupoId);
  if (!cob.filas.length) return filtros + `<div class="tarjeta vacio">No hay referentes del tipo "${esc(TIPOS_REFERENTE[f.tipo])}" de ${esc(area)} para ${c.grado}°. Prueba con otro tipo de referente.</div>`;
  const n = (e) => cob.filas.filter((x) => x.total === e).length;
  const pct = (e) => Math.round((n(e) / cob.filas.length) * 100);
  let grupoAnt = '';
  return filtros + `
  <div class="tarjeta"><div class="cabecera" style="margin-bottom:8px"><h2 style="margin:0">🗺️ Cobertura: ${esc(TIPOS_REFERENTE[f.tipo])} · ${esc(area)} ${esc(c.grado)}°</h2>
    <button class="btn" onclick="exportarCobertura()">⬇️ Excel</button></div>
    <div class="barra-cobertura">${['desarrollado', 'planeado', 'malla', 'sin'].map((e) => n(e) ? `<div class="${ESTADO_COB[e].c}" style="width:${(n(e) / cob.filas.length) * 100}%" title="${ESTADO_COB[e].t}: ${n(e)}">${pct(e) >= 8 ? pct(e) + '%' : ''}</div>` : '').join('')}</div>
    <div class="fila" style="margin-top:8px">${['desarrollado', 'planeado', 'malla', 'sin'].map((e) => `<span class="leyenda-cob"><span class="${ESTADO_COB[e].c}"></span> ${ESTADO_COB[e].t}: <b>${n(e)}</b> (${pct(e)}%)</span>`).join('')}</div>
    <p class="ayuda" style="margin-bottom:0">Se detecta cuando el texto del referente (o "DBA n") aparece en la malla o en las planeaciones de clase. Usa el botón <b>📘 Referentes</b> al planear para que quede registrado. "Desarrollado" = planeación terminada o con sesiones ya dictadas.</p></div>
  <div class="tarjeta" style="padding:0"><div class="envoltura-tabla" style="border:0"><table class="tabla cobertura"><thead><tr><th>${f.tipo === 'dba' ? 'DBA' : 'Referente'}</th>${S.config.periodos.map((p) => `<th class="num" style="width:90px">${esc(p.nombre.replace(/ periodo$/i, '').replace(/^Periodo /i, 'P'))}</th>`).join('')}</tr></thead><tbody>
    ${cob.filas.map((x) => { const cab = x.grupo !== grupoAnt && f.tipo !== 'dba' ? `<tr class="cob-grupo"><td colspan="${S.config.periodos.length + 1}">${esc(x.grupo)}</td></tr>` : ''; grupoAnt = x.grupo;
      return `${cab}<tr><td>${f.tipo === 'dba' ? `<b>${esc(x.grupo)}.</b> ` : ''}${esc(x.texto.length > 220 ? x.texto.slice(0, 217) + '…' : x.texto)}</td>${S.config.periodos.map((p) => `<td class="${ESTADO_COB[x.est[p.id]].c}" title="${ESTADO_COB[x.est[p.id]].t}"></td>`).join('')}</tr>`; }).join('')}
  </tbody></table></div></div>`;
}
function exportarCobertura() {
  const c = ui.cur, f = ui.cob;
  const cob = calcularCobertura(c.areaId, c.grado, f.tipo, f.grupoId);
  const filas = [['Tipo', 'Grupo / factor', 'Referente', ...S.config.periodos.map((p) => p.nombre), 'Estado general'],
    ...cob.filas.map((x) => [TIPOS_REFERENTE[x.tipo], x.grupo, x.texto, ...S.config.periodos.map((p) => ESTADO_COB[x.est[p.id]].t), ESTADO_COB[x.total].t])];
  exportarExcel(`Cobertura ${cob.area} ${c.grado}° ${TIPOS_REFERENTE[f.tipo]}`, filas);
}
