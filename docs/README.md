# Documentación del proyecto — Solicitudes Comerciales · Universidad Icesi

> **Punto de entrada.** Si eres un agente de IA (o una persona) que llega a este repositorio sin contexto previo, empieza aquí y sigue los enlaces en el orden sugerido.

## ⚠️ Qué es (y qué NO es) este repositorio

Este repositorio (`university-connect`) es **un prototipo de UX/UI**, construido en React + TypeScript + Vite + Tailwind + shadcn/ui, con **datos simulados (mock) y persistencia en `localStorage`** — no hay backend real, ni base de datos, ni autenticación real.

Su único propósito es **explorar y validar la experiencia de usuario** (flujos, pantallas, jerarquía de información, interacciones) antes de construir la versión de producción.

**El desarrollo real** (modelo de datos definitivo, backend, autenticación institucional, API) **se está construyendo en un entorno aislado y separado**, con su propia especificación. Esta documentación **no define esa arquitectura final** — documenta la lógica de negocio y la experiencia tal como existen hoy en el prototipo, para que quien continúe el trabajo de UX/UI (o quien diseñe el backend final) entienda:

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

## Cómo correr el prototipo localmente

```bash
cd university-connect
npm install
npm run dev
```

Al entrar, la pantalla de login (`/login`) permite elegir cualquiera de los 4 roles con un clic (no hay autenticación real) — ver [`02-roles-y-permisos.md`](./02-roles-y-permisos.md). También existe un selector de rol dentro de `AppShell` (barra lateral) y dentro de `RequestDetail` para simular cambios de rol sin cerrar sesión; es una ayuda de prototipo, no una función de producto (ver gaps conocidos).
