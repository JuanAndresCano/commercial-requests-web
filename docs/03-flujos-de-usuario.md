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
- Una **tarjeta de propuesta económica de solo lectura**: Valor Final de la Propuesta grande y destacado, más — solo si el tipo es "Capacitación" — la referencia informativa de Estampilla Pro-Cultura. **No ve el Margen de Contribución** (información interna del Líder). Si todavía no hay costeo real, ve un aviso "Costeo en proceso".
- La nota de negociación del Líder, si existe, y el **Historial de Negociación** (ver B.4) si ya hubo más de una ronda.

En la columna lateral: "Especificaciones del Servicio" (de solo lectura para el KAM), "Equipo Asignado" (Nodo, Líder de Producto, KAM, Docente/Asesor — con botón de contacto rápido si el docente es externo).

Más abajo, la sección colapsable **"Información completa de la solicitud"** (empresa, contacto, diagnóstico, formación previa, observaciones) — de solo lectura para el KAM una vez sale de "Nueva" (ver B.7 sobre cuándo puede editarla el Líder), con un contador "X de Y campos diligenciados" siempre visible en el encabezado, aunque esté colapsada.

**Acciones disponibles según el estado, todas arriba a la derecha:**
- `en-costeo`: botón **"Enviar a cliente"** → cambia el estado a `entregada`. **Deshabilitado si el costeo aún no tiene un valor mayor a $0, o si el Líder de Producto todavía no confirmó explícitamente el envío** (ver B.4 — ya no basta con que exista un valor, el Líder debe darle "Enviar a KAM" primero).
- `nueva` (y la solicitud es suya): botón **"Cancelar solicitud"** → la elimina por completo, con confirmación.
- `entregada`: insignia sólida **"Propuesta Entregada"** + botón **"Devolver con observaciones"** (ver A.7).

### A.6 — Editar su propia solicitud (solo mientras "Nueva")
Si la solicitud sigue en "Nueva" y es suya, aparece un botón **"Editar información"** junto a "Información completa de la solicitud". Abre un modal con 6 pestañas (General, Empresa, Contacto, Diagnóstico, Formación, Otros) que cubre prácticamente todos los campos capturados en el wizard, incluyendo título y urgencia (que antes no se podían corregir desde ningún lado). Valida formato de correos/teléfonos, no deja guardar el título vacío, y si se intenta cerrar con cambios sin guardar pide confirmación.

### A.7 — Si el cliente pide ajustes después de entregada
Desde el detalle de una solicitud `entregada`, el KAM puede hacer clic en **"Devolver con observaciones"**: abre un modal para escribir la nota del cliente, y al confirmar:
- La solicitud vuelve a `en-costeo` con esa nota visible (banner ámbar) tanto para el KAM como para el Líder de Producto, incluyendo en la tarjeta del Kanban del Líder. Al volver a marcarse `entregada`, la nota se limpia automáticamente.
- La ronda de negociación que estaba pendiente en el **Historial de Negociación** (ver B.4) queda registrada como **rechazada**, con la observación del cliente y la fecha.
- El gate de envío al KAM se resetea (`readyForKam` vuelve a `false`) — el botón "Enviar a cliente" del KAM se deshabilita otra vez hasta que el Líder confirme el ajuste. Si es la segunda vez (o más) que se reenvía, el Líder debe escribir obligatoriamente un motivo del ajuste (ver B.4).

---

## Journey B — Líder de Producto: de solicitud cruda a propuesta costeada

### B.1 — Login
Igual que el KAM pero seleccionando la tarjeta "Líder de Producto" en `/login`.

### B.2 — Punto de partida: `ProductLeaderDashboard`
Aterriza en su Kanban de 4 columnas (vista por defecto, a diferencia del KAM que arranca en Tabla), filtrado siempre a **sus propias solicitudes** (no hay toggle a "Todas"). Si tiene solicitudes nuevas sin revisar, ve primero un banner "¡Tienes N solicitudes nuevas por revisar!" (espejo del banner del KAM) con un botón "Ver nuevas". Debajo, ve de inmediato cuántas tiene en cada etapa gracias a las 4 tarjetas KPI, más el filtro rápido "Sin docente (N)" para encontrar lo pendiente de asignar.

