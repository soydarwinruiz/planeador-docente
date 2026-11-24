// Pruebas de punta a punta: abren la aplicación real (Electron) con una carpeta de datos temporal.
// Uso: npm test   (en Linux sin pantalla: xvfb-run -a npm test)
const { fs, os, path, assert, abrir, esperarGuardado, datos, nuevaCarpeta, prueba, sembrar, terminar } = require('./util');

(async () => {
  await prueba('Todas las vistas se muestran sin errores', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    const vistas = await w.evaluate(() => Object.keys(RENDERS).filter((k) => !k.endsWith('_despues')));
    const fallidas = [];
    for (const v of vistas) {
      const n = errores.length;
      const r = await w.evaluate((v) => { try { ir(v, {}); return ''; } catch (e) { return e.message; } }, v);
      await w.waitForTimeout(30);
      if (r || errores.length > n) fallidas.push(`${v}: ${r || errores.slice(n).join(' | ')}`);
    }
    await app.close();
    assert.deepStrictEqual(fallidas, []);
  });

  await prueba('Plantillas de boletín y comunicados rellenan variables', async () => {
    const { app, w } = await abrir(nuevaCarpeta());
    const r = await w.evaluate(() => rellenar('Hola {nombre}, {falta}', { nombre: 'Luisa' }));
    await app.close();
    assert.strictEqual(r, 'Hola Luisa, {falta}');
  });

  await prueba('Las claves de IA se guardan cifradas, fuera de datos.json y de los respaldos', async () => {
    const dir = nuevaCarpeta();
    let { app, w } = await abrir(dir);
    await sembrar(w);
    await w.evaluate(() => { S.config.ia.claves.anthropic = 'sk-ant-secreta-123'; guardar(); });
    await esperarGuardado(w);
    await app.close();
    assert.ok(!fs.readFileSync(path.join(dir, 'datos.json'), 'utf8').includes('sk-ant-secreta-123'), 'la clave quedó en datos.json');
    assert.ok(fs.existsSync(path.join(dir, 'claves.dat')), 'no se creó claves.dat');
    ({ app, w } = await abrir(dir));
    const clave = await w.evaluate(() => S.config.ia.claves.anthropic);
    await app.close();
    assert.strictEqual(clave, 'sk-ant-secreta-123');
    for (const f of fs.readdirSync(path.join(dir, 'respaldos-automaticos'))) assert.ok(!fs.readFileSync(path.join(dir, 'respaldos-automaticos', f), 'utf8').includes('sk-ant-secreta'), 'la clave quedó en un respaldo');
  });

  await prueba('Datos de versiones anteriores: claves en claro e imágenes dentro de datos.json se migran', async () => {
    const dir = nuevaCarpeta();
    const img = 'data:image/png;base64,' + 'Q'.repeat(50000);
    fs.writeFileSync(path.join(dir, 'datos.json'), JSON.stringify({ version: 1, config: { institucion: 'IE Vieja', docente: 'Luis', configurado: true, ia: { proveedor: 'openai', claves: { openai: 'sk-vieja' }, modelos: {} } },
      areas: [], grupos: [], alumnos: [], pizarras: [{ id: 'tab1', titulo: 'Viejo', grupoIds: [], formato: 'pizarra-local', items: [{ id: 'i1', type: 'image', asset: 'r1', x: 0, y: 0, w: 10, h: 10 }], assets: { r1: img } }] }));
    const { app, w } = await abrir(dir);
    await esperarGuardado(w);
    const clave = await w.evaluate(() => S.config.ia.claves.openai);
    await app.close();
    assert.strictEqual(clave, 'sk-vieja');
    const d = datos(dir);
    assert.strictEqual(d.pizarras[0].assets, undefined, 'las imágenes siguen dentro de datos.json');
    assert.ok(!JSON.stringify(d).includes('sk-vieja'), 'la clave sigue en datos.json');
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'tableros', 'tab1.json'), 'utf8')).r1, img);
  });

  await prueba('Tableros: las imágenes viven en su archivo, se cargan al abrir y se copian al duplicar', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    const img = 'data:image/png;base64,' + 'Z'.repeat(80000);
    const id = await w.evaluate((img) => { const t = pzNuevoTablero({ titulo: 'Fracciones', grupoIds: ['g1'] }); t.assets = { r1: img }; t.items = [{ id: 'i1', type: 'image', asset: 'r1', x: 0, y: 0, w: 100, h: 100 }]; guardar(); return t.id; }, img);
    await esperarGuardado(w);
    assert.strictEqual(datos(dir).pizarras[0].assets, undefined);
    assert.ok(fs.existsSync(path.join(dir, 'tableros', id + '.json')));
    // Abrir el editor y comprobar que la pizarra recibe la imagen
    await w.evaluate((id) => pzAbrir(id), id);
    await w.waitForFunction(() => PZ.listo, null, { timeout: 15000 });
    await w.waitForTimeout(500);
    const enMarco = await w.evaluate(() => document.getElementById('pz-marco').contentWindow.eval('!!(S.board && S.board.assets && S.board.assets.r1)'));
    assert.ok(enMarco, 'la pizarra no recibió la imagen');
    await w.evaluate(() => pzSalir());
    await w.waitForFunction(() => ui.vista === 'pizarras');
    await w.evaluate((id) => pzDuplicarTablero(id), id);
    await esperarGuardado(w);
    const copia = datos(dir).pizarras.find((t) => t.id !== id);
    assert.ok(copia, 'no se duplicó');
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'tableros', copia.id + '.json'), 'utf8')).r1, img);
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  await prueba('El respaldo en carpeta de nube es completo (con imágenes de tableros) y sin claves', async () => {
    const dir = nuevaCarpeta();
    const nube = nuevaCarpeta();
    const { app, w } = await abrir(dir);
    await sembrar(w);
    await w.evaluate(() => { S.config.ia.claves.gemini = 'AIza-secreta'; const t = pzNuevoTablero({ titulo: 'Con imagen' }); t.assets = { r9: 'data:image/png;base64,AAAA' }; guardar(); });
    await esperarGuardado(w);
    const r = await w.evaluate(async (nube) => { await api.configurarNube(nube); return api.respaldarNube(); }, nube);
    await app.close();
    assert.ok(r.ok, r.error);
    const texto = fs.readFileSync(path.join(nube, 'Respaldos Planeador Docente', 'planeador-ultimo.json'), 'utf8');
    assert.ok(!texto.includes('AIza-secreta'), 'la clave quedó en el respaldo');
    assert.strictEqual(JSON.parse(texto).pizarras[0].assets.r9, 'data:image/png;base64,AAAA');
  });

  await prueba('Si datos.json se daña, se recupera solo desde el último respaldo', async () => {
    const dir = nuevaCarpeta();
    let { app, w } = await abrir(dir);
    await sembrar(w);
    await app.close();
    ({ app, w } = await abrir(dir)); // al abrir se crea un respaldo automático con los datos sembrados
    await app.close();
    fs.writeFileSync(path.join(dir, 'datos.json'), '{"config": {"institucion": "IE Prue'); // archivo cortado (apagón)
    ({ app, w } = await abrir(dir));
    const r = await w.evaluate(() => ({ inst: S.config.institucion, alumnos: S.alumnos.length, modal: document.getElementById('modal').textContent }));
    await app.close();
    assert.strictEqual(r.inst, 'IE Prueba');
    assert.strictEqual(r.alumnos, 25);
    assert.match(r.modal, /Datos recuperados/);
    assert.ok(fs.readdirSync(dir).some((f) => f.startsWith('datos-danado_')), 'no se conservó el archivo dañado');
  });

  await prueba('Papelera: un grupo eliminado vuelve con sus estudiantes', async () => {
    const dir = nuevaCarpeta();
    const { app, w } = await abrir(dir);
    await sembrar(w);
    await w.evaluate(() => { iniciarPapelera('Grupo 7A'); S.grupos = []; S.alumnos = []; guardar(); });
    await esperarGuardado(w);
    const r = await w.evaluate(async () => { await recuperarPapelera(S.papelera[0].id); return { g: S.grupos.length, a: S.alumnos.length }; });
    await app.close();
    assert.deepStrictEqual(r, { g: 1, a: 25 });
  });

  await prueba('Guardar con muchos datos es rápido y no reescribe si nada cambió', async () => {
    const dir = nuevaCarpeta();
    const { app, w } = await abrir(dir);
    await sembrar(w);
    const r = await w.evaluate(async () => {
      const img = 'data:image/jpeg;base64,' + 'A'.repeat(400000);
      for (let i = 0; i < 15; i++) { const t = pzNuevoTablero({ titulo: 'T' + i }); t.assets = { x: img }; }
      for (let i = 0; i < 150; i++) S.planeaciones.push({ id: uid(), titulo: 'Plan ' + i, grupoId: 'g1', areaId: 'a1', sesiones: [{ id: uid(), fecha: hoyISO(), exploracion: 'x'.repeat(1500) }] });
      guardar(); await new Promise((r) => setTimeout(r, 450)); await cadenaGuardado;
      const t0 = performance.now(); await pasoGuardado(); const sinCambios = performance.now() - t0;
      S.planeaciones[0].titulo = 'cambio';
      const t1 = performance.now(); await pasoGuardado(); const conCambio = performance.now() - t1;
      return { sinCambios, conCambio };
    });
    await app.close();
    const tam = fs.statSync(path.join(dir, 'datos.json')).size;
    console.log(`   datos.json: ${(tam / 1e6).toFixed(2)} MB · guardado con cambio: ${Math.round(r.conCambio)} ms · sin cambios: ${Math.round(r.sinCambios)} ms`);
    assert.ok(tam < 2e6, 'datos.json sigue incluyendo las imágenes');
    assert.ok(r.conCambio < 150, 'guardar tarda demasiado');
  });

  terminar();
})();
