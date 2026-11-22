const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  cargar: () => ipcRenderer.invoke('datos:cargar'),
  guardar: (estado) => ipcRenderer.invoke('datos:guardar', estado),
  ubicacionDatos: () => ipcRenderer.invoke('datos:ubicacion'),
  abrirCarpetaDatos: () => ipcRenderer.invoke('datos:abrirCarpeta'),
  exportarRespaldo: (estado) => ipcRenderer.invoke('respaldo:exportar', estado),
  importarRespaldo: () => ipcRenderer.invoke('respaldo:importar'),
  listarRespaldosAuto: () => ipcRenderer.invoke('respaldo:listarAuto'),
  restaurarRespaldoAuto: (nombre) => ipcRenderer.invoke('respaldo:restaurarAuto', nombre),
  exportarWord: (payload) => ipcRenderer.invoke('word:planeacion', payload),
  guardarCSV: (nombre, contenido) => ipcRenderer.invoke('csv:guardar', { nombre, contenido }),
  sugerirIA: (payload) => ipcRenderer.invoke('ia:sugerir', payload),
});
