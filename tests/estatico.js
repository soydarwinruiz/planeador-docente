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
  for (const c of m[1].matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (!declaradoEn.has(c[1]) && !nativas.has(c[1]) && !/\$\{/.test(c[1])) falla(`Manejador en línea llama a "${c[1]}", que no existe`);
  }
}
if (fallas) { console.error(`\n${fallas} problema(s)`); process.exit(1); }
console.log(`✓ Revisión estática: ${archivosRaiz.length + scripts.length} archivos, ${declaradoEn.size} nombres globales sin choques`);
