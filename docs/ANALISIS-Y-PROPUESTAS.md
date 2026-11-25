# Análisis del Planeador Docente y propuestas (versión 1.15.1)

Revisión completa del código (unas 12 000 líneas propias en 45 archivos, más 650 KB de datos de referentes y banco pedagógico), con pruebas automáticas sobre la aplicación real y una prueba de carga con datos de un año completo: 8 grupos, 280 estudiantes, 2 áreas, 4 periodos con 20 actividades cada uno, asistencia diaria, 120 planeaciones y 15 tableros con fotos.

## 1. Diagnóstico

### Lo que está bien resuelto
- **Funciona sin internet y los datos se quedan en el equipo**; la IA es opcional y no recibe nombres de estudiantes.
- **Separación segura entre la interfaz y el sistema** (`contextIsolation`, sin Node en la interfaz, enlaces externos filtrados).
- **Cobertura funcional muy amplia** y conectada: malla → planeación → sesión → tablero → evaluación → seguimiento → informes.
- **Contexto colombiano** bien incorporado: Decreto 1290, 1421, estándares, DBA, festivos, SIMAT.
- El servidor de pruebas por QR está bien pensado: PIN con límite de intentos, token por estudiante, orden barajado por estudiante y la clave nunca sale del computador.

### Problemas encontrados y corregidos en 1.14.0

| Gravedad | Problema | Corrección |
|---|---|---|
| **Crítico** | Desde la 1.13.0 las **observaciones del boletín** y los **comunicados a padres** fallaban: `papelera.js` declaró otra función `rellenar` que reemplazó en silencio la de las plantillas (todos los scripts comparten el mismo espacio global). | Nombre propio (`rellenarFaltantes`) y una revisión automática que detecta nombres repetidos entre módulos. |
| Alto | Si `datos.json` se dañaba (apagón, disco lleno), la app arrancaba **vacía** y el primer cambio sobrescribía el archivo. | Recuperación automática desde el último respaldo válido, copia del archivo dañado y aviso al docente. |
| Alto | La escritura no se forzaba a disco antes de reemplazar el archivo; en Windows el antivirus u OneDrive pueden bloquearlo un instante y el guardado fallaba. | `fsync` + reintentos + plan B. |
| Alto | Abrir el programa dos veces dejaba dos ventanas guardando sobre el mismo archivo. | Una sola instancia; la segunda trae al frente la primera. |
| Alto | Los respaldos automáticos solo se hacían **al abrir** (15 aperturas = toda la historia). Quien deja el programa abierto días seguidos quedaba sin puntos de restauración. | Al abrir y cada hora si hubo cambios (15 recientes) + uno por día durante 30 días. |
| Medio (rendimiento) | Las imágenes de los tableros iban dentro de `datos.json`. Con 15 tableros con fotos el archivo pesaba ~9 MB y **cada guardado tardaba ~340 ms**, también cada medio segundo mientras se dibuja en un tablero (la app se sentía "pegada"). | Un archivo por tablero para las imágenes: `datos.json` ≈ 0,4 MB y cada guardado < 10 ms; si nada cambió no se escribe. |
| Medio (seguridad) | Las **claves de IA** se guardaban en texto plano dentro de `datos.json` y, por eso, se copiaban a la carpeta de OneDrive/Drive y a los respaldos que se llevan en una USB. | Cifradas con el sistema operativo (`safeStorage`) en un archivo aparte que nunca va en los respaldos. |
| Bajo | El respaldo de la nube y el manual no se escribían de forma segura; el de la nube se reescribía aunque no hubiera cambios. | Escritura segura, completo (con imágenes de tableros, sin claves) y solo cuando hay cambios. |
| Bajo | Errores de Word/Excel abiertos solo se detectaban con `EBUSY` (Windows también usa `EPERM`). Tipos de documento desconocidos rompían el proceso. | Mensajes claros en ambos casos. |
| Bajo | La ventana podía navegar a otra página si se arrastraba un archivo o enlace. | Bloqueado; la interfaz además corre en `sandbox`. |
| Proceso | No había pruebas en el repositorio: cada versión dependía de pruebas hechas fuera. | `npm test` (revisión estática + 9 pruebas de punta a punta) y ejecución automática en GitHub en cada cambio. |

