# Registro de cambios UX

Cada fila liga un cambio con el hallazgo de `14-spec-mejoras-ux.md` que atiende.

| Fecha      | Pantalla                          | Cambio                                                                                                                                      | Hallazgo |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 2026-11-06 | Evaluación                        | Evaluación heurística y spec creadas.                                                                                                       | H1–H12   |
| 2026-11-06 | Nueva solicitud, paso 5           | El resumen ahora incluye título, urgencia, formación previa, canal de contacto y adjuntos, agrupado por bloque con «Modificar» por paso.     | H1       |
| 2026-11-06 | Detalle, enviar a cliente         | El diálogo de confirmación muestra empresa, propuesta, valor ofrecido y canal de contacto.                                                  | H2       |
| 2026-11-06 | Detalle, enviar a cliente         | El motivo por el que el botón está deshabilitado es texto visible y está asociado al botón (`aria-describedby`); se conserva el `title`.    | H3       |
| 2026-11-06 | Detalle, información completa     | `window.confirm` se reemplaza por un diálogo del sistema con «Seguir editando» y «Descartar cambios».                                       | H4       |
| 2026-11-06 | Nueva solicitud, teléfonos        | `type="tel"`, `inputMode="tel"` y `autoComplete="off"` en los cuatro campos de teléfono. Login: `autoComplete` de usuario y contraseña.     | H5       |
| 2026-11-06 | Nueva solicitud, encabezado       | El icono de salir tiene nombre accesible y zona táctil de 44 px. Se quitó un hex en esa línea.                                              | H6       |
| 2026-11-06 | Nueva solicitud, pie              | «Borrador guardado a las HH:MM» solo aparece después de un guardado real (antes decía siempre «Guardado automático»).                      | H7       |
| 2026-11-06 | Contenido y diálogos              | En dispositivos táctiles (`pointer: coarse`) los botones de `main` y de los diálogos miden al menos 44 px. Escritorio no cambia.            | H8       |
| 2026-11-06 | AppShell y Nueva solicitud        | Banner «Sin conexión» mientras el navegador no tenga red.                                                                                   | H9       |
| 2026-11-06 | Detalle, asistente, costeo, diálogos | Texto de 10–11 px sube a 12 px en 97 sitios (etiquetas, ayudas, errores, enlaces, pestañas). Insignias y tarjetas Kanban no cambian. | H12 |
| 2026-11-06 | Detalle, costeo | «Guardando…» / «Guardado a las HH:MM» junto al título del módulo. | H13 |
| 2026-11-06 | Nueva solicitud, paso 5 | El botón de quitar adjunto tiene nombre accesible. | H14 |
| 2026-11-06 | Tablero KAM | Las tarjetas KPI exponen `aria-pressed`. | H15 |
| 2026-11-06 | Tablero KAM y detalle | Los avisos de carga usan `role="status"`. | H16 |

Pendientes de decisión (no implementados): H10 (¿Olvidaste tu contraseña?), H17 (motivo de reasignación preseleccionado), H18 (grises de ayuda). H11 está descartado: la paleta institucional no se modifica.
