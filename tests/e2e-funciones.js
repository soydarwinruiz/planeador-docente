// Pruebas de las funciones de la versión 1.15: recuperaciones, clave de acceso, años anteriores,
// celular del docente y portafolio.
const { fs, path, assert, abrir, esperarGuardado, datos, nuevaCarpeta, prueba, sembrar, terminar } = require('./util');

// Programación evaluativa con un componente y dos actividades, y notas para tres estudiantes
async function sembrarNotas(w) {
  return w.evaluate(() => {
    const per = periodoDeFecha(hoyISO()) || S.config.periodos[0];
    const pl = { id: 'pl1', grupoId: 'g1', areaId: 'a1', periodoId: per.id, criterios: [{ id: 'c1', nombre: 'Saber', peso: 100, actividades: [{ id: 'act1', nombre: 'Taller' }, { id: 'act2', nombre: 'Quiz', rubricaId: '' }] }] };
    S.planillas.push(pl);
    S.notas.act1 = { al0: 2.0, al1: 4.0, al2: 2.6 };
    S.notas.act2 = { al0: 2.4, al1: 4.4, al2: 2.8 };
    guardar();
    return per.id;
  });
}

(async () => {
  await prueba('Recuperaciones según el SIEE: reemplaza con tope, promedio y ponderada; nunca baja la nota', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await sembrarNotas(w);
    const r = await w.evaluate(() => {
      const pl = S.planillas[0];
      const k = claveRecuperacion('g1', 'a1', pl.periodoId);
      S.recuperaciones[k] = { al0: { nota: 4.5 }, al1: { nota: 2.0 }, al2: { nota: 3.6 } };
      const out = {};
      S.config.recuperacion = { modo: 'reemplaza', tope: 3 };
      out.tope = ['al0', 'al1', 'al2'].map((a) => +notaFinal(pl, a).toFixed(2));
      S.config.recuperacion = { modo: 'promedio', tope: '' };
      out.promedio = ['al0', 'al2'].map((a) => +notaFinal(pl, a).toFixed(2));
      S.config.recuperacion = { modo: 'ponderada', peso: 30, tope: '' };
      out.ponderada = +notaFinal(pl, 'al0').toFixed(2);
      S.config.recuperacion = { modo: 'reemplaza', tope: 3 };
      S.recuperaciones[claveRecuperacion('g1', 'a1', 'anual')] = { al0: { nota: 5 } };
      out.anual = +notaAnual('g1', 'a1', 'al0').toFixed(2);
      ui.cal = { grupoId: 'g1', areaId: 'a1', periodoId: pl.periodoId, pestana: 'planilla' };
      ir('calificaciones');
      out.marca = !!document.querySelector('tr[data-al="al0"] [data-final] sup');
      out.columna = !!document.querySelector('tr[data-al="al0"] [data-rec] input');
      ui.cal.pestana = 'anual'; render();
      out.anualVista = !!document.querySelector('td[data-rec] input');
      return out;
    });
    await app.close();
    assert.deepStrictEqual(r.tope, [3, 4.2, 3], 'reemplaza con tope 3,0 (y no baja al que tenía 4,2)');
    assert.deepStrictEqual(r.promedio, [3.35, 3.15]);
    assert.strictEqual(r.ponderada, 2.89); // 2,2·0,7 + 4,5·0,3
    assert.strictEqual(r.anual, 3);
    assert.ok(r.marca && r.columna && r.anualVista, 'la planilla no muestra la recuperación: ' + JSON.stringify(r));
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Clave de acceso: bloquea al abrir, no entrega datos sin la clave y se recupera con el código', async () => {
    const dir = nuevaCarpeta();
    let { app, w } = await abrir(dir);
    await sembrar(w);
    const codigo = await w.evaluate(async () => (await api.accesoActivar('clave-1234', 10)).codigo);
    assert.match(codigo, /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    await app.close();
    assert.ok(!fs.readFileSync(path.join(dir, 'acceso.json'), 'utf8').includes('clave-1234'), 'la clave quedó en texto plano');
    // con la app bloqueada S no se carga (abrir() espera S): se abre directamente
    const { _electron } = require('playwright-core');
    const a2 = await _electron.launch({ executablePath: require(path.join(__dirname, '..', 'node_modules', 'electron')), args: [path.join(__dirname, '..'), '--no-sandbox'], env: { ...process.env, PLANEADOR_DATA_DIR: dir } });
    const w2 = await a2.firstWindow();
    await w2.waitForSelector('#bloqueo-clave');
    const sinClave = await w2.evaluate(async () => ({ S: typeof S === 'undefined' ? 'x' : S, cargar: await api.cargar() }));
    assert.strictEqual(sinClave.S, null);
    assert.deepStrictEqual(sinClave.cargar, { __bloqueado: true });
    await w2.fill('#bloqueo-clave', 'equivocada');
    await w2.click('#bloqueo-entrar');
    await w2.waitForFunction(() => /incorrecta/.test(document.getElementById('bloqueo-error').textContent));
    // recuperar con el código
    await w2.click('text=¿Olvidaste la clave?');
    await w2.fill('#rec-codigo', codigo.toLowerCase());
    await w2.fill('#rec-nueva', 'nueva-5678');
    await w2.fill('#rec-nueva2', 'nueva-5678');
    await w2.click('text=Cambiar la clave y entrar');
    await w2.waitForFunction(() => S && S.alumnos.length === 25);
    const nuevoCodigo = await w2.evaluate(() => document.getElementById('modal').textContent.match(/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/)?.[0]);
    assert.ok(nuevoCodigo && nuevoCodigo !== codigo, 'no se entregó un código nuevo');
    // bloqueo manual y desbloqueo con la clave nueva
    await w2.evaluate(() => { cerrarModal(); return bloquearAhora(); });
    await w2.waitForSelector('#bloqueo-clave');
    assert.deepStrictEqual(await w2.evaluate(() => api.cargar()), { __bloqueado: true });
    await w2.fill('#bloqueo-clave', 'nueva-5678');
    await w2.click('#bloqueo-entrar');
    await w2.waitForFunction(() => document.getElementById('bloqueo').hidden);
    await a2.close();
  });

  await prueba('Años anteriores: el nuevo año archiva el anterior y se consulta sin tocar el año en curso', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await sembrarNotas(w);
    await esperarGuardado(w);
    const anio = await w.evaluate(() => S.config.anio);
    await w.evaluate(() => { nuevoAnio(); });
    await w.uncheck('[data-na="grupos"]');
    await w.click('#modal .btn.peligro'); // confirmar
    await w.waitForFunction(() => S.grupos.length === 0);
    await esperarGuardado(w);
    const lista = await w.evaluate(() => api.aniosListar());
    assert.strictEqual(lista.length, 1);
    assert.strictEqual(lista[0].anio, anio);
    assert.strictEqual(lista[0].estudiantes, 25);
    // consultar el año archivado
    await w.evaluate((id) => consultarAnio(id), lista[0].id);
    await w.waitForSelector('#banda-archivo');
    const consulta = await w.evaluate(() => ({ grupos: S.grupos.length, notas: Object.keys(S.notas).length, actual: ui.archivo.actual.grupos.length }));
    assert.deepStrictEqual(consulta, { grupos: 1, notas: 2, actual: 0 });
    // un cambio durante la consulta no se guarda en el año en curso
    await w.evaluate(() => { S.grupos.push({ id: 'gx', grado: 9, nombre: 'Z', areas: [] }); guardar(); });
    await esperarGuardado(w);
    assert.strictEqual(datos(dir).grupos.length, 0);
    await w.evaluate(() => salirDeArchivo());
    const despues = await w.evaluate(() => ({ grupos: S.grupos.length, anio: S.config.anio, banda: !!document.getElementById('banda-archivo') }));
    assert.deepStrictEqual(despues, { grupos: 0, anio: anio + 1, banda: false });
    await app.close();
    assert.deepStrictEqual(errores.filter((e) => !/no se guardan/.test(e)), []);
  });

  await prueba('Nuevo año: el docente elige qué conservar (grupos que suben de grado, estudiantes, programación…)', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await sembrarNotas(w);
    await w.evaluate(() => {
      S.grupos.push({ id: 'g11', grado: 11, nombre: '11B', areas: [{ areaId: 'a1', horas: 3 }] });
      S.alumnos.push({ id: 'x1', grupoId: 'g11', nombres: 'Grad', apellidos: 'Uado', activo: true });
      S.grupos[0].nombre = '7A';
      S.planillas[0].criterios[0].actividades[0].fecha = `${S.config.anio}-10-01`;
      S.fichas.push({ id: 'f1', titulo: 'Sopa' });
      S.pruebas.push({ id: 'pr1', titulo: 'Quiz', grupoId: 'g1', respuestas: { al0: 'ABC' }, preguntas: [] });
      S.eventos.push({ id: 'e1', fecha: `${S.config.anio}-08-15`, titulo: 'Feria', tipo: 'institucional' });
      guardar(); nuevoAnio();
    });
    await w.check('[data-na="promover"]');
    await w.check('[data-na="estudiantes"]');
    await w.uncheck('[data-na="fichas"]');
    await w.check('[data-na="eventos"]');
    // Sin grupos no se pueden conservar estudiantes
    await w.uncheck('[data-na="grupos"]');
    assert.ok(await w.isDisabled('[data-na="estudiantes"]'));
    await w.check('[data-na="grupos"]'); await w.check('[data-na="promover"]'); await w.check('[data-na="estudiantes"]');
    const anio = await w.evaluate(() => S.config.anio);
    await w.click('#modal .btn.peligro');
    await w.waitForFunction((a) => S.config.anio === a + 1, anio);
    await esperarGuardado(w);
    const d = datos(dir);
    assert.deepStrictEqual(d.grupos.map((g) => [g.grado, g.nombre]), [[8, '8A']], 'el grupo debe subir a 8A y el de 11 salir');
    assert.strictEqual(d.alumnos.length, 25);
    assert.strictEqual(d.planillas.length, 1);
    assert.strictEqual(d.planillas[0].criterios[0].actividades[0].fecha, `${anio + 1}-10-01`);
    assert.deepStrictEqual(d.notas, {});
    assert.deepStrictEqual(d.fichas, []);
    assert.deepStrictEqual(d.pruebas[0].respuestas, {});
    assert.strictEqual(d.eventos[0].fecha, `${anio + 1}-08-15`);
    const archivado = await w.evaluate(async () => { const [m] = await api.aniosListar(); return (await api.aniosLeer(m.id)).grupos.length; });
    assert.strictEqual(archivado, 2, 'el año archivado debe quedar completo');
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Celular del docente: vincular con PIN, asistencia, notas, anotaciones, puntos y vencimiento', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await sembrarNotas(w);
    await w.evaluate(() => { ir('configuracion'); dialogoVincularCelular(); document.getElementById('cel-duracion').value = '7d'; return generarVinculo(); });
    const { puerto, pin } = await w.evaluate(() => ({ puerto: CEL.conexion.puerto, pin: CEL.pin }));
    const base = `http://127.0.0.1:${puerto}/cel`;
    const post = async (accion, cuerpo) => { const r = await fetch(`${base}/api/${accion}`, { method: 'POST', body: JSON.stringify(cuerpo) }); return { status: r.status, d: await r.json() }; };
    assert.strictEqual((await post('vincular', { pin: '000000' === pin ? '111111' : '000000' })).status, 401);
    const v = await post('vincular', { pin, nombre: 'Mi Android' });
    assert.strictEqual(v.status, 200, JSON.stringify(v.d));
    const token = v.d.token;
    assert.strictEqual((await post('vincular', { pin })).status, 403, 'el PIN debe servir una sola vez');
    const ini = await post('inicio', { token });
    assert.strictEqual(ini.d.grupos.length, 1);
    const fecha = ini.d.fecha;
    const cl = await post('clase', { token, grupoId: 'g1', areaId: 'a1', fecha });
    assert.strictEqual(cl.d.alumnos.length, 25);
    assert.strictEqual(cl.d.actividades.length, 2);
    await post('todosPresentes', { token, grupoId: 'g1', areaId: 'a1', fecha });
    await post('asistencia', { token, grupoId: 'g1', areaId: 'a1', fecha, alumnoId: 'al3', estado: 'A' });
    assert.strictEqual((await post('nota', { token, actividadId: 'act1', alumnoId: 'al5', valor: '4,5' })).status, 200);
    assert.strictEqual((await post('nota', { token, actividadId: 'act1', alumnoId: 'al5', valor: '9' })).status, 400);
    await post('anotacion', { token, grupoId: 'g1', areaId: 'a1', alumnoId: 'al1', tipo: 'positiva', texto: 'Explicó el ejercicio al grupo' });
    await post('anotacion', { token, grupoId: 'g1', areaId: 'a1', alumnoId: '', tipo: 'general', texto: 'Simulacro a las 10' });
    const pts = await post('puntos', { token, grupoId: 'g1', alumnoId: 'al2', motivo: 0 });
    assert.strictEqual(pts.d.puntos, 1);
    assert.strictEqual((await post('inicio', { token: 'falso' })).status, 401);
    await esperarGuardado(w);
    const d = datos(dir);
    const dia = d.asistencia['g1|a1'][fecha];
    assert.strictEqual(Object.keys(dia).length, 25);
    assert.strictEqual(dia.al3, 'A');
    assert.strictEqual(d.notas.act1.al5, 4.5);
    assert.strictEqual(d.anotaciones[0].texto, 'Explicó el ejercicio al grupo');
    assert.match(d.diario[0].novedades, /Simulacro/);
    const disp = d.config.celular.dispositivos[0];
    assert.ok(!JSON.stringify(d).includes(token), 'el token quedó guardado tal cual');
    const dias = (Date.parse(disp.expira) - Date.now()) / 86400000;
    assert.ok(dias > 6.9 && dias < 7.1, 'la autorización no dura 7 días');
    // La página del celular funciona en un navegador
    await app.evaluate(({ BrowserWindow }, url) => { const b = new BrowserWindow({ width: 400, height: 820, show: true }); b.loadURL(url); }, base);
    const tel = await app.waitForEvent('window', (p) => p.url().includes('/cel'));
    await tel.waitForSelector('#pin');
    const pin2 = await w.evaluate(() => { dialogoVincularCelular(); return generarVinculo().then(() => CEL.pin); });
    await tel.fill('#pin', pin2);
    await tel.click('button:has-text("Vincular")');
    await tel.waitForSelector('text=Otro grupo o fecha', { timeout: 8000 }).catch(async (e) => { throw new Error('Página del celular: ' + (await tel.textContent('body')).slice(0, 400)); });
    await tel.click('button:has-text("Abrir")');
    await tel.waitForSelector('.asis');
    await tel.locator('.est').nth(4).locator('button.T').click();
    await tel.click('nav >> text=Clase');
    await tel.click('nav >> text=Azar');
    await tel.click('text=Elegir estudiante');
    await w.waitForFunction(() => S.asistencia['g1|a1'][hoyISO()][alumnosDe('g1')[4].id] === 'T', null, { timeout: 10000 });
    // vencimiento
    await w.evaluate(() => { for (const x of S.config.celular.dispositivos) x.expira = new Date(Date.now() - 1000).toISOString(); });
    const vencido = await post('inicio', { token });
    assert.strictEqual(vencido.status, 401);
    assert.ok(vencido.d.revincular);
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Portafolio docente: evidencias automáticas, propias y exportación a Word', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await sembrarNotas(w);
    const salida = path.join(dir, 'portafolio.docx');
    await app.evaluate(({ dialog, shell }, ruta) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: ruta }); shell.openPath = async () => ''; }, salida);
    const r = await w.evaluate(async () => {
      S.planeaciones.push({ id: 'p1', titulo: 'Fracciones', grupoId: 'g1', areaId: 'a1', estandares: 'Resuelvo problemas…', estado: 'terminada', sesiones: [{ id: 's1', fecha: hoyISO(), exploracion: 'a', estructuracion: 'b', practica: 'c' }] });
      portafolio().evidencias.push({ id: 'e1', competencia: 'liderazgo', titulo: 'Coordiné la feria de la ciencia', fecha: hoyISO(), descripcion: '', ubicacion: 'Acta 12' });
      ir('portafolio');
      const auto = evidenciasAutomaticas('', '');
      await exportarPortafolio();
      return { evaluacion: auto.evaluacion.length, planeacion: auto.planeacion.length, texto: document.getElementById('contenido').textContent };
    });
    await app.close();
    assert.ok(r.evaluacion >= 2 && r.planeacion >= 1);
    assert.match(r.texto, /Coordiné la feria/);
    assert.ok(fs.statSync(salida).size > 5000, 'no se creó el Word');
    assert.ok(!fs.readFileSync(salida).includes('Nombre1'), 'el portafolio no debe llevar nombres de estudiantes');
    assert.deepStrictEqual(errores, []);
  });

  terminar();
})();