### Segunda revisión completa (versión 1.15.1)
Se revisó de nuevo todo el código con las funciones de la 1.15: análisis estático estricto de los 51 archivos, una prueba nueva que crea un año completo (dos áreas, cuatro periodos con notas, recuperaciones, asistencia, diario, anotaciones, horario, malla, plan de área, planeación, plan de apoyo, PIAR, prueba, puntos, portafolio) y recorre **todas las pantallas y pestañas** (calificaciones, curricular, gamificación, seguimiento, aula, editores, buscador…), y una medición del arranque.

| Gravedad | Hallazgo | Corrección |
|---|---|---|
| **Alto (seguridad)** | Los identificadores internos (de grupos, áreas, planeaciones…) se escriben dentro de los botones. Un **paquete `.planeador`** recibido de otro docente, o un respaldo manipulado, podía traer un identificador con código que se ejecutaba al hacer clic, con acceso a las funciones del programa (se comprobó con una prueba). | Al cargar datos, restaurar respaldos, consultar años e importar paquetes, todo identificador con caracteres no permitidos se reemplaza. Prueba automática con un paquete malicioso. |
| Medio (seguridad) | El generador de PDF aceptaba una ruta de destino cualquiera desde la interfaz (ninguna pantalla la usaba). | Siempre pregunta dónde guardar. |
| Bajo | En 5 buscadores (planeaciones, tableros, referentes, banco pedagógico, búsqueda general), si se cambiaba de pantalla justo después de escribir, aparecía un error al intentar devolver el cursor a la casilla. | Función segura `reenfocar()`. |
| Bajo | Si la IA cortaba la respuesta por ser demasiado larga, el docente veía "formato no esperado". | Mensaje claro en Claude, OpenAI y Gemini: pedir menos sesiones o secciones. |
| Bajo | Dos caracteres invisibles (marca BOM) escritos literalmente en el código. | Escritos como `\uFEFF`. |
| Proceso | Las pruebas solo corrían en Linux, pero el programa se usa en Windows. | El flujo de pruebas de GitHub corre ahora en Linux **y en Windows**. |

Verificado sin cambios necesarios: el uso de la API de Claude (modelo vigente, respaldo automático ante rechazos, nivel de esfuerzo), el aislamiento de la interfaz, el servidor del celular y de las pruebas por QR, y el arranque (menos de 0,2 s, así que no hace falta cargar los referentes después).

### Riesgos de fondo que siguen abiertos
1. **Todo es global.** Los 41 scripts de la interfaz comparten nombres y escriben código dentro de los botones (`onclick`). La revisión automática vigila los choques de nombres y la limpieza de identificadores cierra el riesgo de seguridad, pero lo ideal sigue siendo migrar poco a poco a módulos y a eventos en lugar de `onclick`.
2. **Un solo archivo por año.** Hoy pesa unos 0,4 MB con un año completo. Cuando pase de unos 5 MB conviene dividirlo por colección o pasar a SQLite.
3. **Los datos del disco no están cifrados.** La clave de acceso impide abrir el programa, pero alguien con acceso a la carpeta de Windows del docente podría leer `datos.json`. Un cifrado real con la clave es posible, pero entonces olvidar la clave y el código de recuperación significa perder los datos.
4. **Instalador sin firma digital.** Windows muestra "Windows protegió su PC". Se resuelve con un certificado de firma de código (el flujo ya está preparado).

## 2. Mejoras a lo que ya existe

### Lo que ya se hizo
- 1.15: celular del docente, clave de acceso, años anteriores, recuperaciones según el SIEE, portafolio docente, nuevo año a elección y corrector de ortografía.
- 1.16: registro de cambios de notas, personalización, configuración por secciones, Mi clase ahora, entregas y nota por lote, frases rápidas, Tu semana, banco de preguntas, material con IA y cámara del celular.

### Celular del docente
- **Calificar con rúbrica** desde el celular (hoy solo notas numéricas).
- Ver el **semáforo de riesgo** y el resumen del estudiante antes de hablar con un acudiente.

### Evaluación
- **Recuperaciones conectadas con los planes de apoyo**: al calificar el plan, que su nota pase a la columna de recuperación, y un informe de recuperaciones para la comisión de evaluación.
- **Exportar con el formato de la plataforma institucional** (columnas configurables y plantillas guardadas) para pegar las notas sin reescribirlas.
- **Análisis por pregunta** en las pruebas tipo Saber: dificultad de cada ítem y qué opción incorrecta eligió la mayoría.

