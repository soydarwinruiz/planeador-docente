# Análisis del Planeador Docente y propuestas (versión 1.14.0)

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

### Riesgos de fondo que conviene atender después
1. **Todo es global.** Los 37 scripts de la interfaz comparten nombres; ya produjo dos errores (`alternarBarraLateral` en la 1.12 y `rellenar` en la 1.13). La revisión automática lo vigila, pero lo ideal es migrar poco a poco a módulos (`import`/`export`) por carpeta.
2. **Un solo archivo para todo un año.** Hoy funciona bien (0,4 MB), pero con varios años y muchos estudiantes crecerá. Cuando pase de unos 5 MB conviene dividirlo por colección o pasar a SQLite.
3. **"Nuevo año lectivo" borra las notas.** Para reclamos (Decreto 1290), certificados o comparar cohortes, el docente necesita consultar años anteriores. Ver propuesta 3.1.
4. **Datos de menores sin clave de acceso.** Cualquiera que use el computador (de la sala de profesores, por ejemplo) ve notas, PIAR y datos de acudientes. La Ley 1581 de 2012 exige cuidado especial con datos de menores. Ver propuesta 3.2.
5. **Carga inicial:** `referentes-datos.js` (494 KB) y `banco-inicial.js` (150 KB) se cargan siempre al abrir, aunque no se usen. Se pueden cargar solo al abrir el selector de referentes o el banco.

## 2. Mejoras a lo que ya existe

### Planeación
- **Historial de versiones de cada planeación** (ver y volver a una versión anterior), no solo papelera para lo borrado.
- **Vista semanal tipo agenda** donde se arrastran las sesiones a los días, con el horario y los festivos ya cruzados.
- **Detección de huecos:** sesiones del horario sin planeación en las próximas 2 semanas, ejes de la malla sin cubrir al acercarse el fin del periodo (ya existe el mapa de cobertura; falta la alerta).
- **Adaptaciones PIAR automáticas en la planeación:** al elegir el grupo, mostrar los ajustes razonables de cada estudiante con PIAR junto a cada momento de la clase.

### Evaluación
- **Recuperaciones y nivelaciones** según el SIEE de cada institución (la nota de recuperación reemplaza, promedia o tiene tope, p. ej. 3,0).
- **Bitácora de cambios de notas** (quién, cuándo, valor anterior): respaldo ante reclamos de acudientes.
- **Exportar con el formato de la plataforma institucional** (columnas configurables y plantillas guardadas) para pegar las notas sin reescribirlas.
- **Análisis por pregunta** en las pruebas tipo Saber: dificultad y discriminación de cada ítem, y qué opción incorrecta eligió la mayoría (diagnóstico de errores frecuentes).
- **Asistencia desde el celular del docente** usando el servidor local que ya existe para las pruebas por QR.

### IA
- **Respuesta en vivo** y botón **cancelar**; hoy se espera hasta 3 minutos sin ver nada.
- **Reintento automático** cuando el modelo devuelve un JSON mal formado.
- **Perfil institucional para la IA:** modelo pedagógico del PEI, énfasis, contexto del municipio, para que las sugerencias no salgan genéricas.
- **Modelo por tarea:** uno económico para observaciones del boletín y uno más capaz para la malla o el plan de área.

### Experiencia de uso
- Atajos de teclado visibles (Ctrl + / con la lista), y navegar con el teclado por las planillas grandes.
- Pantalla de **"Hoy"** más fuerte: la clase que sigue, con un botón que abre en secuencia los momentos de la sesión, el tablero y el temporizador para proyectar.

## 3. Funcionalidades nuevas que más aportarían

Ordenadas por impacto para el docente colombiano:

1. **Archivo de años anteriores** (consulta de solo lectura): en vez de borrar al iniciar el año, archivar grupos, notas, asistencia y observaciones. Permite certificados, reclamos y comparar el rendimiento entre cohortes.
2. **Clave de acceso y cifrado de los datos** (opcional): PIN o contraseña al abrir y bloqueo tras unos minutos sin uso. Protege datos de menores (Ley 1581) en equipos compartidos.
3. **Observador del estudiante y convivencia** (Ley 1620 de 2013 y ruta de atención): anotaciones positivas y por situaciones tipo I, II y III, descargos, compromisos, citaciones a acudientes y actas con firmas, exportables a Word. Es de lo que más tiempo consume a un director de grupo.
4. **Portafolio para la evaluación docente** (Decreto 1278, evaluación anual de desempeño y ECDF): reunir solo las evidencias (planeaciones, diario de campo, tableros, resultados, planes de apoyo) por competencia y exportarlas ordenadas.
5. **Sincronización entre dos computadores** (casa y colegio) por la carpeta de OneDrive/Drive, con detección de conflictos. Hoy solo hay respaldo en un sentido.
6. **Dirección de grupo:** consolidado de todas las áreas del grupo uniendo los paquetes que exportan los demás docentes (sin servidor): ranking, estudiantes en riesgo en varias áreas, insumo para la comisión de evaluación y promoción.
7. **Reuniones y atención a acudientes:** agenda de citas, registro de lo tratado y compromisos, con recordatorio en *Alertas*.
8. **Mapa del aula** (puestos con foto y nombre): rotación de puestos, grupos de trabajo que se guardan y llamado a lista visual.
9. **Biblioteca de recursos sin internet:** archivos, enlaces y videos descargados, vinculados a la sesión y abiertos con un clic desde *Mis clases de hoy*.
10. **Exportar el calendario y el horario** a `.ics` (Google Calendar u Outlook en el celular).

## 4. Hoja de ruta sugerida

| Versión | Contenido |
|---|---|
| 1.14 (hecha) | Consolidación: corrección del boletín y los comunicados, recuperación automática, respaldos, rendimiento de tableros, claves cifradas, pruebas automáticas |
| 1.15 | Archivo de años anteriores + clave de acceso a la app + bitácora de cambios de notas |
| 1.16 | Observador del estudiante y convivencia (Ley 1620) + reuniones con acudientes |
| 1.17 | Recuperaciones según el SIEE + análisis por pregunta + exportar al formato de la plataforma institucional |
| 1.18 | IA en vivo con cancelar, perfil institucional y modelo por tarea |
| 2.0 | Módulos JavaScript en lugar de scripts globales, carga diferida de referentes y almacenamiento dividido o SQLite; sincronización entre equipos |
