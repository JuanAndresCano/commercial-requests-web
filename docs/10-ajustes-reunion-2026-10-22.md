# Ajustes de la reunión del 22 de octubre de 2026

> **Registro histórico de la interpretación parcial del 4 de noviembre.** Los acuerdos y correcciones vigentes están en [13-acuerdos-finales-2026-11-06.md](13-acuerdos-finales-2026-11-06.md).

Implementación preparada el 4 de noviembre a partir del **resumen que Tomás compartió en el chat**. No se recibió la transcripción ni el resumen completo R1–R6 de Diana; se trabajó únicamente con los requisitos explícitos y las reglas ya documentadas.

## Alcance implementado

| Referencia recibida | Comportamiento de revisión |
|---|---|
| R1 | La etapa de propuestas enviadas al cliente se presentaba como **Presentación de propuesta**, tanto para KAM como para Líder. La confirmación aclara que el cliente puede pedir ajustes. *Vigente hoy:* la interfaz rotula la etapa **«Entregada»**; «Presentación de propuesta» solo queda como texto del chip de etiqueta cuando quien lo ve no puede editarla y la propuesta no tiene etiqueta. |
| R2, parte explícita | Una devolución del cliente se indica como **Sustentación y ajustes**, conservando observaciones, historial y la logística de costeo/envío al KAM. El indicador persiste mientras se prepara o reenvía el ajuste al KAM y desaparece al presentarlo de nuevo. |
| R4, reglas existentes | No se puede omitir un paso obligatorio del asistente. El servidor también exige los campos ya obligatorios del formulario y rechaza textos vacíos o solo espacios. Contacto y nodo conservan su carácter opcional. Ver `12-campos-obligatorios-r4.md`. *Vigente hoy:* se exige además un teléfono o correo válido y la naturaleza jurídica pasó a opcional (`13`). |
| R7 | El tablero KAM muestra el valor de sus propuestas actualmente presentadas al cliente, calculado con precisión decimal en el servidor y sin depender de los filtros de la tabla. Ver la documentación específica R7. |

Los códigos de estado del API no cambian: `DELIVERED` corresponde a presentación, no a aprobación o compra; la devolución sigue siendo `IN_COSTING` con la observación de la ronda correspondiente. No se requiere migración para estas etiquetas.

## Ciclo que debe conservarse

1. El Líder prepara el costeo y confirma **Enviar a KAM**.
2. El KAM confirma el envío al cliente: etapa **Entregada** (entonces llamada «Presentación de propuesta»).
3. Si el cliente pide cambios, el KAM registra la observación: **Sustentación y ajustes** (cada iteración: «Sustentación y ajuste 1», «2», …). Se cierra la compuerta anterior; no se permite enviar el mismo costeo sin nueva confirmación del Líder.
4. El Líder ajusta y confirma otra ronda; la etapa logística **Enviada al KAM** puede coexistir con el indicador de ajustes.
5. El KAM presenta nuevamente al cliente (etapa «Entregada») y se limpia el indicador activo; las observaciones y los valores de rondas anteriores permanecen en el historial.

El cambio de nombre no confirma una aceptación del cliente. **El catálogo de etiquetas R2 completo y el evento de aprobación no se recibieron**: no se inventó un mecanismo de aprobación ni se añadió una HU sin sus criterios.

## Límites del material recibido

- **R3, R5 y R6:** sin descripción disponible. Pendientes de recibir el resumen de Diana; no se marcan como terminados.
- **R2:** se implementó la etiqueta explícita de sustentación/ajustes; cualquier otra etiqueta del acuerdo de Diana sigue pendiente de especificación.
- **R4:** si el nuevo acuerdo exige más campos que los ya obligatorios, falta su lista exacta. No se hizo obligatorio todo el formulario: eso contradiría las decisiones vigentes sobre contacto y nodo.
- **R7 y Juan David:** se inspeccionaron sus commits `9004df1` y `db1c9e3` de `origin/feat/admin-analytics-dashboard`. Ya contienen la idea de la tarjeta monetaria. Se reutilizó ese alcance sin traer el dashboard admin completo. No se contactó a Juan David en esta sesión.

## Trabajo futuro indicado por Lina

- Formularios distintos por tipo de requerimiento y por nodo, después de validar las preguntas con los líderes.
- Más detalle de formación previa y cohortes, todavía sin un pedido concreto.
- Consolidado de todos los vendedores: corresponde a la fase del dashboard admin, que sigue en su rama independiente.
- Continuidad del PDG, hosting y adopción: contexto del proyecto, no nuevas historias de esta entrega.

Para revisar la ejecución, usa el informe de revisión que está en la carpeta principal `Repositorio` y los resultados de pruebas adjuntos allí. La Definition of Done completa aún incluye revisión humana y PR: los cambios de esta sesión se dejan sin commits para que Tomás los revise.
