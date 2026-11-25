// Recorre todas las pantallas y pestañas con datos de un año completo (no solo con datos vacíos)
const { assert, abrir, esperarGuardado, nuevaCarpeta, prueba, sembrar, terminar } = require('./util');

async function sembrarAnio(w) {
  await w.evaluate(() => {
    const hoy = hoyISO();
    const per = periodoDeFecha(hoy) || S.config.periodos[0];
    S.areas.push({ id: 'a2', nombre: 'Ciencias Naturales' });
    S.grupos[0].areas.push({ areaId: 'a2', horas: 3 });
    S.alumnos[0].piar = true;
    S.alumnos[1].perfil = { vak: { v: 5, a: 3, k: 2 } };
    // programación y notas
    for (const areaId of ['a1', 'a2']) for (const p of S.config.periodos) {
      const pl = obtenerPlanilla('g1', areaId, p.id);
      pl.criterios.forEach((c, ci) => c.actividades.forEach((a, ai) => {
        a.fecha = sumarDias(p.inicio, 7 * (ci + ai));
        S.notas[a.id] = Object.fromEntries(alumnosDe('g1').map((al, k) => [al.id, +(1 + ((k * 7 + ci * 3 + ai) % 40) / 10).toFixed(1)]));
      }));
    }
    S.recuperaciones[claveRecuperacion('g1', 'a1', per.id)] = { [S.alumnos[2].id]: { nota: 3.5 } };
    // asistencia, diario, anotaciones, eventos, horario
    for (let d = 0; d < 20; d++) { const f = sumarDias(per.inicio, d); S.asistencia['g1|a1'] ||= {}; S.asistencia['g1|a1'][f] = Object.fromEntries(alumnosDe('g1').map((a, k) => [a.id, (k + d) % 9 ? 'P' : 'A'])); }
    S.diario.push({ id: uid(), grupoId: 'g1', areaId: 'a1', fecha: hoy, clima: 'bien', logrado: 'Fracciones', pendiente: 'Repasar', novedades: '' });
    S.anotaciones.push({ id: uid(), alumnoId: S.alumnos[3].id, grupoId: 'g1', areaId: 'a1', fecha: hoy, tipo: 'positiva', texto: 'Ayudó a un compañero', origen: 'pc' });
    S.eventos.push({ id: uid(), fecha: sumarDias(hoy, 3), fechaFin: '', titulo: 'Izada de bandera', tipo: 'institucional' });
    S.horario = { ...(typeof horario === 'function' ? horario() : {}), celdas: {} };
    const h = horario(); h.celdas[`${diaSemana(hoy)}|${h.bloques.find((b) => !b.descanso).id}`] = { grupoId: 'g1', areaId: 'a1' };
    // curricular
    const m = obtenerMalla('a1', 7); periodoMalla(m, per.id).items.push({ id: uid(), eje: 'Números racionales', contenidos: 'Fracciones', horas: 8 });
    Object.assign(obtenerPlanArea('a1'), { diagnostico: 'Diagnóstico', justificacion: 'Justificación' });
    // planeación, apoyo, PIAR, prueba, ficha, pendientes, portafolio, gamificación
    S.planeaciones.push({ id: 'pl-1', titulo: 'Fracciones equivalentes', grupoId: 'g1', areaId: 'a1', tipo: 'sesion', estado: 'borrador', estandares: 'Resuelvo…', dba: 'DBA 2', objetivo: 'Reconocer fracciones', pregunta: '¿Cómo repartir?',
      sesiones: [{ ...nuevaSesion(hoy), titulo: 'Sesión 1', exploracion: 'Pregunta', estructuracion: 'Regletas', practica: 'Taller' }] });
    S.planesApoyo.push(nuevoPlanApoyo('g1', 'a1', per.id, S.alumnos[4].id));
    obtenerPiar(S.alumnos[0].id);
    S.pruebas.push({ id: 'pr-1', titulo: 'Quiz', tipo: 'saber', grupoId: 'g1', areaId: 'a1', periodoId: per.id, instrucciones: '', preguntas: [{ id: 'q1', tipo: 'multiple', enunciado: '¿1/2 = 2/4?', opciones: ['Sí', 'No', 'A veces', 'Nunca'], correcta: 'A' }], respuestas: { [S.alumnos[0].id]: 'A' }, abiertas: {} });
    S.pendientes.push({ id: uid(), texto: 'Entregar planillas', fecha: hoy, hecho: false, creado: hoy });
    portafolio().evidencias.push({ id: uid(), competencia: 'liderazgo', titulo: 'Feria', fecha: hoy, descripcion: '', ubicacion: '' });
    darPuntos('g1', ['a:' + S.alumnos[5].id], 2, 'Participación');
    guardar();
  });
}

