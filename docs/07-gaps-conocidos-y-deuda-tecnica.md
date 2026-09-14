# Gaps conocidos y deuda técnica del prototipo

Inventario de huecos funcionales, placeholders sin conectar y atajos propios de un prototipo de UX. El propósito de este documento es que **ningún agente confunda estos comportamientos con reglas de negocio intencionales** al usarlos como referencia para el desarrollo real.

## 🔴 Funcionales (afectan lógica de negocio, no solo estética)

### 1. `RequestSummary.tsx` — vista "Resumen" con contenido 100% fijo
La ruta `/solicitudes/:id/resumen` (accesible desde el botón "Resumen" en `RequestDetail.tsx`) **no lee los datos reales de la solicitud**. Todo el contenido (nombre de empresa, contacto, requerimiento, formación previa) está hardcodeado en un array `SECTIONS` dentro del propio archivo — muestra siempre "Razón social S.A.", "Juan Pérez", "Nombre del programa", etc., sin importar qué solicitud se abra. Solo el header superior (ID, título, badges de estado/tipo) y la fila de "Nodo / Líder de Producto / KAM / Profesor" sí leen `req` real.
**Implicación:** esta pantalla no es funcional hoy más allá de mostrar el layout. Si se retoma, debe reconstruirse para leer todos los campos capturados en el wizard de `NewRequest.tsx`.

### 2. El botón "Enviar a cliente" (KAM) no está condicionado a que exista costeo real
En `RequestDetail.tsx`, el botón que el KAM usa para marcar `entregada` solo se deshabilita si `req.status === "entregada"`. No verifica que el estado sea `en-costeo` primero. Un KAM podría, en teoría, marcar como entregada una solicitud que sigue en `nueva` o `en-experto`, sin que el Líder de Producto haya hecho costeo.
**Implicación de negocio:** el flujo esperado es lineal y con handoff — este botón debería estar deshabilitado (o con confirmación explícita de excepción) hasta que `status === "en-costeo"`.

### 3. Avance de etapa sin validar que el trabajo previo esté completo
En `ProductLeaderDashboard.tsx`, los botones "Pasar a Experto" / "Pasar a Costeo" / "Entregar" en cada tarjeta Kanban ejecutan `updateStatus` directamente, sin comprobar precondiciones:
- Se puede pasar de `nueva` a `en-experto` **sin haber asignado docente**.
- Se puede pasar a `en-costeo` sin haber completado ningún dato de costeo.
- Se puede "Entregar" con `totalOfferedCop` en su valor por defecto sin revisión.
**Implicación:** si se quiere reforzar la integridad del proceso, estas transiciones deberían validar las precondiciones de la etapa anterior (esto es una decisión de producto a confirmar, no algo que deba "arreglarse" sin validar con el equipo primero).

### 4. Dashboard genérico roto para `lider-nodo` y `profesor`
En `src/pages/Dashboard.tsx`, cuando el rol no es `kam` ni `lider-producto`, el componente cae en una rama de código que **usa variables nunca declaradas** (`displayedTableRequests`, `reassigningRequest`, `selectedNewLeader`, `selectedNewNode`, `reassignReason`, `reassignNotes`, `handleOpenReassign`, `handleConfirmReassign`, `listas`). Esto provocaría un `ReferenceError` en tiempo de ejecución si un usuario con rol Líder de Nodo o Profesor visita `/dashboard`.
**No afecta** a KAM ni Líder de Producto (tienen componentes propios con `return` anticipado antes de llegar a ese código). Se documenta porque el flujo de reasignación menciona explícitamente "Líder de Nodo" conceptualmente, y porque cualquier trabajo futuro sobre esos dos roles debe empezar arreglando esto antes que nada.

### 5. Tarjeta "Especificaciones del Servicio" con valores fijos
En `RequestDetail.tsx` (columna lateral, visible para todos los roles), los campos "Dedicación estimada" (`60 horas`), "Modalidad" (`Híbrida`) y "Participantes" (`15 - 20 personas`) están escritos literalmente en el JSX, no leídos de `req` ni del formulario (`horas`, `modalidad`, `participantes` sí se capturan en el Paso 3 del wizard, pero nunca se guardan en `RequestItem` ni se muestran aquí).
**Implicación:** información capturada por el KAM se pierde/no se refleja en el detalle.

## 🟡 De prototipo (esperables mientras no hay backend, pero a tener en cuenta)

### 6. Sin autenticación ni backend real
Todo vive en `localStorage` del navegador (`AuthContext.tsx`). No hay sesiones multiusuario, no hay control de acceso real, cualquiera puede cambiar de rol con un clic desde dos sitios distintos en la UI (dropdown del avatar en el rail lateral, dropdown en la topbar, **y además** un selector adicional dentro de `RequestDetail.tsx` — "Vista: Líder de Producto / KAM"). Es intencional para poder probar todos los roles rápido durante el diseño, pero **no debe existir en producción** tal cual.

### 7. `id` de solicitud generado de forma ingenua
`REQ-2026-${requests.length + 145}` en `AuthContext.addRequest` — no es un identificador robusto (se rompe con borrados, concurrencia, o cambio de año). Solo válido como placeholder visual.

### 8. `getRelativeTime()` hardcodeado por ID específico
En `mock-data.ts`, la función que muestra "Hace 2 horas" / "Ayer" / etc. en `KamCommandCenter` tiene un `switch` con IDs de solicitud literales (`REQ-2026-0142` → `"Hace 2 horas"`, etc.) en vez de calcular la diferencia real contra `createdAt`. Cualquier solicitud nueva creada por el usuario cae en el `default: "Reciente"`.

### 9. Modal de reasignación duplicado en 3 archivos
Prácticamente el mismo JSX y lógica de reasignación de Líder de Producto está copiado en: la rama genérica rota de `Dashboard.tsx`, `ProductLeaderDashboard.tsx`, y `RequestDetail.tsx`. No es un bug de comportamiento (cada copia funciona igual), pero es deuda de mantenimiento — un cambio de reglas de reasignación (ej. nuevos motivos) hay que replicarlo 3 veces manualmente hoy.

### 10. Documentos adjuntos son solo metadata
`ProposalDocument` guarda `name`, `size` (como texto, no bytes), `date` (como texto formateado, no `Date`) — sugiere que la subida de archivos en `ProposalDocumentsSection.tsx` simula el registro pero no maneja binarios reales. Válido para prototipo; el backend real necesitará almacenamiento de archivos de verdad (S3, etc.) y metadata numérica/tipada.

## Cómo usar este documento

Si estás extendiendo el prototipo de UX/UI: puedes decidir dejar estos gaps tal cual (no son el foco si el objetivo es solo validar interacción/flujo), **pero nunca los repliques como si fueran la especificación correcta** al informar el diseño del backend real. Si estás diseñando el modelo de datos/backend de producción: usa `04-modelo-de-datos-logico.md` como referencia de reglas de negocio *validadas*, y este archivo como lista de lo que **no** se debe copiar literalmente.
