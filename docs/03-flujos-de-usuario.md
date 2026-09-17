# Flujos de usuario (user journeys)

Este documento describe, pantalla por pantalla, los dos recorridos prioritarios: **crear y hacer seguimiento a una solicitud (KAM)** y **triage + costeo de una solicitud (Líder de Producto)**. Las rutas están definidas en `src/App.tsx`.

## Mapa de rutas

| Ruta | Pantalla | Archivo |
|---|---|---|
| `/` | Landing pública | `src/pages/Index.tsx` |
| `/login` | Selección de rol + login simulado | `src/pages/Login.tsx` |
| `/dashboard` | Dashboard (bifurca por rol) | `src/pages/Dashboard.tsx` |
| `/solicitudes` | Tablero de solicitudes (Kanban o lista) | `src/pages/RequestsBoard.tsx` |
| `/solicitudes/nueva` | Wizard de creación (5 pasos) | `src/pages/NewRequest.tsx` |
| `/solicitudes/:id` | Detalle de solicitud (bifurca por rol) | `src/pages/RequestDetail.tsx` |

⚠️ La ruta `/solicitudes/:id/resumen` (vista "Resumen") **ya no existe** — se eliminó por completo (`RequestSummary.tsx` fue borrado) porque todo su contenido era fijo/de ejemplo, sin leer la solicitud real. Quedan exactamente 2 pantallas por solicitud: el tablero y el detalle.

---

## Journey A — KAM: de necesidad del cliente a propuesta entregada

### A.1 — Login
1. En `/login`, el KAM hace clic en la tarjeta de rol "KAM" (o entra directo con `?role=kam` en la URL) → se autocompleta correo institucional.
2. Clic en "Ingresar como KAM" → redirige a `/dashboard`.

### A.2 — Punto de partida: `KamCommandCenter`
El KAM aterriza en su centro de comando, filtrado siempre a **sus propias solicitudes** (no ve las de otros KAMs). Desde aquí tiene tres caminos típicos:
- **Crear algo nuevo** → botón "Nueva Solicitud" (esquina superior derecha, también disponible en la barra lateral y en la topbar global de `AppShell`).
- **Revisar el pipeline existente** → 4 tarjetas KPI (Nueva / En Proceso / Lista para Entregar / Entregada) que filtran la tabla, o la tabla directamente.
- **Escanear visualmente** → toggle a vista Kanban (mismas 4 columnas, mismos colores que la tabla).

En Kanban, un clic en una tarjeta KPI **no oculta nada** (las columnas ya son el filtro) — aísla esa columna a pantalla completa, con las tarjetas en cuadrícula de hasta 3 por fila, para revisarlas más cómodo sin perder el contexto visual del Kanban. Un botón "Ver las 4 fases" regresa a la vista completa.

### A.3 — Registrar una nueva solicitud (`/solicitudes/nueva`)
Wizard de 5 pasos con stepper clicable (se puede saltar hacia atrás libremente; hacia adelante valida el paso actual). Guardado automático en `localStorage` en cada cambio (si hay contenido significativo), con banner de recuperación de borrador si se detecta uno al entrar.

1. **Paso 1 — Empresa** (`empresaNombre` y `tipoEmpresa` **obligatorios**): buscador con autocompletado contra empresas con convenio existente (`MOCK_COMPANIES`) — al seleccionar una, rellena NIT, dirección, teléfono, correo, CIIU, web y tipo de empresa, **todo editable después**. También se puede escribir una empresa nueva desde cero. Incluye chips de "empresas frecuentes" como atajo de un clic.
2. **Paso 2 — Contacto** (100% opcional): datos del interlocutor principal + posibilidad de agregar múltiples contactos adicionales (para empresas con varios tomadores de decisión/áreas).
3. **Paso 3 — Requerimiento** (`nombreReq` y `tipoReq` **obligatorios**; `tipoReqOtro` obligatorio solo si el tipo es "Otro"): aquí se elige el Nodo temático — **opcional, pero si se deja en blanco la solicitud queda con Líder de Producto "Por definir" y no le aparece a nadie real** — el tipo de servicio, y hay una sección "avanzada" colapsable con diagnóstico opcional (necesidad, competencias a fortalecer, resultados esperados, horas, modalidad, participantes, etc.).
4. **Paso 4 — Formación previa** (`formacionPrevia` y `urgencia` **obligatorios**): si la empresa ya ha tomado servicios similares antes, y el nivel de urgencia de la solicitud.
5. **Paso 5 — Observaciones y Documentos** (100% opcional): notas libres + adjuntar archivos.