### B.3 — Triage de una solicitud nueva
1. En la columna **"Nueva"**, cada tarjeta muestra si tiene o no docente asignado ("Sin docente" en naranja si no), su antigüedad en la fase, y la fecha límite coloreada si está por vencer o vencida.
2. Clic en la tarjeta → `/solicitudes/:id`.
3. En la columna lateral "Equipo Asignado" → sección "Docente / Asesor" → botón **"Asignar"** abre `AdvisorAssignmentModal`.
4. En el modal, dos pestañas:
   - **Profesor de Planta**: selecciona de una lista cerrada de facultad interna (`ICESI_FACULTY`), con vista previa de departamento.
   - **Consultor/Docente Externo**: formulario completo (nombre obligatorio; identificación, firma consultora, correo, teléfono, perfil opcionales). El costeo (B.4) refleja automáticamente que el asesor es externo — ya no es un switch independiente que se pueda desincronizar, es un indicador derivado directamente de esta asignación (el valor de sus honorarios sigue sin registrarse en la plataforma — va en el documento de costeo externo, confirmado con Dianis).
5. Guardar asignación → toast de confirmación → vuelve al detalle con el docente ya reflejado.
6. Avanza el estado con el botón **"Pasar a Experto"** (deshabilitado sin docente asignado) — desde el Kanban o el detalle, ambos con un diálogo de confirmación que muestra la empresa y el título de la solicitud antes de ejecutar.

### B.4 — Costeo de la propuesta
1. Cuando la propuesta está madura, el Líder de Producto avanza a `en-costeo` (botón "Pasar a Costeo", con el mismo diálogo de confirmación).
2. En el detalle, el módulo `ProposalCostingModule` (columna principal, solo visible para este rol) permite:
   - Ingresar el **Valor Final de la Propuesta** (COP) — el número que se le va a mostrar al cliente. Ya **no** se calcula a partir de un costo base + margen: el Líder lo digita directamente, porque el equipo ya trae este número calculado de un Excel externo y necesita que quede exacto (docs/04, `ProposalCosting`).
   - Ajustar el **Margen de Contribución**, tanto en **porcentaje** (chips 25/30/35/40% o valor libre) como en **pesos** (input manual) — ambos son informativos e independientes entre sí y del valor final; junto al campo en pesos se muestra una referencia calculada ("X% de $Y = $Z") solo para comparar, sin forzar que cuadren.
   - Ver, solo si el tipo es "Capacitación", una fila de referencia **"Estampilla Pro-Cultura (1.5%)"** — igual de informativa, nunca se suma ni se resta del valor final.
   - Ver un indicador de solo lectura **"Asesor del Servicio"**, derivado de a quién se le asignó como docente/asesor en B.3 (planta o externo) — ya no es un switch editable aparte.
   - Opcionalmente expandir "+ Agregar nota de alcance" para justificar el ajuste en texto libre (`negotiationNotes`, distinto del motivo de ajuste de una ronda — ver más abajo).
   - Cada cambio se guarda solo (no hay botón de "guardar" separado dentro del módulo; existe un botón general "Guardar Cambios" en la cabecera del detalle como refuerzo).
3. Paralelamente, en `ProposalDocumentsSection` (debajo del costeo), puede subir documentos internos de costeo (matrices Excel, contratos) y documentos de cara al cliente.
4. Cuando el valor final ya es mayor a $0, aparece un botón **"Enviar a KAM"** — al confirmarlo, la propuesta queda marcada como lista y **se abre una ronda en el Historial de Negociación** (ver abajo) con el valor, margen y alcance de ese momento. Recién ahí el KAM puede usar su "Enviar a cliente" (A.5) — antes de confirmar, aunque el valor ya esté puesto, el botón del KAM sigue deshabilitado. **No hay ningún botón de "Entregar" para el Líder de Producto**: el envío final al cliente sigue siendo exclusivo del KAM. En el Kanban, la tarjeta en "En Costeo" muestra "Completar costeo" mientras falta valor, "Completar envío" (enlace al detalle) mientras el valor existe pero no se ha confirmado, y la insignia **"Enviado al KAM"** (con "hace X tiempo") una vez confirmado.
5. **Historial de Negociación** (sección nueva en el detalle, visible para Líder y KAM, solo si ya hay más de una ronda o una ronda cerrada): cada vez que el Líder confirma "Enviar a KAM" se abre o actualiza una ronda con el valor, margen, participantes/modalidad/horas/tipo/necesidad de ese momento. Si el cliente rechaza (A.7), esa ronda queda marcada como rechazada con su observación. **Desde la segunda ronda en adelante, el Líder debe escribir un motivo del ajuste obligatorio** antes de poder reenviar — el diálogo le muestra la observación del cliente de la ronda anterior como contexto.
6. Si el rechazo del cliente requiere corregir algo de **"Información completa de la solicitud"** (ej. la descripción del alcance en `necesidad`, no solo el precio), el Líder de Producto ahora puede editar esa sección mientras la solicitud esté en "En Costeo" — ver B.7. Antes, una vez salía de "Nueva", nadie podía corregir esos campos.

