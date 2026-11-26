// Recorridos reales de la 2.0 con la base de datos: migración con clave, respaldo entre computadores,
// restauración de respaldos .db y .json, nuevo año, cierre inmediato y volver de la 1.x.
const { abrir, sembrar, nuevaCarpeta, datos, registroDe, esperarGuardado } = require('./util');
const { _electron } = require('playwright-core');
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..');
const lanzar = (dir) => _electron.launch({ executablePath: require(RAIZ + '/node_modules/electron'), args: [RAIZ, '--no-sandbox'], env: { ...process.env, PLANEADOR_DATA_DIR: dir, TIZA_LLAVE_PLANA: '1' } });
const res = [];
const caso = async (n, fn) => { try { await fn(); res.push('✓ ' + n); } catch (e) { res.push('✗ ' + n + ': ' + e.message.split('\n')[0]); } };
(async () => {
  await caso('A. 1.x con clave → 2.0: pide clave, migra, entrega código nuevo y cifra con la clave', async () => {
    const d0 = nuevaCarpeta(); let { app, w } = await abrir(d0); await w.evaluate(() => api.accesoActivar('clave-9', 10)); await app.close();
    const d = nuevaCarpeta();
    fs.copyFileSync(path.join(d0, 'acceso.json'), path.join(d, 'acceso.json')); // acceso de la 1.x (sin llave ni base de datos)
    fs.writeFileSync(path.join(d, 'datos.json'), JSON.stringify({ version: 1, config: { institucion: 'IE Uno', docente: 'Ana', configurado: true }, areas: [], grupos: [{ id: 'g1', grado: 7, nombre: 'A', areas: [] }], alumnos: [{ id: 'x', grupoId: 'g1', nombres: 'Sara', apellidos: 'Q', activo: true }] }));
    app = await lanzar(d); w = await app.firstWindow();
    await w.waitForSelector('#bloqueo-clave'); await w.fill('#bloqueo-clave', 'clave-9'); await w.click('#bloqueo-entrar');
    await w.waitForFunction(() => S && S.alumnos.length === 1, null, { timeout: 15000 });
    await w.waitForFunction(() => /código de recuperación/i.test(document.getElementById('modal').textContent), null, { timeout: 5000 });
    const codigo = await w.evaluate(() => document.getElementById('modal').textContent.match(/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/)?.[0]);
    await app.close();
    const llave = JSON.parse(fs.readFileSync(path.join(d, 'llave.dat'), 'utf8'));
    if (llave.modo !== 'clave') throw new Error('la llave no quedó protegida con la clave: ' + llave.modo);
    // con el código nuevo se recupera el acceso y los datos
    app = await lanzar(d); w = await app.firstWindow(); await w.waitForSelector('#bloqueo-clave');
    await w.click('text=¿Olvidaste la clave?'); await w.fill('#rec-codigo', codigo); await w.fill('#rec-nueva', 'otra-1'); await w.fill('#rec-nueva2', 'otra-1'); await w.click('text=Cambiar la clave y entrar');
    await w.waitForFunction(() => S && S.alumnos[0]?.nombres === 'Sara', null, { timeout: 15000 });
    await app.close();
  });
  await caso('B. Respaldo manual → otro computador: todo llega (notas, registro, años)', async () => {
    const d1 = nuevaCarpeta(); let { app, w } = await abrir(d1); await sembrar(w);
    const salida = path.join(d1, 'respaldo.json');
    await app.evaluate(({ dialog }, ruta) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: ruta }); }, salida);
    await w.evaluate(async () => { S.notas.n1 = { al0: 4.1, al1: 3.2 }; guardar(); await new Promise((r) => setTimeout(r, 500)); await cadenaGuardado; await api.aniosArchivar(textoEstado()); await crearRespaldo(); });
    const antes = await w.evaluate(() => textoEstado());
    await app.close();
    const d2 = nuevaCarpeta(); ({ app, w } = await abrir(d2));
    await app.evaluate(({ dialog }, ruta) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [ruta] }); }, salida);
    await w.evaluate(() => { cerrarModal(); restaurarRespaldo(); });
    await w.click('#modal .btn.peligro');
    await w.waitForFunction(() => S.alumnos.length === 25);
    await esperarGuardado(w);
    const r = await w.evaluate(async () => ({ estado: textoEstado(), anios: (await api.aniosListar()).length, registro: registro().length }));
    await app.close();
    const A = JSON.parse(antes), D = JSON.parse(r.estado);
    const dif = ['grupos', 'alumnos', 'notas', 'planillas', 'config'].filter((k) => JSON.stringify(A[k]) !== JSON.stringify(D[k]));
    if (dif.length) throw new Error('distinto: ' + dif.join(','));
    if (r.anios !== 1) throw new Error('años: ' + r.anios);
    if (!r.registro) throw new Error('sin registro de notas');
    if (registroDe(d2).length !== r.registro) throw new Error('registro no guardado en la base de datos');
  });
  await caso('C. Restaurar un respaldo automático .db y uno .json de la 1.x', async () => {
    const d = nuevaCarpeta(); let { app, w } = await abrir(d); await sembrar(w); await app.close();
    ({ app, w } = await abrir(d)); await app.close(); // al abrir se crea un respaldo .db
    fs.mkdirSync(path.join(d, 'respaldos-automaticos'), { recursive: true });
    fs.writeFileSync(path.join(d, 'respaldos-automaticos', 'respaldo_2026-01-01_0800.json'), JSON.stringify({ version: 1, config: { institucion: 'IE Vieja', configurado: true }, grupos: [], alumnos: [], areas: [] }));
    ({ app, w } = await abrir(d));
    const lista = await w.evaluate(() => api.listarRespaldosAuto());
    const db = lista.find((f) => f.endsWith('.db')), js = lista.find((f) => f.endsWith('.json'));
    if (!db || !js) throw new Error('lista: ' + lista.join(','));
    const a = await w.evaluate(async (n) => (await api.restaurarRespaldoAuto(n)).datos.alumnos.length, db);
    const b = await w.evaluate(async (n) => (await api.restaurarRespaldoAuto(n)).datos.config.institucion, js);
    await app.close();
    if (a !== 25 || b !== 'IE Vieja') throw new Error(`db=${a} json=${b}`);
  });
  await caso('D. Nuevo año en la base de datos y consulta del año archivado', async () => {
    const d = nuevaCarpeta(); let { app, w } = await abrir(d); await sembrar(w);
    await w.evaluate(() => { cerrarModal(); nuevoAnio(); }); await w.uncheck('[data-na="grupos"]'); await w.click('#modal .btn.peligro');
    await w.waitForFunction(() => S.grupos.length === 0); await esperarGuardado(w); await app.close();
    ({ app, w } = await abrir(d));
    const r = await w.evaluate(async () => { const [m] = await api.aniosListar(); await consultarAnio(m.id); return { grupos: S.grupos.length, actual: ui.archivo.actual.grupos.length }; });
    await app.close();
    if (r.grupos !== 1 || r.actual !== 0) throw new Error(JSON.stringify(r));
    if (datos(d).grupos?.length) throw new Error('el año en curso debería estar vacío');
  });
  await caso('E. Cerrar justo después de poner una nota: la nota queda guardada', async () => {
    const d = nuevaCarpeta(); let { app, w } = await abrir(d); await sembrar(w);
    await w.evaluate(() => { S.notas.rapida = { al0: 4.9 }; guardar(); }); // sin esperar los 400 ms
    await app.close();
    if (datos(d).notas?.rapida?.al0 !== 4.9) throw new Error('la nota no se guardó al cerrar');
  });
  await caso('F. 2.0 → 1.x → 2.0: lo hecho en la 1.x no se pierde', async () => {
    const d = nuevaCarpeta(); let { app, w } = await abrir(d); await sembrar(w); await app.close();
    await new Promise((r) => setTimeout(r, 50));
    // la 1.x vuelve a escribir datos.json (con un cambio hecho allá)
    fs.writeFileSync(path.join(d, 'datos.json'), JSON.stringify({ version: 1, config: { institucion: 'Hecho en la 1.x', docente: 'Ana', configurado: true }, areas: [], grupos: [], alumnos: [] }));
    ({ app, w } = await abrir(d));
    const inst = await w.evaluate(() => S.config.institucion);
    await app.close();
    if (inst !== 'Hecho en la 1.x') throw new Error('no tomó lo hecho en la 1.x: ' + inst);
    if (!fs.readdirSync(path.join(d, 'respaldos-automaticos')).some((f) => f.includes('antes-de-volver'))) throw new Error('no respaldó la base de datos antes de volver a migrar');
  });
  console.log(res.join('\n'));
  if (res.some((x) => x.startsWith('✗'))) process.exit(1);
})();