Al final: botón **"Enviar solicitud a Líder de Producto"**. Son **6 los campos con validación dura** (razón social, naturaleza jurídica, título, tipo de requerimiento + su descripción si es "Otro", formación previa, urgencia) — si falta alguno, salta automáticamente al paso correspondiente con un toast de error y resalta el campo. Todo lo demás es opcional.

Al enviar: se crea el `RequestItem` con `status: "nueva"` siempre, sin costeo ni docente, y `productLeader` = el líder elegido manualmente, o el sugerido por nodo, o `"Por definir"` si no se eligió nodo. Se limpia el borrador guardado. Se muestra una pantalla de éxito (`SuccessScreen`) antes de volver al tablero.

### A.4 — Seguimiento
El KAM no tiene que hacer nada más hasta que la propuesta avance. Se entera de que algo está listo por:
- El **banner verde** en su dashboard ("¡Tienes N propuestas listas para entregar!") cuando alguna solicitud llega a `en-costeo`.
- La tarjeta KPI "Lista para Entregar".
- La columna "Estado" en la tabla (4 badges de color, uno por estado real — ya no fusiona "Nueva" y "En Proceso" en un solo badge como antes).

### A.5 — Ver el detalle y confirmar entrega (`/solicitudes/:id`)
Desde la tabla o el Kanban, clic en una solicitud lleva al detalle. Para el KAM, la columna principal muestra:
- Un **banner ámbar** si la solicitud tiene observaciones de un cliente que pidió ajustes (ver A.7).
- Una **tarjeta de propuesta económica de solo lectura**: Valor Total Ofertado grande y destacado, con badge "Aprobado por Líder", más — solo si el tipo es "Capacitación" — la Estampilla Pro-Cultura. **No ve Costo Base Directo ni Margen de Contribución** (información interna del Líder). Si todavía no hay costeo real, ve un aviso "Costeo en proceso".
- La nota de negociación del Líder, si existe.

En la columna lateral: "Especificaciones del Servicio" (de solo lectura para el KAM), "Equipo Asignado" (Nodo, Líder de Producto, KAM, Docente/Asesor — con botón de contacto rápido si el docente es externo).

Más abajo, la sección colapsable **"Información completa de la solicitud"** (empresa, contacto, diagnóstico, formación previa, observaciones) — de solo lectura, con un contador "X de Y campos diligenciados" siempre visible en el encabezado, aunque esté colapsada.

**Acciones disponibles según el estado, todas arriba a la derecha:**
- `en-costeo`: botón **"Enviar a cliente"** → cambia el estado a `entregada`. **Deshabilitado si el costeo aún no tiene un valor mayor a $0.**
- `nueva` (y la solicitud es suya): botón **"Cancelar solicitud"** → la elimina por completo, con confirmación.
- `entregada`: badge "Propuesta Entregada" + botón **"Devolver con observaciones"** (ver A.7).

### A.6 — Editar su propia solicitud (solo mientras "Nueva")
Si la solicitud sigue en "Nueva" y es suya, aparece un botón **"Editar información"** junto a "Información completa de la solicitud". Abre un modal con 6 pestañas (General, Empresa, Contacto, Diagnóstico, Formación, Otros) que cubre prácticamente todos los campos capturados en el wizard, incluyendo título y urgencia (que antes no se podían corregir desde ningún lado). Valida formato de correos/teléfonos, no deja guardar el título vacío, y si se intenta cerrar con cambios sin guardar pide confirmación.