### B.5 — Reasignación (camino alterno, en "Nueva" o "En Experto")
Si una solicitud no corresponde a su especialidad/nodo (mal asignada por el KAM, sobrecarga, o el experto determina que el tema es de otro nodo), el Líder de Producto puede reasignarla mientras esté en **"Nueva" o "En proceso por experto"** (una vez llega a costeo, ya no se puede desde la interfaz):
- Desde el Kanban (ícono de flechas en el pie de la tarjeta) o desde el detalle (link "Reasignar" junto a "Líder de Producto" en la tarjeta lateral).
- Modal compartido (`ReassignLeaderDialog` + `useReassignRequest`, antes triplicado en 3 archivos distintos): selecciona nuevo Líder de Producto (la lista excluye al actual), el nodo se autosugiere según el nuevo líder, elige un motivo estructurado (dropdown con 5 opciones predefinidas + "Otro motivo"), y puede dejar una nota para el nuevo líder.
- Al confirmar: `productLeader` y `node` cambian siempre. **Si la solicitud estaba en "En Experto", el estado vuelve a "Nueva"** (el nuevo líder reinicia el flujo) y se limpia el docente/asesor que tenía asignado (ya no aplicaría necesariamente bajo el nuevo nodo).

  ⚠️ **Esta ampliación (permitir reasignar también desde "En Experto") es una decisión de Tomás, no una respuesta confirmada por Dianis** — en `08`, pregunta 6, ella no dio un caso concreto ("quizás todo puede pasar en la vida") y el prototipo se había dejado restringido solo a "Nueva". Se relajó igual porque apareció un caso de negocio concreto (el profesor determina que el tema no corresponde a su nodo) mientras se probaba el prototipo — **falta validar explícitamente con ella** que este es el comportamiento correcto.

### B.6 — Corregir "Especificaciones del Servicio"
Si el KAM diligenció mal la dedicación, modalidad, participantes, tipo de servicio o fecha de entrega estimados, el Líder de Producto puede corregirlos directamente desde la tarjeta lateral "Especificaciones del Servicio" en el detalle (botón "Editar") — sobrescribe el valor sin dejar historial de "antes/después" independiente (si el cambio ocurre estando en "En Costeo" y luego se confirma "Enviar a KAM", sí queda congelado como parte de esa ronda del Historial de Negociación — ver B.4).

### B.7 — Corregir "Información completa de la solicitud" tras un rechazo del cliente
Antes, una vez la solicitud salía de "Nueva", **nadie** podía corregir estos campos (empresa, contacto, diagnóstico/`necesidad`, formación previa) — ni el KAM que los diligenció originalmente, ni el Líder. Esto era un problema real: si el cliente rechaza una propuesta por un tema de alcance (ej. "reducir de 5 plantas a 3"), la corrección vive en `necesidad`, no en el costeo.

**Ahora el Líder de Producto también puede abrir "Editar información"** desde esta sección, mientras la solicitud sea suya y esté en **"En Costeo"** — el mismo modal que ya usaba el KAM en "Nueva". Si corrige `necesidad` (o cualquier otro campo de esta sección) y luego confirma "Enviar a KAM" (B.4), ese valor corregido queda congelado en la ronda correspondiente del Historial de Negociación automáticamente, sin pasos adicionales.

⚠️ Igual que B.5, **esto no viene de una pregunta respondida por Dianis** — surgió al analizar qué pasa cuando un rechazo del cliente no es solo de precio. Queda pendiente de validar con ella quién debería tener esta responsabilidad (¿Líder, KAM, o ambos?) — ver `08`, pregunta 16.

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
                                Digita el Valor Final de la
                                Propuesta + margen (% y $)
                                (+ referencia Pro-Cultura si aplica)
                                        │
                                        ▼
                                Clic "Enviar a KAM" (abre ronda
                                en el Historial de Negociación) ──►  Ve banner "lista para entregar"
                                                                        │
                                                                        ▼
                                                                Abre detalle, revisa valor
                                                                aprobado (solo lectura)
                                                                        │
                                                                        ▼
                                                                Clic "Enviar a cliente"
                                                                (única acción que marca
                                                                "Entregada" en todo el sistema —
                                                                deshabilitada hasta el paso anterior)
                                                                        │
                                                        ┌───────────────┴───────────────┐
                                                        ▼                                ▼
                                                Ciclo cerrado ✅              Cliente pide ajustes:
                                                                              "Devolver con observaciones"
                                                                                        │
                                                                                        ▼
                                                                        Vuelve a "En Costeo", ronda queda
                                                                        "rechazada" con la observación,
                                                                        gate se resetea (reinicia desde B.4;
                                                                        2da ronda en adelante exige motivo)
```
