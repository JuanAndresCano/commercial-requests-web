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
| `/solicitudes/:id/resumen` | Resumen imprimible | `src/pages/RequestSummary.tsx` (⚠️ ver gaps conocidos, hoy es contenido fijo) |

---

## Journey A — KAM: de necesidad del cliente a propuesta entregada

### A.1 — Login
1. En `/login`, el KAM hace clic en la tarjeta de rol "KAM" (o entra directo con `?role=kam` en la URL) → se autocompleta correo institucional.
2. Clic en "Ingresar como KAM" → redirige a `/dashboard`.

### A.2 — Punto de partida: `KamCommandCenter`
El KAM aterriza en su centro de comando (ver `02-roles-y-permisos.md` para el detalle de layout). Desde aquí tiene dos caminos típicos:
- **Crear algo nuevo** → botón "Nueva Solicitud" (esquina superior derecha, también disponible en la barra lateral y en la topbar global de `AppShell`).
- **Revisar el pipeline existente** → tarjetas KPI (filtran la tabla) o la tabla de actividad reciente directamente.

### A.3 — Registrar una nueva solicitud (`/solicitudes/nueva`)
Wizard de 5 pasos con stepper clicable (se puede saltar hacia atrás libremente; hacia adelante valida el paso actual). Guardado automático en `localStorage` en cada cambio (si hay contenido significativo), con banner de recuperación de borrador si se detecta uno al entrar.

1. **Paso 1 — Empresa** (`empresaNombre` **obligatorio**): buscador con autocompletado contra empresas con convenio existente (`MOCK_COMPANIES`) — al seleccionar una, rellena NIT, dirección, teléfono, correo, CIIU, web y tipo de empresa, **todo editable después**. También se puede escribir una empresa nueva desde cero. Incluye chips de "empresas frecuentes" como atajo de un clic.
2. **Paso 2 — Contacto** (100% opcional): datos del interlocutor principal + posibilidad de agregar múltiples contactos adicionales (para empresas con varios tomadores de decisión/áreas).
3. **Paso 3 — Requerimiento** (`nombreReq` **obligatorio**; `tipoReqOtro` obligatorio solo si el tipo es "Otro"): aquí se elige el Nodo (opcional → autosugiere Líder de Producto), el tipo de servicio, urgencia, y hay una sección "avanzada" colapsable con diagnóstico opcional (necesidad, competencias a fortalecer, resultados esperados, horas, modalidad, participantes, etc.).
4. **Paso 4 — Formación previa** (opcional): si la empresa ya ha tomado servicios similares antes.
5. **Paso 5 — Observaciones y Documentos** (100% opcional): notas libres + adjuntar archivos.

Al final: botón **"Enviar solicitud a Líder de Producto"**. Validaciones duras solo sobre los 2 campos obligatorios (empresa y título) — si faltan, salta automáticamente al paso correspondiente con un toast de error.

Al enviar: se crea el `RequestItem` con `status: "nueva"` siempre, y `productLeader` = el líder elegido manualmente o el sugerido por nodo o `"Por definir"`. Se limpia el borrador guardado. Se muestra una pantalla de éxito (`SuccessScreen`, definida al final de `NewRequest.tsx`) antes de volver al tablero.

### A.4 — Seguimiento
El KAM no tiene que hacer nada más hasta que la propuesta avance. Se entera de que algo está listo por:
- El **banner verde** en su dashboard ("¡Tienes N propuestas listas para entregar!") cuando alguna solicitud llega a `en-costeo`.
- La tarjeta KPI "Listas para Entregar".
- La columna "Estado" en la tabla, que muestra un badge distinto por etapa.

### A.5 — Ver el detalle y confirmar entrega (`/solicitudes/:id`)
Desde la tabla, clic en una fila lleva al detalle. Para el KAM (rama `else if (isKam)` en `RequestDetail.tsx`), la columna principal muestra una **tarjeta de propuesta económica de solo lectura**: Valor Total Ofertado grande y destacado, con badge "Aprobado por Líder", más un desglose de respaldo (costo base, margen, estampilla si aplica) y la nota de negociación si existe. El KAM también ve la tarjeta lateral "Equipo Asignado" (Nodo, Líder de Producto, KAM, Docente/Asesor con su contacto si es externo).

Acción final: botón **"Enviar a cliente"** (arriba a la derecha) → cambia el estado a `entregada`. Este botón está deshabilitado solo si ya está `entregada` — no está condicionado a que el costeo exista realmente (ver gaps conocidos).

---

## Journey B — Líder de Producto: de solicitud cruda a propuesta costeada

### B.1 — Login
Igual que el KAM pero seleccionando la tarjeta "Líder de Producto" en `/login`.

### B.2 — Punto de partida: `ProductLeaderDashboard`
Aterriza en su Kanban de 4 columnas, por defecto filtrado a **"Mis Solicitudes"**. Ve de inmediato cuántas tiene en cada etapa gracias a las 4 tarjetas KPI-filtro en la parte superior.