### A.7 — Si el cliente pide ajustes después de entregada
Desde el detalle de una solicitud `entregada`, el KAM puede hacer clic en **"Devolver con observaciones"**: abre un modal para escribir la nota del cliente, y al confirmar la solicitud vuelve a `en-costeo` con esa nota visible (banner ámbar) tanto para el KAM como para el Líder de Producto, incluyendo en la tarjeta del Kanban del Líder. Al volver a marcarse `entregada`, la nota se limpia automáticamente.

---

## Journey B — Líder de Producto: de solicitud cruda a propuesta costeada

### B.1 — Login
Igual que el KAM pero seleccionando la tarjeta "Líder de Producto" en `/login`.

### B.2 — Punto de partida: `ProductLeaderDashboard`
Aterriza en su Kanban de 4 columnas (vista por defecto, a diferencia del KAM que arranca en Tabla), filtrado siempre a **sus propias solicitudes** (no hay toggle a "Todas"). Ve de inmediato cuántas tiene en cada etapa gracias a las 4 tarjetas KPI en la parte superior, más el filtro rápido "Sin docente (N)" para encontrar lo pendiente de asignar.

### B.3 — Triage de una solicitud nueva
1. En la columna **"Nueva"**, cada tarjeta muestra si tiene o no docente asignado ("Sin docente" en naranja si no), su antigüedad en la fase, y la fecha límite coloreada si está por vencer o vencida.
2. Clic en la tarjeta → `/solicitudes/:id`.
3. En la columna lateral "Equipo Asignado" → sección "Docente / Asesor" → botón **"Asignar"** abre `AdvisorAssignmentModal`.
4. En el modal, dos pestañas:
   - **Profesor de Planta**: selecciona de una lista cerrada de facultad interna (`ICESI_FACULTY`), con vista previa de departamento.
   - **Consultor/Docente Externo**: formulario completo (nombre obligatorio; identificación, firma consultora, correo, teléfono, perfil opcionales). Al guardar como externo, automáticamente se activa el flag "requiere asesor externo" en el costeo (aunque el valor de sus honorarios no se registra en la plataforma — va en el documento de costeo externo, confirmado con Dianis).
5. Guardar asignación → toast de confirmación → vuelve al detalle con el docente ya reflejado.
6. Avanza el estado con el botón **"Pasar a Experto"** (deshabilitado sin docente asignado) — desde el Kanban o el detalle, ambos con un diálogo de confirmación que muestra la empresa y el título de la solicitud antes de ejecutar.

### B.4 — Costeo de la propuesta
1. Cuando la propuesta está madura, el Líder de Producto avanza a `en-costeo` (botón "Pasar a Costeo", con el mismo diálogo de confirmación).
2. En el detalle, el módulo `ProposalCostingModule` (columna principal, solo visible para este rol) permite en tiempo real:
   - Ingresar **Costo Base Directo** (input numérico en COP, no acepta negativos).
   - Activar el switch **"¿Requiere asesor externo?"** (con campo de nombre/empresa consultora si se activa).
   - Ajustar el **Margen de Contribución** (input % con chips predefinidos 25/30/35/40%, acotado entre 0 y 100).
   - Ver el **desglose financiero** en vivo: Costo Base → Margen → Subtotal → Estampilla Pro-Cultura (solo si es Capacitación) → **Total Final Ofertado**.
   - Opcionalmente expandir "Personalizar valor ofertado" para sobreescribir el total sugerido manualmente (con botón "Sincronizar" para volver al valor calculado si se desea) — tampoco acepta negativos.
   - Opcionalmente expandir "+ Agregar nota de alcance" para justificar el ajuste en texto libre.
   - Cada cambio dispara `triggerSave` → `onUpdateCosting` → persiste inmediatamente (no hay botón de "guardar" separado dentro del módulo; existe un botón general "Guardar Cambios" en la cabecera del detalle como refuerzo).
