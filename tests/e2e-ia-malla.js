// La IA tiene presentes la identificación y la diversidad del aula; la malla se ajusta a los campos de la institución
const { fs, path, assert, abrir, esperarGuardado, nuevaCarpeta, prueba, sembrar, terminar } = require('./util');

// Reemplaza la IA por una que guarda lo que recibe y responde con los datos indicados
async function iaFalsa(app, respuesta) {
  await app.evaluate(({ ipcMain }, resp) => {
    global.__pedidos = [];
    ipcMain.removeHandler('ia:sugerir');
    ipcMain.handle('ia:sugerir', (_e, p) => { global.__pedidos.push(p); return { ok: true, datos: resp }; });
  }, respuesta);
}
const pedidos = (app) => app.evaluate(() => global.__pedidos);

(async () => {
  await prueba('IA: la planeación y el material de una sesión llevan la identificación y la diversidad del aula', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await iaFalsa(app, { objetivo: 'Objetivo de prueba', criterio: 'c', niveles: [] });
    const id = await w.evaluate(() => {
      S.config.ia = { ...S.config.ia, proveedor: 'gemini', claves: { gemini: 'x' } };
      S.alumnos[3].piar = true; S.alumnos[3].observaciones = 'Baja visión: letra grande';
      nuevaPlaneacion(); document.getElementById('m-titulo').value = 'Fracciones equivalentes'; crearPlaneacion(); cerrarModal();
      const p = S.planeaciones.at(-1);
      Object.assign(p, { titulo: 'Fracciones equivalentes', grupoId: 'g1', areaId: 'a1', duracion: '2 horas', locativos: 'Aula sin internet', recursos: 'Tablero y regletas',
        estilos: 'Aprenden mejor manipulando material', gustos: 'Fútbol y música', caracteristicas: 'Grupo numeroso, dificultades de lectura', ajustes: '• Instrucciones de una en una' });
      p.sesiones[0].titulo = 'Pizzas y fracciones'; p.sesiones[0].exploracion = 'Partir una pizza de papel';
      guardar();
      return p.id;
    });
    await w.evaluate(async (id) => { dialogoIA(id); await ejecutarIA(id); }, id);
    await w.evaluate((id) => { const p = porId(S.planeaciones, id); dialogoMaterialSesion(p.id, p.sesiones[0].id); return materialRubrica(p.id, p.sesiones[0].id); }, id);
    const [plan, rubrica] = await pedidos(app);
    await esperarGuardado(w);
    await app.close();
    for (const [nombre, c] of [['planeación', plan.contexto], ['rúbrica', rubrica.contexto]]) {
      for (const t of ['IDENTIFICACIÓN', 'Aula sin internet', 'Tablero y regletas', '2 horas', '25 estudiantes', 'DIVERSIDAD DEL AULA', 'manipulando material', 'Fútbol y música', 'dificultades de lectura', 'Instrucciones de una en una', 'Baja visión'])
        assert.ok(c.includes(t), `${nombre}: falta "${t}" en el contexto`);
      assert.ok(!/Nombre3|Apellido3/.test(c), `${nombre}: se envió el nombre de un estudiante`);
    }
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Malla: el docente oculta, renombra y agrega campos; se guardan, los llena la IA y salen en el Word', async () => {
    const dir = nuevaCarpeta();
    let { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await w.evaluate(() => { cerrarModal(); ui.cur = { pestana: 'malla', areaId: 'a1', grado: 7, periodoId: '', grupoId: '' }; ir('curricular'); });
    const mId = await w.evaluate(() => { const m = obtenerMalla('a1', 7); agregarItemMalla(m.id, S.config.periodos[0].id); return m.id; });
    // Configurar los campos desde el diálogo, como lo haría el docente
    await w.click('text=⚙️ Campos');
    await w.locator('#modal tr').filter({ has: w.locator('input[value="DBA"]') }).locator('input[type=checkbox]').uncheck();
    await w.locator('#modal input[value="Contenidos"]').fill('Saberes');
    await w.locator('#modal input[value="Contenidos"]').dispatchEvent('change');
    await w.fill('#m-campo-nuevo', 'Proyecto transversal');
    await w.click('text=＋ Agregar campo');
    await w.fill('#m-campo-nuevo', '<img src=x onerror=window.__xss=1>');
    await w.press('#m-campo-nuevo', 'Enter');
    await w.click('#modal >> text=Listo');
    const etiquetas = await w.$$eval('.sesion-caja label', (ls) => ls.map((l) => l.textContent.trim()));
    assert.ok(!etiquetas.some((t) => t.startsWith('DBA')), 'el campo oculto sigue visible');
    assert.ok(etiquetas.includes('Saberes'), 'no se renombró: ' + etiquetas.join(' | '));
    assert.ok(etiquetas.includes('Proyecto transversal'), 'no aparece el campo propio');
    const k = await w.evaluate(() => camposMalla().find((f) => f.t === 'Proyecto transversal').k);
    await w.fill(`[id="ta-it-${await w.evaluate((m) => porId(S.mallas, m).periodos[S.config.periodos[0].id].items[0].id, mId)}-${k}"]`, 'Educación ambiental');
    // La IA recibe y llena el campo propio
    await iaFalsa(app, { pregunta: '¿?', items: [{ eje: 'Eje IA', contenidos: 'c', [k]: 'PRAE', horas: 4 }] });
    await w.evaluate(async ([m, per]) => { S.config.ia = { ...S.config.ia, proveedor: 'gemini', claves: { gemini: 'x' } }; iaMalla(m, per); await ejecutarIAMalla(m, per); }, [mId, await w.evaluate(() => S.config.periodos[0].id)]);
    const [pedido] = await pedidos(app);
    assert.ok(pedido.contexto.includes(`"${k}" (Proyecto transversal)`), 'la IA no recibió el campo propio');
    // Word con las columnas de la institución
    const salida = path.join(dir, 'malla.docx');
    await app.evaluate(({ dialog, shell }, ruta) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: ruta }); shell.openPath = async () => ''; }, salida);
    await w.evaluate((m) => exportarMalla(m), mId);
    await w.waitForFunction(() => document.getElementById('avisos').textContent.length > 0);
    await esperarGuardado(w);
    const xss = await w.evaluate(() => window.__xss);
    await app.close();
    assert.strictEqual(xss, undefined, 'el nombre de un campo ejecutó código');
    const doc = require('child_process').execSync(`unzip -p "${salida}" word/document.xml`).toString();
    for (const t of ['Saberes', 'Proyecto transversal', 'Educación ambiental', 'PRAE', 'Eje IA']) assert.ok(doc.includes(t), `falta "${t}" en el Word`);
    assert.ok(!doc.includes('>DBA<'), 'la columna oculta salió en el Word');
    // Se conserva al volver a abrir
    ({ app, w, errores } = await abrir(dir));
    const r = await w.evaluate(() => camposMalla().map((f) => f.t));
    await app.close();
    assert.ok(r.includes('Saberes') && r.includes('Proyecto transversal') && !r.includes('DBA'), r.join(','));
    assert.deepStrictEqual(errores, []);
  });

  await prueba('IA: la lista de modelos de la cuenta se consulta con internet, se elige de la lista y se conserva sin conexión', async () => {
    const dir = nuevaCarpeta();
    let { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await app.evaluate(({ ipcMain }) => {
      global.__consultas = [];
      ipcMain.removeHandler('ia:modelos');
      ipcMain.handle('ia:modelos', (_e, p) => { global.__consultas.push(p.proveedor); return { ok: true, modelos: [{ id: 'gemini-9.1-flash', nombre: 'Gemini 9.1 Flash' }, { id: 'gemini-9.1-pro', nombre: '' }, { id: '"><img src=x onerror=window.__xss=1>', nombre: '' }] }; });
    });
    await w.evaluate(() => { cerrarModal(); S.config.ia = { ...S.config.ia, proveedor: 'gemini', claves: { gemini: 'AQ.prueba' }, modelos: {} }; irAConfig('ia'); });
    await w.waitForFunction(() => document.querySelectorAll('#cfg-modelo-sel option').length === 5, null, { timeout: 10000 });
    assert.strictEqual(await app.evaluate(() => global.__consultas.length), 1, 'no consultó automáticamente al abrir');
    await w.selectOption('#cfg-modelo-sel', 'gemini-9.1-flash');
    await esperarGuardado(w);
    const r = await w.evaluate(() => ({ modelo: S.config.ia.modelos.gemini, info: document.getElementById('cfg-modelos-info').textContent, xss: window.__xss }));
    assert.strictEqual(r.modelo, 'gemini-9.1-flash');
    assert.match(r.info, /3 modelos disponibles en tu cuenta/);
    assert.strictEqual(r.xss, undefined, 'un nombre de modelo ejecutó código');
    // "Otro…" permite escribir cualquier nombre
    await w.selectOption('#cfg-modelo-sel', '__otro');
    await w.fill('#cfg-modelo', 'gemini-experimental-x'); await w.dispatchEvent('#cfg-modelo', 'change');
    await esperarGuardado(w);
    await app.close();
    // Sin internet (la consulta falla): se ve la última lista guardada y lo escrito a mano
    ({ app, w, errores } = await abrir(dir));
    await w.evaluate(() => { cerrarModal(); ui.modelosPedidos = {}; irAConfig('ia'); return actualizarModelosIA(true); });
    const s = await w.evaluate(() => ({ opciones: [...document.querySelectorAll('#cfg-modelo-sel option')].map((o) => o.value), otro: !document.getElementById('cfg-modelo').hidden, valor: document.getElementById('cfg-modelo').value, info: document.getElementById('cfg-modelos-info').textContent }));
    await app.close();
    assert.ok(s.opciones.includes('gemini-9.1-flash'), 'se perdió la lista sin conexión');
    assert.ok(s.otro && s.valor === 'gemini-experimental-x', 'no conservó el modelo escrito a mano');
    assert.match(s.info, /última lista guardada/);
    assert.deepStrictEqual(errores, []);
  });

  terminar();
})();
