// IA local de verdad: instala el motor llama.cpp y un modelo pequeño desde una carpeta (como una USB), genera una
// sugerencia sin internet, rechaza un archivo alterado y se desinstala. Necesita los archivos en TIZA_IA_LOCAL_CACHE
// (las pruebas de GitHub los descargan y los guardan en caché; ver .github/workflows/pruebas.yml).
const { fs, path, assert, abrir, esperarGuardado, nuevaCarpeta, prueba, sembrar, terminar } = require('./util');

const CACHE = process.env.TIZA_IA_LOCAL_CACHE;
const MOTOR = process.platform === 'win32' ? 'llama-b12815-bin-win-cpu-x64.zip' : 'llama-b12815-bin-ubuntu-x64.tar.gz';
const MODELO = 'Qwen3-0.6B-Q8_0.gguf';

(async () => {
  if (!CACHE || !fs.existsSync(path.join(CACHE, MOTOR)) || !fs.existsSync(path.join(CACHE, MODELO))) {
    console.log(`– IA local: se omite (faltan ${MOTOR} y ${MODELO} en TIZA_IA_LOCAL_CACHE)`);
    return terminar();
  }

  await prueba('IA local: se instala desde una carpeta, genera una planeación sin internet y se desinstala', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    // Instalar desde una carpeta (como una USB): se copia y se verifica la huella de cada archivo
    await app.evaluate(({ dialog }, ruta) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [ruta] }); }, CACHE);
    await w.evaluate(() => { cerrarModal(); S.config.ia = { ...S.config.ia, proveedor: 'local' }; irAConfig('ia'); });
    await w.waitForFunction(() => IA_LOCAL.estado && !IA_LOCAL.estado.instalado, null, { timeout: 15000 });
    await w.evaluate(() => instalarIALocal('prueba', true));
    const est = await w.evaluate(() => IA_LOCAL.estado);
    assert.ok(est.instalado, 'no quedó instalada');
    assert.strictEqual(await w.evaluate(() => S.config.ia.proveedor), 'local');
    // Probar conexión y generar una planeación real con el motor local
    const prob = await w.evaluate(() => api.sugerirIA({ ia: S.config.ia, tarea: 'prueba', contexto: '' }));
    assert.ok(prob.ok, 'probar conexión: ' + prob.error);
    const id = await w.evaluate(() => {
      nuevaPlaneacion(); document.getElementById('m-titulo').value = 'Fracciones equivalentes'; crearPlaneacion(); cerrarModal();
      return S.planeaciones.at(-1).id;
    });
    const t0 = Date.now();
    await w.evaluate(async (id) => { dialogoIA(id); document.querySelectorAll('.m-ia').forEach((c) => { c.checked = c.value === 'objetivo'; }); document.getElementById('m-ia-crit').checked = false; document.getElementById('m-ia-ses').checked = false; await ejecutarIA(id); }, id);
    const p = await w.evaluate((id) => ({ objetivo: porId(S.planeaciones, id).objetivo, error: document.getElementById('m-ia-error')?.textContent || '' }), id);
    assert.ok(p.objetivo && p.objetivo.length > 10, `la IA local no llenó el objetivo (${p.error})`);
    console.log(`    objetivo generado en ${Date.now() - t0} ms: ${p.objetivo.slice(0, 90)}…`);
    // Imágenes: aviso claro
    const img = await w.evaluate(() => api.sugerirIA({ ia: S.config.ia, tarea: 'retro', contexto: 'x', imagenes: [{ tipo: 'image/png', datos: 'AA==' }] }));
    assert.ok(!img.ok && /imágenes/.test(img.error));
    // Quitar: se borra todo
    await w.evaluate(() => { window.confirmar = async () => true; return quitarIALocal(); });
    await esperarGuardado(w);
    const fin = await w.evaluate(async () => ({ estado: await api.iaLocalEstado(), proveedor: S.config.ia.proveedor }));
    await app.close();
    assert.ok(!fin.estado.instalado);
    assert.notStrictEqual(fin.proveedor, 'local');
    assert.ok(!fs.existsSync(path.join(dir, 'ia-local')), 'no se borró la carpeta de la IA local');
    assert.deepStrictEqual(errores, []);
  });

  await prueba('IA local: un archivo alterado (mismo tamaño, contenido distinto) se rechaza y se borra', async () => {
    const dir = nuevaCarpeta();
    const usb = nuevaCarpeta();
    fs.copyFileSync(path.join(CACHE, MOTOR), path.join(usb, MOTOR));
    const b = fs.readFileSync(path.join(usb, MOTOR)); b[b.length - 100] ^= 0xff; fs.writeFileSync(path.join(usb, MOTOR), b);
    const { app, w } = await abrir(dir);
    await app.evaluate(({ dialog }, ruta) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [ruta] }); }, usb);
    // Sin la caché de pruebas, solo con la USB alterada
    const r = await w.evaluate(() => api.iaLocalInstalar({ modelo: 'prueba', desdeCarpeta: true }));
    await app.close();
    assert.ok(!r.ok && /no coincide con el original/.test(r.error), 'aceptó un archivo alterado: ' + JSON.stringify(r));
    assert.ok(!fs.readdirSync(path.join(dir, 'ia-local', 'archivos')).some((f) => f.startsWith('llama')), 'el archivo alterado quedó guardado');
  });

  terminar();
})();
