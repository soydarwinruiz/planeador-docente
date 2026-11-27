# Análisis de funcionalidad y compatibilidad – Tiza 2.2

*27 de noviembre de 2026 · versión analizada: 2.2.0 (con las correcciones de la 2.2.1)*

## 1. Resumen

Tiza funciona completo y sin conexión en **Windows 10 y 11 de 64 bits**. Las funciones principales están cubiertas por pruebas automáticas que se ejecutan en Windows y Linux antes de cada publicación:

- 48 pruebas de punta a punta;
- un robot que recorre todas las pantallas;
- una prueba que abre el programa ya instalado.

Este análisis encontró cuatro problemas de compatibilidad, corregidos en la 2.2.1:

1. Las páginas del celular quedaban en blanco en teléfonos con navegadores anteriores a 2020.
2. La ventana quedaba cortada en portátiles pequeñas con el escalado de Windows al 125 %.
3. La IA no funcionaba en redes con proxy, como las de muchos colegios.
4. No se probaba con carpetas de usuario con tildes o ñ.

Hay dos limitaciones importantes que siguen abiertas; se proponen en la sección 6:

- No hay versión para **Windows de 32 bits**.
- El instalador **no está firmado digitalmente**, así que Windows muestra un aviso al instalar.

## 2. Compatibilidad

### 2.1 Computador

| Aspecto | Estado | Detalle |
|---|---|---|
| Windows 11 / 10 de 64 bits | ✅ Compatible | Plataforma principal; probada en cada versión (GitHub, Windows Server reciente) |
| Windows 10 de 32 bits | ❌ No compatible | Solo se compila para x64. Ver recomendación 6.1 |
| Windows 7, 8 y 8.1 | ❌ No compatible | Electron 45 (el motor del programa) exige Windows 10 o superior |
| Windows en ARM (Snapdragon) | ⚠️ Funciona emulado | Windows 11 ejecuta la versión x64 mediante emulación; más lento |
| macOS | ❌ No se publica | El código no tiene nada exclusivo de Windows salvo el cifrado DPAPI; podría compilarse |
| Linux | ⚠️ Funciona, no se publica | Todas las pruebas corren en Linux, pero no se distribuye instalador |
| Pantalla | ✅ Desde 1024×640 (2.2.1: se adapta a pantallas menores) | En pantallas pequeñas o con escalado alto la ventana se ajusta y se abre maximizada |
| Memoria | ✅ 4 GB o más | Como cualquier programa hecho con Electron; con 2 GB funciona, pero lento |
| Sin internet | ✅ Funciona completo | Solo requieren internet la IA en la nube, las actualizaciones y los respaldos en OneDrive o Drive (que sincroniza Windows) |
| Usuario de Windows con tildes, ñ o espacios | ✅ Probado (2.2.1) | Las pruebas usan una carpeta como `Tiza prueba José Muñoz` |
| Antivirus / SmartScreen | ⚠️ Aviso al instalar | El instalador no está firmado: Windows muestra "Windows protegió tu PC" → *Más información → Ejecutar de todas formas* |
| Acceso controlado a carpetas (Windows Defender) | ⚠️ Puede bloquear exportaciones | Si bloquea guardar en Documentos, el programa muestra "no se tiene permiso"; los datos están en AppData y no se afectan |
| OneDrive / antivirus bloqueando archivos un instante | ✅ Tolerado | Escritura con reintentos; si un guardado falla, se reintenta solo |

### 2.2 Instalador, portable y actualizaciones

| Modo | Actualización | Observaciones |
|---|---|---|
| Instalador (`Tiza-Setup-X.exe`) | Automática: se descarga y se aplica al cerrar | Permite elegir carpeta; crea acceso directo |
| Portable (`Tiza-portable-X.exe`) | Aviso con enlace de descarga | Útil en equipos sin permisos de administrador; los datos van al mismo lugar que con el instalador |
| Versiones beta (`X-beta.N`) | Solo llegan a quien ya tiene una beta | Quien tiene una versión normal nunca recibe una beta |
| Detrás de un proxy | ✅ Instalador; ✅ portable (2.2.1) | La búsqueda de la versión portable ahora usa la red de Windows |

### 2.3 Datos y versiones anteriores

| Caso | Estado |
|---|---|
| Pasar de 1.x a 2.x (con o sin clave) | ✅ Migración automática; la 1.x queda guardada en `antes-de-2.0` |
| Volver a la 1.x y regresar a la 2.x | ✅ Se toma lo hecho en la 1.x; si la 1.x estaba vacía, no reemplaza nada |
| Respaldo manual (.json) entre computadores | ✅ Lleva todo: datos, imágenes de tableros, años archivados y registro de notas (sin claves de IA) |
| Respaldos automáticos (.db) en otro computador | ❌ No sirven | Están cifrados con la llave de *este* usuario de Windows: para cambiar de equipo se usa el respaldo manual o el de la carpeta en la nube |
| Reinstalar Windows o cambiar de usuario | ⚠️ Igual que el caso anterior | La llave queda ligada al usuario de Windows (DPAPI). Con la clave de acceso activa, la llave se abre con la clave en cualquier equipo |
| Archivo de datos dañado (apagón) | ✅ Se recupera solo desde el último respaldo automático |
| Llave o archivo de clave dañados | ✅ Hay copia de la llave; la clave se sigue pidiendo aunque falte `acceso.json` |

