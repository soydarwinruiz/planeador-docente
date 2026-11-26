// Solidez de la llave de datos y del guardado: llave.dat dañado o perdido, respaldos que no se pisan y reintentos.
const { fs, path, assert, abrir, esperarGuardado, datos, nuevaCarpeta, prueba, sembrar, terminar } = require('./util');

(async () => {
  await prueba('Si llave.dat se daña, se usa su copia y los datos se leen igual', async () => {
    const dir = nuevaCarpeta();
    let { app, w } = await abrir(dir);
    await sembrar(w);
    await app.close();
    assert.ok(fs.existsSync(path.join(dir, 'llave-copia.dat')), 'no se creó la copia de la llave');
    fs.writeFileSync(path.join(dir, 'llave.dat'), '{dañado');
    ({ app, w } = await abrir(dir));
    const r = await w.evaluate(() => ({ alumnos: S.alumnos.length, inst: S.config.institucion }));
    await app.close();
    assert.deepStrictEqual(r, { alumnos: 25, inst: 'IE Prueba' });
    assert.strictEqual(datos(dir).alumnos.length, 25, 'llave.dat no quedó reparado');
  });

  await prueba('Sin la llave no se crea otra encima: los datos quedan intactos y un respaldo .json empieza de nuevo', async () => {
    const dir = nuevaCarpeta();
    let { app, w } = await abrir(dir);
    await sembrar(w);
    const salida = path.join(dir, 'respaldo.json');
    await app.evaluate(({ dialog }, ruta) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: ruta }); }, salida);
    await w.evaluate(async () => { await api.aniosArchivar(textoEstado()); await crearRespaldo(); });
    await app.close();
    ({ app, w } = await abrir(dir)); await app.close(); // respaldo automático .db
    const resp = path.join(dir, 'respaldos-automaticos');
    const respaldosAntes = fs.readdirSync(resp).sort();
    const llave = fs.readFileSync(path.join(dir, 'llave.dat'));
    fs.rmSync(path.join(dir, 'llave.dat')); fs.rmSync(path.join(dir, 'llave-copia.dat'));
    const bdAntes = fs.readFileSync(path.join(dir, 'tiza.db'));

    ({ app, w } = await abrir(dir));
    await w.waitForFunction(() => document.getElementById('avisos')?.textContent.includes('llave.dat'), null, { timeout: 10000 });
    // Un cambio no puede guardarse (no hay llave) y se reintenta sin repetir el aviso
    await w.evaluate(() => { S.config.docente = 'Otra'; guardar(); });
    await w.waitForFunction(() => reintentoGuardado.n >= 1, null, { timeout: 10000 });
    assert.match(await w.evaluate(() => document.getElementById('estado-guardado').textContent), /Error al guardar/);
    await app.close();
    assert.ok(!fs.existsSync(path.join(dir, 'llave.dat')), 'se creó una llave nueva encima de los datos');
    assert.ok(bdAntes.equals(fs.readFileSync(path.join(dir, 'tiza.db'))), 'la base de datos cambió');
    assert.deepStrictEqual(fs.readdirSync(resp).sort(), respaldosAntes, 'un respaldo ilegible reemplazó a los buenos');

    // Si la llave vuelve, todo se lee
    fs.writeFileSync(path.join(dir, 'llave.dat'), llave);
    ({ app, w } = await abrir(dir));
    assert.strictEqual(await w.evaluate(() => S.alumnos.length), 25);
    await app.close();

    // Sin llave, restaurar el respaldo manual: la base vieja se aparta y la nueva trae todo (incluido el año archivado)
    fs.rmSync(path.join(dir, 'llave.dat')); fs.rmSync(path.join(dir, 'llave-copia.dat'));
    ({ app, w } = await abrir(dir));
    await app.evaluate(({ dialog }, ruta) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [ruta] }); }, salida);
    await w.evaluate(() => { cerrarModal(); restaurarRespaldo(); });
    await w.click('#modal .btn.peligro');
    await w.waitForFunction(() => S.alumnos.length === 25);
    await esperarGuardado(w);
    const r = await w.evaluate(async () => ({ anios: (await api.aniosListar()).length, guardado: document.getElementById('estado-guardado').textContent }));
    await app.close();
    assert.strictEqual(r.anios, 1, 'no llegó el año archivado');
    assert.match(r.guardado, /^Guardado/);
    assert.strictEqual(datos(dir).alumnos.length, 25);
    assert.ok(fs.readdirSync(dir).some((f) => /^tiza-sin-llave_.*\.db$/.test(f)), 'la base sin llave no se conservó aparte');
  });

  await prueba('Clave de acceso: si acceso.json se borra o se daña, se sigue pidiendo la clave y la clave lo repara', async () => {
    const dir = nuevaCarpeta();
    let { app, w } = await abrir(dir);
    await sembrar(w);
    const r0 = await w.evaluate(() => api.accesoActivar('clave-123', 10));
    assert.ok(r0.ok, r0.error);
    await app.close();
    for (const dano of ['borrar', 'desfasado']) {
      if (dano === 'borrar') fs.rmSync(path.join(dir, 'acceso.json'));
      else { const a = JSON.parse(fs.readFileSync(path.join(dir, 'acceso.json'), 'utf8')); a.hash = '00'.repeat(32); fs.writeFileSync(path.join(dir, 'acceso.json'), JSON.stringify(a)); }
      const lanzar = require('playwright-core')._electron.launch({ executablePath: require(path.join(__dirname, '..', 'node_modules', 'electron')), args: [path.join(__dirname, '..'), '--no-sandbox'], env: { ...process.env, PLANEADOR_DATA_DIR: dir, TIZA_LLAVE_PLANA: '1' } });
      app = await lanzar; w = await app.firstWindow();
      await w.waitForSelector('#bloqueo-clave', { timeout: 15000 });
      assert.strictEqual(await w.evaluate(async () => (await api.cargar()).__bloqueado), true, `${dano}: entregó los datos sin clave`);
      assert.strictEqual((await w.evaluate(() => api.accesoDesbloquear('otra'))).ok, false, `${dano}: aceptó una clave incorrecta`);
      await w.fill('#bloqueo-clave', 'clave-123'); await w.click('#bloqueo-entrar');
      await w.waitForFunction(() => S && S.alumnos.length === 25, null, { timeout: 15000 });
      await app.close();
      const a = JSON.parse(fs.readFileSync(path.join(dir, 'acceso.json'), 'utf8'));
      assert.ok(a.hash && a.hash !== '00'.repeat(32), `${dano}: acceso.json no se reparó`);
    }
  });

  await prueba('Una 1.x instalada después de la 2.0 (vacía) no reemplaza la base de datos al volver', async () => {
    const dir = nuevaCarpeta();
    let { app, w } = await abrir(dir);
    await sembrar(w);
    await app.close();
    await new Promise((r) => setTimeout(r, 50));
    fs.writeFileSync(path.join(dir, 'datos.json'), JSON.stringify({ version: 1, config: { institucion: '', configurado: false }, grupos: [], alumnos: [], areas: [], planeaciones: [], notas: {}, asistencia: {} }));
    ({ app, w } = await abrir(dir));
    const r = await w.evaluate(() => ({ alumnos: S.alumnos.length, inst: S.config.institucion }));
    await app.close();
    assert.deepStrictEqual(r, { alumnos: 25, inst: 'IE Prueba' });
    assert.ok(!fs.existsSync(path.join(dir, 'datos.json')), 'el datos.json vacío quedó en su lugar');
    assert.ok(fs.readdirSync(path.join(dir, 'antes-de-2.0')).some((f) => f.startsWith('datos-1x-sin-contenido_')), 'no se apartó');
  });

  terminar();
})();
