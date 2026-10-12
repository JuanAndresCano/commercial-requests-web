# Decisiones pendientes del equipo (gobernanza del repositorio)

Bitácora de decisiones que no son de negocio ni de UX, sino sobre cómo se gestiona este repositorio como proyecto de grado. Cada entrada debe resolverse en conjunto entre **Tomás Quintero** y **Juan Andrés Cano** antes de ejecutarse, porque implican al historial o al flujo compartido.

## 1. PENDIENTE — Bot "Lovable" / `gpt-engineer-app[bot]` aparece como contribuidor en GitHub

**Contexto:** el prototipo arrancó como un MVP construido por el equipo de diseño con Lovable (herramienta no-code/IA), que generó los primeros commits del repositorio bajo los autores `Lovable <noreply@lovable.dev>` y `gpt-engineer-app[bot]`. Como GitHub calcula la lista de "Contributors" a partir de la autoría de los commits en la rama por defecto, ese bot queda listado junto a los autores humanos del proyecto.

**Por qué importa:** este es nuestro proyecto de grado. Que en un repositorio de ingeniería aparezca un bot de una herramienta no-code como "contribuidor" puede dar una impresión equivocada sobre quién hizo el trabajo de ingeniería real, frente a quien evalúe o revise el repositorio.

**Opciones evaluadas:**
- **A. Dejarlo tal cual.** Riesgo técnico nulo. Refleja honestamente que el proyecto partió de un scaffold generado con IA, algo cada vez más común y no necesariamente negativo — el trabajo de ingeniería posterior (modelado de datos, lógica de negocio, flujos, roles) es 100% de Tomás y Juan Andrés y es claramente identificable por fecha/volumen de commits.
- **B. Reescribir el historial** (`git filter-repo` o rebase interactivo) para reasignar la autoría de esos commits iniciales. Esto:
  - Cambia el hash de **todos** los commits posteriores a los reescritos (es decir, prácticamente toda la historia de `main` y `develop`).
  - Requiere `force-push` a `main` y `develop`.
  - Obliga a **todo colaborador con clon local (incluyendo Juan Andrés) a re-clonar el repositorio** o resetear duro su copia — cualquier trabajo local no sincronizado en ese momento se puede perder si no se coordina bien.

**Estado:** sin decidir. Requiere alinear con Juan Andrés Cano si el costo/riesgo de la opción B se justifica para un repositorio de proyecto de grado, o si la opción A es aceptable dejando esto documentado como decisión consciente.

**Responsables:** Tomás Quintero (levantó el tema) + Juan Andrés Cano (dueño original del repositorio, colaborador afectado por cualquier reescritura de historial).
