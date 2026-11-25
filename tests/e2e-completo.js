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

(async () => {
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

  terminar();
})();
