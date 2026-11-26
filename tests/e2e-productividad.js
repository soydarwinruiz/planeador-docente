// Pruebas de la versión 1.16: registro de cambios de notas, personalización, configuración por secciones,
// frases rápidas, "Mi clase ahora", entregas, resumen semanal, banco de preguntas, material con IA y cámara del celular.
const { fs, path, assert, abrir, esperarGuardado, datos, registroDe, nuevaCarpeta, prueba, sembrar, terminar } = require('./util');

async function sembrarPlanilla(w) {
  return w.evaluate(() => {
    const per = periodoDeFecha(hoyISO()) || S.config.periodos[0];
    S.planillas.push({ id: 'pl1', grupoId: 'g1', areaId: 'a1', periodoId: per.id, criterios: [{ id: 'c1', nombre: 'Saber', peso: 100, actividades: [{ id: 'act1', nombre: 'Taller', fecha: hoyISO() }, { id: 'act2', nombre: 'Quiz', fecha: hoyISO() }] }] });
    S.notas.act1 = { al0: 3.0, al1: 4.0 };
    guardar();
    return per.id;
  });
}
module.exports = { sembrarPlanilla };

if (require.main === module) (async () => {
  await prueba('Registro de cambios de notas: guarda antes/después y origen, y permite restaurar', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    const per = await sembrarPlanilla(w);
    await esperarGuardado(w);
    await w.evaluate(async () => {
      S.notas.act1.al0 = 3.8; guardar(); await new Promise((r) => setTimeout(r, 450)); await cadenaGuardado;
      origenNotas('importacion'); S.notas.act1.al1 = 2.5; delete S.notas.act1.al0; guardar(); await new Promise((r) => setTimeout(r, 450)); await cadenaGuardado;
      S.recuperaciones[claveRecuperacion('g1', 'a1', S.planillas[0].periodoId)] = { al1: { nota: 3 } }; guardar();
    });
    await esperarGuardado(w);
    const reg = registroDe(dir);
    const al0 = reg.filter((r) => r.act === 'act1' && r.al === 'al0').map((r) => [r.antes, r.despues, r.o]);
    assert.deepStrictEqual(al0, [[null, 3, 'computador'], [3, 3.8, 'computador'], [3.8, null, 'importacion']]);
    assert.ok(reg.some((r) => r.al === 'al1' && r.antes === 4 && r.despues === 2.5 && r.n === 'Taller' && r.g === 'g1'));
    assert.ok(reg.some((r) => r.tipo === 'recuperacion' && r.despues === 3));
    // historial con clic derecho y restaurar
    const r = await w.evaluate((per) => {
      ui.cal = { grupoId: 'g1', areaId: 'a1', periodoId: per, pestana: 'planilla' }; ir('calificaciones');
      document.querySelector('tr[data-al="al0"] input[data-col="0"]').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      const filas = document.querySelectorAll('#modal tbody tr').length;
      restaurarNotaRegistro('act1', 'al0', 3.8);
      ui.cal.pestana = 'registro'; render();
      return { filas, nota: S.notas.act1.al0, enPestana: document.querySelectorAll('#contenido tbody tr').length };
    }, per);
    assert.deepStrictEqual(r, { filas: 3, nota: 3.8, enPestana: 6 });
    await esperarGuardado(w);
    assert.ok(registroDe(dir).some((x) => x.o === 'restaurada' && x.despues === 3.8));
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  await prueba('El registro de notas va en su propia tabla y viaja en respaldos y años archivados', async () => {
    const dir = nuevaCarpeta();
    const nube = nuevaCarpeta();
    let { app, w } = await abrir(dir);
    await sembrar(w);
    await sembrarPlanilla(w);
    await w.evaluate(async () => {
      // un año de notas: 25 estudiantes x 400 actividades
      for (let i = 0; i < 400; i++) S.notas['x' + i] = Object.fromEntries(alumnosDe('g1').map((a) => [a.id, 3.5]));
      guardar(); await new Promise((r) => setTimeout(r, 450)); await cadenaGuardado;
    });
    await esperarGuardado(w);
    assert.ok(!('registroNotas' in datos(dir)), 'el registro no debe ir en el estado principal');
    assert.ok(registroDe(dir).length >= 10000);
    const r = await w.evaluate(async (nube) => { await api.configurarNube(nube); const n = await api.respaldarNube(); const a = await api.aniosArchivar(textoEstado()); return { n: n.ok, a: (await api.aniosLeer(a.meta.id)).registroNotas.length }; }, nube);
    await app.close();
    const enNube = JSON.parse(fs.readFileSync(path.join(nube, 'Respaldos Planeador Docente', 'planeador-ultimo.json'), 'utf8')).registroNotas.length;
    assert.ok(r.n && r.a >= 10000 && enNube >= 10000, JSON.stringify({ r, enNube }));
    // al reabrir, el historial sigue disponible
    ({ app, w } = await abrir(dir));
    const h = await w.evaluate(async () => { await new Promise((r) => setTimeout(r, 300)); return historialNota('x5', 'al3').length; });
    await app.close();
    assert.strictEqual(h, 1);
  });

  await prueba('Datos de la 1.16 con el registro dentro de datos.json se migran a la base de datos', async () => {
    const dir = nuevaCarpeta();
    fs.writeFileSync(path.join(dir, 'datos.json'), JSON.stringify({ version: 1, config: { institucion: 'IE', docente: 'Ana', configurado: true }, areas: [], grupos: [], alumnos: [],
      registroNotas: [{ f: '2026-11-20T10:00:00Z', act: 'a1', al: 'b1', antes: null, despues: 4, o: 'computador' }, { f: '2026-11-21T10:00:00Z', act: 'a1', al: 'b1', antes: 4, despues: 4.5, o: 'celular' }] }));
    const { app, w } = await abrir(dir);
    await esperarGuardado(w);
    const h = await w.evaluate(() => historialNota('a1', 'b1').length);
    await app.close();
    assert.strictEqual(h, 2);
    assert.ok(!('registroNotas' in datos(dir)));
    assert.deepStrictEqual(registroDe(dir).map((x) => x.despues), [4, 4.5]);
  });

  await prueba('Personalización (barra, acento, letra) y configuración por secciones desplegables con buscador', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    const r = await w.evaluate(() => {
      ir('configuracion');
      const cerradas = [...document.querySelectorAll('.seccion-config')].every((d) => !d.open);
      const n = document.querySelectorAll('.seccion-config').length;
      cambiarApariencia('colorMenu', '#2e7d32'); cambiarApariencia('colorAcento', '#e53935'); cambiarApariencia('fuente', 'Verdana');
      const menu = getComputedStyle(document.getElementById('menu')).backgroundColor;
      const boton = getComputedStyle(document.querySelector('.btn.primario')).backgroundColor;
      const letra = getComputedStyle(document.body).fontFamily;
      cambiarApariencia('colorMenu', '#e8eef7');
      const claro = document.body.classList.contains('menu-claro');
      cambiarApariencia('colorMenu', 'red;}body{display:none'); // no válido: se ignora
      const ignorado = S.config.apariencia.colorMenu === '#e8eef7';
      document.querySelector('[data-sec="seguridad"] summary').click();
      filtrarConfig('membrete');
      const visibles = [...document.querySelectorAll('.seccion-config')].filter((d) => !d.hidden).map((d) => d.dataset.sec);
      filtrarConfig('');
      restablecerApariencia();
      return { cerradas, n, menu, boton, letra, claro, ignorado, visibles, seguridad: S.config.apariencia.secciones.seguridad, sinColor: !S.config.apariencia.colorMenu };
    });
    await app.close();
    assert.ok(r.cerradas && r.n === 8, JSON.stringify(r));
    assert.strictEqual(r.menu, 'rgb(46, 125, 50)');
    assert.strictEqual(r.boton, 'rgb(229, 57, 53)');
    assert.match(r.letra, /Verdana/);
    assert.ok(r.claro && r.ignorado && r.seguridad && r.sinColor);
    assert.deepStrictEqual(r.visibles, ['institucion']);
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Frases rápidas: ";atajo" + espacio se reemplaza y queda guardado; Ctrl + Espacio inserta desde la lista', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await w.evaluate(() => { frases(); S.config.frases.push({ id: 'f9', atajo: 'obj', texto: 'Reconocer fracciones equivalentes' }); guardar(); abrirDiario('g1', 'a1'); });
    await w.click('#dc-logrado');
    await w.keyboard.type('Hoy: ;obj y repaso ');
    assert.strictEqual(await w.inputValue('#dc-logrado'), 'Hoy: Reconocer fracciones equivalentes y repaso ');
    await w.keyboard.press('Control+Space');
    await w.keyboard.type('refuer');
    await w.keyboard.press('Enter');
    assert.match(await w.inputValue('#dc-logrado'), /repaso Debe reforzar/);
    await w.click('text=Guardar');
    await esperarGuardado(w);
    assert.match(datos(dir).diario[0].logrado, /Reconocer fracciones equivalentes y repaso Debe reforzar/);
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Entregas y nota por lote: alimentan pendientes y comunicados; el lote respeta notas existentes', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    const per = await sembrarPlanilla(w);
    const r = await w.evaluate((per) => {
      ui.cal = { grupoId: 'g1', areaId: 'a1', periodoId: per, pestana: 'entregas' }; ui.ent = null; ir('calificaciones');
      ui.ent.actId = 'act1';
      marcarEntrega('act1', 'al2', 'N'); marcarEntrega('act1', 'al3', 'T');
      entregasTodos('E');
      const estados = ['al0', 'al2', 'al3', 'al4'].map((x) => entrega('act1', x));
      ui.ent.nota = '4.5'; ui.ent.a = 'E'; ui.ent.respetar = true; aplicarNotaLote();
      const tras = ['al0', 'al1', 'al4', 'al2'].map((x) => S.notas.act1[x] ?? null);
      ui.ent.sel = { al2: true }; ui.ent.nota = '1'; ui.ent.a = 'seleccionados'; aplicarNotaLote();
      ui.com = null; ui.com = contextoCom(); ui.com.grupoId = 'g1'; ui.com.areaId = 'a1'; ui.com.periodoId = per;
      const v = variablesComunicado(ui.com, porId(S.alumnos, 'al2'));
      return { estados, tras, al2: S.notas.act1.al2, pendientes: v.pendientes, html: !!document.querySelector('.asis') };
    }, per);
    await esperarGuardado(w);
    assert.deepStrictEqual(r.estados, ['E', 'N', 'T', 'E']);
    assert.deepStrictEqual(r.tras, [3, 4, 4.5, null], 'el lote no debe pisar notas ni tocar a quien no entregó');
    assert.strictEqual(r.al2, 1);
    assert.strictEqual(r.pendientes, 2, 'act1 (no entregó) y act2 (fecha cumplida sin nota)');
    assert.ok(registroDe(dir).some((x) => x.o === 'lote' && x.despues === 4.5));
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Mi clase ahora, resumen semanal y proyección de la sesión', async () => {
    const { app, w, errores } = await abrir(nuevaCarpeta());
    await sembrar(w);
    await sembrarPlanilla(w);
    const r = await w.evaluate(() => {
      const hoy = hoyISO();
      S.planeaciones.push({ id: 'p1', titulo: 'Fracciones', grupoId: 'g1', areaId: 'a1', objetivo: 'Comparar fracciones', sesiones: [{ ...nuevaSesion(hoy), id: 's1', titulo: 'Sesión 1', exploracion: 'Pregunta inicial', practica: 'Taller' }] });
      S.pendientes.push({ id: 'pe1', texto: 'Llevar regletas', fecha: hoy, hecho: false });
      ir('inicio');
      const semana = document.querySelector('details.semana').textContent;
      abrirMiClase();
      mcTodosPresentes(); mcAsistencia('al0'); // P → A
      mcMomento('p1', 's1', 'exploracion', true);
      proyectarClase(); moverProyeccion(1); const diapo = document.querySelector('#proyeccion h1').textContent; cerrarProyeccion();
      return { semana, asis: S.asistencia['g1|a1'][hoy].al0, presentes: Object.values(S.asistencia['g1|a1'][hoy]).filter((x) => x === 'P').length,
        hecho: S.planeaciones.at(-1).sesiones[0].hechos.exploracion, diapo, titulo: document.querySelector('#contenido h1').textContent };
    });
    await app.close();
    assert.match(r.semana, /Tu semana/);
    assert.match(r.semana, /Taller.*sin nota|sin nota/);
    assert.match(r.semana, /Llevar regletas/);
    assert.strictEqual(r.asis, 'A');
    assert.strictEqual(r.presentes, 24);
    assert.ok(r.hecho);
    assert.strictEqual(r.diapo, 'Exploración');
    assert.match(r.titulo, /7° – A · Matemáticas/);
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Banco de preguntas: reúne sin repetir y arma pruebas', async () => {
    const { app, w, errores } = await abrir(nuevaCarpeta());
    await sembrar(w);
    const r = await w.evaluate(() => {
      const q = (id, e) => ({ id, tipo: 'multiple', contexto: '', enunciado: e, opciones: ['1', '2', '3', '4'], correcta: 'B', competencia: 'Razonamiento' });
      S.pruebas.push({ id: 'pA', titulo: 'A', tipo: 'prueba', areaId: 'a1', grado: 7, grupoId: '', preguntas: [q('q1', '¿Cuánto es 1+1?'), q('q2', '¿Cuánto es 2+2?')], respuestas: {} });
      S.pruebas.push({ id: 'pB', titulo: 'B', tipo: 'prueba', areaId: 'a1', grado: 7, grupoId: '', preguntas: [q('q3', '¿Cuánto es  1+1?'), q('q4', '¿Cuánto es 3+3?')], respuestas: {} });
      const total = bancoPreguntas().length;
      abrirBancoPreguntas(); ui.bq.sel = { q1: true, q4: true }; usarSeleccionBanco();
      const nueva = S.pruebas.at(-1);
      abrirBancoPreguntas('pA'); ui.bq.sel = { q4: true }; usarSeleccionBanco();
      return { total, nueva: nueva.preguntas.map((x) => x.enunciado), idsNuevos: nueva.preguntas.every((x) => !['q1', 'q4'].includes(x.id)), pA: porId(S.pruebas, 'pA').preguntas.length, vista: ui.vista };
    });
    await app.close();
    assert.strictEqual(r.total, 3, 'la pregunta repetida debe aparecer una sola vez');
    assert.deepStrictEqual(r.nueva, ['¿Cuánto es 1+1?', '¿Cuánto es 3+3?']);
    assert.ok(r.idsNuevos);
    assert.strictEqual(r.pA, 3);
    assert.strictEqual(r.vista, 'pruebaEditor');
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Material con IA desde una sesión: guía, quiz de salida y rúbrica', async () => {
    const { app, w, errores } = await abrir(nuevaCarpeta());
    await sembrar(w);
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('ia:sugerir');
      ipcMain.handle('ia:sugerir', (_e, p) => (p.tarea === 'rubrica'
        ? { ok: true, datos: { nombre: 'Rúbrica – Taller de fracciones', producto: 'Taller', criterios: [{ nombre: 'Representa fracciones', descriptores: ['a', 'b', 'c', 'd'] }, { nombre: 'Compara', descriptores: ['e', 'f', 'g', 'h'] }] } }
        : { ok: false, error: 'no simulado' }));
    });
    const r = await w.evaluate(async () => {
      S.config.ia.claves.anthropic = 'sk-prueba';
      S.planeaciones.push({ id: 'p1', titulo: 'Fracciones', grupoId: 'g1', areaId: 'a1', objetivo: 'Comparar fracciones', sesiones: [{ ...nuevaSesion(hoyISO()), id: 's1', titulo: 'Sesión 1', exploracion: 'Pregunta', practica: 'Taller' }] });
      dialogoMaterialSesion('p1', 's1');
      materialGuia('p1', 's1');
      const guia = { tipo: ui.ficha.tipo, det: document.getElementById('fia-det').value };
      dialogoMaterialSesion('p1', 's1');
      materialQuiz('p1', 's1');
      const quiz = { titulo: S.pruebas.at(-1).titulo, mult: document.getElementById('pia-mult').value, grupo: S.pruebas.at(-1).grupoId };
      dialogoMaterialSesion('p1', 's1');
      await materialRubrica('p1', 's1');
      const rub = S.rubricas.at(-1);
      return { guia, quiz, rub: { nombre: rub.nombre, crit: rub.criterios.length, desc: rub.descriptores[rub.criterios[0].id] } };
    });
    await app.close();
    assert.strictEqual(r.guia.tipo, 'guia');
    assert.match(r.guia.det, /Objetivo: Comparar fracciones[\s\S]*Exploración: Pregunta/);
    assert.deepStrictEqual(r.quiz, { titulo: 'Quiz de salida – Sesión 1', mult: '5', grupo: 'g1' });
    assert.deepStrictEqual(r.rub.crit, 2);
    assert.strictEqual(r.rub.nombre, 'Rúbrica – Taller de fracciones');
    assert.deepStrictEqual(r.rub.desc.length, 4);
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Celular: entregas, fotos de trabajos para la retroalimentación y hoja de respuestas ilegible', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await sembrarPlanilla(w);
    await w.evaluate(() => { dialogoVincularCelular(); return generarVinculo(); });
    const { puerto, pin } = await w.evaluate(() => ({ puerto: CEL.conexion.puerto, pin: CEL.pin }));
    const post = async (accion, cuerpo) => { const r = await fetch(`http://127.0.0.1:${puerto}/cel/api/${accion}`, { method: 'POST', body: JSON.stringify(cuerpo) }); return { status: r.status, d: await r.json() }; };
    const token = (await post('vincular', { pin })).d.token;
    const ini = await post('inicio', { token });
    assert.ok(ini.d.frases.length >= 3, 'las frases rápidas llegan al celular');
    assert.strictEqual((await post('entrega', { token, actividadId: 'act1', alumnoId: 'al5', estado: 'N' })).status, 200);
    const cl = await post('clase', { token, grupoId: 'g1', areaId: 'a1', fecha: ini.d.fecha });
    assert.strictEqual(cl.d.entregas.act1.al5, 'N');
    // foto blanca de 400x300 (sin marcas de hoja de respuestas)
    const foto = await w.evaluate(() => { const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 400, 300); x.fillStyle = '#000'; x.fillText('Mi cuento', 20, 40); return c.toDataURL('image/jpeg', 0.8); });
    await w.evaluate(() => { S.pruebas.push({ id: 'pq', titulo: 'Quiz', tipo: 'prueba', grupoId: 'g1', areaId: 'a1', grado: 7, preguntas: [{ id: 'q1', tipo: 'multiple', enunciado: 'x', opciones: ['a', 'b'], correcta: 'A' }], respuestas: {} }); });
    const omr = await post('foto', { token, tipo: 'omr', pruebaId: 'pq', imagen: foto });
    assert.strictEqual(omr.status, 422);
    assert.match(omr.d.error, /marcas/);
    assert.strictEqual((await post('foto', { token, tipo: 'trabajo', grupoId: 'g1', alumnoId: 'al3', actividadId: 'act1', imagen: foto })).status, 200);
    assert.strictEqual((await post('foto', { token, tipo: 'trabajo', grupoId: 'g1', alumnoId: 'al3', imagen: 'data:text/html;base64,PHNjcmlwdD4=' })).status, 400);
    const retro = await w.evaluate(() => { verFotosCelular(); const n = document.querySelectorAll('#modal img').length; retroDesdeFoto(CEL.fotos[0].id); return { n, imagenes: window._retro.imagenes.length, alumno: window._retro.alumnoId, act: window._retro.actId, quedan: CEL.fotos.length }; });
    assert.deepStrictEqual(retro, { n: 1, imagenes: 1, alumno: 'al3', act: 'act1', quedan: 0 });
    // La página del celular muestra la cámara y el botón de entrega
    await app.evaluate(({ BrowserWindow }, url) => { const b = new BrowserWindow({ width: 400, height: 820 }); b.loadURL(url); }, `http://127.0.0.1:${puerto}/cel`);
    const tel = await app.waitForEvent('window', (p) => p.url().includes('/cel'));
    await tel.waitForSelector('#pin');
    const pin2 = await w.evaluate(() => { cerrarModal(); dialogoVincularCelular(); return generarVinculo().then(() => CEL.pin); });
    await tel.fill('#pin', pin2); await tel.click('button:has-text("Vincular")');
    await tel.waitForSelector('text=Otro grupo o fecha'); await tel.click('button:has-text("Abrir")');
    await tel.click('nav >> text=Notas'); await tel.waitForSelector('button.ent');
    await tel.locator('button.ent').first().click();
    await tel.click('nav >> text=Cámara'); await tel.waitForSelector('text=Tomar foto');
    await w.waitForFunction(() => S.entregas.act1?.al0 === 'E', null, { timeout: 10000 });
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Celular: una hoja de respuestas fotografiada se califica al instante', async () => {
    const { app, w, errores } = await abrir(nuevaCarpeta());
    await sembrar(w);
    await w.evaluate(() => {
      const preguntas = ['A', 'B', 'C', 'D', 'A'].map((c, i) => ({ id: 'q' + i, tipo: 'multiple', enunciado: 'P' + i, opciones: ['1', '2', '3', '4'], correcta: c }));
      S.pruebas.push({ id: 'pq', titulo: 'Quiz', tipo: 'prueba', grupoId: 'g1', areaId: 'a1', grado: 7, preguntas, respuestas: {} });
    });
    // Se dibuja la hoja con las mismas medidas que la hoja impresa (marcas y burbujas), número de lista 04 y
    // respuestas A, B, C, D, B. Se dibuja directamente en una imagen para no depender del tamaño de la pantalla.
    const foto = await w.evaluate(() => {
      const k = 4, c = document.createElement('canvas'); c.width = Math.round(OMR.pagina.ancho * k); c.height = Math.round(OMR.pagina.alto * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      const m = OMR.marcas, g = geometriaOMR(5, 4);
      x.fillStyle = '#000';
      for (const mx of [m.x0, m.x1]) for (const my of [m.y0, m.y1]) x.fillRect((mx - m.lado / 2) * k, (my - m.lado / 2) * k, m.lado * k, m.lado * k);
      const burbuja = (b, llena) => { x.beginPath(); x.arc((m.x0 + b.u) * k, (m.y0 + b.v) * k, (OMR.burbuja / 2) * k, 0, Math.PI * 2); if (llena) x.fill(); else { x.lineWidth = 1; x.strokeStyle = '#444'; x.stroke(); } };
      g.id[0].forEach((b, d) => burbuja(b, d === 0)); g.id[1].forEach((b, d) => burbuja(b, d === 4));
      g.resp.forEach((fila, i) => fila.forEach((b, j) => burbuja(b, j === 'ABCDB'.charCodeAt(i) - 65)));
      return c.toDataURL('image/jpeg', 0.9);
    });
    await w.evaluate(() => { dialogoVincularCelular(); return generarVinculo(); });
    const { puerto, pin } = await w.evaluate(() => ({ puerto: CEL.conexion.puerto, pin: CEL.pin }));
    const post = async (accion, cuerpo) => { const r = await fetch(`http://127.0.0.1:${puerto}/cel/api/${accion}`, { method: 'POST', body: JSON.stringify(cuerpo) }); return { status: r.status, d: await r.json() }; };
    const token = (await post('vincular', { pin })).d.token;
    const r = await post('foto', { token, tipo: 'omr', pruebaId: 'pq', imagen: foto });
    const esperado = await w.evaluate(() => nombreAlumno(alumnosDe('g1')[3]));
    const guardada = await w.evaluate(() => porId(S.pruebas, 'pq').respuestas[alumnosDe('g1')[3].id]);
    await app.close();
    assert.strictEqual(r.status, 200, JSON.stringify(r.d));
    assert.strictEqual(r.d.nombre, esperado);
    assert.deepStrictEqual([r.d.correctas, r.d.total], [4, 5]);
    assert.strictEqual(guardada, 'ABCDB');
    assert.deepStrictEqual(errores, []);
  });

  terminar();
})();