### 2.4 Celular del docente y de los estudiantes

Funcionan en el navegador del celular, sin instalar nada, conectados a la **misma red** que el computador (WiFi o el punto de acceso del celular).

| Aspecto | Estado |
|---|---|
| Android con Chrome, Samsung Internet o Firefox | ✅ Desde navegadores de 2019 (2.2.1); antes exigía navegadores de 2020 o más nuevos |
| iPhone | ✅ Desde iOS 13 (2.2.1) |
| Cámara (hojas de respuesta, fotos de trabajos) | ✅ Usa el selector de fotos del celular, que funciona sin HTTPS |
| Sin señal por momentos | ✅ El celular del docente guarda en cola y envía al reconectarse |
| Redes del colegio que aíslan a los equipos | ⚠️ El celular no ve el computador: usar el punto de acceso del celular (el programa lo explica) |
| Firewall de Windows | ⚠️ La primera vez Windows pregunta si permite la red: hay que aceptar en "Redes privadas" |

### 2.5 Documentos que genera

| Formato | Abre en |
|---|---|
| Word (.docx) | Word 2007 o posterior, Word en línea, LibreOffice, Google Docs, WPS |
| Excel (.xlsx) | Excel 2007 o posterior, LibreOffice, Google Sheets |
| CSV | Excel (con tildes correctas: incluye marca UTF-8) |
| PDF (fichas, hojas de respuesta) | Cualquier lector de PDF |
| Fuente | Arial: disponible en Windows, Mac y la mayoría de equipos |

### 2.6 Inteligencia artificial (opcional)

| Proveedor | Requisito | Observaciones |
|---|---|---|
| Gemini (Google) | Clave gratuita de aistudio.google.com | Modelo por defecto `gemini-flash-latest`; si Google retira o satura un modelo se elige otro solo |
| Claude (Anthropic) | Clave de pago | Reintentos y respaldo automático de modelo del propio servicio |
| ChatGPT (OpenAI) | Clave de pago | — |
| Compatibles (DeepSeek, Groq, OpenRouter) | Clave del servicio | — |
| **IA local integrada (2.3)** | Windows 10/11 de 64 bits, 8 GB de RAM (16 GB para el modelo mayor), 3–6 GB de disco | Un clic: descarga verificada del motor llama.cpp y de Qwen3; sin internet después; también desde USB |
| Local con Ollama o LM Studio | Computador con 8–16 GB de RAM | Gratis y sin internet; más lenta. Botón *Usar Ollama en este equipo* |
| Red con proxy | ✅ (2.2.1) | La IA sale por la red de Windows y respeta el proxy |
| Dictado por voz | Clave de OpenAI o Gemini | Alternativa gratuita: Windows + H |

## 3. Funcionalidad

Estado de cada módulo y cómo está verificado. *Prueba* = verificado por una prueba automática específica. *Robot* = la pantalla se abre y se usa sin errores con datos de un año completo, y se generan sus documentos.

| Módulo | Estado | Verificación |
|---|---|---|
| Planeación curricular (plan de área, malla, plan de periodo, plan de aula, cobertura) | ✅ | Prueba + robot; malla con campos propios, IA y Word |
| Planeaciones de clase (sesiones, momentos, diversidad, plantillas, banco, copias vinculadas) | ✅ | Prueba + robot; contexto del aula para la IA |
| Evaluación y notas (planillas, recuperaciones SIEE, desempeños, registro de cambios, nota por lote, importar de Excel) | ✅ | Pruebas específicas de cálculo, recuperaciones, registro y restauración |
| Asistencia | ✅ | Prueba (guardado por día en la base de datos y reapertura idéntica) |
| Pruebas y talleres (QR en celulares, hoja de respuestas con cámara, banco de preguntas) | ✅ | Pruebas de calificación por foto, banco y armado |
| Celular del docente | ✅ | Pruebas: vincular con PIN, asistencia, notas, anotaciones, puntos, entregas, fotos, vencimiento |
| Grupos, alumnos, PIAR, seguimiento | ✅ | Robot + pruebas de papelera y PIAR en Word |
| Boletín y comunicados a padres (WhatsApp) | ✅ | Prueba de plantillas y de varios teléfonos |
| Herramientas de aula, gamificación, tableros, fichas | ✅ | Robot + prueba de imágenes de tableros |
| Calendario, horario, cronograma, Mi clase ahora, Tu semana | ✅ | Robot + prueba de Mi clase y resumen semanal |
| Diario de campo, portafolio docente, informe de cierre | ✅ | Robot + prueba del portafolio en Word |
| Años anteriores y nuevo año lectivo | ✅ | Pruebas: archivar, consultar sin modificar, elegir qué conservar |
| Respaldos (manual, automáticos, carpeta en la nube) y recuperación | ✅ | Pruebas de cada tipo, de daño del archivo y de la llave |
| Clave de acceso y cifrado | ✅ | Pruebas: bloqueo, recuperación con código, archivos de clave dañados |
| Seguridad ante archivos malintencionados | ✅ | Prueba: código malicioso en todos los textos de un año completo y en identificadores de paquetes |
| IA en todos los módulos | ✅ | Pruebas con una IA simulada (contexto enviado, reintentos, cambio de modelo); sin pruebas contra los servicios reales |