### B.3 — Triage de una solicitud nueva
1. En la columna **"Nuevas"**, cada tarjeta muestra si tiene o no docente asignado ("Sin docente" en naranja si no).
2. Clic en la tarjeta → `/solicitudes/:id`.
3. En la columna lateral "Equipo Asignado" → sección "Docente / Asesor" → botón **"Asignar"** abre `AdvisorAssignmentModal`.
4. En el modal, dos pestañas:
   - **Profesor de Planta**: selecciona de una lista cerrada de facultad interna (`ICESI_FACULTY`), con vista previa de departamento.
   - **Consultor/Docente Externo**: formulario completo (nombre obligatorio; identificación, firma consultora, correo, teléfono, perfil opcionales). Al guardar como externo, automáticamente se activa el flag "requiere asesor externo" en el costeo.
5. Guardar asignación → toast de confirmación → vuelve al detalle con el docente ya reflejado.
6. Desde el detalle (o directo desde la tarjeta del Kanban con el botón **"Pasar a Experto"**), avanza el estado a `en-experto`.

*(Alternativa rápida: el botón "Pasar a Experto" en la tarjeta del Kanban avanza el estado sin pasar por el detalle — no obliga a que ya haya docente asignado, ver gaps conocidos.)*

### B.4 — Costeo de la propuesta
1. Cuando la propuesta está madura, el Líder de Producto avanza a `en-costeo` (botón "Pasar a Costeo" en el Kanban, o "Avanzar a En Costeo" en el detalle).
2. En el detalle, el módulo `ProposalCostingModule` (columna principal, solo visible para este rol) permite en tiempo real:
   - Ingresar **Costo Base Directo** (input numérico en COP).
   - Activar el switch **"¿Requiere asesor externo?"** (con campo de nombre/empresa consultora si se activa).
   - Ajustar el **Margen de Contribución** (input % o chips predefinidos 25/30/35/40%).
   - Ver el **desglose financiero** en vivo: Costo Base → Margen → Subtotal → Estampilla Pro-Cultura (solo si es Capacitación) → **Total Final Ofertado**.
   - Opcionalmente expandir "Personalizar valor ofertado" para sobreescribir el total sugerido manualmente (con botón "Sincronizar" para volver al valor calculado si se desea).
   - Opcionalmente expandir "+ Agregar nota de alcance" para justificar el ajuste en texto libre.
   - Cada cambio dispara `triggerSave` → `onUpdateCosting` → persiste inmediatamente (no hay botón de "guardar" separado dentro del módulo; existe un botón general "Guardar Cambios" en la cabecera del detalle como refuerzo).
3. Paralelamente, en la sección `ProposalDocumentsSection` (debajo del costeo, columna principal), puede subir documentos internos de costeo (matrices Excel, contratos) y documentos de cara al cliente.
4. Cuando todo está listo: botón **"Marcar Entregada"** (verde) → cambia el estado a `entregada`. Esto es lo que dispara el banner/KPI que ve el KAM en su dashboard.

### B.5 — Reasignación (camino alterno, en cualquier etapa)
Si una solicitud no corresponde a su especialidad/nodo (mal asignada por el KAM, sobrecarga, etc.), el Líder de Producto puede reasignarla sin tener que resolverla él mismo:
- Desde el Kanban (ícono de flechas en el pie de cada tarjeta) o desde el detalle (link "Reasignar" junto a "Líder de Producto" en la tarjeta lateral).
- Modal: selecciona nuevo Líder de Producto (la lista excluye al actual), el nodo se autosugiere según el nuevo líder, elige un motivo estructurado (dropdown con 5 opciones predefinidas + "Otro motivo"), y puede dejar una nota para el nuevo líder.
- Al confirmar: `updateRequest` cambia `productLeader` y `node` — la solicitud desaparece de "Mis Solicitudes" del líder original y aparece en la del nuevo.

---

## Resumen visual del ciclo completo (ambos roles)

```
KAM                                    LÍDER DE PRODUCTO
───────────────────────────────────────────────────────────────
Detecta necesidad del cliente
        │
        ▼
Llena wizard (5 pasos,
solo 2 campos obligatorios)
        │
        ▼
Envía ──────────────────────►  Aparece en columna "Nuevas"
                                        │
                                        ▼
                                Asigna docente (planta/externo)
                                        │
                                        ▼
                                Avanza a "En Experto"
                                (diseño de propuesta académica)
                                        │
                                        ▼
                                Avanza a "En Costeo"
                                Ingresa costo base + margen
                                (+ estampilla automática si aplica)
                                Ajusta valor ofertado si hay
                                negociación comercial
                                        │
                                        ▼
                                Marca "Entregada" ──────────►  Ve banner "lista para entregar"
                                                                        │
                                                                        ▼
                                                                Abre detalle, revisa valor
                                                                aprobado (solo lectura)
                                                                        │
                                                                        ▼
                                                                Clic "Enviar a cliente"
                                                                        │
                                                                        ▼
                                                                Ciclo cerrado ✅
```
