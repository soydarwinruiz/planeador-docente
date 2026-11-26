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

  terminar();
})();
