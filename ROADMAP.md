# ROADMAP — Portal de Talentos y Aprendizaje

> **Estado: v0.1.0 publicado.** Este documento describe las direcciones futuras.
> Las capacidades aquí descritas **aún no están implementadas** y se publican
> como guía de planificación. Ninguna de ellas está disponible en v0.1.0.

Esta hoja de ruta organiza el desarrollo posterior del proyecto en líneas de
trabajo priorizadas. La prioridad se indica con `P0` (muy alta), `P1` (alta),
`P2` (media) y `P3` (futura).

---

## 1. Ampliación de la batería de evaluaciones `P1`

- Añadir nuevas evaluaciones además de **aptitudes** (25 ítems) y **VAK** (10 ítems).
- Evaluaciones de intereses profesionales (por ejemplo, inventarios de intereses
  basados en modelos como RIASEC).
- Evaluaciones de hábitos de estudio y estrategias metacognitivas.
- Evaluaciones de valores y motivaciones.
- Cada nueva evaluación debe pasar un proceso de **revisión pedagógica** y pruebas
  de usabilidad con jóvenes.

## 2. Formato reutilizable de preguntas y puntuaciones `P1`

- Consolidar un **esquema declarativo único** (`TestQuestion`, `TestOption`) que
  ya usan las evaluaciones actuales, y generalizarlo a un formato de definición
  portable y versionado.
- Separar **contenido** (banco de ítems) de **motor** (`scoreTest`) para que el
  contenido pueda evolucionar sin tocar el código.
- Definir reglas de **puntuación configurables** (agregación, empates, dimensiones
  secundarias) en el propio formato.
- Documentar el esquema para que la comunidad pueda aportar evaluaciones.

## 3. Constructor visual de evaluaciones `P2`

- Interfaz de administrador para **crear/editar evaluaciones** sin escribir código.
- Editor de ítems (enunciado, opciones, claves de perfil), reordenamiento y
  control de versiones.
- **Vista previa en vivo** y herramientas de validación de estructura.
- Borradores con guardado incremental y estado "borrador/publicado".

## 4. Gestión de organizaciones y participantes `P2`

- Soporte de **organizaciones/escuelas** que agrupen participantes.
- Administración de cohortes, grupos y sesiones.
- Atribución de evaluaciones a grupos y seguimiento de completitud.
- Roles dentro de una organización (responsable, orientador, participante),
  siempre respetando el modelo de **mínimo privilegio** basado en claims.

## 5. Informes y estadísticas `P2`

- Informes consolidados por organización/grupo con **agregados anónimos**.
- Visualizaciones de distribución de perfiles y estilos de aprendizaje.
- Exportación de informes en varios formatos.
- La estadística debe operar sobre **datos anonimizados/agregados** para proteger
  la privacidad de los menores.

## 6. Biblioteca comunitaria de evaluaciones `P3`

- Repositorio de evaluaciones contribuidas por la comunidad.
- Mecanismo de **importación/exportación** de definiciones de evaluaciones.
- Revisión, calificación y etiquetado comunitario.
- Garantías de calidad y de privacidad para el contenido aportado.

## 7. Funciones opcionales de IA `P3`

- **Asistencia (no diagnóstico):** resúmenes conversacionales de los resultados
  como **apoyo exploratorio**, nunca como dictamen clínico o vocacional.
- Generación de sugerencias de actividades/carreras a partir de los perfiles.
- **Guardarraíles estrictos:** límite de edad, lenguaje accesible y advertencias
  de que la IA no reemplaza la evaluación profesional.
- Opcional y desactivable por el administrador; sin envío de datos a terceros
  sin consentimiento.

## 8. Privacidad, accesibilidad y validación de instrumentos `P0` (continuo)

- **Privacidad:** cumplimiento de normativa de protección de menores (COPPA,
  RGPD); minimización de datos, cifrado, retención limitada y consentimiento
  parental. Auditorías periódicas de las reglas de Firestore.
- **Accesibilidad:** contraste, navegación por teclado, lectores de pantalla y
  lenguaje claro; pruebas con usuarios reales.
- **Validación de instrumentos:** mantener el cuestionario VAK y otros como
  **herramienta exploratoria** (no diagnóstica); documentar claramente sus límites.

---

## Prioridades de corto plazo (siguiente versión)

1. Esquema reutilizable de evaluaciones y separación contenido/motor (sección 2).
2. Ampliación de batería con una evaluación adicional piloteada (sección 1).
3. Informes agregados anónimos (sección 5).
4. Endurecer privacidad y accesibilidad (sección 8).

## Decisiones de no-hacer (por ahora)

- **No** añadir autenticación de participantes individuales con clasificación
  interna sensible; se preserva el modelo de datos mínimos.
- **No** incorporar IA como herramienta diagnóstica; solo apoyo exploratorio
  opcional y claramente delimitado.
- **No** incluir encuestas con datos biométricos ni vinculación innecesaria a
  identidades personales.