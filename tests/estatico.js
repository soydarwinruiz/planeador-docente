// Revisión estática sin dependencias: sintaxis de todos los archivos y nombres globales repetidos entre los
// scripts de la interfaz (todos comparten el mismo ámbito global: si dos archivos declaran la misma función,
// el último la reemplaza en silencio y rompe al otro módulo).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
let fallas = 0;
const falla = (m) => { console.error('✗ ' + m); fallas++; };

const archivosRaiz = fs.readdirSync(RAIZ).filter((f) => f.endsWith('.js')).map((f) => path.join(RAIZ, f));
const html = fs.readFileSync(path.join(RAIZ, 'src', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map((m) => path.join(RAIZ, 'src', m[1]));
for (const f of [...archivosRaiz, ...scripts, ...fs.readdirSync(__dirname).map((f) => path.join(__dirname, f)).filter((f) => f.endsWith('.js'))]) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { falla(`Sintaxis: ${path.relative(RAIZ, f)}\n${e.stderr}`); }
}

const declaradoEn = new Map();
for (const f of scripts) {
  const texto = fs.readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    const nombre = m[1] || m[2];
    const previo = declaradoEn.get(nombre);
    if (previo && previo !== f) falla(`"${nombre}" está declarado en ${path.basename(previo)} y en ${path.basename(f)}`);
    else declaradoEn.set(nombre, f);
  }
}
// Funciones usadas en atributos onclick/oninput… que no existen
const todo = scripts.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const nativas = new Set(['if', 'for', 'while', 'return', 'function', 'setTimeout', 'clearTimeout', 'Number', 'String', 'parseInt', 'parseFloat', 'alert', 'confirm', 'Object', 'Array', 'Boolean', 'encodeURIComponent', 'decodeURIComponent', 'JSON', 'Date', 'requestAnimationFrame', 'isNaN', 'switch', 'catch', 'structuredClone', 'Set', 'Map', 'await', 'typeof', 'async', 'fetch', 'Promise', 'prompt']);
for (const m of todo.matchAll(/\son[a-z]+=\\?"([^"]*)"/g)) {
  for (const c of m[1].matchAll(/(?<![.\w$]|\$\{)([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (!declaradoEn.has(c[1]) && !nativas.has(c[1]) && !/\$\{/.test(c[1])) falla(`Manejador en línea llama a "${c[1]}", que no existe`);
  }
}
// Todo lo que el programa carga (require('./…'), archivos leídos con __dirname) debe ir en el instalador (build.files)
const pkg = require(path.join(RAIZ, 'package.json'));
const patrones = pkg.build.files.filter((f) => !f.startsWith('!'));
const incluido = (rel) => patrones.some((p) => p === rel || (p.endsWith('/**/*') && rel.startsWith(p.slice(0, -4))));
const necesarios = new Set(['main.js', 'preload.js', 'package.json', 'src/index.html']);
const pendientes = ['main.js', 'preload.js'];
while (pendientes.length) {
  const f = pendientes.pop();
  const t = fs.readFileSync(path.join(RAIZ, f), 'utf8');
  for (const m of t.matchAll(/require\('\.\/([\w-]+)'\)/g)) { const r = m[1] + '.js'; if (!necesarios.has(r)) { necesarios.add(r); pendientes.push(r); } }
  for (const m of t.matchAll(/path\.join\(__dirname, ((?:'[^']+'(?:, )?)+)\)/g)) necesarios.add(m[1].split(', ').map((x) => x.slice(1, -1)).join('/'));
}
for (const r of necesarios) if (!incluido(r)) falla(`"${r}" se usa pero no está en la lista de archivos del instalador (package.json → build.files)`);

// Las páginas que se abren en celulares (del docente y de los estudiantes) deben funcionar en navegadores de 2019
// (Chrome 76, Safari 13): sin ?., ??, ||= ni nada más nuevo, ni en los scripts ni en los atributos onclick…
const acorn = require('acorn');
for (const [nombre, html] of [['pagina-celular.html', fs.readFileSync(path.join(RAIZ, 'pagina-celular.html'), 'utf8')], ['pagina-movil.js', require(path.join(RAIZ, 'pagina-movil.js')).paginaMovil()]]) {
  const codigos = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!codigos.length) falla(`${nombre}: no se encontró el script`);
  codigos.forEach((c) => { try { acorn.parse(c, { ecmaVersion: 2019, sourceType: 'script' }); } catch (e) { falla(`${nombre}: sintaxis que no funciona en celulares de 2019 (${e.message})`); } });
  for (const m of html.matchAll(/\son[a-z]+=\\?"([^"]*)"/g)) if (/\?\.(?!\d)|\?\?|\|\|=|&&=/.test(m[1])) falla(`${nombre}: manejador en línea con sintaxis nueva: ${m[1].slice(0, 80)}`);
}

if (fallas) { console.error(`\n${fallas} problema(s)`); process.exit(1); }
console.log(`✓ Revisión estática: ${archivosRaiz.length + scripts.length} archivos, ${declaradoEn.size} nombres globales sin choques`);