module.exports = { sembrarAnio };
if (require.main === module) (async () => {
  await prueba('Todas las pantallas y pestañas funcionan con datos de un año completo', async () => {
    const { app, w, errores } = await abrir(nuevaCarpeta());
    await sembrar(w);
    await sembrarAnio(w);
    const fallas = await w.evaluate(async () => {
      const f = [];
      const probar = (nombre, fn) => { try { cerrarModal(); fn(); } catch (e) { f.push(`${nombre}: ${e.message}`); } };
      const per = (periodoDeFecha(hoyISO()) || S.config.periodos[0]).id;
      for (const v of Object.keys(RENDERS).filter((k) => !k.endsWith('_despues'))) probar(v, () => ir(v, {}));
      for (const p of ['programacion', 'planilla', 'anual', 'apoyo', 'riesgo', 'observaciones', 'rubricas']) probar('calificaciones/' + p, () => { ui.cal = { grupoId: 'g1', areaId: 'a1', periodoId: per, pestana: p }; ir('calificaciones'); });
      for (const p of ['area', 'malla', 'periodo', 'aula', 'cobertura', 'referentes']) probar('curricular/' + p, () => { ui.cur = { pestana: p, areaId: 'a1', grado: 7, periodoId: per, grupoId: 'g1' }; ir('curricular'); });
      for (const p of ['estudiantes', 'equipos', 'tablero', 'historial']) probar('gamificacion/' + p, () => { ui.gam = { grupoId: 'g1', pestana: p, sel: {} }; ir('gamificacion'); });
      probar('seguimiento/grupo', () => { ui.seg = { grupoId: 'g1', alumnoId: '', areaId: 'a1', periodoId: per }; ir('seguimiento'); });
      probar('seguimiento/estudiante', () => { ui.seg = { grupoId: 'g1', alumnoId: S.alumnos[0].id, areaId: 'a1', periodoId: per }; ir('seguimiento'); });
      probar('asistencia', () => { ui.asis = null; ir('asistencia'); });
      probar('editor', () => ir('editor', { id: 'pl-1' }));
      probar('piarEditor', () => ir('piarEditor', { alumnoId: S.alumnos[0].id }));
      probar('pruebaEditor', () => ir('pruebaEditor', { id: 'pr-1' }));
      probar('alumnos', () => ir('alumnos', { grupoId: 'g1' }));
      probar('perfil', () => ir('perfil', { grupoId: 'g1' }));
      probar('inicio', () => ir('inicio'));
      for (const p of ['azar', 'equipos', 'temporizador', 'proyector', 'tablero']) probar('aula/' + p, () => abrirAula('g1', 'a1', p));
      probar('portafolio', () => { ir('portafolio'); if (!evidenciasAutomaticas('', '').evaluacion.length) throw new Error('sin evidencias'); });
      probar('buscador', () => abrirBuscador());
      probar('diario', () => abrirDiario('g1', 'a1'));
      await new Promise((r) => setTimeout(r, 300));
      cerrarModal();
      return f;
    });
    await esperarGuardado(w);
    await app.close();
    assert.deepStrictEqual(fallas, []);
    assert.deepStrictEqual(errores, []);
  });
  await prueba('Un paquete o respaldo con identificadores manipulados no puede ejecutar código', async () => {
    const { app, w, errores } = await abrir(nuevaCarpeta());
    await sembrar(w);
    const r = await w.evaluate(() => {
      window.__atacado = false;
      const malo = "x');window.__atacado=true;('";
      // paquete de otro docente
      window._paquete = { formato: 'paquete-planeador', autor: 'X', areas: [{ id: malo, nombre: 'Matemáticas' }],
        planeaciones: [{ id: malo, titulo: 'Trampa', areaId: malo, grupoId: malo, sesiones: [{ id: malo, fecha: hoyISO() }] }],
        rubricas: [{ id: malo, nombre: 'R', criterios: [{ id: malo, nombre: 'c' }], niveles: [] }] };
      abrirModal('<input type="checkbox" class="m-pi" value="planeaciones" checked><input type="checkbox" class="m-pi" value="rubricas" checked>');
      ejecutarImportacion();
      // respaldo que se restaura (pasa por migrar)
      const datos = JSON.parse(textoEstado());
      datos.grupos[0].id = malo; datos.alumnos[0].grupoId = malo; datos.pizarras = [{ id: 't1', titulo: 'T', grupoIds: [malo, 'g1'], items: [] }];
      aplicarRespaldo(datos);
      for (const v of ['banco', 'planeaciones', 'calificaciones', 'grupos', 'pizarras', 'rubricas']) { try { ir(v); } catch (e) { /* */ } }
      document.querySelectorAll('[onclick]').forEach((b) => { if (b.getAttribute('onclick').includes('__atacado')) window.__atacadoEnBoton = true; });
      return { atacado: window.__atacado, enBoton: !!window.__atacadoEnBoton, texto: JSON.stringify(S).includes('__atacado') };
    });
    await app.close();
    assert.deepStrictEqual(r, { atacado: false, enBoton: false, texto: false });
    assert.deepStrictEqual(errores.filter((e) => !/__atacado/.test(e)), []);
  });

  await prueba('Se llama Tiza, el menú Ayuda abre "Acerca de" y la carpeta de datos conserva su nombre', async () => {
    const { _electron } = require('playwright-core');
    const RAIZ = require('path').join(__dirname, '..');
    const env = { ...process.env }; delete env.PLANEADOR_DATA_DIR;
    const app = await _electron.launch({ executablePath: require(require('path').join(RAIZ, 'node_modules', 'electron')), args: [RAIZ, '--no-sandbox'], env });
    const w = await app.firstWindow();
    await w.waitForFunction(() => typeof S !== 'undefined' && S);
    const r = await app.evaluate(({ app, Menu, BrowserWindow }) => {
      const ayuda = Menu.getApplicationMenu().items.find((x) => x.label === 'Ayuda');
      ayuda.submenu.items[0].click();
      return { datos: app.getPath('userData'), menu: ayuda.submenu.items.map((x) => x.label), titulo: BrowserWindow.getAllWindows()[0].getTitle() };
    });
    await w.waitForSelector('.acerca h1');
    const acerca = await w.evaluate(() => document.querySelector('.acerca').textContent);
    await app.close();
    assert.match(r.datos, /Planeador Docente$/);
    assert.strictEqual(r.menu[0], 'Acerca de Tiza');
    assert.match(acerca, /Creado porDocenTech/);
    assert.match(acerca, /Tiza[\s\S]*Versión \d+\.\d+\.\d+[\s\S]*Software libre/);
  });

  await prueba('Código malicioso en todos los textos de un año completo: no se ejecuta en ninguna pantalla', async () => {
    const { app, w, errores } = await abrir(nuevaCarpeta());
    await sembrar(w);
    await sembrarAnio(w);
  const r = await w.evaluate(async () => {
    window.__xss = [];
    const carga = (k) => `"'><img src=x onerror="window.__xss.push('${k}')">`;
    const NO = /^(id|tipo|estado|fecha|fechaFin|inicio|fin|grado|gradoOrigen|color|modo|tema|zoom|proveedor|url|formato|pestana|clima|correcta|alcance|tipoPlan|o|f|act|al|g|ar|p|hash|expira|creado|ultimo|creada|modificada|version|dia|hora|letra|valor|nota|peso|desde|hasta|duracion|origen|destino|fuente|colorMenu|colorAcento|atajo)$/;
    let n = 0;
    const recorrer = (o, ruta, nivel = 0) => {
      if (!o || typeof o !== 'object' || nivel > 12) return;
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === 'string' && !NO.test(k) && !/Id$|Ids$/.test(k) && !/^(data:|#|\d{4}-\d\d)/.test(v) && v.length < 2000) { o[k] = v + carga(ruta + '.' + k); n++; }
        else if (v && typeof v === 'object' && !['notas', 'asistencia', 'recuperaciones', 'entregas', 'notasRubrica', 'cronograma'].includes(k)) recorrer(v, ruta + '.' + k, nivel + 1);
      }
    };
    for (const k of Object.keys(S)) if (!['config', 'notas', 'asistencia'].includes(k)) recorrer(S[k], k);
    recorrer(S.config, 'config');
    // también como claves de mapas
    S.observaciones[`g1|a1|${(periodoDeFecha(hoyISO()) || S.config.periodos[0]).id}`] = { al1: 'obs' + carga('obs') };
    const per = (periodoDeFecha(hoyISO()) || S.config.periodos[0]).id;
    const vistas = [];
    for (const v of Object.keys(RENDERS).filter((k) => !k.endsWith('_despues'))) vistas.push([v, '']);
    for (const p of ['programacion', 'planilla', 'entregas', 'anual', 'apoyo', 'riesgo', 'observaciones', 'rubricas', 'registro']) vistas.push(['calificaciones', () => { ui.cal = {grupoId:'g1',areaId:'a1',periodoId:per,pestana:p}; }]);
    for (const p of ['area', 'malla', 'periodo', 'aula', 'cobertura', 'referentes']) vistas.push(['curricular', () => { ui.cur = {pestana:p,areaId:'a1',grado:7,periodoId:per,grupoId:'g1'}; }]);
    for (const p of ['estudiantes', 'equipos', 'tablero', 'historial']) vistas.push(['gamificacion', () => { ui.gam = {grupoId:'g1',pestana:p,sel:{}}; }]);
    vistas.push(['seguimiento', () => { ui.seg = { grupoId: 'g1', alumnoId: S.alumnos[0].id, areaId: 'a1', periodoId: per }; }], ['seguimiento', () => { ui.seg = { grupoId: 'g1', alumnoId: '', areaId: 'a1', periodoId: per }; }]);
    const fallas = [];
    for (const [v, setup] of vistas) {
      try { cerrarModal(); if (setup) setup(); ir(v, v === 'editor' ? { id: 'pl-1' } : v === 'piarEditor' ? { alumnoId: 'al0' } : v === 'pruebaEditor' ? { id: 'pr-1' } : v === 'alumnos' || v === 'perfil' ? { grupoId: 'g1' } : {}); } catch (e) { fallas.push(v + ': ' + e.message); }
      await new Promise((r) => setTimeout(r, 30));
    }
    // ventanas emergentes frecuentes
    for (const f of [() => abrirDiario('g1', 'a1'), () => abrirBuscador(), () => abrirAula('g1', 'a1', 'azar'), () => abrirAula('g1', 'a1', 'tablero'), () => abrirAula('g1', 'a1', 'equipos'), () => verHistorialNota(Object.keys(S.notas)[0], 'al0'), () => dialogoRetro(), () => abrirAcercaDe(), () => dialogoVincularCelular()]) {
      try { cerrarModal(); f(); } catch (e) { fallas.push(String(f) + ': ' + e.message); }
      await new Promise((r) => setTimeout(r, 50));
    }
    await new Promise((r) => setTimeout(r, 300));
    return { n, xss: [...new Set(window.__xss)], fallas };
  });
    await app.close();
    assert.ok(r.n > 1000, 'se esperaban muchos textos con código: ' + r.n);
    assert.deepStrictEqual(r.xss, [], 'se ejecutó código en: ' + r.xss.join(', '));
    assert.deepStrictEqual(r.fallas, []);
  });

  await prueba('Correcciones del rastreo: desempeño con dos decimales, notas inválidas, año lectivo, WhatsApp', async () => {
    const { app, w, errores } = await abrir(nuevaCarpeta());
    await sembrar(w);
    const r = await w.evaluate(() => {
      S.config.decimales = 2;
      const des = [2.95, 3.95, 4.55, 4.6].map((n) => desempeno(n));
      const per = (periodoDeFecha(hoyISO()) || S.config.periodos[0]).id;
      S.planillas.push({ id: 'plx', grupoId: 'g1', areaId: 'a1', periodoId: per, criterios: [{ id: 'cx', nombre: 'Saber', peso: 100, actividades: [{ id: 'ax', nombre: 'T' }] }] });
      S.notas.ax = { al0: 4 };
      const texto = document.createElement('input'); texto.value = 'abc'; ponerNota('ax', 'al0', texto); const tras1 = S.notas.ax.al0;
      // Casilla numérica con "3,5" en un Windows en inglés: el navegador la deja vacía y marca la entrada como inválida
      const num = document.createElement('input'); num.type = 'number'; Object.defineProperty(num, 'validity', { value: { badInput: true } });
      ponerNota('ax', 'al0', num); const tras2 = S.notas.ax.al0;
      const anio = S.config.anio; const ia = document.createElement('input'); ia.value = '3.5'; cambiarNumeroConfig('anio', ia); const anioTras = S.config.anio;
      const em = document.createElement('input'); em.value = '6'; cambiarNumeroConfig('escalaMin', em); const minTras = S.config.escalaMin;
      S.config.periodos[1].inicio = S.config.periodos[0].inicio; ir('configuracion');
      const avisoPeriodos = document.getElementById('contenido').textContent.includes('se cruzan');
      return { des, tras1, tras2, anio, anioTras, minTras, avisoPeriodos, tel: [telefonoWhatsApp('300 123 4567 / 310 987 6543'), telefonoWhatsApp('3001234567'), telefonoWhatsApp('')] };
    });
    await app.close();
    assert.deepStrictEqual(r.des, ['Bajo', 'Básico', 'Alto', 'Superior']);
    assert.strictEqual(r.tras1, 4, 'una nota inválida no debe borrar la anterior');
    assert.strictEqual(r.tras2, 4, 'una coma en Windows en inglés no debe borrar la nota');
    assert.strictEqual(r.anioTras, r.anio);
    assert.strictEqual(r.minTras, 1);
    assert.ok(r.avisoPeriodos);
    assert.deepStrictEqual(r.tel, ['573001234567', '573001234567', '']);
    assert.deepStrictEqual(errores, []);
  });

  terminar();
})();
