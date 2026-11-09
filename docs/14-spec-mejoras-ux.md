# Spec — Mejoras UX/UI según la guía de heurísticas (6 de noviembre de 2026)

Alcance: aplicar a `commercial-requests-web` la guía de UX/UI (Nielsen, Norman, Krug) sin tocar reglas de negocio, marca ni textos de negocio. Se hizo sin sesión de grilling: lo que sigue sale de leer el código, no de entrevistar a nadie. Las suposiciones están marcadas para que Tomás las corrija.

## 1. Contexto del producto (suposiciones a confirmar)

- **Producto:** sistema web de solicitudes comerciales de la Dirección de Extensión y Consultoría de Icesi.
- **Objetivo de negocio:** que ninguna solicitud se pierda ni se envíe mal, y que el KAM y el Líder de Producto trabajen sin recurrir al correo.
- **Usuarios:** KAM (registra, entrega al cliente, devuelve) y Líder de Producto (asigna docente, costea, "Enviar a KAM"). Escritorio principal, móvil ocasional. _Suposición._
- **Flujos críticos (suposición):** 1) registrar una solicitud (wizard de 5 pasos), 2) "Enviar a KAM" y entregar al cliente, 3) devolver con «Sustentación y ajustes».
- **Restricciones:** marca Icesi (hex en `06-patrones-ui-y-marca.md`), español, datos de clientes.

## 2. Evaluación heurística

Severidad de Nielsen (0 a 4), decidida por frecuencia, impacto y persistencia.

