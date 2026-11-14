# Blueprint Maestro de Analítica de Negocio y Dashboard Administrativo
**Plataforma de Gestión de Solicitudes Comerciales y Consultoría — Universidad Icesi**  
**Versión:** 2.0 (Post-UAT & Alineación Estratégica con Dirección Comercial)  
**Fecha:** 2026-11-08  
**Audiencia:** Dirección de Consultoría y Educación Continua, Equipo de Grado (PDG II)

---

## 1. Contexto Estratégico y Propósito del Documento

Este documento constituye el **plano arquitectónico y conceptual definitivo** para la evolución del módulo de analítica directiva (Administrador) tras la sesión de Pruebas de Aceptación de Usuario (UAT) y el análisis de los reportes operativos de control comercial (FBIDCA / INNLAB) facilitados por la dirección (Rafa).

### El problema de negocio que este Blueprint resuelve:
Históricamente, la dirección comercial y financiera de la Universidad Icesi (Rafa y Lina) ha tenido que consolidar mensualmente hojas de cálculo de Excel masivas para responder a cuatro preguntas críticas de rectoría:
1. *¿Cuánto dinero hemos cotizado en el mercado frente a cuánto dinero efectivamente hemos cerrado/vendido?*
2. *¿Cómo va el cumplimiento frente a la meta presupuestal anual y mensual de la universidad y de cada vendedor?*
3. *¿Cuál es la estacionalidad de nuestras ventas a lo largo de los 12 meses del año y cómo nos comparamos frente al año anterior?*
4. *¿Qué facultades o nodos temáticos traccionan la mayor facturación y cuáles empresas aliadas son las más rentables y recurrentes?*

El objetivo de esta fase **no es saturar al usuario con gráficos innecesarios**, sino automatizar con elegancia, orden visual y precisión ejecutiva los mismos tableros de control que hoy se calculan de manera manual y fragmentada.

---

## 2. Decisiones de Alcance y Articulación con el Equipo

Para garantizar la estabilidad del proyecto y evitar invadir responsabilidades de otros integrantes del equipo, se establecen los siguientes límites estrictos:

```
                                  MAPA DE RESPONSABILIDADES
                                  
     ┌────────────────────────────────────────────────────────┐
     │           ÁREA COMERCIAL Y FÁBRICA ACADÉMICA           │
     │      (Gestionado por Tomás en `feat/product-meeting`)  │
     │  • Asistente de Radicación (Wizard) y reglas de NIT    │
     │  • Tablero Kanban del KAM y del Líder de Producto      │
     │  • Asignación docente y Costeo Financiero interno      │
     │  • Etiqueta Comercial (`commercialStatus` / ADR-0007)  │
     └───────────────────────────┬────────────────────────────┘
                                 │ Alimenta datos transaccionales
                                 ▼
     ┌────────────────────────────────────────────────────────┐
     │         NUESTRO MÓDULO: ANALÍTICA Y DIRECCIÓN          │
     │       (Trabajado en nuestra rama de Analytics)         │
     │  • Agregaciones Macro de Facturación y Tubería ($ COP) │
     │  • Tasa de Conversión (Win Rate Ofertado vs. Vendido)  │
     │  • Análisis Temporal: 12 meses del año y comparativa   │
     │  • Gestión Ágil de Metas Financieras (Lina / Finanzas) │
     │  • Desglose por Nodos Académicos y Líneas de Servicio  │
     │  • Ficha de Inteligencia 360° de Cuentas Empresariales │
     └────────────────────────────────────────────────────────┘
```

### Decisión A: Adopción del `commercialStatus` de Tomás (ADR-0007)
* **Por qué:** En el flujo operativo, una propuesta entregada al cliente permanece en estado `DELIVERED`. Sin embargo, para la dirección ejecutiva, una propuesta entregada puede estar en tres situaciones de negocio:
  1. **Ganada / Vendida:** Aprobada por el cliente (`APPROVED_WITHOUT_CONTRACT`, `APPROVED_WITH_CONTRACT` o `INVOICED`).
  2. **En Negociación:** Entregada formalmente, pero aún en revisión por parte de la empresa aliada.
  3. **Perdida / Rechazada:** El cliente declinó la oferta comercial (`REJECTED`).
