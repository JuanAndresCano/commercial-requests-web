# Documentación del proyecto — Solicitudes Comerciales · Universidad Icesi

> **Punto de entrada.** Si eres un agente de IA (o una persona) que llega a este repositorio sin contexto previo, empieza aquí y sigue los enlaces en el orden sugerido.

> **Actualización (2026-09-16).** Este repositorio pasó a ser la base del **cliente web de
> producción** (`commercial-requests-web`), que se conectará a `commercial-requests-backend`.
> Lo que sigue describe el prototipo tal como se validó: las **reglas de negocio siguen
> vigentes**, pero la persistencia en `localStorage` y el login simulado se van a reemplazar.
> Reglas de código y de trabajo: [`AGENTS.md`](../AGENTS.md) y [`CONTRIBUTING.md`](../CONTRIBUTING.md).

> **Actualización (2026-10-09, cierre del UAT).** Varias reglas cambiaron por decisión del
> dueño del producto tras las pruebas con usuarios: el KAM no edita ni cancela con docente
> asignado; no ve el valor ofertado hasta que el Líder confirma "Enviar a KAM"; al crear, el
> líder es obligatorio y el nodo opcional; el centro y el CENCO son texto libre; la solicitud
> entregada lleva número oficial "CP/CT AAAA-NNNN"; los tableros se actualizan en vivo. La lista
> completa, con su motivo y las decisiones todavía abiertas, está en la tabla "Diferencias
> deliberadas" de [`PARIDAD-LOGICA-NEGOCIO.md`](../../commercial-requests-backend/workspace/docs/PARIDAD-LOGICA-NEGOCIO.md)
> (repositorio del backend). Donde un documento de esta carpeta contradiga esa tabla, **manda
> la tabla**; los puntos corregidos aquí están marcados con "Actualización 2026-10-09".

## ⚠️ Qué es (y qué NO es) esta documentación

Lo que sigue documenta **el prototipo de UX/UI** tal como se validó (React + TypeScript + Vite + Tailwind + shadcn/ui, con datos simulados y persistencia en `localStorage`; el prototipo era Vite, **hoy el cliente es Next.js 16 (App Router) usado como cascarón SPA**, ver ADR-0006 del backend; los nombres de archivo de estos documentos ya apuntan a `src/views` y `src/app`, pero las pantallas y reglas descritas son las del prototipo validado) — es la referencia de **reglas de negocio y experiencia validadas**, no un esquema del backend final.

**El backend real** (modelo de datos definitivo, autenticación institucional, API) vive en `commercial-requests-backend` (NestJS) — ver `AGENTS.md` para el enlace y las decisiones de arquitectura cruzadas entre los dos repos. Esta documentación no define esa arquitectura final — documenta la lógica de negocio y la experiencia tal como existen hoy en el prototipo, para que quien construya el backend real entienda:

1. Qué problema de negocio resuelve la herramienta.
2. Cómo se comportan hoy los roles clave, especialmente **KAM** y **Líder de Producto** (los dos roles prioritarios a mejorar).
3. Qué estructura de datos *implícita* usa el prototipo (para no perder reglas de negocio ya validadas al migrar a un modelo real).
4. Qué patrones visuales/de interacción ya están establecidos.
5. Qué partes del prototipo son placeholders rotos o deuda técnica, para no confundirlos con comportamiento intencional.

## El reto de producto

La aplicación se pondrá en producción en pocos días. El objetivo central de este prototipo es de **adopción**: que los usuarios institucionales (KAM y Líder de Producto, principalmente) *realmente la usen* porque es intuitiva y rápida. La meta de diseño es minimizar el número de pasos y la carga cognitiva para que cada rol llegue a su "resultado soñado" (crear una solicitud, costear una propuesta, entregarla) de la forma más directa posible.

## Mapa de la documentación

| Archivo | Contenido |
|---|---|
| [`01-negocio-y-dominio.md`](./01-negocio-y-dominio.md) | Qué es la Dirección de Extensión y Consultoría, el pipeline comercial de 4 etapas, tipos de servicio, nodos temáticos, glosario de términos del dominio. |
| [`02-roles-y-permisos.md`](./02-roles-y-permisos.md) | Los 4 roles del sistema, con foco profundo en **KAM** y **Líder de Producto**: objetivos, responsabilidades, qué pueden ver/hacer. |
| [`03-flujos-de-usuario.md`](./03-flujos-de-usuario.md) | Recorridos paso a paso (user journeys) de KAM y Líder de Producto a través de las pantallas reales, con las transiciones de estado del pipeline. |
| [`04-modelo-de-datos-logico.md`](./04-modelo-de-datos-logico.md) | Entidades, campos, enums y fórmulas de cálculo (costeo) tal como existen en el mock del prototipo — referencia de reglas de negocio, no un esquema de producción. |
| [`05-inventario-pantallas-componentes.md`](./05-inventario-pantallas-componentes.md) | Mapa ruta → pantalla → componentes → rol(es) que la usan, con ubicación de archivos en el código. |
| [`06-patrones-ui-y-marca.md`](./06-patrones-ui-y-marca.md) | Sistema visual: paleta de marca Icesi, tipografía, patrones de tarjetas/kanban/stepper/badges, tema claro/oscuro. |
| [`07-gaps-conocidos-y-deuda-tecnica.md`](./07-gaps-conocidos-y-deuda-tecnica.md) | Inventario de huecos funcionales, placeholders sin conectar y atajos de prototipo que **no deben replicarse en producción**. |
| [`08-preguntas-abiertas-negocio.md`](./08-preguntas-abiertas-negocio.md) | Bitácora de preguntas de negocio que necesitaban decisión de la Líder de Producto (Dianis) — la mayoría ya respondidas e implementadas; quedan unas pocas pendientes de una siguiente ronda. |
| [`09-guion-de-prueba-dianis.md`](./09-guion-de-prueba-dianis.md) | Guion corto, click a click, para que la Líder de Producto pruebe el prototipo de punta a punta y dé el aval para construir la versión real. |
| [`10-decisiones-pendientes-equipo.md`](./10-decisiones-pendientes-equipo.md) | Decisiones de gobernanza del repositorio (no de negocio) que deben resolverse entre Tomás y Juan Andrés antes de ejecutarse. |

## Cómo correr el prototipo localmente

```bash
cd university-connect
npm install
npm run dev
```

Al entrar, la pantalla de login (`/login`) permite elegir cualquiera de los 4 roles con un clic (no hay autenticación real, solo valida que el correo coincida con una cuenta de prueba) — ver [`02-roles-y-permisos.md`](./02-roles-y-permisos.md). También existe un selector de rol dentro de `AppShell` (dropdown de rol en la topbar) para cambiar de rol sin cerrar sesión; es una ayuda de prototipo, no una función de producto (ver gaps conocidos). El dropdown del avatar en la barra lateral es distinto: solo tiene "Restablecer datos de ejemplo" y "Cerrar sesión".