### Años anteriores y nuevo año
- **Comparar cohortes**: promedio de un área por periodo entre años, en una gráfica.
- **Certificado o constancia de notas** de un estudiante de un año anterior.
- Al iniciar el año, **cargar la lista del SIMAT del año nuevo** y emparejar con los estudiantes promovidos (retiros, nuevos, cambios de grupo).

### Planeación
- **Historial de versiones de cada planeación** (volver a una versión anterior).
- **Vista semanal tipo agenda** para arrastrar las sesiones a los días, con horario y festivos.
- **Alerta de huecos**: clases del horario sin planeación en las próximas dos semanas, ejes de la malla sin cubrir cerca del cierre del periodo.
- **Ajustes PIAR dentro de la planeación**: mostrar los ajustes razonables de los estudiantes con PIAR del grupo junto a cada momento de la clase.

### IA
- **Respuesta en vivo y botón cancelar** (hoy se espera sin ver nada hasta que termina).
- **Perfil institucional para la IA**: modelo pedagógico del PEI, énfasis y contexto del municipio, para que las sugerencias no salgan genéricas.
- **Modelo por tarea**: uno económico para observaciones del boletín y uno más capaz para la malla o el plan de área.

### Portafolio y clave
- Portafolio: **adjuntar los archivos de soporte** (que el programa los copie a una carpeta del portafolio) y exportar esa carpeta junto con el Word.
- Clave: opción de **cifrar los datos del disco** con la clave (con advertencia clara sobre el código de recuperación).

### Experiencia de uso
- Atajos de teclado visibles (Ctrl + / con la lista).
- Pantalla **"Hoy"** más completa: la clase que sigue, con un botón que abre en secuencia los momentos de la sesión, el tablero y el temporizador para proyectar.

## 3. Funciones que faltan (por impacto)

1. **Observador del estudiante y convivencia** (Ley 1620 de 2013): situaciones tipo I, II y III, descargos, compromisos, citaciones y actas con firmas, exportables a Word. Ya existe la base: las anotaciones de la 1.15.
2. **Comisión de evaluación y promoción** (Decreto 1290): al cierre del año, por grupo, quién pierde áreas, quién recuperó, y el acta para la comisión.
3. **Dirección de grupo**: consolidado de todas las áreas uniendo los paquetes que exportan los demás docentes del grupo (sin servidor).
4. **Sincronización entre dos computadores** (casa y colegio) por la carpeta de OneDrive o Drive, con detección de conflictos.
5. **Reuniones y atención a acudientes**: agenda de citas, lo tratado, compromisos y recordatorios.
6. **Mapa del aula**: puestos con nombre, rotación y grupos de trabajo guardados.
7. **Biblioteca de recursos sin internet** vinculada a cada sesión.
8. **Exportar calendario y horario** a `.ics` (Google Calendar u Outlook del celular).

## 4. Hoja de ruta sugerida

| Versión | Contenido |
|---|---|
| 1.14 (hecha) | Consolidación: corrección del boletín y los comunicados, recuperación automática, respaldos, rendimiento de tableros, claves cifradas, pruebas automáticas |
| 1.15 (hecha) | Años anteriores, clave de acceso, recuperaciones según el SIEE, celular del docente, portafolio docente, nuevo año a elección, corrector de ortografía |
| 1.15.1 (hecha) | Segunda revisión: protección contra identificadores manipulados en paquetes y respaldos, PDF sin ruta libre, buscadores, avisos de la IA, pruebas en Windows |
| 1.16 (hecha) | Registro de cambios de notas, personalización, configuración por secciones, Mi clase ahora, entregas y nota por lote, frases rápidas, Tu semana, banco de preguntas, material con IA y cámara del celular |
| 1.17 (hecha) | Nombre Tiza, Acerca de con créditos, registro de notas en archivo propio |
| 1.18 | Observador del estudiante y convivencia + comisión de evaluación y promoción |
| 1.19 | Análisis por pregunta + exportar al formato de la plataforma institucional |
| 1.20 | IA en vivo con cancelar, perfil institucional y modelo por tarea |
| 2.0 | Módulos JavaScript sin `onclick`, almacenamiento dividido o SQLite, sincronización entre equipos |