* **Cómo lo resolvemos:** No alteramos la máquina de estados transaccional. La capa de analítica lee la columna `commercialStatus` creada por Tomás para separar de manera inmediata lo **Ofertado** de lo **Vendido Real**, permitiendo calcular el Win Rate financiero exacto.

### Decisión B: Delimitación de Facturación y Ejecución
* **Por qué:** Durante la reunión de UAT se mencionó qué ocurre después de que el cliente aprueba la propuesta (facturación y ejecución académica).
* **Definición de frontera:** La plataforma de grado concluye en el cierre de la venta comercial. Los procesos de emisión de factura en SAP/ERP y el control de asistencia o entrega de diplomas pertenecen a los sistemas corporativos post-venta de Icesi.

---

## 3. Arquitectura de Navegación y UI/UX del Administrador

Para evitar el antipatrón de saturación visual (*overkill* de métricas apiladas verticalmente en una sola página), la experiencia del Administrador se organiza en **5 submódulos especializados** (4 de inteligencia analítica estratégica y 1 de auditoría global), accesibles desde el menú lateral y desde una barra superior de navegación limpia:

```
  MENÚ LATERAL ADMIN (AppShell)
  ├── 📊 1. Resumen Ejecutivo (Visión Macro, Ventas Mensuales y Embudo)
  ├── 🎯 2. Rendimiento KAMs & Metas (Desempeño comercial, KPIs de cartera y metas de Lina)
  ├── 🧩 3. Nodos Académicos & Líneas (Rendimiento por facultades e interdisciplinariedad)
  ├── 🏢 4. Inteligencia 360° Empresas (Ficha de cuentas, recurrencia y valor de vida)
  └── 📋 5. Gestión de Solicitudes (Listado maestro de auditoría directiva)
```

---

## 4. Especificación Detallada de Pantallas y Racional de Negocio

