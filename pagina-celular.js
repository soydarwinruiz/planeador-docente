// Página que abre el docente en su celular (se sirve desde el computador; ver src/celular.js)
const fs = require('fs');
const path = require('path');
let cache = null;
function paginaCelular() { return (cache ||= fs.readFileSync(path.join(__dirname, 'pagina-celular.html'), 'utf8')); }
module.exports = { paginaCelular };