### Rendimiento

- Guardar un año completo: unos 35 ms, porque solo se escriben las filas que cambiaron. Si nada cambió, no se escribe.
- Abrir el programa con un año completo: menos de 3 segundos en las pruebas.
- La base de datos de un año con registro de notas extenso ocupa unos 12 MB. Los respaldos automáticos conservan 15 recientes y 30 diarios.

## 4. Correcciones hechas en este análisis (2.2.1)

1. **Celulares antiguos.** Las páginas del celular del docente y de los estudiantes usaban sintaxis de 2020 (`?.`, `??`, `||=`). En navegadores anteriores la página entera no cargaba. Se reescribió, y una revisión automática nueva impide que vuelva a pasar: compila esas páginas como si fueran un navegador de 2019.
2. **Pantallas pequeñas y escalado de Windows.** La ventana exigía 1024×640. En una portátil de 1366×768 al 125 % solo hay unos 1090×570 útiles, y la parte de abajo quedaba fuera de la pantalla. Ahora el tamaño se ajusta a la pantalla y, si es pequeña, se abre maximizada.
3. **Proxy del colegio.** La IA y la búsqueda de actualizaciones de la versión portable usaban la conexión de Node, que ignora el proxy de Windows. Ahora usan la red de Windows/Chromium.
4. **Carpetas con tildes y ñ.** Todas las pruebas corren ahora en una carpeta como `Tiza prueba José Muñoz…`. Así GitHub verifica en Windows que la base de datos, los respaldos y las exportaciones funcionan con esos nombres.

## 5. Limitaciones conocidas

- **Un computador, un docente.** No hay sincronización entre equipos. Para llevar los datos a otro computador se usa el respaldo manual o la carpeta en la nube.
- **Respaldos automáticos ligados al usuario de Windows.** Sin la clave de acceso, no se pueden abrir en otro equipo ni después de reinstalar Windows. Conviene tener activado el respaldo en la carpeta de la nube.
- **Celular y computador en la misma red.** No hay acceso desde fuera del colegio, por diseño: los datos no salen del computador.
- **IA verificada con simulaciones.** Los servicios reales cambian sus modelos; por eso el programa elige otro modelo solo cuando el de Gemini se retira.
- **Arquitectura interna.** Son 50 archivos de interfaz que comparten un mismo espacio y usan `onclick` en el HTML. Está controlado por la revisión de nombres y la de XSS, pero dificulta crecer. Por la misma razón, la política de seguridad permite scripts en línea (`unsafe-inline`).

## 6. Recomendaciones

| # | Recomendación | Beneficio | Esfuerzo |
|---|---|---|---|
| 6.1 | **Versión para Windows de 32 bits** (instalador aparte, para no duplicar el tamaño de la descarga normal) | Equipos viejos de colegios con Windows 10 de 32 bits | Bajo: es otra salida de la compilación; hay que verificar la base de datos en 32 bits |
| 6.2 | **Firmar el instalador** con un certificado de firma de código | Quita el aviso "Windows protegió tu PC" y las alertas de antivirus | Medio: el certificado tiene costo anual |
| 6.3 | **Regla del firewall en el instalador** para la red privada | El celular conecta a la primera, sin la pregunta de Windows | Bajo |
| 6.4 | **Recordatorio de respaldo fuera del equipo** si no hay carpeta en la nube ni respaldo manual en 30 días | Protege ante robo, daño del disco o reinstalación de Windows | Bajo |
| 6.5 | Versión para **macOS** | Docentes con Mac | Medio: cambia el cifrado de la llave (Llavero de macOS) y requiere firma de Apple |
| 6.6 | Pasar la interfaz a **módulos sin `onclick`** de forma gradual | Mantenimiento más seguro y política de seguridad más estricta | Alto |
