# Planeador Docente

Aplicación de escritorio para Windows para planear clases de **básica secundaria en Colombia**.
Funciona **sin internet**: todos los datos quedan guardados en tu computador.

## Cómo abrirla

- **Versión portable** (`PlaneadorDocente-portable-1.0.0.exe`): haz doble clic y listo. No necesita instalación.
  Puedes llevarla en una memoria USB.
- La primera vez, Windows puede mostrar *"Windows protegió su PC"* (el programa no tiene firma digital comercial).
  Haz clic en **Más información → Ejecutar de todas formas**.

Tus datos se guardan en `%APPDATA%\Planeador Docente\datos.json` (los puedes ver desde Configuración → *Abrir carpeta de datos*).

## Primeros pasos

1. **Configuración**: escribe la institución, el docente y el año lectivo. Revisa las fechas y porcentajes de los periodos,
   la escala (1.0 a 5.0) y los rangos de desempeño (Bajo, Básico, Alto, Superior).
2. **Grupos y alumnos**: crea tus áreas (hay un botón para agregar las áreas obligatorias), luego tus grupos (601, 702…)
   indicando qué áreas dictas en cada uno. Pega la lista de estudiantes desde Excel o el SIMAT y marca quiénes tienen PIAR.
3. **Calendario**: agrega los festivos de Colombia con un clic y los eventos institucionales.
4. **Planeaciones**: crea planeaciones por sesión, semanales o por secuencia didáctica, con estándares, DBA, competencias,
   desempeños (saber, hacer, ser), momentos de la clase (exploración, estructuración, práctica, valoración), recursos,
   evaluación, evidencias y ajustes razonables. Expórtalas a **Word** con un clic.

## Módulos

| Módulo | Qué hace |
|---|---|
| Planeaciones | Crear, buscar, filtrar, duplicar y exportar a Word |
| Banco de planeaciones | Reutilizar planeaciones en otro grupo o en el siguiente año (las fechas se ajustan solas) |
| Calendario | Vista mensual con clases planeadas, periodos, festivos y eventos |
| Cronograma | Temas previstos semana a semana por área, grado y periodo |
| Grupos y alumnos | Áreas, grupos, intensidad horaria, listas, PIAR, retiros y traslados |
| Asistencia | Presente / ausente / tarde / excusa por clase, con resumen y % de asistencia |
| Calificaciones | Criterios con porcentaje, actividades, rúbricas, nota del periodo, desempeño y consolidado anual |
| Configuración | Datos institucionales, SIEE, periodos, IA, respaldos y cambio de año lectivo |

Las listas, la asistencia, las planillas y el cronograma se pueden **exportar a Excel** (formato CSV).

## Respaldos

- **Automático**: cada vez que abres la aplicación se guarda una copia (se conservan las últimas 15).
- **Manual**: Configuración → *Crear respaldo…* y guárdalo en una USB o en OneDrive/Google Drive.
  Para pasar tus datos a otro computador, usa *Restaurar desde archivo…*.

## Sugerencias con IA (opcional)

En el editor de una planeación, el botón **✨ Sugerir con IA** genera un borrador de los campos vacíos
(desempeños, momentos de la clase, evaluación, ajustes, etc.) usando Claude, de Anthropic.
Requiere internet y una clave de API de console.anthropic.com (tiene costo según el uso), que se pega en Configuración.
Se envían el tema, el área, el grado y lo escrito en la planeación; **no se envían nombres de estudiantes**.

## Para desarrolladores

```bash
npm install
npm start              # abrir en modo desarrollo
npm run dist:portable  # generar el .exe portable
npm run dist:win       # instalador + portable (ejecutar en Windows)
```

El flujo `.github/workflows/compilar-windows.yml` genera el instalador en GitHub Actions.