### Submódulo 1: Resumen Ejecutivo Macro (`/admin/dashboard`)
* **Propósito de negocio:** Responder en 10 segundos al Rector y Vicerrectores la salud financiera y el pulso comercial de la consultoría y formación corporativa en el año fiscal.
* **Componentes y visualización:**
  1. **Selector de Corte Temporal:** Selector dinámico de Año (2025, 2026...) y selector de periodo (Todo el año o Q1–Q4).
  2. **Las 5 Tarjetas Macro de Alto Nivel (Balance Financiero y de Volumen):**
     - **Monto Vendido ($ COP) & Volumen (#):** Total de dinero cerrado y cantidad de propuestas ganadas (ej. *$2.421M COP en 64 propuestas aprobadas*).
     - **Monto Ofertado en Tubería ($ COP) & Volumen (#):** Dinero total y número de propuestas puestas en juego en el mercado (ej. *$18.801M COP en 374 propuestas*).
     - **Tasa de Conversión Real (Win Rate %):** Porcentaje dual: Win Rate en dinero (Monto Vendido / Ofertado) y Win Rate en volumen (Propuestas Vendidas / Ofertadas).
     - **Avance Presupuestal Anual (%):** Porcentaje de avance de la facturación frente al presupuesto anual fijado por Lina.
     - **Semáforo Temporal a la Fecha (Superávit / Déficit):** Indica si a la fecha del mes actual Icesi va por encima o por debajo de la meta acumulada esperada (ej. *"Superávit: +$114.9M COP por encima de lo esperado a Noviembre"*).
  3. **Gráfico Principal: Valores Cotizados vs. Vendidos Mes a Mes:**
     - *Visualización:* Diagrama de barras agrupadas de Enero a Diciembre (exactamente como lo tiene Rafa en el PDF 1).
     - *Racional:* Permite visualizar la estacionalidad del recaudo y detectar en qué meses se cotiza mucho pero se vende poco.
  4. **Gráfico Comparativo Interanual (Curva de Ventas YoY):**
     - *Visualización:* Gráfico de líneas superpuestas (Año actual vs. Año anterior, idéntico al PDF 2 de Rafa).
     - *Racional:* Informa de un vistazo si el año en curso va por encima o por debajo del ritmo de ventas del año previo.
  5. **Embudo de Conversión Comercial (Funnel de 5 Fases):**
     - *Visualización:* Barras proporcionales desde *Nueva Solicitud* hasta la fase final en `DELIVERED`, desglosando claramente en tres ramas:
       - **Ganadas / Aprobadas:** Con etiqueta comercial aprobada/facturada.
       - **En Negociación Activa:** Entregadas formalmente, aún sin respuesta del cliente.
       - **Perdidas / Rechazadas:** Con etiqueta comercial rechazada.

---

### Submódulo 2: Rendimiento Comercial & Metas de Venta (`/admin/kams`)
* **Propósito de negocio:** Evaluar la productividad comercial profunda de cada Key Account Manager (KAM), su contribución al recaudo global de la universidad y permitir que Lina (Finanzas) gestione los presupuestos sin fricción.
* **Componentes y visualización:**
  1. **Selector Temporal:** Filtro por Año y Trimestre para evaluar periodos fiscales específicos.
  2. **Tarjetas Resumen de Fuerza de Ventas (Top Performers):**
     - *KAM Líder en Ventas* (quién factura más dinero), *KAM con Mejor Win Rate* (quién es más efectivo cerrando) y *Ticket Promedio de la Universidad*.
  3. **Tabla Consolidada de 8 Indicadores por Asesor (Calcada del Reporte de Rafa):**
     - *Nombre del Ejecutivo Comercial* (con avatar e iniciales).
     - *Propuestas Gestionadas* (conteo total de oportunidades radicadas).
     - *Monto Ofertado ($ COP)* (capital total que el asesor puso en juego ante clientes).
     - *Monto Vendido ($ COP)* (dinero efectivamente cerrado y aprobado).
     - *Win Rate Personal (% Venta sobre lo Ofertado):* Efectividad individual de conversión.
     - *Participación en el Recaudo (% sobre lo Vendido Total del Centro):* Cuánto pesa este asesor en la facturación global de Icesi.
     - *Ticket Promedio ($ COP):* Tamaño medio de los contratos que cierra el asesor.
     - *Ciclo Promedio de Cierre (Días):* Agilidad y velocidad comercial individual.
     - *Barra de Avance Individual:* Cumplimiento frente a su cuota personal.
  4. **Gráfico de Cumplimiento: Vendido vs. Meta Individual:**
     - Gráfico comparativo de barras horizontales donde cada KAM tiene su barra de ventas reales frente a su cuota presupuestal fijada.
  5. **Drill-down / Evolución Mensual por Asesor:**
     - Selector para aislar a un KAM específico y ver su ritmo de ventas mes a mes (Enero a Diciembre), detectando baches de productividad en el año.
  6. **Gestor Ágil de Metas Financieras (Panel de Lina):**
     - *Racional de diseño:* En lugar de pantallas complejas con múltiples modales, se diseña una **grilla editable ultra-rápida**:
       - Campo 1: **Meta Anual Global del Centro** (en $ COP y en # de propuestas aprobadas, según UAT).
       - El sistema calcula automáticamente el promedio mensual base: $\text{Meta Anual} / 12$.
       - Selector de distribución:
         - **Opción A (Equitativa):** Divide la meta global en partes iguales entre los KAMs activos con un solo clic.
         - **Opción B (Diferenciada por KAM):** Permite a Lina ajustar el presupuesto individual por fila en una tabla editable en línea (reconociendo que KAMs Senior manejan cuentas más grandes que KAMs Junior).
       - Botón único de confirmación: *"Actualizar Metas Institucionales"*.

---

### Submódulo 3: Nodos Académicos, Líneas & Fábrica Académica (`/admin/nodos`)
* **Propósito de negocio:** Medir qué centros de conocimiento de la universidad y qué Líderes de Producto generan impacto real en el sector empresarial, evaluando la tracción de las facultades y los tiempos de respuesta.
* **Componentes y visualización:**
  1. **Ranking Financiero de Nodos Temáticos (Líneas de Capacidad):**
     - Listado de los 7 nodos (*Gestión de Innovación, IA+ Tech Digital, UX/UI, Gerencia de Proyectos, Trans Redes Valor, Prototipado, Ciberseguridad*).
     - Métricas por nodo: *Monto Ofertado*, *Monto Vendido*, *Win Rate del Nodo (%)* y *Participación % sobre la venta total del Centro* (calcado de la tabla de Rafa).
  2. **Tabla de Líderes de Producto (Responsables de Crear la Oferta):**
     - *Racional:* Idéntico a la tabla de Rafa en el PDF 1 (*Andrés Naranjo, Néstor Tobar, José Armando, etc.*) y la petición de la UAT (*"indicadores iguales para el líder de producto"*).
     - Métricas por Líder: *Propuestas Asignadas*, *Monto Total Ofertado ($)*, *Monto Vendido ($)*, y *Win Rate Académico (%)*.
  3. **Mix de Servicios por Categoría:**
     - Gráfico proporcional de barras/donas que desglosa el dinero según el tipo de oferta:
       - *Capacitación Corporativa*
       - *Consultoría Especializada*
       - *Mentoría Directiva*
       - *Proyectos Especiales*
  4. **Tiempos Promedio de Desarrollo por Nodo (Fábrica Académica):**
     - Medición de días calendario promedio desglosado por cada nodo temático (calcado del bloque de tiempos del PDF 1 de Rafa):
       - **Días en Diseño Técnico con el Experto (`IN_PROGRESS`):** Cuánto tarda el Líder de Producto y el profesor asignado en estructurar la solución técnica.
       - **Días en Costeo Financiero (`IN_COSTING`):** Cuánto tarda la elaboración de la matriz de viabilidad y margen.

---

### Submódulo 4: Inteligencia 360° de Empresas Aliadas (`/admin/empresas`)
* **Propósito de negocio:** Preparación ejecutiva en 1 minuto antes de comités directivos o reuniones con presidentes de compañías aliadas (Bancolombia, Nutresa, Sura, etc.) y auditoría de la cartera de clientes.
* **Componentes y visualización:**
  1. **Vista A: Directorio y Ranking Maestro de Cuentas Aliadas (Top Clientes):**
     - *Racional:* Resuelve el problema de *"¿a qué empresa debo mirar?"*. Tabla ordenada por volumen facturado (idéntica a la lista del PDF 1 de Rafa: *Alianza, Banco W, Chiper, TQ, Alcaldía, Fenavi, Bancóldex...*).
     - Columnas: *Razón Social*, *NIT*, *Propuestas Gestionadas*, *Monto Cotizado*, *Monto Vendido ($)*, *Tasa de Éxito en la Cuenta (%)*, y enlace de apertura a su Ficha 360°.
  2. **Vista B: Ficha de Inteligencia 360° Individual:**
     - **Selector Temporal:** Filtro de Año (`Histórico Completo | 2026 | 2025`) para evaluar la relación en un periodo específico.
     - **Tarjeta de Identidad Corporativa y Directorio:** Razón social, NIT con verificación Módulo 11, sector económico, código CIIU y contrapartes clave con teléfono directo y correo.
     - **Impacto Institucional y Social de la Cuenta:** *Total Facturado ($ COP)*, *Capital en Tubería*, *Horas de Intervención impartidas*, *Colaboradores Capacitados*, *Ticket Promedio por Contrato* y *Vigencia de Relación* (fecha de primera y última propuesta para monitorear fidelización y alertar riesgo de abandono).
     - **Mix de Portafolio de la Empresa:** Gráfico de donas con la distribución de compra de la empresa (*Capacitación vs. Consultoría*).
     - **Penetración por Nodo:** Presencia de las diferentes facultades de Icesi en esa cuenta.
     - **Línea de Tiempo Histórica Organizada por Año y Mes:** Muestra cada propuesta presentada a lo largo de los años con su estado (Aprobada, En negociación o Rechazada), monto y profesor asignado.

---

### Submódulo 5: Gestión y Auditoría Global de Solicitudes (`/admin/solicitudes`)
* **Propósito de negocio:** Brindar a la dirección un visor tabular maestro para auditar, supervisar y exportar cualquier propuesta del sistema sin depender de pedir informes a los KAMs.
* **Componentes y visualización:**
  1. **Buscador Global Instantáneo:** Búsqueda por texto (código oficial de propuesta, razón social del cliente o palabra clave del título).
  2. **Barra de Filtros Combinados:** Filtros por KAM asignado, por Nodo académico, por Estado de pipeline (`NEW`, `IN_PROGRESS`, etc.), por Etiqueta Comercial (`APPROVED`, `REJECTED`, etc.) y por Rango de fechas.
  3. **Alertas de Estancamiento y SLAs Directivos:**
     - Chips de advertencia visual en la tabla (ej. *Alerta de cuello de botella: más de 20 días en la misma fase*, o *Sin docente asignado por más de 5 días*).
  4. **Tabla Maestra Paginada de Auditoría:**
     - Columnas: *Código Oficial*, *Empresa*, *Título*, *KAM Creador*, *Líder Asignado*, *Nodo*, *Monto Ofertado*, *Estado Operativo*, *Etiqueta Comercial*, y *Días de Envejecimiento*.
  5. **Herramienta de Exportación a Excel / CSV:**
     - Botón directo para descargar la sábana de datos filtrada para informes de Rectoría y comités externos.
  6. **Acceso de Solo Lectura:** Permite al Administrador abrir cualquier solicitud para auditar su costeo o alcance técnico sin interferir en el trabajo transaccional del KAM.

---

## 5. Matriz de Fórmulas Matemáticas y Reglas de Negocio (Alineadas con los PDFs de Rafa)

Para garantizar consistencia absoluta entre la plataforma y los reportes de Rafa y Lina, el motor analítico utilizará las siguientes definiciones formales:

| Métrica | Fórmula / Lógica | Fuente de Datos en el Sistema |
|---|---|---|
| **Monto Cotizado (Ofertado)** | $\sum \text{grossValue}$ de propuestas con costeo avalado | `ProposalEconomics.grossValue` |
| **Monto Vendido (Cerrado)** | $\sum \text{grossValue}$ de propuestas en `DELIVERED` con `commercialStatus IN ('APPROVED_WITHOUT_CONTRACT', 'APPROVED_WITH_CONTRACT', 'INVOICED')` | `ProposalEconomics` + `Proposal.commercialStatus` |
| **Tasa de Conversión ($)** | $\frac{\text{Monto Vendido}}{\text{Monto Cotizado Total}} \times 100$ | Agregación de montos |
| **Tasa de Conversión (Propuestas)** | $\frac{\text{Número de Propuestas Vendidas}}{\text{Número de Propuestas Ofertadas}} \times 100$ | Conteo de propuestas |
| **Meta Mensual Esperada** | $\frac{\text{Meta Anual}}{12}$ | Tabla de metas institucionales |
| **Deberíamos Llevar a la Fecha** | $\text{Meta Mensual Esperada} \times \text{Mes Actual (1 a 12)}$ | Cálculo temporal |
| **Desviación de Meta** | $\text{Monto Vendido Acumulado} - \text{Deberíamos Llevar}$ | Positivo = Superávit / Negativo = Déficit |
| **Tiempo de Diseño Técnico** | Días calendario entre asignación docente y paso a costeo | `ProfessorAssignmentLog.changedAt` $\to$ cambio a `IN_COSTING` |
| **Tiempo Total de Cierre** | Días calendario desde radicación hasta entrega formal | `createdAt` $\to$ `clientSentDate` |

---

## 6. Plan de Trabajo Faseado (Prompt por Prompt con Pruebas y Cero Riesgo)

Para garantizar un desarrollo ordenado, sin sobrecarga de contexto ni riesgo de regresiones en los 1.816 tests existentes, el trabajo se ejecutará en **fases atómicas y verificables prompt por prompt**:

```
FASE 1: CONTRATO DE DATOS Y CONSUMO DE COMMERCIAL STATUS (Backend)
├── Consumir `commercialStatus` de Tomás para desglosar Vendido ($) vs. Ofertado ($) vs. Rechazado
├── Modelar en Prisma la entidad ligera `sales_targets` (Año, Mes, Meta Global, KAM opcional)
├── Endpoints de lectura analítica: `/api/v1/requests/analytics/monthly-trends` y `/sales-targets`
└── Tests unitarios y de integración de los nuevos endpoints (manteniendo >90% coverage)

FASE 2: ESTRUCTURA DE NAVEGACIÓN Y ENRUTAMIENTO (Frontend AppShell)
├── Ampliar el menú lateral (`AppShell.tsx`) con los 5 accesos del Administrador
├── Enrutamiento bajo Next.js App Router (`/admin/dashboard`, `/admin/kams`, etc.)
├── Preservar la experiencia visual existente sin romper las vistas de KAM ni Líder
└── Tests de navegación y permisos de rol (RBAC)

FASE 3: PANTALLA 1 - RESUMEN EJECUTIVO & TENDENCIAS MENSUALES
├── 4 KPIs Macro con avance presupuestal
├── Gráfico de barras mensual de Cotizado vs. Vendido (Ene a Dic)
├── Curva comparativa interanual (2025 vs. 2026) y Embudo de 5 fases refinado
└── Tests de componentes y pruebas visuales

FASE 4: PANTALLA 2 - RENDIMIENTO KAMS & GESTOR DE METAS DE LINA
├── Tabla consolidada profunda (Win Rate, participación en venta del centro, ticket promedio)
├── Gráfico de barras comparativo: Vendido vs. Meta por asesor
├── Gestor ágil de metas (Inline Grid editable para Lina con botón de reparto equitativo)
└── Tests de guardado de metas y visualización de cuotas

FASE 5: PANTALLA 3 - NODOS TEMÁTICOS & LÍNEAS DE SERVICIO
├── Ranking de los 7 centros temáticos con su aporte financiero ($)
├── Gráfico de mix de portafolio (Capacitación vs. Consultoría vs. Mentoría)
├── Indicadores de tiempos promedio en días (Diseño técnico y costeo)
└── Tests de agregación por nodo y categoría

FASE 6: PANTALLA 4 - FICHA 360° DE EMPRESA ENRIQUECIDA
├── Selector de empresa con filtro por año (Histórico vs. 2026)
├── Gráfico de distribución de servicios y línea de tiempo mensualizada
└── Tests de renderizado 360° y consistencia de datos

FASE 7: PANTALLA 5 - VISOR TABULAR DE AUDITORÍA Y GESTIÓN GLOBAL
├── Tabla maestra paginada de solicitudes con buscador y filtros combinables
├── Modo de inspección directiva de lectura
└── Pruebas de integración E2E, pruebas de humo finales y verificación en navegador
```

---

## 7. Conclusión y Valor para la Sustentación de PDG II

Al estructurar la analítica bajo este Blueprint:
1. **Se demuestra rigor metodológico:** No se inventan pantallas aisladas; se digitaliza y optimiza exactamente la herramienta de control financiero que la dirección ya utiliza en Excel.
2. **Se preserva la armonía del equipo:** No se altera el flujo operativo del KAM ni del Líder de Producto, integrándose limpiamente con el trabajo de Tomás.
3. **Se entrega una herramienta de nivel gerencial:** La universidad obtiene visibilidad en tiempo real de su tubería, cumplimiento de metas y comportamiento del mercado corporativo.
