# Pizarra Local (integrada)

Editor de tableros tomado de [soydarwinruiz/pizarra-local](https://github.com/soydarwinruiz/pizarra-local) (versión 1.3.0, licencia MIT), con `vendor/pdfjs` (licencia Apache 2.0, ver `vendor/pdfjs/LICENSE`).

Cambios hechos para el Planeador Docente (buscar `[Planeador Docente]` en `index.html`):

- **Modo embebido:** cuando se abre dentro del planeador (iframe), los tableros no se guardan en IndexedDB sino que se envían al planeador por `postMessage` (`listo`, `abrir`, `guardar`, `insertar`, `nombre`, `cerrar`, `cerrado`, `pdf`). Se ocultan el menú ☰ y la lista de tableros, que maneja el planeador.
- **Formato por letra ampliado:** además de negrita, cursiva, subrayado, tachado y color, cada fragmento de texto puede tener su propia **fuente** (`f`), **tamaño** relativo (`z`) y **resaltado** (`h`). La barra de formato tiene selector de fuentes con buscador, tamaños (A−, A+ y lista) y colores de resaltado. El ajuste automático del texto a la nota o forma tiene en cuenta los tamaños distintos por línea.
- **PDF:** se genera con el planeador (`api.guardarPDF`).
- **Atajos del planeador:** Ctrl + B y Ctrl + Shift + B se reenvían al planeador (mensaje `atajo`) para ocultar el menú lateral y el modo enfoque.
- **Puntas de flecha:** la línea del conector se recorta para terminar dentro de la punta, la punta escala con el grosor y se orienta con el final de la curva; los guiones se reparten para empezar y terminar con trazo (`connArrows`, `dashFor`).

Para traer una versión nueva de Pizarra Local, copiar su `index.html` y volver a aplicar los bloques marcados con `[Planeador Docente]`.