3. Paralelamente, en `ProposalDocumentsSection` (debajo del costeo), puede subir documentos internos de costeo (matrices Excel, contratos) y documentos de cara al cliente.
4. Cuando el Valor Total Ofertado ya es mayor a $0, el trabajo del Líder termina ahí — **no hay ningún botón de "Entregar" para el Líder de Producto**, ni en el Kanban ni en el detalle. El envío final al cliente es una acción exclusiva del KAM (se encontró y corrigió un hueco donde el Líder también podía marcar "Entregada" directamente, saltándose al KAM). En el Kanban, la tarjeta en "En Costeo" muestra "Completar costeo" (enlace al detalle) mientras falta valor, y una etiqueta pasiva **"Listo para el KAM"** una vez está listo; en el detalle se ve como "Costeo listo — a la espera del KAM". Esa misma solicitud ya es visible en el dashboard del KAM como "Lista para Entregar" sin que el Líder tenga que hacer nada más.

### B.5 — Reasignación (camino alterno, solo mientras "Nueva")
Si una solicitud no corresponde a su especialidad/nodo (mal asignada por el KAM, sobrecarga, etc.), el Líder de Producto puede reasignarla — pero **solo mientras sigue en "Nueva"** (una vez alguien empezó a trabajarla, ya no se puede desde la interfaz):
- Desde el Kanban (ícono de flechas en el pie de la tarjeta, solo visible en la columna "Nueva") o desde el detalle (link "Reasignar" junto a "Líder de Producto" en la tarjeta lateral).
- Modal: selecciona nuevo Líder de Producto (la lista excluye al actual), el nodo se autosugiere según el nuevo líder, elige un motivo estructurado (dropdown con 5 opciones predefinidas + "Otro motivo"), y puede dejar una nota para el nuevo líder.
- Al confirmar: `updateRequest` cambia `productLeader` y `node` — la solicitud desaparece de "Mis Solicitudes" del líder original y aparece en la del nuevo.

### B.6 — Corregir "Especificaciones del Servicio"
Si el KAM diligenció mal la dedicación, modalidad, participantes, tipo de servicio o fecha de entrega estimados, el Líder de Producto puede corregirlos directamente desde la tarjeta lateral "Especificaciones del Servicio" en el detalle (botón "Editar") — sobrescribe el valor sin dejar historial de "antes/después" (no se pidió esa trazabilidad).

---

## Resumen visual del ciclo completo (ambos roles)

```
KAM                                    LÍDER DE PRODUCTO
───────────────────────────────────────────────────────────────
Detecta necesidad del cliente
        │
        ▼
Llena wizard (5 pasos,
6 campos obligatorios)
        │
        ▼
Envía ──────────────────────►  Aparece en columna "Nueva"
                                        │
                                        ▼
                                Asigna docente (planta/externo)
                                        │
                                        ▼
                                Confirma avance a "En Experto"
                                (diseño de propuesta académica)
                                        │
                                        ▼
                                Confirma avance a "En Costeo"
                                Ingresa costo base + margen
                                (+ estampilla automática si aplica)
                                Ajusta valor ofertado si hay
                                negociación comercial
                                        │
                                        ▼
                                Costeo > $0: tarjeta pasa a
                                "Listo para el KAM" (el Líder
                                ya no tiene más acciones) ──►  Ve banner "lista para entregar"
                                                                        │
                                                                        ▼
                                                                Abre detalle, revisa valor
                                                                aprobado (solo lectura)
                                                                        │
                                                                        ▼
                                                                Clic "Enviar a cliente"
                                                                (única acción que marca
                                                                "Entregada" en todo el sistema)
                                                                        │
                                                        ┌───────────────┴───────────────┐
                                                        ▼                                ▼
                                                Ciclo cerrado ✅              Cliente pide ajustes:
                                                                              "Devolver con observaciones"
                                                                                        │
                                                                                        ▼
                                                                        Vuelve a "En Costeo" con la nota
                                                                        visible para el Líder (reinicia
                                                                        desde B.4)
```