| # | Pantalla | Problema observado | Principio (autor) | Impacto | Sev. | Recomendación | Esfuerzo |
|---|---|---|---|---|---|---|---|
| H1 | Nueva solicitud, paso 5 | El resumen previo al envío no muestra el título de la propuesta, la urgencia, el canal de contacto ni los adjuntos, y no ofrece «Modificar» por bloque. | Prevención de errores y reconocer antes que recordar (Nielsen 5, 6) | El KAM envía al Líder sin revisar lo que más importa; corregir implica navegar a ciegas por el stepper. | 3 | Completar el resumen y añadir «Modificar» que lleva al paso correspondiente. | M |
| H2 | Detalle, «Enviar a cliente» | El diálogo de confirmación no repite empresa, título ni valor que se remite. | Prevención de errores (Nielsen 5), Norman (deslices) | Es el punto sin retorno comercial; un clic sobre la propuesta equivocada o con valor distinto no se detecta. | 3 | Mostrar empresa, título, valor ofrecido y canal de contacto dentro del diálogo. | S |
| H3 | Detalle, botón «Enviar a cliente» deshabilitado | Dos de los tres motivos de bloqueo solo aparecen en `title`, invisible en táctil y para teclado. | Visibilidad del estado (Nielsen 1), Krug | El KAM ve un botón muerto y no sabe qué falta. | 3 | Mostrar siempre el motivo como texto visible junto al botón. | S |
| H4 | Detalle, edición de información completa | Usa `window.confirm` nativo al descartar cambios. | Consistencia (Nielsen 4), control y libertad (3) | Diálogo con otro estilo, sin marca, que rompe el patrón de todos los demás. | 2 | Reemplazar por el `Dialog` del sistema con «Seguir editando» y «Descartar cambios». | S |
| H5 | Nueva solicitud, teléfonos | Los campos de teléfono no declaran `type="tel"` ni `autoComplete`. | Prevención de errores (Nielsen 5), checklist de formularios | En móvil aparece el teclado de texto completo. | 2 | `type="tel"` e `inputMode="tel"` en teléfonos; `autoComplete` en login. | S |
| H6 | Nueva solicitud, encabezado | El icono «X» para salir no tiene nombre accesible y mide unos 28 px. | Accesibilidad, Norman (affordance) | Lectores de pantalla no lo anuncian; difícil de tocar. | 2 | `aria-label="Salir del registro"` y zona táctil mayor. | S |
| H7 | Nueva solicitud, pie | «Guardado automático en segundo plano» aparece siempre, haya o no algo guardado. | Visibilidad del estado (Nielsen 1) | Promete algo que puede no ser cierto (almacenamiento bloqueado, formulario vacío). | 2 | Mostrar «Borrador guardado a las HH:MM» solo después de guardar de verdad. | S |
| H8 | Toda la app | Botones de 28 a 36 px de alto (`h-7`, `h-8`, `h-9`) frente a los 44 px de la guía. | Accesibilidad (WCAG, Norman) | Errores de toque en tableta y móvil. | 2 | En dispositivos táctiles (`pointer: coarse`) subir el alto mínimo a 44 px; escritorio conserva su densidad. | S |
| H9 | Toda la app | Sin aviso de pérdida de conexión. | Visibilidad del estado (Nielsen 1), checklist de estados | Los fallos de red solo se ven como toasts de error genéricos. | 2 | Banner global «Sin conexión» mientras `navigator.onLine` sea falso. | S |
| H10 | Login | El botón «¿Olvidaste tu contraseña?» no hace nada. | Affordances (Norman), Ayuda (Nielsen 10) | Un control que parece funcionar y no responde. | 2 | **Pendiente de decisión:** ¿hay un enlace institucional de recuperación? | S |
| H11 | Botones de marca | Texto blanco sobre verde y naranja de la paleta no llega a 4,5:1. | Accesibilidad (WCAG AA) | — | — | **Descartado por Tomás (2026-11-06): la paleta institucional de Icesi no se modifica.** | — |
| H12 | Detalle, asistente, costeo y diálogos | Unas 170 apariciones de texto de 10 u 11 px. | Accesibilidad, Krug | Lectura difícil en formularios y avisos. | 1 | Subir a 12 px lo legible (etiquetas, ayudas, errores, enlaces, pestañas). **Hecho en 97 sitios**; se conservan las insignias de 10 px y las tarjetas Kanban por densidad. | M |
| H13 | Detalle, costeo del Líder | El valor se guarda solo, pero el éxito no se ve; solo los errores avisan. | Visibilidad del estado (Nielsen 1) | El Líder no sabe si su valor quedó guardado antes de «Enviar a KAM». | 2 | Mostrar «Guardando…» y «Guardado a las HH:MM» junto al título del módulo. **Hecho.** | S |
| H14 | Nueva solicitud, paso 5 | El botón de quitar un adjunto es solo un icono, sin nombre accesible. | Accesibilidad, Norman | Un lector de pantalla anuncia «botón» sin decir cuál archivo. | 2 | `aria-label="Quitar <archivo>"`. **Hecho.** | S |
| H15 | Tablero, tarjetas KPI | Su estado activo se indica solo con color y borde. | No depender solo del color (guía, WCAG) | Quien no distingue los colores no sabe si el filtro está activo. | 2 | `aria-pressed` según el estado. **Hecho.** | S |
| H16 | Tablero y detalle | Los avisos «Cargando…» no se anuncian a lectores de pantalla. | Visibilidad del estado (Nielsen 1) | Sin anuncio de que algo está cargando. | 1 | `role="status"`. **Hecho.** | S |
| H17 | Diálogo de reasignación | El motivo llega preseleccionado con la primera opción y queda en la auditoría; el botón «Confirmar» está deshabilitado sin decir por qué. | Norman (deslices), Nielsen 5 y 1 | Un motivo equivocado queda registrado si el usuario no lo revisa. | 2 | **Pendiente de decisión:** obligar a elegir el motivo (cambia el comportamiento validado). | S |
| H18 | Varias pantallas | Textos de ayuda en gris `slate-400` (2,5:1 sobre blanco). Es un gris neutro, no un color de la paleta Icesi. | Accesibilidad (WCAG AA) | Ayudas difíciles de leer. | 2 | **Pendiente de decisión:** pasarlos al gris estándar del tema (`text-muted-foreground`). | S |

## 3. Qué se implementa ahora (sin tocar marca ni reglas de negocio)

H1 a H9 y H12 a H16. Cada cambio se registra en `CAMBIOS_UX.md` con el hallazgo que atiende. Se acompañan de pruebas.

## 4. Pendientes que necesitan respuesta de Tomás

- **H10:** ¿a dónde debe llevar «¿Olvidaste tu contraseña?», o se oculta mientras no exista recuperación?
- **H11:** descartado. La paleta es institucional y no se toca.
- **H17:** ¿se obliga a elegir el motivo de reasignación?
- **H18:** ¿se cambian los grises de ayuda al gris estándar del tema? (no es la paleta Icesi)
- **Sección 1:** ¿son correctos los flujos críticos y los usuarios supuestos?

## 5. Fuera de alcance

Reglas de negocio, etiquetas comerciales, dashboard admin, tarifa Pro-Cultura, textos de negocio acordados el 6 de noviembre de 2026. La simulación con IA y las pruebas con 3 a 5 usuarios reales (pasos 3 y 4 de la guía) quedan para después de implementar; la IA no inventa evidencia.
